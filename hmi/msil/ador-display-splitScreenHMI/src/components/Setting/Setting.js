import React, { useContext, useState, useEffect } from "react";
import { useSelector } from "react-redux";
import { 
  FaShieldAlt, 
  FaBolt, 
  FaCog, 
  FaQrcode, 
  FaLock, 
  FaUnlock,
  FaDesktop,
  FaMicrochip,
  FaEye,
  FaEyeSlash,
  FaWifi,
  FaThermometerHalf,
  FaBatteryFull,
  FaPlug
} from "react-icons/fa";
import { ThemeContext } from "../ThemeContext/ThemeProvider";

// Password Protection Component
const PasswordProtection = ({ onAuthenticated, theme }) => {
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [attempts, setAttempts] = useState(0);
  
  const isDark = theme === "dark";
  const styles = getStyles(isDark, isDark ? "#f5f5f5" : "#000000", isDark ? "transparent" : "#ffffff");

  const ADMIN_PASSWORD = "admin123"; // Mock password - replace with secure implementation
  const MAX_ATTEMPTS = 3;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (password === ADMIN_PASSWORD) {
      onAuthenticated();
      setError("");
      setAttempts(0);
    } else {
      setAttempts(prev => prev + 1);
      setError(`Invalid password. Attempts: ${attempts + 1}/${MAX_ATTEMPTS}`);
      setPassword("");
      
      if (attempts + 1 >= MAX_ATTEMPTS) {
        setError("Too many failed attempts. Please try again later.");
        setTimeout(() => {
          setAttempts(0);
          setError("");
        }, 30000); // 30 second lockout
      }
    }
  };

  const isLocked = attempts >= MAX_ATTEMPTS;

  return (
    <div style={{
      ...styles.container,
      backgroundColor: isDark ? "transparent" : "#ffffff",
      color: isDark ? "#f5f5f5" : "#000000",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      minHeight: "75vh"
    }}>
      <div style={{
        // background: isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.05)",
        padding: "2rem",
        borderRadius: "15px",
        // border: `2px solid ${isDark ? "rgb(136 171 226)" : "#ff0000"}`,
        boxShadow: `0 0 20px ${isDark ? "rgba(136,171,226,0.3)" : "rgba(255,0,0,0.3)"}`,
        width: "100%",
        maxWidth: "400px"
      }}>
        <div style={{ textAlign: "center", marginBottom: "2rem" }}>
          <FaLock style={{ 
            fontSize: "3rem", 
            color: isDark ? "rgb(136 171 226)" : "#ff0000",
            marginBottom: "1rem"
          }} />
          <h2 style={{ 
            margin: 0, 
            color: isDark ? "#f5f5f5" : "#000000",
            fontSize: "1.5rem"
          }}>Settings Access</h2>
          <p style={{ 
            margin: "0.5rem 0 0 0", 
            color: isDark ? "#cccccc" : "#666666",
            fontSize: "0.9rem"
          }}>Enter administrator password</p>
        </div>

        <form onSubmit={handleSubmit}>
          <div style={{ position: "relative", marginBottom: "1rem" }}>
            <input
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter password"
              disabled={isLocked}
              style={{
                width: "92%",
                padding: "12px 12px 12px 12px",
                border: `2px solid ${error ? "#ff4444" : (isDark ? "rgb(136 171 226)" : "#ff0000")}`,
                borderRadius: "8px",
                background: isDark ? "rgba(255,255,255,0.1)" : "#ffffff",
                color: isDark ? "#ffffff" : "#000000",
                fontSize: "1rem",
                outline: "none",
                opacity: isLocked ? 0.5 : 1
              }}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              disabled={isLocked}
              style={{
                position: "absolute",
                right: "10px",
                top: "50%",
                transform: "translateY(-50%)",
                background: "none",
                border: "none",
                color: isDark ? "rgb(136 171 226)" : "#ff0000",
                cursor: isLocked ? "not-allowed" : "pointer",
                fontSize: "1rem",
                opacity: isLocked ? 0.5 : 1
              }}
            >
              {showPassword ? <FaEyeSlash /> : <FaEye />}
            </button>
          </div>

          {error && (
            <div style={{
              color: "#ff4444",
              fontSize: "0.85rem",
              marginBottom: "1rem",
              textAlign: "center",
              padding: "0.5rem",
              background: "rgba(255,68,68,0.1)",
              borderRadius: "5px",
              border: "1px solid rgba(255,68,68,0.3)"
            }}>
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={!password || isLocked}
            style={{
              width: "100%",
              padding: "12px",
              background: (!password || isLocked) ? "#666666" : 
                         (isDark ? "rgb(136 171 226)" : "#ff0000"),
              color: "#ffffff",
              border: "none",
              borderRadius: "8px",
              fontSize: "1rem",
              cursor: (!password || isLocked) ? "not-allowed" : "pointer",
              transition: "all 0.3s ease",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "8px"
            }}
          >
            <FaUnlock />
            {isLocked ? "Locked" : "Unlock Settings"}
          </button>
        </form>

        {/* <div style={{
          marginTop: "1.5rem",
          padding: "1rem",
          background: isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.05)",
          borderRadius: "8px",
          fontSize: "0.8rem",
          color: isDark ? "#cccccc" : "#666666"
        }}>
          <strong>Demo Password:</strong> admin123<br/>
          <small>In production, use secure authentication</small>
        </div> */}
      </div>
    </div>
  );
};

// Toggle Setting Component
const ToggleSetting = ({ icon, label, description, color, enabled, onToggle, disabled = false }) => {
  const { theme } = useContext(ThemeContext);
  const isDark = theme === "dark";
  const styles = getStyles(isDark, isDark ? "#f5f5f5" : "#000000", isDark ? "transparent" : "#ffffff");
  
  return (
  <div style={styles.settingRow}>
    <div style={styles.labelContainer}>
      <span style={styles.label}>
        {React.cloneElement(icon, { style: { marginRight: "8px", color } })}
        {label}
      </span>
      {description && (
        <span style={styles.description}>{description}</span>
      )}
    </div>
    <div
      style={{
        ...styles.toggle,
        background: enabled
          ? `linear-gradient(90deg, ${color}, #0ff, #00f)`
          : "#333",
        boxShadow: enabled ? `0 0 10px ${color}` : "none",
        opacity: disabled ? 0.4 : 1,
        cursor: disabled ? "not-allowed" : "pointer",
      }}
      onClick={!disabled ? onToggle : undefined}
    >
      <div
        style={{
          ...styles.toggleCircle,
          transform: enabled ? "translateX(24px)" : "translateX(0)",
          background: enabled
            ? `radial-gradient(circle, #000 40%, ${color})`
            : "#888",
          boxShadow: enabled ? `0 0 8px ${color}` : "none",
        }}
      />
    </div>
  </div>
  );
};

// Number Setting Component
const NumberSetting = ({ icon, label, description, color, value, onValueChange, min = 0, max = 100, unit = "" }) => {
  const { theme } = useContext(ThemeContext);
  const isDark = theme === "dark";
  const styles = getStyles(isDark, isDark ? "#f5f5f5" : "#000000", isDark ? "transparent" : "#ffffff");
  
  const handleIncrement = () => {
    if (value < max) onValueChange(value + 1);
  };

  const handleDecrement = () => {
    if (value > min) onValueChange(value - 1);
  };

  return (
    <div style={styles.settingRow}>
      <div style={styles.labelContainer}>
        <span style={styles.label}>
          {React.cloneElement(icon, { style: { marginRight: "8px", color } })}
          {label}
        </span>
        {description && (
          <span style={styles.description}>{description}</span>
        )}
      </div>
      <div style={styles.numberControl}>
        <button 
          onClick={handleDecrement}
          disabled={value <= min}
          style={{
            ...styles.numberButton,
            opacity: value <= min ? 0.4 : 1,
            cursor: value <= min ? "not-allowed" : "pointer"
          }}
        >
          -
        </button>
        <span style={styles.numberValue}>
          {value}{unit}
        </span>
        <button 
          onClick={handleIncrement}
          disabled={value >= max}
          style={{
            ...styles.numberButton,
            opacity: value >= max ? 0.4 : 1,
            cursor: value >= max ? "not-allowed" : "pointer"
          }}
        >
          +
        </button>
      </div>
    </div>
  );
};

// Text Setting Component
const TextSetting = ({ icon, label, description, color, value, onValueChange }) => {
  const { theme } = useContext(ThemeContext);
  const isDark = theme === "dark";
  const styles = getStyles(isDark, isDark ? "#f5f5f5" : "#000000", isDark ? "transparent" : "#ffffff");
  
  const handleChange = (e) => {
    onValueChange(e.target.value);
  };

  return (
    <div style={styles.settingRow}>
      <div style={styles.labelContainer}>
        <span style={styles.label}>
          {React.cloneElement(icon, { style: { marginRight: "8px", color } })}
          {label}
        </span>
        {description && (
          <span style={styles.description}>{description}</span>
        )}
      </div>
      <input
        type="text"
        value={value || ''}
        onChange={handleChange}
        style={styles.textInput}
        placeholder="Enter value..."
      />
    </div>
  );
};

// Main Settings Component
function Setting() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [activeTab, setActiveTab] = useState("software");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const { theme } = useContext(ThemeContext);
  const Store = useSelector((state) => state.charging);
  const {
    config,
  } = Store;


  // Configuration State - will be populated from API
  const [softwareConfig, setSoftwareConfig] = useState({});
  const [hardwareConfig, setHardwareConfig] = useState({});
  const [rawConfig, setRawConfig] = useState({});

  // API Functions
  const fetchConfiguration = async () => {
    setLoading(true);
    setError(null);
    const API = config?.API;

    try {
      const response = await fetch(`${API}/ocpp-client/config`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const ocppconfig = await response.json();
      setRawConfig(ocppconfig);
      categorizeConfiguration(ocppconfig);
    } catch (err) {
       setError(`Failed to fetch configuration: ${err.message}`);
       console.error('Error fetching configuration:', err);
       // Clear any existing configuration on error
       setRawConfig({});
       setSoftwareConfig({});
       setHardwareConfig({});
    } finally {
      setLoading(false);
    }
  };

  const updateConfiguration = async (updatedConfig) => {
    setLoading(true);
    setError(null);
     const API = config?.API;
    try {
      const response = await fetch(`${API}/ocpp-client/config`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updatedConfig)
      });
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const result = await response.json();
      setRawConfig(updatedConfig);
      categorizeConfiguration(updatedConfig);
      return result;
    } catch (err) {
      setError(`Failed to update configuration: ${err.message}`);
      console.error('Error updating configuration:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Helper function to generate human-readable labels
  const generateLabel = (key) => {
    return key
      .replace(/([A-Z])/g, ' $1') // Add space before capital letters
      .replace(/^./, str => str.toUpperCase()) // Capitalize first letter
      .replace(/\b\w/g, l => l.toUpperCase()); // Capitalize each word
  };

  // Helper function to determine input type based on value
  const getInputType = (value) => {
    if (typeof value === 'boolean') return 'toggle';
    if (typeof value === 'number') return 'number';
    return 'text';
  };

  // Helper function to get appropriate icon based on key name
  const getSettingIcon = (key) => {
    const keyLower = key.toLowerCase();
    if (keyLower.includes('update') || keyLower.includes('auto')) return <FaShieldAlt />;
    if (keyLower.includes('debug') || keyLower.includes('log')) return <FaBolt />;
    if (keyLower.includes('data') || keyLower.includes('qr')) return <FaQrcode />;
    if (keyLower.includes('remote') || keyLower.includes('wifi') || keyLower.includes('network')) return <FaWifi />;
    if (keyLower.includes('screen') || keyLower.includes('display')) return <FaDesktop />;
    if (keyLower.includes('refresh') || keyLower.includes('rate')) return <FaBolt />;
    if (keyLower.includes('session') || keyLower.includes('plug')) return <FaPlug />;
    if (keyLower.includes('power') || keyLower.includes('battery')) return <FaBatteryFull />;
    if (keyLower.includes('temperature') || keyLower.includes('temp')) return <FaThermometerHalf />;
    if (keyLower.includes('emergency') || keyLower.includes('stop') || keyLower.includes('safety')) return <FaShieldAlt />;
    if (keyLower.includes('current') || keyLower.includes('voltage') || keyLower.includes('ground')) return <FaBolt />;
    if (keyLower.includes('fan') || keyLower.includes('cooling')) return <FaCog />;
    return <FaCog />; // Default icon
  };

  // Helper function to get appropriate color based on key name
  const getSettingColor = (key) => {
    const keyLower = key.toLowerCase();
    if (keyLower.includes('emergency') || keyLower.includes('stop')) return '#ff0000';
    if (keyLower.includes('temperature') || keyLower.includes('temp')) return '#ff4400';
    if (keyLower.includes('power') || keyLower.includes('auto')) return '#00ff00';
    if (keyLower.includes('debug') || keyLower.includes('ground')) return '#ffaa00';
    if (keyLower.includes('current') || keyLower.includes('refresh')) return '#ff6600';
    if (keyLower.includes('voltage') || keyLower.includes('data')) return '#ff0000';
    if (keyLower.includes('remote') || keyLower.includes('limit')) return '#ff0066';
    if (keyLower.includes('screen') || keyLower.includes('session')) return '#9966ff';
    if (keyLower.includes('fan') || keyLower.includes('cooling')) return '#00aaff';
    return '#00ffaa'; // Default color
  };

  // Categorize configuration into software and hardware
  const categorizeConfiguration = (config) => {
    const softwareKeys = [
      'autoUpdate', 'debugMode', 'dataLogging', 'remoteAccess', 
      'screenTimeout', 'refreshRate', 'maxSessions', 'logLevel',
      'apiTimeout', 'retryAttempts', 'cacheSize', 'updateInterval',
      'logRotation', 'backupEnabled', 'compressionLevel'
    ];
    
    const hardwareKeys = [
      'powerSaving', 'temperatureMonitoring', 'emergencyStop', 
      'groundFaultProtection', 'maxCurrent', 'voltageThreshold', 
      'temperatureLimit', 'coolingFanSpeed', 'currentLimit', 
      'voltageLimit', 'powerLimit', 'fanSpeed', 'sensorCalibration'
    ];

    const software = {};
    const hardware = {};

    Object.keys(config).forEach(key => {
      if (softwareKeys.includes(key)) {
        software[key] = config[key];
      } else if (hardwareKeys.includes(key)) {
        hardware[key] = config[key];
      } else {
        // Auto-categorize based on key patterns
        if (key.toLowerCase().includes('software') || 
            key.toLowerCase().includes('debug') ||
            key.toLowerCase().includes('log') ||
            key.toLowerCase().includes('api') ||
            key.toLowerCase().includes('timeout') ||
            key.toLowerCase().includes('screen') ||
            key.toLowerCase().includes('update') ||
            key.toLowerCase().includes('backup') ||
            key.toLowerCase().includes('compression')) {
          software[key] = config[key];
        } else {
          hardware[key] = config[key];
        }
      }
    });

    setSoftwareConfig(software);
    setHardwareConfig(hardware);
  };

  // Load configuration on component mount and authentication
  useEffect(() => {
    if (isAuthenticated) {
      fetchConfiguration();
    }
  }, [isAuthenticated]);

  // Dynamic Setting Component
  const DynamicSetting = ({ configKey, value, onValueChange, category }) => {
    const inputType = getInputType(value);
    const label = generateLabel(configKey);
    const icon = getSettingIcon(configKey);
    const color = getSettingColor(configKey);
    const description = `Configure ${label.toLowerCase()} setting`;

    const updateFunction = category === 'software' ? updateSoftwareConfig : updateHardwareConfig;

    if (inputType === 'toggle') {
      return (
        <ToggleSetting
          icon={icon}
          label={label}
          description={description}
          color={color}
          enabled={value}
          onToggle={() => updateFunction(configKey, !value)}
        />
      );
    } else if (inputType === 'number') {
      // Determine appropriate min/max based on key name
      let min = 0, max = 100, unit = "";
      const keyLower = configKey.toLowerCase();
      
      if (keyLower.includes('timeout')) {
        min = 1; max = 300; unit = "s";
      } else if (keyLower.includes('current')) {
        min = 6; max = 80; unit = "A";
      } else if (keyLower.includes('voltage')) {
        min = 200; max = 500; unit = "V";
      } else if (keyLower.includes('temperature')) {
        min = 40; max = 100; unit = "°C";
      } else if (keyLower.includes('speed') || keyLower.includes('percent')) {
        min = 0; max = 100; unit = "%";
      } else if (keyLower.includes('session')) {
        min = 1; max = 50;
      } else if (keyLower.includes('rate') || keyLower.includes('refresh')) {
        min = 1; max = 60; unit = "s";
      }

      return (
        <NumberSetting
          icon={icon}
          label={label}
          description={description}
          color={color}
          value={value}
          onValueChange={(newValue) => updateFunction(configKey, newValue)}
          min={min}
          max={max}
          unit={unit}
        />
      );
    } else {
      return (
        <TextSetting
          icon={icon}
          label={label}
          description={description}
          color={color}
          value={value}
          onValueChange={(newValue) => updateFunction(configKey, newValue)}
        />
      );
    }
  };

  const isDark = theme === "dark";
  const backgroundColor = isDark ? "transparent" : "#ffffff";
  const textColor = isDark ? "#f5f5f5" : "#000000";
  const styles = getStyles(isDark, textColor, backgroundColor);

  if (!isAuthenticated) {
    return <PasswordProtection onAuthenticated={() => setIsAuthenticated(true)} theme={theme} />;
  }

  const updateSoftwareConfig = async (key, value) => {
    try {
      const updatedConfig = { ...rawConfig, [key]: value };
      await updateConfiguration(updatedConfig);
    } catch (err) {
      // Revert on error - the error is already handled in updateConfiguration
      console.error('Failed to update software configuration:', err);
    }
  };

  const updateHardwareConfig = async (key, value) => {
    try {
      const updatedConfig = { ...rawConfig, [key]: value };
      await updateConfiguration(updatedConfig);
    } catch (err) {
      // Revert on error - the error is already handled in updateConfiguration
      console.error('Failed to update hardware configuration:', err);
    }
  };

  return (
    <div style={{ ...styles.container, backgroundColor, color: textColor }}>
      {/* Header */}
      <div style={styles.header}>
        <h2 style={{ ...styles.heading, color: textColor }}>
          <FaCog style={{ marginRight: "10px", color: "rgb(136 171 226)" }} />
          System Configuration
        </h2>
        {loading && (
          <div style={styles.loadingIndicator}>
            Loading configuration...
          </div>
        )}
        {error && (
          <div style={styles.errorMessage}>
            {error}
            <button 
              style={styles.retryButton} 
              onClick={fetchConfiguration}
            >
              Retry
            </button>
          </div>
        )}
        <button
          onClick={() => setIsAuthenticated(false)}
          style={{
            background: "transparent",
            border: `1px solid ${isDark ? "rgb(136 171 226)" : "#ff0000"}`,
            color: isDark ? "rgb(136 171 226)" : "#ff0000",
            padding: "8px 16px",
            borderRadius: "6px",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            gap: "6px",
            fontSize: "0.9rem"
          }}
        >
          <FaLock /> Lock
        </button>
      </div>

      {/* Tab Navigation */}
      {!error && (
        <div style={styles.tabContainer}>
          <button
            onClick={() => setActiveTab("software")}
            disabled={loading}
            style={{
              ...styles.tab,
              backgroundColor: activeTab === "software" 
                ? (isDark ? "rgb(136 171 226)" : "#ff0000")
                : "transparent",
              color: activeTab === "software" 
                ? "#ffffff" 
                : (isDark ? "rgb(136 171 226)" : "#ff0000"),
              borderColor: isDark ? "rgb(136 171 226)" : "#ff0000",
              opacity: loading ? 0.5 : 1,
              cursor: loading ? "not-allowed" : "pointer"
            }}
          >
            <FaDesktop style={{ marginRight: "8px" }} />
            Software Configuration
          </button>
          <button
            onClick={() => setActiveTab("hardware")}
            disabled={loading}
            style={{
              ...styles.tab,
              backgroundColor: activeTab === "hardware" 
                ? (isDark ? "rgb(136 171 226)" : "#ff0000")
                : "transparent",
              color: activeTab === "hardware" 
                ? "#ffffff" 
                : (isDark ? "rgb(136 171 226)" : "#ff0000"),
              borderColor: isDark ? "rgb(136 171 226)" : "#ff0000",
              opacity: loading ? 0.5 : 1,
              cursor: loading ? "not-allowed" : "pointer"
            }}
          >
            <FaMicrochip style={{ marginRight: "8px" }} />
            Hardware Configuration
          </button>
        </div>
      )}

      {/* Tab Content */}
      <div style={styles.tabContent}>
        {error ? (
          <div style={styles.errorContainer}>
            <div style={styles.errorIcon}>⚠️</div>
            <h3 style={styles.errorTitle}>Configuration Unavailable</h3>
            <p style={styles.errorDescription}>
              Unable to load configuration from the server. Please check your connection and try again.
            </p>
            <div style={styles.errorDetails}>
              <strong>Error:</strong> {error}
            </div>
            <button 
              style={styles.retryButtonLarge} 
              onClick={fetchConfiguration}
              disabled={loading}
            >
              {loading ? 'Retrying...' : 'Retry Connection'}
            </button>
          </div>
        ) : (
          <>
            {activeTab === "software" && (
              <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
                <div style={styles.scrollableContent}>
                  {Object.entries(softwareConfig).map(([key, value]) => (
                    <DynamicSetting
                      key={key}
                      configKey={key}
                      value={value}
                      onValueChange={(newValue) => updateSoftwareConfig(key, newValue)}
                      category="software"
                    />
                  ))}
                </div>
              </div>
            )}

            {activeTab === "hardware" && (
              <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
                <div style={styles.scrollableContent}>
                  {Object.entries(hardwareConfig).map(([key, value]) => (
                    <DynamicSetting
                      key={key}
                      configKey={key}
                      value={value}
                      onValueChange={(newValue) => updateHardwareConfig(key, newValue)}
                      category="hardware"
                    />
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

const getStyles = (isDark, textColor, backgroundColor) => ({
  container: {
    padding: "2rem",
    fontFamily: "Orbitron, sans-serif",
    // height: "100vh",
    maxHeight: "100vh",
    display: "flex",
    flexDirection: "column",
    overflow: "hidden",
    boxSizing: "border-box",
    // minHeight: "100vh",
    backgroundColor,
    color: textColor,
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "2rem",
    paddingBottom: "1rem",
    borderBottom: "2px solid rgba(136, 171, 226, 0.3)",
    flexShrink: 0,
    boxSizing: "border-box",
    maxWidth: "100%",
  },
  heading: {
    fontSize: "2rem",
    margin: 0,
    display: "flex",
    alignItems: "center",
    textShadow: "0 0 10px rgba(136, 171, 226, 0.5)",
  },
  tabContainer: {
    display: "flex",
    marginBottom: "1.5rem",
    gap: "1rem",
    flexShrink: 0,
    boxSizing: "border-box",
    maxWidth: "100%",
    overflow: "hidden",
  },
  tab: {
    flex: 1,
    padding: "1rem 1.5rem",
    border: "2px solid",
    borderRadius: "12px",
    cursor: "pointer",
    fontSize: "1rem",
    fontWeight: "500",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    transition: "all 0.3s ease",
    minHeight: "50px",
    position: "relative",
    overflow: "hidden",
    boxSizing: "border-box",
    maxWidth: "50%",
    '&:hover': {
      transform: "translateY(-2px)",
      boxShadow: "0 4px 15px rgba(136, 171, 226, 0.4)",
    },
    '&:active': {
      transform: "translateY(0)",
    },
  },
  tabContent: {
    flex: 1,
    overflow: "hidden",
    display: "flex",
    flexDirection: "column",
    minHeight: 0,
    maxHeight: "100%",
    boxSizing: "border-box",
  },
  scrollableContent: {
     flex: 1,
     overflowY: "auto",
     overflowX: "hidden",
     paddingRight: "0.5rem",
     marginRight: "-0.5rem",
     maxHeight: "calc(83vh - 250px)",
     minHeight: 0,
     boxSizing: "border-box",
     scrollbarWidth: "thin",
     scrollbarColor: isDark ? "rgba(136, 171, 226, 0.5) transparent" : "rgba(255, 0, 0, 0.4) transparent",
     '&::-webkit-scrollbar': {
       width: "8px",
     },
     '&::-webkit-scrollbar-track': {
       background: isDark ? "rgba(136, 171, 226, 0.1)" : "rgba(255, 0, 0, 0.08)",
       borderRadius: "4px",
     },
     '&::-webkit-scrollbar-thumb': {
       background: isDark ? "rgba(136, 171, 226, 0.5)" : "rgba(255, 0, 0, 0.4)",
       borderRadius: "4px",
       border: isDark ? "1px solid rgba(136, 171, 226, 0.3)" : "1px solid rgba(255, 0, 0, 0.2)",
     },
     '&::-webkit-scrollbar-thumb:hover': {
       background: isDark ? "rgba(136, 171, 226, 0.7)" : "rgba(255, 0, 0, 0.6)",
     },
   },
  sectionTitle: {
    fontSize: "1.5rem",
    fontWeight: "600",
    marginBottom: "1.5rem",
    paddingBottom: "0.5rem",
    borderBottom: isDark ? "1px solid rgba(136, 171, 226, 0.2)" : "1px solid rgba(255, 0, 0, 0.15)",
    textShadow: isDark ? "0 0 8px rgba(136, 171, 226, 0.3)" : "0 0 8px rgba(255, 0, 0, 0.2)",
    position: "sticky",
    top: 0,
    backgroundColor: "inherit",
    zIndex: 10,
    flexShrink: 0,
  },
  settingRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    background: isDark ? "rgba(136, 171, 226, 0.05)" : "rgba(255, 0, 0, 0.08)",
    padding: "1.25rem",
    borderRadius: "12px",
    marginBottom: "1rem",
    boxShadow: isDark ? "0 0 8px rgba(136, 171, 226, 0.3), inset 0 0 20px rgba(136, 171, 226, 0.1)" : "0 0 8px rgba(255, 0, 0, 0.2), inset 0 0 20px rgba(255, 0, 0, 0.05)",
    border: isDark ? "1px solid rgba(136, 171, 226, 0.2)" : "1px solid rgba(255, 0, 0, 0.15)",
    transition: "all 0.3s ease",
    position: "relative",
    overflow: "hidden",
    boxSizing: "border-box",
    maxWidth: "100%",
    '&:hover': {
      transform: "translateY(-1px)",
      boxShadow: isDark ? "0 4px 15px rgba(136, 171, 226, 0.4), inset 0 0 25px rgba(136, 171, 226, 0.15)" : "0 4px 15px rgba(255, 0, 0, 0.3), inset 0 0 25px rgba(255, 0, 0, 0.1)",
      background: isDark ? "rgba(136, 171, 226, 0.08)" : "rgba(255, 0, 0, 0.12)",
    },
  },
  labelContainer: {
    display: "flex",
    flexDirection: "column",
    flex: 1,
    minWidth: 0,
     overflow: "hidden",
   },
   label: {
    fontSize: "1.2rem",
    letterSpacing: "1px",
    display: "flex",
    alignItems: "center",
    marginBottom: "0.25rem",
    wordWrap: "break-word",
    overflowWrap: "break-word",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
     overflow: "hidden",
   },
   description: {
    fontSize: "0.9rem",
    color: isDark ? "#aaa" : "#666",
    marginTop: "0.25rem",
    fontStyle: "italic",
    wordWrap: "break-word",
    overflowWrap: "break-word",
     lineHeight: "1.4",
   },
   badge: {
    marginTop: "4px",
    fontSize: "0.75rem",
    backgroundColor: "#ff0055",
    color: "#fff",
    padding: "2px 6px",
    borderRadius: "6px",
    width: "fit-content",
    boxShadow: "0 0 6px #ff005555",
  },
  toggle: {
    width: "50px",
    height: "24px",
    borderRadius: "20px",
    position: "relative",
    transition: "background 0.3s ease, box-shadow 0.3s ease",
  },
  toggleCircle: {
    width: "20px",
    height: "20px",
    borderRadius: "50%",
    position: "absolute",
    top: "2px",
    left: "2px",
    transition: "transform 0.3s ease, background 0.3s ease",
  },
  numberControl: {
    display: "flex",
    alignItems: "center",
    gap: "0.75rem",
    background: isDark ? "rgba(136, 171, 226, 0.15)" : "rgba(255, 0, 0, 0.1)",
    borderRadius: "10px",
    padding: "0.75rem",
    border: isDark ? "1px solid rgba(136, 171, 226, 0.4)" : "1px solid rgba(255, 0, 0, 0.3)",
    boxShadow: isDark ? "inset 0 0 10px rgba(136, 171, 226, 0.1)" : "inset 0 0 10px rgba(255, 0, 0, 0.08)",
    boxSizing: "border-box",
     minWidth: 0,
     flexShrink: 0,
   },
   numberButton: {
    width: "36px",
    height: "36px",
    borderRadius: "8px",
    border: isDark ? "1px solid rgba(136, 171, 226, 0.6)" : "1px solid rgba(255, 0, 0, 0.5)",
    background: isDark ? "rgba(136, 171, 226, 0.3)" : "rgba(255, 0, 0, 0.2)",
    color: isDark ? "rgb(136 171 226)" : "rgb(255 0 0)",
    fontSize: "1.2rem",
    fontWeight: "bold",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    transition: "all 0.3s ease",
    boxShadow: isDark ? "0 0 5px rgba(136, 171, 226, 0.3)" : "0 0 5px rgba(255, 0, 0, 0.2)",
    '&:hover': {
      background: isDark ? "rgba(136, 171, 226, 0.5)" : "rgba(255, 0, 0, 0.3)",
      boxShadow: isDark ? "0 0 10px rgba(136, 171, 226, 0.5)" : "0 0 10px rgba(255, 0, 0, 0.4)",
      transform: "scale(1.05)",
    },
    '&:active': {
      transform: "scale(0.95)",
    },
  },
  numberValue: {
    minWidth: "80px",
    textAlign: "center",
    fontSize: "1.1rem",
    fontWeight: "600",
    color: isDark ? "rgb(136 171 226)" : "rgb(255 0 0)",
    textShadow: isDark ? "0 0 5px rgba(136, 171, 226, 0.5)" : "0 0 5px rgba(255, 0, 0, 0.3)",
  },
  textInput: {
    padding: "12px 16px",
    borderRadius: "8px",
    border: isDark ? "1px solid rgba(136, 171, 226, 0.6)" : "1px solid rgba(255, 0, 0, 0.5)",
    background: isDark ? "rgba(136, 171, 226, 0.15)" : "rgba(255, 0, 0, 0.1)",
    color: isDark ? "rgb(136 171 226)" : "rgb(255 0 0)",
    fontSize: "1rem",
    fontWeight: "500",
    outline: "none",
    transition: "all 0.3s ease",
    boxShadow: isDark ? "inset 0 0 10px rgba(136, 171, 226, 0.1)" : "inset 0 0 10px rgba(255, 0, 0, 0.08)",
    minWidth: "200px",
    '&:focus': {
      border: isDark ? "1px solid rgba(136, 171, 226, 0.8)" : "1px solid rgba(255, 0, 0, 0.7)",
      boxShadow: isDark ? "0 0 10px rgba(136, 171, 226, 0.3), inset 0 0 15px rgba(136, 171, 226, 0.15)" : "0 0 10px rgba(255, 0, 0, 0.2), inset 0 0 15px rgba(255, 0, 0, 0.1)",
      background: isDark ? "rgba(136, 171, 226, 0.2)" : "rgba(255, 0, 0, 0.15)",
    },
    '&::placeholder': {
      color: isDark ? "rgba(136, 171, 226, 0.6)" : "rgba(255, 0, 0, 0.5)",
      fontStyle: "italic",
    },
  },
  loadingIndicator: {
    color: isDark ? "rgb(136 171 226)" : "rgb(0 122 204)",
    fontSize: "0.9rem",
    fontStyle: "italic",
    display: "flex",
    alignItems: "center",
    gap: "8px",
  },
  errorMessage: {
    color: "#ff4444",
    fontSize: "0.9rem",
    background: "rgba(255, 68, 68, 0.1)",
    padding: "8px 12px",
    borderRadius: "6px",
    border: "1px solid rgba(255, 68, 68, 0.3)",
    display: "flex",
    alignItems: "center",
    gap: "8px",
    maxWidth: "300px",
  },
  retryButton: {
    background: "#ff4444",
    color: "white",
    border: "none",
    padding: "4px 8px",
    borderRadius: "4px",
    fontSize: "0.8rem",
    cursor: "pointer",
    transition: "background 0.3s ease",
  },
  errorContainer: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    padding: "3rem",
    textAlign: "center",
    height: "100%",
    minHeight: "400px",
  },
  errorIcon: {
    fontSize: "4rem",
    marginBottom: "1rem",
  },
  errorTitle: {
    fontSize: "1.5rem",
    fontWeight: "600",
    marginBottom: "1rem",
    color: "#ff4444",
  },
  errorDescription: {
    fontSize: "1rem",
    marginBottom: "1.5rem",
    color: isDark ? "#aaa" : "#666",
    maxWidth: "500px",
    lineHeight: "1.5",
  },
  errorDetails: {
    background: "rgba(255, 68, 68, 0.1)",
    border: "1px solid rgba(255, 68, 68, 0.3)",
    borderRadius: "8px",
    padding: "1rem",
    marginBottom: "2rem",
    fontSize: "0.9rem",
    color: "#ff4444",
    maxWidth: "600px",
    wordBreak: "break-word",
  },
  retryButtonLarge: {
    background: isDark ? "rgb(136 171 226)" : "#007acc",
    color: "white",
    border: "none",
    padding: "12px 24px",
    borderRadius: "8px",
    fontSize: "1rem",
    cursor: "pointer",
    transition: "all 0.3s ease",
    fontWeight: "600",
  },
});

export default Setting;
