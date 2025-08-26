# Local Setup Instructions for Scripts

This document provides detailed instructions for running the EcoG JavaScript scripts locally on both laptop and charger environments. This guide focuses exclusively on the Node.js scripts and does not cover HMI applications.

## Table of Contents
- [Running Scripts on Laptop (Development Environment)](#running-scripts-on-laptop-development-environment)
- [Running Scripts on Charger (Production Environment)](#running-scripts-on-charger-production-environment)

---

## Running Scripts on Laptop (Development Environment)

### Prerequisites

#### System Requirements
- **Operating System**: Windows 10/11, macOS, or Linux
- **Node.js**: Version 12.x (specifically required)
- **npm**: Comes with Node.js installation
- **Git**: For version control

#### Node.js Installation

1. **Install Node.js Version 12**
   ```bash
   # Download Node.js 12.x from https://nodejs.org/download/release/
   # For Windows: Download node-v12.22.12-x64.msi
   # For macOS: Download node-v12.22.12.pkg
   # For Linux: Download node-v12.22.12-linux-x64.tar.xz
   
   # Verify installation
   node --version  # Should show v12.x.x
   npm --version
   ```

2. **Alternative: Using Node Version Manager (Recommended)**
   ```bash
   # For Windows (using nvm-windows)
   nvm install 12.22.12
   nvm use 12.22.12
   
   # For macOS/Linux (using nvm)
   curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
   nvm install 12.22.12
   nvm use 12.22.12
   ```

### Project Setup

#### 1. Create package.json File

Since the root directory doesn't have a package.json file, you need to create one:

```bash
# Navigate to the project root directory
cd /path/to/Ecog_SW

# Initialize npm project
npm init -y
```

Or manually create a `package.json` file with the following content:

```json
{
  "name": "ecog-scripts",
  "version": "1.0.0",
  "description": "EcoG charging station monitoring and control scripts",
  "main": "dlb.js",
  "type": "module",
  "scripts": {
    "start:dlb": "node dlb.js",
    "start:error-logging": "node ErrorStopLogging.js",
    "start:error-reporting": "node error-reporting.js",
    "dev:dlb": "nodemon dlb.js",
    "dev:error-logging": "nodemon ErrorStopLogging.js",
    "dev:error-reporting": "nodemon error-reporting.js"
  },
  "dependencies": {
    "node-fetch": "^2.6.7"
  },
  "devDependencies": {
    "nodemon": "^2.0.22"
  },
  "engines": {
    "node": "12.x"
  },
  "keywords": [
    "ecog",
    "charging-station",
    "load-balancing",
    "error-monitoring"
  ],
  "author": "EcoG Development Team",
  "license": "ISC"
}
```

#### 2. Install Dependencies

```bash
# Install required dependencies
npm install

# Install additional development tools (optional)
npm install --save-dev nodemon
```

### Script Configuration for Laptop Development

#### Important: IP Address Configuration

When running scripts from laptop, you **MUST** change the IP addresses from `localhost` to `10.20.27.50` to connect to the actual charger hardware.

#### 1. Dynamic Load Balancing Script (dlb.js)

**Configuration Changes Required:**

1. **Update Base URL:**
   ```javascript
   // Change this line (around line 12):
   const baseUrl = "http://localhost:3001";
   
   // To:
   const baseUrl = "http://10.20.27.50:3001";
   ```

2. **Add Fetch Import:**
   ```javascript
   // Uncomment this line at the top of the file (around line 10):
   import fetch from "node-fetch";
   ```

**Running the Script:**
```bash
# Method 1: Direct execution
node dlb.js

# Method 2: Using npm script
npm run start:dlb

# Method 3: Development mode with auto-restart
npm run dev:dlb
```

#### 2. Error Stop Logging Script (ErrorStopLogging.js)

**Configuration Changes Required:**

1. **Update URL Configuration:**
   ```javascript
   // Change this line (around line 13):
   const url = "localhost:3001";
   
   // To:
   const url = "10.20.27.50:3001";
   
   // Or uncomment the existing line:
   // const url = "10.20.27.50:3001";
   ```

2. **Add Fetch Import (if using ES modules):**
   ```javascript
   // Add at the top of the file:
   import fetch from "node-fetch";
   ```

**Running the Script:**
```bash
# Method 1: Direct execution
node ErrorStopLogging.js

# Method 2: Using npm script
npm run start:error-logging

# Method 3: Development mode with auto-restart
npm run dev:error-logging
```

#### 3. Error Reporting Script (error-reporting.js)

**Configuration Changes Required:**

1. **Update Base URLs:**
   ```javascript
   // Change these lines (around lines 116-117):
   const configEndpoint = "http://localhost:3001/db/config";
   const baseURL = "http://localhost:3001/";
   
   // To:
   const configEndpoint = "http://10.20.27.50:3001/db/config";
   const baseURL = "http://10.20.27.50:3001/";
   ```

2. **Add Fetch Import (if using ES modules):**
   ```javascript
   // Add at the top of the file:
   import fetch from "node-fetch";
   ```

**Running the Script:**
```bash
# Method 1: Direct execution
node error-reporting.js

# Method 2: Using npm script
npm run start:error-reporting

# Method 3: Development mode with auto-restart
npm run dev:error-reporting
```

### Development Workflow

#### 1. Quick Start Guide

```bash
# 1. Clone/navigate to project
cd /path/to/Ecog_SW

# 2. Ensure Node.js 12 is active
node --version  # Should show v12.x.x

# 3. Create package.json (if not exists)
npm init -y

# 4. Install dependencies
npm install node-fetch
npm install --save-dev nodemon

# 5. Update IP addresses in scripts (localhost -> 10.20.27.50)
# 6. Add fetch imports to scripts
# 7. Run desired script
npm run start:dlb
```

#### 2. Script Modification Checklist

Before running any script on laptop, ensure:

- [ ] Node.js version 12.x is installed and active
- [ ] package.json exists with node-fetch dependency
- [ ] All `localhost` references changed to `10.20.27.50`
- [ ] Fetch import added: `import fetch from "node-fetch";`
- [ ] Network connectivity to `10.20.27.50` is available

#### 3. Testing and Debugging

```bash
# Test network connectivity
ping 10.20.27.50
curl http://10.20.27.50:3001/status

# Run scripts with debug output
DEBUG=* node dlb.js

# Monitor script logs
tail -f /path/to/logfile
```

#### 4. Common Development Issues

**Issue 1: Fetch is not defined**
```bash
# Solution: Add import statement
import fetch from "node-fetch";
```

**Issue 2: Connection refused to localhost**
```bash
# Solution: Change localhost to 10.20.27.50 in all scripts
```

**Issue 3: Node version compatibility**
```bash
# Solution: Use Node.js version 12.x
nvm use 12.22.12
```

**Issue 4: Module not found**
```bash
# Solution: Install dependencies
npm install
```

### Environment Variables (Optional)

Create a `.env` file for easier configuration:

```bash
# .env file
CHARGER_IP=10.20.27.50
CHARGER_PORT=3001
NODE_ENV=development
DEBUG_MODE=true
```

Then modify scripts to use environment variables:
```javascript
// Add to scripts
const CHARGER_IP = process.env.CHARGER_IP || '10.20.27.50';
const CHARGER_PORT = process.env.CHARGER_PORT || '3001';
const baseUrl = `http://${CHARGER_IP}:${CHARGER_PORT}`;
```

---

## Uploading Scripts to Charger (Production Environment)

### Prerequisites

#### Hardware Requirements
- **Charger Hardware**: EcoG charging station with embedded Linux
- **Network**: WiFi or LAN connection between laptop and charger
- **Laptop**: Development machine with Node.js 12.x installed
- **Browser**: For accessing Swagger API interface

#### Software Requirements
- **Node.js**: Version 12.x on laptop for testing
- **Network access**: To charger's Swagger API interface
- **Text Editor**: For modifying script configurations

### Script Upload Process

#### Step 1: Prepare Script for Upload

Before uploading any script to the charger, you must prepare it properly:

##### 1.1 Test Script Locally with Node.js 12

```bash
# Ensure Node.js 12 is active
node --version  # Should show v12.x.x

# If using nvm, switch to Node.js 12
nvm use 12.22.12

# Test the script locally first
node dlb.js
# or
node ErrorStopLogging.js
# or
node error-reporting.js
```

**Verify the script runs without errors before proceeding.**

##### 1.2 Update IP Address Configuration

**IMPORTANT**: Change IP addresses from `10.20.27.50` to `localhost` for charger deployment.

**For dlb.js:**
```javascript
// Change this line:
const baseUrl = "http://10.20.27.50:3001";

// To:
const baseUrl = "http://localhost:3001";
```

**For ErrorStopLogging.js:**
```javascript
// Change this line:
const url = "10.20.27.50:3001";

// To:
const url = "localhost:3001";
```

**For error-reporting.js:**
```javascript
// Change these lines:
const configEndpoint = "http://10.20.27.50:3001/db/config";
const baseURL = "http://10.20.27.50:3001/";

// To:
const configEndpoint = "http://localhost:3001/db/config";
const baseURL = "http://localhost:3001/";
```

##### 1.3 Comment Out Fetch Import

**IMPORTANT**: Comment out the fetch import statements in all scripts.

```javascript
// Comment out this line in all scripts:
// import fetch from "node-fetch";

// The charger environment has fetch available globally
```

##### 1.4 Final Local Test

After making the above changes, test the script one more time locally:

```bash
# Test the modified script
node dlb.js
```

**Note**: The script may fail to connect (since localhost:3001 may not be available on your laptop), but it should not have syntax errors.

#### Step 2: Connect to Charger Environment

##### 2.1 Network Connection

```bash
# Connect laptop to charger via WiFi or LAN
# Ensure you can ping the charger
ping <charger-ip-address>

# Example:
ping 192.168.1.100
```

#### Step 3: Check Active Scripts

##### 3.1 View Current Scripts

1. In Swagger interface, locate the **Scripts** section
2. Find the `GET /scripts` endpoint
3. Click "Try it out" and then "Execute"
4. Review the response to see currently active scripts

**Example Response:**
```json
{
  "active": [
    "ErrorStopLogging.js",
    "SmartChargingWithDLB.js",
    "autocharge.js",
    "dlb.js",
    "outOfOrder.js",
    "readerStatus.js"
  ],
  "installed": [
    "ErrorStopLogging.js",
    "SmartChargingWithDLB.js",
    "autocharge.js",
    "dlb.js",
    "outOfOrder.js",
    "readerStatus.js"
  ]
}
```

#### Step 4: Remove Existing Script (If Present)

##### 4.1 Delete Existing Script

If the script you want to upload already exists:

1. In Swagger interface, find the `DELETE /scripts/active/{scriptName}` endpoint
2. Click "Try it out"
3. Enter the script name (e.g., "dlb.js")
4. Click "Execute"
5. Verify successful deletion (HTTP 200 response)

**Example:**
```
DELETE /scripts/active/dlb.js
```

##### 4.2 Restart Charger

**IMPORTANT**: After deleting a script, restart the charger to ensure complete removal.

```bash
# If you have SSH access to charger:
ssh user@charger-ip
sudo reboot

# Or use the charger's physical restart button
# Wait for charger to fully boot up (2-3 minutes)
```

##### 4.3 Verify Script Removal

After charger restart:

1. Use `GET /scripts` endpoint
2. Confirm the deleted script is no longer in the 'active' or 'installed' arrays

#### Step 5: Upload Updated Script

##### 5.1 Upload Script via Swagger

1. In Swagger interface, locate the `PUT scripts/active/{scriptName}` endpoint

2. Click "Try it out"
3. In the request body, provide the script details:

**Example Request Body:**
```json
{
  "scriptName": "dlb.js",
  "scriptContent": "// Your entire script content here\n// Make sure to escape special characters\n// and use proper JSON formatting",
  "description": "Dynamic Load Balancing Script",
  "autoStart": true
}
```
##### 5.2 Verify Upload Success

After upload:

1. Check the response status (should be HTTP 200 or 201)
2. Use `GET /scripts` to verify the script appears in both 'active' and 'installed' arrays
3. Verify the script is listed in the 'active' array indicating it's running

**Example Verification:**
```json
{
  "active": [
    "ErrorStopLogging.js",
    "dlb.js",
    "autocharge.js"
  ],
  "installed": [
    "ErrorStopLogging.js",
    "dlb.js",
    "autocharge.js",
    "outOfOrder.js"
  ]
}
```

### Complete Upload Workflow Example

#### Example: Uploading dlb.js

```bash


### Troubleshooting Upload Issues

#### Common Upload Problems

**Issue 1: Script upload fails**
```bash
# Check script syntax
node -c dlb.js  # Check for syntax errors

# Verify JSON formatting in Swagger request
# Ensure special characters are properly escaped
```

**Issue 2: Script shows as "error" status**
```bash
# Check script logs via Swagger
# GET /scripts/{scriptName}/logs

# Common issues:
# - Incorrect localhost configuration
# - Fetch import not commented out
# - Missing dependencies
```

**Issue 3: Cannot access Swagger interface**
```bash
# Check network connectivity
ping <charger-ip>
telnet <charger-ip> 3001

# Verify charger is fully booted
# Wait 2-3 minutes after restart
```

**Issue 4: Script deletion fails**
```bash
# Ensure script is stopped first
# Use POST /scripts/{scriptName}/stop

# Then delete
# DELETE /scripts/{scriptName}
```

#### Script Validation Checklist

Before uploading, ensure:

- [ ] Script tested locally with Node.js 12.x
- [ ] All IP addresses changed from `10.20.27.50` to `localhost`
- [ ] Fetch import statements commented out
- [ ] No syntax errors in script
- [ ] Network connection to charger established
- [ ] Swagger interface accessible
- [ ] Existing script (if any) properly deleted
- [ ] Charger restarted after deletion

### Security and Best Practices

#### Upload Security

1. **Script Validation**: Always test scripts locally before upload
2. **Backup**: Keep backup of working scripts before updates
3. **Incremental Updates**: Upload one script at a time
4. **Monitoring**: Monitor script status after upload

#### Network Security

```bash
# Use secure network connection
# Avoid public WiFi for script uploads
# Ensure charger network is isolated
```

#### Version Control

---

## Summary

### Key Points to Remember

1. **Node.js Version**: Always use Node.js version 12.x
2. **IP Address Configuration**:
   - **Laptop Development**: Change `localhost` to `10.20.27.50`
   - **Charger Production**: Keep `localhost`
3. **Fetch Import**: Add `import fetch from "node-fetch";` to all scripts
4. **Package.json**: Create proper package.json with node-fetch dependency
5. **Service Management**: Use systemd services on charger for reliability

### Quick Reference Commands

```bash
# Development (Laptop)
node --version  # Check Node.js 12.x
npm install node-fetch  # Install fetch
node dlb.js  # Run script

# Production (Charger)
sudo systemctl status ecog-dlb.service  # Check service
sudo journalctl -u ecog-dlb.service -f  # View logs
sudo systemctl restart ecog-dlb.service  # Restart service
```

---

*Last Updated: January 2024*
*Version: 2.0*