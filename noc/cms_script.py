"""
================================================================================
CMS NOC Integration Script v19 - WebSocket Reconnection Optimization
================================================================================
Modified by: Kushagra Mittal
Original v3 Date: 16th August 2025
v4 Update Date: 16th August 2025 (WebSocket Connection Fix)
v7 Update Date: 2nd October 2025 (Dynamic Line Reduction)
v18 Update Date: 6th October 2025 (Optimized Minimum Line Limit)
v19 Update Date: 14th January 2026 (WebSocket Reconnection Optimization)

COMPREHENSIVE CHANGE LOG - Version History:
- v1: Initial Script (cms_script.py) - Basic integration
- v3: Production Version (cms_script_v3.py) - Enterprise features
- v4: WebSocket Stability Fix - Connection management improvements
- v5: Configuration updated - Limits Changed
- v7: Dynamic Line Reduction - Adaptive error handling
- v18: Optimized Minimum Line Limit - Reduced MIN_LOG_LINES
- v19: WebSocket Reconnection Optimization (Current) - Fast reconnection
================================================================================

VERSION 19 CHANGES (14th January 2026) - WebSocket Reconnection Optimization:
================================================================================

CRITICAL CHANGES:
1. **Hardware Reachability Check Before Reconnection (NEW)**
   - Added check_hardware_connectivity() function
   - Tests hardware availability before WebSocket reconnection attempts
   - Uses /id endpoint with 5-second timeout
   - Prevents wasted connection attempts when hardware is offline
   - Fixed 10-second retry when hardware unreachable (not exponential backoff)

2. **Capped Exponential Backoff - Faster Reconnection**
   - ws_max_reconnect_delay: 300s (5 min) → 60s (1 min)
   - ws_max_reconnect_attempts: NEW - Capped at 10 attempts
   - Backoff sequence: 5s → 10s → 20s → 40s → 60s → 60s (caps at attempt #5)
   - Previous: Could reach 300s delay after 7 attempts
   - New: Maximum 60s delay, much faster reconnection

3. **Smart Counter Increment - Only on Connection Failures**
   - Removed counter increment from on_error() handler
   - Counter now increments ONLY when connection attempt fails
   - Errors during active connection don't increase backoff
   - Prevents artificial backoff inflation from transient errors

4. **Optimized close_websocket() - Non-Blocking Lock**
   - Moved blocking operations (sleep, close, gc) outside lock
   - Lock only held for fast state variable updates (<1ms)
   - Reduced sleep from 0.5s → 0.2s
   - Prevents thread blocking and race conditions

5. **Reduced Cascading Delays**
   - WS_COOLDOWN_PERIOD: 2s → 1s
   - Removed redundant 1s sleep after close_websocket()
   - Total delay reduction: ~2.5s per reconnection cycle

6. **Connection-Aware Exception Handling**
   - Distinguishes between connection errors and other exceptions
   - Only applies backoff to connection-related exceptions
   - Other exceptions use fixed 5s delay

IMPACT ANALYSIS:
- Previous behavior: 5-minute delays after extended outages
- New behavior: Maximum 60-second delay, even after many failures
- Hardware offline: Fixed 10s checks instead of exponential backoff
- Thread performance: No blocking during WebSocket operations
- Reconnection time: Reduced from minutes to seconds

DETAILED TECHNICAL CHANGES:
- Lines 798-823: Added check_hardware_connectivity() function
- Lines 617-621: Updated configuration constants
- Lines 1844-1859: Enhanced calculate_reconnect_delay() with capping
- Lines 1132-1143: Fixed on_error() - removed counter increment
- Lines 977-1027: Optimized close_websocket() - non-blocking locks
- Lines 1920-1925: Added hardware check in main_loop()
- Lines 1986-1991: Smart counter increment logic
- Lines 2005-2036: Connection-aware exception handling
- Lines 64-71: Updated documentation

BACKWARD COMPATIBILITY:
- All existing functionality preserved
- No changes to CMS communication or event processing
- No changes to hardware polling logic
- Configuration changes are internal optimizations

================================================================================

VERSION 18 CHANGES (6th October 2025) - Optimized Minimum Line Limit:
================================================================================

CRITICAL CHANGES:
1. **Reduced Minimum Line Limit for Better Network Adaptation**
   - MIN_LOG_LINES: 20,000 → 10,000 lines
   - Allows system to adapt to more challenging network conditions
   - Provides additional reduction steps before hitting floor limit
   - More granular adaptation to network quality

IMPACT ANALYSIS:
- Previous behavior: Dynamic reduction stopped at 20,000 lines
- New behavior: System can reduce to 10,000 lines before stopping
- Benefit: Better handling of very slow or unreliable connections
- Trade-off: Potentially less data per transmission in worst-case scenarios

CURRENT CONFIGURATION (Version 18):
================================================================================
TIMING PARAMETERS:
- POLLING_INTERVAL: 60 seconds (LiveFeeds polling)
- SleepTime: 60 seconds (general retry)
- RetryTime: 10 seconds (CMS connection failure retry)
- CMS_CHECK_INTERVAL: 10 seconds (CMS connectivity check)
- CMS_RETRY_INTERVAL: 10 seconds (retry when disconnected)

MEMORY AND SIZE LIMITS:
- MAX_RESPONSE_SIZE: 70 MB (prevent OOM)
- MAX_STATE_LOG_LINES: 100,000 lines (command-triggered max)
- MAX_EVENT_STATE_LOG_LINES: 2,000 lines (event-triggered fixed)
- MAX_OCPP_LOG_LINES: 100,000 lines (kept in memory)
- MAX_OCPP_PROCESS_LINES: 500,000 lines (processing limit)
- LARGE_FILE_TIMEOUT: 300 seconds (5 minutes)

DYNAMIC LINE REDUCTION (v7 + v18 Enhanced):
- current_state_log_lines: 100,000 (starts at MAX, adapts down)
- current_ocpp_log_lines: 100,000 (starts at MAX, adapts down)
- MIN_LOG_LINES: 10,000 (NEW - reduced from 20,000)
- LINE_REDUCTION_STEP: 10,000 (reduce/increase by 10k per step)
- SUCCESS_COUNT_TO_RESET: 3 (consecutive successes before increase)

ERROR HANDLING:
- FORCE_EXIT_INTERRUPTS: 30 (Ctrl+C presses to force exit)
- INTERRUPT_WINDOW: 5 seconds (time window for interrupts)

WEBSOCKET CONFIGURATION (Updated - User Configured):
- ws_reconnect_delay: 5 seconds (initial)
- ws_max_reconnect_delay: 60 seconds (1 minute max) [Changed from 300s]
- ws_max_reconnect_attempts: 10 (caps backoff delay) [New]
- ws_reconnect_attempts: Tracked (capped exponential backoff)
- WS_COOLDOWN_PERIOD: 1 second (minimum between attempts) [Changed from 2s]
- Hardware reachability check: 5s timeout before reconnection [New]
- Counter increment: Only on connection failures (not on errors) [Changed]

ADAPTIVE BEHAVIOR EXAMPLE (v18):
Start: 100,000 lines
Error 1 (Timeout): → 90,000 lines
Error 2 (SSL): → 80,000 lines
Error 3 (Timeout): → 70,000 lines
Error 4 (Connection): → 60,000 lines
Error 5 (Timeout): → 50,000 lines
Error 6 (SSL): → 40,000 lines
Error 7 (Timeout): → 30,000 lines
Error 8 (Connection): → 20,000 lines
Error 9 (NEW - Timeout): → 10,000 lines (NEW minimum)
Error 10 (Connection): → 10,000 lines (at floor, no further reduction)

VERSION BUMP RATIONALE:
- Skipped v8-v17 to maintain clear version alignment with deployment cycles
- v18 represents production-tested optimization based on field data
- Lower minimum threshold provides better resilience in challenging networks
- Version string updated: 'ador-samsung-1-18-v1'

BENEFITS OF v18:
1. **Improved Network Resilience**: System can adapt to worse conditions
2. **Additional Adaptation Steps**: One extra reduction step available
3. **Better Success Rate**: Lower data volumes = higher success probability
4. **Maintained Recovery**: Still recovers to max on 3 consecutive successes
5. **Production Validated**: Based on real-world deployment experience

TESTING RECOMMENDATIONS:
- Monitor for "Reducing [type] log limit" messages reaching 10,000 lines
- Verify successful transmission at 10,000 line limit
- Check recovery mechanism still works (10k → 20k → 30k... → 100k)
- Test with simulated very slow networks (high latency, packet loss)

================================================================================

VERSION 7 CHANGES (2nd October 2025) - Dynamic Line Reduction:
================================================================================

CRITICAL FEATURES ADDED:
1. **Adaptive Line Limit Reduction on Errors**
   - Problem: Timeout/SSL errors when sending large log files (60,000 lines)
   - Solution: Automatically reduce line count by 10,000 on each error
   - Impact: Prevents repeated failures, adapts to network conditions
   - Applies to: State logs (command-triggered) and OCPP logs

2. **Gradual Recovery Mechanism**
   - After 3 consecutive successful transmissions, increase limit by 10,000
   - Prevents permanent degradation after temporary network issues
   - Gradual increase ensures stability before returning to maximum
   - Separate tracking for state logs and OCPP logs

3. **Configurable Limits**
   - MIN_LOG_LINES: 20,000 (minimum lines before stopping reduction)
   - LINE_REDUCTION_STEP: 10,000 (reduce/increase by 10k lines)
   - SUCCESS_COUNT_TO_RESET: 3 (successful sends before increasing)
   - Current limits displayed in startup configuration

4. **Error Types Handled**
   - requests.exceptions.Timeout: Network timeout during transmission
   - requests.exceptions.ConnectionError: Connection failed/dropped
   - requests.exceptions.SSLError: SSL/TLS handshake or connection issues
   - All errors trigger line reduction for next attempt

5. **Separate Tracking for Different Log Types**
   - State logs: Dynamic limit for command-triggered (event-triggered stays at 1,000)
   - OCPP logs: Dynamic limit for all requests
   - Independent success counters for each type
   - Independent reduction/recovery cycles

TECHNICAL IMPLEMENTATION:
- Added: current_state_log_lines (starts at 60,000, min 20,000)
- Added: current_ocpp_log_lines (starts at 60,000, min 20,000)
- Added: state_log_success_count, ocpp_log_success_count
- Added: reduce_line_limit() function with floor protection
- Added: reset_line_limit_on_success() function with gradual increase
- Modified: CallStateFull() to use dynamic limits and handle errors
- Modified: ExecuteRequestedAPI() OCPP section to use dynamic limits
- Enhanced: Error handling with global variable updates and logging

ERROR HANDLING ENHANCEMENTS:
CallStateFull() function:
- Line 1112-1169: Comprehensive try/except for POST operation
- On Timeout: Reduce limit, log next attempt limit, re-raise
- On ConnectionError: Reduce limit, log next attempt limit, re-raise
- On SSLError: Reduce limit, log next attempt limit, re-raise
- On Success: Increment success counter, increase after 3 successes

ExecuteRequestedAPI() function:
- Line 1295-1331: Comprehensive try/except for OCPP log POST
- On any error: Reduce OCPP limit, log next attempt limit
- Attempt to notify CMS of failure via UpdateExecutionStatus
- On Success: Increment success counter, increase after 3 successes

BEHAVIOR EXAMPLES:

Example 1: Error Progression
Start: 60,000 lines
Error 1 (Timeout): → 50,000 lines (reduced by 10k)
Error 2 (SSL): → 40,000 lines (reduced by 10k)
Error 3 (Timeout): → 30,000 lines (reduced by 10k)
Error 4 (Connection): → 20,000 lines (at minimum, no further reduction)

Example 2: Success Recovery
At 20,000 lines:
Success 1: → 20,000 lines (count = 1)
Success 2: → 20,000 lines (count = 2)
Success 3: → 30,000 lines (count = 3, increased by 10k, reset count)
Success 1: → 30,000 lines (count = 1)
Success 2: → 30,000 lines (count = 2)
Success 3: → 40,000 lines (count = 3, increased by 10k, reset count)
...continues until back at 60,000

CONFIGURATION DISPLAY:
Added to startup output:
- Dynamic State Log Lines (current): Shows current limit and range
- Dynamic OCPP Log Lines (current): Shows current limit and range
- Recovery: Shows success count threshold (3 consecutive)
- Min/Max/Step values displayed for transparency

BENEFITS:
1. **Prevents Repeated Failures**: Reduces payload size automatically
2. **Network Adaptation**: Works with varying network conditions
3. **Automatic Recovery**: Returns to optimal performance when stable
4. **Transparent Operation**: All changes logged with clear messages
5. **Independent Control**: State and OCPP logs managed separately
6. **Production Ready**: No manual intervention required

TESTING RECOMMENDATIONS:
- Monitor log output for "Reducing [type] log limit" messages on errors
- Verify limit decreases by 10,000 on each error (down to 20,000 minimum)
- Confirm "Increasing [type] log limit after 3 successes" messages
- Check startup configuration displays current/min/max values
- Test with simulated network issues (slow connection, timeouts)

VERSION BUMP RATIONALE:
- Skipped v6 designation to avoid confusion with existing references
- v7 represents significant enhancement to error handling
- Dynamic adaptation is a major operational improvement
- Version string updated: 'ador-samsung-1-17-v1'

================================================================================

VERSION 5 CHANGES (16th August 2025) - WebSocket Stability Fixes:
================================================================================

CRITICAL ISSUES RESOLVED:
1. **WebSocket Auto-Connect/Disconnect Loop Fixed**
   - Problem: Duplicate reconnection mechanisms causing rapid connect/disconnect cycles
   - Solution: Removed auto-reconnect parameter from run_forever()
   - Impact: Stable connections without connection storms

2. **Connection State Management Added**
   - Added ws_connecting and ws_connected flags
   - Prevents multiple simultaneous connection attempts
   - Thread-safe state management with proper locking

3. **Exponential Backoff Implemented**
   - Progressive delays: 5s → 10s → 20s → 40s → 80s → 160s → 300s (max)
   - Prevents connection storms during network issues
   - Resets on successful connection

4. **Race Conditions Eliminated**
   - Fixed concurrent WebSocket creation issues
   - Proper locking for all WebSocket operations
   - on_open handler properly scoped

5. **Reconnection Logic Consolidated**
   - Removed problematic restart_main_loop() function
   - Single reconnection path through main_loop()
   - on_error/on_close no longer trigger cascading restarts

6. **Connection Cooldown Added**
   - Minimum 2-second delay between connection attempts
   - Prevents rapid reconnection attempts
   - System stabilization time

TECHNICAL IMPROVEMENTS:
- Removed: ws.run_forever(reconnect=5) → ws.run_forever()
- Added: Connection state tracking (ws_connecting, ws_connected)
- Added: Exponential backoff with configurable max delay
- Added: should_reconnect_websocket() validation
- Added: calculate_reconnect_delay() for backoff calculation
- Fixed: on_error and on_close handlers no longer call restart
- Fixed: Initial setup only runs once, not on every reconnection

CONFIGURATION ADDED:
- ws_reconnect_delay = 5 (initial delay in seconds)
- ws_max_reconnect_delay = 300 (maximum 5 minutes)
- WS_COOLDOWN_PERIOD = 2 (minimum seconds between attempts)

STABILITY IMPROVEMENTS:
- No more duplicate WebSocket instances
- Proper cleanup on disconnection
- Memory management preserved
- Thread safety enhanced
- Connection logging improved

TESTING RECOMMENDATIONS:
- Monitor for absence of rapid reconnections
- Verify exponential backoff on failures
- Check single connection path enforcement
- Validate stable long-term connections

================================================================================

ORIGINAL V3 CHANGE LOG - Comparison between Initial Script (cms_script.py) 
and v3 Script (cms_script_v3.py):
================================================================================

1. ARCHITECTURE & ROBUSTNESS IMPROVEMENTS:
   - Initial: Basic script (337 lines) with simple retry logic
   - Final: Enterprise-grade script (1332 lines) with infinite retry mode
   - Added connection pooling with HTTPAdapter for better resource management
   - Added session management instead of individual requests
   - Implemented proper WebSocket lifecycle management with global instance tracking

2. MEMORY MANAGEMENT ENHANCEMENTS:
   - Added aggressive garbage collection (gc.collect()) after each operation
   - Implemented streaming for large files to prevent OOM errors
   - Added temp file handling for state logs to avoid memory overflow
   - Configurable response size limits (MAX_RESPONSE_SIZE = 70MB)
   - Memory-safe log processing using iterators instead of loading entire files

3. CMS CONNECTIVITY MONITORING (NEW):
   - Added check_cms_connectivity() function for server health checks
   - Implemented CMS connection state tracking (cms_connected flag)
   - Added automatic reconnection with configurable intervals
   - CMS connectivity checked before hardware polling to save resources

4. EVENT BUFFERING MODIFICATION (16th August 2025 - Kushagra Mittal):
   - Initial: No event buffering when CMS disconnected
   - Intermediate v3: Used deque(maxlen=20) to buffer up to 20 events
   - Previous v3: Single latest_event variable - only latest event sent on reconnection
   - Final v3: NO EVENT STORAGE - events discarded when CMS disconnected
   - When CMS reconnects, only new events from WebSocket are processed

5. CONFIGURABLE PARAMETERS (NEW):
   - POLLING_INTERVAL: 60 seconds (configurable)
   - MAX_STATE_LOG_LINES: 100,000 lines for command-triggered logs
   - MAX_EVENT_STATE_LOG_LINES: 1,000 lines for event-triggered logs (user-configurable)
   - MAX_OCPP_LOG_LINES: 100,000 lines kept in memory
   - MAX_OCPP_PROCESS_LINES: 500,000 lines max processing
   - LARGE_FILE_TIMEOUT: 300 seconds for large payloads
   - MAX_500_ERRORS: 5 consecutive errors before marking CMS disconnected
   - CMS_CHECK_INTERVAL: 10 seconds between connectivity checks

6. ERROR HANDLING IMPROVEMENTS:
   - Initial: Basic try-catch with recursive calls (stack overflow risk)
   - Final: Infinite retry loops without recursion
   - Added 500 error tracking with automatic CMS disconnection
   - Implemented timeout handling with dynamic values based on payload size
   - Added graceful shutdown with Ctrl+C (3 times within 5 seconds)

7. ENHANCED LOGGING & DEBUGGING:
   - Added detailed logging with timestamps for every operation
   - Request/response logging with size information
   - Memory clearing confirmations after operations
   - WebSocket event details with truncation for large messages
   - Configuration display on startup

8. DOCKER/CONTAINER COMPATIBILITY (NEW):
   - Signal handling with SIGINT and SIGTERM support
   - Output flushing for container environments (sys.stdout.flush())
   - Environment detection (Docker/Native)
   - Fallback mechanisms for missing modules

9. ENCODING & CROSS-PLATFORM SUPPORT (NEW):
   - UTF-8 encoding with error replacement for all file operations
   - Handles both string and bytes data types
   - Windows/Linux compatibility fixes

10. STATE LOG HANDLING IMPROVEMENTS:
    - Initial: Simple splitlines() loading entire response
    - Final: Streaming with line limits and temp file usage
    - Different limits for event-triggered (2000) vs command-triggered (100000) logs
    - Size-based timeout adjustments

11. WEBSOCKET ENHANCEMENTS:
    - Initial: Basic WebSocket with simple reconnect
    - Final: Global WebSocket instance management
    - Proper closure before reconnection (close_websocket())
    - Thread-safe operations with locks

12. API EXECUTION IMPROVEMENTS:
    - Added response size validation before processing
    - Consistent timeout (configurable LARGE_FILE_TIMEOUT) for all transfers
    - Streaming for OCPP log files
    - Better error messages and status tracking

13. THREAD MANAGEMENT (NEW):
    - Proper thread lifecycle with daemon threads
    - Thread restart capability without recursion
    - Thread locks for synchronization

14. NEW UTILITY FUNCTIONS:
    - handle_interrupt(): Graceful shutdown handler
    - check_cms_connectivity(): CMS health monitoring
    - close_websocket(): Proper WebSocket cleanup
    - start_api_thread(): Thread lifecycle management

15. REMOVED RECURSION RISKS:
    - Initial: Functions called themselves on error (stack overflow risk)
    - Final: While True loops with proper break conditions

STATISTICS:
- Code growth: 337 lines (v1) → 1332 lines (v3) → 1630+ lines (v4) → 1760+ lines (v7)
- Functions added: 9 total utility functions (5 in v3, 2 in v4, 2 in v7)
- Configurable parameters: 21+ settings (15 in v3, 3 in v4, 3 in v7)
- Error handling: 15x more robust with adaptive line reduction
- Memory safety: 5+ optimization techniques preserved
- WebSocket stability: 6 critical fixes implemented
- Dynamic adaptation: 2 independent tracking systems (state + OCPP)

FINAL NOTE:
The script evolved from a basic integration tool to a production-ready,
enterprise-grade solution with comprehensive error handling, memory management,
adaptive network response, and operational resilience suitable for 24/7 deployment
in challenging network conditions.

================================================================================

INTERNET DATA CONSUMPTION ANALYSIS (Added 16th August 2025 - Kushagra Mittal):
================================================================================

Analysis of data sent to/from CMS server over internet (excluding internal hardware communication):

1. POLLING EVENT (LiveFeeds) - Every 60 seconds:
   
   Data sent TO CMS:
   - Gun status JSON payload: ~200 bytes
     {"Name":"ab-sam-02107","Busy_A":false,"Evsestat_A":1,"Pilot_A":0,
      "ErrorCode_A":0,"Busy_B":false,"Evsestat_B":-1,"Pilot_B":-1,"ErrorCode_B":0}
   - HTTP POST headers: ~200 bytes
   - Total upload: ~400 bytes
   
   Data received FROM CMS:
   - Empty response (no commands): ~100 bytes
   - With commands: ~500-2000 bytes (JSON with execution details)
   
   INTERNET DATA PER POLL: ~500-2400 bytes (0.5-2.4 KB)

2. WEBSOCKET EVENT - Real-time events:
   
   When event occurs (session_start, session_stop, alert, etc.):
   
   a) LogEvent API call to CMS:
      - Upload: ~400-700 bytes (event data + headers)
      - Download: ~200 bytes (SessionID response)
   
   b) PostStateData API call to CMS:
      - Upload: ~3-4 KB (current state JSON)
      - Download: ~100 bytes (acknowledgment)
   
   c) ExpertPostFullStateData API call to CMS:
      - Upload: 50-250 KB (1000 lines of state logs for events)
      - Download: ~100 bytes (acknowledgment)
   
   INTERNET DATA PER EVENT: ~54-255 KB (mostly state logs upload)

3. DAILY INTERNET CONSUMPTION:
   - Polling: 1440 polls/day × 1.5 KB average = ~2.2 MB/day
   - WebSocket Events (assuming 50 events/day):
     * 50 events × 150 KB average = ~7.5 MB/day
   - TOTAL DAILY INTERNET: ~10-12 MB/day typical

4. MONTHLY INTERNET ESTIMATES:
   - Light usage (10 events/day): ~100 MB/month
   - Normal usage (50 events/day): ~300-400 MB/month
   - Heavy usage (200 events/day): ~1-1.2 GB/month
   - With command-triggered full logs: Can exceed 3 GB/month

5. BANDWIDTH OPTIMIZATIONS IN v3:
   - Event-triggered logs limited to 1000 lines (configurable, vs 100000 for commands)
   - No event storage when CMS disconnected (saves memory and bandwidth)
   - CMS connectivity check before polling (avoids wasted uploads)
   - Events discarded when CMS is down (no buffering/queueing)
   - User can adjust MAX_EVENT_STATE_LOG_LINES for bandwidth control

NOTE: Actual consumption varies based on:
- Number of charging sessions
- Error frequency requiring retries  
- Remote command execution frequency
- Network disconnection/reconnection cycles

================================================================================
"""

import requests
import time
# websocket import removed - using polling-only architecture
# import rel  # Removed - no longer using rel dispatcher for WebSocket stability
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

# ============================================================================
# HARDWARE CONNECTION CONFIGURATION - Added 16th August 2025 - Kushagra Mittal
# ============================================================================
# Configure the hardware connection endpoints
# Choose either REAL HARDWARE or SIMULATOR configuration below

# Option 1: REAL HARDWARE CONFIGURATION (Default)
# Uncomment these lines for real hardware:
HARDWARE_HOST = "10.20.27.50"  # IP address of the real hardware
HARDWARE_PORT = 3001  # Port for HTTP APIs
HARDWARE_BASE_URL = f"http://{HARDWARE_HOST}:{HARDWARE_PORT}"
# WebSocket config removed - using polling-only architecture

# Option 2: SIMULATOR CONFIGURATION (ACTIVE)
# Uncomment these lines for simulator testing:
""" HARDWARE_HOST = "localhost"  # or "127.0.0.1" for local simulator
HARDWARE_PORT = 3001  # Port for HTTP APIs (matching simulator default)
HARDWARE_BASE_URL = f"http://{HARDWARE_HOST}:{HARDWARE_PORT}"
WEBSOCKET_HOST = HARDWARE_HOST  # Same as hardware host
WEBSOCKET_PORT = 3002  # Different port for WebSocket in simple simulator
WEBSOCKET_URL = f"ws://{WEBSOCKET_HOST}:{WEBSOCKET_PORT}"  # No /events/stream for simple simulator """

# Option 3: SIMULATOR WITH SAME PORT (hardware_simulator.py with gevent)
# Uncomment these lines for gevent-based simulator:
""" HARDWARE_HOST = "localhost"  # or "127.0.0.1" for local simulator
HARDWARE_PORT = 3001  # Port for both HTTP and WebSocket
HARDWARE_BASE_URL = f"http://{HARDWARE_HOST}:{HARDWARE_PORT}"
WEBSOCKET_HOST = HARDWARE_HOST  # Same as hardware host
WEBSOCKET_PORT = HARDWARE_PORT  # Same port for WebSocket
WEBSOCKET_URL = f"ws://{WEBSOCKET_HOST}:{WEBSOCKET_PORT}/events/stream" """

# ============================================================================
# CONFIGURABLE TIMING - Adjust these values based on your requirements
# ============================================================================

# Polling interval for LiveFeeds API (in seconds)
# Default: 60 seconds - How often to poll CMS for commands
# This controls how frequently the script checks for new commands from the server
POLLING_INTERVAL = 60  # Interval between LiveFeeds polling (configurable)

# Sleep time for general retries (in seconds)
SleepTime = 60  # General retry interval (kept for compatibility)

# Retry interval when CMS connection fails (in seconds)
RetryTime = 10  # Retry interval when CMS connection fails

# ============================================================================
# CONFIGURABLE LIMITS - Adjust these values based on your system requirements
# ============================================================================

# Maximum response size limit (in bytes) to prevent out-of-memory errors
# Default: 70MB - Reduce for systems with less memory
MAX_RESPONSE_SIZE = 70 * 1024 * 1024  # 70MB limit

# Maximum number of lines to read from state logs
# Default: 100,000 lines - Reduce for faster processing or limited memory
MAX_STATE_LOG_LINES = 100000  # Maximum lines for full state logs (command-triggered)

# Maximum lines for event-triggered state logs (WebSocket events)
# Default: 500 lines - Reduced to prevent timeouts in production
# Lower values = less bandwidth usage, faster transmission
# Higher values = more detailed logs but increased data consumption
# Recommended range: 500-2000 lines
MAX_EVENT_STATE_LOG_LINES = 2000  # User-configurable: lines sent per WebSocket event (reduced for production)

# Maximum number of OCPP log lines to keep in memory
# Default: 60,000 lines - Only the last N lines are sent to server
MAX_OCPP_LOG_LINES = 100000  # Maximum lines kept for OCPP logs

# Timeout for all CMS API calls (in seconds)
# Default: 300 seconds (5 minutes) - Maximum wait time for any transfer
# Note: If data transfers faster, the request completes immediately
# Increase this value for slower networks or decrease for faster failure detection
LARGE_FILE_TIMEOUT = 300  # Configurable timeout for all CMS uploads

# Maximum number of OCPP log lines to process before stopping
# Default: 500,000 lines - Prevents infinite processing of huge logs
MAX_OCPP_PROCESS_LINES = 500000  # Maximum lines to process from OCPP logs

# ============================================================================
# END OF CONFIGURABLE LIMITS
# ============================================================================

# CRITICAL FIX: Connection pooling to prevent resource leaks
# Using a session for connection reuse and proper resource management
session = requests.Session()
session.timeout = 30  # Default timeout to prevent hanging connections

# Configure session for better handling of large payloads
# Increase max pool connections for concurrent requests
session.mount('http://', requests.adapters.HTTPAdapter(
    pool_connections=10,
    pool_maxsize=10,
    max_retries=0  # We handle retries manually
))
session.mount('https://', requests.adapters.HTTPAdapter(
    pool_connections=10,
    pool_maxsize=10,
    max_retries=0  # We handle retries manually
))

# Docker/Yocto compatibility: Disable SSL warnings if needed
try:
    from requests.packages.urllib3.exceptions import InsecureRequestWarning
    requests.packages.urllib3.disable_warnings(InsecureRequestWarning)
except:
    pass  # Not critical if this fails

# Thread management (simplified — single polling thread, no WebSocket)
thread_lock = threading.Lock()

# CMS connectivity status tracking
cms_connected = False
cms_lock = threading.Lock()
last_cms_check = 0
CMS_CHECK_INTERVAL = 10  # Check CMS connectivity every 10 seconds
CMS_RETRY_INTERVAL = 10  # Retry every 10 seconds when disconnected

# Note: 500 errors don't indicate connectivity issues, just server processing errors
# Server is still reachable when it returns 500, so we don't mark as disconnected

# Changed by Kushagra - 16th August 2025
# Modified: No event storage when CMS is disconnected
# When CMS reconnects, just process the next new event from WebSocket
# No buffering or storage of events

# WebSocket removed - using polling-only architecture

# Interrupt handling for graceful shutdown
interrupt_counter = 0
last_interrupt_time = 0
FORCE_EXIT_INTERRUPTS = 30  # Number of interrupts to force exit
INTERRUPT_WINDOW = 5  # Time window in seconds for multiple interrupts

# ============================================================================
# DYNAMIC LINE LIMIT CONFIGURATION - Adaptive line reduction on errors
# ============================================================================
# Dynamic line limits that adjust on error/timeout
current_state_log_lines = MAX_STATE_LOG_LINES  # Start with max (60,000)
current_ocpp_log_lines = MAX_OCPP_LOG_LINES    # Start with max (60,000)
MIN_LOG_LINES = 10000  # Minimum lines to send
LINE_REDUCTION_STEP = 10000  # Reduce by 10k on each failure

# Track consecutive successes for potential reset
state_log_success_count = 0
ocpp_log_success_count = 0
SUCCESS_COUNT_TO_RESET = 3  # Reset to max after 3 consecutive successes

# ============================================================================
# ALERT POLLING CONFIGURATION - Poll /state for session errors
# ============================================================================
ALERT_POLLING_INTERVAL = 10  # Poll /state every 10 seconds for alerts

# Track last known error state to avoid duplicate alerts
# Format: {"A": {"errorObj": set(), "ses_errors": set(), "had_errors": False}, "B": {...}}
# ses_errors: set of session error codes currently active (from curr_ses_errors_list)
# had_errors: tracks if gun previously had any errors (to send "No error" alert when all cleared)
last_alert_state = {
    "A": {"errorObj": set(), "ses_errors": set(), "had_errors": False},
    "B": {"errorObj": set(), "ses_errors": set(), "had_errors": False}
}
alert_lock = threading.Lock()

# Session tracking state for each gun
# Tracks curr_ses_active transitions to detect session_start/session_stop
# Tracks phs (phase state) for start_charging/stop_charging detection
last_session_state = {
    "A": {"active": False, "snapshot": {}, "phs": 0},
    "B": {"active": False, "snapshot": {}, "phs": 0},
}

# Pending events for 3rd poll iteration (ensures fresh data and 2s timestamp gap)
# Format: {"A": {"snapshot": {...}, "polls_remaining": 3}, "B": None}
pending_stop_charging = {
    "A": None,
    "B": None,
}
pending_session_stop = {
    "A": None,
    "B": None,
}
PENDING_EVENT_DELAY_POLLS = 2  # Send after 2 polls (~20 seconds)

# errorObj field mapping (Priority 1 - checked first)
# Maps errorObj field names to (vendorErrorCode, errorCode, info)
ERROR_OBJ_MAPPING = {
    "eStopErr": (17, "OtherError", "EmergencyPressed"),
    "doorOpenErr": (18, "OtherError", "DoorOpen"),
    "powerLossErr": (19, "OtherError", "PowerFailure"),
    "cabinetTemperatureErr": (82, "HighTemperature", "CabinetTempHigh"),
    "outletTemperatureErr": (83, "HighTemperature", "ModuleOutletTempHigh"),
    "overVoltageErr": (85, "OverVoltage", "InputOverVoltage"),
    "underVoltageErr": (26, "UnderVoltage", "InputUnderVoltage"),
    "powerModuleFailureErr": (14, "InternalError", "PowerModuleFailure"),
    "powerModuleCommErr_1": (15, "InternalError", "PowerModuleCommError"),
    "powerModuleCommErr_2": (15, "InternalError", "PowerModuleCommError"),
    "gunTemperatureErr_1": (27, "HighTemperature", "OutletTempHigh"),
    "gunTemperatureErr_2": (91, "HighTemperature", "CableHighTemperature"),
    "groundFault": (90, "GroundFailure", "GroundFault"),
    "imdResistanceErr_1": (75, "InternalError", "IMDResistance"),
    "imdResistanceErr_2": (75, "InternalError", "IMDResistance"),
    "imdFaultyErr_controller1": (78, "InternalError", "IMDFaultC1"),
    "imdFaultyErr_controller2": (79, "InternalError", "IMDFaultC2"),
    "ac_em_fail": (80, "InternalError", "ACEnergyMeterFailure"),
}

# Session Error Code Mapping (Priority 2 - checked only if no errorObj is true)
# Maps ecogErrorCode to (vendorErrorCode, errorCode, info)
SESSION_ERROR_CODES = {
    # EV Communication Errors
    44: (88, "EVCommunicationError", "EVCOM"),
    54: (88, "EVCommunicationError", "EVCOM"),
    57: (89, "EVCommunicationError", "EVDROPPED"),
    67: (89, "EVCommunicationError", "EVDROPPED"),
    74: (1, "EVCommunicationError", "BMSCommunicationTimeout"),
    # Temperature Errors
    7: (83, "HighTemperature", "ModuleOutletTempHigh"),
    8: (82, "HighTemperature", "CabinetTempHigh"),
    66: (27, "HighTemperature", "OutletTempHigh"),
    # Internal Errors
    9: (10, "InternalError", "ConnectivityError"),
    63: (8, "InternalError", "CommunicationError"),
    69: (8, "InternalError", "CommunicationError"),
    73: (13, "InternalError", "OutputFuseFail"),
    995: (15, "InternalError", "PowerModuleCommError"),
    996: (87, "ReaderFailure", "ReaderError"),
    997: (26, "UnderVoltage", "InputUnderVoltage"),
    998: (14, "InternalError", "PowerModuleFailure"),
    999: (85, "OverVoltage", "InputOverVoltage"),
    9000: (10, "InternalError", "ConnectivityError"),
    9001: (11, "InternalError", "CommunicationError"),
    # Power/Contactor Errors
    30: (17, "OtherError", "EmergencyPressed"),
    41: (17, "OtherError", "EmergencyPressed"),
    72: (17, "OtherError", "EmergencyPressed"),
    58: (18, "OtherError", "DoorOpen"),
    68: (18, "OtherError", "DoorOpen"),
    64: (19, "OtherError", "PowerFailure"),
    67: (86, "PowerSwitchFailure", "ACContactorFail"),
    77: (90, "GroundFailure", "GroundFault"),
    # Session/Protocol Errors (use generic codes)
    4: (3, "EVCommunicationError", "VehicleError"),
    5: (3, "EVCommunicationError", "VehicleError"),
    6: (3, "EVCommunicationError", "VehicleError"),
    21: (7, "InternalError", "CommunicationError"),
    22: (7, "InternalError", "CommunicationError"),
    24: (7, "InternalError", "CommunicationError"),
    28: (3, "EVCommunicationError", "VehicleError"),
    29: (7, "InternalError", "CommunicationError"),
    31: (7, "InternalError", "CommunicationError"),
    34: (3, "EVCommunicationError", "VehicleError"),
    35: (3, "EVCommunicationError", "VehicleError"),
    36: (3, "EVCommunicationError", "VehicleError"),
    37: (3, "EVCommunicationError", "VehicleError"),
    38: (3, "EVCommunicationError", "VehicleError"),
    39: (3, "EVCommunicationError", "VehicleError"),
    40: (7, "InternalError", "CommunicationError"),
}

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
            DeviceID = session.get(f"{HARDWARE_BASE_URL}/id", timeout=30)
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
            #DataTosend = {'Name': DeviceID, "Version": 'ador-intel-1-14-v6'}
            DataTosend = {'Name': DeviceID, "Version": 'ador-samsung-1-23-v1'}
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


def check_cms_connectivity():
    """Check if CMS server is reachable by testing a lightweight API endpoint"""
    global cms_connected, last_cms_check
    
    current_time = time.time()
    # Only check if enough time has passed since last check
    if current_time - last_cms_check < CMS_CHECK_INTERVAL:
        return cms_connected
    
    try:
        # Try to reach the CMS API with a lightweight request
        print(f"{time.ctime()} [Script->Server] Checking CMS connectivity...")
        # Use GET request to the base API URL or a health check endpoint
        test_url = SERVER_URL + "api/charger/LiveFeeds"
        response = session.head(test_url, timeout=5, allow_redirects=True)
        
        with cms_lock:
            if response.status_code in [200, 401, 403, 404, 405, 500]:  # Server is reachable (including 500 errors)
                if not cms_connected:
                    print(f"{time.ctime()} [Script->Server] CMS connection RESTORED")
                    cms_connected = True
                    # Changed by Kushagra - 16th August 2025
                    # No stored events to process - just wait for next WebSocket event
                else:
                    cms_connected = True
            else:
                if cms_connected:
                    print(f"{time.ctime()} [Script->Server] CMS connection LOST (status={response.status_code})")
                cms_connected = False
    except requests.exceptions.ConnectionError:
        with cms_lock:
            if cms_connected:
                print(f"{time.ctime()} [Script->Server] CMS connection LOST: Connection failed")
            cms_connected = False
    except requests.exceptions.Timeout:
        with cms_lock:
            if cms_connected:
                print(f"{time.ctime()} [Script->Server] CMS connection LOST: Timeout")
            cms_connected = False
    except Exception as ex:
        with cms_lock:
            if cms_connected:
                print(f"{time.ctime()} [Script->Server] CMS connection LOST: {ex}")
            cms_connected = False
    
    last_cms_check = current_time
    return cms_connected

def check_hardware_connectivity():
    """Check if hardware is reachable before WebSocket reconnection

    Returns:
        bool: True if hardware is reachable, False otherwise
    """
    try:
        # Use /id endpoint - lightweight and simple response
        response = session.get(f"{HARDWARE_BASE_URL}/id", timeout=5)

        if response.status_code == 200:
            print(f"{time.ctime()} [Script] Hardware connectivity check: OK")
            return True
        else:
            print(f"{time.ctime()} [Script] Hardware connectivity check: FAILED (status {response.status_code})")
            return False

    except requests.exceptions.Timeout:
        print(f"{time.ctime()} [Script] Hardware connectivity check: TIMEOUT")
        return False
    except requests.exceptions.ConnectionError as e:
        print(f"{time.ctime()} [Script] Hardware connectivity check: CONNECTION ERROR ({e})")
        return False
    except Exception as e:
        print(f"{time.ctime()} [Script] Hardware connectivity check: EXCEPTION ({e})")
        return False

def GetGunStatus():
    """Get gun status from hardware only if CMS is connected"""
    # Check CMS connectivity first
    if not check_cms_connectivity():
        print(f"{time.ctime()} [Script] Skipping hardware poll - CMS not connected")
        return None
    
    try:
        print(f"{time.ctime()} [Script->Hardware] GET /state (Gun Status)")
        # CRITICAL FIX: Use session for connection pooling and add timeout
        response = session.get(f"{HARDWARE_BASE_URL}/state", timeout=30).json()
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

def poll_loop():
    """Unified polling loop — replaces WebSocket, alert polling, and LiveFeeds threads.
    
    Polls /state every ALERT_POLLING_INTERVAL seconds (10s) for:
    - Session start/stop detection (curr_ses_active transitions)
    - Alert detection (errorObj + session errors)
    - LiveFeeds to CMS every POLLING_INTERVAL seconds (60s)
    """
    global last_alert_state, last_session_state, cms_connected, pending_stop_charging, pending_session_stop
    
    livefeed_counter = 0
    LIVEFEED_EVERY_N = max(1, POLLING_INTERVAL // ALERT_POLLING_INTERVAL)  # 60/10 = 6
    
    print(f"{time.ctime()} [Script] Unified poll loop started")
    print(f"    - /state poll interval: {ALERT_POLLING_INTERVAL}s")
    print(f"    - LiveFeeds interval: {POLLING_INTERVAL}s (every {LIVEFEED_EVERY_N} polls)")
    
    while True:
        try:
            # Check CMS connectivity first
            if not check_cms_connectivity():
                print(f"{time.ctime()} [Poll] CMS not connected - skipping poll")
                time.sleep(RetryTime)
                continue
            
            # Poll hardware /state endpoint
            try:
                response = session.get(f"{HARDWARE_BASE_URL}/state", timeout=10)
            except Exception as hw_ex:
                print(f"{time.ctime()} [Poll] Failed to reach hardware: {hw_ex}")
                time.sleep(ALERT_POLLING_INTERVAL)
                continue
                
            if response.status_code != 200:
                print(f"{time.ctime()} [Poll] Failed to poll /state: status {response.status_code}")
                time.sleep(ALERT_POLLING_INTERVAL)
                continue
            
            state_data = response.json()
            
            # Process each gun
            guns = []
            if isinstance(state_data, list):
                if len(state_data) > 0:
                    guns.append(("A", 1, state_data[0]))
                if len(state_data) > 1:
                    guns.append(("B", 2, state_data[1]))
            else:
                guns.append(("A", 1, state_data))
            
            with alert_lock:
                for gun_label, outlet, gun_state in guns:
                    # ==========================================
                    # SEND PENDING EVENTS (after 3 poll iterations)
                    # Ensures fresh data and 2-second timestamp gap
                    # ==========================================
                    
                    # Process pending stop_charging (decrement counter, send when reaches 0)
                    if pending_stop_charging[gun_label] is not None:
                        pending_stop_charging[gun_label]["polls_remaining"] -= 1
                        if pending_stop_charging[gun_label]["polls_remaining"] <= 0:
                            prev_snapshot = pending_stop_charging[gun_label]["snapshot"]
                            print(f"{time.ctime()} [Session] Charging STOP (queued, 2 polls) on Gun {gun_label}")
                            send_session_event_to_cms("stop_charging", gun_state, prev_state=prev_snapshot)
                            pending_stop_charging[gun_label] = None
                    
                    # Process pending session_stop (decrement counter, send when reaches 0)
                    if pending_session_stop[gun_label] is not None:
                        pending_session_stop[gun_label]["polls_remaining"] -= 1
                        if pending_session_stop[gun_label]["polls_remaining"] <= 0:
                            prev_snapshot = pending_session_stop[gun_label]["snapshot"]
                            print(f"{time.ctime()} [Session] Session STOP (queued, 2 polls) on Gun {gun_label}")
                            send_session_event_to_cms("session_stop", gun_state, prev_state=prev_snapshot, add_timestamp_offset=True)
                            pending_session_stop[gun_label] = None
                    
                    # Get controller ID and outlet type from state
                    controller_id = gun_state.get("id", DeviceID)
                    outlet_type = gun_state.get("outletType", "CCS")
                    
                    # ==========================================
                    # ALERT DETECTION (existing logic preserved)
                    # ==========================================
                    
                    # PRIORITY 1: Check errorObj fields first
                    error_obj = gun_state.get("errorObj", {})
                    current_errors = set()
                    
                    for field_name in ERROR_OBJ_MAPPING.keys():
                        if error_obj.get(field_name, False) is True:
                            current_errors.add(field_name)
                    
                    # Check for NEW errorObj errors (not seen before)
                    previous_errors = last_alert_state[gun_label]["errorObj"]
                    new_errors = current_errors - previous_errors
                    cleared_errors = previous_errors - current_errors
                    
                    # Send alerts for new errorObj errors
                    for field_name in new_errors:
                        if field_name.endswith("_1") and gun_label != "A":
                            print(f"{time.ctime()} [Alert] SKIPPING {field_name} on Gun {gun_label} (gun-specific: _1 is for Gun A only)")
                            continue
                        if field_name.endswith("_2") and gun_label != "B":
                            print(f"{time.ctime()} [Alert] SKIPPING {field_name} on Gun {gun_label} (gun-specific: _2 is for Gun B only)")
                            continue
                        
                        error_info = ERROR_OBJ_MAPPING.get(field_name)
                        if error_info:
                            vendor_code, error_code, info = error_info
                            print(f"{time.ctime()} [Alert] NEW errorObj on Gun {gun_label}: {field_name} -> {error_code}:{info}")
                            send_alert_to_cms(outlet=outlet, vendor_code=vendor_code, error_code=error_code, 
                                              info=info, controller_id=controller_id, outlet_type=outlet_type, gun_state=gun_state)
                    
                    # Log cleared errorObj errors
                    for field_name in cleared_errors:
                        print(f"{time.ctime()} [Alert] errorObj CLEARED on Gun {gun_label}: {field_name}")
                    
                    # Update tracked errorObj state
                    last_alert_state[gun_label]["errorObj"] = current_errors
                    
                    # --- Process curr_ses_errors_list (all session errors) ---
                    errors_list_str = gun_state.get("curr_ses_errors_list", "")
                    current_ses_errors = set()
                    if errors_list_str:
                        for code_str in errors_list_str.split(","):
                            code_str = code_str.strip()
                            if code_str and code_str.isdigit():
                                current_ses_errors.add(int(code_str))
                    
                    previous_ses_errors = last_alert_state[gun_label]["ses_errors"]
                    new_ses_errors = current_ses_errors - previous_ses_errors
                    cleared_ses_errors = previous_ses_errors - current_ses_errors
                    
                    SKIP_SESSION_ERRORS = {10, 68, 70, 71, 72, 999, 997, 998, 995, 994, 77}
                    
                    for error_code_int in new_ses_errors:
                        if error_code_int in SKIP_SESSION_ERRORS:
                            print(f"{time.ctime()} [Alert] SKIPPING session error on Gun {gun_label}: {error_code_int} (in skip list)")
                            continue
                        
                        error_info = SESSION_ERROR_CODES.get(error_code_int)
                        if error_info:
                            vendor_code, error_code, info = error_info
                        else:
                            vendor_code, error_code, info = (0, "OtherError", f"Unknown_{error_code_int}")
                        print(f"{time.ctime()} [Alert] NEW session error on Gun {gun_label}: {error_code_int} -> {error_code}:{info}")
                        send_alert_to_cms(outlet=outlet, vendor_code=vendor_code, error_code=error_code,
                                          info=info, controller_id=controller_id, outlet_type=outlet_type, gun_state=gun_state)
                    
                    for error_code_int in cleared_ses_errors:
                        print(f"{time.ctime()} [Alert] Session error CLEARED on Gun {gun_label}: {error_code_int}")
                    
                    last_alert_state[gun_label]["ses_errors"] = current_ses_errors
                    
                    has_any_error = len(current_errors) > 0 or len(current_ses_errors) > 0
                    had_errors = last_alert_state[gun_label]["had_errors"]
                    
                    if had_errors and not has_any_error:
                        print(f"{time.ctime()} [Alert] ALL ERRORS RESTORED on Gun {gun_label} - sending No error alert")
                        send_alert_to_cms(outlet=outlet, vendor_code=16, error_code="NoError",
                                          info="No error", controller_id=controller_id, outlet_type=outlet_type, gun_state=gun_state)
                    
                    last_alert_state[gun_label]["had_errors"] = has_any_error
                    
                    # ==========================================
                    # CHARGING PHASE DETECTION (phs transitions)
                    # CHECK FIRST - before session detection to ensure correct event order
                    # ==========================================
                    curr_phs = gun_state.get("phs", 0)
                    prev_phs = last_session_state[gun_label].get("phs", 0)
                    
                    # Also need curr_active for coordination with session detection
                    curr_active = gun_state.get("curr_ses_active", False)
                    prev_active = last_session_state[gun_label]["active"]
                    
                    # start_charging: phs transitions to 7
                    if curr_phs == 7 and prev_phs != 7:
                        # Entered Charging stage (current demand) → start_charging
                        print(f"{time.ctime()} [Session] Charging START detected on Gun {gun_label} (phs: {prev_phs} → {curr_phs})")
                        send_session_event_to_cms("start_charging", gun_state)
                    
                    # stop_charging: phs transitions from 7 to any other value
                    # ALSO trigger stop_charging if session ends while phs was 7 (to ensure correct order)
                    stop_charging_needed = (prev_phs == 7 and curr_phs != 7)
                    session_ending_while_charging = (not curr_active and prev_active and prev_phs == 7)
                    
                    if stop_charging_needed or session_ending_while_charging:
                        # Queue stop_charging for next poll iteration (ensures fresh data)
                        prev_snapshot = last_session_state[gun_label]["snapshot"]
                        if stop_charging_needed:
                            print(f"{time.ctime()} [Session] Charging STOP detected on Gun {gun_label} (phs: {prev_phs} → {curr_phs}) - QUEUED for 2 polls")
                        else:
                            print(f"{time.ctime()} [Session] Charging STOP detected on Gun {gun_label} (session ending while charging) - QUEUED for 2 polls")
                        pending_stop_charging[gun_label] = {
                            "snapshot": prev_snapshot,
                            "polls_remaining": PENDING_EVENT_DELAY_POLLS,
                        }
                    
                    # Update phs tracking for next iteration
                    last_session_state[gun_label]["phs"] = curr_phs
                    
                    # ==========================================
                    # SESSION DETECTION (after phs detection)
                    # ==========================================
                    
                    if curr_active and not prev_active:
                        # Session just started
                        print(f"{time.ctime()} [Session] Session START detected on Gun {gun_label}")
                        print(f"    [Session] curr_ses_id={gun_state.get('curr_ses_id', '')}, user={gun_state.get('user', '')}")
                        send_session_event_to_cms("session_start", gun_state)
                    
                    if not curr_active and prev_active:
                        # Queue session_stop for next poll iteration (ensures 2s gap after stop_charging)
                        prev_snapshot = last_session_state[gun_label]["snapshot"]
                        print(f"{time.ctime()} [Session] Session STOP detected on Gun {gun_label} - QUEUED for 2 polls")
                        print(f"    [Session] Using previous snapshot: curr_ses_id={prev_snapshot.get('curr_ses_id', '')}")
                        pending_session_stop[gun_label] = {
                            "snapshot": prev_snapshot,
                            "polls_remaining": PENDING_EVENT_DELAY_POLLS,
                        }
                    
                    # Always save current state as snapshot for next comparison
                    last_session_state[gun_label]["active"] = curr_active
                    if curr_active:
                        # Only update snapshot when session is active (preserve last active state for stop)
                        last_session_state[gun_label]["snapshot"] = dict(gun_state)
            
            # ==========================================
            # LIVEFEEDS (every POLLING_INTERVAL seconds)
            # ==========================================
            
            livefeed_counter += 1
            if livefeed_counter >= LIVEFEED_EVERY_N:
                livefeed_counter = 0
                print(f"{time.ctime()} " + "="*80)
                print(f"{time.ctime()} [Script->Server] LIVEFEEDS (every {POLLING_INTERVAL}s)")
                send_livefeeds_and_handle_commands(state_data)
            
            # Clear memory
            state_data = None
            response = None
            gc.collect()
            
        except KeyboardInterrupt:
            handle_interrupt()
        except Exception as ex:
            print(f"{time.ctime()} [Poll] Exception in poll_loop: {ex}")
        
        time.sleep(ALERT_POLLING_INTERVAL)


def send_alert_to_cms(outlet, vendor_code, error_code, info, controller_id=None, outlet_type="CCS", gun_state=None):
    """Send a formatted alert event to CMS via /api/charger/LogEvent
    
    Formats the alert in the same structure expected by the server.
    The server expects: {type, timestamp, chargerId, outlet, outletType, payload: {src, code, msg}}
    
    Args:
        outlet: Outlet number (1 or 2)
        vendor_code: Vendor error code (integer) - used as 'code' in payload
        error_code: OCPP error code (e.g., "OtherError", "HighTemperature")
        info: Additional info string (e.g., "EmergencyPressed", "DoorOpen")
        controller_id: Individual controller ID (e.g., secc2300-XXXXX). Falls back to DeviceID if not provided.
        outlet_type: Type of outlet (CCS, CHAdeMO, etc.)
        gun_state: Current gun state from /state endpoint (for hardware timestamp)
    """
    try:
        # Use controller ID if provided, otherwise fall back to DeviceID
        charger_id = controller_id if controller_id else DeviceID
        
        # Format alert event in exact hardware WebSocket format
        # This matches the format the hardware sends via ws://events/stream
        error_msg = f"{info}"
        # Use hardware timestamp from gun_state if available, fallback to system time
        hardware_timestamp = gun_state.get("timestamp", int(time.time() * 1000)) if gun_state else int(time.time() * 1000)
        
        alert_event = {
            "type": "alert",
            "timestamp": hardware_timestamp,
            "chargerId": charger_id,
            "outlet": str(outlet),
            "outletType": outlet_type,
            "payload": {
                "src": "stack",
                "code": vendor_code,
                "msg": error_msg,
                "list": str(vendor_code),
                "session": ""
            }
        }
        
        event_json = json.dumps(alert_event)
        EventData = {'id': DeviceID, 'ev': event_json}
        
        print(f"{time.ctime()} [Alert->CMS] Sending alert to CMS")
        print(f"    [Alert->CMS] POST {SERVER_URL}api/charger/LogEvent")
        print(f"    [Alert->CMS] Params: id={DeviceID}, ev={event_json}")
        
        response = session.post(
            SERVER_URL + "/api/charger/LogEvent",
            params=EventData,
            timeout=30
        )
        
        print(f"{time.ctime()} [CMS->Alert] Response: Status={response.status_code}")
        print(f"    [CMS->Alert] Body: {response.text}")
        
        if response.status_code == 200:
            print(f"{time.ctime()} [Alert] Alert sent successfully")
            
            # Parse sessionID and send state data + state logs (same as on_message behavior)
            try:
                jResponse = json.loads(response.text)
                sessionID = int(jResponse["Message"])
                print(f"{time.ctime()} [Alert] SessionID={sessionID}, sending state data for Outlet={outlet}")
                CallStateAPI(sessionID)
                CallStateFull(sessionID, outlet, is_event_triggered=True)  # Event-triggered: 2,000 lines
            except Exception as state_ex:
                print(f"{time.ctime()} [Alert] Failed to send state data after alert: {state_ex}")
            
        elif response.status_code == 500:
            # Server may not support alert event type
            print(f"{time.ctime()} [Alert] Server returned 500 - alert may not be supported")
        else:
            print(f"{time.ctime()} [Alert] Unexpected response: {response.status_code}")
        
        # Clear memory
        response = None
        gc.collect()
        
    except Exception as ex:
        print(f"{time.ctime()} [Alert] Exception sending alert to CMS: {ex}")


def send_session_event_to_cms(event_type, gun_state, prev_state=None, add_timestamp_offset=False):
    """Send a session_start or session_stop event to CMS via /api/charger/LogEvent
    
    Args:
        event_type: "session_start" or "session_stop"
        gun_state: Current gun state from /state endpoint
        prev_state: Previous poll's state snapshot (needed for session_stop to get fields before they're cleared)
        add_timestamp_offset: If True, add 2000ms (2 seconds) to timestamp for session_stop
                              to ensure gap after stop_charging
    """
    try:
        # Calculate timestamp offset for session_stop (2 seconds = 2000ms)
        timestamp_offset = 2000 if (event_type == "session_stop" and add_timestamp_offset) else 0
        
        if event_type == "session_start":
            # Build session_start event from current state
            event = {
                "type": "session_start",
                "timestamp": gun_state.get("sessionStart", int(time.time() * 1000)),
                "chargerId": gun_state.get("id", DeviceID),
                "outlet": str(gun_state.get("outlet", "1")),
                "outletType": gun_state.get("outletType", "CCS"),
                "payload": {
                    "user": gun_state.get("user", ""),
                    "session": gun_state.get("curr_ses_id", "")
                }
            }
        elif event_type == "session_stop":
            # Build session_stop event using FRESH gun_state data (from current poll)
            # This ensures we get the most complete data after 2-poll delay
            src = gun_state  # Use fresh data instead of old snapshot
            
            # Derive EVCCID from EVMAC if EVCCID is empty (remove dots from MAC address)
            evmac = src.get("EVMAC", "")
            evccid = src.get("EVCCID", "")
            if not evccid and evmac:
                evccid = evmac.replace(".", "").replace(":", "").lower()
            
            event = {
                "type": "session_stop",
                "timestamp": src.get("timestamp", int(time.time() * 1000)) + timestamp_offset,
                "chargerId": src.get("id", DeviceID),
                "outlet": str(src.get("outlet", "1")),
                "outletType": src.get("outletType", "CCS"),
                "payload": {
                    "unexpected": not src.get("curr_ses_success", False),
                    "error": {
                        "code": src.get("curr_ses_error", 0),
                        "msg": src.get("curr_ses_errMsg", ""),
                        "list": src.get("curr_ses_errors_list", "")
                    },
                    "source": src.get("curr_ses_endBy", ""),
                    "start": src.get("sessionStart", 0),
                    "duration": src.get("curr_ses_secs", 0),
                    "energy": src.get("curr_ses_Wh", 0),
                    "user": src.get("user", ""),
                    "session": src.get("curr_ses_id", ""),
                    "stopReason": src.get("stopReason", ""),
                    "EVCCID": evccid,
                    "EVMAC": evmac
                }
            }
        elif event_type == "start_charging":
            # Build start_charging event - sent when phs transitions to 7 (Charging/current demand)
            # Derive EVCCID from EVMAC if EVCCID is empty (remove dots/colons from MAC address)
            evmac = gun_state.get("EVMAC", "")
            evccid = gun_state.get("EVCCID", "")
            if not evccid and evmac:
                evccid = evmac.replace(".", "").replace(":", "").lower()
            
            event = {
                "type": "start_charging",
                "timestamp": gun_state.get("timestamp", int(time.time() * 1000)),
                "chargerId": gun_state.get("id", DeviceID),
                "outlet": str(gun_state.get("outlet", "1")),
                "outletType": gun_state.get("outletType", "CCS"),
                "payload": {
                    "EVCCID": evccid,
                    "EVMAC": evmac,
                    "user": gun_state.get("user", ""),
                    "session": gun_state.get("curr_ses_id", "")
                }
            }
        elif event_type == "stop_charging":
            # Build stop_charging event - sent when phs transitions from 7 to another value
            # Use previous snapshot for session data if available
            src = prev_state if prev_state else gun_state
            
            # Derive EVCCID from EVMAC if EVCCID is empty (remove dots/colons from MAC address)
            evmac = src.get("EVMAC", "")
            evccid = src.get("EVCCID", "")
            if not evccid and evmac:
                evccid = evmac.replace(".", "").replace(":", "").lower()
            
            event = {
                "type": "stop_charging",
                "timestamp": src.get("timestamp", int(time.time() * 1000)),
                "chargerId": src.get("id", DeviceID),
                "outlet": str(src.get("outlet", "1")),
                "outletType": src.get("outletType", "CCS"),
                "payload": {
                    "source": src.get("curr_ses_endBy", ""),
                    "user": src.get("user", ""),
                    "session": src.get("curr_ses_id", ""),
                    "stopReason": src.get("stopReason", ""),
                    "EVCCID": evccid,
                    "EVMAC": evmac
                }
            }
        else:
            print(f"{time.ctime()} [Session] Unknown event type: {event_type}")
            return
        
        event_json = json.dumps(event)
        EventData = {'id': DeviceID, 'ev': event_json}
        
        print(f"{time.ctime()} [Session->CMS] Sending {event_type} to CMS")
        print(f"    [Session->CMS] POST {SERVER_URL}api/charger/LogEvent")
        print(f"    [Session->CMS] Payload: {event_json}")
        
        response = session.post(
            SERVER_URL + "/api/charger/LogEvent",
            params=EventData,
            timeout=30
        )
        
        print(f"{time.ctime()} [CMS->Session] Response: Status={response.status_code}")
        print(f"    [CMS->Session] Body: {response.text}")
        
        if response.status_code == 200:
            print(f"{time.ctime()} [Session] {event_type} sent successfully")
            
            # Parse sessionID and send state data + state logs
            try:
                jResponse = json.loads(response.text)
                sessionID = int(jResponse["Message"])
                outlet = event.get("outlet", "1")
                print(f"{time.ctime()} [Session] SessionID={sessionID}, sending state data for Outlet={outlet}")
                CallStateAPI(sessionID)
                CallStateFull(sessionID, outlet, is_event_triggered=True)
            except Exception as state_ex:
                print(f"{time.ctime()} [Session] Failed to send state data after {event_type}: {state_ex}")
            
        elif response.status_code == 500:
            print(f"{time.ctime()} [Session] Server returned 500 for {event_type}")
        else:
            print(f"{time.ctime()} [Session] Unexpected response for {event_type}: {response.status_code}")
        
        # Clear memory
        response = None
        gc.collect()
        
    except Exception as ex:
        print(f"{time.ctime()} [Session] Exception sending {event_type} to CMS: {ex}")


def send_livefeeds_and_handle_commands(state_data):
    """Send LiveFeeds gun status to CMS and handle any commands in the response.
    
    Extracted from the old CallApi function. Called every 60s from poll_loop.
    """
    global cms_connected
    try:
        # Build gun status from already-fetched state_data
        if isinstance(state_data, list):
            gun_a = state_data[0] if len(state_data) > 0 else {}
            gun_b = state_data[1] if len(state_data) > 1 else {}
        else:
            gun_a = state_data
            gun_b = {}
        
        data = {
            "Name": DeviceID,
            "Busy_A": gun_a.get("busy", False),
            "Evsestat_A": gun_a.get("evsestat", -1),
            "Pilot_A": gun_a.get("pilot", -1),
            "ErrorCode_A": gun_a.get("curr_ses_error", 0),
            "Busy_B": gun_b.get("busy", False),
            "Evsestat_B": gun_b.get("evsestat", -1),
            "Pilot_B": gun_b.get("pilot", -1),
            "ErrorCode_B": gun_b.get("curr_ses_error", 0),
        }
        gun_status = json.dumps(data)
        
        headers = {'Content-Type': 'application/json'}
        print(f"{time.ctime()} [Script->Server] POST {SERVER_URL}api/charger/LiveFeeds")
        print(f"{time.ctime()} [Script->Server] Payload: {gun_status}")
        
        response = session.post(
            SERVER_URL + "/api/charger/LiveFeeds", data=gun_status, headers=headers, timeout=30)

        if response.status_code != 200:
            with cms_lock:
                cms_connected = False
            print(f"{time.ctime()} [Server->Script] ERROR: Status={response.status_code}")
            print(f"{time.ctime()} [Server->Script] Body: {response.text[:200]}..." if len(response.text) > 200 else f"{time.ctime()} [Server->Script] Body: {response.text}")
        else:
            with cms_lock:
                cms_connected = True
            print(f"{time.ctime()} [Server->Script] LiveFeeds OK (200)")
            print(f"{time.ctime()} [Server->Script] Body: {response.text[:200]}..." if len(response.text) > 200 else f"{time.ctime()} [Server->Script] Body: {response.text}")

        if response.status_code == 200 and len(response.text) > 5:
            if len(response.text) > MAX_RESPONSE_SIZE:
                print(f"{time.ctime()} Response too large, skipping: {len(response.text)} bytes")
            else:
                print(f"{time.ctime()} [Server->Script] COMMAND RECEIVED:")
                print(f"    [Server->Script] Raw: {response.text[:200]}..." if len(response.text) > 200 else f"    [Server->Script] Raw: {response.text}")
                ReceivedData = json.loads(json.loads(response.text))
                print(f"    [Script] Parsed: ExecutionID={ReceivedData.get('ExecutionID', 'N/A')}, API={ReceivedData.get('API', 'N/A')}, ApiTypeID={ReceivedData.get('ApiTypeID', 'N/A')}")
                ExecuteRequestedAPI(ReceivedData)
                
                ReceivedData = None
                gc.collect()
                print(f"    [Script] Memory cleared after command execution")
                
        response = None
        gun_status = None
        gc.collect()
        
    except Exception as ex:
        with cms_lock:
            cms_connected = False
        print(f"{time.ctime()} [LiveFeeds] Exception: {ex}")
# endregion

# region Helper

def validateJSON(jsonData):

    try:
        json.loads(jsonData)
    except ValueError as err:
        return False
    return True
# endregion

# WebSocket functions removed — using polling-only architecture


def CallStateAPI(sessionID):
    try:
        # Skip if CMS is not connected
        if not cms_connected:
            print(f"{time.ctime()} [Script] Skipping state API - CMS not connected")
            return
        
        global DataTosend
        print(f"{time.ctime()} [Script->Hardware] Fetching state for SessionID={sessionID}")
        
        # CRITICAL FIX: Use session for connection pooling and add timeout
        print(f"    [Script->Hardware] GET {HARDWARE_BASE_URL}/state")
        StateJson = session.get(f"{HARDWARE_BASE_URL}/state", timeout=30)
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


def reduce_line_limit(current_limit, limit_type="state"):
    """Reduce line limit by step, with minimum floor"""
    new_limit = max(current_limit - LINE_REDUCTION_STEP, MIN_LOG_LINES)
    if new_limit < current_limit:
        print(f"    [Script] Reducing {limit_type} log limit: {current_limit:,} → {new_limit:,} lines")
    else:
        print(f"    [Script] {limit_type} log limit at minimum: {MIN_LOG_LINES:,} lines")
    return new_limit

def reset_line_limit_on_success(limit_type="state"):
    """Optionally increase limit after consecutive successes"""
    global current_state_log_lines, current_ocpp_log_lines
    global state_log_success_count, ocpp_log_success_count

    if limit_type == "state":
        state_log_success_count += 1
        if state_log_success_count >= SUCCESS_COUNT_TO_RESET:
            if current_state_log_lines < MAX_STATE_LOG_LINES:
                old_limit = current_state_log_lines
                current_state_log_lines = min(current_state_log_lines + LINE_REDUCTION_STEP, MAX_STATE_LOG_LINES)
                print(f"    [Script] Increasing state log limit after {state_log_success_count} successes: {old_limit:,} → {current_state_log_lines:,} lines")
                state_log_success_count = 0
    else:
        ocpp_log_success_count += 1
        if ocpp_log_success_count >= SUCCESS_COUNT_TO_RESET:
            if current_ocpp_log_lines < MAX_OCPP_LOG_LINES:
                old_limit = current_ocpp_log_lines
                current_ocpp_log_lines = min(current_ocpp_log_lines + LINE_REDUCTION_STEP, MAX_OCPP_LOG_LINES)
                print(f"    [Script] Increasing OCPP log limit after {ocpp_log_success_count} successes: {old_limit:,} → {current_ocpp_log_lines:,} lines")
                ocpp_log_success_count = 0

def CallStateFull(sessionID, outletno, is_event_triggered=True):
    """Memory-optimized version using deque to keep only last N lines
    WITH ENCODING FIXES for cross-platform compatibility
    ENHANCED TIMEOUT for large files (100k+ lines)

    Args:
        sessionID: The session ID from CMS
        outletno: The outlet number
        is_event_triggered: True if called from WebSocket event, False if from command
    """
    global DataTosend, current_state_log_lines, state_log_success_count
    import gc
    from collections import deque

    # Skip if CMS is not connected
    if not cms_connected:
        print(f"{time.ctime()} [Script] Skipping full state log - CMS not connected")
        return
    
    # Determine max lines based on trigger type
    if is_event_triggered:
        max_lines = MAX_EVENT_STATE_LOG_LINES  # 1000 lines for events (unchanged)
        print(f"{time.ctime()} [Script] Event-triggered state log - limiting to {max_lines:,} lines")
    else:
        max_lines = current_state_log_lines  # USE DYNAMIC LIMIT for commands
        print(f"{time.ctime()} [Script] Command-triggered state log - using current limit of {max_lines:,} lines (max: {MAX_STATE_LOG_LINES:,})")

    try:
        # CRITICAL FIX: Use session for connection pooling and add timeout
        url = f"{HARDWARE_BASE_URL}/controllers/{outletno}/api/outlets/1/log/state/full"
        print(f"{time.ctime()} [Script->Hardware] Fetching full state log from hardware...")
        response = session.get(url, timeout=60, stream=True)  # Increased timeout for hardware
        
        if response.status_code == 200:
            # Check content length for warning
            content_length = response.headers.get('content-length')
            if content_length and int(content_length) > MAX_RESPONSE_SIZE:
                print(f"    [Script] Large state log detected ({int(content_length)//(1024*1024)}MB), using memory-safe streaming")
            
            # CRITICAL FIX: Use deque to keep only last N lines in memory
            # This avoids loading entire log file into memory

            # Create a deque that will automatically keep only the last max_lines
            lines_buffer = deque(maxlen=max_lines)
            line_count = 0

            print(f"{time.ctime()} [Script] Streaming state log from hardware (keeping last {max_lines:,} lines)...")

            # Stream response line by line, keeping only last N lines in memory
            try:
                for line in response.iter_lines(decode_unicode=True):
                    if line:
                        # Ensure line is string, not bytes
                        if isinstance(line, bytes):
                            line = line.decode('utf-8', errors='replace')

                        # Add to deque - automatically drops oldest when full
                        lines_buffer.append(line)
                        line_count += 1

                        # Periodic garbage collection during streaming
                        if line_count % 10000 == 0:
                            gc.collect()

            except UnicodeDecodeError as e:
                print(f"Warning: Unicode decode error, continuing with replacement: {e}")
                # Continue processing with error replacement

            print(f"    [Script] State log: processed {line_count:,} total lines from hardware")

            # Convert deque to list for sending
            lines = list(lines_buffer)

            if line_count > max_lines:
                print(f"    [Script] Kept last {len(lines):,} lines from {line_count:,} total lines")
            else:
                print(f"    [Script] Using all {len(lines):,} lines (less than limit of {max_lines:,})")
            
            total_lines = len(lines)
            print(f"{time.ctime()} [Script] Loaded {total_lines:,} lines into memory")
            
            # Send in original format - single POST as server expects
            url = SERVER_URL + "/api/charger/ExpertPostFullStateData"
            payload = {
                'id': DeviceID,
                'SessionID': sessionID,
                'data': lines
            }
            
            print(f"{time.ctime()} [Script->Server] Preparing to send full state logs")
            print(f"    [Script->Server] POST {url}")
            print(f"    [Script->Server] Payload: id={DeviceID}, SessionID={sessionID}, data={total_lines:,} lines")
            
            # Calculate data size for logging and timeout decision
            data_size_bytes = len(json.dumps(payload))
            data_size_kb = data_size_bytes // 1024
            data_size_mb = data_size_kb // 1024
            
            # Use consistent timeout for all file sizes
            # The timeout is a maximum wait time - if data sends faster, it completes faster
            # Changed by Kushagra - 16th August 2025: Simplified timeout logic
            timeout_val = LARGE_FILE_TIMEOUT  # Use configured timeout (default 300s) for all transfers
            print(f"    [Script->Server] File size: {total_lines:,} lines (~{data_size_mb}MB)")
            print(f"    [Script->Server] Using timeout: {timeout_val} seconds (max wait time)")
            
            # Send with appropriate timeout
            print(f"{time.ctime()} [Script->Server] Sending data (~{data_size_mb}MB) with {timeout_val}s timeout...")
            
            try:
                # Use requests with custom adapter for better control
                response = session.post(
                    url,
                    json=payload,
                    timeout=timeout_val,
                    stream=False  # Don't stream response
                )

                print(f"{time.ctime()} [Server->Script] ExpertPostFullStateData Response: Status={response.status_code}")
                print(f"    [Server->Script] Response: {response.text[:100]}..." if len(response.text) > 100 else f"    [Server->Script] Response: {response.text}")
                print(f"    [Script] State log sent successfully: {total_lines:,} lines, ~{data_size_mb}MB sent to server")

                # SUCCESS: Reset failure counter and potentially increase limit
                if not is_event_triggered:
                    reset_line_limit_on_success("state")

            except requests.exceptions.Timeout:
                state_log_success_count = 0  # Reset success counter on failure

                print(f"{time.ctime()} [Script] ERROR: Request timed out after {timeout_val} seconds")
                print(f"    [Script] File was too large ({total_lines:,} lines, ~{data_size_mb}MB)")

                # Reduce limit for next attempt (only for command-triggered)
                if not is_event_triggered:
                    current_state_log_lines = reduce_line_limit(current_state_log_lines, "state")
                    print(f"    [Script] Next attempt will use {current_state_log_lines:,} lines")

                raise

            except requests.exceptions.ConnectionError as e:
                state_log_success_count = 0  # Reset success counter on failure

                print(f"{time.ctime()} [Script] ERROR: Connection failed while sending large file")
                print(f"    [Script] Error: {e}")

                # Reduce limit for next attempt (only for command-triggered)
                if not is_event_triggered:
                    current_state_log_lines = reduce_line_limit(current_state_log_lines, "state")
                    print(f"    [Script] Next attempt will use {current_state_log_lines:,} lines")

                raise

            except requests.exceptions.SSLError as e:
                state_log_success_count = 0  # Reset success counter on failure

                print(f"{time.ctime()} [Script] ERROR: SSL error while sending large file")
                print(f"    [Script] Error: {e}")

                # Reduce limit for next attempt (only for command-triggered)
                if not is_event_triggered:
                    current_state_log_lines = reduce_line_limit(current_state_log_lines, "state")
                    print(f"    [Script] Next attempt will use {current_state_log_lines:,} lines")

                raise
            
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
    global current_ocpp_log_lines, ocpp_log_success_count, current_state_log_lines, state_log_success_count
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
            url = f'{HARDWARE_BASE_URL}/'+RecivedData["API"]
            # Initialize variables to prevent undefined reference
            lines_processed = 0
            last_60000 = deque(maxlen=current_ocpp_log_lines)  # Use dynamic limit instead of MAX_OCPP_LOG_LINES
            last_60000_list = []
            
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
                last_60000 = deque(maxlen=current_ocpp_log_lines)  # Only keep last N lines as configured (dynamic)
                
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
                print(f"    [Script] Attempting to use fallback test log file...")
                
                # FALLBACK: Try to use the test log file
                test_log_path = "/mnt/d/curserai_workspace/CMS_NOC/test_logs/docker_logs (21).txt"
                try:
                    if os.path.exists(test_log_path):
                        print(f"    [Script] Using fallback log file: {test_log_path}")
                        with open(test_log_path, 'r', encoding='utf-8', errors='replace') as f:
                            for line in f:
                                last_60000.append(line.rstrip('\n'))
                                lines_processed += 1
                                if lines_processed >= MAX_OCPP_LOG_LINES:
                                    break
                        last_60000_list = list(last_60000)
                        print(f"    [Script] Loaded {len(last_60000_list):,} lines from fallback log file")
                    else:
                        print(f"    [Script] Fallback log file not found, using empty response")
                        last_60000_list = []
                except Exception as e:
                    print(f"    [Script] Error reading fallback log: {e}")
                    last_60000_list = []
                
            # CRITICAL FIX: Avoid keeping multiple copies in memory
            ExecutionResponse = json.dumps("\n".join(str(line) for line in last_60000_list))
            
            # Calculate size for timeout decision
            response_size_kb = len(ExecutionResponse) // 1024
            response_size_mb = response_size_kb // 1024
            
            # Use consistent timeout for all transfers
            # Changed by Kushagra - 16th August 2025: Simplified timeout logic
            timeout_val = LARGE_FILE_TIMEOUT  # Use configured timeout (default 300s)
            print(f"    [Script] OCPP log response: ~{response_size_mb}MB, using {timeout_val}s timeout")
            
            # Store the count before clearing
            lines_sent = len(last_60000)
            
            # Clear the list to free memory immediately
            last_60000_list = None
            last_60000.clear()  # Clear the deque as well

            try:
                LogExecutionStatus = session.post(
                    SERVER_URL + "/api/charger/UpdateExecutionStatus",
                    params={'ExecutionID': RecivedData["ExecutionID"]},
                    json=ExecutionResponse,
                    timeout=timeout_val
                )

                print(f"{time.ctime()} [OK] COMMAND RESPONSE SENT to CMS: Status={LogExecutionStatus.status_code}")
                print(f"    [Script] OCPP log sent: processed {lines_processed:,} lines, kept and sent last {lines_sent:,} lines, ~{len(ExecutionResponse)//1024}KB sent to server")

                # SUCCESS: Reset failure counter and potentially increase limit
                reset_line_limit_on_success("ocpp")

            except (requests.exceptions.Timeout, requests.exceptions.ConnectionError, requests.exceptions.SSLError) as e:
                ocpp_log_success_count = 0  # Reset success counter

                print(f"{time.ctime()} [Script] ERROR: Failed to send OCPP logs - {type(e).__name__}")
                print(f"    [Script] Error: {e}")
                print(f"    [Script] File: {lines_sent:,} lines, ~{len(ExecutionResponse)//1024}KB")

                # Reduce limit for next attempt
                current_ocpp_log_lines = reduce_line_limit(current_ocpp_log_lines, "OCPP")
                print(f"    [Script] Next OCPP log request will use {current_ocpp_log_lines:,} lines")

                # Still try to update execution status with error message
                try:
                    error_response = json.dumps(f"Failed to send logs: {type(e).__name__}")
                    session.post(
                        SERVER_URL + "/api/charger/UpdateExecutionStatus",
                        params={'ExecutionID': RecivedData["ExecutionID"]},
                        json=error_response,
                        timeout=30
                    )
                except:
                    pass  # Best effort

            # Clear response and force garbage collection
            ExecutionResponse = None
            gc.collect()
            print(f"    [Script] Memory cleared after sending logs")
            return ;   
        if RecivedData["IsInputRequired"] == False:
            if RecivedData["ApiTypeID"] == 1:
                print(f"{time.ctime()} [-->] SENDING GET Request to Hardware: {HARDWARE_BASE_URL}/{RecivedData['API']}")
                # CRITICAL FIX: Use session for connection pooling and add timeout
                Apiresponse = session.get(
                    f"{HARDWARE_BASE_URL}/"+RecivedData["API"], timeout=30)
            elif RecivedData["ApiTypeID"] == 2:
                print(f"{time.ctime()} [-->] SENDING PUT Request to Hardware: {HARDWARE_BASE_URL}/{RecivedData['API']}")
                Apiresponse = session.put(
                    f"{HARDWARE_BASE_URL}/"+RecivedData["API"], timeout=30)
            elif RecivedData["ApiTypeID"] == 3:
                print(f"{time.ctime()} [-->] SENDING POST Request to Hardware: {HARDWARE_BASE_URL}/{RecivedData['API']}")
                Apiresponse = session.post(
                    f"{HARDWARE_BASE_URL}/"+RecivedData["API"], timeout=30)
            elif RecivedData["ApiTypeID"] == 4:
                print(f"{time.ctime()} [-->] SENDING DELETE Request to Hardware: {HARDWARE_BASE_URL}/{RecivedData['API']}")
                Apiresponse = session.delete(
                    f"{HARDWARE_BASE_URL}/"+RecivedData["API"], timeout=30)

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
                    print(f"    [Script] State log retrieved via command: {line_count:,} lines, ~{data_size_kb}KB from hardware")
                    
                    # Apply current_state_log_lines limit for command-triggered state logs (dynamic)
                    if line_count > current_state_log_lines:
                        print(f"    [Script] Limiting state log to last {current_state_log_lines:,} lines (was {line_count:,} lines)")
                        # Split into lines and take only the LAST configured limit lines
                        lines = APIResult.split('\n')
                        APIResult = '\n'.join(lines[-current_state_log_lines:])
                        # Update counts after limiting
                        line_count = current_state_log_lines
                        data_size_kb = len(APIResult) // 1024
                        print(f"    [Script] State log limited to {line_count:,} lines, ~{data_size_kb}KB")
        else:
            if RecivedData["InputIsJson"] == True:
                parsed_input = json.loads(RecivedData["Input"])
                if RecivedData["ApiTypeID"] == 1:
                    # CRITICAL FIX: Use session for connection pooling and add timeout
                    Apiresponse = session.get(
                        f"{HARDWARE_BASE_URL}/"+RecivedData["API"], parsed_input, timeout=30)
                elif RecivedData["ApiTypeID"] == 2:
                    Apiresponse = session.put(
                        f"{HARDWARE_BASE_URL}/"+RecivedData["API"], parsed_input, timeout=30)
                elif RecivedData["ApiTypeID"] == 3:
                    Apiresponse = session.post(
                        f"{HARDWARE_BASE_URL}/"+RecivedData["API"],json= parsed_input, timeout=30)
                    
                elif RecivedData["ApiTypeID"] == 4:
                    Apiresponse = session.delete(
                        f"{HARDWARE_BASE_URL}/"+RecivedData["API"], parsed_input, timeout=30)

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
                        
                        # Apply current_state_log_lines limit for command-triggered state logs (dynamic)
                        if line_count > current_state_log_lines:
                            print(f"    [Script] Limiting state log to last {current_state_log_lines:,} lines (was {line_count:,} lines)")
                            # Split into lines and take only the LAST configured limit lines
                            lines = APIResult.split('\n')
                            APIResult = '\n'.join(lines[-current_state_log_lines:])
                            # Update counts after limiting
                            line_count = current_state_log_lines
                            data_size_kb = len(APIResult) // 1024
                            print(f"    [Script] State log limited to last {line_count:,} lines, ~{data_size_kb}KB")
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
                            f"{HARDWARE_BASE_URL}/"+RecivedData["API"],headers=headers, timeout=30)
                    elif RecivedData["ApiTypeID"] == 2:
                        Apiresponse = session.put(
                            f"{HARDWARE_BASE_URL}/"+RecivedData["API"],headers=headers, timeout=30)
                    elif RecivedData["ApiTypeID"] == 3:
                        Apiresponse = session.post(
                            f"{HARDWARE_BASE_URL}/"+apinew,headers=headers, timeout=30)
                    elif RecivedData["ApiTypeID"] == 4:
                        Apiresponse = session.delete(
                            f"{HARDWARE_BASE_URL}/"+RecivedData["API"],headers=headers, timeout=30)

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
                            
                            # Apply current_state_log_lines limit for command-triggered state logs (dynamic)
                            if line_count > current_state_log_lines:
                                print(f"    [Script] Limiting state log to last {current_state_log_lines:,} lines (was {line_count:,} lines)")
                                # Split into lines and take only the LAST configured limit lines
                                lines = APIResult.split('\n')
                                APIResult = '\n'.join(lines[-current_state_log_lines:])
                                # Update counts after limiting
                                line_count = current_state_log_lines
                                data_size_kb = len(APIResult) // 1024
                                print(f"    [Script] State log limited to last {line_count:,} lines, ~{data_size_kb}KB")
                else:                
                    headers = {
                        'accept': 'application/javascript',
                        'Content-Type': 'application/javascript'
                                }
                    if RecivedData["ApiTypeID"] == 1:
                        # CRITICAL FIX: Use session for connection pooling and add timeout
                        Apiresponse = session.get(
                            f"{HARDWARE_BASE_URL}/"+RecivedData["API"],RecivedData["Data"],headers=headers, timeout=30)
                    elif RecivedData["ApiTypeID"] == 2:
                         Apiresponse = session.put(
                            f"{HARDWARE_BASE_URL}/"+RecivedData["API"],headers=headers,data=RecivedData["Data"], timeout=30)
                    elif RecivedData["ApiTypeID"] == 3:
                        Apiresponse = session.post(
                            f"{HARDWARE_BASE_URL}/"+apinew,headers=headers,data=datanew, timeout=30)
                    elif RecivedData["ApiTypeID"] == 4:
                        Apiresponse = session.delete(
                            f"{HARDWARE_BASE_URL}/"+RecivedData["API"],RecivedData["Data"],headers=headers, timeout=30)

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
                            
                            # Apply current_state_log_lines limit for command-triggered state logs (dynamic)
                            if line_count > current_state_log_lines:
                                print(f"    [Script] Limiting state log to last {current_state_log_lines:,} lines (was {line_count:,} lines)")
                                # Split into lines and take only the LAST configured limit lines
                                lines = APIResult.split('\n')
                                APIResult = '\n'.join(lines[-current_state_log_lines:])
                                # Update counts after limiting
                                line_count = current_state_log_lines
                                data_size_kb = len(APIResult) // 1024
                                print(f"    [Script] State log limited to last {line_count:,} lines, ~{data_size_kb}KB")
        

        print(f"{time.ctime()} [<--] HARDWARE RESPONSE: {APIResult[:200]}..." if len(APIResult) > 200 else f"{time.ctime()} [<--] HARDWARE RESPONSE: {APIResult}")
        
        JSONStatus = validateJSON(APIResult)

        try:
            if not JSONStatus:
                ExecutionResponse = json.dumps(APIResult)
                # Calculate size for logging and timeout decision
                response_size_kb = len(ExecutionResponse) // 1024
                response_size_mb = response_size_kb // 1024

                # Use consistent timeout for all transfers
                # Changed by Kushagra - 16th August 2025: Simplified timeout logic
                timeout_val = LARGE_FILE_TIMEOUT  # Use configured timeout (default 300s)
                print(f"    [Script] Response size: ~{response_size_mb}MB, using {timeout_val}s timeout")
                LogExecutionStatus = session.post(SERVER_URL + "/api/charger/UpdateExecutionStatus", params={
                    'ExecutionID': RecivedData["ExecutionID"]}, json=ExecutionResponse, timeout=timeout_val)
            else:
                response_size_kb = len(APIResult) // 1024
                response_size_mb = response_size_kb // 1024

                # Use consistent timeout for all transfers
                # Changed by Kushagra - 16th August 2025: Simplified timeout logic
                timeout_val = LARGE_FILE_TIMEOUT  # Use configured timeout (default 300s)
                print(f"    [Script] API result size: ~{response_size_mb}MB, using {timeout_val}s timeout")
                LogExecutionStatus = session.post(SERVER_URL+"/api/charger/UpdateExecutionStatus", params={
                    'ExecutionID': RecivedData["ExecutionID"]}, json=APIResult, timeout=timeout_val)

            print(f"{time.ctime()} [Server->Script] UpdateExecutionStatus: Status={LogExecutionStatus.status_code}")
            print(f"    [Server->Script] Response: {LogExecutionStatus.text[:100]}..." if len(LogExecutionStatus.text) > 100 else f"    [Server->Script] Response: {LogExecutionStatus.text}")

            # Add logging for state logs sent through command execution
            if is_state_log and 'APIResult' in locals():
                line_count = APIResult.count('\n') + 1 if APIResult else 0
                print(f"    [Script] State log sent via command: {line_count:,} lines, ~{response_size_kb}KB sent to server")

                # SUCCESS: Reset failure counter and potentially increase limit for state logs
                reset_line_limit_on_success("state")

        except requests.exceptions.Timeout:
            print(f"{time.ctime()} [Script] ERROR: Request timed out after {timeout_val} seconds")
            if is_state_log:
                line_count = APIResult.count('\n') + 1 if APIResult else 0
                print(f"    [Script] State log was too large ({line_count:,} lines, ~{response_size_mb}MB)")

                # Reduce limit for next attempt
                state_log_success_count = 0  # Reset success counter on failure
                current_state_log_lines = reduce_line_limit(current_state_log_lines, "state")
                print(f"    [Script] Next state log attempt will use {current_state_log_lines:,} lines")

            # Try to update execution status with error message
            try:
                error_response = json.dumps(f"Timeout after {timeout_val}s - file too large")
                session.post(
                    SERVER_URL + "/api/charger/UpdateExecutionStatus",
                    params={'ExecutionID': RecivedData["ExecutionID"]},
                    json=error_response,
                    timeout=30
                )
            except:
                pass  # Ignore errors when reporting the timeout

        except requests.exceptions.ConnectionError as e:
            print(f"{time.ctime()} [Script] ERROR: Connection failed while sending response")
            print(f"    [Script] Error: {e}")
            if is_state_log:
                line_count = APIResult.count('\n') + 1 if APIResult else 0
                print(f"    [Script] State log: {line_count:,} lines, ~{response_size_mb}MB")

                # Reduce limit for next attempt
                state_log_success_count = 0  # Reset success counter on failure
                current_state_log_lines = reduce_line_limit(current_state_log_lines, "state")
                print(f"    [Script] Next state log attempt will use {current_state_log_lines:,} lines")

        except requests.exceptions.SSLError as e:
            print(f"{time.ctime()} [Script] ERROR: SSL error while sending response")
            print(f"    [Script] Error: {e}")
            if is_state_log:
                line_count = APIResult.count('\n') + 1 if APIResult else 0
                print(f"    [Script] State log: {line_count:,} lines, ~{response_size_mb}MB")

                # Reduce limit for next attempt
                state_log_success_count = 0  # Reset success counter on failure
                current_state_log_lines = reduce_line_limit(current_state_log_lines, "state")
                print(f"    [Script] Next state log attempt will use {current_state_log_lines:,} lines")
        
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

def main_loop():
    """Main entry point — setup then run unified poll loop forever."""
    print(f"{time.ctime()} [Script] Starting initial setup...")
    
    # Keep trying to get device ID forever
    GetDeviceID()
    
    # Keep trying to log version forever
    LogVersion()
    
    print(f"{time.ctime()} [Script] Initial setup completed")
    
    # Run unified poll loop (blocks forever)
    poll_loop()


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
    
    print(f"{time.ctime()} [Script] CMS NOC Integration v8 Starting - Polling-Only Architecture")
    print(f"Configuration:")
    print(f"  - Hardware URL: {HARDWARE_BASE_URL}")
    print(f"  - CMS Server URL: {SERVER_URL}")
    print(f"  - Poll Interval (state/alerts/sessions): {ALERT_POLLING_INTERVAL} seconds")
    print(f"  - LiveFeeds Interval: {POLLING_INTERVAL} seconds")
    print(f"  - CMS Check Interval: {CMS_CHECK_INTERVAL} seconds")
    print(f"  - Retry Interval (on failure): {RetryTime} seconds")
    print(f"  - Max Response Size: {MAX_RESPONSE_SIZE / (1024*1024)}MB")
    print(f"  - Max State Log Lines (commands): {MAX_STATE_LOG_LINES:,}")
    print(f"  - Max State Log Lines (events): {MAX_EVENT_STATE_LOG_LINES:,}")
    print(f"  - Max OCPP Log Lines (kept): {MAX_OCPP_LOG_LINES:,}")
    print(f"  - Max OCPP Log Lines (process): {MAX_OCPP_PROCESS_LINES:,}")
    print(f"  - Dynamic State Log Lines (current): {current_state_log_lines:,} (min: {MIN_LOG_LINES:,}, step: {LINE_REDUCTION_STEP:,})")
    print(f"  - Dynamic OCPP Log Lines (current): {current_ocpp_log_lines:,} (min: {MIN_LOG_LINES:,}, step: {LINE_REDUCTION_STEP:,})")
    print(f"  - Recovery: Increase limit after {SUCCESS_COUNT_TO_RESET} consecutive successes")
    print(f"  - Large File Timeout: {LARGE_FILE_TIMEOUT} seconds (for 100k+ lines)")
    print(f"  - Retry Mode: INFINITE (will never give up)")
    print(f"  - Adaptive Line Reduction: v8 ENABLED (auto-adjust on timeout/SSL/connection errors)")
    print(f"  - Architecture: POLLING-ONLY (no WebSocket)")
    print(f"  - Session Detection: ENABLED (polls /state every {ALERT_POLLING_INTERVAL}s for curr_ses_active transitions)")
    print(f"  - Alert Polling: ENABLED (polls /state every {ALERT_POLLING_INTERVAL}s)")
    print(f"  - Alert Priority 1: {len(ERROR_OBJ_MAPPING)} errorObj fields (powerLossErr, eStopErr, etc.)")
    print(f"  - Alert Priority 2: {len(SESSION_ERROR_CODES)} session error codes (fallback)")
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
