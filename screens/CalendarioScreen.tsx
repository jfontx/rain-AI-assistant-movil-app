import React, { useState, useEffect, useCallback } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import {
  View, Text, FlatList, TouchableOpacity, TextInput,
  StyleSheet, Alert, RefreshControl, Modal, Keyboard, TouchableWithoutFeedback, KeyboardAvoidingView, Platform
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../context/ThemeContext';
import { theme as staticTheme } from '../theme';
import FloatingMicrophone from '../components/FloatingMicrophone';
import { obtenerEventos, crearEvento, Evento } from '../services/api';
import { Calendar, Clock, CheckCircle2, ListTodo, Plus } from 'lucide-react-native';
import { theme } from '../theme';

const getFormatDate = (date: Date) => {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
};

const getDayName = (date: Date) => {
  return date.toLocaleDateString('es-CO', { weekday: 'short' }).substring(0, 3);
};

const generarFechas = () => {
  const fechas = [];
  const hoy = new Date();
  for (let i = -7; i <= 30; i++) {
    const d = new Date(hoy);
    d.setDate(hoy.getDate() + i);
    fechas.push({
      date: d,
      fechaStr: getFormatDate(d),
      diaSemana: getDayName(d),
      diaMes: d.getDate()
    });
  }
  return fechas;
};

const formatearHora = (iso: string) =>
  new Date(iso).toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' });

const ESTADO_COLOR: Record<string, string> = {
  pendiente: theme.colors.tertiary,
  en_progreso: theme.colors.primary,
  completado: staticTheme.colors.secondary,
};

const FECHAS_CALENDARIO = generarFechas();

export default function CalendarioScreen() {
  const { theme } = useTheme();
  const styles = createStyles(theme);
  const [eventos, setEventos] = useState<Evento[]>([]);
  const [fechaSeleccionada, setFechaSeleccionada] = useState(getFormatDate(new Date()));
  const [cargando, setCargando] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [form, setForm] = useState({ titulo: '', categoria: '', fecha_inicio: '', fecha_fin: '', notas: '' });

  const flatListRef = React.useRef<FlatList>(null);

  useEffect(() => {
    // Scroll inicial para centrar el día de hoy
    setTimeout(() => {
      const index = FECHAS_CALENDARIO.findIndex(f => f.fechaStr === getFormatDate(new Date()));
      if (index !== -1 && flatListRef.current) {
        flatListRef.current.scrollToIndex({ index, animated: true, viewPosition: 0.5 });
      }
    }, 500);
  }, []);

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
    if (eventos.length === 0) setCargando(true);
    try {
      const datos = await obtenerEventos();
      setEventos(datos.sort((a, b) => new Date(a.fecha_inicio).getTime() - new Date(b.fecha_inicio).getTime()));
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

      <View style={styles.selectorFechasContainer}>
        <FlatList
          ref={flatListRef}
          horizontal
          showsHorizontalScrollIndicator={false}
          data={FECHAS_CALENDARIO}
          keyExtractor={item => item.fechaStr}
          contentContainerStyle={{ paddingHorizontal: theme.spacing.margin, gap: 12, paddingBottom: 16 }}
          getItemLayout={(data, index) => ({ length: 60, offset: 72 * index, index })}
          renderItem={({ item }) => {
            const isSelected = item.fechaStr === fechaSeleccionada;
            const isToday = item.fechaStr === getFormatDate(new Date());
            return (
              <TouchableOpacity
                style={[styles.diaContenedor, isSelected && styles.diaContenedorSeleccionado]}
                onPress={() => {
                  setFechaSeleccionada(item.fechaStr);
                  const idx = FECHAS_CALENDARIO.findIndex(f => f.fechaStr === item.fechaStr);
                  flatListRef.current?.scrollToIndex({ index: idx, animated: true, viewPosition: 0.5 });
                }}
              >
                <Text style={[styles.diaTextoSemana, isSelected && styles.diaTextoSeleccionado]}>
                  {isToday ? 'HOY' : item.diaSemana.toUpperCase()}
                </Text>
                <Text style={[styles.diaTextoMes, isSelected && styles.diaTextoSeleccionado]}>
                  {item.diaMes}
                </Text>
                {isSelected && <View style={styles.puntoIndicador} />}
              </TouchableOpacity>
            );
          }}
        />
      </View>

      <FlatList
        style={{ flex: 1 }}
        data={eventos.filter(e => getFormatDate(new Date(e.fecha_inicio)) === fechaSeleccionada)}
        keyExtractor={item => String(item.id)}
        refreshControl={<RefreshControl refreshing={cargando} onRefresh={cargarEventos} tintColor={theme.colors.primary} />}
        contentContainerStyle={styles.lista}
        ListEmptyComponent={
          <View style={styles.vacioContenedor}>
            <Calendar size={48} color={theme.colors.outline} style={{ marginBottom: theme.spacing.md }} />
            <Text style={styles.textoVacio}>No tienes eventos para este día.{'\n'}Habla con Raín para agendar algo.</Text>
          </View>
        }
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
  
  lista: { paddingHorizontal: theme.spacing.margin, paddingTop: theme.spacing.margin, paddingBottom: 150 },
  vacioContenedor: { alignItems: 'center', marginTop: 80 },
  textoVacio: { fontFamily: theme.typography.fontFamily.regular, textAlign: 'center', color: theme.colors.outline, fontSize: theme.typography.bodyMd.fontSize, lineHeight: 24 },
  
  selectorFechasContainer: { backgroundColor: theme.colors.surface, borderBottomWidth: 1, borderBottomColor: theme.colors.surfaceVariant, paddingTop: 10 },
  diaContenedor: { alignItems: 'center', justifyContent: 'center', width: 60, height: 75, borderRadius: 20, backgroundColor: theme.colors.surfaceVariant },
  diaContenedorSeleccionado: { backgroundColor: theme.colors.primary },
  diaTextoSemana: { fontFamily: theme.typography.fontFamily.medium, fontSize: 11, color: theme.colors.onSurfaceVariant, marginBottom: 4 },
  diaTextoMes: { fontFamily: theme.typography.fontFamily.bold, fontSize: 18, color: theme.colors.onSurface },
  diaTextoSeleccionado: { color: theme.colors.onPrimary },
  puntoIndicador: { width: 4, height: 4, borderRadius: 2, backgroundColor: theme.colors.onPrimary, position: 'absolute', bottom: 10 },
  
  tarjeta: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: theme.spacing.md, gap: theme.spacing.md },
  tarjetaCompletada: { opacity: 0.5 },
  
  horaContainer: { width: 50, alignItems: 'flex-end', paddingTop: 4 },
  hora: { fontFamily: theme.typography.fontFamily.bold, color: theme.colors.onSurface, fontSize: theme.typography.labelLg.fontSize },
  horaFin: { fontFamily: theme.typography.fontFamily.medium, color: theme.colors.onSurfaceVariant, fontSize: theme.typography.labelMd.fontSize, marginTop: 2 },
  
  lineaTiempo: { width: 4, borderRadius: theme.roundness.full, alignSelf: 'stretch', marginTop: 4 },
  
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
