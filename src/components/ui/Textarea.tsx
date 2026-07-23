// Textarea component
import React from 'react';
import { View, Text, TextInput, StyleSheet, TextInputProps } from 'react-native';
import { useTheme } from '@/hooks/use-theme';

export interface TextareaProps extends Omit<TextInputProps, 'style' | 'onChangeText' | 'value' | 'defaultValue'> {
  label?: string;
  error?: string;
  helperText?: string;
  value?: string;
  onChangeText?: (text: string) => void;
  placeholder?: string;
  rows?: number;
  style?: any;
  containerStyle?: any;
  inputStyle?: any;
  testID?: string;
}

export const Textarea = React.forwardRef<TextInput, TextareaProps>(
  (
    {
      label,
      error,
      helperText,
      value,
      onChangeText,
      placeholder,
      rows = 4,
      style,
      containerStyle,
      inputStyle,
      testID,
      ...props
    },
    ref
  ) => {
    const theme = useTheme();
    const hasError = !!error;

    return (
      <View style={[styles.container, containerStyle]} testID={testID ? `${testID}-container` : undefined}>
        {label && (
          <Text style={[styles.label, hasError && styles.labelError]}>{label}</Text>
        )}
        <View style={[styles.inputWrapper, hasError && styles.inputWrapperError]}>
          <TextInput
            ref={ref}
            style={[
              styles.input,
              { minHeight: rows * 24 },
              hasError && styles.inputError,
              inputStyle,
            ]}
            value={value}
            onChangeText={onChangeText}
            placeholder={placeholder}
            placeholderTextColor={theme.colors.meralco.textTertiary}
            multiline
            textAlignVertical="top"
            {...props}
          />
        </View>
        {error && <Text style={styles.errorText}>{error}</Text>}
        {!error && helperText && <Text style={styles.helperText}>{helperText}</Text>}
      </View>
    );
  }
);

Textarea.displayName = 'Textarea';

const styles = StyleSheet.create({
  container: {
    gap: 6,
    width: '100%',
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1E293B',
  },
  labelError: {
    color: '#DC2626',
  },
  inputWrapper: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  inputWrapperError: {
    borderColor: '#DC2626',
    borderWidth: 2,
  },
  input: {
    fontSize: 16,
    color: '#1E293B',
  },
  inputError: {
    color: '#DC2626',
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

export default Textarea;