import React, { useEffect, useCallback, useState, useRef } from 'react';
import {
  View,
  StyleSheet,
  ActivityIndicator,
  BackHandler,
  Platform,
  Alert,
  Text,
  TouchableOpacity,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { WebView } from 'react-native-webview';
import { SafeAreaView } from 'react-native-safe-area-context';
import { usePaymentSocket } from '../../../../hooks/usePaymentSocket';
import { theme } from '@/constants/theme';
import { PaymentStatusUpdate } from './types/payment.types';

const PaymentWebViewNew = () => {
  const router = useRouter();
  const { paymentUrl } = useLocalSearchParams();
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [loadingTimeout, setLoadingTimeout] = useState(false);
  const webViewRef = useRef<WebView>(null);
  const loadingTimerRef = useRef<NodeJS.Timeout>();

  const { emitPaymentEvent } = usePaymentSocket({
    onPaymentSuccess: (data: PaymentStatusUpdate) => {
      router.push({
        pathname: "/(tabs)/home/payment-success",
        params: {
          amount: data.paymentResponse.amount,
          txnId: data.paymentResponse.txn_id,
          orderId: data.paymentResponse.order_id,
        }
      });
    },
    onPaymentFailure: (data: PaymentStatusUpdate) => {
      Alert.alert(
        "Payment Failed",
        data.paymentResponse.payment_gateway_response?.resp_message || 
        "Your payment has failed. Please try again.",
        [
          {
            text: "OK",
            onPress: () => router.back()
          }
        ]
      );
    },
    onPaymentError: (error: any) => {
      console.error("Error processing payment status update:", error);
      Alert.alert(
        "Payment Error",
        "An error occurred while processing the transaction.",
        [
          {
            text: "OK",
            onPress: () => router.back()
          }
        ]
      );
    }
  });

  const handleNavigationStateChange = useCallback((navState: any) => {
    const { url } = navState;
    console.log('Navigation URL:', url); // Debug log
    
    // Clear loading timeout when navigation changes
    if (loadingTimerRef.current) {
      clearTimeout(loadingTimerRef.current);
    }

    // Handle success URL
    if (url.includes('payment-success')) {
      setIsLoading(false);
      emitPaymentEvent('payment_success', {
        url,
        timestamp: new Date().toISOString()
      });
      return;
    }

    // Handle failure URL
    if (url.includes('payment-failure')) {
      setIsLoading(false);
      emitPaymentEvent('payment_failed', {
        url,
        timestamp: new Date().toISOString()
      });
      return;
    }

    // Handle error URL
    if (url.includes('payment-error')) {
      setIsLoading(false);
      emitPaymentEvent('payment_error', {
        url,
        timestamp: new Date().toISOString()
      });
      return;
    }

    // Handle netbanking URLs
    if (url.includes('netbanking')) {
      setIsLoading(false);
      // Set a timeout to show loading if the page takes too long
      loadingTimerRef.current = setTimeout(() => {
        setLoadingTimeout(true);
      }, 30000); // 30 seconds timeout
    }
  }, [emitPaymentEvent]);

  const handleLoadStart = useCallback(() => {
    setIsLoading(false);
    setLoadingTimeout(false);
    if (loadingTimerRef.current) {
      clearTimeout(loadingTimerRef.current);
    }
  }, []);

  const handleLoadEnd = useCallback(() => {
    setIsLoading(false);
    setLoadingTimeout(false);
    if (loadingTimerRef.current) {
      clearTimeout(loadingTimerRef.current);
    }
  }, []);

  const handleError = useCallback((syntheticEvent: any) => {
    const { nativeEvent } = syntheticEvent;
    console.error('WebView error:', nativeEvent);
    setHasError(true);
    setIsLoading(false);
    emitPaymentEvent('payment_error', {
      error: nativeEvent.description,
      timestamp: new Date().toISOString()
    });
  }, [emitPaymentEvent]);

  useEffect(() => {
    const backHandler = BackHandler.addEventListener(
      'hardwareBackPress',
      () => {
        Alert.alert(
          'Cancel Payment',
          'Are you sure you want to cancel the payment?',
          [
            {
              text: 'No',
              style: 'cancel',
              onPress: () => {}
            },
            {
              text: 'Yes',
              style: 'destructive',
              onPress: () => {
                emitPaymentEvent('payment_cancelled', {
                  timestamp: new Date().toISOString()
                });
                router.back();
              }
            }
          ]
        );
        return true;
      }
    );

    return () => {
      backHandler.remove();
      if (loadingTimerRef.current) {
        clearTimeout(loadingTimerRef.current);
      }
    };
  }, [router, emitPaymentEvent]);

  const handleReload = useCallback(() => {
    if (webViewRef.current) {
      webViewRef.current.reload();
    }
  }, []);

  if (!paymentUrl) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {isLoading && (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text style={styles.loadingText}>Loading payment gateway...</Text>
        </View>
      )}
      
      {loadingTimeout && (
        <View style={styles.timeoutContainer}>
          <Text style={styles.timeoutText}>The page is taking longer than expected to load.</Text>
          <TouchableOpacity style={styles.reloadButton} onPress={handleReload}>
            <Text style={styles.reloadButtonText}>Reload Page</Text>
          </TouchableOpacity>
        </View>
      )}
      
      <WebView
        ref={webViewRef}
        source={{ uri: paymentUrl as string }}
        style={styles.webview}
        onLoadStart={handleLoadStart}
        onLoadEnd={handleLoadEnd}
        onNavigationStateChange={handleNavigationStateChange}
        onError={handleError}
        javaScriptEnabled={true}
        domStorageEnabled={true}
        startInLoadingState={true}
        scalesPageToFit={true}
        incognito={true}
        cacheEnabled={false}
        cacheMode="LOAD_NO_CACHE"
        onHttpError={(syntheticEvent) => {
          const { nativeEvent } = syntheticEvent;
          console.error('WebView HTTP error:', nativeEvent);
          setHasError(true);
          setIsLoading(false);
          emitPaymentEvent('payment_error', {
            error: `HTTP Error: ${nativeEvent.statusCode}`,
            timestamp: new Date().toISOString()
          });
        }}
        renderLoading={() => (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={theme.colors.primary} />
            <Text style={styles.loadingText}>Loading payment gateway...</Text>
          </View>
        )}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  webview: {
    flex: 1,
  },
  loadingContainer: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1,
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: theme.colors.primary,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  timeoutContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    padding: 20,
    zIndex: 2,
    alignItems: 'center',
  },
  timeoutText: {
    fontSize: 16,
    color: theme.colors.textPrimary,
    textAlign: 'center',
    marginBottom: 10,
  },
  reloadButton: {
    backgroundColor: theme.colors.primary,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 5,
  },
  reloadButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default PaymentWebViewNew; 