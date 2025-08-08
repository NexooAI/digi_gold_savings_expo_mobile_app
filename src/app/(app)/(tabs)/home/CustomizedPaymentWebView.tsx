import React, { useEffect, useState } from "react";
import { View, Modal, StyleSheet, Alert, Text, TouchableOpacity } from "react-native";
import { WebView } from "react-native-webview";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useCustomizedPaymentSocket, BANK_CONFIGS, type CustomerPaymentData } from "@/hooks/useCustomizedPaymentSocket";
import { theme } from "@/constants/theme";

interface CustomizedPaymentWebViewProps {
  visible: boolean;
  onClose: () => void;
}

export default function CustomizedPaymentWebView({ visible, onClose }: CustomizedPaymentWebViewProps) {
  const params = useLocalSearchParams();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [paymentStatus, setPaymentStatus] = useState<'pending' | 'processing' | 'success' | 'failed' | 'cancelled'>('pending');

  // Extract customer and bank information from params
  const customerData: CustomerPaymentData = {
    customerId: params.customerId as string || 'default_customer',
    customerName: params.customerName as string || 'Customer',
    bankDetails: {
      bankName: params.bankName as string || 'HDFC',
      accountNumber: params.accountNumber as string || '',
      ifscCode: params.ifscCode as string || '',
      accountType: (params.accountType as 'savings' | 'current' | 'business') || 'savings'
    },
    paymentPreferences: {
      preferredPaymentMethod: (params.paymentMethod as 'upi' | 'netbanking' | 'card' | 'wallet') || 'netbanking',
      autoRetry: params.autoRetry === 'true',
      notificationPreferences: (params.notificationPreferences as 'sms' | 'email' | 'push' | 'all') || 'all'
    },
    customFields: params.customFields ? JSON.parse(params.customFields as string) : {}
  };

  // Get bank configuration based on customer's bank
  const bankConfig = BANK_CONFIGS[customerData.bankDetails.bankName] || BANK_CONFIGS['HDFC'];

  // Initialize customized payment socket
  const {
    socket,
    handleCancel,
    retryPayment,
    isConnected,
    bankConfig: currentBankConfig,
    retryCount
  } = useCustomizedPaymentSocket({
    bankConfig,
    customerData,
    orderId: params.orderId as string,
    amount: parseFloat(params.amount as string) || 0,
    currency: params.currency as string || 'INR',
    onPaymentSuccess: (data) => {
      console.log('✅ Payment successful:', data);
      setPaymentStatus('success');
      
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
          bankName: customerData.bankDetails.bankName,
          customerName: customerData.customerName
        },
      });
    },
    onPaymentFailure: (data) => {
      console.log('❌ Payment failed:', data);
      setPaymentStatus('failed');
      
      // Disconnect socket before navigation
      if (socket && socket.connected) {
        socket.disconnect();
      }
      
      router.replace({
        pathname: "/(tabs)/home/payment-failure",
        params: {
          message: data?.message || 
            (data?.paymentResponse?.txn_detail as any)?.error_message ||
            (data?.paymentResponse?.txn_detail as any)?.response_message ||
            "Payment Failed",
          orderId: data?.paymentResponse?.order_id,
          txnId: data?.paymentResponse?.txn_id,
          amount: data?.paymentResponse?.amount, 
          status: data?.paymentResponse?.txn_detail?.status,
          bankName: customerData.bankDetails.bankName,
          customerName: customerData.customerName
        },
      });
    },
    onPaymentError: (error) => {
      console.error('🚨 Payment error:', error);
      setPaymentStatus('failed');
      
      Alert.alert(
        `${customerData.bankDetails.bankName} Payment Error`,
        error?.message || "An error occurred during payment processing. Please try again.",
        [
          {
            text: "Retry",
            onPress: () => {
              if (retryPayment()) {
                setPaymentStatus('processing');
              } else {
                Alert.alert("Max Retries Reached", "Please try again later or contact support.");
              }
            },
          },
          {
            text: "Cancel",
            onPress: () => {
              handleCancel();
              onClose();
            },
          },
        ]
      );
    },
    onPaymentExpired: () => {
      console.log('⏰ Payment expired');
      setPaymentStatus('failed');
      
      Alert.alert(
        `${customerData.bankDetails.bankName} Payment Expired`,
        "Your payment session has expired. Please try again to complete the transaction.",
        [
          {
            text: "OK",
            onPress: () => {
              onClose();
              router.back();
            },
          },
        ]
      );
    },
    onBankSpecificEvent: (eventName, data) => {
      console.log(`🏦 ${customerData.bankDetails.bankName} specific event:`, eventName, data);
      
      // Handle bank-specific events
      switch (eventName) {
        case 'hdfc_otp_required':
        case 'sbi_otp_verification':
          Alert.alert(
            `${customerData.bankDetails.bankName} OTP Required`,
            "Please enter the OTP sent to your registered mobile number to complete the payment.",
            [{ text: "OK" }]
          );
          break;
        case 'icici_secure_pay':
        case 'axis_secure_pay':
          Alert.alert(
            `${customerData.bankDetails.bankName} SecurePay`,
            "Please complete the secure payment verification to proceed.",
            [{ text: "OK" }]
          );
          break;
        default:
          // Handle other bank-specific events
          break;
      }
    },
    retryStrategy: customerData.paymentPreferences.autoRetry ? 'exponential' : 'immediate'
  });

  // Cleanup socket on component unmount
  useEffect(() => {
    return () => {
      if (socket && socket.connected) {
        socket.disconnect();
      }
    };
  }, [socket]);

  const handleWebViewNavigationStateChange = (navState: any) => {
    console.log("Payment Navigation State:", {
      url: navState.url,
      title: navState.title,
      loading: navState.loading,
      canGoBack: navState.canGoBack,
      bankName: customerData.bankDetails.bankName
    });

    const url = navState.url.toLowerCase();
    
    // Bank-specific URL patterns for cancellation/failure
    const cancelPatterns = [
      '/cancel',
      '/error', 
      '/failed',
      'payment',
      'status=failed'
    ];

    // Add bank-specific patterns
    switch (customerData.bankDetails.bankName) {
      case 'HDFC':
        cancelPatterns.push('hdfc/cancel', 'hdfc/error', 'hdfc/failed');
        break;
      case 'ICICI':
        cancelPatterns.push('icici/cancel', 'icici/error', 'icici/failed');
        break;
      case 'SBI':
        cancelPatterns.push('sbi/cancel', 'sbi/error', 'sbi/failed');
        break;
      case 'AXIS':
        cancelPatterns.push('axis/cancel', 'axis/error', 'axis/failed');
        break;
      case 'KOTAK':
        cancelPatterns.push('kotak/cancel', 'kotak/error', 'kotak/failed');
        break;
    }

    // Check if URL contains any cancel/failure patterns
    const shouldCancel = cancelPatterns.some(pattern => url.includes(pattern));
    
    if (shouldCancel) {
      console.log(`❌ ${customerData.bankDetails.bankName} payment cancelled/failed detected:`, url);
      
      // Disconnect socket before handling cancel
      if (socket && socket.connected) {
        socket.disconnect();
      }
      
      setPaymentStatus('cancelled');
      handleCancel();
    }
  };

  const handleWebViewLoadStart = () => {
    setIsLoading(true);
    setPaymentStatus('processing');
  };

  const handleWebViewLoadEnd = () => {
    setIsLoading(false);
  };

  const handleWebViewError = (error: any) => {
    console.error(`${customerData.bankDetails.bankName} WebView error:`, error);
    setPaymentStatus('failed');
    
    Alert.alert(
      `${customerData.bankDetails.bankName} Payment Error`,
      "Failed to load payment page. Please check your internet connection and try again.",
      [
        {
          text: "Retry",
          onPress: () => {
            // Reload the WebView
            setPaymentStatus('pending');
          },
        },
        {
          text: "Cancel",
          onPress: () => {
            handleCancel();
            onClose();
          },
        },
      ]
    );
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="fullScreen">
      <View style={styles.container}>
        {/* Bank-specific header */}
        <View style={[styles.header, { backgroundColor: getBankColor(customerData.bankDetails.bankName) }]}>
          <View style={styles.headerContent}>
            <Text style={styles.bankName}>{customerData.bankDetails.bankName}</Text>
            <Text style={styles.customerName}>{customerData.customerName}</Text>
            <Text style={styles.amount}>₹{params.amount}</Text>
          </View>
          
          {/* Connection status indicator */}
          <View style={styles.statusContainer}>
            <View style={[styles.statusDot, { backgroundColor: isConnected ? '#4CAF50' : '#F44336' }]} />
            <Text style={styles.statusText}>
              {isConnected ? 'Connected' : 'Disconnected'}
            </Text>
          </View>
          
          {/* Retry count indicator */}
          {retryCount > 0 && (
            <View style={styles.retryContainer}>
              <Text style={styles.retryText}>Retry: {retryCount}/{currentBankConfig.retryAttempts}</Text>
            </View>
          )}
        </View>

        {/* Payment status indicator */}
        {paymentStatus !== 'pending' && (
          <View style={[styles.statusBar, { backgroundColor: getStatusColor(paymentStatus) }]}>
            <Text style={styles.statusBarText}>
              {getStatusText(paymentStatus, customerData.bankDetails.bankName)}
            </Text>
          </View>
        )}

        {/* WebView */}
        <WebView
          source={{ uri: params.url as string }}
          style={styles.webview}
          onNavigationStateChange={handleWebViewNavigationStateChange}
          onLoadStart={handleWebViewLoadStart}
          onLoadEnd={handleWebViewLoadEnd}
          onError={handleWebViewError}
          startInLoadingState={true}
          renderLoading={() => (
            <View style={styles.loadingContainer}>
              <Text style={styles.loadingText}>
                Loading {customerData.bankDetails.bankName} payment page...
              </Text>
            </View>
          )}
        />

        {/* Bank-specific footer */}
        <View style={[styles.footer, { backgroundColor: getBankColor(customerData.bankDetails.bankName) }]}>
          <TouchableOpacity 
            style={styles.cancelButton}
            onPress={() => {
              handleCancel();
              onClose();
            }}
          >
            <Text style={styles.cancelButtonText}>Cancel Payment</Text>
          </TouchableOpacity>
          
          <Text style={styles.footerText}>
            Secure payment powered by {customerData.bankDetails.bankName}
          </Text>
        </View>
      </View>
    </Modal>
  );
}

// Helper functions for bank-specific styling
const getBankColor = (bankName: string): string => {
  switch (bankName) {
    case 'HDFC': return '#00457C';
    case 'ICICI': return '#FF6B35';
    case 'SBI': return '#1E3A8A';
    case 'AXIS': return '#DC2626';
    case 'KOTAK': return '#059669';
    default: return '#00457C';
  }
};

const getStatusColor = (status: string): string => {
  switch (status) {
    case 'success': return '#4CAF50';
    case 'failed': return '#F44336';
    case 'cancelled': return '#FF9800';
    case 'processing': return '#2196F3';
    default: return '#9E9E9E';
  }
};

const getStatusText = (status: string, bankName: string): string => {
  switch (status) {
    case 'success': return `${bankName} payment successful!`;
    case 'failed': return `${bankName} payment failed. Please try again.`;
    case 'cancelled': return `${bankName} payment cancelled.`;
    case 'processing': return `Processing ${bankName} payment...`;
    default: return 'Initializing payment...';
  }
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    padding: 16,
    paddingTop: 50,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerContent: {
    flex: 1,
  },
  bankName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 4,
  },
  customerName: {
    fontSize: 14,
    color: '#fff',
    opacity: 0.9,
    marginBottom: 2,
  },
  amount: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 16,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  statusText: {
    fontSize: 12,
    color: '#fff',
    opacity: 0.9,
  },
  retryContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  retryText: {
    fontSize: 10,
    color: '#fff',
    fontWeight: 'bold',
  },
  statusBar: {
    padding: 12,
    alignItems: 'center',
  },
  statusBarText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  webview: {
    flex: 1,
  },
  loadingContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
  },
  loadingText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
  footer: {
    padding: 16,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    marginBottom: 8,
  },
  cancelButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  footerText: {
    color: '#fff',
    fontSize: 12,
    opacity: 0.8,
  },
}); 