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
  Keyboard,
  TouchableWithoutFeedback,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useTheme } from '../context/ThemeContext';
import FloatingMicrophone from '../components/FloatingMicrophone';
import {
  obtenerTarjetas,
  crearTarjeta,
  eliminarTarjeta,
  obtenerPrestamos,
  crearPrestamo,
  eliminarPrestamo,
  obtenerGastosFijos,
  crearGastoFijo,
  eliminarGastoFijo,
  TarjetaCredito,
  Prestamo,
  GastoFijo,
} from '../services/api';
import { CreditCard, Landmark, CalendarClock, Plus, Trash2 } from 'lucide-react-native';
import { formatearMontoInput, limpiarMonto } from '../utils/moneda';

const formatearMonto = (monto: number) =>
  `$${monto.toLocaleString('es-CO', { minimumFractionDigits: 0 })}`;

export default function ObligacionesScreen() {
  const { theme } = useTheme();
  const styles = createStyles(theme);
  const [tabSeleccionada, setTabSeleccionada] = useState<'tarjetas' | 'prestamos' | 'fijos'>('tarjetas');
  
  const [tarjetas, setTarjetas] = useState<TarjetaCredito[]>([]);
  const [prestamos, setPrestamos] = useState<Prestamo[]>([]);
  const [fijos, setFijos] = useState<GastoFijo[]>([]);
  const [cargando, setCargando] = useState(false);

  // Modales
  const [modalTarjeta, setModalTarjeta] = useState(false);
  const [modalPrestamo, setModalPrestamo] = useState(false);
  const [modalFijo, setModalFijo] = useState(false);

  // Formularios
  const [formTarjeta, setFormTarjeta] = useState({ nombre: '', cupo_total: '', fecha_corte: '', fecha_pago: '' });
  const [formPrestamo, setFormPrestamo] = useState({ nombre: '', monto_total: '', cuota_mensual: '', tasa_interes_mensual: '', fecha_pago_mensual: '' });
  const [formFijo, setFormFijo] = useState({ nombre: '', monto: '', dia_pago: '', categoria: 'servicios' });

  const cargarDatos = useCallback(async () => {
    if (tarjetas.length === 0 && prestamos.length === 0 && fijos.length === 0) setCargando(true);
    try {
      const [datosT, datosP, datosF] = await Promise.all([
        obtenerTarjetas(),
        obtenerPrestamos(),
        obtenerGastosFijos(),
      ]);
      setTarjetas(datosT);
      setPrestamos(datosP);
      setFijos(datosF);
    } catch {
      Alert.alert('Error', 'No se pudieron cargar las obligaciones.');
    } finally {
      setCargando(false);
    }
  }, []);

  useEffect(() => { cargarDatos(); }, [cargarDatos]);

  // Guardar Tarjeta
  const guardarTarjeta = async () => {
    if (!formTarjeta.nombre || !formTarjeta.cupo_total) return Alert.alert('Error', 'Llena los campos obligatorios');
    try {
      await crearTarjeta({
        nombre: formTarjeta.nombre,
        cupo_total: parseFloat(limpiarMonto(formTarjeta.cupo_total)),
        cupo_utilizado: 0,
        fecha_corte: parseInt(formTarjeta.fecha_corte) || 15,
        fecha_pago: parseInt(formTarjeta.fecha_pago) || 30,
      });
      setModalTarjeta(false);
      setFormTarjeta({ nombre: '', cupo_total: '', fecha_corte: '', fecha_pago: '' });
      cargarDatos();
    } catch (e) {
      Alert.alert('Error', 'No se pudo guardar');
    }
  };

  // Guardar Préstamo
  const guardarPrestamo = async () => {
    if (!formPrestamo.nombre || !formPrestamo.monto_total) return Alert.alert('Error', 'Llena los campos obligatorios');
    try {
      await crearPrestamo({
        nombre: formPrestamo.nombre,
        monto_total: parseFloat(limpiarMonto(formPrestamo.monto_total)),
        saldo_pendiente: parseFloat(limpiarMonto(formPrestamo.monto_total)),
        cuota_mensual: parseFloat(limpiarMonto(formPrestamo.cuota_mensual)) || 0,
        tasa_interes_mensual: parseFloat(formPrestamo.tasa_interes_mensual) || 0,
        fecha_pago_mensual: parseInt(formPrestamo.fecha_pago_mensual) || 1,
      });
      setModalPrestamo(false);
      setFormPrestamo({ nombre: '', monto_total: '', cuota_mensual: '', tasa_interes_mensual: '', fecha_pago_mensual: '' });
      cargarDatos();
    } catch (e) {
      Alert.alert('Error', 'No se pudo guardar');
    }
  };

  // Guardar Gasto Fijo
  const guardarGastoFijo = async () => {
    if (!formFijo.nombre || !formFijo.monto) return Alert.alert('Error', 'Llena los campos obligatorios');
    try {
      await crearGastoFijo({
        nombre: formFijo.nombre,
        monto: parseFloat(limpiarMonto(formFijo.monto)),
        dia_pago: parseInt(formFijo.dia_pago) || 1,
        categoria: formFijo.categoria,
        activo: true,
      });
      setModalFijo(false);
      setFormFijo({ nombre: '', monto: '', dia_pago: '', categoria: 'servicios' });
      cargarDatos();
    } catch (e) {
      Alert.alert('Error', 'No se pudo guardar');
    }
  };

  const confirmarEliminar = (tipo: 'tarjeta' | 'prestamo' | 'fijo', id: number) => {
    Alert.alert('Eliminar', '¿Eliminar este registro?', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Eliminar', style: 'destructive', onPress: async () => {
        if (tipo === 'tarjeta') await eliminarTarjeta(id);
        if (tipo === 'prestamo') await eliminarPrestamo(id);
        if (tipo === 'fijo') await eliminarGastoFijo(id);
        cargarDatos();
      }},
    ]);
  };

  const renderFiltros = () => (
    <View style={styles.filtrosContainer}>
      <TouchableOpacity 
        style={[styles.filtroBtn, tabSeleccionada === 'tarjetas' && styles.filtroActivo]}
        onPress={() => setTabSeleccionada('tarjetas')}>
        <CreditCard size={18} color={tabSeleccionada === 'tarjetas' ? theme.colors.onPrimary : theme.colors.onSurfaceVariant} />
        <Text style={[styles.filtroTexto, tabSeleccionada === 'tarjetas' && styles.filtroTextoActivo]}>Tarjetas</Text>
      </TouchableOpacity>
      
      <TouchableOpacity 
        style={[styles.filtroBtn, tabSeleccionada === 'prestamos' && styles.filtroActivo]}
        onPress={() => setTabSeleccionada('prestamos')}>
        <Landmark size={18} color={tabSeleccionada === 'prestamos' ? theme.colors.onPrimary : theme.colors.onSurfaceVariant} />
        <Text style={[styles.filtroTexto, tabSeleccionada === 'prestamos' && styles.filtroTextoActivo]}>Préstamos</Text>
      </TouchableOpacity>

      <TouchableOpacity 
        style={[styles.filtroBtn, tabSeleccionada === 'fijos' && styles.filtroActivo]}
        onPress={() => setTabSeleccionada('fijos')}>
        <CalendarClock size={18} color={tabSeleccionada === 'fijos' ? theme.colors.onPrimary : theme.colors.onSurfaceVariant} />
        <Text style={[styles.filtroTexto, tabSeleccionada === 'fijos' && styles.filtroTextoActivo]}>Fijos</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <SafeAreaView style={styles.contenedor}>
      <View style={styles.headerContainer}>
        <Text style={styles.titulo}>Cuentas y Obligaciones</Text>
        <Text style={styles.subtitulo}>Administra tus tarjetas, préstamos y pagos recurrentes.</Text>
      </View>

      {renderFiltros()}

      <ScrollView 
        contentContainerStyle={styles.lista}
        refreshControl={<RefreshControl refreshing={cargando} onRefresh={cargarDatos} />}
      >
        {tabSeleccionada === 'tarjetas' && (
          <View>
            <TouchableOpacity style={styles.btnAgregar} onPress={() => setModalTarjeta(true)}>
              <Plus size={20} color={theme.colors.primary} />
              <Text style={styles.textoAgregar}>Nueva Tarjeta de Crédito</Text>
            </TouchableOpacity>
            {tarjetas.length === 0 ? <Text style={styles.vacio}>No hay tarjetas registradas.</Text> : tarjetas.map(t => (
              <View key={t.id} style={styles.card}>
                <View style={styles.cardRow}>
                  <Text style={styles.cardTitulo}>{t.nombre}</Text>
                  <TouchableOpacity onPress={() => t.id && confirmarEliminar('tarjeta', t.id)}>
                    <Trash2 size={20} color={theme.colors.error} />
                  </TouchableOpacity>
                </View>
                <Text style={styles.cardDato}>Cupo Usado: {formatearMonto(t.cupo_utilizado)} de {formatearMonto(t.cupo_total)}</Text>
                <Text style={styles.cardDato}>Fechas: Corta los {t.fecha_corte}, Paga los {t.fecha_pago}</Text>
                <View style={styles.progressBarContainer}>
                  <View style={[styles.progressBarFill, { width: `${(t.cupo_utilizado/t.cupo_total)*100}%` }]} />
                </View>
              </View>
            ))}
          </View>
        )}

        {tabSeleccionada === 'prestamos' && (
          <View>
            <TouchableOpacity style={styles.btnAgregar} onPress={() => setModalPrestamo(true)}>
              <Plus size={20} color={theme.colors.primary} />
              <Text style={styles.textoAgregar}>Nuevo Préstamo</Text>
            </TouchableOpacity>
            {prestamos.length === 0 ? <Text style={styles.vacio}>No hay préstamos registrados.</Text> : prestamos.map(p => (
              <View key={p.id} style={styles.card}>
                <View style={styles.cardRow}>
                  <Text style={styles.cardTitulo}>{p.nombre}</Text>
                  <TouchableOpacity onPress={() => p.id && confirmarEliminar('prestamo', p.id)}>
                    <Trash2 size={20} color={theme.colors.error} />
                  </TouchableOpacity>
                </View>
                <Text style={styles.cardMontoEnorme}>{formatearMonto(p.saldo_pendiente)}</Text>
                <Text style={styles.cardDato}>Cuota mensual: {formatearMonto(p.cuota_mensual)} (Día {p.fecha_pago_mensual})</Text>
                <Text style={styles.cardDato}>Interés: {p.tasa_interes_mensual}% mensual</Text>
              </View>
            ))}
          </View>
        )}

        {tabSeleccionada === 'fijos' && (
          <View>
            <TouchableOpacity style={styles.btnAgregar} onPress={() => setModalFijo(true)}>
              <Plus size={20} color={theme.colors.primary} />
              <Text style={styles.textoAgregar}>Nuevo Gasto Fijo</Text>
            </TouchableOpacity>
            {fijos.length === 0 ? <Text style={styles.vacio}>No hay gastos fijos registrados.</Text> : fijos.map(f => (
              <View key={f.id} style={styles.card}>
                <View style={styles.cardRow}>
                  <Text style={styles.cardTitulo}>{f.nombre}</Text>
                  <TouchableOpacity onPress={() => f.id && confirmarEliminar('fijo', f.id)}>
                    <Trash2 size={20} color={theme.colors.error} />
                  </TouchableOpacity>
                </View>
                <Text style={styles.cardDato}>Monto: {formatearMonto(f.monto)}</Text>
                <Text style={styles.cardDato}>Día de pago: {f.dia_pago}</Text>
              </View>
            ))}
          </View>
        )}
      </ScrollView>

      <FloatingMicrophone />

      {/* Modal Tarjeta */}
      <Modal visible={modalTarjeta} transparent animationType="fade">
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.modalOverlay}>
            <View style={styles.modal}>
              <Text style={styles.modalTitulo}>Nueva Tarjeta</Text>
              <TextInput style={styles.input} placeholder="Banco o Nombre" placeholderTextColor={theme.colors.outline} onChangeText={t => setFormTarjeta({...formTarjeta, nombre: t})} />
              <TextInput style={styles.input} placeholder="Cupo Total (COP)" keyboardType="numeric" placeholderTextColor={theme.colors.outline} value={formTarjeta.cupo_total} onChangeText={t => setFormTarjeta({...formTarjeta, cupo_total: formatearMontoInput(t)})} />
              <TextInput style={styles.input} placeholder="Día de corte (ej: 15)" keyboardType="numeric" placeholderTextColor={theme.colors.outline} onChangeText={t => setFormTarjeta({...formTarjeta, fecha_corte: t})} />
              <TextInput style={styles.input} placeholder="Día de pago (ej: 30)" keyboardType="numeric" placeholderTextColor={theme.colors.outline} onChangeText={t => setFormTarjeta({...formTarjeta, fecha_pago: t})} />
              <View style={styles.filaBotones}>
                <TouchableOpacity style={styles.btnCancelar} onPress={() => setModalTarjeta(false)}><Text style={styles.textoCancelar}>Cancelar</Text></TouchableOpacity>
                <TouchableOpacity style={styles.btnGuardar} onPress={guardarTarjeta}><Text style={styles.textoGuardar}>Guardar</Text></TouchableOpacity>
              </View>
            </View>
          </KeyboardAvoidingView>
        </TouchableWithoutFeedback>
      </Modal>

      {/* Modal Préstamo */}
      <Modal visible={modalPrestamo} transparent animationType="fade">
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.modalOverlay}>
            <View style={styles.modal}>
              <Text style={styles.modalTitulo}>Nuevo Préstamo</Text>
              <TextInput style={styles.input} placeholder="Entidad o Nombre" placeholderTextColor={theme.colors.outline} onChangeText={t => setFormPrestamo({...formPrestamo, nombre: t})} />
              <TextInput style={styles.input} placeholder="Monto total (COP)" keyboardType="numeric" placeholderTextColor={theme.colors.outline} value={formPrestamo.monto_total} onChangeText={t => setFormPrestamo({...formPrestamo, monto_total: formatearMontoInput(t)})} />
              <TextInput style={styles.input} placeholder="Cuota mensual (COP)" keyboardType="numeric" placeholderTextColor={theme.colors.outline} value={formPrestamo.cuota_mensual} onChangeText={t => setFormPrestamo({...formPrestamo, cuota_mensual: formatearMontoInput(t)})} />
              <TextInput style={styles.input} placeholder="Tasa interés mensual % (ej: 1.5)" keyboardType="numeric" placeholderTextColor={theme.colors.outline} onChangeText={t => setFormPrestamo({...formPrestamo, tasa_interes_mensual: t})} />
              <TextInput style={styles.input} placeholder="Día de pago (ej: 5)" keyboardType="numeric" placeholderTextColor={theme.colors.outline} onChangeText={t => setFormPrestamo({...formPrestamo, fecha_pago_mensual: t})} />
              <View style={styles.filaBotones}>
                <TouchableOpacity style={styles.btnCancelar} onPress={() => setModalPrestamo(false)}><Text style={styles.textoCancelar}>Cancelar</Text></TouchableOpacity>
                <TouchableOpacity style={styles.btnGuardar} onPress={guardarPrestamo}><Text style={styles.textoGuardar}>Guardar</Text></TouchableOpacity>
              </View>
            </View>
          </KeyboardAvoidingView>
        </TouchableWithoutFeedback>
      </Modal>

      {/* Modal Gasto Fijo */}
      <Modal visible={modalFijo} transparent animationType="fade">
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.modalOverlay}>
            <View style={styles.modal}>
              <Text style={styles.modalTitulo}>Nuevo Gasto Fijo</Text>
              <TextInput style={styles.input} placeholder="Nombre (ej: Netflix)" placeholderTextColor={theme.colors.outline} onChangeText={t => setFormFijo({...formFijo, nombre: t})} />
              <TextInput style={styles.input} placeholder="Monto mensual (COP)" keyboardType="numeric" placeholderTextColor={theme.colors.outline} value={formFijo.monto} onChangeText={t => setFormFijo({...formFijo, monto: formatearMontoInput(t)})} />
              <TextInput style={styles.input} placeholder="Día de pago (ej: 28)" keyboardType="numeric" placeholderTextColor={theme.colors.outline} onChangeText={t => setFormFijo({...formFijo, dia_pago: t})} />
              <View style={styles.filaBotones}>
                <TouchableOpacity style={styles.btnCancelar} onPress={() => setModalFijo(false)}><Text style={styles.textoCancelar}>Cancelar</Text></TouchableOpacity>
                <TouchableOpacity style={styles.btnGuardar} onPress={guardarGastoFijo}><Text style={styles.textoGuardar}>Guardar</Text></TouchableOpacity>
              </View>
            </View>
          </KeyboardAvoidingView>
        </TouchableWithoutFeedback>
      </Modal>

    </SafeAreaView>
  );
}

const createStyles = (theme: any) => StyleSheet.create({
  contenedor: { flex: 1, backgroundColor: theme.colors.background },
  headerContainer: { padding: theme.spacing.margin, paddingBottom: theme.spacing.md },
  titulo: { fontFamily: theme.typography.fontFamily.bold, fontSize: theme.typography.display.fontSize, color: theme.colors.onSurface },
  subtitulo: { fontFamily: theme.typography.fontFamily.regular, fontSize: theme.typography.bodyMd.fontSize, color: theme.colors.onSurfaceVariant, marginTop: 4 },
  
  filtrosContainer: { flexDirection: 'row', paddingHorizontal: theme.spacing.margin, marginBottom: theme.spacing.md, gap: theme.spacing.sm },
  filtroBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 10, borderRadius: theme.roundness.full, backgroundColor: theme.colors.surfaceVariant },
  filtroActivo: { backgroundColor: theme.colors.primary },
  filtroTexto: { fontFamily: theme.typography.fontFamily.semiBold, color: theme.colors.onSurfaceVariant, fontSize: 14 },
  filtroTextoActivo: { color: theme.colors.onPrimary },

  lista: { paddingHorizontal: theme.spacing.margin, paddingBottom: 100 },
  btnAgregar: { flexDirection: 'row', alignItems: 'center', gap: 8, alignSelf: 'flex-start', marginBottom: theme.spacing.md, paddingVertical: 8, paddingHorizontal: 12, backgroundColor: theme.colors.surface, borderRadius: theme.roundness.full, borderWidth: 1, borderColor: theme.colors.primaryContainer },
  textoAgregar: { fontFamily: theme.typography.fontFamily.semiBold, color: theme.colors.primary, fontSize: 14 },
  vacio: { fontFamily: theme.typography.fontFamily.medium, color: theme.colors.outline, textAlign: 'center', marginTop: 40 },

  card: { backgroundColor: theme.colors.surface, padding: theme.spacing.md, borderRadius: theme.roundness.lg, marginBottom: theme.spacing.md, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 3, elevation: 1 },
  cardRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: theme.spacing.xs },
  cardTitulo: { fontFamily: theme.typography.fontFamily.bold, fontSize: 18, color: theme.colors.onSurface },
  cardDato: { fontFamily: theme.typography.fontFamily.medium, fontSize: 14, color: theme.colors.onSurfaceVariant, marginBottom: 4 },
  cardMontoEnorme: { fontFamily: theme.typography.fontFamily.bold, fontSize: 24, color: theme.colors.onSurface, marginVertical: 8 },
  
  progressBarContainer: { height: 6, backgroundColor: theme.colors.surfaceVariant, borderRadius: 3, marginTop: 8, overflow: 'hidden' },
  progressBarFill: { height: '100%', backgroundColor: theme.colors.primary },

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
