import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { theme } from '@/constants/theme';

interface DetailRowProps {
  label: string;
  value: string | number | React.ReactNode;
  isAmount?: boolean;
  onPress?: () => void;
  labelStyle?: object;
  valueStyle?: object;
  containerStyle?: object;
  showDivider?: boolean;
  icon?: React.ReactNode;
}

export const DetailRow: React.FC<DetailRowProps> = ({
  label,
  value,
  isAmount = false,
  onPress,
  labelStyle,
  valueStyle,
  containerStyle,
  showDivider = false,
  icon,
}) => {
  const Container = onPress ? TouchableOpacity : View;

  return (
    <Container 
      style={[
        styles.container,
        showDivider && styles.divider,
        containerStyle
      ]}
      onPress={onPress}
    >
      <View style={styles.content}>
        <View style={styles.labelContainer}>
          {icon}
          <Text style={[styles.label, labelStyle]}>{label}</Text>
        </View>
        {isAmount ? (
          <Text style={[styles.amountValue, valueStyle]}>₹{value}</Text>
        ) : (
          typeof value === 'string' || typeof value === 'number' ? (
            <Text style={[styles.value, valueStyle]}>{value}</Text>
          ) : value
        )}
      </View>
    </Container>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingVertical: 8,
  },
  content: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  labelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  label: {
    fontSize: 13,
    color: '#666',
    fontWeight: '500',
  },
  value: {
    fontSize: 13,
    color: '#333',
    fontWeight: '600',
  },
  amountValue: {
    fontSize: 16,
    color: theme.colors.primary,
    fontWeight: 'bold',
  },
  divider: {
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
}); 