import React, { useContext } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, SafeAreaView, Switch } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { ArrowLeft, User, LogOut, Moon, Sun, Smartphone } from 'lucide-react-native';
import { useTheme } from '../context/ThemeContext';
import { AuthContext } from '../context/AuthContext';

export default function ConfiguracionScreen() {
  const { theme, mode, setMode } = useTheme();
  const { usuario, logout } = useContext(AuthContext);
  const navigation = useNavigation<any>();

  const styles = createStyles(theme);

  const ThemeOption = ({ title, value, icon: Icon }: any) => (
    <TouchableOpacity 
      style={[styles.optionItem, mode === value && styles.optionItemActive]} 
      onPress={() => setMode(value)}
    >
      <Icon color={mode === value ? theme.colors.primary : theme.colors.onSurfaceVariant} size={20} />
      <Text style={[styles.optionText, mode === value && styles.optionTextActive]}>{title}</Text>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <ArrowLeft color={theme.colors.onSurface} size={24} />
        </TouchableOpacity>
        <Text style={styles.title}>Configuración</Text>
      </View>

      <View style={styles.content}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Perfil</Text>
          <View style={styles.card}>
            <View style={styles.profileRow}>
              <View style={styles.avatar}>
                <User color={theme.colors.onPrimary} size={24} />
              </View>
              <View>
                <Text style={styles.userName}>{usuario?.nombre || 'Usuario'}</Text>
                <Text style={styles.userEmail}>{usuario?.correo || 'No email'}</Text>
              </View>
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Apariencia</Text>
          <View style={styles.card}>
            <ThemeOption title="Sistema" value="system" icon={Smartphone} />
            <ThemeOption title="Claro" value="light" icon={Sun} />
            <ThemeOption title="Oscuro" value="dark" icon={Moon} />
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Cuenta</Text>
          <TouchableOpacity style={styles.logoutBtn} onPress={logout}>
            <LogOut color={theme.colors.error} size={20} style={{ marginRight: 12 }} />
            <Text style={styles.logoutText}>Cerrar Sesión</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}

const createStyles = (theme: any) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: theme.spacing.lg,
    paddingTop: theme.spacing.xl,
    backgroundColor: theme.colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.surfaceVariant,
  },
  backButton: {
    marginRight: theme.spacing.md,
  },
  title: {
    fontFamily: theme.typography.fontFamily.bold,
    fontSize: theme.typography.headlineMd.fontSize,
    color: theme.colors.onSurface,
  },
  content: {
    padding: theme.spacing.lg,
  },
  section: {
    marginBottom: theme.spacing.xl,
  },
  sectionTitle: {
    fontFamily: theme.typography.fontFamily.semiBold,
    fontSize: theme.typography.labelLg.fontSize,
    color: theme.colors.onSurfaceVariant,
    marginBottom: theme.spacing.sm,
    textTransform: 'uppercase',
  },
  card: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.roundness.md,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: theme.colors.outline,
  },
  profileRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: theme.spacing.md,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: theme.colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: theme.spacing.md,
  },
  userName: {
    fontFamily: theme.typography.fontFamily.bold,
    fontSize: theme.typography.bodyLg.fontSize,
    color: theme.colors.onSurface,
  },
  userEmail: {
    fontFamily: theme.typography.fontFamily.regular,
    fontSize: theme.typography.bodyMd.fontSize,
    color: theme.colors.onSurfaceVariant,
  },
  optionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: theme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.surfaceVariant,
  },
  optionItemActive: {
    backgroundColor: theme.colors.primaryContainer,
  },
  optionText: {
    fontFamily: theme.typography.fontFamily.medium,
    fontSize: theme.typography.bodyLg.fontSize,
    color: theme.colors.onSurface,
    marginLeft: theme.spacing.sm,
  },
  optionTextActive: {
    color: theme.colors.primary,
    fontFamily: theme.typography.fontFamily.bold,
  },
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.surface,
    padding: theme.spacing.md,
    borderRadius: theme.roundness.md,
    borderWidth: 1,
    borderColor: theme.colors.error,
  },
  logoutText: {
    fontFamily: theme.typography.fontFamily.bold,
    fontSize: theme.typography.bodyLg.fontSize,
    color: theme.colors.error,
  },
});
