// FormCheckbox and FormSwitch components
import React from 'react';
import { View, Text, Pressable, StyleSheet, ViewStyle, TextStyle } from 'react-native';
import { useTheme } from '@/hooks/use-theme';

export interface FormCheckboxProps {
  label: string;
  value: boolean;
  onChange: (value: boolean) => void;
  error?: string;
  helperText?: string;
  required?: boolean;
  disabled?: boolean;
  style?: ViewStyle;
  labelStyle?: TextStyle;
  containerStyle?: ViewStyle;
  testID?: string;
}

export const FormCheckbox = ({
  label,
  value,
  onChange,
  error,
  helperText,
  required = false,
  disabled = false,
  style,
  labelStyle,
  containerStyle,
  testID,
}: FormCheckboxProps) => {
  const theme = useTheme();
  const hasError = !!error;

  const handlePress = () => {
    if (!disabled) {
      onChange(!value);
    }
  };

  return (
    <View style={[styles.container, style]} testID={testID}>
      <Pressable
        style={({ pressed }) => [
          styles.checkbox,
          value && styles.checkboxChecked,
          hasError && styles.checkboxError,
          disabled && styles.checkboxDisabled,
          pressed && styles.checkboxPressed,
        ]}
        onPress={handlePress}
        disabled={disabled}
        accessibilityRole="checkbox"
        accessibilityState={{ checked: value, disabled }}
      >
        {value && <View style={styles.checkmark} />}
      </Pressable>
      <View style={styles.labelContainer}>
        <Text
          style={[
            styles.label,
            labelStyle,
            disabled && styles.labelDisabled,
            required && styles.required,
          ]}
          onPress={handlePress}
        >
          {label}
          {required && <Text style={styles.asterisk}>*</Text>}
        </Text>
        {error && <Text style={styles.errorText}>{error}</Text>}
        {!error && helperText && <Text style={styles.helperText}>{helperText}</Text>}
      </View>
    </View>
  );
};

export interface FormSwitchProps {
  label: string;
  value: boolean;
  onChange: (value: boolean) => void;
  error?: string;
  helperText?: string;
  required?: boolean;
  disabled?: boolean;
  style?: ViewStyle;
  labelStyle?: TextStyle;
  containerStyle?: ViewStyle;
  testID?: string;
}

export const FormSwitch = ({
  label,
  value,
  onChange,
  error,
  helperText,
  required = false,
  disabled = false,
  style,
  labelStyle,
  containerStyle,
  testID,
}: FormSwitchProps) => {
  const theme = useTheme();
  const hasError = !!error;

  const handlePress = () => {
    if (!disabled) {
      onChange(!value);
    }
  };

  return (
    <View style={[styles.container, style]} testID={testID}>
      <View style={styles.labelContainer}>
        <Text
          style={[
            styles.label,
            labelStyle,
            disabled && styles.labelDisabled,
            required && styles.required,
          ]}
          onPress={handlePress}
        >
          {label}
          {required && <Text style={styles.asterisk}>*</Text>}
        </Text>
        {error && <Text style={styles.errorText}>{error}</Text>}
        {!error && helperText && <Text style={styles.helperText}>{helperText}</Text>}
      </View>
      <Pressable
        style={[
          styles.switchTrack,
          value && styles.switchTrackOn,
          hasError && styles.switchTrackError,
          disabled && styles.switchTrackDisabled,
        ]}
        onPress={handlePress}
        disabled={disabled}
        accessibilityRole="switch"
        accessibilityState={{ checked: value, disabled }}
      >
        <View
          style={[
            styles.switchThumb,
            value && styles.switchThumbOn,
            disabled && styles.switchThumbDisabled,
          ]}
        />
      </Pressable>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    width: '100%',
  },
  checkbox: {
    width: 24,
    height: 24,
    borderWidth: 2,
    borderColor: '#E2E8F0',
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
  },
  checkboxChecked: {
    backgroundColor: '#0066CC',
    borderColor: '#0066CC',
  },
  checkboxError: {
    borderColor: '#DC2626',
  },
  checkboxDisabled: {
    backgroundColor: '#F1F5F9',
    borderColor: '#CBD5E1',
  },
  checkboxPressed: {
    opacity: 0.8,
  },
  checkmark: {
    width: 16,
    height: 16,
  },
  switchTrack: {
    width: 52,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#CBD5E1',
    padding: 3,
    alignItems: 'flex-start',
    justifyContent: 'center',
  },
  switchTrackOn: {
    backgroundColor: '#0066CC',
    alignItems: 'flex-end',
  },
  switchTrackError: {
    borderWidth: 2,
    borderColor: '#DC2626',
  },
  switchTrackDisabled: {
    opacity: 0.5,
  },
  switchThumb: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
  },
  switchThumbOn: {},
  switchThumbDisabled: {
    backgroundColor: '#F1F5F9',
  },
  labelContainer: {
    flex: 1,
    gap: 4,
  },
  label: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1E293B',
    flexWrap: 'wrap',
  },
  labelDisabled: {
    color: '#94A3B8',
  },
  required: {},
  asterisk: {
    color: '#DC2626',
    fontWeight: '600',
  },
  errorText: {
    fontSize: 12,
    color: '#DC2626',
  },
  helperText: {
    fontSize: 12,
    color: '#94A3B8',
  },
});

export default FormCheckbox;