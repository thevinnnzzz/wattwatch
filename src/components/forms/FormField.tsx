import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Control, Controller, FieldError } from 'react-hook-form';
import { Input, InputProps } from '@/components/ui/Input';
import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import { LP } from '@/constants/loginPalette';

interface FormFieldProps extends InputProps {
  control: Control<any>;
  name: string;
  title: string;
  error?: string;
  valueType?: 'string' | 'number';
}

const FormField: React.FC<FormFieldProps> = ({
  control,
  name,
  title,
  error,
  valueType = 'string',
  ...props
}) => {
  return (
    <View style={styles.container}>
      <ThemedText style={styles.title}>{title}</ThemedText>
      <Controller
        control={control}
        name={name}
        render={({ field: { onChange, onBlur, value } }) => (
          <Input
            onBlur={onBlur}
            onChangeText={(text) => {
              if (valueType === 'number') {
                const numericValue = text === '' ? null : parseFloat(text);
                onChange(numericValue);
              } else {
                onChange(text);
              }
            }}
            value={value?.toString() ?? ''}
            {...props}
          />
        )}
      />
      {error && <Text style={styles.errorText}>{error}</Text>}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    gap: Spacing.one,
  },
  title: {
    fontWeight: '600',
  },
  errorText: {
    color: LP.error,
    marginTop: Spacing.one,
  },
});

export default FormField;
