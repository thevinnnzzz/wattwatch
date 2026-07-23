// Select component
import React from 'react';
import { View, Text, Pressable, StyleSheet, ViewStyle, TextStyle } from 'react-native';
import { useTheme } from '@/hooks/use-theme';

export interface SelectOption {
  value: string;
  label: string;
}

export interface SelectProps {
  label?: string;
  placeholder?: string;
  options: SelectOption[];
  value?: string;
  onChange?: (value: string) => void;
  error?: string;
  helperText?: string;
  disabled?: boolean;
  style?: ViewStyle;
  containerStyle?: ViewStyle;
  testID?: string;
}

export const Select = ({
  label,
  placeholder = 'Select an option',
  options,
  value,
  onChange,
  error,
  helperText,
  disabled = false,
  style,
  containerStyle,
  testID,
}: SelectProps) => {
  const theme = useTheme();
  const [isOpen, setIsOpen] = React.useState(false);
  const hasError = !!error;

  const handleOptionPress = (optionValue: string) => {
    onChange?.(optionValue);
    setIsOpen(false);
  };

  const selectedOption = options.find((opt) => opt.value === value);

  return (
    <View style={[styles.container, containerStyle]} testID={testID ? `${testID}-container` : undefined}>
      {label && <Text style={[styles.label, hasError && styles.labelError]}>{label}</Text>}
      <Pressable
        onPress={disabled ? undefined : () => setIsOpen(!isOpen)}
        disabled={disabled}
        style={[
          styles.selectWrapper,
          hasError && styles.selectWrapperError,
          disabled && styles.selectWrapperDisabled,
          style,
        ]}
        testID={testID}
      >
        <Text
          style={[
            styles.selectedText,
            !value && styles.placeholderText,
            hasError && styles.selectedTextError,
          ]}
        >
          {selectedOption?.label || placeholder}
        </Text>
        <View style={styles.dropdownIcon}>
          <Text style={[styles.dropdownIconText, isOpen && styles.dropdownIconTextOpen]}>
            ▼
          </Text>
        </View>
      </Pressable>
      {error && <Text style={styles.errorText}>{error}</Text>}
      {!error && helperText && <Text style={styles.helperText}>{helperText}</Text>}
      {isOpen && (
        <View style={styles.dropdown} testID={testID ? `${testID}-dropdown` : undefined}>
          {options.map((option) => (
            <Pressable
              key={option.value}
              onPress={() => handleOptionPress(option.value)}
              style={[
                styles.option,
                value === option.value && styles.optionSelected,
              ]}
              testID={testID ? `${testID}-option-${option.value}` : undefined}
            >
              <Text
                style={[
                  styles.optionText,
                  value === option.value && styles.optionTextSelected,
                ]}
              >
                {option.label}
              </Text>
              {value === option.value && (
                <Text style={styles.checkIcon}>✓</Text>
              )}
            </Pressable>
          ))}
        </View>
      )}
    </View>
  );
};

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
  selectWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    minHeight: 52,
  },
  selectWrapperError: {
    borderColor: '#DC2626',
    borderWidth: 2,
  },
  selectWrapperDisabled: {
    backgroundColor: '#F1F5F9',
  },
  selectedText: {
    fontSize: 16,
    color: '#1E293B',
    flex: 1,
  },
  placeholderText: {
    color: '#94A3B8',
  },
  selectedTextError: {
    color: '#DC2626',
  },
  dropdownIcon: {
    paddingLeft: 8,
  },
  dropdownIconText: {
    fontSize: 12,
    color: '#64748B',
    transform: [{ rotate: '0deg' }],
  },
  dropdownIconTextOpen: {
    transform: [{ rotate: '180deg' }],
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
  dropdown: {
    position: 'absolute',
    top: '100%',
    left: 0,
    right: 0,
    marginTop: 4,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 4,
    zIndex: 100,
    maxHeight: 200,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  optionSelected: {
    backgroundColor: '#E6F0FA',
  },
  optionText: {
    fontSize: 16,
    color: '#1E293B',
    flex: 1,
  },
  optionTextSelected: {
    color: '#0066CC',
    fontWeight: '600',
  },
  checkIcon: {
    fontSize: 16,
    color: '#0066CC',
    fontWeight: 'bold',
  },
});

export default Select;