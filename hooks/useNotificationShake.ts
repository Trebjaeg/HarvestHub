import { useState, useEffect } from 'react';

interface UseNotificationShakeReturn {
  shouldShake: boolean;
}

export function useNotificationShake(): UseNotificationShakeReturn {
  const [shouldShake, setShouldShake] = useState(false);
  const [lastNotificationTime, setLastNotificationTime] = useState(0);

  useEffect(() => {
    // Debounce rapid notifications - only shake once per 600ms
    const handleNewNotification = (event: CustomEvent) => {
      const now = Date.now();
      
      // Only trigger shake if it's been more than 600ms since last shake
      if (now - lastNotificationTime >= 600) {
        setShouldShake(true);
        setLastNotificationTime(now);
        
        // Remove shake class after animation completes
        setTimeout(() => {
          setShouldShake(false);
        }, 600); // Match animation duration
      }
    };

    window.addEventListener('notification-received', handleNewNotification as EventListener);

    return () => {
      window.removeEventListener('notification-received', handleNewNotification as EventListener);
    };
  }, [lastNotificationTime]);

  return { shouldShake };
}
