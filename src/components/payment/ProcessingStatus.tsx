import React from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

interface ProcessingStatusProps {
  status: string;
  spinnerColor?: string;
  textColor?: string;
  backgroundColor?: string;
  style?: any;
  showSpinner?: boolean;
  icon?: string;
}

export const ProcessingStatus: React.FC<ProcessingStatusProps> = ({
  status,
  spinnerColor = '#FFC857',
  textColor = '#333',
  backgroundColor = '#FFFFFF',
  style,
  showSpinner = true,
  icon,
}) => {
  return (
    <View style={[styles.container, { backgroundColor }, style]}>
      {showSpinner && (
        <ActivityIndicator size="small" color={spinnerColor} style={styles.spinner} />
      )}
      {icon && (
        <MaterialCommunityIcons
          name={icon}
          size={20}
          color={spinnerColor}
          style={styles.icon}
        />
      )}
      <Text style={[styles.text, { color: textColor }]}>{status}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 8,
    gap: 8,
  },
  spinner: {
    marginRight: 8,
  },
  icon: {
    marginRight: 8,
  },
  text: {
    fontSize: 14,
    fontWeight: '500',
  },
}); 