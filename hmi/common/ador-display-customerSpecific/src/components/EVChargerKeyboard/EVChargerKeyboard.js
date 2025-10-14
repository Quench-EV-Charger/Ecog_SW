import React, { useState, useEffect, useRef, useContext, useCallback } from 'react';
import './EVChargerKeyboard.css';

const EVChargerKeyboard = ({ 
  isVisible, 
  onClose, 
  targetRef, 
  onInput, 
  inputType = 'text',
  placeholder = 'Enter text...',
  maxLength = null,
  allowedChars = null
}) => {
  const theme = "light"
  const keyboardRef = useRef(null);
  const [capsLock, setCapsLock] = useState(false);
  const [shift, setShift] = useState(false);
  const [currentLayout, setCurrentLayout] = useState('alphanumeric');
  const [currentValue, setCurrentValue] = useState('');

  // Compact keyboard layouts optimized for EV charger input
  const layouts = {
    alphanumeric: {
      base: [
        ['1', '2', '3', '4', '5', '6', '7', '8', '9', '0'],
        ['q', 'w', 'e', 'r', 't', 'y', 'u', 'i', 'o', 'p'],
        ['a', 's', 'd', 'f', 'g', 'h', 'j', 'k', 'l'],
        ['z', 'x', 'c', 'v', 'b', 'n', 'm']
      ],
      shift: [
        ['!', '@', '#', '$', '%', '^', '&', '*', '(', ')'],
        ['Q', 'W', 'E', 'R', 'T', 'Y', 'U', 'I', 'O', 'P'],
        ['A', 'S', 'D', 'F', 'G', 'H', 'J', 'K', 'L'],
        ['Z', 'X', 'C', 'V', 'B', 'N', 'M']
      ]
    },
    numeric: {
      base: [
        ['1', '2', '3'],
        ['4', '5', '6'],
        ['7', '8', '9'],
        ['.', '0', '-']
      ],
      shift: [
        ['1', '2', '3'],
        ['4', '5', '6'],
        ['7', '8', '9'],
        ['.', '0', '-']
      ]
    },
    symbols: {
      base: [
        ['!', '@', '#', '$', '%'],
        ['^', '&', '*', '(', ')'],
        ['-', '_', '=', '+', '['],
        [']', '{', '}', '|', '\\']
      ],
      shift: [
        ['!', '@', '#', '$', '%'],
        ['^', '&', '*', '(', ')'],
        ['-', '_', '=', '+', '['],
        [']', '{', '}', '|', '\\']
      ]
    }
  };

  // Get current keys based on layout and shift state
  const getCurrentKeys = useCallback(() => {
    const layout = layouts[currentLayout];
    if (!layout) return [];
    
    const keys = (shift || capsLock) ? layout.shift : layout.base;
    return keys;
  }, [currentLayout, shift, capsLock]);

  // Validate character input
  const isValidChar = useCallback((char) => {
    if (allowedChars && !allowedChars.includes(char)) return false;
    
    switch (inputType) {
      case 'number':
        return /^[0-9.-]$/.test(char);
      case 'email':
        return /^[a-zA-Z0-9@._-]$/.test(char);
      case 'password':
      case 'text':
      default:
        return true;
    }
  }, [inputType, allowedChars]);

  // Handle key press
  const handleKeyPress = useCallback((key) => {
    if (!targetRef?.current) return;

    const input = targetRef.current;
    const start = input.selectionStart || 0;
    const end = input.selectionEnd || 0;
    let newValue = currentValue;
    let newCursorPos = start;

    switch (key) {
      case 'Backspace':
        if (start === end && start > 0) {
          newValue = currentValue.slice(0, start - 1) + currentValue.slice(start);
          newCursorPos = start - 1;
        } else if (start !== end) {
          newValue = currentValue.slice(0, start) + currentValue.slice(end);
          newCursorPos = start;
        }
        break;
      
      case 'Space':
        if (inputType !== 'number' && inputType !== 'email') {
          newValue = currentValue.slice(0, start) + ' ' + currentValue.slice(end);
          newCursorPos = start + 1;
        }
        break;
      
      case 'Enter':
        // Trigger form submission or close keyboard
        if (onClose) onClose();
        return;
      
      case 'Shift':
        setShift(!shift);
        return;
      
      case 'CapsLock':
        setCapsLock(!capsLock);
        return;
      
      case 'Layout':
        const layoutOrder = ['alphanumeric', 'numeric', 'symbols'];
        const currentIndex = layoutOrder.indexOf(currentLayout);
        const nextIndex = (currentIndex + 1) % layoutOrder.length;
        setCurrentLayout(layoutOrder[nextIndex]);
        return;
      
      case 'Clear':
        newValue = '';
        newCursorPos = 0;
        break;
      
      case 'Close':
        onClose();
        return;
      
      default:
        // Validate character
        if (!isValidChar(key)) return;
        
        // Check max length
        if (maxLength && currentValue.length >= maxLength && start === end) return;
        
        newValue = currentValue.slice(0, start) + key + currentValue.slice(end);
        newCursorPos = start + 1;
    }

    // Update input value
    input.value = newValue;
    setCurrentValue(newValue);
    
    // Trigger input event for React
    const event = new Event('input', { bubbles: true });
    input.dispatchEvent(event);
    
    // Update cursor position
    setTimeout(() => {
      input.setSelectionRange(newCursorPos, newCursorPos);
      input.focus();
    }, 0);

    // Reset shift after key press (but not caps lock)
    if (shift && key !== 'Shift') {
      setShift(false);
    }

    // Call onInput callback if provided
    if (onInput) {
      onInput(newValue);
    }
  }, [targetRef, shift, capsLock, currentLayout, inputType, maxLength, isValidChar, currentValue, onInput, onClose]);

  // Initialize keyboard when it becomes visible
  useEffect(() => {
    if (isVisible && targetRef?.current) {
      const inputElement = targetRef.current;
      const fieldValue = inputElement.value || '';
      setCurrentValue(fieldValue);
      
      // Focus the input
      setTimeout(() => {
        inputElement.focus();
      }, 100);
    }
  }, [isVisible, targetRef]);

  // Handle click outside to close
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (keyboardRef.current && !keyboardRef.current.contains(event.target) && 
          targetRef?.current && !targetRef.current.contains(event.target)) {
        // Optional: auto-close on outside click
        // onClose();
      }
    };

    if (isVisible) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isVisible, onClose, targetRef]);

  if (!isVisible) return null;

  const keys = getCurrentKeys();

  return (
    <div className={`ev-keyboard-overlay ${theme}`}>
      <div className="ev-keyboard-container" ref={keyboardRef}>
        {/* Header */}
        <div className="ev-keyboard-header">
          <div className="keyboard-title">
            <span className="keyboard-icon">⌨️</span>
            <span>EV Charger Keyboard</span>
          </div>
          <button
            type="button"
            className="ev-keyboard-close"
            onClick={() => handleKeyPress('Close')}
            title="Close Keyboard"
          >
            ✕
          </button>
        </div>
        
        {/* Display Area */}
        <div className="ev-keyboard-display">
          <div className="display-label">
            {inputType === 'password' ? 'Password:' : 
             inputType === 'email' ? 'Email:' : 
             inputType === 'number' ? 'Number:' : 'Text:'}
          </div>
          <div className="display-value">
            {currentValue || placeholder}
          </div>
          {maxLength && (
            <div className="char-counter">
              {currentValue.length}/{maxLength}
            </div>
          )}
        </div>
        
        {/* Control Bar */}
        <div className="ev-keyboard-controls">
          <button
            type="button"
            className={`control-btn layout-btn ${currentLayout}`}
            onClick={() => handleKeyPress('Layout')}
            title="Switch Layout"
          >
            {currentLayout === 'alphanumeric' ? 'ABC' : 
             currentLayout === 'numeric' ? '123' : '!@#'}
          </button>
          
          {currentLayout === 'alphanumeric' && (
            <>
              <button
                type="button"
                className={`control-btn caps-btn ${capsLock ? 'active' : ''}`}
                onClick={() => handleKeyPress('CapsLock')}
                title="Caps Lock"
              >
                ⇪
              </button>
              <button
                type="button"
                className={`control-btn shift-btn ${shift ? 'active' : ''}`}
                onClick={() => handleKeyPress('Shift')}
                title="Shift"
              >
                ⇧
              </button>
            </>
          )}
          
          <button
            type="button"
            className="control-btn clear-btn"
            onClick={() => handleKeyPress('Clear')}
            title="Clear All"
          >
            Clear
          </button>
        </div>
        
        {/* Keys Grid */}
        <div className="ev-keyboard-keys">
          {keys.map((row, rowIndex) => (
            <div key={`row-${rowIndex}`} className="key-row">
              {row.map((key, keyIndex) => (
                <button
                  key={`${rowIndex}-${keyIndex}`}
                  type="button"
                  className={`key ${!isValidChar(key) ? 'disabled' : ''}`}
                  onClick={() => handleKeyPress(key)}
                  disabled={!isValidChar(key)}
                >
                  {key}
                </button>
              ))}
            </div>
          ))}
        </div>
        
        {/* Action Bar */}
        <div className="ev-keyboard-actions">
          <button
            type="button"
            className="action-btn backspace-btn"
            onClick={() => handleKeyPress('Backspace')}
            title="Backspace"
          >
            ⌫ Backspace
          </button>
          
          {inputType !== 'number' && inputType !== 'email' && (
            <button
              type="button"
              className="action-btn space-btn"
              onClick={() => handleKeyPress('Space')}
              title="Space"
            >
              Space
            </button>
          )}
          
          <button
            type="button"
            className="action-btn enter-btn"
            onClick={() => handleKeyPress('Enter')}
            title="Enter"
          >
            ↵ Enter
          </button>
        </div>
      </div>
    </div>
  );
};

export default EVChargerKeyboard;