import { createContext, useContext, useEffect, useState } from 'react';

// Add browser globals for linter
const { localStorage } = globalThis;

// Create the context
export const ApiKeyContext = createContext({
  apiKey: null,
  setApiKey: () => {},
  clearApiKey: () => {},
  isApiKeyValid: false,
  setIsApiKeyValid: () => {},
});

// Create a provider component
export const ApiKeyProvider = ({ children }) => {
  // Get API key from localStorage or set to null
  const [apiKey, setApiKeyState] = useState(() => {
    const savedApiKey = localStorage.getItem('apiKey');
    const envApiKey = import.meta.env.VITE_API_KEY;
    return savedApiKey || envApiKey || null;
  });

  // Track if the API key is valid
  const [isApiKeyValid, setIsApiKeyValid] = useState(false);

  // Update localStorage when apiKey changes
  useEffect(() => {
    if (apiKey) {
      localStorage.setItem('apiKey', apiKey);
    }
  }, [apiKey]);

  // Function to set the API key
  const setApiKey = key => {
    setApiKeyState(key);
  };

  // Function to clear the API key
  const clearApiKey = () => {
    localStorage.removeItem('apiKey');
    setApiKeyState(null);
    setIsApiKeyValid(false);
  };

  // Context value
  const value = {
    apiKey,
    setApiKey,
    clearApiKey,
    isApiKeyValid,
    setIsApiKeyValid,
  };

  return <ApiKeyContext.Provider value={value}>{children}</ApiKeyContext.Provider>;
};

// Custom hook for using the API key context
export const useApiKey = () => {
  const context = useContext(ApiKeyContext);
  if (context === undefined) {
    throw new Error('useApiKey must be used within an ApiKeyProvider');
  }
  return context;
};
