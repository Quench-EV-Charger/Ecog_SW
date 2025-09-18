import React, { useContext, useState, useEffect, useCallback } from "react";
import { useSelector } from "react-redux";
import { 
  FaCog, 
  FaLock, 
  FaUnlock,
  FaDesktop,
  FaMicrochip,
  FaEye,
  FaEyeSlash,
  FaRedo
} from "react-icons/fa";
import { ThemeContext } from "../ThemeContext/ThemeProvider";
import EVChargerKeyboard from "../EVChargerKeyboard/EVChargerKeyboard";
import { useStableCallback } from "../../hooks/useStableCallback";

// Password Protection Component
const PasswordProtection = ({ onAuthenticated, theme }) => {
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [attempts, setAttempts] = useState(0);
  const [showKeyboard, setShowKeyboard] = useState(false);
  const passwordInputRef = React.useRef(null);
  
  const isDark = theme === "dark";
  const styles = getStyles(isDark, isDark ? "#f5f5f5" : "#000000", isDark ? "transparent" : "#ffffff");

  const ADMIN_PASSWORD = "admin123"; // Mock password - replace with secure implementation
  const MAX_ATTEMPTS = 3;

  const handlePasswordInputClick = () => {
    setShowKeyboard(true);
    setTimeout(() => {
      if (passwordInputRef.current) {
        passwordInputRef.current.focus();
      }
    }, 50);
  };

  const handleKeyboardInput = (newValue) => {
    setPassword(newValue);
  };

  const handleCloseKeyboard = () => {
    setShowKeyboard(false);
  };

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
              ref={passwordInputRef}
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onClick={handlePasswordInputClick}
              onFocus={handlePasswordInputClick}
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
                opacity: isLocked ? 0.5 : 1,
                fontFamily: "monospace"
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

        <EVChargerKeyboard
          isVisible={showKeyboard}
          onClose={handleCloseKeyboard}
          targetRef={passwordInputRef}
          onInput={handleKeyboardInput}
          inputType="password"
          placeholder="Enter password"
          maxLength={50}
          secureMode={true}
        />

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


// Toggle Setting Component - Memoized to prevent unnecessary re-renders
const ToggleSetting = React.memo(({ icon, label, description, color, enabled, onToggle, disabled = false }) => {
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
}, (prevProps, nextProps) => {
  // Enhanced memo comparison - only re-render if actual prop values change
  return (
    prevProps.icon === nextProps.icon &&
    prevProps.label === nextProps.label &&
    prevProps.description === nextProps.description &&
    prevProps.color === nextProps.color &&
    prevProps.enabled === nextProps.enabled &&
    prevProps.onToggle === nextProps.onToggle &&
    prevProps.disabled === nextProps.disabled
  );
});

// Number Setting Component - Memoized to prevent unnecessary re-renders
const NumberSetting = React.memo(({ icon, label, description, color, value, onValueChange, min = 0, max = 100, unit = "" }) => {
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
});

// Text Setting Component - Optimized to prevent unnecessary re-renders
const TextSetting = React.memo(
  ({ icon, label, description, color, value, onValueChange }) => {
    const { theme } = useContext(ThemeContext);
    const isDark = theme === "dark";
    
    // Memoize styles to prevent recalculation on every render
    const styles = React.useMemo(() => 
      getStyles(isDark, isDark ? "#f5f5f5" : "#000000", isDark ? "transparent" : "#ffffff"),
      [isDark]
    );

    // Local state for internal editing
    const [tempValue, setTempValue] = useState(value || "");
    const [isEditing, setIsEditing] = useState(false);
    const [showKeyboard, setShowKeyboard] = useState(false);

    const inputRef = React.useRef(null);
    const containerRef = React.useRef(null);

    // Update local state only when parent `value` changes externally
    React.useEffect(() => {
      if (!isEditing) {
        setTempValue(value || "");
      }
    }, [value, isEditing]);

    // Stable handler for Apply - memoized with stable dependencies
    const handleApply = React.useCallback(
      (e) => {
        e?.stopPropagation();
        onValueChange(tempValue); // Only notify parent when Apply is clicked
        setIsEditing(false);
        setShowKeyboard(false);
      },
      [tempValue, onValueChange]
    );

    // Cancel edits and revert to last saved value - memoized with stable dependencies
    const handleCancel = React.useCallback(
      (e) => {
        e?.stopPropagation();
        setTempValue(value || "");
        setIsEditing(false);
        setShowKeyboard(false);
      },
      [value]
    );

    // Input click - enable editing and show keyboard - memoized
    const handleInputClick = React.useCallback((e) => {
      e.stopPropagation();
      e.preventDefault();
      setIsEditing(true);
      setShowKeyboard(true);

      // Small delay to ensure the keyboard shows before focus
      setTimeout(() => {
        inputRef.current?.focus();
      }, 50);
    }, []);

    // Input change - memoized
    const handleChange = React.useCallback((e) => {
      setTempValue(e.target.value);
      if (!isEditing) setIsEditing(true);
      if (!showKeyboard) setShowKeyboard(true);
    }, [isEditing, showKeyboard]);

    // Handle keyboard component input - memoized
    const handleKeyboardInput = React.useCallback((newValue) => {
      setTempValue(newValue);
      if (!isEditing) setIsEditing(true);
      if (!showKeyboard) setShowKeyboard(true);
    }, [isEditing, showKeyboard]);

    // Handle closing the keyboard - memoized
    const handleCloseKeyboard = React.useCallback(() => {
      setShowKeyboard(false);
    }, []);

    // Memoize dynamic styles to prevent recalculation
    const inputStyle = React.useMemo(() => ({
      ...styles.textInput,
      border: isEditing
        ? `2px solid ${color || "#007bff"}`
        : styles.textInput.border,
      boxShadow: isEditing
        ? `0 0 0 2px ${color || "#007bff"}33`
        : "none"
    }), [styles.textInput, isEditing, color]);

    const cancelButtonStyle = React.useMemo(() => ({
      padding: "6px 12px",
      border: `1px solid ${isDark ? "#555" : "#ccc"}`,
      borderRadius: "4px",
      background: isDark ? "#444" : "#f5f5f5",
      color: isDark ? "#fff" : "#333",
      cursor: "pointer",
      fontSize: "12px",
      transition: "all 0.2s ease"
    }), [isDark]);

    const applyButtonStyle = React.useMemo(() => ({
      padding: "6px 12px",
      border: "none",
      borderRadius: "4px",
      background: color || "#007bff",
      color: "#fff",
      cursor: "pointer",
      fontSize: "12px",
      fontWeight: "bold",
      transition: "all 0.2s ease"
    }), [color]);

    return (
      <>
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
            ref={containerRef}
            style={{ display: "flex", flexDirection: "column", gap: "8px", flex: 1 }}
          >
            <input
              ref={inputRef}
              type="text"
              value={tempValue}
              onChange={handleChange}
              onClick={handleInputClick}
              placeholder="Enter value..."
              style={inputStyle}
            />

            {isEditing && (
              <div style={{ display: "flex", gap: "8px", justifyContent: "flex-end" }}>
                <button
                  onClick={handleCancel}
                  style={cancelButtonStyle}
                >
                  Cancel
                </button>
                <button
                  onClick={handleApply}
                  style={applyButtonStyle}
                >
                  Apply
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Virtual Keyboard Component */}
        <EVChargerKeyboard
          isVisible={showKeyboard}
          onClose={handleCloseKeyboard}
          targetRef={inputRef}
          onInput={handleKeyboardInput}
          inputType="text"
          placeholder="Enter configuration value..."
          maxLength={100}
        />
      </>
    );
  },
  // Optimized comparison function to prevent unnecessary re-renders
  (prevProps, nextProps) => {
    // Only re-render if these specific props change
    return (
      prevProps.value === nextProps.value &&
      prevProps.label === nextProps.label &&
      prevProps.color === nextProps.color &&
      prevProps.description === nextProps.description &&
      prevProps.icon?.type === nextProps.icon?.type &&
      prevProps.onValueChange === nextProps.onValueChange
    );
  }
);

// Main Settings Component
const Setting = React.memo(() => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [activeTab, setActiveTab] = useState("hardware");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const { theme } = useContext(ThemeContext);
  
  // Only subscribe to the specific config value, not the entire charging state
  const config = useSelector((state) => state.charging?.config);

  // Configuration State - will be populated from API
  const [softwareConfig, setSoftwareConfig] = useState({});
  const [hardwareConfig, setHardwareConfig] = useState({});
  const [rawConfig, setRawConfig] = useState({});
  
  // Restart button state tracking
  const [hasChanges, setHasChanges] = useState(false);
  const [lastUpdateSuccess, setLastUpdateSuccess] = useState(false);

  // Memoize API base URL to prevent unnecessary re-renders
  const apiUrl = React.useMemo(() => config?.API, [config?.API]);

  // API Functions
  const fetchConfiguration = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`${apiUrl}/ocpp-client/config`);
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
  }, [apiUrl]);

  const updateConfiguration = useCallback(async (updatedConfig) => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`${apiUrl}/ocpp-client/config`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updatedConfig)
      });
      if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
      } catch (err) {
        setError(`Failed to update configuration: ${err.message}`);
        console.error('Error updating configuration:', err);
        throw err;
      } finally {
        setLoading(false);
        // Always refresh configuration after update attempt, regardless of success/failure
        try {
          await fetchConfiguration();
        } catch (refreshErr) {
          console.error('Error refreshing configuration after update:', refreshErr);
        }
      }
    }, [apiUrl, fetchConfiguration]);

  // Restart OCPP Client API function
  const restartOcppClient = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`${apiUrl}/ocpp-client/restart`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        }
      });
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      // Reset the restart button state after successful restart
      setHasChanges(false);
      setLastUpdateSuccess(false);
      return true;
    } catch (err) {
      setError(`Failed to restart OCPP client: ${err.message}`);
      console.error('Error restarting OCPP client:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [apiUrl]);


  // Helper function to determine input type based on value
  const getInputType = (value) => {
    if (typeof value === 'boolean') return 'toggle';
    if (typeof value === 'number') return 'number';
    return 'text';
  };

  // Helper function to get appropriate icon based on key name - Memoized
  const getSettingIcon = React.useCallback((key) => {
    return <FaCog />; // Default icon
  }, []);

  // Helper function to get appropriate color based on key name - Memoized
  const getSettingColor = React.useCallback((key) => {
    return '#00ffaa'; // Default color
  }, []);

  // Categorize configuration into OCPP and hardware
  const categorizeConfiguration = (config) => {
    // OCPP Config parameters
    const ocppKeys = [
      'OCPPEndpointToBackend', 'chargerName', 'chargePointSerialNumber', 
      'chargingPointModel', 'chargingPointVendor', 'acceptRemoteStartOnPreparingOnly',
      'maxPowerLimitInkW', 'maxCurrentLimitInAmps', 'powerSaveInIdleMode',
      'emulatedMetering', 'comboModeHMI', 'dlbCombo', 'numberOfInstalledPM',
      'powerModuleCapacity', 'gun1MaxPower', 'gun2MaxPower', 'underVoltageThreshold',
      'overVoltageThreshold', 'outletCount', 'gunTempDeRating', 'gunTempCutoff',
      'cabinetTemperature'
    ];


    const ocpp = {};
    const hardware = {};

    ocppKeys.forEach(key => {
      if (config.hasOwnProperty(key)) {
        ocpp[key] = config[key];
      } else {
        hardware[key] = config[key];
      }
    });

    setSoftwareConfig(ocpp);
    setHardwareConfig(hardware);
  };

  // Memoized callback functions to prevent re-renders
  const memoizedUpdateHardwareConfig = React.useCallback((key, value) => {
    updateHardwareConfig(key, value);
  }, []);

  const memoizedUpdateOcppConfig = React.useCallback((key, value) => {
    updateOcppConfig(key, value);
  }, []);

  // Memoized callback creators for each setting
  const hardwareCallbacks = React.useMemo(() => {
    const callbacks = {};
    Object.keys(hardwareConfig).forEach(key => {
      callbacks[key] = (newValue) => memoizedUpdateHardwareConfig(key, newValue);
    });
    return callbacks;
  }, [hardwareConfig, memoizedUpdateHardwareConfig]);

  const ocppCallbacks = React.useMemo(() => {
    const callbacks = {};
    Object.keys(softwareConfig).forEach(key => {
      callbacks[key] = (newValue) => memoizedUpdateOcppConfig(key, newValue);
    });
    return callbacks;
  }, [softwareConfig, memoizedUpdateOcppConfig]);

  // Load configuration on component mount and authentication
  useEffect(() => {
    if (isAuthenticated) {
      fetchConfiguration();
    }
  }, [isAuthenticated, fetchConfiguration]);

  // Memoized callback functions to prevent unnecessary re-renders
  const updateOcppConfig = useCallback(async (key, value) => {
    try {
      setHasChanges(true); // Mark that changes have been made
      const updatedConfig = { [key]: value };
      await updateConfiguration(updatedConfig);
      setLastUpdateSuccess(true); // Mark successful update
    } catch (err) {
      setLastUpdateSuccess(false); // Mark failed update
      console.error('Failed to update software configuration:', err);
    }
  }, [updateConfiguration]);

  const updateHardwareConfig = useCallback(async (key, value) => {
    try {
      setHasChanges(true); // Mark that changes have been made
      const updatedConfig = { ...rawConfig, [key]: value };
      await updateConfiguration(updatedConfig);
      setLastUpdateSuccess(true); // Mark successful update
    } catch (err) {
      setLastUpdateSuccess(false); // Mark failed update
      console.error('Failed to update hardware configuration:', err);
    }
  }, [rawConfig, updateConfiguration]);

  // Dynamic Setting Component - Memoized to prevent unnecessary re-renders
  const DynamicSetting = React.memo(({ configKey, value, onValueChange, category }) => {
    const inputType = getInputType(value);
    const label = configKey
    const icon = React.useMemo(() => getSettingIcon(configKey), [configKey]);
    const color = React.useMemo(() => getSettingColor(configKey), [configKey]);
    const updateFunction = React.useMemo(() => 
      category === 'ocpp' ? updateOcppConfig : updateHardwareConfig, 
      [category, updateOcppConfig, updateHardwareConfig]
    );

    // Memoized callback to prevent re-renders - using stable callback hook
    const handleValueChange = useStableCallback((newValue) => {
      updateFunction(configKey, newValue);
    }, [updateFunction, configKey]);

    if (inputType === 'toggle') {
      return (
        <ToggleSetting
          icon={icon}
          label={label}
          description={""}
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
          description={""}
          color={color}
          value={value}
          onValueChange={handleValueChange}
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
          description={""}
          color={color}
          value={value}
          onValueChange={handleValueChange}
        />
      );
    }
  }, (prevProps, nextProps) => {
    // Enhanced memo comparison to prevent unnecessary re-renders
    return (
      prevProps.configKey === nextProps.configKey &&
      prevProps.value === nextProps.value &&
      prevProps.category === nextProps.category &&
      prevProps.inputType === nextProps.inputType &&
      prevProps.icon === nextProps.icon &&
      prevProps.label === nextProps.label &&
      prevProps.color === nextProps.color &&
      prevProps.updateOcppConfig === nextProps.updateOcppConfig &&
      prevProps.updateHardwareConfig === nextProps.updateHardwareConfig
    );
  });

  const isDark = theme === "dark";
  const backgroundColor = isDark ? "transparent" : "#ffffff";
  const textColor = isDark ? "#f5f5f5" : "#000000";
  const styles = getStyles(isDark, textColor, backgroundColor);

  if (!isAuthenticated) {
    return <PasswordProtection onAuthenticated={() => setIsAuthenticated(true)} theme={theme} />;
  }

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
        {/* Restart OCPP Client Button */}
        <button
          onClick={async () => {
            try {
              await restartOcppClient();
            } catch (err) {
              // Error is already handled in the API function
            }
          }}
          disabled={!hasChanges || !lastUpdateSuccess || loading}
          style={{
            background: (!hasChanges || !lastUpdateSuccess || loading) ? "transparent" : (isDark ? "rgb(136 171 226)" : "#ff0000"),
            border: `1px solid ${isDark ? "rgb(136 171 226)" : "#ff0000"}`,
            color: (!hasChanges || !lastUpdateSuccess || loading) ? 
              (isDark ? "rgba(136, 171, 226, 0.5)" : "rgba(255, 0, 0, 0.5)") : 
              "#ffffff",
            padding: "8px 16px",
            borderRadius: "6px",
            cursor: (!hasChanges || !lastUpdateSuccess || loading) ? "not-allowed" : "pointer",
            display: "flex",
            alignItems: "center",
            gap: "6px",
            fontSize: "0.9rem",
            opacity: (!hasChanges || !lastUpdateSuccess || loading) ? 0.5 : 1,
            marginLeft: "8px"
          }}
          title={
            !hasChanges ? "No changes made" :
            !lastUpdateSuccess ? "Changes must be successfully updated first" :
            loading ? "Processing..." :
            "Restart OCPP Client"
          }
        >
          <FaRedo /> Restart OCPP
        </button>
      </div>

      {/* Tab Navigation */}
      {!error && (
        <div style={styles.tabContainer}>
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
            Hardware Config
          </button>
          <button
            onClick={() => setActiveTab("ocpp")}
            disabled={loading}
            style={{
              ...styles.tab,
              backgroundColor: activeTab === "ocpp" 
                ? (isDark ? "rgb(136 171 226)" : "#ff0000")
                : "transparent",
              color: activeTab === "ocpp" 
                ? "#ffffff" 
                : (isDark ? "rgb(136 171 226)" : "#ff0000"),
              borderColor: isDark ? "rgb(136 171 226)" : "#ff0000",
              opacity: loading ? 0.5 : 1,
              cursor: loading ? "not-allowed" : "pointer"
            }}
          >
            <FaDesktop style={{ marginRight: "8px" }} />
            OCPP Config
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
            {activeTab === "hardware" && (
              <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
                <div style={styles.scrollableContent}>
                  {Object.entries(hardwareConfig).map(([key, value]) => (
                    <DynamicSetting
                      key={key}
                      configKey={key}
                      value={value}
                      onValueChange={hardwareCallbacks[key]}
                      category="hardware"
                    />
                  ))}
                </div>
              </div>
            )}

            {activeTab === "ocpp" && (
              <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
                <div style={styles.scrollableContent}>
                  {Object.entries(softwareConfig).map(([key, value]) => (
                    <DynamicSetting
                      key={key}
                      configKey={key}
                      value={value}
                      onValueChange={ocppCallbacks[key]}
                      category="ocpp"
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
});

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
