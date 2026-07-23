import { useEffect, useState } from 'react';
import { Modal, Pressable, StyleSheet } from 'react-native';
import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import { usePalette } from '@/constants/usePalette';
import { Ionicons } from '@expo/vector-icons';

interface AlertConfig {
  title: string;
  message: string;
  type?: 'success' | 'error' | 'info' | 'warning';
  onDismiss?: () => void;
}

let alertRef: { current: ((config: AlertConfig) => void) | null } = { current: null };

export function showAppAlert(config: AlertConfig) {
  alertRef.current?.(config);
}

export function AppAlert() {
  const p = usePalette();
  const [visible, setVisible] = useState(false);
  const [config, setConfig] = useState<AlertConfig | null>(null);

  useEffect(() => {
    alertRef.current = (c: AlertConfig) => {
      setConfig(c);
      setVisible(true);
    };
    return () => {
      alertRef.current = null;
    };
  }, []);

  const handleDismiss = () => {
    setVisible(false);
    setConfig(null);
    config?.onDismiss?.();
  };

  if (!visible || !config) return null;

  const iconMap = {
    success: { name: 'checkmark-circle' as const, color: '#00A651' },
    error: { name: 'alert-circle' as const, color: p.error },
    warning: { name: 'warning' as const, color: p.gold },
    info: { name: 'information-circle' as const, color: p.navy },
  };
  const icon = iconMap[config.type ?? 'info'];

  return (
    <Modal transparent visible={visible} animationType="none" onRequestClose={handleDismiss}>
      <Pressable style={styles.overlay} onPress={handleDismiss}>
        <Pressable style={[styles.dialog, { backgroundColor: p.card ?? p.bg }]} onPress={() => {}}>
          <Ionicons name={icon.name} size={48} color={icon.color} />
          <ThemedText style={styles.title}>{config.title}</ThemedText>
          <ThemedText style={[styles.message, { color: p.textMuted }]}>{config.message}</ThemedText>
          <Pressable
            style={[styles.button, { backgroundColor: p.navy }]}
            onPress={handleDismiss}
          >
            <ThemedText style={styles.buttonText}>OK</ThemedText>
          </Pressable>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.four,
  },
  dialog: {
    width: '100%',
    maxWidth: 320,
    borderRadius: 20,
    padding: Spacing.five,
    alignItems: 'center',
    gap: Spacing.three,
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    textAlign: 'center',
  },
  message: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
  button: {
    marginTop: Spacing.two,
    paddingVertical: 10,
    paddingHorizontal: 32,
    borderRadius: 10,
    minWidth: 120,
    alignItems: 'center',
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '600',
  },
});