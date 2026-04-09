# HMI Setup Instructions - MSIL

## Prerequisites

Before setting up the MSIL HMI application, ensure you have:

- **Node.js 18.x**: Download from [Node.js Official Website](https://nodejs.org/en/download/)
- **npm 8.x or higher**: Comes with Node.js
- **Network connection to charger**: Charger should be accessible at IP `10.20.27.50`
- **Laptop connected to charger**: Your laptop must be connected to the charger via Wi-Fi or LAN

> **Important**: These setup steps should be performed while running the HMI code on your laptop, with the laptop connected to the charger.

## Installation Steps

**Important**: Ensure your laptop is connected to the charger (IP: 10.20.27.50) via Wi-Fi or LAN before proceeding with these steps. The HMI application will run on your laptop while communicating with the charger.

Follow these steps to set up the MSIL HMI application:

### 1. Verify Node.js Version

```bash
node --version
```

Ensure you have Node.js 18.x installed. If not, download and install from the official website.

### 2. Navigate to Project Directory

```bash
cd hmi/msil/ador-display-splitScreenHMI
```

### 3. Install Dependencies

```bash
npm install
```

### 4. Configure API Endpoints

You need to update the API and socket URLs from `localhost` to the charger's IP address `10.20.27.50`.

**Find and update these configurations in your project files:**

- Change `"API": "http://localhost:3001"` to `"API": "http://10.20.27.50:3001"`
- Change `"socketUrl": "ws://localhost:3001"` to `"socketUrl": "ws://10.20.27.50:3001"`

**Common locations to check:**
- `src/config/config.js`
- `src/constants/api.js`
- `public/config.json`
- Environment files (`.env`, `.env.local`)

### 5. Update Package.json Scripts (if needed)

If you encounter OpenSSL legacy provider issues with Node.js 18, update the scripts in `package.json`:

```json
{
  "scripts": {
    "start": "set NODE_OPTIONS=--openssl-legacy-provider && react-scripts start",
    "build": "set NODE_OPTIONS=--openssl-legacy-provider && react-scripts build"
  }
}
```

### 6. Network Connection Setup

**Option A: Wi-Fi Connection**
1. Connect your laptop to the same Wi-Fi network as the charger
2. Ensure the charger is accessible at `10.20.27.50`
3. Test connectivity: `ping 10.20.27.50`

**Option B: LAN Connection**
1. Connect your laptop directly to the charger via Ethernet cable
2. Configure your network adapter if needed
3. Test connectivity: `ping 10.20.27.50`

### 7. Start Development Server

```bash
npm start
```

The application will start on `http://localhost:3000` and connect to the charger at `10.20.27.50:3001`.

## Verification

After starting the application:

1. **Check Console**: Look for successful API connections in browser console
2. **Network Tab**: Verify requests are going to `10.20.27.50:3001`
3. **WebSocket**: Confirm WebSocket connection to `ws://10.20.27.50:3001`
4. **HMI Functionality**: Test basic HMI features to ensure proper communication

## Troubleshooting

### Node.js Version Issues
```bash
# Check current version
node --version

# If wrong version, install Node.js 18.x from official website
# Or use nvm (Node Version Manager)
nvm install 18
nvm use 18
```

### Network Connection Issues
```bash
# Test charger connectivity
ping 10.20.27.50

# Check if port 3001 is accessible
telnet 10.20.27.50 3001
```

### API Configuration Issues
- Double-check all `localhost` references are changed to `10.20.27.50`
- Verify JSON syntax in configuration files
- Clear browser cache and restart development server

### WebSocket Connection Failures
- Ensure WebSocket URL uses `ws://` protocol
- Check firewall settings on both laptop and charger
- Verify charger's WebSocket service is running

### CORS Issues
- Charger should be configured to allow requests from your laptop's IP
- Check browser console for CORS-related errors

## Debug Commands

```bash
# Check network configuration
ipconfig /all

# Test API endpoint
curl http://10.20.27.50:3001/api/status

# View detailed npm logs
npm start --verbose
```

## Development Tips

1. **Hot Reload**: Changes to source files will automatically reload the browser
2. **Browser DevTools**: Use Network tab to monitor API calls
3. **Console Logging**: Add console.log statements for debugging
4. **Component Inspector**: Use React Developer Tools browser extension

## File Locations

- **Project Root**: `hmi/msil/ador-display-splitScreenHMI/`
- **Source Code**: `src/`
- **Configuration**: Look for config files in `src/config/` or `public/`
- **Package File**: `package.json`

## Quick Reference

**Required Changes:**
- Node.js version: 18.x
- API URL: `http://localhost:3001` → `http://10.20.27.50:3001`
- Socket URL: `ws://localhost:3001` → `ws://10.20.27.50:3001`
- Network: Laptop connected to charger via Wi-Fi or LAN

**Start Command:**
```bash
npm start
```

**Access URL:**
- HMI Application: `http://localhost:3000`
- Charger API: `http://10.20.27.50:3001` (Split Screen HMI)