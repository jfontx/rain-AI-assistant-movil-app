import React, { useState, useContext } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, KeyboardAvoidingView, Platform, ActivityIndicator } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useTheme } from '../context/ThemeContext';
import { registroApi } from '../services/auth';
import { AuthContext } from '../context/AuthContext';
import { User, Mail, Lock, UserPlus, ArrowLeft } from 'lucide-react-native';

export default function RegistroScreen() {
  const { theme } = useTheme();
  const styles = createStyles(theme);
  const [nombre, setNombre] = useState('');
  const [correo, setCorreo] = useState('');
  const [password, setPassword] = useState('');
  const [cargando, setCargando] = useState(false);
  
  const { login } = useContext(AuthContext);
  const navigation = useNavigation<any>();

  const handleRegistro = async () => {
    if (!nombre || !correo || !password) {
      Alert.alert('Error', 'Todos los campos son obligatorios');
      return;
    }

    setCargando(true);
    try {
      const data = await registroApi(nombre.trim(), correo.trim(), password);
      await login(data.access_token, data.usuario);
      // App.tsx cambiará automáticamente a MainTabs
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Error al crear la cuenta');
    } finally {
      setCargando(false);
    }
  };

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'} 
      style={styles.container}
    >
      <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
        <ArrowLeft color={theme.colors.onSurface} size={24} />
      </TouchableOpacity>

      <View style={styles.content}>
        <View style={styles.header}>
          <Text style={styles.title}>Crea tu cuenta</Text>
          <Text style={styles.subtitle}>Comienza a organizar tus finanzas</Text>
        </View>

        <View style={styles.form}>
          <View style={styles.inputContainer}>
            <User color={theme.colors.onSurfaceVariant} size={20} style={styles.icon} />
            <TextInput
              style={styles.input}
              placeholder="¿Cómo te llamas?"
              placeholderTextColor={theme.colors.outline}
              value={nombre}
              onChangeText={setNombre}
              autoCapitalize="words"
            />
          </View>

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
            onPress={handleRegistro}
            disabled={cargando}
          >
            {cargando ? (
              <ActivityIndicator color={theme.colors.onPrimary} />
            ) : (
              <>
                <UserPlus color={theme.colors.onPrimary} size={20} style={{ marginRight: 8 }} />
                <Text style={styles.buttonText}>Registrarme</Text>
              </>
            )}
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
  backButton: {
    position: 'absolute',
    top: 60,
    left: 20,
    zIndex: 10,
    padding: 8,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    padding: theme.spacing.xl,
  },
  header: {
    marginBottom: 40,
  },
  title: {
    fontFamily: theme.typography.fontFamily.bold,
    fontSize: theme.typography.display.fontSize,
    color: theme.colors.onSurface,
  },
  subtitle: {
    fontFamily: theme.typography.fontFamily.regular,
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
  }
});
