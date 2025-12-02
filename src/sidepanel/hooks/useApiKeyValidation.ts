import { useState, useEffect } from 'react';
import { getAISettings } from '@/shared/services/aiService';

export function useApiKeyValidation() {
  const [hasApiKey, setHasApiKey] = useState(true);
  const [apiProvider, setApiProvider] = useState('');
  const [isChecking, setIsChecking] = useState(true);

  const checkApiKey = async () => {
    setIsChecking(true);
    try {
      const settings = await getAISettings();
      const { provider, apiKeys } = settings;
      const currentApiKey = apiKeys[provider];
      setHasApiKey(!!currentApiKey && currentApiKey.trim() !== '');
      setApiProvider(provider);
    } catch (error) {
      console.error('Failed to check API key:', error);
      setHasApiKey(false);
    } finally {
      setIsChecking(false);
    }
  };

  useEffect(() => {
    // Check on mount
    checkApiKey();

    // Re-check when window gains focus (user might have added key in settings)
    const handleFocus = () => checkApiKey();
    window.addEventListener('focus', handleFocus);

    return () => {
      window.removeEventListener('focus', handleFocus);
    };
  }, []);

  const validateBeforeGeneration = async (): Promise<boolean> => {
    try {
      const settings = await getAISettings();
      const { provider, apiKeys } = settings;
      const currentApiKey = apiKeys[provider];

      if (!currentApiKey || currentApiKey.trim() === '') {
        setHasApiKey(false);
        setApiProvider(provider);
        return false;
      }

      setHasApiKey(true);
      setApiProvider(provider);
      return true;
    } catch (error) {
      console.error('Failed to validate API settings:', error);
      setHasApiKey(false);
      return false;
    }
  };

  return {
    hasApiKey,
    apiProvider,
    isChecking,
    validateBeforeGeneration,
    recheckApiKey: checkApiKey,
  };
}
