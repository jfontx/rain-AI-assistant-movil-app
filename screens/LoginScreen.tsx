import React, { useState, useContext } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, KeyboardAvoidingView, Platform, ActivityIndicator } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useTheme } from '../context/ThemeContext';
import { loginApi } from '../services/auth';
import { AuthContext } from '../context/AuthContext';
import { Mail, Lock, LogIn, UserPlus } from 'lucide-react-native';

export default function LoginScreen() {
  const { theme } = useTheme();
  const styles = createStyles(theme);
  const [correo, setCorreo] = useState('');
  const [password, setPassword] = useState('');
  const [cargando, setCargando] = useState(false);
  
  const { login } = useContext(AuthContext);
  const navigation = useNavigation<any>();

  const handleLogin = async () => {
    if (!correo || !password) {
      Alert.alert('Error', 'Por favor ingresa tu correo y contraseña');
      return;
    }

    setCargando(true);
    try {
      const data = await loginApi(correo.trim(), password);
      await login(data.access_token, data.usuario);
      // App.tsx cambiará automáticamente a MainTabs porque cambió el contexto
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Credenciales incorrectas');
    } finally {
      setCargando(false);
    }
  };

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'} 
      style={styles.container}
    >
      <View style={styles.content}>
        <View style={styles.header}>
          <Text style={styles.title}>Raín</Text>
          <Text style={styles.subtitle}>Tu asistente financiero inteligente</Text>
        </View>

        <View style={styles.form}>
          <View style={styles.inputContainer}>
            <Mail color={theme.colors.onSurfaceVariant} size={20} style={styles.icon} />
            <TextInput
              style={styles.input}
              placeholder="Correo electrónico"
              placeholderTextColor={theme.colors.outline}
              value={correo}
              onChangeText={setCorreo}
              autoCapitalize="none"
              keyboardType="email-address"
            />
          </View>

          <View style={styles.inputContainer}>
            <Lock color={theme.colors.onSurfaceVariant} size={20} style={styles.icon} />
            <TextInput
              style={styles.input}
              placeholder="Contraseña"
              placeholderTextColor={theme.colors.outline}
              value={password}
              onChangeText={setPassword}
              secureTextEntry
            />
          </View>

          <TouchableOpacity 
            style={styles.button} 
            onPress={handleLogin}
            disabled={cargando}
          >
            {cargando ? (
              <ActivityIndicator color={theme.colors.onPrimary} />
            ) : (
              <>
                <LogIn color={theme.colors.onPrimary} size={20} style={{ marginRight: 8 }} />
                <Text style={styles.buttonText}>Iniciar Sesión</Text>
              </>
            )}
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.secondaryButton} 
            onPress={() => navigation.navigate('Registro')}
          >
            <UserPlus color={theme.colors.primary} size={20} style={{ marginRight: 8 }} />
            <Text style={styles.secondaryButtonText}>Crear una cuenta nueva</Text>
          </TouchableOpacity>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const createStyles = (theme: any) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    padding: theme.spacing.xl,
  },
  header: {
    alignItems: 'center',
    marginBottom: 40,
  },
  title: {
    fontFamily: theme.typography.fontFamily.bold,
    fontSize: 48,
    color: theme.colors.primary,
    letterSpacing: -1,
  },
  subtitle: {
    fontFamily: theme.typography.fontFamily.medium,
    fontSize: theme.typography.bodyLg.fontSize,
    color: theme.colors.onSurfaceVariant,
    marginTop: 8,
  },
  form: {
    width: '100%',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.surface,
    borderRadius: theme.roundness.md,
    marginBottom: theme.spacing.md,
    borderWidth: 1,
    borderColor: theme.colors.outline,
    paddingHorizontal: theme.spacing.md,
  },
  icon: {
    marginRight: theme.spacing.sm,
  },
  input: {
    flex: 1,
    height: 56,
    fontFamily: theme.typography.fontFamily.regular,
    fontSize: theme.typography.bodyLg.fontSize,
    color: theme.colors.onSurface,
  },
  button: {
    flexDirection: 'row',
    backgroundColor: theme.colors.primary,
    height: 56,
    borderRadius: theme.roundness.md,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: theme.spacing.md,
  },
  buttonText: {
    fontFamily: theme.typography.fontFamily.semiBold,
    fontSize: theme.typography.bodyLg.fontSize,
    color: theme.colors.onPrimary,
  },
  secondaryButton: {
    flexDirection: 'row',
    height: 56,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: theme.spacing.sm,
  },
  secondaryButtonText: {
    fontFamily: theme.typography.fontFamily.medium,
    fontSize: theme.typography.bodyMd.fontSize,
    color: theme.colors.primary,
  }
});
