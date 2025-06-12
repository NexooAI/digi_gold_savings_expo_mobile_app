import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

interface DetailRowProps {
  label: string;
  value: string | React.ReactNode;
  isAmount?: boolean;
  error?: boolean;
}

export const DetailRow: React.FC<DetailRowProps> = ({
  label,
  value,
  isAmount = false,
  error = false,
}) => {
  const renderValue = () => {
    if (typeof value === 'string') {
      return (
        <Text style={[
          styles.value,
          isAmount && styles.amount,
          error && styles.errorText,
        ]}>
          {isAmount ? `₹${value}` : value}
        </Text>
      );
    }
    return value;
  };

  return (
    <View style={styles.container}>
      <Text style={styles.label}>{label}</Text>
      {renderValue()}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 4,
  },
  label: {
    fontSize: 14,
    color: '#666',
    flex: 1,
  },
  value: {
    fontSize: 14,
    color: '#333',
    fontWeight: '500',
    textAlign: 'right',
    flex: 1,
  },
  amount: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a237e',
  },
  errorText: {
    color: '#FF3B30',
  },
}); 