import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Control, Controller, FieldError, RegisterOptions } from 'react-hook-form';
import { Input, InputProps } from '@/components/ui/Input';
import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import { usePalette } from '@/constants/usePalette';

interface FormFieldProps extends InputProps {
  control: Control<any>;
  name: string;
  title: string;
  error?: string;
  rules?: Omit<RegisterOptions, 'valueAsNumber' | 'valueAsDate' | 'setValueAs'>;
  valueType?: 'string' | 'number';
}

const FormField: React.FC<FormFieldProps> = ({
  control,
  name,
  title,
  error,
  rules,
  valueType = 'string',
  ...props
}) => {
  const p = usePalette();

  return (
    <View style={styles.container}>
      <ThemedText style={styles.title}>{title}</ThemedText>
      <Controller
        control={control}
        name={name}
        rules={rules}
        render={({ field: { onChange, onBlur, value }, fieldState }) => (
          <>
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
            {(error || fieldState.error?.message) && (
              <Text style={[styles.errorText, { color: p.error }]}>
                {error || fieldState.error?.message}
              </Text>
            )}
          </>
        )}
      />
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
    marginTop: Spacing.one,
  },
});

export default FormField;
