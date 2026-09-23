import React, { useState, useRef, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  ActivityIndicator,
  SafeAreaView,
} from 'react-native';
import * as Speech from 'expo-speech';
import { theme } from '../theme';
import { enviarMensaje } from '../services/api';
import { Send, MicOff } from 'lucide-react-native';

interface Mensaje {
  id: string;
  texto: string;
  esUsuario: boolean;
  timestamp: Date;
}

const MENSAJE_BIENVENIDA: Mensaje = {
  id: '0',
  texto: '¡Hola! Soy Raín 🌧️ Tu asistente personal. Puedo ayudarte con tus finanzas, agenda y correos. ¿En qué te ayudo hoy?',
  esUsuario: false,
  timestamp: new Date(),
};

export default function ChatScreen() {
  const [mensajes, setMensajes] = useState<Mensaje[]>([MENSAJE_BIENVENIDA]);
  const [inputTexto, setInputTexto] = useState('');
  const [cargando, setCargando] = useState(false);
  const flatListRef = useRef<FlatList>(null);

  const enviar = useCallback(async () => {
    const texto = inputTexto.trim();
    if (!texto || cargando) return;

    const mensajeUsuario: Mensaje = {
      id: Date.now().toString(),
      texto,
      esUsuario: true,
      timestamp: new Date(),
    };

    setMensajes(prev => [...prev, mensajeUsuario]);
    setInputTexto('');
    setCargando(true);

    try {
      const respuesta = await enviarMensaje(texto);

      const mensajeRain: Mensaje = {
        id: (Date.now() + 1).toString(),
        texto: respuesta,
        esUsuario: false,
        timestamp: new Date(),
      };

      setMensajes(prev => [...prev, mensajeRain]);

      Speech.speak(respuesta, {
        language: 'es-MX',
        pitch: 1.0,
        rate: 0.95,
      });
    } catch (error) {
      const mensajeError: Mensaje = {
        id: (Date.now() + 1).toString(),
        texto: '⚠️ No pude conectarme al servidor. Verifica que el backend esté corriendo y la IP de Tailscale sea correcta en services/api.ts',
        esUsuario: false,
        timestamp: new Date(),
      };
      setMensajes(prev => [...prev, mensajeError]);
    } finally {
      setCargando(false);
    }
  }, [inputTexto, cargando]);

  const detenerVoz = () => {
    Speech.stop();
  };

  const renderMensaje = ({ item }: { item: Mensaje }) => (
    <View style={[
      estilos.burbuja,
      item.esUsuario ? estilos.burbujaUsuario : estilos.burbujaRain,
    ]}>
      {!item.esUsuario && (
        <Text style={estilos.nombreRain}>Raín 🌧️</Text>
      )}
      <Text style={[
        estilos.textoBurbuja,
        item.esUsuario ? estilos.textoUsuario : estilos.textoRain,
      ]}>
        {item.texto}
      </Text>
      <Text style={[estilos.hora, item.esUsuario ? { color: theme.colors.primaryContainer } : { color: theme.colors.onSurfaceVariant }]}>
        {item.timestamp.toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' })}
      </Text>
    </View>
  );

  return (
    <SafeAreaView style={estilos.contenedor}>
      {/* Header */}
      <View style={estilos.header}>
        <View style={estilos.headerTextContainer}>
          <Text style={estilos.headerTitulo}>Raín 🌧️</Text>
          <Text style={estilos.headerSubtitulo}>Asistente Inteligente</Text>
        </View>
        <TouchableOpacity onPress={detenerVoz} style={estilos.btnDetenerVoz}>
          <MicOff size={16} color={theme.colors.onSurfaceVariant} />
          <Text style={estilos.textoDetenerVoz}>Silenciar</Text>
        </TouchableOpacity>
      </View>

      {/* Lista de mensajes */}
      <FlatList
        ref={flatListRef}
        data={mensajes}
        keyExtractor={item => item.id}
        renderItem={renderMensaje}
        contentContainerStyle={estilos.listaMensajes}
        onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
        onLayout={() => flatListRef.current?.scrollToEnd({ animated: false })}
      />

      {/* Indicador de carga */}
      {cargando && (
        <View style={estilos.cargando}>
          <ActivityIndicator color={theme.colors.primary} />
          <Text style={estilos.textoCargando}>Raín está pensando...</Text>
        </View>
      )}

      {/* Input de mensaje */}
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <View style={estilos.contenedorInput}>
          <TextInput
            style={estilos.input}
            value={inputTexto}
            onChangeText={setInputTexto}
            placeholder="Escribe o dicta por voz..."
            placeholderTextColor={theme.colors.outline}
            multiline
            maxLength={500}
            returnKeyType="send"
            onSubmitEditing={enviar}
          />
          <TouchableOpacity
            style={[estilos.btnEnviar, (!inputTexto.trim() || cargando) && estilos.btnEnviarDeshabilitado]}
            onPress={enviar}
            disabled={!inputTexto.trim() || cargando}
          >
            <Send size={20} color={theme.colors.onPrimary} />
          </TouchableOpacity>
        </View>
        <Text style={estilos.ayuda}>
          Toca el micrófono 🎤 en el teclado de tu celular para hablar
        </Text>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const estilos = StyleSheet.create({
  contenedor: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  header: {
    backgroundColor: theme.colors.surface,
    paddingHorizontal: theme.spacing.margin,
    paddingTop: theme.spacing.lg,
    paddingBottom: theme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.surfaceVariant,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    shadowColor: theme.shadows.level1.shadowColor,
    shadowOffset: theme.shadows.level1.shadowOffset,
    shadowOpacity: theme.shadows.level1.shadowOpacity,
    shadowRadius: theme.shadows.level1.shadowRadius,
    elevation: theme.shadows.level1.elevation,
  },
  headerTextContainer: {
    flex: 1,
  },
  headerTitulo: {
    fontFamily: theme.typography.fontFamily.bold,
    fontSize: theme.typography.headlineLg.fontSize,
    color: theme.colors.onSurface,
  },
  headerSubtitulo: {
    fontFamily: theme.typography.fontFamily.medium,
    fontSize: theme.typography.labelMd.fontSize,
    color: theme.colors.onSurfaceVariant,
  },
  btnDetenerVoz: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.surfaceVariant,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: theme.roundness.full,
    gap: 4,
  },
  textoDetenerVoz: {
    fontFamily: theme.typography.fontFamily.medium,
    color: theme.colors.onSurfaceVariant,
    fontSize: theme.typography.labelMd.fontSize,
  },
  listaMensajes: {
    padding: theme.spacing.margin,
    gap: theme.spacing.md,
    flexGrow: 1,
  },
  burbuja: {
    maxWidth: '85%',
    padding: theme.spacing.md,
    borderRadius: theme.roundness.xl,
    marginBottom: theme.spacing.sm,
  },
  burbujaUsuario: {
    alignSelf: 'flex-end',
    backgroundColor: theme.colors.primary,
    borderBottomRightRadius: 4,
    shadowColor: theme.shadows.level1.shadowColor,
    shadowOffset: theme.shadows.level1.shadowOffset,
    shadowOpacity: theme.shadows.level1.shadowOpacity,
    shadowRadius: theme.shadows.level1.shadowRadius,
    elevation: theme.shadows.level1.elevation,
  },
  burbujaRain: {
    alignSelf: 'flex-start',
    backgroundColor: theme.colors.surface,
    borderBottomLeftRadius: 4,
    borderWidth: 1,
    borderColor: theme.colors.surfaceVariant,
  },
  nombreRain: {
    fontFamily: theme.typography.fontFamily.bold,
    fontSize: theme.typography.labelMd.fontSize,
    color: theme.colors.primary,
    marginBottom: 4,
  },
  textoBurbuja: {
    fontFamily: theme.typography.fontFamily.regular,
    fontSize: theme.typography.bodyLg.fontSize,
    lineHeight: 22,
  },
  textoUsuario: {
    color: theme.colors.onPrimary,
  },
  textoRain: {
    color: theme.colors.onSurface,
  },
  hora: {
    fontFamily: theme.typography.fontFamily.medium,
    fontSize: 10,
    marginTop: 6,
    alignSelf: 'flex-end',
  },
  cargando: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
    paddingHorizontal: theme.spacing.margin,
    paddingVertical: theme.spacing.sm,
  },
  textoCargando: {
    fontFamily: theme.typography.fontFamily.medium,
    color: theme.colors.onSurfaceVariant,
    fontSize: theme.typography.labelMd.fontSize,
    fontStyle: 'italic',
  },
  contenedorInput: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.margin,
    paddingTop: theme.spacing.md,
    paddingBottom: theme.spacing.xs,
    backgroundColor: theme.colors.background,
    borderTopWidth: 1,
    borderTopColor: theme.colors.surfaceVariant,
    gap: theme.spacing.sm,
  },
  input: {
    flex: 1,
    backgroundColor: theme.colors.surface,
    borderRadius: theme.roundness.full,
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: 12,
    fontSize: theme.typography.bodyMd.fontSize,
    fontFamily: theme.typography.fontFamily.regular,
    color: theme.colors.onSurface,
    borderWidth: 1,
    borderColor: theme.colors.surfaceVariant,
    maxHeight: 120,
  },
  btnEnviar: {
    backgroundColor: theme.colors.primary,
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: theme.shadows.level2.shadowColor,
    shadowOffset: theme.shadows.level2.shadowOffset,
    shadowOpacity: theme.shadows.level2.shadowOpacity,
    shadowRadius: theme.shadows.level2.shadowRadius,
    elevation: theme.shadows.level2.elevation,
  },
  btnEnviarDeshabilitado: {
    backgroundColor: theme.colors.surfaceVariant,
    shadowOpacity: 0,
    elevation: 0,
  },
  ayuda: {
    textAlign: 'center',
    fontFamily: theme.typography.fontFamily.regular,
    color: theme.colors.outline,
    fontSize: theme.typography.labelMd.fontSize,
    paddingBottom: theme.spacing.md,
    paddingTop: theme.spacing.xs,
    backgroundColor: theme.colors.background,
  },
});
