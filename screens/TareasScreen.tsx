import React, { useState, useEffect, useCallback } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import {
  View, Text, FlatList, TouchableOpacity, TextInput,
  Modal, StyleSheet, Alert, SafeAreaView, RefreshControl, ScrollView
} from 'react-native';
import { useTheme } from '../context/ThemeContext';
import { theme as staticTheme } from '../theme';
import FloatingMicrophone from '../components/FloatingMicrophone';
import { obtenerEventos, crearEvento, actualizarEvento, eliminarEvento, Evento } from '../services/api';
import { Plus, CheckCircle2, Clock, CheckSquare, CircleDot, Play, CircleCheck, X } from 'lucide-react-native';
import { Keyboard, TouchableWithoutFeedback, KeyboardAvoidingView, Platform as RNPlatform, Animated } from 'react-native';

const PRIORIDAD_COLOR: Record<string, string> = {
  alta: staticTheme.colors.error,
  media: staticTheme.colors.tertiary,
  baja: staticTheme.colors.primary,
};

const formatearFecha = (iso: string) => {
  const d = new Date(iso);
  return d.toLocaleDateString('es-CO', { weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
};

type TabType = 'pendiente' | 'en_progreso' | 'completado';

export default function TareasScreen() {
  const { theme } = useTheme();
  const styles = createStyles(theme);
  const [tareas, setTareas] = useState<Evento[]>([]);
  const [cargando, setCargando] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [estadoModal, setEstadoModal] = useState(false);
  const [tareaSeleccionada, setTareaSeleccionada] = useState<Evento | null>(null);
  const [activeTab, setActiveTab] = useState<TabType>('pendiente');
  const [activeCategoria, setActiveCategoria] = useState<string>('Todas');
  
  const [form, setForm] = useState({
    titulo: '',
    fecha_inicio: new Date(Date.now() + 86400000).toISOString().slice(0, 16),
    prioridad: 'media' as 'baja' | 'media' | 'alta',
    categoria: '',
    notas: '',
  });

  const cargarTareas = useCallback(async () => {
    setCargando(true);
    try {
      const datos = await obtenerEventos('tarea');
      setTareas(datos);
    } catch {
      Alert.alert('Error', 'No se pudo conectar al backend.');
    } finally {
      setCargando(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      cargarTareas();
    }, [cargarTareas])
  );

  const categoriasUnicas = ['Todas', ...Array.from(new Set(tareas.map(t => t.categoria).filter(Boolean)))];

  const tareasFiltradas = tareas.filter(t => {
    const estadoCoincide = (t.estado || 'pendiente') === activeTab;
    const categoriaCoincide = activeCategoria === 'Todas' || t.categoria === activeCategoria;
    return estadoCoincide && categoriaCoincide;
  });

  const cambiarEstado = async (tarea: Evento, nuevoEstado: string) => {
    if (!tarea.id) return;
    try {
      await actualizarEvento(tarea.id, { ...tarea, estado: nuevoEstado as 'pendiente' | 'en_progreso' | 'completado' });
      setEstadoModal(false);
      setTareaSeleccionada(null);
      cargarTareas();
    } catch {
      Alert.alert('Error', 'No se pudo actualizar la tarea');
    }
  };

  const abrirCambioEstado = (tarea: Evento) => {
    setTareaSeleccionada(tarea);
    setEstadoModal(true);
  };

  const guardarTarea = async () => {
    if (!form.titulo) {
      Alert.alert('Campo requerido', 'El título de la tarea es obligatorio');
      return;
    }
    try {
      await crearEvento({
        titulo: form.titulo,
        tipo: 'tarea',
        fecha_inicio: new Date(form.fecha_inicio).toISOString(),
        prioridad: form.prioridad,
        categoria: form.categoria || undefined,
        notas: form.notas || undefined,
      });
      setModalVisible(false);
      setForm({ titulo: '', fecha_inicio: new Date(Date.now() + 86400000).toISOString().slice(0, 16), prioridad: 'media', categoria: '', notas: '' });
      cargarTareas();
    } catch {
      Alert.alert('Error', 'No se pudo guardar la tarea');
    }
  };

  const confirmarEliminar = (id: number) => {
    Alert.alert('Eliminar tarea', '¿Eliminar esta tarea?', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Eliminar', style: 'destructive', onPress: async () => {
        await eliminarEvento(id);
        cargarTareas();
      }},
    ]);
  };

  const ESTADO_CONFIG = {
    pendiente: { label: 'Pendiente', icon: CircleDot, color: staticTheme.colors.tertiary },
    en_progreso: { label: 'En Progreso', icon: Play, color: staticTheme.colors.primary },
    completado: { label: 'Completada', icon: CircleCheck, color: staticTheme.colors.secondary },
  };

  const renderTarea = ({ item }: { item: Evento }) => {
    const vencida = item.estado !== 'completado' && new Date(item.fecha_inicio).getTime() < Date.now();
    const estadoActual = (item.estado || 'pendiente') as TabType;
    const config = ESTADO_CONFIG[estadoActual];
    return (
      <TouchableOpacity
        style={[styles.tarjeta, item.estado === 'completado' && styles.tarjetaCompletada]}
        onPress={() => abrirCambioEstado(item)}
        onLongPress={() => item.id && confirmarEliminar(item.id)}
      >
        <TouchableOpacity style={styles.checkbox} onPress={() => cambiarEstado(item, item.estado === 'completado' ? 'pendiente' : 'completado')}>
          <View style={[styles.checkboxInner, item.estado === 'completado' && styles.checkboxChecked]}>
            {item.estado === 'completado' && <CheckSquare color="#FFF" size={16} />}
          </View>
        </TouchableOpacity>
        <View style={styles.infoTarea}>
          <Text style={[styles.tituloTarea, item.estado === 'completado' && styles.tituloTachado]}>
            {item.titulo}
          </Text>
          <Text style={[styles.fechaTarea, vencida && { color: staticTheme.colors.error }]}>
            <Clock size={12} color={vencida ? staticTheme.colors.error : theme.colors.onSurfaceVariant} style={{ marginRight: 4 }} />
            {formatearFecha(item.fecha_inicio)} {vencida && '(Vencida)'}
          </Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 4 }}>
            <config.icon size={12} color={config.color} />
            <Text style={{ fontFamily: theme.typography.fontFamily.medium, fontSize: 11, color: config.color }}>{config.label}</Text>
            {item.categoria && <Text style={styles.categoriaText}> · {item.categoria}</Text>}
          </View>
        </View>
        <View style={[styles.badgePrioridad, { backgroundColor: PRIORIDAD_COLOR[item.prioridad || 'media'] + '15', borderColor: PRIORIDAD_COLOR[item.prioridad || 'media'] }]}>
          <Text style={[styles.textoPrioridad, { color: PRIORIDAD_COLOR[item.prioridad || 'media'] }]}>
            {item.prioridad}
          </Text>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.contenedor}>
      <View style={styles.header}>
        <View style={styles.headerRow}>
          <Text style={styles.headerTitulo}>Tareas</Text>
          <TouchableOpacity style={styles.btnNueva} onPress={() => setModalVisible(true)}>
            <Plus color={theme.colors.onPrimary} size={20} />
            <Text style={styles.btnNuevaText}>Nueva</Text>
          </TouchableOpacity>
        </View>

        {/* Tabs de Estado */}
        <View style={styles.tabsRow}>
          {(['pendiente', 'en_progreso', 'completado'] as TabType[]).map(tab => {
            const count = tareas.filter(t => (t.estado || 'pendiente') === tab).length;
            const labels = { pendiente: 'Pendientes', en_progreso: 'En Progreso', completado: 'Completadas' };
            return (
              <TouchableOpacity 
                key={tab} 
                style={[styles.tabBtn, activeTab === tab && styles.tabBtnActive]}
                onPress={() => setActiveTab(tab)}
              >
                <Text style={[styles.tabText, activeTab === tab && styles.tabTextActive]}>
                  {labels[tab]}
                </Text>
                <View style={[styles.badgeCount, activeTab === tab && styles.badgeCountActive]}>
                  <Text style={[styles.badgeText, activeTab === tab && styles.badgeTextActive]}>{count}</Text>
                </View>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Filtros Categoria */}
        {categoriasUnicas.length > 1 && (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.catsScroll} contentContainerStyle={{ paddingRight: 20 }}>
            {categoriasUnicas.map((cat: any) => (
              <TouchableOpacity
                key={cat}
                style={[styles.chip, activeCategoria === cat && styles.chipActive]}
                onPress={() => setActiveCategoria(cat)}
              >
                <Text style={[styles.chipText, activeCategoria === cat && styles.chipTextActive]}>{cat}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        )}
      </View>

      <FlatList
        data={tareasFiltradas}
        keyExtractor={item => String(item.id)}
        refreshControl={<RefreshControl refreshing={cargando} onRefresh={cargarTareas} tintColor={staticTheme.colors.primary} />}
        contentContainerStyle={styles.lista}
        ListEmptyComponent={<Text style={styles.textoVacio}>No hay tareas en esta sección.</Text>}
        renderItem={renderTarea}
      />

      {/* Modal cambiar estado */}
      <Modal visible={estadoModal} transparent animationType="fade">
        <TouchableWithoutFeedback onPress={() => { setEstadoModal(false); setTareaSeleccionada(null); }}>
          <View style={styles.overlayEstado}>
            <TouchableWithoutFeedback>
              <View style={styles.modalEstado}>
                <View style={styles.modalEstadoHeader}>
                  <Text style={styles.modalEstadoTitulo}>Cambiar estado</Text>
                  <TouchableOpacity onPress={() => { setEstadoModal(false); setTareaSeleccionada(null); }}>
                    <X size={20} color={theme.colors.onSurfaceVariant} />
                  </TouchableOpacity>
                </View>
                {tareaSeleccionada && (
                  <Text style={styles.modalEstadoSubtitulo} numberOfLines={2}>{tareaSeleccionada.titulo}</Text>
                )}
                <View style={styles.estadoOpciones}>
                  {(['pendiente', 'en_progreso', 'completado'] as TabType[]).map(estado => {
                    const config = ESTADO_CONFIG[estado];
                    const IconComp = config.icon;
                    const isActive = tareaSeleccionada?.estado === estado;
                    return (
                      <TouchableOpacity
                        key={estado}
                        style={[
                          styles.estadoOpcion,
                          { borderColor: config.color + '40' },
                          isActive && { backgroundColor: config.color + '15', borderColor: config.color },
                        ]}
                        onPress={() => tareaSeleccionada && cambiarEstado(tareaSeleccionada, estado)}
                      >
                        <IconComp size={24} color={config.color} />
                        <Text style={[styles.estadoOpcionTexto, { color: isActive ? config.color : theme.colors.onSurface }]}>{config.label}</Text>
                        {isActive && <Text style={[styles.estadoActualBadge, { color: config.color }]}>Actual</Text>}
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>

      <FloatingMicrophone />

      <Modal visible={modalVisible} transparent animationType="fade">
        <View style={styles.overlay}>
          <View style={styles.modal}>
            <Text style={styles.modalTitulo}>Nueva Tarea</Text>

            <TextInput
              style={styles.input}
              placeholder="Título de la tarea"
              placeholderTextColor={theme.colors.outline}
              value={form.titulo}
              onChangeText={v => setForm(f => ({ ...f, titulo: v }))}
            />

            <TextInput
              style={styles.input}
              placeholder="Categoría (ej: Taller, Examen)"
              placeholderTextColor={theme.colors.outline}
              value={form.categoria}
              onChangeText={v => setForm(f => ({ ...f, categoria: v }))}
            />

            <Text style={styles.labelInput}>Fecha límite</Text>
            <TextInput
              style={styles.input}
              placeholder="YYYY-MM-DDTHH:MM"
              placeholderTextColor={theme.colors.outline}
              value={form.fecha_inicio}
              onChangeText={v => setForm(f => ({ ...f, fecha_inicio: v }))}
            />

            <Text style={styles.labelInput}>Prioridad</Text>
            <View style={styles.filaPrioridad}>
              {(['baja', 'media', 'alta'] as const).map(p => (
                <TouchableOpacity
                  key={p}
                  style={[styles.btnPrioridad, form.prioridad === p && { backgroundColor: PRIORIDAD_COLOR[p] + '20', borderColor: PRIORIDAD_COLOR[p] }]}
                  onPress={() => setForm(f => ({ ...f, prioridad: p }))}
                >
                  <Text style={[styles.textoPrioridadBtn, form.prioridad === p && { color: PRIORIDAD_COLOR[p] }]}>{p}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <TextInput
              style={[styles.input, { height: 80 }]}
              placeholder="Notas (opcional)"
              placeholderTextColor={theme.colors.outline}
              value={form.notas}
              onChangeText={v => setForm(f => ({ ...f, notas: v }))}
              multiline
            />

            <View style={styles.filaBotones}>
              <TouchableOpacity style={styles.btnCancelar} onPress={() => setModalVisible(false)}>
                <Text style={styles.textoCancelar}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.btnGuardar} onPress={guardarTarea}>
                <Text style={styles.textoGuardar}>Guardar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const createStyles = (theme: any) => StyleSheet.create({
  contenedor: { flex: 1, backgroundColor: theme.colors.background },
  header: { 
    backgroundColor: theme.colors.surface, 
    paddingTop: theme.spacing.xl, 
    paddingHorizontal: theme.spacing.margin,
    borderBottomWidth: 1, 
    borderBottomColor: theme.colors.surfaceVariant,
    shadowColor: theme.shadows.level1.shadowColor,
    shadowOffset: theme.shadows.level1.shadowOffset,
    shadowOpacity: theme.shadows.level1.shadowOpacity,
    shadowRadius: theme.shadows.level1.shadowRadius,
    elevation: theme.shadows.level1.elevation,
  },
  headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: theme.spacing.md },
  headerTitulo: { fontFamily: theme.typography.fontFamily.bold, color: theme.colors.onSurface, fontSize: theme.typography.display.fontSize },
  btnNueva: { flexDirection: 'row', alignItems: 'center', backgroundColor: staticTheme.colors.primary, paddingHorizontal: 16, paddingVertical: 8, borderRadius: theme.roundness.full },
  btnNuevaText: { fontFamily: theme.typography.fontFamily.semiBold, color: theme.colors.onPrimary, marginLeft: 4, fontSize: theme.typography.labelMd.fontSize },
  
  tabsRow: { flexDirection: 'row', marginBottom: theme.spacing.md, gap: theme.spacing.sm },
  tabBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 8, borderRadius: theme.roundness.full, backgroundColor: theme.colors.surfaceVariant },
  tabBtnActive: { backgroundColor: staticTheme.colors.primaryContainer },
  tabText: { fontFamily: theme.typography.fontFamily.semiBold, color: theme.colors.onSurfaceVariant, fontSize: theme.typography.labelMd.fontSize },
  tabTextActive: { color: theme.colors.onPrimaryContainer },
  badgeCount: { marginLeft: 4, backgroundColor: theme.colors.surface, paddingHorizontal: 6, paddingVertical: 2, borderRadius: theme.roundness.full },
  badgeCountActive: { backgroundColor: theme.colors.onPrimaryContainer },
  badgeText: { fontFamily: theme.typography.fontFamily.bold, fontSize: 10, color: theme.colors.onSurfaceVariant },
  badgeTextActive: { color: staticTheme.colors.primaryContainer },

  catsScroll: { marginBottom: theme.spacing.sm },
  chip: { paddingHorizontal: 16, paddingVertical: 6, borderRadius: theme.roundness.full, backgroundColor: theme.colors.surfaceVariant, marginRight: 8 },
  chipActive: { backgroundColor: theme.colors.onSurfaceVariant },
  chipText: { fontFamily: theme.typography.fontFamily.medium, fontSize: theme.typography.labelMd.fontSize, color: theme.colors.onSurfaceVariant },
  chipTextActive: { color: theme.colors.surface },

  lista: { padding: theme.spacing.margin, paddingBottom: 100, gap: theme.spacing.md },
  textoVacio: { fontFamily: theme.typography.fontFamily.regular, textAlign: 'center', color: theme.colors.outline, marginTop: 40 },
  
  tarjeta: { flexDirection: 'row', alignItems: 'flex-start', backgroundColor: theme.colors.surface, borderRadius: theme.roundness.xl, padding: theme.spacing.md, borderWidth: 1, borderColor: theme.colors.surfaceVariant },
  tarjetaCompletada: { opacity: 0.6, backgroundColor: theme.colors.surfaceVariant },
  checkbox: { marginRight: theme.spacing.md, marginTop: 2 },
  checkboxInner: { width: 24, height: 24, borderRadius: 12, borderWidth: 2, borderColor: theme.colors.outline, alignItems: 'center', justifyContent: 'center' },
  checkboxChecked: { backgroundColor: staticTheme.colors.primary, borderColor: staticTheme.colors.primary },
  infoTarea: { flex: 1 },
  tituloTarea: { fontFamily: theme.typography.fontFamily.semiBold, color: theme.colors.onSurface, fontSize: theme.typography.bodyLg.fontSize },
  tituloTachado: { textDecorationLine: 'line-through', color: theme.colors.onSurfaceVariant },
  fechaTarea: { fontFamily: theme.typography.fontFamily.medium, color: theme.colors.onSurfaceVariant, fontSize: theme.typography.labelMd.fontSize, marginTop: 4, flexDirection: 'row', alignItems: 'center' },
  categoriaText: { fontFamily: theme.typography.fontFamily.medium, color: staticTheme.colors.primary, fontSize: theme.typography.labelMd.fontSize, marginTop: 4, textTransform: 'uppercase' },
  
  badgePrioridad: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: theme.roundness.sm, borderWidth: 1 },
  textoPrioridad: { fontFamily: theme.typography.fontFamily.semiBold, fontSize: 10, textTransform: 'capitalize' },
  
  overlay: { flex: 1, backgroundColor: 'rgba(15, 23, 42, 0.4)', justifyContent: 'center', padding: theme.spacing.margin },
  modal: { backgroundColor: theme.colors.surface, borderRadius: theme.roundness.xl, padding: theme.spacing.lg, gap: theme.spacing.md },
  modalTitulo: { fontFamily: theme.typography.fontFamily.bold, fontSize: theme.typography.headlineMd.fontSize, color: theme.colors.onSurface, marginBottom: theme.spacing.sm },
  labelInput: { fontFamily: theme.typography.fontFamily.semiBold, color: theme.colors.onSurfaceVariant, fontSize: theme.typography.labelMd.fontSize, marginTop: theme.spacing.sm },
  input: { fontFamily: theme.typography.fontFamily.regular, backgroundColor: theme.colors.surfaceVariant, color: theme.colors.onSurface, borderRadius: theme.roundness.md, padding: theme.spacing.md, fontSize: theme.typography.bodyMd.fontSize },
  filaPrioridad: { flexDirection: 'row', gap: 8 },
  btnPrioridad: { flex: 1, padding: 10, borderRadius: theme.roundness.md, borderWidth: 1, borderColor: theme.colors.outline, alignItems: 'center' },
  textoPrioridadBtn: { fontFamily: theme.typography.fontFamily.semiBold, color: theme.colors.onSurfaceVariant, textTransform: 'capitalize' },
  filaBotones: { flexDirection: 'row', gap: theme.spacing.md, marginTop: theme.spacing.lg },
  btnCancelar: { flex: 1, padding: theme.spacing.md, borderRadius: theme.roundness.full, alignItems: 'center', borderWidth: 1, borderColor: theme.colors.outline },
  textoCancelar: { fontFamily: theme.typography.fontFamily.semiBold, color: theme.colors.onSurfaceVariant },
  btnGuardar: { flex: 1, padding: theme.spacing.md, borderRadius: theme.roundness.full, backgroundColor: staticTheme.colors.primary, alignItems: 'center' },
  textoGuardar: { fontFamily: theme.typography.fontFamily.bold, color: theme.colors.onPrimary },

  overlayEstado: { flex: 1, backgroundColor: 'rgba(15, 23, 42, 0.5)', justifyContent: 'flex-end' },
  modalEstado: { backgroundColor: theme.colors.surface, borderTopLeftRadius: theme.roundness.xl, borderTopRightRadius: theme.roundness.xl, padding: theme.spacing.lg, paddingBottom: 40 },
  modalEstadoHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: theme.spacing.sm },
  modalEstadoTitulo: { fontFamily: theme.typography.fontFamily.bold, fontSize: theme.typography.headlineMd.fontSize, color: theme.colors.onSurface },
  modalEstadoSubtitulo: { fontFamily: theme.typography.fontFamily.medium, fontSize: theme.typography.bodyMd.fontSize, color: theme.colors.onSurfaceVariant, marginBottom: theme.spacing.lg },
  estadoOpciones: { gap: theme.spacing.md },
  estadoOpcion: { flexDirection: 'row', alignItems: 'center', gap: theme.spacing.md, padding: theme.spacing.md, borderRadius: theme.roundness.lg, borderWidth: 1.5, borderColor: theme.colors.surfaceVariant },
  estadoOpcionTexto: { fontFamily: theme.typography.fontFamily.semiBold, fontSize: theme.typography.bodyLg.fontSize, flex: 1 },
  estadoActualBadge: { fontFamily: theme.typography.fontFamily.bold, fontSize: theme.typography.labelMd.fontSize },
});
