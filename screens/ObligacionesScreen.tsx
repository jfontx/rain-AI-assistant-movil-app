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
import { theme } from '../theme';
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

const formatearMonto = (monto: number) =>
  `$${monto.toLocaleString('es-CO', { minimumFractionDigits: 0 })}`;

export default function ObligacionesScreen() {
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
    setCargando(true);
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
        cupo_total: parseFloat(formTarjeta.cupo_total),
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
        monto_total: parseFloat(formPrestamo.monto_total),
        saldo_pendiente: parseFloat(formPrestamo.monto_total),
        cuota_mensual: parseFloat(formPrestamo.cuota_mensual) || 0,
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
        monto: parseFloat(formFijo.monto),
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
    <View style={est.filtrosContainer}>
      <TouchableOpacity 
        style={[est.filtroBtn, tabSeleccionada === 'tarjetas' && est.filtroActivo]}
        onPress={() => setTabSeleccionada('tarjetas')}>
        <CreditCard size={18} color={tabSeleccionada === 'tarjetas' ? theme.colors.onPrimary : theme.colors.onSurfaceVariant} />
        <Text style={[est.filtroTexto, tabSeleccionada === 'tarjetas' && est.filtroTextoActivo]}>Tarjetas</Text>
      </TouchableOpacity>
      
      <TouchableOpacity 
        style={[est.filtroBtn, tabSeleccionada === 'prestamos' && est.filtroActivo]}
        onPress={() => setTabSeleccionada('prestamos')}>
        <Landmark size={18} color={tabSeleccionada === 'prestamos' ? theme.colors.onPrimary : theme.colors.onSurfaceVariant} />
        <Text style={[est.filtroTexto, tabSeleccionada === 'prestamos' && est.filtroTextoActivo]}>Préstamos</Text>
      </TouchableOpacity>

      <TouchableOpacity 
        style={[est.filtroBtn, tabSeleccionada === 'fijos' && est.filtroActivo]}
        onPress={() => setTabSeleccionada('fijos')}>
        <CalendarClock size={18} color={tabSeleccionada === 'fijos' ? theme.colors.onPrimary : theme.colors.onSurfaceVariant} />
        <Text style={[est.filtroTexto, tabSeleccionada === 'fijos' && est.filtroTextoActivo]}>Fijos</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <SafeAreaView style={est.contenedor}>
      <View style={est.headerContainer}>
        <Text style={est.titulo}>Cuentas y Obligaciones</Text>
        <Text style={est.subtitulo}>Administra tus tarjetas, préstamos y pagos recurrentes.</Text>
      </View>

      {renderFiltros()}

      <ScrollView 
        contentContainerStyle={est.lista}
        refreshControl={<RefreshControl refreshing={cargando} onRefresh={cargarDatos} />}
      >
        {tabSeleccionada === 'tarjetas' && (
          <View>
            <TouchableOpacity style={est.btnAgregar} onPress={() => setModalTarjeta(true)}>
              <Plus size={20} color={theme.colors.primary} />
              <Text style={est.textoAgregar}>Nueva Tarjeta de Crédito</Text>
            </TouchableOpacity>
            {tarjetas.length === 0 ? <Text style={est.vacio}>No hay tarjetas registradas.</Text> : tarjetas.map(t => (
              <View key={t.id} style={est.card}>
                <View style={est.cardRow}>
                  <Text style={est.cardTitulo}>{t.nombre}</Text>
                  <TouchableOpacity onPress={() => t.id && confirmarEliminar('tarjeta', t.id)}>
                    <Trash2 size={20} color={theme.colors.error} />
                  </TouchableOpacity>
                </View>
                <Text style={est.cardDato}>Cupo Usado: {formatearMonto(t.cupo_utilizado)} de {formatearMonto(t.cupo_total)}</Text>
                <Text style={est.cardDato}>Fechas: Corta los {t.fecha_corte}, Paga los {t.fecha_pago}</Text>
                <View style={est.progressBarContainer}>
                  <View style={[est.progressBarFill, { width: `${(t.cupo_utilizado/t.cupo_total)*100}%` }]} />
                </View>
              </View>
            ))}
          </View>
        )}

        {tabSeleccionada === 'prestamos' && (
          <View>
            <TouchableOpacity style={est.btnAgregar} onPress={() => setModalPrestamo(true)}>
              <Plus size={20} color={theme.colors.primary} />
              <Text style={est.textoAgregar}>Nuevo Préstamo</Text>
            </TouchableOpacity>
            {prestamos.length === 0 ? <Text style={est.vacio}>No hay préstamos registrados.</Text> : prestamos.map(p => (
              <View key={p.id} style={est.card}>
                <View style={est.cardRow}>
                  <Text style={est.cardTitulo}>{p.nombre}</Text>
                  <TouchableOpacity onPress={() => p.id && confirmarEliminar('prestamo', p.id)}>
                    <Trash2 size={20} color={theme.colors.error} />
                  </TouchableOpacity>
                </View>
                <Text style={est.cardMontoEnorme}>{formatearMonto(p.saldo_pendiente)}</Text>
                <Text style={est.cardDato}>Cuota mensual: {formatearMonto(p.cuota_mensual)} (Día {p.fecha_pago_mensual})</Text>
                <Text style={est.cardDato}>Interés: {p.tasa_interes_mensual}% mensual</Text>
              </View>
            ))}
          </View>
        )}

        {tabSeleccionada === 'fijos' && (
          <View>
            <TouchableOpacity style={est.btnAgregar} onPress={() => setModalFijo(true)}>
              <Plus size={20} color={theme.colors.primary} />
              <Text style={est.textoAgregar}>Nuevo Gasto Fijo</Text>
            </TouchableOpacity>
            {fijos.length === 0 ? <Text style={est.vacio}>No hay gastos fijos registrados.</Text> : fijos.map(f => (
              <View key={f.id} style={est.card}>
                <View style={est.cardRow}>
                  <Text style={est.cardTitulo}>{f.nombre}</Text>
                  <TouchableOpacity onPress={() => f.id && confirmarEliminar('fijo', f.id)}>
                    <Trash2 size={20} color={theme.colors.error} />
                  </TouchableOpacity>
                </View>
                <Text style={est.cardDato}>Monto: {formatearMonto(f.monto)}</Text>
                <Text style={est.cardDato}>Día de pago: {f.dia_pago}</Text>
              </View>
            ))}
          </View>
        )}
      </ScrollView>

      <FloatingMicrophone />

      {/* Modal Tarjeta */}
      <Modal visible={modalTarjeta} transparent animationType="fade">
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={est.modalOverlay}>
            <View style={est.modal}>
              <Text style={est.modalTitulo}>Nueva Tarjeta</Text>
              <TextInput style={est.input} placeholder="Banco o Nombre" placeholderTextColor={theme.colors.outline} onChangeText={t => setFormTarjeta({...formTarjeta, nombre: t})} />
              <TextInput style={est.input} placeholder="Cupo Total (COP)" keyboardType="numeric" placeholderTextColor={theme.colors.outline} onChangeText={t => setFormTarjeta({...formTarjeta, cupo_total: t})} />
              <TextInput style={est.input} placeholder="Día de corte (ej: 15)" keyboardType="numeric" placeholderTextColor={theme.colors.outline} onChangeText={t => setFormTarjeta({...formTarjeta, fecha_corte: t})} />
              <TextInput style={est.input} placeholder="Día de pago (ej: 30)" keyboardType="numeric" placeholderTextColor={theme.colors.outline} onChangeText={t => setFormTarjeta({...formTarjeta, fecha_pago: t})} />
              <View style={est.filaBotones}>
                <TouchableOpacity style={est.btnCancelar} onPress={() => setModalTarjeta(false)}><Text style={est.textoCancelar}>Cancelar</Text></TouchableOpacity>
                <TouchableOpacity style={est.btnGuardar} onPress={guardarTarjeta}><Text style={est.textoGuardar}>Guardar</Text></TouchableOpacity>
              </View>
            </View>
          </KeyboardAvoidingView>
        </TouchableWithoutFeedback>
      </Modal>

      {/* Modal Préstamo */}
      <Modal visible={modalPrestamo} transparent animationType="fade">
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={est.modalOverlay}>
            <View style={est.modal}>
              <Text style={est.modalTitulo}>Nuevo Préstamo</Text>
              <TextInput style={est.input} placeholder="Entidad o Nombre" placeholderTextColor={theme.colors.outline} onChangeText={t => setFormPrestamo({...formPrestamo, nombre: t})} />
              <TextInput style={est.input} placeholder="Monto total (COP)" keyboardType="numeric" placeholderTextColor={theme.colors.outline} onChangeText={t => setFormPrestamo({...formPrestamo, monto_total: t})} />
              <TextInput style={est.input} placeholder="Cuota mensual (COP)" keyboardType="numeric" placeholderTextColor={theme.colors.outline} onChangeText={t => setFormPrestamo({...formPrestamo, cuota_mensual: t})} />
              <TextInput style={est.input} placeholder="Tasa interés mensual % (ej: 1.5)" keyboardType="numeric" placeholderTextColor={theme.colors.outline} onChangeText={t => setFormPrestamo({...formPrestamo, tasa_interes_mensual: t})} />
              <TextInput style={est.input} placeholder="Día de pago (ej: 5)" keyboardType="numeric" placeholderTextColor={theme.colors.outline} onChangeText={t => setFormPrestamo({...formPrestamo, fecha_pago_mensual: t})} />
              <View style={est.filaBotones}>
                <TouchableOpacity style={est.btnCancelar} onPress={() => setModalPrestamo(false)}><Text style={est.textoCancelar}>Cancelar</Text></TouchableOpacity>
                <TouchableOpacity style={est.btnGuardar} onPress={guardarPrestamo}><Text style={est.textoGuardar}>Guardar</Text></TouchableOpacity>
              </View>
            </View>
          </KeyboardAvoidingView>
        </TouchableWithoutFeedback>
      </Modal>

      {/* Modal Gasto Fijo */}
      <Modal visible={modalFijo} transparent animationType="fade">
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={est.modalOverlay}>
            <View style={est.modal}>
              <Text style={est.modalTitulo}>Nuevo Gasto Fijo</Text>
              <TextInput style={est.input} placeholder="Nombre (ej: Netflix)" placeholderTextColor={theme.colors.outline} onChangeText={t => setFormFijo({...formFijo, nombre: t})} />
              <TextInput style={est.input} placeholder="Monto mensual (COP)" keyboardType="numeric" placeholderTextColor={theme.colors.outline} onChangeText={t => setFormFijo({...formFijo, monto: t})} />
              <TextInput style={est.input} placeholder="Día de pago (ej: 28)" keyboardType="numeric" placeholderTextColor={theme.colors.outline} onChangeText={t => setFormFijo({...formFijo, dia_pago: t})} />
              <View style={est.filaBotones}>
                <TouchableOpacity style={est.btnCancelar} onPress={() => setModalFijo(false)}><Text style={est.textoCancelar}>Cancelar</Text></TouchableOpacity>
                <TouchableOpacity style={est.btnGuardar} onPress={guardarGastoFijo}><Text style={est.textoGuardar}>Guardar</Text></TouchableOpacity>
              </View>
            </View>
          </KeyboardAvoidingView>
        </TouchableWithoutFeedback>
      </Modal>

    </SafeAreaView>
  );
}

const est = StyleSheet.create({
  contenedor: { flex: 1, backgroundColor: theme.colors.background },
  headerContainer: { padding: theme.spacing.margin, paddingBottom: theme.spacing.md },
  titulo: { fontFamily: theme.typography.fontFamily.bold, fontSize: theme.typography.display.fontSize, color: theme.colors.onBackground },
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
