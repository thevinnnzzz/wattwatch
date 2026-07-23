import React from 'react';
import { View, Text, TextInput, StyleSheet, TextInputProps } from 'react-native';
import { useTheme } from '@/hooks/use-theme';

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
          <Text style={[styles.label, hasError && { color: theme.colors.error }, { color: theme.colors.text }]}>{label}</Text>
        )}
        <View style={[styles.inputWrapper, hasError && { borderColor: theme.colors.error, borderWidth: 2 }, { backgroundColor: theme.colors.background, borderColor: theme.colors.border }]}>
          {leftIcon && (
            <View style={styles.iconLeft} pointerEvents="none">
              {leftIcon}
            </View>
          )}
          <TextInput
            ref={ref}
            style={[
              styles.input,
              hasError && { color: theme.colors.error },
              leftIcon && styles.inputWithLeftIcon,
              rightIcon && styles.inputWithRightIcon,
              { color: theme.colors.text },
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
        {error && <Text style={[styles.errorText, { color: theme.colors.error }]}>{error}</Text>}
        {!error && helperText && <Text style={[styles.helperText, { color: theme.colors.textTertiary }]}>{helperText}</Text>}
      </View>
    );
  }
);

Input.displayName = 'Input';

const styles = StyleSheet.create({
  container: { gap: 6, width: '100%' },
  label: { fontSize: 14, fontWeight: '500' },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 16,
  },
  input: { flex: 1, fontSize: 16, paddingVertical: 14 },
  inputWithLeftIcon: { paddingLeft: 0 },
  inputWithRightIcon: { paddingRight: 0 },
  iconLeft: { marginRight: 12 },
  iconRight: { marginLeft: 12 },
  errorText: { fontSize: 12, marginLeft: 4 },
  helperText: { fontSize: 12, marginLeft: 4 },
});

export default Input;
