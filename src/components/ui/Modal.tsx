// Modal components - BottomSheet, CenterModal, FullScreenModal
import React from 'react';
import { View, Pressable, StyleSheet, ViewStyle, Platform, BackHandler } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
  runOnJS,
  Easing,
} from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '@/hooks/use-theme';

export interface ModalProps {
  visible: boolean;
  onClose: () => void;
  children: React.ReactNode;
  style?: ViewStyle;
  testID?: string;
}

export interface BottomSheetProps extends ModalProps {
  snapPoints?: number[];
  initialSnap?: number;
  header?: React.ReactNode;
  backdropOpacity?: number;
  dragIndicator?: boolean;
}

export interface CenterModalProps extends ModalProps {
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
  closeOnBackdropPress?: boolean;
}

export interface FullScreenModalProps extends ModalProps {
  header?: React.ReactNode;
  footer?: React.ReactNode;
}

// Bottom Sheet Modal
export const BottomSheet = ({
  visible,
  onClose,
  children,
  style,
  testID,
  snapPoints = ['25%', '50%', '75%', '90%'],
  initialSnap = 1,
  header,
  backdropOpacity = 0.5,
  dragIndicator = true,
}: BottomSheetProps) => {
  if (!visible) return null;

  const theme = useTheme();
  const translateY = useSharedValue(0);
  const opacity = useSharedValue(0);

  React.useEffect(() => {
    opacity.value = withTiming(1, { duration: 200 });
    translateY.value = withSpring(0, { damping: 20, stiffness: 150 });
  }, []);

  const close = () => {
    opacity.value = withTiming(0, { duration: 150 });
    translateY.value = withTiming(1, { duration: 200 }, () => {
      runOnJS(onClose)();
    });
  };

  const backdropStyle = useAnimatedStyle(() => ({
    opacity: opacity.value * backdropOpacity,
  }));

  const containerStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }));

  const handleBackHandler = () => {
    close();
    return true;
  };

  React.useEffect(() => {
    const subscription = BackHandler.addEventListener('hardwareBackPress', handleBackHandler);
    return () => subscription.remove();
  }, []);

  return (
    <Animated.View style={styles.overlay} pointerEvents={visible ? 'auto' : 'none'}>
      <Animated.View
        style={[styles.backdrop, backdropStyle]}
        onPress={close}
        pointerEvents="box-none"
      />
      <Animated.View
        style={[styles.container, containerStyle, style]}
        testID={testID}
      >
        <SafeAreaView style={styles.safeArea} forceInset={{ bottom: 'always' }}>
          {dragIndicator && (
            <Pressable style={styles.dragIndicator} onPress={close}>
              <View style={[styles.dragBar, { backgroundColor: theme.colors.meralco.borderDark }]} />
            </Pressable>
          )}
          {header && <View style={styles.header}>{header}</View>}
          <View style={styles.content}>{children}</View>
        </SafeAreaView>
      </Animated.View>
    </Animated.View>
  );
};

// Center Modal
export const CenterModal = ({
  visible,
  onClose,
  children,
  style,
  testID,
  size = 'md',
  closeOnBackdropPress = true,
}: CenterModalProps) => {
  if (!visible) return null;

  const theme = useTheme();
  const scale = useSharedValue(0.9);
  const opacity = useSharedValue(0);

  React.useEffect(() => {
    opacity.value = withTiming(1, { duration: 150 });
    scale.value = withSpring(1, { damping: 20, stiffness: 150 });
  }, []);

  const close = () => {
    opacity.value = withTiming(0, { duration: 100 });
    scale.value = withTiming(0.9, { duration: 100 }, () => {
      runOnJS(onClose)();
    });
  };

  const sizeStyles = {
    sm: styles.sizeSm,
    md: styles.sizeMd,
    lg: styles.sizeLg,
    xl: styles.sizeXl,
    full: styles.sizeFull,
  };

  const backdropStyle = useAnimatedStyle(() => ({
    opacity: opacity.value * 0.5,
  }));

  const modalStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ scale: scale.value }],
  }));

  const handleBackHandler = () => {
    close();
    return true;
  };

  React.useEffect(() => {
    const subscription = BackHandler.addEventListener('hardwareBackPress', handleBackHandler);
    return () => subscription.remove();
  }, []);

  return (
    <Animated.View style={styles.overlay} pointerEvents={visible ? 'auto' : 'none'}>
      <Animated.View
        style={[styles.backdrop, backdropStyle]}
        onPress={closeOnBackdropPress ? close : undefined}
        pointerEvents="box-none"
      />
      <Animated.View
        style={[styles.modalContainer, sizeStyles[size], modalStyle, style]}
        testID={testID}
      >
        <View style={styles.modalContent}>
          {children}
        </View>
      </Animated.View>
    </Animated.View>
  );
};

// Full Screen Modal
export const FullScreenModal = ({
  visible,
  onClose,
  children,
  style,
  testID,
  header,
  footer,
}: FullScreenModalProps) => {
  if (!visible) return null;

  const theme = useTheme();
  const translateX = useSharedValue(Platform.OS === 'ios' ? 400 : 0);
  const opacity = useSharedValue(0);

  React.useEffect(() => {
    opacity.value = withTiming(1, { duration: 200 });
    translateX.value = withTiming(0, { duration: 250, easing: Easing.out(Easing.cubic) });
  }, []);

  const close = () => {
    opacity.value = withTiming(0, { duration: 150 });
    translateX.value = withTiming(Platform.OS === 'ios' ? 400 : 0, { duration: 200 }, () => {
      runOnJS(onClose)();
    });
  };

  const containerStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateX: translateX.value }],
  }));

  const handleBackHandler = () => {
    close();
    return true;
  };

  React.useEffect(() => {
    const subscription = BackHandler.addEventListener('hardwareBackPress', handleBackHandler);
    return () => subscription.remove();
  }, []);

  return (
    <Animated.View style={[styles.fullScreenOverlay, containerStyle]} pointerEvents={visible ? 'auto' : 'none'}>
      <SafeAreaView style={styles.fullScreenContainer}>
        {header && (
          <View style={styles.fullScreenHeader}>
            {header}
          </View>
        )}
        <View style={styles.fullScreenContent}>
          {children}
        </View>
        {footer && (
          <View style={styles.fullScreenFooter}>
            {footer}
          </View>
        )}
      </SafeAreaView>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 1000,
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#000',
  },
  container: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    backgroundColor: '#FFFFFF',
    maxHeight: '90%',
    overflow: 'hidden',
  },
  safeArea: {
    flex: 1,
  },
  dragIndicator: {
    alignItems: 'center',
    paddingVertical: 8,
  },
  dragBar: {
    width: 36,
    height: 4,
    borderRadius: 2,
  },
  header: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    width: '100%',
    overflow: 'hidden',
  },
  sizeSm: {
    maxWidth: 300,
  },
  sizeMd: {
    maxWidth: 380,
  },
  sizeLg: {
    maxWidth: 480,
  },
  sizeXl: {
    maxWidth: 580,
  },
  sizeFull: {
    width: '100%',
    maxWidth: '100%',
  },
  fullScreenOverlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 1100,
    backgroundColor: '#FFFFFF',
  },
  fullScreenContainer: {
    flex: 1,
  },
  fullScreenHeader: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  fullScreenContent: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  fullScreenFooter: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
  },
});

export default BottomSheet;