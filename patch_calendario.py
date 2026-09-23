import re

with open('screens/CalendarioScreen.tsx', 'r') as f:
    content = f.read()

# 1. Imports
imports = """import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, SectionList, TouchableOpacity, TextInput,
  StyleSheet, Alert, SafeAreaView, RefreshControl, Modal, Keyboard, TouchableWithoutFeedback, KeyboardAvoidingView, Platform
} from 'react-native';"""
content = re.sub(r"import React.*?from 'react-native';", imports, content, flags=re.DOTALL)

# 2. Add API methods and Plus icon
content = content.replace("import { obtenerEventos, Evento } from '../services/api';", "import { obtenerEventos, crearEvento, Evento } from '../services/api';")
content = content.replace("import { Calendar, Clock, CheckCircle2, ListTodo } from 'lucide-react-native';", "import { Calendar, Clock, CheckCircle2, ListTodo, Plus } from 'lucide-react-native';")

# 3. Add state and handlers
state_code = """  const [secciones, setSecciones] = useState<Seccion[]>([]);
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
  };"""
content = content.replace("  const [secciones, setSecciones] = useState<Seccion[]>([]);\n  const [cargando, setCargando] = useState(false);", state_code)

# 4. Add Plus button to header
header_code = """      <View style={styles.header}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <View>
            <Text style={styles.headerTitulo}>Calendario</Text>
            <Text style={styles.headerSub}>Próximos eventos y tareas</Text>
          </View>
          <TouchableOpacity onPress={() => setModalVisible(true)}>
            <Plus size={28} color={theme.colors.primary} />
          </TouchableOpacity>
        </View>
      </View>"""
content = content.replace("""      <View style={styles.header}>
        <Text style={styles.headerTitulo}>Calendario</Text>
        <Text style={styles.headerSub}>Próximos eventos y tareas</Text>
      </View>""", header_code)

# 5. Add Modal before FloatingMicrophone
modal_code = """      <Modal visible={modalVisible} transparent animationType="fade">
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

      <FloatingMicrophone />"""
content = content.replace("      <FloatingMicrophone />", modal_code)

# 6. Add Styles
styles_code = """  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', padding: theme.spacing.margin },
  modal: { backgroundColor: theme.colors.surface, borderRadius: theme.roundness.xl, padding: theme.spacing.lg, gap: theme.spacing.md },
  modalTitulo: { fontFamily: theme.typography.fontFamily.bold, fontSize: 20, color: theme.colors.onSurface },
  input: { backgroundColor: theme.colors.surfaceVariant, padding: 12, borderRadius: theme.roundness.md, fontFamily: theme.typography.fontFamily.regular, color: theme.colors.onSurface },
  filaBotones: { flexDirection: 'row', gap: theme.spacing.md, marginTop: theme.spacing.md },
  btnCancelar: { flex: 1, alignItems: 'center', padding: 12, borderRadius: theme.roundness.full, backgroundColor: theme.colors.surfaceVariant },
  textoCancelar: { fontFamily: theme.typography.fontFamily.semiBold, color: theme.colors.onSurface },
  btnGuardar: { flex: 1, alignItems: 'center', padding: 12, borderRadius: theme.roundness.full, backgroundColor: theme.colors.primary },
  textoGuardar: { fontFamily: theme.typography.fontFamily.bold, color: theme.colors.onPrimary },
});"""
content = content.replace("});", styles_code)

with open('screens/CalendarioScreen.tsx', 'w') as f:
    f.write(content)

