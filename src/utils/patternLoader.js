import useLogoCubeStore from '../store/logoCubeStore';

export const loadPattern = (jsonString) => {
  try {
    // Parse the JSON string
    const data = JSON.parse(jsonString);
    console.log("Loading pattern from JSON:", data);
    
    let result;
    
    // Try to load using different strategies
    if (data.pattern || data.visual) {
      // First try loading as a full configuration
      console.log("Attempting to load as full config");
      result = useLogoCubeStore.getState().importFullConfig(data);
    } else {
      // Otherwise try loading just the pattern
      console.log("Attempting to load as pattern only");
      result = useLogoCubeStore.getState().loadPattern(data);
    }
    
    // If successful, save to localStorage for persistence
    if (result) {
      console.log("Pattern loaded successfully, saving to localStorage");
      localStorage.setItem('cachedPattern', jsonString);
      
      // Dispatch a success event
      window.dispatchEvent(new CustomEvent('patternloadsuccess', { 
        detail: { pattern: data }
      }));
      
      return true;
    } else {
      throw new Error('Failed to load pattern: Format not recognized');
    }
  } catch (error) {
    console.error('Error loading pattern:', error);
    
    // Dispatch an error event that can be caught by components
    window.dispatchEvent(new CustomEvent('patternloaderror', { 
      detail: { error } 
    }));
    
    // Only show alert if not being handled elsewhere
    if (!window.hasPatternLoadErrorListener) {
      alert('Failed to load pattern: ' + (error.message || 'Invalid format'));
    }
    
    return false;
  }
};

// Function to load a saved pattern from localStorage on startup
export const loadCachedPattern = () => {
  try {
    const cachedPattern = localStorage.getItem('cachedPattern');
    if (cachedPattern) {
      console.log("Loading cached pattern from localStorage");
      return loadPattern(cachedPattern);
    }
  } catch (error) {
    console.error("Error loading cached pattern:", error);
  }
  return false;
};

// Helper function to check if a pattern is available in localStorage
export const hasCachedPattern = () => {
  return !!localStorage.getItem('cachedPattern');
};

// Set a flag when error listeners are added to avoid showing multiple alerts
export const setErrorListenerFlag = () => {
  window.hasPatternLoadErrorListener = true;
  return () => { window.hasPatternLoadErrorListener = false; };
};