import { useState, useEffect } from 'react';

const defaultSettings = {
  profile: { name: 'Student', uni: '', course: '', year: '1' },
  focus: { mode: 'Classic', work: 25, break: 5, autoStart: false, sound: true, debounce: 10 },
  notifications: { browser: true, session: true, daily: false, wellness: true },
  academic: { start: '', end: '', gpa: '4.0', subjects: [] },
  appearance: { theme: 'dark', accent: '#4FC3F7' },
};

export const useSettings = () => {
  const [settings, setSettings] = useState(() => {
    try {
      const stored = localStorage.getItem('userSettings');
      if (stored) {
        const parsed = JSON.parse(stored);
        // Deep merge defaults to ensure structure exists
        return {
          profile: { ...defaultSettings.profile, ...(parsed.profile || {}) },
          focus: { ...defaultSettings.focus, ...(parsed.focus || {}) },
          notifications: { ...defaultSettings.notifications, ...(parsed.notifications || {}) },
          academic: { ...defaultSettings.academic, ...(parsed.academic || {}) },
          appearance: { ...defaultSettings.appearance, ...(parsed.appearance || {}) },
        };
      }
      return defaultSettings;
    } catch (e) {
      return defaultSettings;
    }
  });

  useEffect(() => {
    const handleStorageChange = (e) => {
      if (e.type === 'localSettingsUpdate' || (e.type === 'storage' && e.key === 'userSettings')) {
        try {
          const stored = localStorage.getItem('userSettings');
          if (stored) {
            const parsed = JSON.parse(stored);
            setSettings({
              profile: { ...defaultSettings.profile, ...(parsed.profile || {}) },
              focus: { ...defaultSettings.focus, ...(parsed.focus || {}) },
              notifications: { ...defaultSettings.notifications, ...(parsed.notifications || {}) },
              academic: { ...defaultSettings.academic, ...(parsed.academic || {}) },
              appearance: { ...defaultSettings.appearance, ...(parsed.appearance || {}) },
            });
          }
        } catch (err) {}
      }
    };

    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('localSettingsUpdate', handleStorageChange);
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('localSettingsUpdate', handleStorageChange);
    };
  }, []);

  const updateSettings = (newSettings) => {
    // Note: newSettings should be the FULL settings object representing the new state
    setSettings(newSettings);
    localStorage.setItem('userSettings', JSON.stringify(newSettings));
    window.dispatchEvent(new Event('localSettingsUpdate'));
  };

  return { settings, updateSettings };
};
