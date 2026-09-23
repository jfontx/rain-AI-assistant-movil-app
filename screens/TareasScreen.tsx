import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, TextInput,
  Modal, StyleSheet, Alert, SafeAreaView, RefreshControl, ScrollView
} from 'react-native';
import { theme } from '../theme';
import FloatingMicrophone from '../components/FloatingMicrophone';
import { obtenerEventos, crearEvento, actualizarEvento, eliminarEvento, Evento } from '../services/api';
import { Plus, CheckCircle2, Clock, CheckSquare } from 'lucide-react-native';

const PRIORIDAD_COLOR: Record<string, string> = {
  alta: theme.colors.error,
  media: theme.colors.tertiary,
  baja: theme.colors.primary,
};

const formatearFecha = (iso: string) => {
  const d = new Date(iso);
  return d.toLocaleDateString('es-CO', { weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
};

type TabType = 'pendiente' | 'en_progreso' | 'completado';

export default function TareasScreen() {
  const [tareas, setTareas] = useState<Evento[]>([]);
  const [cargando, setCargando] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
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

  useEffect(() => { cargarTareas(); }, [cargarTareas]);

  const categoriasUnicas = ['Todas', ...Array.from(new Set(tareas.map(t => t.categoria).filter(Boolean)))];

  const tareasFiltradas = tareas.filter(t => {
    const estadoCoincide = (t.estado || 'pendiente') === activeTab;
    const categoriaCoincide = activeCategoria === 'Todas' || t.categoria === activeCategoria;
    return estadoCoincide && categoriaCoincide;
  });

  const toggleCompletado = async (tarea: Evento) => {
    if (!tarea.id) return;
    const nuevoEstado = tarea.estado === 'completado' ? 'pendiente' : 'completado';
    try {
      await actualizarEvento(tarea.id, { ...tarea, estado: nuevoEstado });
      cargarTareas();
    } catch {
      Alert.alert('Error', 'No se pudo actualizar la tarea');
    }
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

  const renderTarea = ({ item }: { item: Evento }) => {
    const vencida = item.estado !== 'completado' && new Date(item.fecha_inicio).getTime() < Date.now();
    return (
      <TouchableOpacity
        style={[est.tarjeta, item.estado === 'completado' && est.tarjetaCompletada]}
        onLongPress={() => item.id && confirmarEliminar(item.id)}
      >
        <TouchableOpacity style={est.checkbox} onPress={() => toggleCompletado(item)}>
          <View style={[est.checkboxInner, item.estado === 'completado' && est.checkboxChecked]}>
            {item.estado === 'completado' && <CheckSquare color="#FFF" size={16} />}
          </View>
        </TouchableOpacity>
        <View style={est.infoTarea}>
          <Text style={[est.tituloTarea, item.estado === 'completado' && est.tituloTachado]}>
            {item.titulo}
          </Text>
          <Text style={[est.fechaTarea, vencida && { color: theme.colors.error }]}>
            <Clock size={12} color={vencida ? theme.colors.error : theme.colors.onSurfaceVariant} style={{ marginRight: 4 }} />
            {formatearFecha(item.fecha_inicio)} {vencida && '(Vencida)'}
          </Text>
          {item.categoria && <Text style={est.categoriaText}>{item.categoria}</Text>}
        </View>
        <View style={[est.badgePrioridad, { backgroundColor: PRIORIDAD_COLOR[item.prioridad || 'media'] + '15', borderColor: PRIORIDAD_COLOR[item.prioridad || 'media'] }]}>
          <Text style={[est.textoPrioridad, { color: PRIORIDAD_COLOR[item.prioridad || 'media'] }]}>
            {item.prioridad}
          </Text>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={est.contenedor}>
      <View style={est.header}>
        <View style={est.headerRow}>
          <Text style={est.headerTitulo}>Tareas</Text>
          <TouchableOpacity style={est.btnNueva} onPress={() => setModalVisible(true)}>
            <Plus color={theme.colors.onPrimary} size={20} />
            <Text style={est.btnNuevaText}>Nueva</Text>
          </TouchableOpacity>
        </View>

        {/* Tabs de Estado */}
        <View style={est.tabsRow}>
          {(['pendiente', 'en_progreso', 'completado'] as TabType[]).map(tab => {
            const count = tareas.filter(t => (t.estado || 'pendiente') === tab).length;
            const labels = { pendiente: 'Pendientes', en_progreso: 'En Progreso', completado: 'Completadas' };
            return (
              <TouchableOpacity 
                key={tab} 
                style={[est.tabBtn, activeTab === tab && est.tabBtnActive]}
                onPress={() => setActiveTab(tab)}
              >
                <Text style={[est.tabText, activeTab === tab && est.tabTextActive]}>
                  {labels[tab]}
                </Text>
                <View style={[est.badgeCount, activeTab === tab && est.badgeCountActive]}>
                  <Text style={[est.badgeText, activeTab === tab && est.badgeTextActive]}>{count}</Text>
                </View>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Filtros Categoria */}
        {categoriasUnicas.length > 1 && (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={est.catsScroll} contentContainerStyle={{ paddingRight: 20 }}>
            {categoriasUnicas.map((cat: any) => (
              <TouchableOpacity
                key={cat}
                style={[est.chip, activeCategoria === cat && est.chipActive]}
                onPress={() => setActiveCategoria(cat)}
              >
                <Text style={[est.chipText, activeCategoria === cat && est.chipTextActive]}>{cat}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        )}
      </View>

      <FlatList
        data={tareasFiltradas}
        keyExtractor={item => String(item.id)}
        refreshControl={<RefreshControl refreshing={cargando} onRefresh={cargarTareas} tintColor={theme.colors.primary} />}
        contentContainerStyle={est.lista}
        ListEmptyComponent={<Text style={est.textoVacio}>No hay tareas en esta sección.</Text>}
        renderItem={renderTarea}
      />

      <FloatingMicrophone />

      <Modal visible={modalVisible} transparent animationType="fade">
        <View style={est.overlay}>
          <View style={est.modal}>
            <Text style={est.modalTitulo}>Nueva Tarea</Text>

            <TextInput
              style={est.input}
              placeholder="Título de la tarea"
              placeholderTextColor={theme.colors.outline}
              value={form.titulo}
              onChangeText={v => setForm(f => ({ ...f, titulo: v }))}
            />

            <TextInput
              style={est.input}
              placeholder="Categoría (ej: Taller, Examen)"
              placeholderTextColor={theme.colors.outline}
              value={form.categoria}
              onChangeText={v => setForm(f => ({ ...f, categoria: v }))}
            />

            <Text style={est.labelInput}>Fecha límite</Text>
            <TextInput
              style={est.input}
              placeholder="YYYY-MM-DDTHH:MM"
              placeholderTextColor={theme.colors.outline}
              value={form.fecha_inicio}
              onChangeText={v => setForm(f => ({ ...f, fecha_inicio: v }))}
            />

            <Text style={est.labelInput}>Prioridad</Text>
            <View style={est.filaPrioridad}>
              {(['baja', 'media', 'alta'] as const).map(p => (
                <TouchableOpacity
                  key={p}
                  style={[est.btnPrioridad, form.prioridad === p && { backgroundColor: PRIORIDAD_COLOR[p] + '20', borderColor: PRIORIDAD_COLOR[p] }]}
                  onPress={() => setForm(f => ({ ...f, prioridad: p }))}
                >
                  <Text style={[est.textoPrioridadBtn, form.prioridad === p && { color: PRIORIDAD_COLOR[p] }]}>{p}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <TextInput
              style={[est.input, { height: 80 }]}
              placeholder="Notas (opcional)"
              placeholderTextColor={theme.colors.outline}
              value={form.notas}
              onChangeText={v => setForm(f => ({ ...f, notas: v }))}
              multiline
            />

            <View style={est.filaBotones}>
              <TouchableOpacity style={est.btnCancelar} onPress={() => setModalVisible(false)}>
                <Text style={est.textoCancelar}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity style={est.btnGuardar} onPress={guardarTarea}>
                <Text style={est.textoGuardar}>Guardar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const est = StyleSheet.create({
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
  btnNueva: { flexDirection: 'row', alignItems: 'center', backgroundColor: theme.colors.primary, paddingHorizontal: 16, paddingVertical: 8, borderRadius: theme.roundness.full },
  btnNuevaText: { fontFamily: theme.typography.fontFamily.semiBold, color: theme.colors.onPrimary, marginLeft: 4, fontSize: theme.typography.labelMd.fontSize },
  
  tabsRow: { flexDirection: 'row', marginBottom: theme.spacing.md, gap: theme.spacing.sm },
  tabBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 8, borderRadius: theme.roundness.full, backgroundColor: theme.colors.surfaceVariant },
  tabBtnActive: { backgroundColor: theme.colors.primaryContainer },
  tabText: { fontFamily: theme.typography.fontFamily.semiBold, color: theme.colors.onSurfaceVariant, fontSize: theme.typography.labelMd.fontSize },
  tabTextActive: { color: theme.colors.onPrimaryContainer },
  badgeCount: { marginLeft: 4, backgroundColor: theme.colors.surface, paddingHorizontal: 6, paddingVertical: 2, borderRadius: theme.roundness.full },
  badgeCountActive: { backgroundColor: theme.colors.onPrimaryContainer },
  badgeText: { fontFamily: theme.typography.fontFamily.bold, fontSize: 10, color: theme.colors.onSurfaceVariant },
  badgeTextActive: { color: theme.colors.primaryContainer },

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
  checkboxChecked: { backgroundColor: theme.colors.primary, borderColor: theme.colors.primary },
  infoTarea: { flex: 1 },
  tituloTarea: { fontFamily: theme.typography.fontFamily.semiBold, color: theme.colors.onSurface, fontSize: theme.typography.bodyLg.fontSize },
  tituloTachado: { textDecorationLine: 'line-through', color: theme.colors.onSurfaceVariant },
  fechaTarea: { fontFamily: theme.typography.fontFamily.medium, color: theme.colors.onSurfaceVariant, fontSize: theme.typography.labelMd.fontSize, marginTop: 4, flexDirection: 'row', alignItems: 'center' },
  categoriaText: { fontFamily: theme.typography.fontFamily.medium, color: theme.colors.primary, fontSize: theme.typography.labelMd.fontSize, marginTop: 4, textTransform: 'uppercase' },
  
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
  btnGuardar: { flex: 1, padding: theme.spacing.md, borderRadius: theme.roundness.full, backgroundColor: theme.colors.primary, alignItems: 'center' },
  textoGuardar: { fontFamily: theme.typography.fontFamily.bold, color: theme.colors.onPrimary },
});
