// FormSelect component
import React from 'react';
import { View, Text, StyleSheet, ViewStyle, TextStyle } from 'react-native';
import { useTheme } from '@/hooks/use-theme';

export interface FormSelectOption {
  label: string;
  value: string;
}

export interface FormSelectProps {
  label?: string;
  error?: string;
  helperText?: string;
  required?: boolean;
  options: FormSelectOption[];
  value?: string;
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  style?: ViewStyle;
  labelStyle?: TextStyle;
  containerStyle?: ViewStyle;
  testID?: string;
}

export const FormSelect = ({
  label,
  error,
  helperText,
  required = false,
  options,
  value,
  onChange,
  placeholder,
  disabled = false,
  style,
  labelStyle,
  containerStyle,
  testID,
}: FormSelectProps) => {
  const theme = useTheme();
  const hasError = !!error;

  return (
    <View style={[styles.container, style]} testID={testID}>
      {label && (
        <View style={styles.labelRow}>
          <Text style={[styles.label, labelStyle, required && styles.required]}>
            {label}
            {required && <Text style={styles.asterisk}>*</Text>}
          </Text>
        </View>
      )}
      <View style={[styles.selectWrapper, hasError && styles.selectWrapperError, disabled && styles.selectWrapperDisabled]}>
        <View style={styles.selectInner}>
          <Text
            style={[
              styles.selectText,
              hasError && styles.selectTextError,
              disabled && styles.selectTextDisabled,
              placeholder && !value && styles.placeholderText,
            ]}
          >
            {value ? options.find((o) => o.value === value)?.label : placeholder || 'Select an option'}
          </Text>
        </View>
      </View>
      {error && <Text style={styles.errorText}>{error}</Text>}
      {!error && helperText && <Text style={styles.helperText}>{helperText}</Text>}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    gap: 6,
  },
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1E293B',
  },
  required: {
    marginLeft: 4,
  },
  asterisk: {
    color: '#DC2626',
    fontWeight: '600',
  },
  selectWrapper: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  selectWrapperError: {
    borderColor: '#DC2626',
    borderWidth: 2,
  },
  selectWrapperDisabled: {
    backgroundColor: '#F1F5F9',
  },
  selectInner: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  selectText: {
    fontSize: 16,
    color: '#1E293B',
    flex: 1,
  },
  selectTextError: {
    color: '#DC2626',
  },
  selectTextDisabled: {
    color: '#94A3B8',
  },
  placeholderText: {
    color: '#94A3B8',
  },
  errorText: {
    fontSize: 12,
    color: '#DC2626',
    marginLeft: 4,
  },
  helperText: {
    fontSize: 12,
    color: '#94A3B8',
    marginLeft: 4,
  },
});

export default FormSelect;