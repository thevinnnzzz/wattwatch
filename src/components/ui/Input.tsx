// Input component — palette from login screen
import React from 'react';
import { View, Text, TextInput, StyleSheet, TextInputProps } from 'react-native';
import { useTheme } from '@/hooks/use-theme';
import { LP } from '@/constants/loginPalette';

export interface InputProps extends Omit<TextInputProps, 'style' | 'onChangeText' | 'value' | 'defaultValue'> {
  label?: string;
  error?: string;
  helperText?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  value?: string;
  onChangeText?: (text: string) => void;
  placeholder?: string;
  style?: any;
  containerStyle?: any;
  inputStyle?: any;
  testID?: string;
}

export const Input = React.forwardRef<TextInput, InputProps>(
  (
    {
      label,
      error,
      helperText,
      leftIcon,
      rightIcon,
      value,
      onChangeText,
      placeholder,
      style,
      containerStyle,
      inputStyle,
      testID,
      secureTextEntry = false,
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
          {leftIcon && (
            <View style={styles.iconLeft} pointerEvents="none">
              {leftIcon}
            </View>
          )}
          <TextInput
            ref={ref}
            style={[
              styles.input,
              hasError && styles.inputError,
              leftIcon && styles.inputWithLeftIcon,
              rightIcon && styles.inputWithRightIcon,
              inputStyle,
            ]}
            value={value}
            onChangeText={onChangeText}
            placeholder={placeholder}
            placeholderTextColor={theme.colors.textTertiary}
            secureTextEntry={secureTextEntry}
            {...props}
          />
          {rightIcon && (
            <View style={styles.iconRight} pointerEvents="none">
              {rightIcon}
            </View>
          )}
        </View>
        {error && <Text style={styles.errorText}>{error}</Text>}
        {!error && helperText && <Text style={styles.helperText}>{helperText}</Text>}
      </View>
    );
  }
);

Input.displayName = 'Input';

const styles = StyleSheet.create({
  container: { gap: 6, width: '100%' },
  label: { fontSize: 14, fontWeight: '500', color: LP.text },
  labelError: { color: LP.error },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: LP.bg,
    borderWidth: 1,
    borderColor: LP.divider,
    borderRadius: 12,
    paddingHorizontal: 16,
  },
  inputWrapperError: { borderColor: LP.error, borderWidth: 2 },
  input: { flex: 1, fontSize: 16, color: LP.text, paddingVertical: 14 },
  inputError: { color: LP.error },
  inputWithLeftIcon: { paddingLeft: 0 },
  inputWithRightIcon: { paddingRight: 0 },
  iconLeft: { marginRight: 12 },
  iconRight: { marginLeft: 12 },
  errorText: { fontSize: 12, color: LP.error, marginLeft: 4 },
  helperText: { fontSize: 12, color: '#9CA3AF', marginLeft: 4 },
});

export default Input;