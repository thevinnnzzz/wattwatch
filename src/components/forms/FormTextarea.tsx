// FormTextarea component
import React from 'react';
import { View, Text, TextInput, StyleSheet, ViewStyle, TextStyle } from 'react-native';
import { useTheme } from '@/hooks/use-theme';

export interface FormTextareaProps {
  label?: string;
  error?: string;
  helperText?: string;
  required?: boolean;
  value?: string;
  onChangeText?: (text: string) => void;
  placeholder?: string;
  disabled?: boolean;
  multiline?: boolean;
  numberOfLines?: number;
  maxLength?: number;
  style?: ViewStyle;
  labelStyle?: TextStyle;
  containerStyle?: ViewStyle;
  testID?: string;
}

export const FormTextarea = ({
  label,
  error,
  helperText,
  required = false,
  value,
  onChangeText,
  placeholder,
  disabled = false,
  multiline = true,
  numberOfLines = 4,
  maxLength,
  style,
  labelStyle,
  containerStyle,
  testID,
}: FormTextareaProps) => {
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
      <View style={[styles.textareaWrapper, hasError && styles.textareaWrapperError, disabled && styles.textareaWrapperDisabled]}>
        <TextInput
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={theme.colors.meralco.textTertiary}
          disabled={disabled}
          multiline={multiline}
          numberOfLines={numberOfLines}
          maxLength={maxLength}
          style={[
            styles.textarea,
            hasError && styles.textareaError,
            disabled && styles.textareaDisabled,
          ]}
        />
        {maxLength && value && (
          <Text style={styles.charCount}>
            {value.length}/{maxLength}
          </Text>
        )}
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
  textareaWrapper: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  textareaWrapperError: {
    borderColor: '#DC2626',
    borderWidth: 2,
  },
  textareaWrapperDisabled: {
    backgroundColor: '#F1F5F9',
  },
  textarea: {
    fontSize: 16,
    color: '#1E293B',
    textAlignVertical: 'top',
  },
  textareaError: {
    color: '#DC2626',
  },
  textareaDisabled: {
    color: '#94A3B8',
  },
  charCount: {
    position: 'absolute',
    right: 16,
    bottom: 12,
    fontSize: 12,
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

export default FormTextarea;