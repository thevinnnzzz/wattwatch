// Toast component for notifications
import React from 'react';
import { View, Text, StyleSheet, ViewStyle, TextStyle, Platform } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
  runOnJS,
  Easing,
} from 'react-native-reanimated';
import { useTheme } from '@/hooks/use-theme';

export interface ToastProps {
  visible: boolean;
  message: string;
  type?: 'success' | 'error' | 'warning' | 'info';
  onClose?: () => void;
  duration?: number;
  position?: 'top' | 'bottom';
  style?: ViewStyle;
  textStyle?: TextStyle;
  testID?: string;
}

interface ToastMessage {
  id: number;
  message: string;
  type: 'success' | 'error' | 'warning' | 'info';
}

const typeStyles = {
  success: { bg: '#00A651', icon: '✓' },
  error: { bg: '#DC2626', icon: '✕' },
  warning: { bg: '#FFB800', icon: '⚠' },
  info: { bg: '#0066CC', icon: 'ℹ' },
};

const Toast = ({
  visible,
  message,
  type = 'info',
  onClose,
  duration = 4000,
  position = 'bottom',
  style,
  textStyle,
  testID,
}: ToastProps) => {
  const theme = useTheme();
  const translateY = useSharedValue(position === 'top' ? -100 : 100);
  const opacity = useSharedValue(0);
  const idRef = React.useRef(Date.now());

  React.useEffect(() => {
    if (visible) {
      idRef.current = Date.now();
      opacity.value = withTiming(1, { duration: 200 });
      translateY.value = withSpring(0, { damping: 20, stiffness: 150 });

      const timer = setTimeout(() => {
        opacity.value = withTiming(0, { duration: 200 });
        translateY.value = withSpring(position === 'top' ? -100 : 100, { damping: 20, stiffness: 150 }, () => {
          runOnJS(onClose)?.();
        });
      }, duration);

      return () => clearTimeout(timer);
    }
  }, [visible, duration, position, onClose]);

  const toastStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: translateY.value }],
  }));

  const { bg, icon } = typeStyles[type];

  return (
    <Animated.View
      style={[
        styles.container,
        position === 'top' ? styles.top : styles.bottom,
        { backgroundColor: bg },
        toastStyle,
        style,
      ]}
      testID={testID}
      pointerEvents="box-none"
    >
      <View style={styles.content}>
        <Text style={[styles.icon, { color: '#FFFFFF' }]}>{icon}</Text>
        <Text
          style={[
            styles.message,
            { color: '#FFFFFF' },
            textStyle,
          ]}
          numberOfLines={3}
        >
          {message}
        </Text>
      </View>
    </Animated.View>
  );
};

// Toast Context for global toast management
import { createContext, useContext, ReactNode } from 'react';

interface ToastContextType {
  showToast: (message: string, type?: ToastProps['type'], duration?: number) => void;
  showSuccess: (message: string, duration?: number) => void;
  showError: (message: string, duration?: number) => void;
  showWarning: (message: string, duration?: number) => void;
  showInfo: (message: string, duration?: number) => void;
}

const ToastContext = createContext<ToastContextType | null>(null);

export const ToastProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = React.useState<ToastMessage[]>([]);

  const showToast = (message: string, type: ToastProps['type'] = 'info', duration = 4000) => {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, duration + 500);
  };

  const showSuccess = (message: string, duration?: number) => showToast(message, 'success', duration);
  const showError = (message: string, duration?: number) => showToast(message, 'error', duration);
  const showWarning = (message: string, duration?: number) => showToast(message, 'warning', duration);
  const showInfo = (message: string, duration?: number) => showToast(message, 'info', duration);

  return (
    <ToastContext.Provider value={{ showToast, showSuccess, showError, showWarning, showInfo }}>
      {children}
      {toasts.map((toast) => (
        <Toast
          key={toast.id}
          visible={true}
          message={toast.message}
          type={toast.type}
          duration={4000}
          onClose={() => setToasts((prev) => prev.filter((t) => t.id !== toast.id))}
        />
      ))}
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 4,
    marginHorizontal: 16,
    gap: 12,
  },
  top: {
    marginTop: Platform.OS === 'ios' ? 50 : 16,
  },
  bottom: {
    marginBottom: 100,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 10,
  },
  icon: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  message: {
    flex: 1,
    fontSize: 14,
    fontWeight: '500',
    lineHeight: 20,
  },
});

export default Toast;