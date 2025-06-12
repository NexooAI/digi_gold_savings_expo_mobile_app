import React, { useEffect, useState } from 'react';
import { View, StyleSheet, SafeAreaView, ActivityIndicator, Text, TouchableOpacity } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { WebView } from 'react-native-webview';
import { theme } from '@/constants/theme';
import { Header } from '@/components';
import { MaterialCommunityIcons } from '@expo/vector-icons';

export default function PaymentScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [webViewKey, setWebViewKey] = useState(0);

  const handleNavigationStateChange = (navState: any) => {
    console.log('Navigation state changed:', navState);
    
    // Check if the URL contains status parameters
    if (navState.url.includes('status=')) {
      const url = new URL(navState.url);
      const status = url.searchParams.get('status');
      const transactionId = url.searchParams.get('transaction_id');
      const orderId = url.searchParams.get('order_id');
      const errorMessage = url.searchParams.get('error_message');

      console.log('Payment status:', status);
      console.log('Transaction ID:', transactionId);
      console.log('Order ID:', orderId);
      console.log('Error message:', errorMessage);

      if (status === 'success') {
        router.replace({
          pathname: '/(tabs)/home/payment-success',
          params: {
            transactionId,
            orderId,
            amount: params.amount,
            userDetails: params.userDetails,
          },
        });
      } else if (status === 'failure' || status === 'cancel') {
        router.replace({
          pathname: '/(tabs)/home/payment-failure',
          params: {
            transactionId,
            orderId,
            amount: params.amount,
            userDetails: params.userDetails,
            errorMessage: errorMessage || 'Payment processing failed',
          },
        });
      }
    }
  };

  const handleError = (syntheticEvent: any) => {
    const { nativeEvent } = syntheticEvent;
    console.error('WebView error:', nativeEvent);
    setError(nativeEvent.description || 'Failed to load payment page');
  };

  const handleReload = () => {
    setError(null);
    setWebViewKey(prev => prev + 1);
  };

  if (error) {
    return (
      <SafeAreaView style={styles.container}>
        <Header 
          onBack={() => router.back()}
          title="Payment"
          rightIcon="help-circle-outline"
          onRightPress={() => {
            // Implement help functionality
          }}
        />
        <View style={styles.errorContainer}>
          <MaterialCommunityIcons name="alert-circle" size={60} color="#FF3B30" />
          <Text style={styles.errorTitle}>Payment Page Error</Text>
          <Text style={styles.errorMessage}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={handleReload}>
            <MaterialCommunityIcons name="refresh" size={20} color="#FFFFFF" />
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <Header 
        onBack={() => router.back()}
        title="Payment"
        rightIcon="help-circle-outline"
        onRightPress={() => {
          // Implement help functionality
        }}
      />

      {isLoading && (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#FFC857" />
          <Text style={styles.loadingText}>Loading payment page...</Text>
        </View>
      )}

      <WebView
        key={webViewKey}
        source={{ uri: params.paymentUrl as string }}
        style={styles.webview}
        onNavigationStateChange={handleNavigationStateChange}
        onError={handleError}
        onLoadStart={() => setIsLoading(true)}
        onLoadEnd={() => setIsLoading(false)}
        javaScriptEnabled={true}
        domStorageEnabled={true}
        startInLoadingState={true}
        scalesPageToFit={true}
        incognito={true}
        cacheEnabled={false}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  webview: {
    flex: 1,
  },
  loadingContainer: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#666666',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#FFFFFF',
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333333',
    marginTop: 16,
    marginBottom: 8,
  },
  errorMessage: {
    fontSize: 16,
    color: '#666666',
    textAlign: 'center',
    marginBottom: 24,
  },
  retryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFC857',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    gap: 8,
  },
  retryButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
}); 