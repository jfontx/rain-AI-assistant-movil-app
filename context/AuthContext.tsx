import React, { createContext, useState, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { setAuthToken } from '../services/api';

export interface Usuario {
  id: number;
  nombre: string;
  correo: string;
}

interface AuthContextData {
  usuario: Usuario | null;
  cargando: boolean;
  login: (token: string, user: Usuario) => Promise<void>;
  logout: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextData>({} as AuthContextData);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [usuario, setUsuario] = useState<Usuario | null>(null);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    cargarSesion();
  }, []);

  const cargarSesion = async () => {
    try {
      const token = await AsyncStorage.getItem('@token');
      const userStr = await AsyncStorage.getItem('@usuario');

      if (token && userStr) {
        setAuthToken(token);
        setUsuario(JSON.parse(userStr));
      }
    } catch (error) {
      console.log('Error cargando la sesión:', error);
    } finally {
      setCargando(false);
    }
  };

  const login = async (token: string, user: Usuario) => {
    await AsyncStorage.setItem('@token', token);
    await AsyncStorage.setItem('@usuario', JSON.stringify(user));
    setAuthToken(token);
    setUsuario(user);
  };

  const logout = async () => {
    await AsyncStorage.removeItem('@token');
    await AsyncStorage.removeItem('@usuario');
    setAuthToken(null);
    setUsuario(null);
  };

  return (
    <AuthContext.Provider value={{ usuario, cargando, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};
