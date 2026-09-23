import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, SectionList, TouchableOpacity,
  StyleSheet, Alert, SafeAreaView, RefreshControl,
} from 'react-native';
import { theme } from '../theme';
import FloatingMicrophone from '../components/FloatingMicrophone';
import { obtenerEventos, Evento } from '../services/api';
import { Calendar, Clock, CheckCircle2, ListTodo } from 'lucide-react-native';

const formatearDia = (iso: string) => {
  const d = new Date(iso);
  const hoy = new Date();
  const manana = new Date(hoy);
  manana.setDate(hoy.getDate() + 1);

  if (d.toDateString() === hoy.toDateString()) return 'Hoy';
  if (d.toDateString() === manana.toDateString()) return 'Mañana';
  return d.toLocaleDateString('es-CO', { weekday: 'long', day: 'numeric', month: 'long' });
};

const formatearHora = (iso: string) =>
  new Date(iso).toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' });

const ESTADO_COLOR: Record<string, string> = {
  pendiente: theme.colors.tertiary,
  en_progreso: theme.colors.primary,
  completado: theme.colors.secondary,
};

type Seccion = { title: string; data: Evento[] };

function agruparPorDia(eventos: Evento[]): Seccion[] {
  const grupos: Record<string, Evento[]> = {};
  for (const evento of eventos) {
    const clave = new Date(evento.fecha_inicio).toDateString();
    if (!grupos[clave]) grupos[clave] = [];
    grupos[clave].push(evento);
  }
  return Object.entries(grupos)
    .sort(([a], [b]) => new Date(a).getTime() - new Date(b).getTime())
    .map(([, evts]) => ({
      title: formatearDia(evts[0].fecha_inicio),
      data: evts,
    }));
}

export default function CalendarioScreen() {
  const [secciones, setSecciones] = useState<Seccion[]>([]);
  const [cargando, setCargando] = useState(false);

  const cargarEventos = useCallback(async () => {
    setCargando(true);
    try {
      const datos = await obtenerEventos();
      setSecciones(agruparPorDia(datos));
    } catch {
      Alert.alert('Error', 'No se pudo conectar al backend.');
    } finally {
      setCargando(false);
    }
  }, []);

  useEffect(() => { cargarEventos(); }, [cargarEventos]);

  return (
    <SafeAreaView style={est.contenedor}>
      <View style={est.header}>
        <Text style={est.headerTitulo}>Calendario</Text>
        <Text style={est.headerSub}>Próximos eventos y tareas</Text>
      </View>

      <SectionList
        sections={secciones}
        keyExtractor={item => String(item.id)}
        refreshControl={<RefreshControl refreshing={cargando} onRefresh={cargarEventos} tintColor={theme.colors.primary} />}
        contentContainerStyle={est.lista}
        ListEmptyComponent={
          <View style={est.vacioContenedor}>
            <Calendar size={48} color={theme.colors.outline} style={{ marginBottom: theme.spacing.md }} />
            <Text style={est.textoVacio}>No tienes eventos próximos.{'\n'}Habla con Raín para crear uno.</Text>
          </View>
        }
        renderSectionHeader={({ section: { title } }) => (
          <View style={est.seccionHeader}>
            <Text style={est.seccionTitulo}>{title}</Text>
          </View>
        )}
        renderItem={({ item }) => (
          <View style={[est.tarjeta, item.estado === 'completado' && est.tarjetaCompletada]}>
            <View style={est.horaContainer}>
              <Text style={est.hora}>{formatearHora(item.fecha_inicio)}</Text>
              {item.fecha_fin && (
                <Text style={est.horaFin}>{formatearHora(item.fecha_fin)}</Text>
              )}
            </View>
            <View style={[est.lineaTiempo, { backgroundColor: ESTADO_COLOR[item.estado || 'pendiente'] || theme.colors.outline }]} />
            <View style={est.contenidoEvento}>
              <View style={est.filaTitulo}>
                {item.tipo === 'tarea' ? (
                  <ListTodo size={16} color={theme.colors.onSurfaceVariant} />
                ) : (
                  <Calendar size={16} color={theme.colors.onSurfaceVariant} />
                )}
                <Text style={[est.tituloEvento, item.estado === 'completado' && est.tachado]}>
                  {item.titulo}
                </Text>
              </View>
              {item.categoria && (
                <Text style={est.categoriaEvento}>{item.categoria}</Text>
              )}
              {item.notas && (
                <Text style={est.notasEvento}>{item.notas}</Text>
              )}
              <View style={[est.badgeEstado, { backgroundColor: (ESTADO_COLOR[item.estado || 'pendiente'] || theme.colors.outline) + '15' }]}>
                <Text style={[est.textoEstado, { color: ESTADO_COLOR[item.estado || 'pendiente'] || theme.colors.outline }]}>
                  {item.estado?.replace('_', ' ')}
                </Text>
              </View>
            </View>
          </View>
        )}
        stickySectionHeadersEnabled
      />

      <FloatingMicrophone />
    </SafeAreaView>
  );
}

const est = StyleSheet.create({
  contenedor: { flex: 1, backgroundColor: theme.colors.background },
  header: { 
    backgroundColor: theme.colors.surface, 
    paddingTop: theme.spacing.xl,
    paddingHorizontal: theme.spacing.margin,
    paddingBottom: theme.spacing.lg,
    borderBottomWidth: 1, 
    borderBottomColor: theme.colors.surfaceVariant,
    shadowColor: theme.shadows.level1.shadowColor,
    shadowOffset: theme.shadows.level1.shadowOffset,
    shadowOpacity: theme.shadows.level1.shadowOpacity,
    shadowRadius: theme.shadows.level1.shadowRadius,
    elevation: theme.shadows.level1.elevation,
  },
  headerTitulo: { fontFamily: theme.typography.fontFamily.bold, color: theme.colors.onSurface, fontSize: theme.typography.display.fontSize },
  headerSub: { fontFamily: theme.typography.fontFamily.medium, color: theme.colors.onSurfaceVariant, fontSize: theme.typography.bodyMd.fontSize, marginTop: 4 },
  
  lista: { padding: theme.spacing.margin, paddingBottom: 100 },
  vacioContenedor: { alignItems: 'center', marginTop: 80 },
  textoVacio: { fontFamily: theme.typography.fontFamily.regular, textAlign: 'center', color: theme.colors.outline, fontSize: theme.typography.bodyMd.fontSize, lineHeight: 24 },
  
  seccionHeader: { backgroundColor: theme.colors.background, paddingVertical: theme.spacing.sm, marginBottom: theme.spacing.xs },
  seccionTitulo: { fontFamily: theme.typography.fontFamily.bold, color: theme.colors.primary, fontSize: theme.typography.headlineMd.fontSize, textTransform: 'capitalize' },
  
  tarjeta: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: theme.spacing.md, gap: theme.spacing.md },
  tarjetaCompletada: { opacity: 0.5 },
  
  horaContainer: { width: 50, alignItems: 'flex-end', paddingTop: 4 },
  hora: { fontFamily: theme.typography.fontFamily.bold, color: theme.colors.onSurface, fontSize: theme.typography.labelLg.fontSize },
  horaFin: { fontFamily: theme.typography.fontFamily.medium, color: theme.colors.onSurfaceVariant, fontSize: theme.typography.labelMd.fontSize, marginTop: 2 },
  
  lineaTiempo: { width: 4, borderRadius: theme.roundness.full, minHeight: '100%', marginTop: 4 },
  
  contenidoEvento: { flex: 1, backgroundColor: theme.colors.surface, borderRadius: theme.roundness.xl, padding: theme.spacing.md, borderWidth: 1, borderColor: theme.colors.surfaceVariant },
  filaTitulo: { flexDirection: 'row', alignItems: 'flex-start', gap: theme.spacing.sm },
  tituloEvento: { fontFamily: theme.typography.fontFamily.semiBold, color: theme.colors.onSurface, fontSize: theme.typography.bodyLg.fontSize, flex: 1 },
  tachado: { textDecorationLine: 'line-through', color: theme.colors.onSurfaceVariant },
  categoriaEvento: { fontFamily: theme.typography.fontFamily.medium, color: theme.colors.primary, fontSize: theme.typography.labelMd.fontSize, marginTop: theme.spacing.xs, textTransform: 'uppercase' },
  notasEvento: { fontFamily: theme.typography.fontFamily.regular, color: theme.colors.onSurfaceVariant, fontSize: theme.typography.bodyMd.fontSize, marginTop: theme.spacing.xs, fontStyle: 'italic' },
  
  badgeEstado: { alignSelf: 'flex-start', paddingHorizontal: 10, paddingVertical: 4, borderRadius: theme.roundness.sm, marginTop: theme.spacing.sm },
  textoEstado: { fontFamily: theme.typography.fontFamily.semiBold, fontSize: 11, textTransform: 'capitalize' },
});
