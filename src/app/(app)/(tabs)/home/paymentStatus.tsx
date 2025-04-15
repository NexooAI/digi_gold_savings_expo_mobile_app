import React, { useEffect, useState } from 'react';
import { View, Text, Button, Alert } from 'react-native';
import io from 'socket.io-client';



const PaymentStatusScreen = () => {
  const [paymentStatus, setPaymentStatus] = useState(null);
  const [message, setMessage] = useState('');
  
  useEffect(() => {
  // Connect to the WebSocket server
  const socket = io('http://localhost:3000'); // Replace with your server URL
  
  // Listen for the payment_status_update event
  socket.on('payment_status_update', (data) => {
  console.log('Received payment status update:', data);



  // Customize based on the status
  if (data.status === 'success') {
  setPaymentStatus('Payment Successful');
  setMessage(data.message);
  Alert.alert('Payment Successful', data.message);
  } else if (data.status === 'failure') {
  setPaymentStatus('Payment Failed');
  setMessage(data.message);
  Alert.alert('Payment Failed', data.message);
  } else if (data.status === 'pending') {
  setPaymentStatus('Payment Pending');
  setMessage(data.message);
  Alert.alert('Payment Pending', data.message);
  }
  });



  // Cleanup socket connection when the component unmounts
  return () => {
  socket.off('payment_status_update'); // Unsubscribe from event
  socket.disconnect(); // Disconnect the WebSocket
  };
  }, []);



  return (
  <View style={{ padding: 20 }}>
  <Text>Status: {paymentStatus || 'Waiting for payment status...'}</Text>
  {message && <Text>Details: {message}</Text>}
  <Button title="Check Payment Status" onPress={() => { /* Any action, if needed */ }} />
  </View>
  );
};



export default PaymentStatusScreen;