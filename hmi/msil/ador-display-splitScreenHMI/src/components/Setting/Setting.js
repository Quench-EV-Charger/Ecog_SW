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
  FaRedo,
  FaSync,
  FaPlug
} from "react-icons/fa";
import { ThemeContext } from "../ThemeContext/ThemeProvider";
import EVChargerKeyboard from "../EVChargerKeyboard/EVChargerKeyboard";
import { useStableCallback } from "../../hooks/useStableCallback";
import { useDebounce } from "../../hooks/useDebounce";

// Password Protection Component
const PasswordProtection = ({ onAuthenticated, theme, onRestartCharger }) => {
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [attempts, setAttempts] = useState(0);
  const [showKeyboard, setShowKeyboard] = useState(false);
  const [hmiPassword, setHmiPassword] = useState(null);
  const passwordInputRef = React.useRef(null);
  const config = useSelector((state) => state.charging?.config);
  const apiUrl = React.useMemo(() => config?.API, [config?.API]);
  
  const isDark = theme === "dark";
  
  // Memoize styles to prevent unnecessary recalculations
  const styles = React.useMemo(() => 
    getStyles(isDark, isDark ? "#f5f5f5" : "#000000", isDark ? "transparent" : "#ffffff"),
    [isDark]
  );

  const ADMIN_PASSWORD = "admin123"; // Mock password - replace with secure implementation
  const MAX_ATTEMPTS = 3;

  useEffect(() => {
     fetch(`${apiUrl}/ocpp-client/config`)
      .then(response => response.json())
      .then(data => {
        console.log("Fetched config:", data);
        setHmiPassword(data?.HMISettingSecret);
      })
      .catch(error => console.error("Error fetching config:", error));
  }, []);

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
    if (password === ADMIN_PASSWORD || password === hmiPassword) {
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

        <button
          type="button"
          onClick={onRestartCharger}
          disabled={isLocked}
          style={{
            width: "100%",
            padding: "12px",
            marginTop: "12px",
            background: isDark ? "rgb(136 171 226)" : "#ff0000",
            color: "#ffffff",
            border: "none",
            borderRadius: "8px",
            fontSize: "1rem",
            cursor: isLocked ? "not-allowed" : "pointer",
            transition: "all 0.3s ease",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "8px",
            opacity: isLocked ? 0.5 : 1
          }}
        >
          <FaRedo />
          Restart Charger
        </button>

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
  
  // Memoize styles to prevent unnecessary recalculations
  const styles = React.useMemo(() => 
    getStyles(isDark, isDark ? "#f5f5f5" : "#000000", isDark ? "transparent" : "#ffffff"),
    [isDark]
  );
  
  // Memoize toggle handler for smoother transitions
  const handleToggle = React.useCallback(() => {
    if (!disabled) {
      React.startTransition(() => {
        onToggle();
      });
    }
  }, [disabled, onToggle]);
  
  return (
  <div style={styles.settingRow}>
    <div style={styles.labelContainer}>
        <span style={styles.label}>
          {React.createElement(icon, { style: { marginRight: "8px", color } })}
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
      onClick={handleToggle}
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
const NumberSetting = React.memo(({ icon, label, description, color, value, onValueChange, min = 0, max = 100, unit = "", disabled = false }) => {
  const { theme } = useContext(ThemeContext);
  const isDark = theme === "dark";
  
  // Memoize styles to prevent unnecessary recalculations
  const styles = React.useMemo(() => 
    getStyles(isDark, isDark ? "#f5f5f5" : "#000000", isDark ? "transparent" : "#ffffff"),
    [isDark]
  );
  
  // Memoize value change handlers to prevent unnecessary re-renders
  const handleIncrement = React.useCallback(() => {
    if (!disabled && value < max) {
      React.startTransition(() => {
        onValueChange(value + 1);
      });
    }
  }, [disabled, value, max, onValueChange]);

  const handleDecrement = React.useCallback(() => {
    if (!disabled && value > min) {
      React.startTransition(() => {
        onValueChange(value - 1);
      });
    }
  }, [disabled, value, min, onValueChange]);

  return (
    <div style={styles.settingRow}>
      <div style={styles.labelContainer}>
        <span style={styles.label}>
          {React.createElement(icon, { style: { marginRight: "8px", color } })}
          {label}
        </span>
        {description && (
          <span style={styles.description}>{description}</span>
        )}
      </div>
      <div style={styles.numberControl}>
        <button 
          onClick={handleDecrement}
          disabled={disabled || value <= min}
          style={{
            ...styles.numberButton,
            opacity: disabled || value <= min ? 0.4 : 1,
            cursor: disabled || value <= min ? "not-allowed" : "pointer"
          }}
        >
          -
        </button>
        <span 
        className="setting-value-transition"
        style={{
          ...styles.numberValue,
          opacity: disabled ? 0.6 : 1
        }}>
          {value}{unit}
        </span>
        <button 
          onClick={handleIncrement}
          disabled={disabled || value >= max}
          style={{
            ...styles.numberButton,
            opacity: disabled || value >= max ? 0.4 : 1,
            cursor: disabled || value >= max ? "not-allowed" : "pointer"
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
  ({ icon, label, description, color, value, onValueChange, disabled = false }) => {
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
        React.startTransition(() => {
          onValueChange(tempValue); // Only notify parent when Apply is clicked
        });
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
      if (disabled) return;
      e.stopPropagation();
      e.preventDefault();
      setIsEditing(true);
      setShowKeyboard(true);

      // Small delay to ensure the keyboard shows before focus
      setTimeout(() => {
        inputRef.current?.focus();
      }, 50);
    }, [disabled]);

    // Input change - memoized
    const handleChange = React.useCallback((e) => {
      if (disabled) return;
      setTempValue(e.target.value);
      if (!isEditing) setIsEditing(true);
      if (!showKeyboard) setShowKeyboard(true);
    }, [isEditing, showKeyboard, disabled]);

    // Handle keyboard component input - memoized
    const handleKeyboardInput = React.useCallback((newValue) => {
      if (disabled) return;
      setTempValue(newValue);
      if (!isEditing) setIsEditing(true);
      if (!showKeyboard) setShowKeyboard(true);
    }, [isEditing, showKeyboard, disabled]);

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
              {React.createElement(icon, { style: { marginRight: "8px", color } })}
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
              className="setting-value-transition"
              onChange={handleChange}
              onClick={handleInputClick}
              placeholder="Enter value..."
              disabled={disabled}
              style={{
                ...inputStyle,
                opacity: disabled ? 0.6 : 1,
                cursor: disabled ? "not-allowed" : "text"
              }}
            />

            {isEditing && !disabled && (
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
          isVisible={showKeyboard && !disabled}
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
      prevProps.onValueChange === nextProps.onValueChange &&
      prevProps.disabled === nextProps.disabled
    );
  }
);

// DropdownSetting Component
const DropdownSetting = React.memo(
  ({ icon, label, description, color, value, onValueChange, options = [], disabled = false }) => {
    const { theme } = useContext(ThemeContext);
    const isDark = theme === "dark";
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = React.useRef(null);

    // Close dropdown when clicking outside
    React.useEffect(() => {
      const handleClickOutside = (event) => {
        if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
          setIsOpen(false);
        }
      };

      document.addEventListener('mousedown', handleClickOutside);
      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
      };
    }, []);

    const dropdownStyles = React.useMemo(() => ({
      settingRow: {
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        backgroundColor: isDark ? "rgba(136, 171, 226, 0.08)" : "rgba(255, 0, 0, 0.05)",
        border: isDark ? "1px solid rgba(136, 171, 226, 0.2)" : "1px solid rgba(255, 0, 0, 0.2)",
        borderRadius: "8px",
        padding: "16px",
        marginBottom: "12px",
        transition: "all 0.3s ease",
        position: "relative",
        minHeight: "60px"
      },
      labelContainer: {
        display: "flex",
        flexDirection: "column",
        flex: 1,
        marginRight: "16px"
      },
      label: {
        display: "flex",
        alignItems: "center",
        fontSize: "1.2rem",
        fontWeight: "600",
        color: isDark ? "#f5f5f5" : "#000000",
        marginBottom: "4px"
      },
      description: {
        fontSize: "0.85rem",
        color: isDark ? "#aaa" : "#666",
        lineHeight: "1.4",
        marginTop: "4px"
      },
      dropdownContainer: {
        display: 'flex',
        position: 'relative',
        minWidth: "200px",
        maxWidth: "300px"
      },
      inputField: {
        width: "100%",
        padding: "12px 16px",
        border: isDark ? "2px solid rgba(136, 171, 226, 0.4)" : "2px solid rgba(255, 0, 0, 0.4)",
        backgroundColor: isDark ? "rgba(136, 171, 226, 0.1)" : "rgba(255, 0, 0, 0.08)",
        color: isDark ? "rgb(136 171 226)" : "rgb(255 0 0)",
        borderRadius: "8px",
        fontSize: "0.95rem",
        outline: "none",
        transition: "all 0.3s ease",
        cursor: disabled ? 'not-allowed' : 'pointer',
        boxShadow: isDark ? "0 2px 8px rgba(136, 171, 226, 0.15)" : "0 2px 8px rgba(255, 0, 0, 0.1)",
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        fontWeight: "500"
      },
      inputFieldHover: {
        border: isDark ? "2px solid rgba(136, 171, 226, 0.6)" : "2px solid rgba(255, 0, 0, 0.6)",
        boxShadow: isDark ? "0 4px 12px rgba(136, 171, 226, 0.2)" : "0 4px 12px rgba(255, 0, 0, 0.15)",
        transform: "translateY(-1px)"
      },
      dropdown: {
        position: 'absolute',
        top: 'calc(100% + 4px)',
        left: 0,
        right: 0,
        backgroundColor: isDark ? '#2a2a2a' : '#ffffff',
        border: isDark ? '2px solid rgba(136, 171, 226, 0.4)' : '2px solid rgba(255, 0, 0, 0.4)',
        borderRadius: '8px',
        boxShadow: isDark ? '0 8px 24px rgba(0, 0, 0, 0.3)' : '0 8px 24px rgba(0, 0, 0, 0.15)',
        zIndex: 1000,
        maxHeight: '200px',
        overflowY: 'auto',
        animation: 'dropdownSlide 0.2s ease-out'
      },
      dropdownItem: {
        padding: '12px 16px',
        cursor: 'pointer',
        color: isDark ? '#f5f5f5' : '#000000',
        borderBottom: `1px solid ${isDark ? 'rgba(136, 171, 226, 0.1)' : 'rgba(255, 0, 0, 0.1)'}`,
        transition: 'all 0.2s ease',
        fontSize: '0.95rem',
        fontWeight: '500'
      },
      dropdownItemLast: {
        borderBottom: 'none'
      },
      arrow: {
        color: isDark ? 'rgba(136, 171, 226, 0.8)' : 'rgba(255, 0, 0, 0.8)',
        transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
        transition: 'transform 0.3s ease',
        fontSize: '14px',
        fontWeight: 'bold'
      }
    }), [isDark, color, disabled, isOpen]);

    const handleSelect = (option) => {
      onValueChange(option);
      setIsOpen(false);
    };

    return (
      <div style={dropdownStyles.settingRow}>
        <div style={dropdownStyles.labelContainer}>
          <span style={dropdownStyles.label}>
            {icon && React.createElement(icon, { style: { marginRight: "8px", color: color || (isDark ? "rgb(136 171 226)" : "#ff0000") } })}
            {label}
          </span>
          {description && (
            <span style={dropdownStyles.description}>{description}</span>
          )}
        </div>

        <div style={dropdownStyles.dropdownContainer} ref={dropdownRef}>
          <div
            style={{
              ...dropdownStyles.inputField,
              backgroundColor: disabled ? (isDark ? '#2a2a2a' : '#f0f0f0') : dropdownStyles.inputField.backgroundColor,
              cursor: disabled ? 'not-allowed' : 'pointer',
              opacity: disabled ? 0.6 : 1
            }}
            onClick={() => !disabled && setIsOpen(!isOpen)}
            onMouseEnter={(e) => {
              if (!disabled) {
                Object.assign(e.target.style, dropdownStyles.inputFieldHover);
              }
            }}
            onMouseLeave={(e) => {
              if (!disabled) {
                Object.assign(e.target.style, dropdownStyles.inputField);
              }
            }}
          >
            <span className="setting-value-transition" style={{ color: value ? (isDark ? '#f5f5f5' : '#000000') : '#888' }}>
              {(() => {
                if (!value) return 'Select an option...';
                // Handle both string values and object options with value/label
                const selectedOption = options.find(opt => 
                  typeof opt === 'string' ? opt === value : opt.value === value
                );
                return selectedOption 
                  ? (typeof selectedOption === 'string' ? selectedOption : selectedOption.label)
                  : value;
              })()}
            </span>
            <span style={dropdownStyles.arrow}>
              ▼
            </span>
          </div>

          {isOpen && !disabled && (
            <div className="dropdown-transition" style={dropdownStyles.dropdown}>
              {options.map((option, index) => {
                // Handle both string options and object options with value/label
                const optionValue = typeof option === 'string' ? option : option.value;
                const optionLabel = typeof option === 'string' ? option : option.label;
                const isLast = index === options.length - 1;
                
                return (
                  <div
                    key={index}
                    style={{
                      ...dropdownStyles.dropdownItem,
                      ...(isLast ? dropdownStyles.dropdownItemLast : {}),
                      backgroundColor: value === optionValue ? (isDark ? 'rgba(136, 171, 226, 0.2)' : 'rgba(255, 0, 0, 0.1)') : 'transparent'
                    }}
                    onClick={() => handleSelect(optionValue)}
                    onMouseEnter={(e) => {
                      if (value !== optionValue) {
                        e.target.style.backgroundColor = isDark ? 'rgba(136, 171, 226, 0.1)' : 'rgba(255, 0, 0, 0.05)';
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (value !== optionValue) {
                        e.target.style.backgroundColor = 'transparent';
                      }
                    }}
                  >
                    {optionLabel}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    );
  },
  (prevProps, nextProps) => {
    return (
      prevProps.value === nextProps.value &&
      prevProps.label === nextProps.label &&
      prevProps.color === nextProps.color &&
      prevProps.description === nextProps.description &&
      prevProps.disabled === nextProps.disabled &&
      JSON.stringify(prevProps.options) === JSON.stringify(nextProps.options) &&
      prevProps.onValueChange === nextProps.onValueChange
    );
  }
);

// Main Settings Component
// Isolated Header Component to prevent re-renders
const SettingHeader = React.memo(({ 
  textColor, 
  hasChanges, 
  lastUpdateSuccess, 
  loading, 
  isDark, 
  isRefreshing,
  onRestartCharger, 
  onRefreshConfiguration,
  headerStyle,
  headingStyle
}) => {
  const restartButtonStyle = React.useMemo(() => ({
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
  }), [hasChanges, lastUpdateSuccess, loading, isDark]);

  const refreshButtonStyle = React.useMemo(() => ({
    background: (loading || isRefreshing) ? "transparent" : (isDark ? "rgb(136 171 226)" : "#ff0000"),
    border: `1px solid ${isDark ? "rgb(136 171 226)" : "#ff0000"}`,
    color: (loading || isRefreshing) ? 
      (isDark ? "rgba(136, 171, 226, 0.5)" : "rgba(255, 0, 0, 0.5)") : 
      "#ffffff",
    padding: "8px 16px",
    borderRadius: "6px",
    cursor: (loading || isRefreshing) ? "not-allowed" : "pointer",
    display: "flex",
    alignItems: "center",
    gap: "6px",
    fontSize: "0.9rem",
    opacity: (loading || isRefreshing) ? 0.5 : 1,
    marginLeft: "8px"
  }), [loading, isRefreshing, isDark]);

  return (
    <div style={headerStyle}>
      <h2 style={{ ...headingStyle, color: textColor }}>
        <FaCog style={{ marginRight: "10px", color: "rgb(136 171 226)" }} />
        System Configuration
      </h2>
      
      {/* Restart OCPP Client Button */}
      <button
        onClick={onRestartCharger}
        disabled={!hasChanges || !lastUpdateSuccess || loading}
        style={restartButtonStyle}
        title={
          !hasChanges ? "No changes made" :
          !lastUpdateSuccess ? "Changes must be successfully updated first" :
          loading ? "Processing..." :
          "Restart Charger"
        }
      >
        <FaRedo /> Restart Charger
      </button>
      
      {/* Refresh Configuration Button */}
      <button
        onClick={onRefreshConfiguration}
        disabled={loading || isRefreshing}
        style={refreshButtonStyle}
        title={
          loading ? "Configuration loading..." :
          isRefreshing ? "Refreshing configuration..." :
          "Refresh Configuration"
        }
      >
        <FaSync style={{
          animation: isRefreshing ? 'spin 1s linear infinite' : 'none'
        }} /> 
        Refresh
      </button>
    </div>
  );
});

// Isolated Tab Navigation Component to prevent re-renders
const ValidationError = React.memo(({ error, isDark }) => {
  if (!error) return null;
  
  return (
    <div style={{
      marginBottom: '15px',
      padding: '8px 12px',
      backgroundColor: isDark ? 'rgba(220, 38, 38, 0.1)' : 'rgba(220, 38, 38, 0.05)',
      border: `1px solid ${isDark ? 'rgba(220, 38, 38, 0.3)' : 'rgba(220, 38, 38, 0.2)'}`,
      borderRadius: '4px',
      fontSize: '12px',
      color: '#dc2626',
      lineHeight: '1.4'
    }}>
      <div style={{ fontWeight: '600', marginBottom: '4px' }}>
        {error.message}
      </div>
      <div style={{ fontSize: '11px', opacity: 0.9 }}>
        {error.details}
      </div>
    </div>
  );
});

const TabNavigation = React.memo(({ 
  activeTab, 
  loading, 
  isDark, 
  onHardwareTabClick, 
  onOcppTabClick,
  onOutletTabClick,
  tabContainerStyle,
  tabStyle
}) => {
  const hardwareTabStyle = React.useMemo(() => ({
    ...tabStyle,
    backgroundColor: activeTab === "hardware" 
      ? (isDark ? "rgb(136 171 226)" : "#ff0000")
      : "transparent",
    color: activeTab === "hardware" 
      ? "#ffffff" 
      : (isDark ? "rgb(136 171 226)" : "#ff0000"),
    borderColor: isDark ? "rgb(136 171 226)" : "#ff0000",
    opacity: loading ? 0.5 : 1,
    cursor: loading ? "not-allowed" : "pointer"
  }), [activeTab, isDark, loading, tabStyle]);

  const ocppTabStyle = React.useMemo(() => ({
    ...tabStyle,
    backgroundColor: activeTab === "ocpp" 
      ? (isDark ? "rgb(136 171 226)" : "#ff0000")
      : "transparent",
    color: activeTab === "ocpp" 
      ? "#ffffff" 
      : (isDark ? "rgb(136 171 226)" : "#ff0000"),
    borderColor: isDark ? "rgb(136 171 226)" : "#ff0000",
    opacity: loading ? 0.5 : 1,
    cursor: loading ? "not-allowed" : "pointer"
  }), [activeTab, isDark, loading, tabStyle]);

  const outletTabStyle = React.useMemo(() => ({
    ...tabStyle,
    backgroundColor: activeTab === "outlet" 
      ? (isDark ? "rgb(136 171 226)" : "#ff0000")
      : "transparent",
    color: activeTab === "outlet" 
      ? "#ffffff" 
      : (isDark ? "rgb(136 171 226)" : "#ff0000"),
    borderColor: isDark ? "rgb(136 171 226)" : "#ff0000",
    opacity: loading ? 0.5 : 1,
    cursor: loading ? "not-allowed" : "pointer"
  }), [activeTab, isDark, loading, tabStyle]);

  return (
    <div style={tabContainerStyle}>
      <button
        onClick={onHardwareTabClick}
        disabled={loading}
        style={hardwareTabStyle}
      >
        <FaMicrochip style={{ marginRight: "8px" }} />
        Hardware Config
      </button>
      <button
        onClick={onOcppTabClick}
        disabled={loading}
        style={ocppTabStyle}
      >
        <FaDesktop style={{ marginRight: "8px" }} />
        OCPP Config
      </button>
      <button
        onClick={onOutletTabClick}
        disabled={loading}
        style={outletTabStyle}
      >
        <FaPlug style={{ marginRight: "8px" }} />
        Outlet Config
      </button>
    </div>
  );
});

const Setting = React.memo(() => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [activeTab, setActiveTab] = useState("hardware");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const { theme } = useContext(ThemeContext);
  
  // Only subscribe to the specific config value, not the entire charging state
  const config = useSelector((state) => state.charging?.config);

  // Add CSS keyframes for smooth value transitions
  React.useEffect(() => {
    const style = document.createElement('style');
    style.textContent = `
      @keyframes valueChange {
        0% { opacity: 0.8; transform: scale(0.98); }
        50% { opacity: 0.9; transform: scale(1.01); }
        100% { opacity: 1; transform: scale(1); }
      }
      
      @keyframes dropdownSlide {
        0% { opacity: 0; transform: translateY(-8px); }
        100% { opacity: 1; transform: translateY(0); }
      }
      
      .setting-value-transition {
        animation: valueChange 0.25s ease-out;
      }
      
      .dropdown-transition {
        animation: dropdownSlide 0.2s ease-out;
      }
    `;
    document.head.appendChild(style);
    
    return () => {
      if (document.head.contains(style)) {
        document.head.removeChild(style);
      }
    };
  }, []);

  // Configuration State - will be populated from API
  const [softwareConfig, setSoftwareConfig] = useState({});
  const [hardwareConfig, setHardwareConfig] = useState({});
  const [outletConfig, setOutletConfig] = useState({});
  const [rawConfig, setRawConfig] = useState({});
  
  // Configuration validation state for cross-endpoint comparison
  const [configValidation, setConfigValidation] = useState({});
  const [validationErrors, setValidationErrors] = useState({});
  
  // Restart button state tracking
  const [hasChanges, setHasChanges] = useState(false);
  const [lastUpdateSuccess, setLastUpdateSuccess] = useState(false);
  const [isRestarting, setIsRestarting] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Memoize API base URL to prevent unnecessary re-renders
  const apiUrl = React.useMemo(() => config?.API, [config?.API]);

  // Configuration key mapping - defines which keys to display and their API sources
  const configKeyMapping = {
    // Keys from OCPP Client API
    'OCPPEndpointToBackend': { source: 'ocpp', path: 'OCPPEndpointToBackend' },
    'chargerName': { source: 'ocpp', path: 'chargerName' },
    'chargePointSerialNumber': { source: 'ocpp', path: 'chargePointSerialNumber' },
    'chargingPointModel': { source: 'ocpp', path: 'chargingPointModel' },
    'chargingPointVendor': { source: 'ocpp', path: 'chargingPointVendor' },
    'acceptRemoteStartOnPreparingOnly': { source: 'ocpp', path: 'acceptRemoteStartOnPreparingOnly' },
    'maxPowerLimitInkW': { source: 'ocpp', path: 'maxPowerLimitInkW', syncWith: 'maxKW' },
    'maxCurrentLimitInAmps': { source: 'ocpp', path: 'maxCurrentLimitInAmps', syncWith: 'maxA' },
    'emulatedMetering': { source: 'ocpp', path: 'emulatedMetering' },
    'underVoltageThreshold': { source: 'ocpp', path: 'underVoltageThreshold' },
    'overVoltageThreshold': { source: 'ocpp', path: 'overVoltageThreshold' },
    'acceptRemoteStartOnPreparingOnly': { source: 'ocpp', path: 'acceptRemoteStartOnPreparingOnly' },
    
    // Keys from UserConfig API (nested paths)
    'powerSaveInIdleMode': { source: 'ocpp', path: 'powerSaveInIdleMode', syncWith: 'userPowerSaveInIdleMode' },
    'userPowerSaveInIdleMode': { source: 'userconfig', path: 'ccs.stack.powerSaveInIdleMode', syncWith: 'powerSaveInIdleMode' },
    'maxKW': { source: 'userconfig', path: 'ccs.stack.maxKW', syncWith: 'maxPowerLimitInkW' },
    'maxA': { source: 'userconfig', path: 'ccs.stack.maxA', syncWith: 'maxCurrentLimitInAmps' },
    'dlbMode': { source: 'userconfig', path: 'ccs.dlbMode' },
    'num_of_modules': { source: 'userconfig', path: 'ccs.num_of_modules' },
    'Convertor Type': { source: 'userconfig', path: 'ccs.intcc.conv' },
    'imd': { source: 'userconfig', path: 'ccs.stack.imd' },
    'no of outlet': { source: 'outletConfig', path: 'ccs.no_of_outlet' },
  };

  // Helper function to get nested value from object using dot notation
  const getNestedValue = (obj, path) => {
    return path.split('.').reduce((current, key) => current && current[key], obj);
  };

  // Helper function to set nested value in object using dot notation
  const setNestedValue = (obj, path, value) => {
    const keys = path.split('.');
    const lastKey = keys.pop();
    const target = keys.reduce((current, key) => {
      if (!current[key]) current[key] = {};
      return current[key];
    }, obj);
    target[lastKey] = value;
    return obj;
  };

  // Helper function to add default dlbMode and update backend if not present
  const addDefaultDlbMode = async (userConfig, endpoint) => {
    // Create a deep copy to avoid mutating the original
    const config = JSON.parse(JSON.stringify(userConfig));
    
    // Ensure ccs object exists
    if (!config.ccs) {
      config.ccs = {};
    }
    
    // Check if dlbMode is missing and add default
    if (!config.ccs.dlbMode) {
      config.ccs.dlbMode = "singleCombo";
      console.log(`Adding default dlbMode to ${endpoint}`);
      
      // Update the backend userconfig with the default dlbMode
      try {
        const response = await fetch(endpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(config),
        });
        
        if (!response.ok) {
          console.error(`Failed to update ${endpoint} with default dlbMode:`, response.status, response.statusText);
        } else {
          console.log(`Successfully updated ${endpoint} with default dlbMode`);
        }
      } catch (error) {
        console.error(`Error updating ${endpoint} with default dlbMode:`, error);
      }
    }
    
    return config;
  };

  // Helper function to add default imd and update backend if not present
  const addDefaultImd = async (userConfig, endpoint) => {
    const config = JSON.parse(JSON.stringify(userConfig));
    if (!config.ccs) config.ccs = {};
    if (!config.ccs.stack) config.ccs.stack = {};
    if (!config.ccs.stack.imd) {
      config.ccs.stack.imd = "bender";
      console.log(`Adding default imd to ${endpoint}`);
      try {
        const response = await fetch(endpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(config),
        });
        if (!response.ok) {
          console.error(`Failed to update ${endpoint} with default imd:`, response.status, response.statusText);
        } else {
          console.log(`Successfully updated ${endpoint} with default imd`);
        }
      } catch (error) {
        console.error(`Error updating ${endpoint} with default imd:`, error);
      }
    }
    return config;
  };

  // API Functions
  const fetchAllConfigurations = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      // Fetch configurations from all endpoints in parallel (including outlet)
      const [ocppResponse, userConfig100Response, userConfig101Response, outletResponse] = await Promise.all([
        fetch(`${apiUrl}/ocpp-client/config`),
        fetch(`http://10.20.27.100/api/system/userconfig`),
        fetch(`http://10.20.27.101/api/system/userconfig`),
        fetch(`${apiUrl}/outlets`)
      ]);

      if (!ocppResponse.ok) {
        throw new Error(`OCPP Config API error! status: ${ocppResponse.status}`);
      }
      if (!userConfig100Response.ok) {
        throw new Error(`SECC User Config API error! status: ${userConfig100Response.status}`);
      }
      if (!userConfig101Response.ok) {
        throw new Error(`LE User Config API error! status: ${userConfig101Response.status}`);
      }

      const ocppData = await ocppResponse.json();
      let userConfig100Data = await userConfig100Response.json();
      let userConfig101Data = await userConfig101Response.json();
      let outletData = null;
      if (outletResponse && outletResponse.ok) {
        outletData = await outletResponse.json();
      } else {
        console.error('Failed to GET outlets:', outletResponse?.status, outletResponse?.statusText);
      }
      
      // Add default dlbMode if not present in userconfig responses and update backend
      userConfig100Data = await addDefaultDlbMode(userConfig100Data, 'http://10.20.27.100/api/system/userconfig');
      userConfig101Data = await addDefaultDlbMode(userConfig101Data, 'http://10.20.27.101/api/system/userconfig');

      // Add default imd if not present in userconfig responses and update backend
      userConfig100Data = await addDefaultImd(userConfig100Data, 'http://10.20.27.100/api/system/userconfig');
      userConfig101Data = await addDefaultImd(userConfig101Data, 'http://10.20.27.101/api/system/userconfig');

      
      // Store all configurations for validation
      const allConfigs = {
        ocpp: ocppData,
        userconfig100: userConfig100Data,
        userconfig101: userConfig101Data
      };
      
      // Validate configurations across endpoints
      validateConfigurationsAcrossEndpoints(allConfigs);
      
      // Categorize configuration from both sources (using 100 as primary)
      categorizeConfiguration(ocppData, userConfig100Data);

      // Populate outletConfig from GET /outlets
      const outletCount = Array.isArray(outletData) ? outletData.length : (outletData?.length || 0);
      const noOfOutletDisplay = outletCount <= 1 ? 1 : 2;
      setOutletConfig({
        'no of outlet': {
          value: noOfOutletDisplay,
          source: 'outletConfig',
          path: 'ccs.no_of_outlet'
        }
      });

      // Extend raw config with outlet data
      setRawConfig(prev => ({ ...prev, outlet: outletData }));
    } catch (err) {
       console.error('Error fetching configuration:', err);
       // Clear any existing configuration on error
       setRawConfig({});
       setSoftwareConfig({});
       setHardwareConfig({});
       setConfigValidation({});
       setValidationErrors({});
    } finally {
      setLoading(false);
    }
  }, [apiUrl]);

  // Refresh configuration function - similar to fetchAllConfigurations but with different state management
  const refreshConfiguration = useCallback(async () => {
    setIsRefreshing(true);
    setError(null);

    try {
      // Fetch configurations from all endpoints in parallel (including outlet)
      const [ocppResponse, userConfig100Response, userConfig101Response, outletResponse] = await Promise.all([
        fetch(`${apiUrl}/ocpp-client/config`),
        fetch(`http://10.20.27.100/api/system/userconfig`),
        fetch(`http://10.20.27.101/api/system/userconfig`),
        fetch(`${apiUrl}/outlets`)
      ]);

      if (!ocppResponse.ok) {
        throw new Error(`OCPP Config API error! status: ${ocppResponse.status}`);
      }
      if (!userConfig100Response.ok) {
        throw new Error(`SECC User Config API error! status: ${userConfig100Response.status}`);
      }
      if (!userConfig101Response.ok) {
        throw new Error(`LE User Config API error! status: ${userConfig101Response.status}`);
      }

      const ocppData = await ocppResponse.json();
      let userConfig100Data = await userConfig100Response.json();
      let userConfig101Data = await userConfig101Response.json();
      let outletData = null;
      if (outletResponse && outletResponse.ok) {
        outletData = await outletResponse.json();
      } else {
        console.error('Failed to GET outlets:', outletResponse?.status, outletResponse?.statusText);
      }
      
      // Add default dlbMode if not present in userconfig responses and update backend
      userConfig100Data = await addDefaultDlbMode(userConfig100Data, 'http://10.20.27.100/api/system/userconfig');
      userConfig101Data = await addDefaultDlbMode(userConfig101Data, 'http://10.20.27.101/api/system/userconfig');

       // Add default imd if not present in userconfig responses and update backend
      userConfig100Data = await addDefaultImd(userConfig100Data, 'http://10.20.27.100/api/system/userconfig');
      userConfig101Data = await addDefaultImd(userConfig101Data, 'http://10.20.27.101/api/system/userconfig');
      
      // Store all configurations for validation
      const allConfigs = {
        ocpp: ocppData,
        userconfig100: userConfig100Data,
        userconfig101: userConfig101Data
      };
      
      // Validate configurations across endpoints
      validateConfigurationsAcrossEndpoints(allConfigs);
      
      // Categorize configuration from both sources (using 100 as primary)
      categorizeConfiguration(ocppData, userConfig100Data);

      // Populate outletConfig from GET /outlets
      const outletCount = Array.isArray(outletData) ? outletData.length : (outletData?.length || 0);
      const noOfOutletDisplay = outletCount <= 1 ? 1 : 2;
      setOutletConfig({
        'no of outlet': {
          value: noOfOutletDisplay,
          source: 'outletConfig',
          path: 'ccs.no_of_outlet'
        }
      });

      // Reset change tracking after successful refresh
      setHasChanges(false);
      setLastUpdateSuccess(true);
    } catch (err) {
       setError(`Failed to refresh configuration: ${err.message}`);
       console.error('Error refreshing configuration:', err);
    } finally {
      setIsRefreshing(false);
    }
  }, [apiUrl]);

  // Create debounced versions of API functions to prevent excessive calls
  const { debouncedCallback: debouncedUpdateOcppConfig } = useDebounce(
    async (key, value) => {
      const mapping = configKeyMapping[key];
      if (!mapping || mapping.source !== 'ocpp') {
        console.error('Invalid OCPP key:', key);
        return;
      }

      setLoading(true);
      setHasChanges(true);
      setLastUpdateSuccess(false);

      try {
        const updatePayload = { [mapping.path]: value };
        const response = await fetch(`${apiUrl}/ocpp-client/config`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(updatePayload),
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        setLastUpdateSuccess(true);
        // Refresh configuration after successful update
        await fetchAllConfigurations();
      } catch (err) {
        console.error('Error updating OCPP configuration:', err);
        setError(err.message);
        setLastUpdateSuccess(false);
      } finally {
        setLoading(false);
      }
    },
    500
  );

  const { debouncedCallback: debouncedUpdateUserConfig } = useDebounce(
    async (key, value) => {
      const mapping = configKeyMapping[key];
      if (!mapping || mapping.source !== 'userconfig') {
        console.error('Invalid UserConfig key:', key);
        return;
      }

      setLoading(true);
      setHasChanges(true);
      setLastUpdateSuccess(false);

      try {
        // Get current userconfig to maintain structure
        const currentUserConfig = rawConfig.userconfig || {};
        const updatedUserConfig = { ...currentUserConfig };
        
        // Set the nested value
        setNestedValue(updatedUserConfig, mapping.path, value);

        // Define both API endpoints
        const endpoints = [
          'http://10.20.27.100/api/system/userconfig',
          'http://10.20.27.101/api/system/userconfig'
        ];

        // Create fetch promises for both endpoints
        const fetchPromises = endpoints.map(endpoint => 
          fetch(endpoint, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(updatedUserConfig),
          })
        );

        // Execute both requests in parallel
        const responses = await Promise.all(fetchPromises);

        // Check if all responses are successful
        const failedEndpoints = [];
        responses.forEach((response, index) => {
          if (!response.ok) {
            failedEndpoints.push({
              endpoint: endpoints[index],
              status: response.status,
              statusText: response.statusText
            });
          }
        });

        if (failedEndpoints.length > 0) {
          const errorMessages = failedEndpoints.map(
            failed => `${failed.endpoint}: ${failed.status} ${failed.statusText}`
          );
          throw new Error(`Failed to update endpoints: ${errorMessages.join(', ')}`);
        }

        setLastUpdateSuccess(true);
        console.log('Successfully updated UserConfig on both endpoints:', endpoints);
        
        // Refresh configuration after successful update to both endpoints
        await fetchAllConfigurations();
      } catch (err) {
        console.error('Error updating UserConfig configuration:', err);
        setError(err.message);
        setLastUpdateSuccess(false);
      } finally {
        setLoading(false);
      }
    },
    500
  );


  // Update OCPP configuration (original function for immediate calls)
  const updateOcppConfig = useCallback(async (key, value) => {
    const mapping = configKeyMapping[key];
    if (!mapping || mapping.source !== 'ocpp') {
      console.error('Invalid OCPP key:', key);
      return;
    }

    setLoading(true);
    setHasChanges(true);
    setLastUpdateSuccess(false);

    try {
      const updatePayload = { [mapping.path]: value };
      const response = await fetch(`${apiUrl}/ocpp-client/config`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updatePayload),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      setLastUpdateSuccess(true);
      // Refresh configuration after successful update
      await fetchAllConfigurations();
    } catch (err) {
      console.error('Error updating OCPP configuration:', err);
      setError(err.message);
      setLastUpdateSuccess(false);
    } finally {
      setLoading(false);
    }
  }, [apiUrl, fetchAllConfigurations]);

  // Update UserConfig configuration
  const updateUserConfig = useCallback(async (key, value) => {
    const mapping = configKeyMapping[key];
    if (!mapping || mapping.source !== 'userconfig') {
      console.error('Invalid UserConfig key:', key);
      return;
    }

    setLoading(true);
    setHasChanges(true);
    setLastUpdateSuccess(false);

    try {
      // Define both API endpoints
      const endpoints = [
        'http://10.20.27.100/api/system/userconfig',
        'http://10.20.27.101/api/system/userconfig'
      ];

      // Prefetch latest userconfig from both endpoints
      const getResponses = await Promise.all(endpoints.map(endpoint => fetch(endpoint)));
      const latest100 = getResponses[0] && getResponses[0].ok ? await getResponses[0].json() : null;
      const latest101 = getResponses[1] && getResponses[1].ok ? await getResponses[1].json() : null;

      // Use fallback if either is null
      const base100 = latest100 || rawConfig;
      const base101 = latest101 || rawConfig;

      // Clone and update each independently
      const updated100 = JSON.parse(JSON.stringify(base100));
      const updated101 = JSON.parse(JSON.stringify(base101));

      // Apply the same key/value change to both configs
      setNestedValue(updated100, mapping.path, value);
      setNestedValue(updated101, mapping.path, value);

    // Create POST payloads for each endpoint individually
    const postPromises = [
      fetch(endpoints[0], {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updated100)
      }),
      fetch(endpoints[1], {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updated101)
      })
    ];

    // Execute both requests in parallel
    const responses = await Promise.all(postPromises);

    // Collect failed endpoints
    const failedEndpoints = responses
      .map((response, index) => !response.ok ? ({
        endpoint: endpoints[index],
        status: response.status,
        statusText: response.statusText
      }) : null)
      .filter(Boolean);

    if (failedEndpoints.length > 0) {
      const errorMessages = failedEndpoints.map(
        f => `${f.endpoint}: ${f.status} ${f.statusText}`
      );
      throw new Error(`Failed to update endpoints: ${errorMessages.join(', ')}`);
    }

    setLastUpdateSuccess(true);
    // Refresh configuration after successful updates
    await fetchAllConfigurations();
  } catch (err) {
    setError(err.message);
    setLastUpdateSuccess(false);
  } finally {
    setLoading(false);
  }
}, [rawConfig, fetchAllConfigurations]);

  // Synchronized update function for keys that need to be kept in sync
  const updateSynchronizedConfig = useCallback(async (key, value) => {
    const mapping = configKeyMapping[key];
    if (!mapping) {
      console.error('Invalid key:', key);
      return;
    }

    setLoading(true);
    setHasChanges(true);
    setLastUpdateSuccess(false);

    try {
      const updates = [];
      
      // Update the primary configuration
      if (mapping.source === 'ocpp') {
        updates.push(updateOcppConfig(key, value));
      } else if (mapping.source === 'userconfig') {
        updates.push(updateUserConfig(key, value));
      }

      // If this key has a sync partner, update it too
      if (mapping.syncWith) {
        const syncKey = mapping.syncWith;
        const syncMapping = configKeyMapping[syncKey];
        
        if (syncMapping) {
          if (syncMapping.source === 'ocpp') {
            updates.push(updateOcppConfig(syncKey, value));
          } else if (syncMapping.source === 'userconfig') {
            updates.push(updateUserConfig(syncKey, value));
          }
        }
      }

      // Wait for all updates to complete
      await Promise.all(updates);
      
      setLastUpdateSuccess(true);
      console.log(`Successfully synchronized ${key} with value:`, value);
      
    } catch (err) {
      console.error('Error in synchronized update:', err);
      setError(err.message);
      setLastUpdateSuccess(false);
    } finally {
      setLoading(false);
    }
  }, [configKeyMapping, updateOcppConfig, updateUserConfig]);

  // Restart OCPP Client API function
  const restartCharger = useCallback(async () => {
    setLoading(true);
    setError(null);
    setIsRestarting(true); // Show restarting screen
    
    try {
      const response = await fetch(`${apiUrl}/reset`, {
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
    return FaCog; // Return the component, not JSX
  }, []);

  // Helper function to get appropriate color based on key name - Memoized
  const getSettingColor = React.useCallback((key) => {
    return '#00ffaa'; // Default color
  }, []);

  // Configuration validation function
  const validateConfigurationsAcrossEndpoints = useCallback((allConfigs) => {
    const { ocpp, userconfig100, userconfig101 } = allConfigs;
    const errors = {};
    
    // Define the keys to validate and their mappings
    const validationKeys = [
      {
        ocppKey: 'maxPowerLimitInkW',
        userconfigKey: 'maxKW',
        displayName: 'Max Power Limit (kW)'
      },
      {
        ocppKey: 'maxCurrentLimitInAmps', 
        userconfigKey: 'maxA',
        displayName: 'Max Current Limit (Amps)'
      },
      {
        ocppKey: 'powerSaveInIdleMode',
        userconfigKey: 'powerSaveInIdleMode',
        displayName: 'Power Save in Idle Mode'
      }
    ];
    
    validationKeys.forEach(({ ocppKey, userconfigKey, displayName }) => {
      // Get values from all three sources
      const ocppValue = ocpp[ocppKey];
      const userconfig100Value = userconfig100?.ccs?.stack?.[userconfigKey];
      const userconfig101Value = userconfig101?.ccs?.stack?.[userconfigKey];
      
      // Create array of all values for comparison
      const values = [
        { source: 'OCPP Client', value: ocppValue },
        { source: 'SECC User Config', value: userconfig100Value },
        { source: 'LE User Config', value: userconfig101Value }
      ];
      
      // Filter out undefined/null values
      const definedValues = values.filter(v => v.value !== undefined && v.value !== null);
      
      if (definedValues.length > 1) {
        // Check if all defined values are the same
        const firstValue = definedValues[0].value;
        const hasDiscrepancy = definedValues.some(v => v.value !== firstValue);
        
        if (hasDiscrepancy) {
          // Create detailed error message
          const valueDescriptions = definedValues.map(v => `${v.source}: ${v.value}`).join(', ');
          errors[ocppKey] = {
            message: `Configuration mismatch detected for ${displayName}`,
            details: valueDescriptions,
            values: definedValues
          };
        }
      }
    });
    
    // Define userconfig-only keys to validate between endpoints 100 and 101
    const userconfigOnlyKeys = [
      {
        key: 'dlbMode',
        path: 'ccs.dlbMode',
        displayName: 'DLB Mode'
      },
      {
        key: 'num_of_modules',
        path: 'ccs.num_of_modules', 
        displayName: 'Number of Modules'
      },{
        key: 'imd',
        path: 'ccs.stack.imd',
        displayName: 'IMD'
      },
      {
        key: 'Convertor Type',
        path: 'ccs.intcc.conv', 
        displayName: 'Convertor Type'
      }
    ];
    
    // Validate userconfig-only keys between endpoints 100 and 101
    userconfigOnlyKeys.forEach(({ key, path, displayName }) => {
      const userconfig100Value = getNestedValue(userconfig100, path);
      const userconfig101Value = getNestedValue(userconfig101, path);
      
      // Only validate if both values exist
      if (userconfig100Value !== undefined && userconfig101Value !== undefined) {
        if (userconfig100Value !== userconfig101Value) {
          errors[key] = {
            message: `Configuration mismatch detected for ${displayName}`,
            details: `SECC User Config: ${userconfig100Value}, LE User Config: ${userconfig101Value}`,
            values: [
              { source: 'SECC User Config', value: userconfig100Value },
              { source: 'LE User Config', value: userconfig101Value }
            ]
          };
        }
      }
    });

    // Additional validation: Compare num_of_modules "available options" between endpoints 100 and 101
    // Options on the UI depend on dlbMode. Compute options for each endpoint and compare.
    try {
      const dlbMode100 = getNestedValue(userconfig100, 'ccs.dlbMode');
      const dlbMode101 = getNestedValue(userconfig101, 'ccs.dlbMode');
      const numOfModules100 = getNestedValue(userconfig100, 'ccs.num_of_modules');
      const numOfModules101 = getNestedValue(userconfig101, 'ccs.num_of_modules');

      const computeNumModulesOptions = (dlbMode) => {
        if (dlbMode === 'singleCombo') {
          return { options: [2, 4, 6, 8], disabled: false, defaultValue: 2 };
        } else if (dlbMode === 'dualCombo') {
          return { options: [3], disabled: true, defaultValue: 3 };
        } else if (dlbMode === 'tripleCombo') {
          return { options: [4], disabled: true, defaultValue: 4 };
        }
        return { options: [], disabled: false, defaultValue: null };
      };

      const options100 = computeNumModulesOptions(dlbMode100);
      const options101 = computeNumModulesOptions(dlbMode101);

      const arraysEqual = (a, b) => Array.isArray(a) && Array.isArray(b) && a.length === b.length && a.every((v, i) => v === b[i]);
      const hasOptionsDiscrepancy = !arraysEqual(options100.options, options101.options) || options100.disabled !== options101.disabled || !options100.options.includes(numOfModules100) || !options101.options.includes(numOfModules101)

      if (hasOptionsDiscrepancy) {
        const existingError = errors['num_of_modules'];
        const optionsDetails = `SECC (dlbMode: ${dlbMode100 ?? 'N/A'}) num_of_modules: ${numOfModules100} ; LE (dlbMode: ${dlbMode101 ?? 'N/A'}) num_of_modules: ${numOfModules101}`;
        const values = [
          { source: 'SECC User Config', value: getNestedValue(userconfig100, 'ccs.num_of_modules') },
          { source: 'LE User Config', value: getNestedValue(userconfig101, 'ccs.num_of_modules') }
        ];

        if (existingError) {
          errors['num_of_modules'] = {
            ...existingError,
            // Append options mismatch details to existing discrepancy details
            details: `${existingError.details}; ${optionsDetails}`,
            values
          };
        } else {
          errors['num_of_modules'] = {
            message: 'Number of Modules options mismatch',
            details: optionsDetails,
            values
          };
        }
      }
    } catch (e) {
      console.warn('Failed to validate num_of_modules options across endpoints:', e);
    }
    
    // Update validation state
    setValidationErrors(errors);
    setConfigValidation(allConfigs);
    
    // Log validation results
    if (Object.keys(errors).length > 0) {
      console.warn('Configuration validation errors found:', errors);
    } else {
      console.log('All configurations are synchronized across endpoints');
    }
  }, []);

  // Categorize configuration from both API sources
  const categorizeConfiguration = React.useCallback((ocppConfig, userConfig) => {
    const displayConfig = {};
    
    // Process each configured key
    Object.entries(configKeyMapping).forEach(([displayKey, mapping]) => {
      let value;
      
      if (mapping.source === 'ocpp' && ocppConfig) {
        value = getNestedValue(ocppConfig, mapping.path);
      } else if (mapping.source === 'userconfig' && userConfig) {
        value = getNestedValue(userConfig, mapping.path);
      }
      
      if (value !== undefined) {
        displayConfig[displayKey] = {
          value: value,
          source: mapping.source,
          path: mapping.path
        };
      }
    });

    // Separate into categories for display
    const ocppKeys = Object.keys(configKeyMapping).filter(key => 
      configKeyMapping[key].source === 'ocpp'
    );
    
    const userConfigKeys = Object.keys(configKeyMapping).filter(key => 
      configKeyMapping[key].source === 'userconfig'
    );

    const ocppDisplay = {};
    const hardwareDisplay = {};

    ocppKeys.forEach(key => {
      if (displayConfig[key]) {
        ocppDisplay[key] = displayConfig[key];
      }
    });

    userConfigKeys.forEach(key => {
      if (displayConfig[key]) {
        // Don't display userPowerSaveInIdleMode separately since it's synchronized with powerSaveInIdleMode
        if (key !== 'userPowerSaveInIdleMode' && key !== 'maxKW' && key !== 'maxA') {
          hardwareDisplay[key] = displayConfig[key];
        }
      }
    });

    // Batch state updates to prevent multiple re-renders
    React.startTransition(() => {
      setSoftwareConfig(ocppDisplay);
      setHardwareConfig(hardwareDisplay);
      setRawConfig({ ocpp: ocppConfig, userconfig: userConfig });
    });
  }, [configKeyMapping]);

  // CRITICAL FIX: Add timeout tracking for debounced updates
  const updateTimeouts = React.useRef({});

  // CRITICAL FIX: Optimized memoized callback functions to prevent cascading re-renders
  const memoizedUpdateHardwareConfig = React.useCallback((key, value) => {
    // Prevent unnecessary updates if value hasn't changed
    const currentValue = hardwareConfig[key]?.value;
    if (currentValue === value) {
      console.log(`Skipping update for ${key} - value unchanged:`, value);
      return;
    }

    console.log(`Updating hardware config: ${key} = ${value}`);
    
    // Optimistically update the UI state immediately
    React.startTransition(() => {
      setHardwareConfig(prev => ({
        ...prev,
        [key]: { ...prev[key], value }
      }));
    });

    // Debounce the actual API call to prevent rapid successive calls
    const updateKey = `hardware_${key}`;
    if (updateTimeouts.current[updateKey]) {
      clearTimeout(updateTimeouts.current[updateKey]);
    }
    
    updateTimeouts.current[updateKey] = setTimeout(async () => {
      try {
        // Check if this key needs synchronization
        const mapping = configKeyMapping[key];
        if (mapping && mapping.syncWith) {
          await updateSynchronizedConfig(key, value);
        } else {
          // Use debounced API call for better performance
          debouncedUpdateUserConfig(key, value);
        }
        console.log(`Successfully updated hardware config: ${key}`);
      } catch (error) {
        console.error(`Failed to update hardware config ${key}:`, error);
        // Revert the optimistic update on error
        React.startTransition(() => {
          setHardwareConfig(prev => ({
            ...prev,
            [key]: { ...prev[key], value: currentValue }
          }));
        });
      } finally {
        delete updateTimeouts.current[updateKey];
      }
    }, 300); // Increased debounce time for stability
  }, [hardwareConfig, debouncedUpdateUserConfig, updateSynchronizedConfig, configKeyMapping]);

  const memoizedUpdateOcppConfig = React.useCallback((key, value) => {
    // Prevent unnecessary updates if value hasn't changed
    const currentValue = softwareConfig[key]?.value;
    if (currentValue === value) {
      console.log(`Skipping update for ${key} - value unchanged:`, value);
      return;
    }

    console.log(`Updating OCPP config: ${key} = ${value}`);
    
    // Optimistically update the UI state immediately
    React.startTransition(() => {
      setSoftwareConfig(prev => ({
        ...prev,
        [key]: { ...prev[key], value }
      }));
    });

    // Debounce the actual API call to prevent rapid successive calls
    const updateKey = `ocpp_${key}`;
    if (updateTimeouts.current[updateKey]) {
      clearTimeout(updateTimeouts.current[updateKey]);
    }
    
    updateTimeouts.current[updateKey] = setTimeout(async () => {
      try {
        // Check if this key needs synchronization
        const mapping = configKeyMapping[key];
        if (mapping && mapping.syncWith) {
          await updateSynchronizedConfig(key, value);
        } else {
          // Use debounced API call for better performance
          debouncedUpdateOcppConfig(key, value);
        }
        console.log(`Successfully updated OCPP config: ${key}`);
      } catch (error) {
        console.error(`Failed to update OCPP config ${key}:`, error);
        // Revert the optimistic update on error
        React.startTransition(() => {
          setSoftwareConfig(prev => ({
            ...prev,
            [key]: { ...prev[key], value: currentValue }
          }));
        });
      } finally {
        delete updateTimeouts.current[updateKey];
      }
    }, 300); // Increased debounce time for stability
  }, [softwareConfig, debouncedUpdateOcppConfig, updateSynchronizedConfig, configKeyMapping]);

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
      fetchAllConfigurations();
    }
  }, [isAuthenticated, fetchAllConfigurations]);



  // Dynamic Setting Component - Heavily optimized to prevent unnecessary re-renders
  const DynamicSetting = React.memo(({ configKey, settingData, onValueChange, category, isDark }) => {
    // Extract the actual value from the setting data structure
    const value = settingData.value;
    const inputType = getInputType(value);
    const label = configKey
    const icon = React.useMemo(() => getSettingIcon(configKey), [configKey]);
    const color = React.useMemo(() => getSettingColor(configKey), [configKey]);
    const updateFunction = React.useMemo(() => 
      category === 'ocpp' ? memoizedUpdateOcppConfig : memoizedUpdateHardwareConfig, 
      [category, memoizedUpdateOcppConfig, memoizedUpdateHardwareConfig]
    );

    // Check for validation errors for this specific config key
    const validationError = React.useMemo(() => {
      // Map display keys to validation keys
      const keyMappings = {
        'maxPowerLimitInkW': 'maxPowerLimitInkW',
        'maxKW': 'maxPowerLimitInkW',
        'maxCurrentLimitInAmps': 'maxCurrentLimitInAmps', 
        'maxA': 'maxCurrentLimitInAmps',
        'powerSaveInIdleMode': 'powerSaveInIdleMode',
        "dlbMode":"dlbMode",
        "num_of_modules":"num_of_modules",
        "Convertor Type":"Convertor Type",
        "imd":"imd"
      };
      
      const validationKey = keyMappings[configKey];
      return validationKey ? validationErrors[validationKey] : null;
    }, [configKey, validationErrors]);

    // Memoized callback to prevent re-renders - using stable callback hook
    const handleValueChange = useStableCallback((newValue) => {
      updateFunction(configKey, newValue);
    }, [updateFunction, configKey]);

    // Move all hooks to top level to avoid conditional hook calls
    // dlbMode options - always computed but only used when needed
    const dlbOptions = React.useMemo(() => [
      { value: 'singleCombo', label: 'singleCombo' },
      { value: 'dualCombo', label: 'dualCombo' },
      { value: 'tripleCombo', label: 'tripleCombo' }
    ], []);

    // Converter Type options - fixed list for userconfig ccs.intcc.conv
    const converterTypeOptions = React.useMemo(() => [
      { value: 'infy', label: 'infy' },
      { value: 'uugp', label: 'uugp' }
    ], []);

    // IMD options - fixed list for userconfig ccs.stack.imd
    const imdOptions = React.useMemo(() => [
      { value: 'bender', label: 'bender' },
      { value: 'gongyuan', label: 'gongyuan' }
    ], []);

    // No of outlet options - fixed list for userconfig ccs.no_of_outlet
    const noOfOutletOptions = React.useMemo(() => [
      { value: 1, label: '1' },
      { value: 2, label: '2' }
    ], []);

    // No of outlet value change handler - triggers outlet/controllers API updates then persists value
    const noOfOutletHandleValueChange = React.useCallback(async (newValue) => {
      // Mark change and begin loading, disable restart until success
      setLoading(true);
      setHasChanges(true);
      setLastUpdateSuccess(false);
      try {
        const outletPayload = newValue === 1
          ? [
              { type: 'CCS', ip: '10.20.27.100', outletId: 1, port: 5683, out_of_order: false, ocmf: false }
            ]
          : [
              { type: 'CCS', ip: '10.20.27.100', outletId: 1, port: 5683, out_of_order: false, ocmf: false },
              { type: 'CCS', ip: '10.20.27.101', outletId: 2, port: 5683, out_of_order: false, ocmf: false }
            ];
        const controllersPayload = newValue === 1
          ? [
              { id: 1, ip: '10.20.27.100' }
            ]
          : [
              { id: 1, ip: '10.20.27.100' },
              { id: 2, ip: '10.20.27.101' }
            ];

        const responses = await Promise.all([
          fetch(`${apiUrl}/outlets`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(outletPayload)
          }),
          fetch(`${apiUrl}/controllers`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(controllersPayload)
          })
        ]);

        const failed = responses.filter(r => !r.ok);
        if (failed.length > 0) {
          console.error('Failed to update outlet/controllers:', failed.map(r => `${r.status} ${r.statusText}`).join(', '));
          setLastUpdateSuccess(false);
        } else {
          console.log('Successfully updated outlet/controllers for no of outlet:', newValue);
          setLastUpdateSuccess(true);
          // Refresh configuration after successful update
          await fetchAllConfigurations();
        }
      } catch (err) {
        console.error('Error updating outlet/controllers:', err);
        setLastUpdateSuccess(false);
      } finally {
        setLoading(false);
        // Update local display state from selection
        setNoOfOutletDisplayValue(newValue);
      }
    }, [apiUrl, fetchAllConfigurations]);

    // Local display state for 'no of outlet' driven by GET
    const [noOfOutletDisplayValue, setNoOfOutletDisplayValue] = React.useState(null);

    // Fetch current outlets via GET and map to display value (1 or 2)
    React.useEffect(() => {
      if (configKey !== 'no of outlet') return;
      const fetchOutlets = async () => {
        try {
          const response = await fetch(`${apiUrl}/outlets`);
          if (response.ok) {
            const data = await response.json();
            const count = Array.isArray(data) ? data.length : (data?.length || 0);
            setNoOfOutletDisplayValue(count <= 1 ? 1 : 2);
          } else {
            console.error('Failed to GET outlets:', response.status, response.statusText);
            setNoOfOutletDisplayValue(1);
          }
        } catch (err) {
          console.error('Error fetching outlets:', err);
          setNoOfOutletDisplayValue(1);
        }
      };
      fetchOutlets();
    }, [configKey, apiUrl]);
 
    const { debouncedCallback: debouncedAutoModuleUpdate } = useDebounce(
      async (autoModules) => {
        try {
          // Get current userconfig to maintain structure
          const currentUserConfig = rawConfig.userconfig || {};
          const updatedUserConfig = { ...currentUserConfig };
          
          // Set the num_of_modules value
          if (!updatedUserConfig.ccs) updatedUserConfig.ccs = {};
          updatedUserConfig.ccs.num_of_modules = autoModules;

          // Define both API endpoints
          const endpoints = [
            'http://10.20.27.100/api/system/userconfig',
            'http://10.20.27.101/api/system/userconfig'
          ];

          // Create fetch promises for both endpoints
          const fetchPromises = endpoints.map(endpoint => 
            fetch(endpoint, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify(updatedUserConfig),
            })
          );

          // Execute both requests in parallel
          const responses = await Promise.all(fetchPromises);

          // Check if all responses are successful
          const failedEndpoints = [];
          responses.forEach((response, index) => {
            if (!response.ok) {
              failedEndpoints.push({
                endpoint: endpoints[index],
                status: response.status,
                statusText: response.statusText
              });
            }
          });

          if (failedEndpoints.length > 0) {
            const errorMessages = failedEndpoints.map(
              failed => `${failed.endpoint}: ${failed.status} ${failed.statusText}`
            );
            console.error(`Failed to auto-update num_of_modules on endpoints: ${errorMessages.join(', ')}`);
          } else {
            console.log(`Successfully auto-set num_of_modules to ${autoModules} on both endpoints`);
          }
        } catch (err) {
          console.error('Error auto-updating num_of_modules:', err);
        }
      },
      500
    );

    // dlbMode value change handler - always created but only used when needed
    const dlbComboHandleValueChange = React.useCallback(async (newValue) => {
        // First update the dlbMode using debounced API call
        debouncedUpdateUserConfig('dlbMode', newValue);
        
        // Then automatically set num_of_modules based on dlbMode
        let autoModules = null;
        if (newValue === 'dualCombo') {
          autoModules = 3;
        } else if (newValue === 'tripleCombo') {
          autoModules = 4;
        }
        
        // If we need to auto-set modules, use debounced update
        if (autoModules !== null) {
          debouncedAutoModuleUpdate(autoModules);
        }
    }, [debouncedUpdateUserConfig, debouncedAutoModuleUpdate]);

    // CRITICAL FIX: Use stable reference for dlbMode value to prevent cross-dependencies
    const dlbComboValue = React.useMemo(() => {
      if (configKey !== 'num_of_modules') return null;
      
      // Get dlbMode value from rawConfig to avoid state dependencies
      const dlbComboFromRaw = rawConfig?.userconfig?.ccs?.dlbMode;
      if (dlbComboFromRaw) return dlbComboFromRaw;
      
      // Fallback to config states only if rawConfig is not available
      return category === 'hardware' ? 
        hardwareConfig['dlbMode']?.value : 
        softwareConfig['dlbMode']?.value;
    }, [configKey, rawConfig?.userconfig?.ccs?.dlbMode, category, hardwareConfig, softwareConfig]);

    // num_of_modules computed options and state - always computed but only used when needed
    const numModulesConfig = React.useMemo(() => {
      if (configKey !== 'num_of_modules') return null;
      
      let isDisabled = false;
      let defaultValue = value;
      let options = [];

      if (dlbComboValue === 'singleCombo') {
        // Enable dropdown with options 2, 4, 6, 8 and default to 2
        options = [
          { value: 2, label: '2' },
          { value: 4, label: '4' },
          { value: 6, label: '6' },
          { value: 8, label: '8' }
        ];
        isDisabled = false;
        // Set default value to 2 if not already set to a valid option
        if (!options.some(option => option.value === value)) {
          defaultValue = 2;
        }
      } else if (dlbComboValue === 'dualCombo') {
        // Set to 3 and disable
        defaultValue = 3;
        isDisabled = true;
      } else if (dlbComboValue === 'tripleCombo') {
        // Set to 4 and disable
        defaultValue = 4;
        isDisabled = true;
      }

      return { isDisabled, defaultValue, options };
    }, [configKey, dlbComboValue, value]);

    // num_of_modules value change handler - always created but only used when needed
    const numModulesHandleValueChange = React.useCallback((newValue) => {
        handleValueChange(newValue);
    }, [handleValueChange]);

    // CRITICAL FIX: Debounced effect to prevent rapid cascading updates
    const [pendingUpdate, setPendingUpdate] = React.useState(null);
    
    React.useEffect(() => {
      if (configKey !== 'num_of_modules' || !numModulesConfig) return;
      
      const { options } = numModulesConfig;
      let newValue = null;
      
      if (dlbComboValue === 'singleCombo' && !options.some(option => option.value === value)) {
        newValue = 2;
      } else if (dlbComboValue === 'dualCombo' && value !== 3) {
        newValue = 3;
      } else if (dlbComboValue === 'tripleCombo' && value !== 4) {
        newValue = 4;
      }
      
      if (newValue !== null && newValue !== pendingUpdate) {
        setPendingUpdate(newValue);
        
        // Use longer debounce to prevent flickering
        const timeoutId = setTimeout(() => {
          React.startTransition(() => {
            handleValueChange(newValue);
            setPendingUpdate(null);
          });
        }, 100); // Increased debounce time
        
        return () => clearTimeout(timeoutId);
      }
    }, [configKey, dlbComboValue, value, numModulesConfig, handleValueChange, pendingUpdate]);

    // Conditional rendering logic moved after all hooks
    if (configKey === 'dlbMode') {
      return (
        <div>
          <DropdownSetting
            icon={icon}
            label={label}
            color={color}
            value={value}
            onValueChange={dlbComboHandleValueChange}
            options={dlbOptions}
          />
          <ValidationError error={validationError} isDark={isDark} />
        </div>
      );
    }

    if (configKey === 'num_of_modules' && numModulesConfig) {
      const { isDisabled, defaultValue, options } = numModulesConfig;
      return (
        <div>
          <DropdownSetting
            icon={icon}
            label={label}
            color={color}
            value={defaultValue}
            onValueChange={numModulesHandleValueChange}
            options={options}
            disabled={isDisabled}
          />
          <ValidationError error={validationError} isDark={isDark} />
        </div>
      );
    }

    if (configKey === 'Convertor Type') {
      return (
        <div>
          <DropdownSetting
            icon={icon}
            label={label}
            color={color}
            value={value}
            onValueChange={handleValueChange}
            options={converterTypeOptions}
          />
          <ValidationError error={validationError} isDark={isDark} />
        </div>
      );
    }

    if (configKey === 'imd') {
      return (
        <div>
          <DropdownSetting
            icon={icon}
            label={label}
            color={color}
            value={value}
            onValueChange={handleValueChange}
            options={imdOptions}
          />
          <ValidationError error={validationError} isDark={isDark} />
        </div>
      );
    }

    if (configKey === 'no of outlet') {
      return (
        <div>
          <DropdownSetting
            icon={icon}
            label={label}
            color={color}
            value={noOfOutletDisplayValue ?? value}
            onValueChange={noOfOutletHandleValueChange}
            options={noOfOutletOptions}
          />
          <ValidationError error={validationError} isDark={isDark} />
        </div>
      );
    }

    if (inputType === 'toggle') {
      return (
        <div>
          <ToggleSetting
            icon={icon}
            label={label}
            description={""}
            color={color}
            enabled={value}
            onToggle={() => updateFunction(configKey, !value)}
          />
          <ValidationError error={validationError} isDark={isDark} />
        </div>
      );
    } else if (inputType === 'number') {
      // Determine appropriate min/max based on key name
      let min = 0, max = 100, unit = "";
      const keyLower = configKey.toLowerCase();
      
      if (keyLower.includes('timeout')) {
        min = 1; max = 300; unit = "s";
      } else if (keyLower.includes('current')) {
        min = 0; max = 250; unit = "A";
      } else if (keyLower.includes('voltage')) {
        min = 0; max = 500; unit = "V";
      } else if (keyLower.includes('temperature')) {
        min = 40; max = 100; unit = "°C";
      } else if (keyLower.includes('speed') || keyLower.includes('percent')) {
        min = 0; max = 100; unit = "%";
      } else if (keyLower.includes('session')) {
        min = 1; max = 50;
      } else if (keyLower.includes('rate') || keyLower.includes('refresh')) {
        min = 1; max = 60; unit = "s";
      } else if (keyLower.includes('modules')) {
        min = 1; max = 10; unit = "";
      } else if (keyLower.includes('power') || keyLower.includes('kw')) {
        min = 0; max = 500; unit = "kW";
      }

      return (
        <div>
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
          <ValidationError error={validationError} isDark={isDark} />
        </div>
      );
    } else {
      return (
        <div>
          <TextSetting
            icon={icon}
            label={label}
            description={""}
            color={color}
            value={value}
            onValueChange={handleValueChange}
            disabled={configKey === 'OCPPEndpointToBackend'}
          />
          <ValidationError error={validationError} isDark={isDark} />
        </div>
      );
    }
  }, (prevProps, nextProps) => {
    // CRITICAL FIX: Optimized comparison function to prevent unnecessary re-renders
    // Only compare essential props that actually affect rendering
    if (prevProps.configKey !== nextProps.configKey) return false;
    if (prevProps.category !== nextProps.category) return false;
    if (prevProps.onValueChange !== nextProps.onValueChange) return false;
    
    // Deep comparison only for the value that matters
    const prevValue = prevProps.settingData?.value;
    const nextValue = nextProps.settingData?.value;
    
    // For primitive values, direct comparison
    if (typeof prevValue !== 'object' && typeof nextValue !== 'object') {
      return prevValue === nextValue;
    }
    
    // For objects, compare stringified version (but this should be rare)
    return JSON.stringify(prevValue) === JSON.stringify(nextValue);
  });

  const isDark = theme === "dark";
  const backgroundColor = isDark ? "transparent" : "#ffffff";
  const textColor = isDark ? "#f5f5f5" : "#000000";
  
  // Memoize styles to prevent unnecessary recalculations and flickering
  const styles = React.useMemo(() => 
    getStyles(isDark, textColor, backgroundColor), 
    [isDark, textColor, backgroundColor]
  );

  // Memoized event handlers to prevent unnecessary re-renders
  const handleRestartCharger = React.useCallback(async () => {
    try {
      await restartCharger();
    } catch (err) {
      // Error is already handled in the API function
    }
  }, [restartCharger]);

  const handleRefreshConfiguration = React.useCallback(async () => {
    try {
      await refreshConfiguration();
    } catch (err) {
      // Error is already handled in the refresh function
    }
  }, [refreshConfiguration]);

  const handleHardwareTabClick = React.useCallback(() => {
    React.startTransition(() => {
      setActiveTab("hardware");
    });
  }, []);

  const handleOcppTabClick = React.useCallback(() => {
    React.startTransition(() => {
      setActiveTab("ocpp");
    });
  }, []);

  const handleOutletTabClick = React.useCallback(() => {
    React.startTransition(() => {
      setActiveTab("outlet");
    });
  }, []);

  // RestartingScreen component with animation
  const RestartingScreen = () => {
    const [dots, setDots] = useState('');
    
    useEffect(() => {
      const interval = setInterval(() => {
        setDots(prev => prev.length >= 3 ? '' : prev + '.');
      }, 500);
      
      return () => clearInterval(interval);
    }, []);

    return (
      <div style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: isDark ? 'rgba(0, 0, 0, 0.95)' : 'rgba(255, 255, 255, 0.95)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 9999,
        backdropFilter: 'blur(8px)',
        opacity: isRestarting ? 1 : 0,
        visibility: isRestarting ? 'visible' : 'hidden',
        transition: 'all 0.3s ease-in-out'
      }}>
        {/* Spinning animation */}
        <div style={{
          width: '60px',
          height: '60px',
          border: `4px solid ${isDark ? 'rgba(136, 171, 226, 0.3)' : 'rgba(255, 0, 0, 0.3)'}`,
          borderTop: `4px solid ${isDark ? 'rgb(136, 171, 226)' : '#ff0000'}`,
          borderRadius: '50%',
          animation: 'spin 1s linear infinite',
          marginBottom: '20px'
        }} />
        
        {/* Status message */}
        <div style={{
          color: isDark ? 'rgb(136, 171, 226)' : '#ff0000',
          fontSize: '1.2rem',
          fontWeight: '600',
          textAlign: 'center',
          marginBottom: '10px'
        }}>
          Restarting Charger{dots}
        </div>
        
        <div style={{
          color: isDark ? 'rgba(255, 255, 255, 0.7)' : 'rgba(0, 0, 0, 0.7)',
          fontSize: '0.9rem',
          textAlign: 'center'
        }}>
          Please wait while the system restarts
        </div>
      </div>
    );
  };

  if (!isAuthenticated) {
    return (
      <>
        <style>
          {`
            @keyframes spin {
              0% { transform: rotate(0deg); }
              100% { transform: rotate(360deg); }
            }
          `}
        </style>
        <RestartingScreen />
        <PasswordProtection onAuthenticated={() => setIsAuthenticated(true)} theme={theme} onRestartCharger={handleRestartCharger} />
      </>
    );
  }

  return (
      <div style={{ ...styles.container, backgroundColor, color: textColor }}>
      {/* Add CSS keyframes for spinning animation */}
      <style>
        {`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}
      </style>
      
      {/* Restarting Screen Overlay */}
      <RestartingScreen />
      {/* Header */}
      <SettingHeader
        textColor={textColor}
        hasChanges={hasChanges}
        lastUpdateSuccess={lastUpdateSuccess}
        loading={loading}
        isDark={isDark}
        isRefreshing={isRefreshing}
        onRestartCharger={handleRestartCharger}
        onRefreshConfiguration={handleRefreshConfiguration}
        headerStyle={styles.header}
        headingStyle={styles.heading}
      />

      {/* Tab Navigation */}
      {!error && (
        <TabNavigation
          activeTab={activeTab}
          loading={loading}
          isDark={isDark}
          onHardwareTabClick={handleHardwareTabClick}
          onOcppTabClick={handleOcppTabClick}
          onOutletTabClick={handleOutletTabClick}
          tabContainerStyle={styles.tabContainer}
          tabStyle={styles.tab}
        />
      )}

      {/* Tab Content */}
      <div style={styles.tabContent}>
        {error ? (
          <div style={styles.errorContainer}>
            <h3 style={styles.errorTitle}>Configuration Unavailable</h3>
            <p style={styles.errorDescription}>
              Unable to load configuration from the server. Please check your connection and try again.
            </p>
            <div style={styles.errorDetails}>
              <strong>Error:</strong> {error}
            </div>
            <button 
              style={styles.retryButtonLarge} 
              onClick={fetchAllConfigurations}
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
                  {Object.entries(hardwareConfig).map(([key, configItem]) => (
                    <DynamicSetting
                      key={key}
                      configKey={key}
                      settingData={configItem}
                      onValueChange={hardwareCallbacks[key]}
                      category="hardware"
                      isDark={isDark}
                    />
                  ))}
                </div>
              </div>
            )}

            {activeTab === "ocpp" && (
              <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
                <div style={styles.scrollableContent}>
                  {Object.entries(softwareConfig).map(([key, configItem]) => (
                    <DynamicSetting
                      key={key}
                      configKey={key}
                      settingData={configItem}
                      onValueChange={ocppCallbacks[key]}
                      category="ocpp"
                      isDark={isDark}
                    />
                  ))}
                </div>
              </div>
            )}

            {activeTab === "outlet" && (
              <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
                <div style={styles.scrollableContent}>
                  {Object.entries(outletConfig)
                    .map(([key, configItem]) => (
                      <DynamicSetting
                        key={key}
                        configKey={key}
                        settingData={configItem}
                        onValueChange={hardwareCallbacks[key]}
                        category="outlet"
                        isDark={isDark}
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
    transition: "all 0.3s ease",
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
    // padding: "3rem",
    textAlign: "center",
    height: "100%",
    // minHeight: "400px",
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
