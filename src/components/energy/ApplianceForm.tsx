import React, { useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import FormField from '@/components/forms/FormField';
import { Button } from '@/components/ui/Button';
import { Spacing } from '@/constants/theme';

const applianceSchema = z.object({
  name: z.string().min(2, 'Name is too short'),
  category: z.string().min(2, 'Category is required'),
  wattage: z.number().positive('Wattage must be a positive number'),
  hours_used_daily: z.number().min(0).max(24, 'Hours must be between 0 and 24'),
});

type ApplianceFormData = z.infer<typeof applianceSchema>;

interface ApplianceFormProps {
  onSubmit: (data: ApplianceFormData) => void;
  initialData?: Partial<ApplianceFormData>;
  loading?: boolean;
}

export default function ApplianceForm({ onSubmit, initialData, loading }: ApplianceFormProps) {
  const { control, handleSubmit, formState: { errors }, reset } = useForm<ApplianceFormData>({
    resolver: zodResolver(applianceSchema),
    defaultValues: {
      name: '',
      category: '',
      wattage: 0,
      hours_used_daily: 0,
      ...initialData
    },
  });

  useEffect(() => {
    if (initialData) {
      reset({
        name: initialData.name || '',
        category: initialData.category || '',
        wattage: initialData.wattage || 0,
        hours_used_daily: initialData.hours_used_daily || 0,
      });
    }
  }, [initialData, reset]);

  return (
    <View style={styles.formContainer}>
      <FormField
        control={control}
        name="name"
        title="Appliance Name"
        placeholder="e.g. Living Room AC"
        error={errors.name?.message}
      />
      <FormField
        control={control}
        name="category"
        title="Category"
        placeholder="e.g. Cooling"
        error={errors.category?.message}
      />
      <FormField
        control={control}
        name="wattage"
        title="Wattage (W)"
        placeholder="e.g. 1200"
        keyboardType="numeric"
        error={errors.wattage?.message}
        valueType="number"
      />
      <FormField
        control={control}
        name="hours_used_daily"
        title="Hours Used Per Day"
        placeholder="e.g. 8"
        keyboardType="numeric"
        error={errors.hours_used_daily?.message}
        valueType="number"
      />
      <Button
        title={initialData && initialData.name ? 'Add Appliance' : 'Add Appliance'}
        onPress={handleSubmit(onSubmit)}
        style={styles.button}
        loading={loading}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  formContainer: {
    gap: Spacing.four,
  },
  button: {
    marginTop: Spacing.two,
  },
});
