# NOC Client updated

A robust Python client for EV charger communication with the CMS (Charging Management System) server. This enterprise-grade client handles real-time data polling, WebSocket event streaming, and remote API command execution with enhanced stability and memory optimization.

## Overview

The NOC client serves as a bridge between EV charger hardware and the CMS server, providing:

- **Real-time Status Monitoring**: Continuous polling of gun status and charger state
- **Event Streaming**: WebSocket-based real-time event forwarding to CMS with exponential backoff
- **Remote Command Execution**: Execute API commands remotely through CMS
- **Automatic Recovery**: Infinite retry mechanism with intelligent reconnection logic
- **Memory Optimization**: Advanced memory management with configurable limits
- **Hardware Flexibility**: Configurable endpoints for real hardware or simulator testing

## Features

- ✅ **Enhanced WebSocket Stability**: Exponential backoff, connection state tracking, race condition elimination
- ✅ **Configurable Hardware Endpoints**: Support for real hardware, simulators, and test environments
- ✅ **Smart Memory Management**: Configurable limits for state logs, OCPP logs, and response sizes
- ✅ **CMS Connectivity Monitoring**: Intelligent connection health checks with automatic recovery
- ✅ **Event Buffer Management**: Optimized event handling with no storage when CMS disconnected
- ✅ **Cross-Platform Encoding**: UTF-8 compatibility for Windows/Linux deployment
- ✅ **Production-Ready Logging**: Detailed operational logging with request/response tracking
- ✅ **Bandwidth Optimization**: Configurable log line limits for data consumption control

## Version 6 Enhancements

### WebSocket Stability Improvements
- **Connection State Management**: Prevents duplicate connections with `ws_connecting` and `ws_connected` flags
- **Exponential Backoff**: Progressive delays (5s → 10s → 20s → 40s → 80s → 160s → 300s max)
- **Race Condition Elimination**: Thread-safe WebSocket operations with proper locking
- **Connection Cooldown**: Minimum 2-second delay between connection attempts
- **Consolidated Reconnection**: Single reconnection path through main_loop()

### Configuration Flexibility
```python
# Hardware Connection Options
HARDWARE_HOST = "10.20.27.50"        # Real hardware (default)
# HARDWARE_HOST = "localhost"         # Simulator option
WEBSOCKET_URL = "ws://10.20.27.50:3001/events/stream"

# Configurable Limits
MAX_STATE_LOG_LINES = 60000          # Command-triggered state logs
MAX_EVENT_STATE_LOG_LINES = 1000     # Event-triggered state logs  
MAX_OCPP_LOG_LINES = 60000           # OCPP logs kept in memory
POLLING_INTERVAL = 60                # API polling frequency
LARGE_FILE_TIMEOUT = 300             # Timeout for large transfers
```

### Memory & Bandwidth Optimization
- **Smart Log Limiting**: Different limits for events (1,000 lines) vs commands (60,000 lines)
- **Streaming Processing**: Line-by-line processing for large files
- **Aggressive Cleanup**: Memory clearing after each server transmission
- **Bandwidth Control**: User-configurable event log sizes (500-2000 lines recommended)

### Production Features
- **CMS Health Monitoring**: Automatic connectivity checks every 10 seconds
- **Event Discarding**: No event storage when CMS disconnected (saves bandwidth)
- **Enhanced Logging**: Request/response tracking with size information
- **Error Classification**: Different handling for 500 errors vs connectivity issues

## Architecture

```
┌─────────────────┐    HTTP/WebSocket    ┌─────────────────┐    HTTP API    ┌─────────────────┐
│   EV Charger    │ ←──────────────────→ │   NOC Client    │ ←────────────→ │   CMS Server    │
│  Hardware API   │                      │   (This App)    │                │  quenchcms.com  │
│                 │                      │   cms_script    │                │                 │
└─────────────────┘                      └─────────────────┘                └─────────────────┘
```

## Internet Data Consumption

**Daily Usage Estimates:**
- **Polling Data**: ~2.2 MB/day (1,440 polls × 1.5 KB average)
- **WebSocket Events**: ~7.5 MB/day (50 events × 150 KB average)
- **Total Daily**: ~10-12 MB/day typical usage

**Monthly Estimates:**
- Light usage (10 events/day): ~100 MB/month
- Normal usage (50 events/day): ~300-400 MB/month  
- Heavy usage (200 events/day): ~1-1.2 GB/month

**Bandwidth Optimization:**
- Event logs limited to 1,000 lines (configurable via `MAX_EVENT_STATE_LOG_LINES`)
- No event buffering when CMS disconnected
- CMS connectivity checks prevent wasted uploads

## Deployment Instructions

### Step 1: Build Docker Image

Build the Docker image locally with ARM64 architecture:

```bash
docker buildx build --platform linux/arm64 -f Dockerfile -t ador-samsung-1-14:latest --output type=docker,dest=- . | gzip > ador-samsung-1-14.tar.gz
```

**Note**: Ensure you have a `Dockerfile` in your project directory. If not, create one:

```dockerfile
FROM python:3.9-slim

WORKDIR /usr/src/app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY cms_script.py .

CMD ["python", "cms_script.py"]
```

### Step 2: Export Docker Image

The image is already saved as a compressed tar.gz file from the build step. If you need to save it separately:

```bash
docker save ador-samsung-1-14:latest | gzip > ador-samsung-1-14.tar.gz
```

### Step 3: Upload Image to Charger

Upload the tar file to the charger using the Docker API:

**Endpoint**: `POST http://10.20.27.50:3001/docker-apps/images/load`

**Method**: Use the charger's Swagger UI or curl:

```bash
curl -X POST "http://10.20.27.50:3001/docker-apps/images/load" \
     -H "Content-Type: application/octet-stream" \
     --data-binary @ador-samsung-1-14.tar.gz
```

### Step 4: Create Container

Create a new container using the uploaded image:

**Endpoint**: `POST http://10.20.27.50:3001/docker-apps/containers/create`

**Request Body**:
```json
{
  "Image": "ador-samsung-1-14:latest",
  "WorkingDir": "/usr/src/app",
  "Cmd": ["python", "cms_script.py"],
  "Hostname": "",
  "ExposedPorts": {
    "3020/tcp": {}
  },
  "HostConfig": {
    "Memory": 536870912,
    "MemorySwap": 536870912,
    "PortBindings": {
      "3020/tcp": [
        {
          "HostPort": "3020"
        }
      ]
    }
  }
}
```

**Response**: Save the container ID from the response for the next step.

### Step 5: Start Container

Start the created container using its ID:

**Endpoint**: `POST http://10.20.27.50:3001/docker-apps/containers/{container_id}/start`

Replace `{container_id}` with the ID received from Step 4.

## Configuration

### Environment Variables

The script uses the following configuration (modify in `cms_script.py` if needed):

**Connection Settings:**
- `SERVER_URL`: CMS server endpoint (default: `https://quenchcms.com/`)
- `HARDWARE_HOST`: Hardware API host (default: `10.20.27.50`)
- `HARDWARE_PORT`: Hardware API port (default: `3001`)
- `WEBSOCKET_URL`: WebSocket endpoint for events

**Timing Configuration:**
- `POLLING_INTERVAL`: API polling frequency (default: 60 seconds)
- `SleepTime`: General retry interval (default: 60 seconds)
- `RetryTime`: CMS failure retry interval (default: 10 seconds)
- `CMS_CHECK_INTERVAL`: CMS health check frequency (default: 10 seconds)

**Memory & Bandwidth Limits:**
- `MAX_RESPONSE_SIZE`: Maximum response size (default: 70MB)
- `MAX_STATE_LOG_LINES`: Command-triggered state logs (default: 60,000 lines)
- `MAX_EVENT_STATE_LOG_LINES`: Event-triggered state logs (default: 1,000 lines)
- `MAX_OCPP_LOG_LINES`: OCPP logs kept in memory (default: 60,000 lines)
- `LARGE_FILE_TIMEOUT`: Timeout for large transfers (default: 300 seconds)

### Network Requirements

Ensure the following endpoints are accessible:

- **Hardware API**: `http://{HARDWARE_HOST}:{HARDWARE_PORT}/*` (configurable)
- **CMS Server**: `https://quenchcms.com/*`
- **WebSocket**: `ws://{HARDWARE_HOST}:{HARDWARE_PORT}/events/stream` (configurable)

**Default Endpoints:**
- Hardware API: `http://10.20.27.50:3001/*`
- WebSocket: `ws://10.20.27.50:3001/events/stream`

## Operation

### Normal Operation Flow

1. **Device Registration**: Retrieves device ID from hardware
2. **Version Logging**: Reports client version to CMS
3. **Status Polling**: Continuously polls gun status every 60 seconds
4. **Event Streaming**: Listens for real-time events via WebSocket
5. **Command Execution**: Processes remote commands from CMS

### Monitoring

The client provides detailed logging for monitoring:

```
[Timestamp] [Script->Server] POLLING ATTEMPT #1
[Timestamp] [Script->Server] POST https://quenchcms.com/api/charger/LiveFeeds
[Timestamp] [Server->Script] LiveFeeds OK (200)
[Timestamp] [Hardware->Script] WEBSOCKET EVENT RECEIVED
[Timestamp] [Script->Server] Forwarding WebSocket event
[Timestamp] [Server->Script] Event logged, SessionID=12345
```

**updated Enhanced Logging Features:**
- Request/response size tracking
- Memory clearing confirmations  
- Connection state transitions
- Bandwidth usage monitoring
- WebSocket reconnection attempts with backoff delays

### Graceful Shutdown

To gracefully shutdown the client:

- Press `Ctrl+C` three times within 5 seconds for force exit
- Or stop the Docker container: `docker stop {container_id}`

## Troubleshooting

### Common Issues

**WebSocket Connection Issues**:
- updated includes exponential backoff for automatic recovery
- Check WebSocket endpoint accessibility and port availability
- Monitor reconnection attempts in logs

**Memory Issues**:
- updated includes configurable memory limits and aggressive cleanup
- Adjust `MAX_EVENT_STATE_LOG_LINES` (500-2000) for bandwidth control
- Monitor container memory usage if issues persist

**CMS Connection Failures**:
- Client automatically monitors CMS health every 10 seconds
- Events are discarded (not buffered) when CMS disconnected
- Check network connectivity to HTTPS endpoints

**Large File Transfer Issues**:
- Configure `LARGE_FILE_TIMEOUT` based on network speed
- Adjust `MAX_STATE_LOG_LINES` to reduce transfer sizes
- Monitor timeout errors in logs

### Debug Mode

Enable detailed logging by modifying the script:

```python
websocket.enableTrace(True)  # Change to True for WebSocket debug logs
```

**updated Configuration Tuning:**

For bandwidth optimization:
```python
MAX_EVENT_STATE_LOG_LINES = 500    # Reduce for lower bandwidth usage
MAX_STATE_LOG_LINES = 30000        # Reduce for faster command responses
```

For memory optimization:
```python
MAX_RESPONSE_SIZE = 50 * 1024 * 1024  # Reduce to 50MB limit
MAX_OCPP_LOG_LINES = 30000            # Reduce OCPP memory usage
```

For timing adjustments:
```python
POLLING_INTERVAL = 30              # Increase polling frequency
LARGE_FILE_TIMEOUT = 600           # Increase timeout for slow networks
```

### Container Management

**View running containers**:
```bash
curl http://10.20.27.50:3001/docker-apps/containers/json
```

**View container logs**:
```bash
curl http://10.20.27.50:3001/docker-apps/containers/{container_id}/logs?stdout=true&stderr=true
```

**Stop container**:
```bash
curl -X POST http://10.20.27.50:3001/docker-apps/containers/{container_id}/stop
```

## API Endpoints

The client interacts with the following CMS endpoints:

- `GET /api/charger/LogVersion` - Log client version
- `POST /api/charger/LiveFeeds` - Send real-time status data
- `POST /api/charger/LogEvent` - Forward hardware events
- `POST /api/charger/PostStateData` - Send state information
- `POST /api/charger/ExpertPostFullStateData` - Send complete state logs
- `POST /api/charger/UpdateExecutionStatus` - Report command execution results

## Dependencies

See `requirements.txt` for Python dependencies:

- `requests==2.31.0` - HTTP client library
- `websocket-client==1.7.0` - WebSocket client
- `rel==0.4.9` - Event dispatcher
- `python-dotenv==1.0.0` - Environment variable management
- `psutil==5.9.6` - System monitoring

## Support

For technical support or issues:

1. Check container logs for error messages
2. Verify network connectivity and API accessibility
3. Ensure proper image deployment and container configuration

## Version History

- **updated (Current)**: WebSocket stability enhancements, configurable endpoints, bandwidth optimization
  - Enhanced connection state management with exponential backoff
  - Configurable hardware endpoints for real/simulator environments
  - Smart memory management with configurable log limits
  - Improved error handling and recovery mechanisms

- **v5**: WebSocket stability fixes, connection management improvements
- **v4**: WebSocket connection loop fixes, state management
- **v3**: Production version with enterprise features and memory optimization  
- **v1**: Initial basic integration script

**updated Key Improvements:**
- 6 critical WebSocket stability fixes implemented
- Configurable hardware connection endpoints
- Enhanced bandwidth control (1,000 vs 60,000 line limits)
- Production-ready logging with request/response tracking
- Cross-platform UTF-8 encoding support