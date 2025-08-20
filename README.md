# Ecog_Related_SW

This repository contains software components for the EcoG electric vehicle charging system, including HMI applications, monitoring scripts, and NOC client functionality.

## Project Structure

```
Ecog_SW/
├── README.md                    # This file
├── ErrorStopLogging.js         # Error tracking and logging script
├── dlb.js                      # Dynamic Load Balancing & Smart Charging
├── error-reporting.js          # Error monitoring and reporting system
├── hmi/                        # Human Machine Interface applications
│   ├── common/                 # Common HMI components
│   │   └── ador-display-customerSpecific/  # Customer-specific display app
│   └── msil/                   # MSIL-specific HMI
│       └── ador-display-splitScreenHMI/    # Split-screen HMI display
└── noc/                        # Network Operations Center client
    ├── cms_script.py           # CMS monitoring and data collection
    ├── Dockerfile              # Container configuration
    └── requirements.txt        # Python dependencies
```

## Scripts Overview

### Root Level Scripts

#### 1. ErrorStopLogging.js
- **Purpose**: Tracks start/stop times for various errors and alerts in the charging system
- **Features**:
  - Maps vendor-specific error codes
  - Monitors error states and logs durations
  - Integrates with the charger state API
- **Key Error Types**: Power loss, emergency stop, door open, temperature warnings, voltage issues, module failures

#### 2. dlb.js (Dynamic Load Balancing)
- **Purpose**: Implements full load balancing and smart charging functionality
- **Features**:
  - Manages power distribution across multiple charging outlets
  - Implements smart charging limits based on available power
  - Handles CAN communication for module control
  - Supports multiple charging scenarios
- **Configuration**: 
  - Default modules: 2
  - Power cap: 60kW (2 × 30kW)
  - Dynamic power demand calculation

#### 3. error-reporting.js
- **Purpose**: Comprehensive error monitoring and reporting system
- **Features**:
  - Monitors I/O errors, temperature errors, and supply voltage errors
  - IMD (Insulation Monitoring Device) resistance monitoring
  - Implements mutex mechanism to prevent race conditions
  - Power save mode support during idle states
  - Automatic error recovery and retry logic
- **Version**: 1.0.5 (Modified August 2025)

### NOC Scripts

#### cms_script.py
- **Purpose**: NOC client for continuous monitoring and data collection
- **Features**:
  - WebSocket communication with CMS server
  - Real-time state monitoring
  - Log collection and processing (state logs, OCPP logs)
  - Memory-efficient log handling with configurable limits
  - Automatic reconnection and error recovery
- **Configurable Limits**:
  - Max response size: 70MB
  - Max state log lines: 200,000
  - Max OCPP log lines: 200,000
  - Max OCPP process lines: 500,000

### Build Scripts

#### HMI Build Scripts
Located in `hmi/*/buildscripts/`:
- **postbuild.js**: Post-build processing
- **version.js**: Version management
- **helpers.js**: Build utility functions

## HMI Applications

### 1. Customer-Specific Display (common/ador-display-customerSpecific)
- React-based single-page application
- Features: Authentication, charging modes, session management, multi-language support
- Components: Charging progress, RFID authentication, temperature monitoring, error handling

### 2. Split-Screen HMI (msil/ador-display-splitScreenHMI)
- Dual-outlet display interface
- Redux state management
- Real-time charging status for multiple outlets
- MQTT communication for state updates

## Key Technologies

- **Frontend**: React, Redux, styled-components
- **Backend Integration**: WebSocket, MQTT, REST APIs
- **Languages**: JavaScript (Node.js), Python
- **Protocols**: OCPP, CAN bus communication
- **Containerization**: Docker support for NOC deployment

## Error Handling

The system implements comprehensive error handling across multiple levels:
1. Hardware errors (temperature, voltage, module failures)
2. Communication errors (CAN, module communication)
3. Safety errors (emergency stop, door open, ground fault)
4. Operational errors (IMD resistance, power failures)

## Monitoring and Logging

- Real-time state monitoring via WebSocket
- Persistent error logging with duration tracking
- OCPP protocol logging for charging sessions
- Memory-efficient log rotation and processing

## Configuration

Most scripts use localhost connections by default but can be configured for remote endpoints:
- State API: `http://localhost:3001/state`
- CMS Server: `https://quenchcms.com/`

## Development Notes

- The codebase follows EcoG licensing and is intended for use with EcoG OS only
- Error recovery mechanisms are built into all critical components
- Memory management is optimized for embedded/industrial systems
- Signal handling is Docker/Yocto compatible