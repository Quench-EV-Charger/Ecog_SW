import requests
import time
import websocket
import rel
import threading
import json
from collections import deque
import io
import gc  # For aggressive garbage collection to free memory
import tempfile  # For temp file handling in memory-safe log processing
import os  # For file operations
# Signal handling - compatible with Docker/Yocto
try:
    import signal
    SIGNAL_AVAILABLE = True
except ImportError:
    SIGNAL_AVAILABLE = False
    print("Warning: signal module not available, interrupt handling limited")

import sys  # For system exit

SERVER_URL = "https://quenchcms.com/"
# SERVER_URL = "http://103.176.134.139:8998/"

SleepTime = 60

# ============================================================================
# CONFIGURABLE LIMITS - Adjust these values based on your system requirements
# ============================================================================

# Maximum response size limit (in bytes) to prevent out-of-memory errors
# Default: 70MB - Reduce for systems with less memory
MAX_RESPONSE_SIZE = 70 * 1024 * 1024  # 70MB limit

# Maximum number of lines to read from state logs
# Default: 100,000 lines - Reduce for faster processing or limited memory
MAX_STATE_LOG_LINES = 200000  # Maximum lines for full state logs

# Maximum number of OCPP log lines to keep in memory
# Default: 60,000 lines - Only the last N lines are sent to server
MAX_OCPP_LOG_LINES = 200000  # Maximum lines kept for OCPP logs

# Maximum number of OCPP log lines to process before stopping
# Default: 500,000 lines - Prevents infinite processing of huge logs
MAX_OCPP_PROCESS_LINES = 500000  # Maximum lines to process from OCPP logs

# ============================================================================
# END OF CONFIGURABLE LIMITS
# ============================================================================

# CRITICAL FIX: Connection pooling to prevent resource leaks
# Using a session for connection reuse and proper resource management
session = requests.Session()
session.timeout = 30  # Add timeout to prevent hanging connections

# Docker/Yocto compatibility: Disable SSL warnings if needed
try:
    from requests.packages.urllib3.exceptions import InsecureRequestWarning
    requests.packages.urllib3.disable_warnings(InsecureRequestWarning)
except:
    pass  # Not critical if this fails

# Thread management variables for proper lifecycle
api_thread = None
thread_lock = threading.Lock()

# CRITICAL FIX: Global websocket instance for proper closure
current_ws = None
ws_lock = threading.Lock()

# Interrupt handling for graceful shutdown
interrupt_counter = 0
last_interrupt_time = 0
FORCE_EXIT_INTERRUPTS = 3  # Number of interrupts to force exit
INTERRUPT_WINDOW = 5  # Time window in seconds for multiple interrupts

def handle_interrupt(signum=None, frame=None):
    """Handle keyboard interrupt with graceful shutdown option
    Compatible with Docker/Yocto environments"""
    global interrupt_counter, last_interrupt_time
    
    current_time = time.time()
    
    # Reset counter if outside time window
    if current_time - last_interrupt_time > INTERRUPT_WINDOW:
        interrupt_counter = 0
    
    interrupt_counter += 1
    last_interrupt_time = current_time
    
    print(f"\n{time.ctime()} Interrupt received ({interrupt_counter}/{FORCE_EXIT_INTERRUPTS})")
    
    if interrupt_counter >= FORCE_EXIT_INTERRUPTS:
        print(f"{time.ctime()} Force exit triggered. Shutting down...")
        try:
            close_websocket()
        except:
            pass
        # Clean exit for Docker environments
        sys.stdout.flush()
        sys.stderr.flush()
        sys.exit(0)
    else:
        remaining = FORCE_EXIT_INTERRUPTS - interrupt_counter
        print(f"{time.ctime()} Press Ctrl+C {remaining} more time(s) within {INTERRUPT_WINDOW} seconds to force exit")
        print(f"{time.ctime()} Script will continue running...")
        sys.stdout.flush()  # Ensure output is visible in Docker

def GetDeviceID():
    global DeviceID
    global DataTosend
    # INFINITE RETRY: Keep trying forever for connection
    retry_count = 0
    
    while True:  # Run forever
        try:
            # CRITICAL FIX: Use session for connection pooling and add timeout
            print(f"{time.ctime()} [Script->Hardware] GET /id")
            DeviceID = session.get("http://10.20.27.50:3001/id", timeout=30)
            if DeviceID.status_code == 200:
                DeviceID = DeviceID.text
                DataTosend = {'Name': DeviceID}
                print(f"{time.ctime()} [Hardware->Script] Device ID: {DeviceID}")
                
                # Clear memory after getting device ID  
                gc.collect()
                print(f"    [Script] Memory cleared after GetDeviceID")
                return  # Success - exit function
            else:
                print(f"{time.ctime()} [Hardware->Script] Connection failed (attempt {retry_count + 1})...")
                time.sleep(SleepTime)
                retry_count += 1
        except KeyboardInterrupt:
            handle_interrupt()
            time.sleep(SleepTime)
            retry_count += 1
        except Exception as ex:
            retry_count += 1
            print(f"{time.ctime()} Exception at GetDeviceID (attempt {retry_count}) => {ex}")
            time.sleep(SleepTime)
            # Keep trying forever - no limit


def LogVersion():
    # INFINITE RETRY: Keep trying forever for connection
    retry_count = 0
    
    while True:  # Run forever
        try:
            DataTosend = {'Name': DeviceID, "Version": 'ador-intel-1-13'}
            # DataTosend = {'Name': DeviceID, "Version": 'ador-samsung-1-13'}
            print(f"{time.ctime()} [Script->Server] Logging version to CMS")
            print(f"{time.ctime()} [Script->Server] GET {SERVER_URL}api/charger/LogVersion")
            print(f"{time.ctime()} [Script->Server] Params: {DataTosend}")
            
            # CRITICAL FIX: Use session for connection pooling and add timeout
            response = session.get(SERVER_URL +
                                    "/api/charger/LogVersion", params=DataTosend, timeout=30)
            if response.status_code == 200:
                print(f"{time.ctime()} [Server->Script] Version logged successfully (200 OK)")
                print(f"{time.ctime()} [Server->Script] Response: {response.text}")
                
                # Clear memory after successful version logging
                response = None
                DataTosend = None
                gc.collect()
                print(f"    [Script] Memory cleared after LogVersion")
                return  # Success - exit function
            else:
                retry_count += 1
                print(f"{time.ctime()} [Server->Script] ERROR: Status={response.status_code} (attempt {retry_count})")
                print(f"{time.ctime()} [Server->Script] Response: {response.text}")
                time.sleep(SleepTime)
        except KeyboardInterrupt:
            handle_interrupt()
            time.sleep(SleepTime)
            retry_count += 1
        except Exception as ex:
            retry_count += 1
            print(f"{time.ctime()} Exception at LogVersion (attempt {retry_count}) => {ex}")
            time.sleep(SleepTime)
            # Keep trying forever - no limit


def GetGunStatus():
    try:
        print(f"{time.ctime()} [Script->Hardware] GET /state (Gun Status)")
        # CRITICAL FIX: Use session for connection pooling and add timeout
        response = session.get("http://10.20.27.50:3001/state", timeout=30).json()
        print(f"{time.ctime()} [Hardware->Script] State data: {str(response)[:200]}..." if len(str(response)) > 200 else f"{time.ctime()} [Hardware->Script] State data: {response}")
        
        if isinstance(response, list):
            Busy_A = response[0].get("busy", False)
            Evsestat_A = response[0].get("evsestat", -1)
            Pilot_A = response[0].get("pilot", -1)
            ErrorCode_A = response[0].get("curr_ses_error", 0)

            Busy_B = response[1].get("busy", False)
            Evsestat_B = response[1].get("evsestat", -1)
            Pilot_B = response[1].get("pilot", -1)
            ErrorCode_B = response[1].get("curr_ses_error", 0)
        else:
            Busy_A = response.get("busy", False)
            Evsestat_A = response.get("evsestat", -1)
            Pilot_A = response.get("pilot", -1)
            ErrorCode_A = response.get("curr_ses_error", 0)
            Busy_B = False
            Evsestat_B = -1
            Pilot_B = -1
            ErrorCode_B = 0

        data = {
            "Name": DeviceID,
            "Busy_A": Busy_A,
            "Evsestat_A": Evsestat_A,
            "Pilot_A": Pilot_A,
            "ErrorCode_A": ErrorCode_A,
            "Busy_B": Busy_B,
            "Evsestat_B": Evsestat_B,
            "Pilot_B": Pilot_B,
            "ErrorCode_B": ErrorCode_B
        }
        gun_status_json = json.dumps(data)
        print(f"{time.ctime()} [Script] Prepared Gun Status JSON: {gun_status_json}")
        return gun_status_json
    except requests.exceptions.RequestException as e:
        print(f"An error occurred while retrieving gun status: {e}")
        return None

def CallApi():
    # INFINITE RETRY: Keep trying forever for connection
    consecutive_failures = 0
    total_attempts = 0
    
    while True:  # Run forever
        try:
            total_attempts += 1
            headers = {'Content-Type': 'application/json'}
            gun_status = GetGunStatus()
            if gun_status is None:
                consecutive_failures += 1
                print(f"{time.ctime()} Gun status unavailable (failures: {consecutive_failures})")
                time.sleep(SleepTime)
                continue
            
            # Log polling attempt
            print(f"{time.ctime()} " + "="*80)
            print(f"{time.ctime()} " + "="*80)
            print(f"{time.ctime()} [Script->Server] POLLING ATTEMPT #{total_attempts}")
            print(f"{time.ctime()} [Script->Server] POST {SERVER_URL}api/charger/LiveFeeds")
            print(f"{time.ctime()} [Script->Server] Payload: {gun_status}")
            
            # CRITICAL FIX: Use session for connection pooling and add timeout
            response = session.post(
                SERVER_URL + "/api/charger/LiveFeeds", data=gun_status, headers=headers, timeout=30)

            if response.status_code != 200:
                consecutive_failures += 1
                print(f"{time.ctime()} [Server->Script] ERROR: Status={response.status_code} (failures: {consecutive_failures})")
                print(f"{time.ctime()} [Server->Script] Body: {response.text[:200]}..." if len(response.text) > 200 else f"{time.ctime()} [Server->Script] Body: {response.text}")
            else:
                # Reset failure counter on success
                if consecutive_failures > 0:
                    print(f"{time.ctime()} [Server->Script] Connection restored after {consecutive_failures} failures")
                consecutive_failures = 0
                print(f"{time.ctime()} [Server->Script] LiveFeeds OK (200)")
                print(f"{time.ctime()} [Server->Script] Body: {response.text[:200]}..." if len(response.text) > 200 else f"{time.ctime()} [Server->Script] Body: {response.text}")

            if response.status_code == 200 and len(response.text) > 5:
                # CRITICAL FIX: Add response size check to prevent OOM
                if len(response.text) > MAX_RESPONSE_SIZE:
                    print(f"{time.ctime()} Response too large, skipping: {len(response.text)} bytes")
                else:
                    print(f"{time.ctime()} [Server->Script] COMMAND RECEIVED:")
                    print(f"    [Server->Script] Raw: {response.text[:200]}..." if len(response.text) > 200 else f"    [Server->Script] Raw: {response.text}")
                    ReceivedData = json.loads(json.loads(response.text))
                    print(f"    [Script] Parsed: ExecutionID={ReceivedData.get('ExecutionID', 'N/A')}, API={ReceivedData.get('API', 'N/A')}, ApiTypeID={ReceivedData.get('ApiTypeID', 'N/A')}")
                    ExecuteRequestedAPI(ReceivedData)
                    
                    # Clear memory after command execution
                    ReceivedData = None
                    gc.collect()
                    print(f"    [Script] Memory cleared after command execution")
                    
            # Clear memory after each polling cycle
            response = None
            gun_status = None
            gc.collect()
            
            time.sleep(SleepTime)
            
        except KeyboardInterrupt:
            handle_interrupt()
            time.sleep(SleepTime)
        except Exception as ex:
            consecutive_failures += 1
            print(f"{time.ctime()} Exception at CallApi (failures: {consecutive_failures}) => {ex}")
            time.sleep(SleepTime)
            # Keep trying forever - no limit
# endregion

# region Helper

def validateJSON(jsonData):

    try:
        json.loads(jsonData)
    except ValueError as err:
        return False
    return True
# endregion

# region WebSocketListner

def close_websocket():
    """Properly close the current websocket connection
    Docker/Yocto safe implementation"""
    global current_ws
    with ws_lock:
        if current_ws:
            try:
                print(f"{time.ctime()} [Script] Closing existing WebSocket connection...")
                sys.stdout.flush()  # Ensure output in Docker
                current_ws.close()
            except Exception as e:
                print(f"{time.ctime()} Error closing websocket: {e}")
            finally:
                current_ws = None
                # Force garbage collection after closing
                try:
                    gc.collect()
                except:
                    pass  # GC might not always work in minimal environments

def on_message(ws, message):
    try:
        print(f"{time.ctime()} " + "="*80)
        print(f"{time.ctime()} [Hardware->Script] WEBSOCKET EVENT RECEIVED:")
        print(f"    [Hardware->Script] Event: {message[:200]}..." if len(message) > 200 else f"    [Hardware->Script] Event: {message}")
        
        EventData = {'id': DeviceID, 'ev': message}
        print(f"{time.ctime()} [Script->Server] Forwarding WebSocket event")
        print(f"    [Script->Server] POST {SERVER_URL}api/charger/LogEvent")
        print(f"    [Script->Server] Params: {EventData}")
        
        # CRITICAL FIX: Use session for connection pooling and add timeout
        response = session.post(
            SERVER_URL + "/api/charger/LogEvent", params=EventData, timeout=30)
        
        print(f"{time.ctime()} [Server->Script] LogEvent Response: Status={response.status_code}")
        print(f"    [Server->Script] Body: {response.text}")
        
        if response.status_code == 200:
            jResponse = json.loads(response.text)
            sessionID = int(jResponse["Message"])
            print(f"{time.ctime()} [Server->Script] Event logged, SessionID={sessionID}")

            data = json.loads(message)
            outletno = data['outlet']
            print(f"{time.ctime()} [Script] Processing state data for SessionID={sessionID}, Outlet={outletno}")
            CallStateAPI(sessionID)
            CallStateFull(sessionID, outletno)
            
            # Clear memory after processing
            data = None
            EventData = None
            response = None
            message = None
            gc.collect()
            print(f"    [Script] Memory cleared after LogEvent processing")
        else:
            print(
                f"{time.ctime()} [Server->Script] ERROR: LogEvent failed")
    except Exception as ex:
        print(f"{time.ctime()} Exception at on_message => {ex}")


def on_error(ws, error):
    print(f"{time.ctime()} [Hardware->Script] WebSocket ERROR: {error}")
    # CRITICAL FIX: Properly close websocket before reconnecting
    close_websocket()
    restart_main_loop()


def on_close(ws, close_status_code, close_msg):
    print(f"{time.ctime()} [Hardware->Script] WebSocket CLOSED: code={close_status_code}, msg={close_msg}")
    # CRITICAL FIX: Ensure websocket is marked as closed
    with ws_lock:
        global current_ws
        if current_ws == ws:
            current_ws = None
    restart_main_loop()


def CallStateAPI(sessionID):
    try:
        global DataTosend
        print(f"{time.ctime()} [Script->Hardware] Fetching state for SessionID={sessionID}")
        
        # CRITICAL FIX: Use session for connection pooling and add timeout
        print(f"    [Script->Hardware] GET http://10.20.27.50:3001/state")
        StateJson = session.get("http://10.20.27.50:3001/state", timeout=30)
        print(f"    [Hardware->Script] State: {StateJson.text[:200]}..." if len(StateJson.text) > 200 else f"    [Hardware->Script] State: {StateJson.text}")
        
        print(f"{time.ctime()} [Script->Server] Posting state data")
        print(f"    [Script->Server] POST {SERVER_URL}api/charger/PostStateData")
        print(f"    [Script->Server] Params: id={DeviceID}, SessionID={sessionID}")
        
        response = session.post(
            SERVER_URL + "/api/charger/PostStateData", 
            params={'id':  DeviceID, "SessionID": sessionID}, 
            json=StateJson.text, timeout=30)
        
        print(f"{time.ctime()} [Server->Script] PostStateData Response: Status={response.status_code}")
        print(f"    [Server->Script] Response: {response.text}")
        
        # Clear memory after sending
        StateJson = None
        response = None
        gc.collect()
        print(f"    [Script] Memory cleared after PostStateData")
    except Exception as ex:
        print(f"{time.ctime()} Exception at CallStateAPI =>{ex}")


def CallStateFull(sessionID, outletno):
    """Memory-optimized version using temp file to maintain server compatibility
    WITH ENCODING FIXES for cross-platform compatibility"""
    import tempfile
    import os
    import gc
    
    temp_file_path = None
    
    try:
        global DataTosend
        # CRITICAL FIX: Use session for connection pooling and add timeout
        url = f"http://10.20.27.50:3001/controllers/{outletno}/api/outlets/1/log/state/full"
        response = session.get(url, timeout=30, stream=True)
        
        if response.status_code == 200:
            # Check content length for warning
            content_length = response.headers.get('content-length')
            if content_length and int(content_length) > MAX_RESPONSE_SIZE:
                print(f"    [Script] Large state log detected ({int(content_length)//(1024*1024)}MB), using memory-safe streaming")
            
            # CRITICAL FIX: Use temp file to avoid holding entire log in memory
            # ENCODING FIX: Specify UTF-8 encoding for cross-platform compatibility
            with tempfile.NamedTemporaryFile(
                mode='w+', 
                delete=False, 
                prefix='state_log_',
                suffix='.tmp',
                encoding='utf-8'  # Fix for Windows encoding issues
            ) as temp_file:
                temp_file_path = temp_file.name
                line_count = 0
                
                # Stream response to temp file line by line with encoding handling
                try:
                    for line in response.iter_lines(decode_unicode=True):
                        if line:
                            # Ensure line is string, not bytes
                            if isinstance(line, bytes):
                                line = line.decode('utf-8', errors='replace')
                            temp_file.write(line + '\n')
                            line_count += 1
                            
                            # Periodic garbage collection during streaming
                            if line_count % 10000 == 0:
                                gc.collect()
                            
                            # Stop at configured line limit
                            if line_count >= MAX_STATE_LOG_LINES:
                                print(f"    [Script] Reached state log line limit ({MAX_STATE_LOG_LINES:,} lines)")
                                break
                except UnicodeDecodeError as e:
                    print(f"Warning: Unicode decode error, continuing with replacement: {e}")
                    # Continue processing with error replacement
                
                print(f"    [Script] State log: processed {line_count:,} lines from hardware")
            
            # Read from temp file and prepare payload
            # ENCODING FIX: Specify UTF-8 encoding when reading
            with open(temp_file_path, 'r', encoding='utf-8', errors='replace') as f:
                lines = [line.rstrip('\n') for line in f]
            
            # Send in original format - single POST as server expects
            url = SERVER_URL + "/api/charger/ExpertPostFullStateData"
            payload = {
                'id': DeviceID,
                'SessionID': sessionID,
                'data': lines
            }
            
            print(f"{time.ctime()} [Script->Server] Sending full state logs")
            print(f"    [Script->Server] POST {url}")
            print(f"    [Script->Server] Payload: id={DeviceID}, SessionID={sessionID}, data={len(lines)} lines")
            
            # Calculate data size for logging
            data_size_kb = len(json.dumps(payload)) // 1024
            
            # Send with extended timeout for large payloads
            response = session.post(url, json=payload, timeout=60)
            print(f"{time.ctime()} [Server->Script] ExpertPostFullStateData Response: Status={response.status_code}")
            print(f"    [Server->Script] Response: {response.text[:100]}..." if len(response.text) > 100 else f"    [Server->Script] Response: {response.text}")
            print(f"    [Script] State log sent: {len(lines)} lines, ~{data_size_kb}KB sent to server")
            
            # CRITICAL: Clear all references immediately after sending
            lines = None
            payload = None
            response = None
            
            # Force garbage collection to free memory
            gc.collect()
            print(f"    [Script] Memory cleared after ExpertPostFullStateData")
            
        else:
            print(f"Failed to retrieve full state log. Status code: {response.status_code}")
            
    except requests.exceptions.RequestException as ex:
        print(f"Request exception occurred: {ex}")
    except Exception as ex:
        print(f"An error occurred: {ex}")
    finally:
        # CRITICAL: Clean up temp file to prevent disk fill
        if temp_file_path and os.path.exists(temp_file_path):
            try:
                os.unlink(temp_file_path)
                print(f"    [Script] Cleaned up temp file: {temp_file_path}")
            except Exception as e:
                print(f"    [Script] Warning: Could not delete temp file {temp_file_path}: {e}")
        
        # Close response if still open
        if 'response' in locals():
            try:
                response.close()
            except:
                pass
        
        # Final garbage collection to ensure memory is freed
        gc.collect()

# region As Per Demand API Execution


def ExecuteRequestedAPI(RecivedData):
    print(f"{time.ctime()} [CMD] EXECUTING COMMAND from CMS:")
    print(f"    ExecutionID: {RecivedData.get('ExecutionID', 'N/A')}")
    print(f"    API Endpoint: {RecivedData.get('API', 'N/A')}")
    print(f"    API Type: {RecivedData.get('ApiTypeID', 'N/A')} (1=GET, 2=PUT, 3=POST, 4=DELETE)")
    print(f"    IsTextFile: {RecivedData.get('IsTextFile', False)}")
    print(f"    IsInputRequired: {RecivedData.get('IsInputRequired', False)}")
    
    Apiresponse = None
    if RecivedData["ExecutionID"] >= 1:
        # Check if this is a state log request
        api_path = RecivedData.get('API', '')
        is_state_log = 'log/state/full' in api_path or 'log/state' in api_path
        
        if RecivedData["IsTextFile"]==True:
            url = 'http://10.20.27.50:3001/'+RecivedData["API"]
            # CRITICAL FIX: Use session and stream large responses
            response = session.get(url, headers={'accept': 'application/json'}, timeout=30, stream=True)
            if response.status_code == 200:
                # CRITICAL FIX: Stream processing to avoid loading entire file into memory
                # Check content length first
                content_length = response.headers.get('content-length')
                if content_length and int(content_length) > MAX_RESPONSE_SIZE:
                    print(f"    [Script] OCPP log file too large ({int(content_length)//(1024*1024)}MB), processing first {MAX_OCPP_PROCESS_LINES:,} lines only")
                
                # Process line by line instead of loading all into memory
                lines_processed = 0
                last_60000 = deque(maxlen=MAX_OCPP_LOG_LINES)  # Only keep last N lines as configured
                
                try:
                    for line in response.iter_lines(decode_unicode=True):
                        if line is not None:
                            # ENCODING FIX: Ensure line is string, not bytes
                            if isinstance(line, bytes):
                                line = line.decode('utf-8', errors='replace')
                            last_60000.append(line)
                            lines_processed += 1
                            # Prevent excessive processing
                            if lines_processed >= MAX_OCPP_PROCESS_LINES:  # Configured limit
                                break
                except Exception as e:
                    print(f"Warning: Error processing line {lines_processed}: {e}")
                
                # Convert to list only once, avoiding multiple copies
                last_60000_list = list(last_60000)
                print(f"    [Script] OCPP log: processed {lines_processed:,} lines, kept last {len(last_60000_list):,} lines (max: {MAX_OCPP_LOG_LINES:,})")
            else:
                print(f"    [Script] Failed to fetch OCPP log file. Status code: {response.status_code}")
                last_60000_list = []
                
            # CRITICAL FIX: Avoid keeping multiple copies in memory
            ExecutionResponse = json.dumps("\n".join(str(line) for line in last_60000_list))
            # Clear the list to free memory immediately
            last_60000_list = None
            last_60000.clear()  # Clear the deque as well
            
            LogExecutionStatus = session.post(SERVER_URL + "/api/charger/UpdateExecutionStatus", params={
                'ExecutionID': RecivedData["ExecutionID"]}, json=ExecutionResponse, timeout=30)
            print(f"{time.ctime()} [OK] COMMAND RESPONSE SENT to CMS: Status={LogExecutionStatus.status_code}")
            print(f"    [Script] OCPP log sent: processed {lines_processed:,} lines, kept last {len(last_60000) if 'last_60000' in locals() else 0:,} lines, ~{len(ExecutionResponse)//1024}KB sent to server")
            
            # Clear response and force garbage collection
            ExecutionResponse = None
            gc.collect()
            print(f"    [Script] Memory cleared after sending logs")
            return ;   
        if RecivedData["IsInputRequired"] == False:
            if RecivedData["ApiTypeID"] == 1:
                print(f"{time.ctime()} [-->] SENDING GET Request to Hardware: http://10.20.27.50:3001/{RecivedData['API']}")
                # CRITICAL FIX: Use session for connection pooling and add timeout
                Apiresponse = session.get(
                    "http://10.20.27.50:3001/"+RecivedData["API"], timeout=30)
            elif RecivedData["ApiTypeID"] == 2:
                print(f"{time.ctime()} [-->] SENDING PUT Request to Hardware: http://10.20.27.50:3001/{RecivedData['API']}")
                Apiresponse = session.put(
                    "http://10.20.27.50:3001/"+RecivedData["API"], timeout=30)
            elif RecivedData["ApiTypeID"] == 3:
                print(f"{time.ctime()} [-->] SENDING POST Request to Hardware: http://10.20.27.50:3001/{RecivedData['API']}")
                Apiresponse = session.post(
                    "http://10.20.27.50:3001/"+RecivedData["API"], timeout=30)
            elif RecivedData["ApiTypeID"] == 4:
                print(f"{time.ctime()} [-->] SENDING DELETE Request to Hardware: http://10.20.27.50:3001/{RecivedData['API']}")
                Apiresponse = session.delete(
                    "http://10.20.27.50:3001/"+RecivedData["API"], timeout=30)

            # CRITICAL FIX: Add response size check to prevent OOM
            if Apiresponse and len(Apiresponse.text) > MAX_RESPONSE_SIZE:
                APIResult = f"Response too large ({len(Apiresponse.text)} bytes), truncated"
            elif len(Apiresponse.text) == 0:
                APIResult = "Response not available"
            else:
                APIResult = Apiresponse.text
                # Check if this is a state log response and add logging
                if is_state_log and APIResult:
                    # Count lines in the response
                    line_count = APIResult.count('\n') + 1
                    data_size_kb = len(APIResult) // 1024
                    print(f"    [Script] State log retrieved: {line_count:,} lines, ~{data_size_kb}KB from hardware")
        else:
            if RecivedData["InputIsJson"] == True:
                parsed_input = json.loads(RecivedData["Input"])
                if RecivedData["ApiTypeID"] == 1:
                    # CRITICAL FIX: Use session for connection pooling and add timeout
                    Apiresponse = session.get(
                        "http://10.20.27.50:3001/"+RecivedData["API"], parsed_input, timeout=30)
                elif RecivedData["ApiTypeID"] == 2:
                    Apiresponse = session.put(
                        "http://10.20.27.50:3001/"+RecivedData["API"], parsed_input, timeout=30)
                elif RecivedData["ApiTypeID"] == 3:
                    Apiresponse = session.post(
                        "http://10.20.27.50:3001/"+RecivedData["API"],json= parsed_input, timeout=30)
                    
                elif RecivedData["ApiTypeID"] == 4:
                    Apiresponse = session.delete(
                        "http://10.20.27.50:3001/"+RecivedData["API"], parsed_input, timeout=30)

                # CRITICAL FIX: Add response size check to prevent OOM
                if Apiresponse and len(Apiresponse.text) > MAX_RESPONSE_SIZE:
                    APIResult = f"Response too large ({len(Apiresponse.text)} bytes), truncated"
                elif len(Apiresponse.text) == 0:
                    APIResult = "Response not available"
                else:
                    APIResult = Apiresponse.text
                    # Check if this is a state log response and add logging
                    if is_state_log and APIResult:
                        # Count lines in the response
                        line_count = APIResult.count('\n') + 1
                        data_size_kb = len(APIResult) // 1024
                        print(f"    [Script] State log retrieved: {line_count:,} lines, ~{data_size_kb}KB from hardware")
            else:
                datanew =RecivedData["Data"]
                apinew =RecivedData["API"]

                if datanew is None:
                    headers = {
                    'accept': 'application/javascript',
                    'Content-Type': 'application/javascript'
                            }
                    if RecivedData["ApiTypeID"] == 1:
                        # CRITICAL FIX: Use session for connection pooling and add timeout
                        Apiresponse = session.get(
                            "http://10.20.27.50:3001/"+RecivedData["API"],headers=headers, timeout=30)
                    elif RecivedData["ApiTypeID"] == 2:
                        Apiresponse = session.put(
                            "http://10.20.27.50:3001/"+RecivedData["API"],headers=headers, timeout=30)
                    elif RecivedData["ApiTypeID"] == 3:
                        Apiresponse = session.post(
                            "http://10.20.27.50:3001/"+apinew,headers=headers, timeout=30)
                    elif RecivedData["ApiTypeID"] == 4:
                        Apiresponse = session.delete(
                            "http://10.20.27.50:3001/"+RecivedData["API"],headers=headers, timeout=30)

                    # CRITICAL FIX: Add response size check to prevent OOM
                    if Apiresponse and len(Apiresponse.text) > MAX_RESPONSE_SIZE:
                        APIResult = f"Response too large ({len(Apiresponse.text)} bytes), truncated"
                    elif len(Apiresponse.text) == 0:
                        APIResult = "Response not available"
                    else:
                        APIResult = Apiresponse.text
                        # Check if this is a state log response and add logging
                        if is_state_log and APIResult:
                            # Count lines in the response
                            line_count = APIResult.count('\n') + 1
                            data_size_kb = len(APIResult) // 1024
                            print(f"    [Script] State log retrieved: {line_count:,} lines, ~{data_size_kb}KB from hardware")
                else:                
                    headers = {
                        'accept': 'application/javascript',
                        'Content-Type': 'application/javascript'
                                }
                    if RecivedData["ApiTypeID"] == 1:
                        # CRITICAL FIX: Use session for connection pooling and add timeout
                        Apiresponse = session.get(
                            "http://10.20.27.50:3001/"+RecivedData["API"],RecivedData["Data"],headers=headers, timeout=30)
                    elif RecivedData["ApiTypeID"] == 2:
                         Apiresponse = session.put(
                            "http://10.20.27.50:3001/"+RecivedData["API"],headers=headers,data=RecivedData["Data"], timeout=30)
                    elif RecivedData["ApiTypeID"] == 3:
                        Apiresponse = session.post(
                            "http://10.20.27.50:3001/"+apinew,headers=headers,data=datanew, timeout=30)
                    elif RecivedData["ApiTypeID"] == 4:
                        Apiresponse = session.delete(
                            "http://10.20.27.50:3001/"+RecivedData["API"],RecivedData["Data"],headers=headers, timeout=30)

                    # CRITICAL FIX: Add response size check to prevent OOM
                    if Apiresponse and len(Apiresponse.text) > MAX_RESPONSE_SIZE:
                        APIResult = f"Response too large ({len(Apiresponse.text)} bytes), truncated"
                    elif len(Apiresponse.text) == 0:
                        APIResult = "Response not available"
                    else:
                        APIResult = Apiresponse.text
                        # Check if this is a state log response and add logging
                        if is_state_log and APIResult:
                            # Count lines in the response
                            line_count = APIResult.count('\n') + 1
                            data_size_kb = len(APIResult) // 1024
                            print(f"    [Script] State log retrieved: {line_count:,} lines, ~{data_size_kb}KB from hardware")
        

        print(f"{time.ctime()} [<--] HARDWARE RESPONSE: {APIResult[:200]}..." if len(APIResult) > 200 else f"{time.ctime()} [<--] HARDWARE RESPONSE: {APIResult}")
        
        JSONStatus = validateJSON(APIResult)
        if not JSONStatus:
            ExecutionResponse = json.dumps(APIResult)
            # Calculate size for logging
            response_size_kb = len(ExecutionResponse) // 1024
            LogExecutionStatus = session.post(SERVER_URL + "/api/charger/UpdateExecutionStatus", params={
                'ExecutionID': RecivedData["ExecutionID"]}, json=ExecutionResponse, timeout=30)
        else:
            response_size_kb = len(APIResult) // 1024
            LogExecutionStatus = session.post(SERVER_URL+"/api/charger/UpdateExecutionStatus", params={
                'ExecutionID': RecivedData["ExecutionID"]}, json=APIResult, timeout=30)
        
        print(f"{time.ctime()} [Server->Script] UpdateExecutionStatus: Status={LogExecutionStatus.status_code}")
        print(f"    [Server->Script] Response: {LogExecutionStatus.text[:100]}..." if len(LogExecutionStatus.text) > 100 else f"    [Server->Script] Response: {LogExecutionStatus.text}")
        
        # Add logging for state logs sent through command execution
        if is_state_log and 'APIResult' in locals():
            line_count = APIResult.count('\n') + 1 if APIResult else 0
            print(f"    [Script] State log sent via command: {line_count:,} lines, ~{response_size_kb}KB sent to server")
        
        # Clear all command execution memory
        APIResult = None
        Apiresponse = None
        ExecutionResponse = None
        LogExecutionStatus = None
        RecivedData = None
        gc.collect()
        print(f"    [Script] Memory cleared after UpdateExecutionStatus")
        print("-" * 80)
# endregion

# CRITICAL FIX: Thread lifecycle management to make threads restartable
def start_api_thread():
    global api_thread
    with thread_lock:
        if api_thread is None or not api_thread.is_alive():
            api_thread = threading.Thread(target=CallApi, args=())
            api_thread.daemon = True  # Make it a daemon thread for proper cleanup
            api_thread.start()
            print(f"{time.ctime()} [Script] Started API polling thread")

def restart_main_loop():
    """
    CRITICAL FIX: Restart mechanism that doesn't use recursion
    """
    print(f"{time.ctime()} [Script] Scheduling main loop restart...")
    
    # CRITICAL FIX: Ensure old websocket is closed before restart
    close_websocket()
    
    # Use a timer to restart after a delay, avoiding recursion
    restart_timer = threading.Timer(5.0, main_loop)
    restart_timer.daemon = True
    restart_timer.start()

def main_loop():
    # INFINITE RETRY: Keep trying forever - no retry limit
    retry_count = 0
    global current_ws
    
    while True:  # Run forever
        try:
            retry_count += 1
            print(f"{time.ctime()} main_loop Called (attempt {retry_count})")
            
            # CRITICAL FIX: Ensure any existing websocket is closed
            close_websocket()
            
            # Keep trying to get device ID forever
            GetDeviceID()
            
            # CRITICAL FIX: Proper thread lifecycle management
            start_api_thread()
            
            # Keep trying to log version forever
            LogVersion()

            websocket.enableTrace(False)
            
            # CRITICAL FIX: Store websocket instance globally for proper management
            with ws_lock:
                current_ws = websocket.WebSocketApp(
                    "ws://10.20.27.50:3001/events/stream",
                    on_message=on_message,
                    on_close=on_close,
                    on_error=on_error
                )
                ws = current_ws
            
            print(f"{time.ctime()} [Script->Hardware] Connecting WebSocket to ws://10.20.27.50:3001/events/stream")
            sys.stdout.flush()  # Ensure output in Docker
            
            # Docker/Yocto compatibility: Handle rel dispatcher carefully
            try:
                # Add on_open handler to track connection status
                def on_open(ws):
                    print(f"{time.ctime()} [Hardware->Script] WebSocket CONNECTED successfully")
                
                ws.on_open = on_open
                
                ws.run_forever(dispatcher=rel, reconnect=5)
                # Only set signal if available (may not work in some containers)
                if SIGNAL_AVAILABLE:
                    rel.signal(2, rel.abort)  # Keyboard Interrupt
                rel.dispatch()
            except Exception as e:
                print(f"{time.ctime()} [Script] WebSocket dispatcher error: {e}")
                # Fall back to simple run_forever without rel if needed
                ws.run_forever(reconnect=5)
            
            # If we reach here, websocket connection ended
            print(f"{time.ctime()} [Hardware->Script] WebSocket connection ended, restarting in {SleepTime} seconds...")
            
            # CRITICAL FIX: Ensure websocket is closed and cleaned up
            close_websocket()
            
            time.sleep(SleepTime)

        except KeyboardInterrupt:
            handle_interrupt()
            close_websocket()
            time.sleep(5)
        except Exception as ex:
            print(f"{time.ctime()} Exception at main_loop (attempt {retry_count}) => {ex}")
            print(f"{time.ctime()} Retrying in {SleepTime} seconds...")
            
            # CRITICAL FIX: Ensure websocket is closed on exception
            close_websocket()
            
            time.sleep(SleepTime)
            # Keep trying forever - no limit


if __name__ == "__main__":
    # Detect if running in Docker/container environment
    is_docker = os.path.exists('/.dockerenv') or os.path.exists('/run/.containerenv')
    
    # Set up signal handler for graceful shutdown (if available)
    if SIGNAL_AVAILABLE:
        try:
            signal.signal(signal.SIGINT, handle_interrupt)
            # Docker/Yocto specific: handle SIGTERM for container shutdown
            signal.signal(signal.SIGTERM, handle_interrupt)
        except Exception as e:
            print(f"Warning: Could not set signal handlers: {e}")
    
    print(f"{time.ctime()} [Script] CMS NOC Integration Starting - Infinite Retry Mode")
    print(f"Configuration:")
    print(f"  - Server URL: {SERVER_URL}")
    print(f"  - Retry Interval: {SleepTime} seconds")
    print(f"  - Max Response Size: {MAX_RESPONSE_SIZE / (1024*1024)}MB")
    print(f"  - Max State Log Lines: {MAX_STATE_LOG_LINES:,}")
    print(f"  - Max OCPP Log Lines (kept): {MAX_OCPP_LOG_LINES:,}")
    print(f"  - Max OCPP Log Lines (process): {MAX_OCPP_PROCESS_LINES:,}")
    print(f"  - Retry Mode: INFINITE (will never give up)")
    print(f"  - WebSocket Management: FIXED (proper closure before reconnection)")
    print(f"  - Encoding: UTF-8 (cross-platform compatible)")
    print(f"  - Memory Management: Aggressive clearing after each server transmission")
    print(f"  - Environment: {'Docker/Container' if is_docker else 'Native'}")
    if SIGNAL_AVAILABLE:
        print(f"  - Graceful Shutdown: Press Ctrl+C {FORCE_EXIT_INTERRUPTS} times within {INTERRUPT_WINDOW}s to exit")
    print("-" * 50)
    sys.stdout.flush()  # Ensure output is visible in Docker
    
    try:
        main_loop()
    except KeyboardInterrupt:
        handle_interrupt()
        main_loop()  # Continue running after interrupt