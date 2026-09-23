import React from 'react';
import { TouchableOpacity, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Mic } from 'lucide-react-native';
import { theme } from '../theme';

export default function FloatingMicrophone() {
  const navigation = useNavigation<any>();

  return (
    <TouchableOpacity
      style={styles.fab}
      activeOpacity={0.8}
      onPress={() => navigation.navigate('Chat')}
    >
      <Mic size={28} color={theme.colors.onPrimary} strokeWidth={2.5} />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  fab: {
    position: 'absolute',
    bottom: theme.spacing.xl,
    right: theme.spacing.lg,
    width: 64,
    height: 64,
    borderRadius: theme.roundness.full,
    backgroundColor: theme.colors.primaryContainer,
    justifyContent: 'center',
    alignItems: 'center',
    // Shadow Level 3 from Design Tokens
    shadowColor: theme.shadows.level3.shadowColor,
    shadowOffset: theme.shadows.level3.shadowOffset,
    shadowOpacity: theme.shadows.level3.shadowOpacity,
    shadowRadius: theme.shadows.level3.shadowRadius,
    elevation: theme.shadows.level3.elevation,
  },
});
