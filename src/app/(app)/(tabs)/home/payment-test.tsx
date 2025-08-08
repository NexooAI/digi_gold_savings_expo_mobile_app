import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import TestPaymentScreen from '@/payments/brands/TestPaymentScreen';

export default function PaymentTestScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Payment Brands Test</Text>
      <TestPaymentScreen />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    padding: 20,
    color: '#333',
  },
}); 