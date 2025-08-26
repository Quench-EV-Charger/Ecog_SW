# HMI Setup Instructions - Common (Customer Specific)

This document provides detailed instructions for setting up and running the ADOR Display UI (Customer Specific) application locally on a laptop while connected to a charger.

## Prerequisites

- **Node.js**: Version 14.x (Required - newer versions may cause compatibility issues)
- **npm**: Version 6.x or higher (comes with Node.js 14)
- **Network Connection**: WiFi or LAN connection to charger network
- **Charger IP**: Access to charger at IP address `10.20.27.50`
- **Laptop connected to charger**: Your laptop must be connected to the charger via Wi-Fi or LAN

> **Important**: These setup steps should be performed while running the HMI code on your laptop, with the laptop connected to the charger.

## Installation Steps

**Important**: Ensure your laptop is connected to the charger (IP: 10.20.27.50) via Wi-Fi or LAN before proceeding with these steps. The HMI application will run on your laptop while communicating with the charger.

### 1. Verify Node.js Version

```bash
# Check Node.js version (should be 14.x)
node --version

# If you don't have Node.js 14, download and install from:
# https://nodejs.org/download/release/v14.21.3/
```

### 2. Navigate to Project Directory

```bash
# Navigate to the Common HMI project directory
cd hmi/common/ador-display-customerSpecific
```

### 3. Install Dependencies

```bash
# Install all required dependencies
npm install
```

### 4. Configure API Endpoints

Update the application configuration to connect to the charger instead of localhost:

**Find and update these configurations in your application:**

```javascript
// Change from:
"API": "http://localhost:3001"
"socketUrl": "ws://localhost:3001"

// Change to:
"API": "http://10.20.27.50:3001"
"socketUrl": "ws://10.20.27.50:3001"
```

**Common locations for these configurations:**
- `src/config/config.js`
- `src/constants/api.js`
- `src/utils/constants.js`
- Environment files (`.env`, `.env.local`)

### 5. Update Package.json Scripts

Modify the `package.json` file to include the legacy OpenSSL provider option:

```bash
# Open package.json and update the scripts section
```

**Change from:**
```json
{
  "scripts": {
    "start": "react-scripts start",
    "build": "react-scripts build"
  }
}
```

**Change to:**
```json
{
  "scripts": {
    "start": "set NODE_OPTIONS=--openssl-legacy-provider && react-scripts start",
    "build": "set NODE_OPTIONS=--openssl-legacy-provider && react-scripts build"
  }
}
```

### 6. Network Connection Setup

**Option A: WiFi Connection**
1. Connect your laptop to the charger's WiFi network
2. Ensure you can ping the charger: `ping 10.20.27.50`
3. Verify charger API is accessible: Open `http://10.20.27.50:3001` in browser

**Option B: LAN Connection**
1. Connect your laptop to the same LAN as the charger
2. Ensure your laptop's IP is in the same subnet as `10.20.27.50`
3. Test connectivity: `ping 10.20.27.50`

### 7. Start the Development Server

```bash
# Start the HMI application
npm start
```

The application will:
- Start on `http://localhost:3000`
- Connect to charger APIs at `http://10.20.27.50:3001`
- Establish WebSocket connection to `ws://10.20.27.50:3001`

## Verification Steps

### 1. Check Application Startup
- Browser should automatically open to `http://localhost:3000`
- No compilation errors should appear in terminal
- Application should load without JavaScript errors

### 2. Verify Charger Connection
- Check browser developer console for network requests
- Ensure API calls are going to `10.20.27.50:3001`
- Verify WebSocket connection is established
- Test real-time data updates from charger

### 3. Test Core Functionality
- Navigate through different screens
- Test RFID/PIN authorization flows
- Verify charging session management
- Check real-time status updates

## Troubleshooting

### Common Issues

**1. Node.js Version Conflicts**
```bash
# Error: digital envelope routines::unsupported
# Solution: Ensure Node.js 14.x is installed and package.json scripts include NODE_OPTIONS
```

**2. Network Connection Issues**
```bash
# Cannot connect to 10.20.27.50
# Check network connectivity:
ping 10.20.27.50
telnet 10.20.27.50 3001
```

**3. API Configuration Not Updated**
```bash
# Still connecting to localhost
# Search for localhost references:
grep -r "localhost:3001" src/
# Update all instances to 10.20.27.50:3001
```

**4. WebSocket Connection Failures**
- Check firewall settings
- Verify charger WebSocket server is running
- Ensure correct protocol (ws:// not wss://)

**5. CORS Issues**
- Charger may need CORS configuration for laptop IP
- Contact system administrator if cross-origin requests are blocked

### Debug Commands

```bash
# Check network connectivity
ping 10.20.27.50

# Test API endpoint
curl http://10.20.27.50:3001/api/status

# Check Node.js version
node --version

# Clear npm cache if needed
npm cache clean --force

# Reinstall dependencies
rm -rf node_modules package-lock.json
npm install
```

## Development Tips

### Browser Developer Tools
- **Network Tab**: Monitor API calls to charger
- **Console Tab**: Check for JavaScript errors
- **WebSocket Tab**: Verify real-time connections

### Configuration Management
- Keep a backup of original localhost configuration
- Use environment variables for easy switching between local/charger modes
- Document any additional configuration changes needed

### Performance Monitoring
- Monitor network latency to charger
- Check for timeout issues with slower network connections
- Test with different network conditions

## File Locations Reference

**Key files to modify:**
- `package.json` - Update start/build scripts
- `src/config/*` - API endpoint configurations
- `src/constants/*` - Application constants
- `.env` files - Environment variables

**Files to check for localhost references:**
- All JavaScript files in `src/` directory
- Configuration files
- Environment files
- Any hardcoded API endpoints

## Support

If you encounter issues:
1. Check this troubleshooting guide first
2. Verify network connectivity to charger
3. Ensure Node.js 14.x is properly installed
4. Contact the development team with specific error messages

## Quick Reference

```bash
# Complete setup commands
cd hmi/common/ador-display-customerSpecific
npm install
# Update package.json scripts (manual step)
# Update API endpoints to 10.20.27.50 (manual step)
npm start
```

**Required Changes Summary:**
- Node.js version: 14.x
- API URL: `http://localhost:3001` → `http://10.20.27.50:3001`
- Socket URL: `ws://localhost:3001` → `ws://10.20.27.50:3001`
- Package.json scripts: Add `NODE_OPTIONS=--openssl-legacy-provider`