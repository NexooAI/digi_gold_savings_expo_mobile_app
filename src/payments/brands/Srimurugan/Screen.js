import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert, Modal } from 'react-native';
import { useRouter } from 'expo-router';
import { usePaymentSocket } from '../../hooks/usePaymentSocket';
import PaymentWebView from '../../components/PaymentWebView';
import SrimuruganConfig from './Config';

export default function SrimuruganScreen() {
  const [isLoading, setIsLoading] = useState(false);
  const [showWebView, setShowWebView] = useState(false);
  const [paymentUrl, setPaymentUrl] = useState('');
  const [transactionId, setTransactionId] = useState('');
  const [statusText, setStatusText] = useState('Ready to pay');
  
  const router = useRouter();

  // Initialize payment socket
  const { socket, handleCancel } = usePaymentSocket({
    onPaymentSuccess: (data) => {
      console.log('Srimurugan Payment Success:', data);
      setStatusText('Payment successful!');
      setShowWebView(false);
      
      // Disconnect socket before navigation
      if (socket && socket.connected) {
        socket.disconnect();
      }
      
      router.replace({
        pathname: "/(tabs)/home/payment-success",
        params: {
          txnId: data?.paymentResponse?.txn_id,
          orderId: data?.paymentResponse?.order_id,
          amount: data?.paymentResponse?.amount,
          brandName: SrimuruganConfig.brandName
        },
      });
    },
    onPaymentFailure: (data) => {
      console.log('Srimurugan Payment Failure:', data);
      setStatusText('Payment failed');
      setShowWebView(false);
      
      // Disconnect socket before navigation
      if (socket && socket.connected) {
        socket.disconnect();
      }
      
      router.replace({
        pathname: "/(tabs)/home/payment-failure",
        params: {
          message: data?.paymentResponse?.txn_detail?.error_message ||
                   data?.paymentResponse?.txn_detail?.response_message ||
                   "Payment Failed",
          orderId: data?.paymentResponse?.order_id,
          txnId: data?.paymentResponse?.txn_id,
          amount: data?.paymentResponse?.amount,
          status: data?.paymentResponse?.txn_detail?.status,
          brandName: SrimuruganConfig.brandName
        },
      });
    },
    onPaymentError: (error) => {
      console.error('Srimurugan Payment Error:', error);
      setStatusText('Payment error occurred');
      setShowWebView(false);
      Alert.alert(
        "Payment Error",
        error?.message || "An error occurred during payment processing.",
        [{ text: "OK", onPress: () => router.back() }]
      );
    },
    onPaymentExpired: () => {
      setStatusText('Payment session expired');
      setShowWebView(false);
      Alert.alert(
        "Payment Expired",
        "Your payment session has expired. Please try again.",
        [{ text: "OK", onPress: () => router.back() }]
      );
    },
    parsedUserDetails: {
      // Mock user details - replace with actual user data
      userId: 'user789',
      amount: 2000,
      orderId: null
    },
    router,
    orderId: transactionId
  });

  const handlePayNow = async () => {
    try {
      setIsLoading(true);
      setStatusText('Creating payment...');

      // Call Srimurugan's create-payment API
      const response = await fetch(SrimuruganConfig.apiEndpoint, {
        method: 'POST',
        headers: SrimuruganConfig.headers,
        body: JSON.stringify({
          amount: 2000, // Replace with actual amount
          currency: 'INR',
          customerId: 'user789', // Replace with actual customer ID
          description: 'Srimurugan Payment'
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const paymentData = await response.json();
      const txnId = paymentData.transactionId || paymentData.txn_id;
      
      if (!txnId) {
        throw new Error('No transaction ID received from payment API');
      }

      setTransactionId(txnId);
      setStatusText('Payment created, opening payment gateway...');

      // Construct payment URL with transaction ID
      const fullPaymentUrl = `${SrimuruganConfig.basePaymentUrl}/payment/${txnId}`;
      setPaymentUrl(fullPaymentUrl);
      setShowWebView(true);

    } catch (error) {
      console.error('Error creating Srimurugan payment:', error);
      setStatusText('Failed to create payment');
      Alert.alert(
        "Payment Error",
        "Failed to create payment. Please try again.",
        [{ text: "OK" }]
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleWebViewClose = () => {
    setShowWebView(false);
    setStatusText('Payment cancelled');
    handleCancel();
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{SrimuruganConfig.brandName} Payment</Text>
      <Text style={styles.status}>{statusText}</Text>
      
      <TouchableOpacity
        style={[styles.payButton, isLoading && styles.payButtonDisabled]}
        onPress={handlePayNow}
        disabled={isLoading}
      >
        <Text style={styles.payButtonText}>
          {isLoading ? 'Creating Payment...' : 'Pay Now'}
        </Text>
      </TouchableOpacity>

      {showWebView && (
        <Modal visible={true} animationType="slide" presentationStyle="fullScreen">
          <PaymentWebView
            url={paymentUrl}
            orderId={transactionId}
            userDetails={JSON.stringify({
              userId: 'user789',
              amount: 2000,
              orderId: transactionId
            })}
          />
        </Modal>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#f5f5f5'
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    color: '#333'
  },
  status: {
    fontSize: 16,
    marginBottom: 30,
    color: '#666',
    textAlign: 'center'
  },
  payButton: {
    backgroundColor: '#FF9500',
    paddingHorizontal: 40,
    paddingVertical: 15,
    borderRadius: 8,
    minWidth: 200
  },
  payButtonDisabled: {
    backgroundColor: '#ccc'
  },
  payButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center'
  }
}); 