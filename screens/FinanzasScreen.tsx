import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  TextInput,
  Modal,
  StyleSheet,
  Alert,
  SafeAreaView,
  ScrollView,
  RefreshControl,
} from 'react-native';
import { useTheme } from '../context/ThemeContext';
import { theme as staticTheme } from '../theme';
import FloatingMicrophone from '../components/FloatingMicrophone';
import { 
  obtenerTransacciones, 
  crearTransaccion, 
  eliminarTransaccion, 
  obtenerMetas,
  crearMeta,
  Transaccion,
  MetaAhorro
} from '../services/api';
import { Wallet, ArrowDownCircle, ArrowUpCircle, Target, Plus } from 'lucide-react-native';

const CATEGORIAS = ['alimentación', 'transporte', 'servicios', 'educación', 'ocio', 'salud', 'vivienda', 'ropa', 'tecnología', 'otro'];

const formatearMonto = (monto: number) =>
  `$${monto.toLocaleString('es-CO', { minimumFractionDigits: 0 })}`;

const colorCategoria = (cat: string) => {
  const colores: Record<string, string> = {
    alimentación: '#F87171', transporte: '#34D399', servicios: '#60A5FA',
    educación: '#A78BFA', ocio: '#FBBF24', salud: '#F472B6',
    vivienda: '#38BDF8', ropa: '#FB923C', tecnología: '#4ADE80', otro: staticTheme.colors.outline,
  };
  return colores[cat] || staticTheme.colors.outline;
};

export default function FinanzasScreen() {
  const { theme } = useTheme();
  const styles = createStyles(theme);
  const [transacciones, setTransacciones] = useState<Transaccion[]>([]);
  const [metas, setMetas] = useState<MetaAhorro[]>([]);
  const [cargando, setCargando] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [form, setForm] = useState({
    tipo: 'gasto' as 'gasto' | 'ingreso',
    monto: '',
    categoria: CATEGORIAS[0],
    descripcion: '',
    comercio: '',
  });
  const [modalMetaVisible, setModalMetaVisible] = useState(false);
  const [formMeta, setFormMeta] = useState({ nombre: '', monto_objetivo: '' });

  const cargarDatos = useCallback(async () => {
    setCargando(true);
    try {
      const [datosTxs, datosMetas] = await Promise.all([
        obtenerTransacciones(),
        obtenerMetas()
      ]);
      setTransacciones(datosTxs);
      setMetas(datosMetas);
    } catch {
      Alert.alert('Error', 'No se pudo conectar al backend.');
    } finally {
      setCargando(false);
    }
  }, []);

  useEffect(() => { cargarDatos(); }, [cargarDatos]);

  const mesActual = new Date().getMonth();
  const txsMes = transacciones.filter(t => new Date(t.fecha || new Date()).getMonth() === mesActual);

  const ingresosMes = txsMes.filter(t => t.tipo === 'ingreso').reduce((s, t) => s + t.monto, 0);
  const gastosMes = txsMes.filter(t => t.tipo === 'gasto').reduce((s, t) => s + t.monto, 0);
  const balance = ingresosMes - gastosMes;
  const porcentajeGasto = ingresosMes > 0 ? Math.min((gastosMes / ingresosMes) * 100, 100) : 0;

  const guardarTransaccion = async () => {
    if (!form.monto || !form.descripcion) {
      Alert.alert('Error', 'Por favor llena el monto y descripción');
      return;
    }
    try {
      await crearTransaccion({
        tipo: form.tipo as 'ingreso' | 'gasto',
        monto: parseFloat(form.monto),
        descripcion: form.descripcion,
        categoria: form.categoria,
        comercio: form.comercio || undefined,
        origen: 'manual'
      });
      setModalVisible(false);
      setForm({ tipo: 'gasto', monto: '', descripcion: '', categoria: CATEGORIAS[0], comercio: '' });
      cargarDatos();
    } catch (e) {
      console.error(e);
      Alert.alert('Error', 'No se pudo guardar la transacción');
    }
  };

  const guardarNuevaMeta = async () => {
    if (!formMeta.nombre || !formMeta.monto_objetivo) {
      Alert.alert('Error', 'Por favor llena el nombre y el monto objetivo');
      return;
    }
    try {
      await crearMeta({
        nombre: formMeta.nombre,
        monto_objetivo: parseFloat(formMeta.monto_objetivo),
      });
      setModalMetaVisible(false);
      setFormMeta({ nombre: '', monto_objetivo: '' });
      cargarDatos();
    } catch (e) {
      console.error(e);
      Alert.alert('Error', 'No se pudo guardar la meta');
    }
  };

  const confirmarEliminar = (id: number) => {
    Alert.alert('Eliminar', '¿Eliminar esta transacción?', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Eliminar', style: 'destructive', onPress: async () => {
        await eliminarTransaccion(id);
        cargarDatos();
      }},
    ]);
  };

  const abrirModal = (tipo: 'gasto' | 'ingreso') => {
    setForm(f => ({ ...f, tipo }));
    setModalVisible(true);
  };

  const renderHeader = () => (
    <View style={styles.headerContainer}>
      <View style={styles.messageBubble}>
        <Text style={styles.messageText}>
          Tus gastos de este mes están {porcentajeGasto > 80 ? 'un poco altos' : 'bajo control'}. 
          Te quedan {formatearMonto(balance)} disponibles.
        </Text>
      </View>

      <View style={styles.balanceCard}>
        <Text style={styles.balanceLabel}>Saldo Disponible</Text>
        <Text style={styles.balanceMonto}>{formatearMonto(balance)}</Text>
        
        <View style={styles.progressBarContainer}>
          <View style={[styles.progressBarFill, { width: `${porcentajeGasto}%`, backgroundColor: porcentajeGasto > 80 ? theme.colors.error : theme.colors.primary }]} />
        </View>
        <Text style={styles.progressText}>
          Gastado {formatearMonto(gastosMes)} de {formatearMonto(ingresosMes)}
        </Text>
      </View>

      <View style={styles.actionButtonsRow}>
        <TouchableOpacity style={styles.actionBtn} onPress={() => abrirModal('gasto')}>
          <ArrowDownCircle size={20} color={theme.colors.error} />
          <Text style={styles.actionBtnText}>Registrar Gasto</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionBtn} onPress={() => abrirModal('ingreso')}>
          <ArrowUpCircle size={20} color={theme.colors.primary} />
          <Text style={styles.actionBtnText}>Ingreso</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.metasContainer}>
        <View style={styles.sectionHeader}>
          <Target size={20} color={theme.colors.onSurface} />
          <Text style={styles.sectionTitle}>Metas de Ahorro</Text>
          <TouchableOpacity onPress={() => setModalMetaVisible(true)} style={{ marginLeft: 'auto' }}>
            <Plus size={24} color={theme.colors.primary} />
          </TouchableOpacity>
        </View>
        {metas.length === 0 ? (
          <Text style={styles.emptyStateText}>
            No tienes metas de ahorro activas. Pídele a Raín que cree una para empezar a ahorrar.
          </Text>
        ) : (
          metas.map(meta => {
            const pct = Math.min((meta.monto_actual / meta.monto_objetivo) * 100, 100);
            return (
              <View key={meta.id} style={styles.metaCard}>
                <View style={styles.metaRow}>
                  <Text style={styles.metaName}>{meta.nombre}</Text>
                  <Text style={styles.metaAmount}>{formatearMonto(meta.monto_actual)} / {formatearMonto(meta.monto_objetivo)}</Text>
                </View>
                <View style={styles.progressBarContainer}>
                  <View style={[styles.progressBarFill, { width: `${pct}%`, backgroundColor: theme.colors.secondary }]} />
                </View>
              </View>
            );
          })
        )}
      </View>

      <Text style={[styles.sectionTitle, { marginTop: theme.spacing.lg }]}>Transacciones Recientes</Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.contenedor}>
      <FlatList
        data={transacciones}
        keyExtractor={item => String(item.id)}
        refreshControl={<RefreshControl refreshing={cargando} onRefresh={cargarDatos} tintColor={theme.colors.primary} />}
        contentContainerStyle={styles.lista}
        ListHeaderComponent={renderHeader}
        ListEmptyComponent={
          <Text style={styles.textoVacio}>No tienes transacciones.</Text>
        }
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.tarjetaTransaccion}
            onLongPress={() => item.id && confirmarEliminar(item.id)}
          >
            <View style={[styles.indicadorCategoria, { backgroundColor: colorCategoria(item.categoria) }]} />
            <View style={styles.infoTransaccion}>
              <Text style={styles.descripcionTransaccion}>{item.descripcion}</Text>
              <Text style={styles.categoriaTransaccion}>{item.comercio ? `${item.comercio} • ` : ''}{item.categoria}</Text>
            </View>
            <Text style={[styles.montoTransaccion, item.tipo === 'ingreso' ? styles.positivo : styles.negativo]}>
              {item.tipo === 'ingreso' ? '+' : '-'}{formatearMonto(item.monto)}
            </Text>
          </TouchableOpacity>
        )}
      />

      <FloatingMicrophone />

      {/* Modal crear transacción */}
      <Modal visible={modalVisible} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modal}>
            <Text style={styles.modalTitulo}>
              Registrar {form.tipo === 'gasto' ? 'Gasto' : 'Ingreso'}
            </Text>

            <TextInput
              style={styles.inputModal}
              placeholder="Monto (COP)"
              placeholderTextColor={theme.colors.outline}
              keyboardType="numeric"
              value={form.monto}
              onChangeText={v => setForm(f => ({ ...f, monto: v }))}
            />
            <TextInput
              style={styles.inputModal}
              placeholder="Descripción"
              placeholderTextColor={theme.colors.outline}
              value={form.descripcion}
              onChangeText={v => setForm(f => ({ ...f, descripcion: v }))}
            />
            <TextInput
              style={styles.inputModal}
              placeholder="Comercio (opcional)"
              placeholderTextColor={theme.colors.outline}
              value={form.comercio}
              onChangeText={v => setForm(f => ({ ...f, comercio: v }))}
            />

            <Text style={styles.labelCats}>Categoría</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.selectorCats}>
              {CATEGORIAS.map(cat => (
                <TouchableOpacity
                  key={cat}
                  style={[styles.chipCategoria, form.categoria === cat && { backgroundColor: theme.colors.primary, borderColor: theme.colors.primary }]}
                  onPress={() => setForm(f => ({ ...f, categoria: cat }))}
                >
                  <Text style={[styles.textoChip, form.categoria === cat && { color: theme.colors.onPrimary }]}>{cat}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            <View style={styles.filaBotones}>
              <TouchableOpacity style={styles.btnCancelar} onPress={() => setModalVisible(false)}>
                <Text style={styles.textoCancelar}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.btnGuardar} onPress={guardarTransaccion}>
                <Text style={styles.textoGuardar}>Guardar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Modal crear meta */}
      <Modal visible={modalMetaVisible} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modal}>
            <Text style={styles.modalTitulo}>Nueva Meta de Ahorro</Text>

            <TextInput
              style={styles.inputModal}
              placeholder="Nombre (ej: Viaje, Computador)"
              placeholderTextColor={theme.colors.outline}
              value={formMeta.nombre}
              onChangeText={v => setFormMeta(f => ({ ...f, nombre: v }))}
            />
            <TextInput
              style={styles.inputModal}
              placeholder="Monto Objetivo (COP)"
              placeholderTextColor={theme.colors.outline}
              keyboardType="numeric"
              value={formMeta.monto_objetivo}
              onChangeText={v => setFormMeta(f => ({ ...f, monto_objetivo: v }))}
            />

            <View style={styles.filaBotones}>
              <TouchableOpacity style={styles.btnCancelar} onPress={() => setModalMetaVisible(false)}>
                <Text style={styles.textoCancelar}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.btnGuardar} onPress={guardarNuevaMeta}>
                <Text style={styles.textoGuardar}>Guardar Meta</Text>
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
  lista: { padding: theme.spacing.margin, paddingBottom: 100 },
  headerContainer: { marginBottom: theme.spacing.lg },
  
  messageBubble: {
    backgroundColor: theme.colors.surfaceVariant,
    padding: theme.spacing.md,
    borderRadius: theme.roundness.lg,
    borderBottomLeftRadius: 4,
    marginBottom: theme.spacing.lg,
  },
  messageText: {
    fontFamily: theme.typography.fontFamily.medium,
    fontSize: theme.typography.bodyMd.fontSize,
    color: theme.colors.onSurface,
  },
  
  balanceCard: {
    backgroundColor: theme.colors.surface,
    padding: theme.spacing.lg,
    borderRadius: theme.roundness.xl,
    marginBottom: theme.spacing.md,
    shadowColor: theme.shadows.level1.shadowColor,
    shadowOffset: theme.shadows.level1.shadowOffset,
    shadowOpacity: theme.shadows.level1.shadowOpacity,
    shadowRadius: theme.shadows.level1.shadowRadius,
    elevation: theme.shadows.level1.elevation,
  },
  balanceLabel: {
    fontFamily: theme.typography.fontFamily.semiBold,
    fontSize: theme.typography.labelLg.fontSize,
    color: theme.colors.onSurfaceVariant,
  },
  balanceMonto: {
    fontFamily: theme.typography.fontFamily.bold,
    fontSize: theme.typography.display.fontSize,
    color: theme.colors.onSurface,
    marginVertical: theme.spacing.xs,
  },
  progressBarContainer: {
    height: 8,
    backgroundColor: theme.colors.surfaceVariant,
    borderRadius: theme.roundness.full,
    overflow: 'hidden',
    marginTop: theme.spacing.sm,
  },
  progressBarFill: {
    height: '100%',
    borderRadius: theme.roundness.full,
  },
  progressText: {
    fontFamily: theme.typography.fontFamily.medium,
    fontSize: theme.typography.labelMd.fontSize,
    color: theme.colors.onSurfaceVariant,
    marginTop: theme.spacing.xs,
  },
  
  actionButtonsRow: {
    flexDirection: 'row',
    gap: theme.spacing.md,
    marginBottom: theme.spacing.lg,
  },
  actionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.surface,
    padding: theme.spacing.md,
    borderRadius: theme.roundness.full,
    borderWidth: 1,
    borderColor: theme.colors.surfaceVariant,
  },
  actionBtnText: {
    fontFamily: theme.typography.fontFamily.semiBold,
    fontSize: theme.typography.labelLg.fontSize,
    color: theme.colors.onSurface,
    marginLeft: theme.spacing.xs,
  },
  
  metasContainer: {
    marginBottom: theme.spacing.md,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.sm,
  },
  sectionTitle: {
    fontFamily: theme.typography.fontFamily.semiBold,
    fontSize: theme.typography.headlineSm.fontSize,
    color: theme.colors.onSurface,
    marginLeft: theme.spacing.xs,
  },
  metaCard: {
    backgroundColor: theme.colors.surface,
    padding: theme.spacing.md,
    borderRadius: theme.roundness.lg,
    marginBottom: theme.spacing.sm,
    borderWidth: 1,
    borderColor: theme.colors.surfaceVariant,
  },
  emptyStateText: {
    ...theme.typography.bodyMd,
    color: theme.colors.onSurfaceVariant,
    textAlign: 'center',
    marginTop: theme.spacing.md,
    fontStyle: 'italic',
  },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    marginBottom: theme.spacing.xs,
  },
  metaName: {
    fontFamily: theme.typography.fontFamily.medium,
    fontSize: theme.typography.bodyMd.fontSize,
    color: theme.colors.onSurface,
  },
  metaAmount: {
    fontFamily: theme.typography.fontFamily.semiBold,
    fontSize: theme.typography.labelMd.fontSize,
    color: theme.colors.onSurfaceVariant,
  },

  tarjetaTransaccion: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.surface,
    borderRadius: theme.roundness.lg,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.sm,
  },
  indicadorCategoria: {
    width: 40,
    height: 40,
    borderRadius: theme.roundness.full,
    marginRight: theme.spacing.md,
    opacity: 0.2, // Fondo suave para el icono/color
    position: 'absolute',
    left: theme.spacing.md,
  },
  infoTransaccion: { flex: 1, paddingLeft: 50 },
  descripcionTransaccion: {
    fontFamily: theme.typography.fontFamily.semiBold,
    fontSize: theme.typography.bodyMd.fontSize,
    color: theme.colors.onSurface,
  },
  categoriaTransaccion: {
    fontFamily: theme.typography.fontFamily.regular,
    fontSize: theme.typography.labelMd.fontSize,
    color: theme.colors.onSurfaceVariant,
    marginTop: 2,
    textTransform: 'capitalize',
  },
  montoTransaccion: {
    fontFamily: theme.typography.fontFamily.bold,
    fontSize: theme.typography.bodyLg.fontSize,
  },
  positivo: { color: theme.colors.primary },
  negativo: { color: theme.colors.onSurface }, // Gastos en oscuro normal
  textoVacio: {
    fontFamily: theme.typography.fontFamily.regular,
    textAlign: 'center',
    color: theme.colors.outline,
    marginTop: 40,
  },

  modalOverlay: { flex: 1, backgroundColor: 'rgba(15, 23, 42, 0.4)', justifyContent: 'center', padding: theme.spacing.margin },
  modal: { backgroundColor: theme.colors.surface, borderRadius: theme.roundness.xl, padding: theme.spacing.lg, gap: theme.spacing.md },
  modalTitulo: { fontFamily: theme.typography.fontFamily.bold, fontSize: theme.typography.headlineMd.fontSize, color: theme.colors.onSurface, marginBottom: theme.spacing.sm },
  inputModal: { fontFamily: theme.typography.fontFamily.regular, backgroundColor: theme.colors.surfaceVariant, color: theme.colors.onSurface, borderRadius: theme.roundness.md, padding: theme.spacing.md, fontSize: theme.typography.bodyMd.fontSize },
  labelCats: { fontFamily: theme.typography.fontFamily.semiBold, fontSize: theme.typography.labelMd.fontSize, color: theme.colors.onSurfaceVariant, marginTop: theme.spacing.sm },
  selectorCats: { flexDirection: 'row', paddingBottom: theme.spacing.xs },
  chipCategoria: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: theme.roundness.full, borderWidth: 1, borderColor: theme.colors.outline, marginRight: 8 },
  textoChip: { fontFamily: theme.typography.fontFamily.medium, color: theme.colors.onSurfaceVariant, fontSize: theme.typography.labelMd.fontSize, textTransform: 'capitalize' },
  filaBotones: { flexDirection: 'row', gap: theme.spacing.md, marginTop: theme.spacing.lg },
  btnCancelar: { flex: 1, padding: theme.spacing.md, borderRadius: theme.roundness.full, alignItems: 'center' },
  textoCancelar: { fontFamily: theme.typography.fontFamily.semiBold, color: theme.colors.onSurfaceVariant },
  btnGuardar: { flex: 1, padding: theme.spacing.md, borderRadius: theme.roundness.full, backgroundColor: theme.colors.primary, alignItems: 'center' },
  textoGuardar: { fontFamily: theme.typography.fontFamily.bold, color: theme.colors.onPrimary },
});
