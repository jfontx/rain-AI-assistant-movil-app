import React, { createContext, useState, useEffect, useContext } from 'react';
import { useColorScheme } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { theme, lightColors, darkColors, Colors } from '../theme';

type ThemeMode = 'system' | 'light' | 'dark';

export type ExtendedTheme = typeof theme & { colors: Colors };

interface ThemeContextData {
  mode: ThemeMode;
  isDark: boolean;
  colors: Colors;
  theme: ExtendedTheme;
  setMode: (mode: ThemeMode) => void;
}

export const ThemeContext = createContext<ThemeContextData>({} as ThemeContextData);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const systemColorScheme = useColorScheme();
  const [mode, setModeState] = useState<ThemeMode>('system');
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    const loadMode = async () => {
      try {
        const storedMode = await AsyncStorage.getItem('@theme_mode');
        if (storedMode) {
          setModeState(storedMode as ThemeMode);
        }
      } catch (error) {
        console.error('Failed to load theme mode', error);
      } finally {
        setIsReady(true);
      }
    };
    loadMode();
  }, []);

  const setMode = async (newMode: ThemeMode) => {
    setModeState(newMode);
    try {
      await AsyncStorage.setItem('@theme_mode', newMode);
    } catch (error) {
      console.error('Failed to save theme mode', error);
    }
  };

  const isDark = mode === 'dark' || (mode === 'system' && systemColorScheme === 'dark');
  const currentColors = isDark ? darkColors : lightColors;
  
  const currentTheme: ExtendedTheme = {
    ...theme,
    colors: currentColors
  };

  if (!isReady) return null; // Wait until theme is loaded to prevent flashes

  return (
    <ThemeContext.Provider value={{ mode, isDark, colors: currentColors, theme: currentTheme, setMode }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => useContext(ThemeContext);
