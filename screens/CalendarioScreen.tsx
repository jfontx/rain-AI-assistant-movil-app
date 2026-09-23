import React, { useState, useEffect, useCallback } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import {
  View, Text, SectionList, TouchableOpacity, TextInput,
  StyleSheet, Alert, SafeAreaView, RefreshControl, Modal, Keyboard, TouchableWithoutFeedback, KeyboardAvoidingView, Platform
} from 'react-native';
import { useTheme } from '../context/ThemeContext';
import { theme as staticTheme } from '../theme';
import FloatingMicrophone from '../components/FloatingMicrophone';
import { obtenerEventos, crearEvento, Evento } from '../services/api';
import { Calendar, Clock, CheckCircle2, ListTodo, Plus } from 'lucide-react-native';
import { theme } from '../theme';

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
  completado: staticTheme.colors.secondary,
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
  const { theme } = useTheme();
  const styles = createStyles(theme);
  const [secciones, setSecciones] = useState<Seccion[]>([]);
  const [cargando, setCargando] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [form, setForm] = useState({ titulo: '', categoria: '', fecha_inicio: '', fecha_fin: '', notas: '' });

  const guardarEvento = async () => {
    if (!form.titulo || !form.fecha_inicio) {
      return Alert.alert('Error', 'El título y la fecha de inicio son obligatorios.');
    }
    try {
      await crearEvento({
        titulo: form.titulo,
        categoria: form.categoria || undefined,
        fecha_inicio: form.fecha_inicio,
        fecha_fin: form.fecha_fin || undefined,
        notas: form.notas || undefined,
        tipo: 'evento',
        estado: 'pendiente'
      });
      setModalVisible(false);
      setForm({ titulo: '', categoria: '', fecha_inicio: '', fecha_fin: '', notas: '' });
      cargarEventos();
    } catch {
      Alert.alert('Error', 'No se pudo crear el evento.');
    }
  };

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

  // Recargar cada vez que la pestaña recibe foco
  useFocusEffect(
    useCallback(() => {
      cargarEventos();
    }, [cargarEventos])
  );

  return (
    <SafeAreaView style={styles.contenedor}>
      <View style={styles.header}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <View>
            <Text style={styles.headerTitulo}>Calendario</Text>
            <Text style={styles.headerSub}>Próximos eventos y tareas</Text>
          </View>
          <TouchableOpacity onPress={() => setModalVisible(true)}>
            <Plus size={28} color={theme.colors.primary} />
          </TouchableOpacity>
        </View>
      </View>

      <SectionList
        sections={secciones}
        keyExtractor={item => String(item.id)}
        refreshControl={<RefreshControl refreshing={cargando} onRefresh={cargarEventos} tintColor={theme.colors.primary} />}
        contentContainerStyle={styles.lista}
        ListEmptyComponent={
          <View style={styles.vacioContenedor}>
            <Calendar size={48} color={theme.colors.outline} style={{ marginBottom: theme.spacing.md }} />
            <Text style={styles.textoVacio}>No tienes eventos próximos.{'\n'}Habla con Raín para crear uno.</Text>
          </View>
        }
        renderSectionHeader={({ section: { title } }) => (
          <View style={styles.seccionHeader}>
            <Text style={styles.seccionTitulo}>{title}</Text>
          </View>
        )}
        renderItem={({ item }) => (
          <View style={[styles.tarjeta, item.estado === 'completado' && styles.tarjetaCompletada]}>
            <View style={styles.horaContainer}>
              <Text style={styles.hora}>{formatearHora(item.fecha_inicio)}</Text>
              {item.fecha_fin && (
                <Text style={styles.horaFin}>{formatearHora(item.fecha_fin)}</Text>
              )}
            </View>
            <View style={[styles.lineaTiempo, { backgroundColor: ESTADO_COLOR[item.estado || 'pendiente'] || theme.colors.outline }]} />
            <View style={styles.contenidoEvento}>
              <View style={styles.filaTitulo}>
                {item.tipo === 'tarea' ? (
                  <ListTodo size={16} color={theme.colors.onSurfaceVariant} />
                ) : (
                  <Calendar size={16} color={theme.colors.onSurfaceVariant} />
                )}
                <Text style={[styles.tituloEvento, item.estado === 'completado' && styles.tachado]}>
                  {item.titulo}
                </Text>
              </View>
              {item.categoria && (
                <Text style={styles.categoriaEvento}>{item.categoria}</Text>
              )}
              {item.notas && (
                <Text style={styles.notasEvento}>{item.notas}</Text>
              )}
              <View style={[styles.badgeEstado, { backgroundColor: (ESTADO_COLOR[item.estado || 'pendiente'] || theme.colors.outline) + '15' }]}>
                <Text style={[styles.textoEstado, { color: ESTADO_COLOR[item.estado || 'pendiente'] || theme.colors.outline }]}>
                  {item.estado?.replace('_', ' ')}
                </Text>
              </View>
            </View>
          </View>
        )}
        stickySectionHeadersEnabled
      />

      {/* Modal crear evento */}
      <Modal visible={modalVisible} transparent animationType="fade">
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.modalOverlay}>
            <View style={styles.modal}>
              <Text style={styles.modalTitulo}>Nuevo Evento</Text>
              <TextInput style={styles.input} placeholder="Título del evento" placeholderTextColor={theme.colors.outline} value={form.titulo} onChangeText={t => setForm({...form, titulo: t})} />
              <TextInput style={styles.input} placeholder="Categoría (ej: Trabajo, Personal)" placeholderTextColor={theme.colors.outline} value={form.categoria} onChangeText={t => setForm({...form, categoria: t})} />
              <TextInput style={styles.input} placeholder="Fecha Inicio (YYYY-MM-DDTHH:MM)" placeholderTextColor={theme.colors.outline} value={form.fecha_inicio} onChangeText={t => setForm({...form, fecha_inicio: t})} />
              <TextInput style={styles.input} placeholder="Fecha Fin (Opcional)" placeholderTextColor={theme.colors.outline} value={form.fecha_fin} onChangeText={t => setForm({...form, fecha_fin: t})} />
              <TextInput style={[styles.input, {height: 80}]} placeholder="Notas (opcional)" placeholderTextColor={theme.colors.outline} multiline value={form.notas} onChangeText={t => setForm({...form, notas: t})} />
              <View style={styles.filaBotones}>
                <TouchableOpacity style={styles.btnCancelar} onPress={() => setModalVisible(false)}><Text style={styles.textoCancelar}>Cancelar</Text></TouchableOpacity>
                <TouchableOpacity style={styles.btnGuardar} onPress={guardarEvento}><Text style={styles.textoGuardar}>Guardar</Text></TouchableOpacity>
              </View>
            </View>
          </KeyboardAvoidingView>
        </TouchableWithoutFeedback>
      </Modal>

      <FloatingMicrophone />
    </SafeAreaView>
  );
}

const createStyles = (theme: any) => StyleSheet.create({
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
  
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', padding: theme.spacing.margin },
  modal: { backgroundColor: theme.colors.surface, borderRadius: theme.roundness.xl, padding: theme.spacing.lg, gap: theme.spacing.md },
  modalTitulo: { fontFamily: theme.typography.fontFamily.bold, fontSize: 20, color: theme.colors.onSurface },
  input: { backgroundColor: theme.colors.surfaceVariant, padding: 12, borderRadius: theme.roundness.md, fontFamily: theme.typography.fontFamily.regular, color: theme.colors.onSurface },
  filaBotones: { flexDirection: 'row', gap: theme.spacing.md, marginTop: theme.spacing.md },
  btnCancelar: { flex: 1, alignItems: 'center', padding: 12, borderRadius: theme.roundness.full, backgroundColor: theme.colors.surfaceVariant },
  textoCancelar: { fontFamily: theme.typography.fontFamily.semiBold, color: theme.colors.onSurface },
  btnGuardar: { flex: 1, alignItems: 'center', padding: 12, borderRadius: theme.roundness.full, backgroundColor: theme.colors.primary },
  textoGuardar: { fontFamily: theme.typography.fontFamily.bold, color: theme.colors.onPrimary },
});
