import { useState, useEffect } from 'react';

interface ConnectionStatus {
  isConnected: boolean;
  isChecking: boolean;
}

export const useConnectionStatus = (): ConnectionStatus => {
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [isChecking, setIsChecking] = useState<boolean>(true);

  const checkConnection = async () => {
    try {
      setIsChecking(true);
      const response = await fetch('/api/health', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        // Use a short timeout to avoid hanging
        signal: AbortSignal.timeout(5000),
      });
      
      if (response.ok) {
        const data = await response.json();
        setIsConnected(data.status === 'ok');
      } else {
        setIsConnected(false);
      }
    } catch (error) {
      // Network error, timeout, or other issues
      setIsConnected(false);
    } finally {
      setIsChecking(false);
    }
  };

  useEffect(() => {
    // Check connection immediately
    checkConnection();

    // Set up periodic checks every 30 seconds
    const interval = setInterval(checkConnection, 30000);

    // Cleanup interval on unmount
    return () => clearInterval(interval);
  }, []);

  return { isConnected, isChecking };
};
