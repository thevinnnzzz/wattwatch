// Empty State component
import React from 'react';
import { View, Text, Image, StyleSheet, ViewStyle, TextStyle, Pressable } from 'react-native';
import { useTheme } from '@/hooks/use-theme';

export interface EmptyStateProps {
  illustration?: React.ReactNode;
  title: string;
  description?: string;
  action?: {
    label: string;
    onPress: () => void;
    variant?: 'primary' | 'secondary' | 'outline';
  };
  secondaryAction?: {
    label: string;
    onPress: () => void;
  };
  style?: ViewStyle;
  titleStyle?: TextStyle;
  descriptionStyle?: TextStyle;
  testID?: string;
}

export const EmptyState = ({
  illustration,
  title,
  description,
  action,
  secondaryAction,
  style,
  titleStyle,
  descriptionStyle,
  testID,
}: EmptyStateProps) => {
  const theme = useTheme();

  const getButtonStyles = (variant: 'primary' | 'secondary' | 'outline' = 'primary') => {
    switch (variant) {
      case 'primary':
        return {
          button: { backgroundColor: theme.colors.primary },
          text: { color: theme.colors.textOnPrimary },
        };
      case 'secondary':
        return {
          button: { backgroundColor: theme.colors.secondary },
          text: { color: theme.colors.textOnSecondary },
        };
      case 'outline':
        return {
          button: {
            backgroundColor: 'transparent',
            borderWidth: 2,
            borderColor: theme.colors.primary,
          },
          text: { color: theme.colors.primary },
        };
      default:
        return {
          button: { backgroundColor: theme.colors.primary },
          text: { color: theme.colors.textOnPrimary },
        };
    }
  };

  return (
    <View style={[styles.container, style]} testID={testID}>
      <View style={[styles.illustrationContainer, { backgroundColor: theme.colors.surfaceVariant }]}>
        {illustration || (
          <View style={[styles.defaultIllustration, { backgroundColor: theme.colors.primaryLight }]}>
            <Text style={styles.illustrationIcon}>📭</Text>
          </View>
        )}
      </View>
      <Text style={[styles.title, { color: theme.colors.text }, titleStyle]}>
        {title}
      </Text>
      {description && (
        <Text
          style={[
            styles.description,
            { color: theme.colors.textSecondary },
            descriptionStyle,
          ]}
          numberOfLines={3}
        >
          {description}
        </Text>
      )}
      {(action || secondaryAction) && (
        <View style={styles.actions}>
          {secondaryAction && (
            <Pressable
              style={styles.secondaryAction}
              onPress={secondaryAction.onPress}
            >
              <Text style={[styles.secondaryActionText, { color: theme.colors.primary }]}>{secondaryAction.label}</Text>
            </Pressable>
          )}
          {action && (
            <Pressable
              style={[
                styles.actionButton,
                getButtonStyles(action.variant).button,
              ]}
              onPress={action.onPress}
            >
              <Text style={[styles.actionText, getButtonStyles(action.variant).text]}>
                {action.label}
              </Text>
            </Pressable>
          )}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
    gap: 24,
  },
  illustrationContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    alignItems: 'center',
    justifyContent: 'center',
  },
  defaultIllustration: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  illustrationIcon: {
    fontSize: 40,
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
    textAlign: 'center',
    lineHeight: 28,
  },
  description: {
    fontSize: 16,
    fontWeight: '400',
    textAlign: 'center',
    lineHeight: 24,
    maxWidth: 280,
  },
  actions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  actionButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },
  secondaryAction: {
    paddingVertical: 12,
  },
  secondaryActionText: {
    fontSize: 16,
    fontWeight: '600',
  },
  actionText: {
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
});

export default EmptyState;
