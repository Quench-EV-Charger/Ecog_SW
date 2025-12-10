import { useCallback, useRef } from 'react';

/**
 * Custom hook to create stable callbacks that don't change reference
 * unless dependencies actually change values (not just references)
 */
export const useStableCallback = (callback, deps) => {
  const callbackRef = useRef(callback);
  const depsRef = useRef(deps);

  // Check if dependencies have actually changed (deep comparison for primitives)
  const depsChanged = !deps || !depsRef.current || 
    deps.length !== depsRef.current.length ||
    deps.some((dep, index) => dep !== depsRef.current[index]);

  if (depsChanged) {
    callbackRef.current = callback;
    depsRef.current = deps;
  }

  return useCallback(callbackRef.current, deps);
};

/**
 * Hook to create stable object references
 */
export const useStableObject = (obj, deps) => {
  const objRef = useRef(obj);
  const depsRef = useRef(deps);

  const depsChanged = !deps || !depsRef.current || 
    deps.length !== depsRef.current.length ||
    deps.some((dep, index) => dep !== depsRef.current[index]);

  if (depsChanged) {
    objRef.current = obj;
    depsRef.current = deps;
  }

  return objRef.current;
};

/**
 * Hook to prevent re-renders when Redux state object reference changes
 * but the actual values we care about haven't changed
 */
export const useStableSelector = (selector, equalityFn) => {
  const selectorRef = useRef();
  const resultRef = useRef();

  const currentResult = selector();
  
  if (!resultRef.current || (equalityFn && !equalityFn(resultRef.current, currentResult))) {
    resultRef.current = currentResult;
  }

  return resultRef.current;
};

export default useStableCallback;