import { useCallback, useRef, useEffect } from 'react';

/**
 * Custom hook for debouncing function calls with cancellation support
 * @param {Function} callback - The function to debounce
 * @param {number} delay - Delay in milliseconds (default: 500ms)
 * @returns {Object} - Object containing debouncedCallback and cancel function
 */
export const useDebounce = (callback, delay = 500) => {
  const timeoutRef = useRef(null);
  const pendingArgsRef = useRef(null);
  const callbackRef = useRef(callback);

  // Always keep the latest callback reference to avoid stale closures
  useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);

  // Cancel any pending debounced calls
  const cancel = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
      pendingArgsRef.current = null;
    }
  }, []);

  // Debounced callback function
  const debouncedCallback = useCallback((...args) => {
    // Store the latest arguments
    pendingArgsRef.current = args;
    
    // Cancel any existing timeout
    cancel();
    
    // Set new timeout
    timeoutRef.current = setTimeout(() => {
      if (pendingArgsRef.current) {
        // Use latest callback reference to ensure fresh state is read
        callbackRef.current(...pendingArgsRef.current);
        pendingArgsRef.current = null;
      }
      timeoutRef.current = null;
    }, delay);
  }, [delay, cancel]);

  // Cleanup on unmount
  const cleanup = useCallback(() => {
    cancel();
  }, [cancel]);

  return {
    debouncedCallback,
    cancel,
    cleanup
  };
};

/**
 * Hook for debouncing API calls with loading state management
 * @param {Function} apiFunction - The API function to debounce
 * @param {number} delay - Delay in milliseconds (default: 500ms)
 * @returns {Object} - Object containing debouncedApiCall, cancel, and isPending state
 */
export const useDebouncedApiCall = (apiFunction, delay = 500) => {
  const pendingCallsRef = useRef(new Set());
  
  const { debouncedCallback, cancel } = useDebounce(async (...args) => {
    const callId = Date.now() + Math.random();
    pendingCallsRef.current.add(callId);
    
    try {
      await apiFunction(...args);
    } finally {
      pendingCallsRef.current.delete(callId);
    }
  }, delay);

  const cancelAll = useCallback(() => {
    cancel();
    pendingCallsRef.current.clear();
  }, [cancel]);

  const isPending = pendingCallsRef.current.size > 0;

  return {
    debouncedApiCall: debouncedCallback,
    cancel: cancelAll,
    isPending
  };
};