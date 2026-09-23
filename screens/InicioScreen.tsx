import React, { useEffect, useState, useContext } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, TouchableOpacity } from 'react-native';
import { useIsFocused, useNavigation } from '@react-navigation/native';
import { useTheme } from '../context/ThemeContext';
import FloatingMicrophone from '../components/FloatingMicrophone';
import { obtenerTransacciones, obtenerEventos, Transaccion, Evento } from '../services/api';
import { Wallet, AlertCircle, Settings } from 'lucide-react-native';
import { AuthContext } from '../context/AuthContext';

export default function InicioScreen() {
  const { theme } = useTheme();
  const styles = createStyles(theme);
  const isFocused = useIsFocused();
  const navigation = useNavigation<any>();
  const { usuario } = useContext(AuthContext);
  const [cargando, setCargando] = useState(true);
  const [balanceMes, setBalanceMes] = useState(0);
  const [tareasUrgentes, setTareasUrgentes] = useState<Evento[]>([]);

  useEffect(() => {
    if (isFocused) {
      cargarDatos();
    }
  }, [isFocused]);

  const cargarDatos = async () => {
    setCargando(true);
    try {
      // Calcular balance del mes
      const txs = await obtenerTransacciones();
      const mesActual = new Date().getMonth();
      const añoActual = new Date().getFullYear();
      
      let balance = 0;
      txs.forEach(t => {
        const fechaTx = new Date(t.fecha || new Date());
        if (fechaTx.getMonth() === mesActual && fechaTx.getFullYear() === añoActual) {
          if (t.tipo === 'ingreso') balance += t.monto;
          else if (t.tipo === 'gasto') balance -= t.monto;
        }
      });
      setBalanceMes(balance);

      // Obtener tareas urgentes
      const evts = await obtenerEventos('tarea');
      const pendientes = evts.filter(e => e.estado === 'pendiente');
      // Mapear prioridad a número para ordenar
      const valPrio = { alta: 3, media: 2, baja: 1 };
      pendientes.sort((a, b) => {
        const pA = valPrio[(a.prioridad as 'alta'|'media'|'baja') || 'baja'];
        const pB = valPrio[(b.prioridad as 'alta'|'media'|'baja') || 'baja'];
        return pB - pA; // Descendente
      });
      setTareasUrgentes(pendientes.slice(0, 3));
    } catch (e) {
      console.error(e);
    } finally {
      setCargando(false);
    }
  };

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.header}>
          <View style={{ flex: 1 }}>
            <Text style={styles.greeting}>Hola, {usuario?.nombre.split(' ')[0] || 'Visitante'} 👋</Text>
            <Text style={styles.subtitle}>Aquí tienes tu resumen del día</Text>
          </View>
          <TouchableOpacity onPress={() => navigation.navigate('Configuracion')} style={styles.logoutButton}>
            <Settings color={theme.colors.onSurfaceVariant} size={24} />
          </TouchableOpacity>
        </View>

        {cargando ? (
          <ActivityIndicator size="large" color={theme.colors.primary} style={{ marginTop: 40 }} />
        ) : (
          <>
            {/* Tarjeta de Resumen Financiero */}
            <View style={styles.card}>
              <View style={styles.cardHeader}>
                <Wallet color={theme.colors.primaryContainer} size={24} />
                <Text style={styles.cardTitle}>Balance de este mes</Text>
              </View>
              <Text style={styles.balance}>
                ${balanceMes.toLocaleString('es-CO')}
              </Text>
              <Text style={styles.balanceSubtitle}>Disponible en tus cuentas</Text>
            </View>

            {/* Tarjeta de Tareas Prioritarias */}
            <View style={styles.card}>
              <View style={styles.cardHeader}>
                <AlertCircle color={theme.colors.tertiary} size={24} />
                <Text style={styles.cardTitle}>Prioridad Académica</Text>
              </View>
              {tareasUrgentes.length === 0 ? (
                <Text style={styles.emptyText}>No tienes tareas urgentes 🎉</Text>
              ) : (
                tareasUrgentes.map((t, idx) => (
                  <View key={t.id || idx} style={styles.taskItem}>
                    <View style={styles.taskBullet} />
                    <View style={styles.taskInfo}>
                      <Text style={styles.taskTitle}>{t.titulo}</Text>
                      {t.fecha_inicio && (
                        <Text style={styles.taskDate}>
                          {new Date(t.fecha_inicio).toLocaleDateString('es-CO')}
                        </Text>
                      )}
                    </View>
                  </View>
                ))
              )}
            </View>
          </>
        )}
      </ScrollView>

      <FloatingMicrophone />
    </View>
  );
}

const createStyles = (theme: any) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  scroll: {
    padding: theme.spacing.margin,
    paddingTop: 60,
    paddingBottom: 100, // Espacio para el FAB
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: theme.spacing.xl,
  },
  logoutButton: {
    padding: 8,
  },
  greeting: {
    fontFamily: theme.typography.fontFamily.bold,
    fontSize: theme.typography.display.fontSize,
    color: theme.colors.onSurface,
    letterSpacing: theme.typography.display.letterSpacing,
  },
  subtitle: {
    fontFamily: theme.typography.fontFamily.regular,
    fontSize: theme.typography.bodyLg.fontSize,
    color: theme.colors.onSurfaceVariant,
    marginTop: theme.spacing.xs,
  },
  card: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.roundness.xl,
    padding: theme.spacing.lg,
    marginBottom: theme.spacing.lg,
    // Sombra Level 1
    shadowColor: theme.shadows.level1.shadowColor,
    shadowOffset: theme.shadows.level1.shadowOffset,
    shadowOpacity: theme.shadows.level1.shadowOpacity,
    shadowRadius: theme.shadows.level1.shadowRadius,
    elevation: theme.shadows.level1.elevation,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.md,
  },
  cardTitle: {
    fontFamily: theme.typography.fontFamily.semiBold,
    fontSize: theme.typography.headlineSm.fontSize,
    color: theme.colors.onSurface,
    marginLeft: theme.spacing.sm,
  },
  balance: {
    fontFamily: theme.typography.fontFamily.bold,
    fontSize: theme.typography.headlineLg.fontSize,
    color: theme.colors.primary,
  },
  balanceSubtitle: {
    fontFamily: theme.typography.fontFamily.medium,
    fontSize: theme.typography.bodySm.fontSize,
    color: theme.colors.onSurfaceVariant,
    marginTop: 4,
  },
  emptyText: {
    fontFamily: theme.typography.fontFamily.regular,
    fontSize: theme.typography.bodyMd.fontSize,
    color: theme.colors.outline,
    fontStyle: 'italic',
  },
  taskItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: theme.spacing.md,
  },
  taskBullet: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: theme.colors.tertiary,
    marginTop: 6,
    marginRight: theme.spacing.sm,
  },
  taskInfo: {
    flex: 1,
  },
  taskTitle: {
    fontFamily: theme.typography.fontFamily.medium,
    fontSize: theme.typography.bodyMd.fontSize,
    color: theme.colors.onSurface,
  },
  taskDate: {
    fontFamily: theme.typography.fontFamily.regular,
    fontSize: theme.typography.labelMd.fontSize,
    color: theme.colors.error,
    marginTop: 2,
  },
});
