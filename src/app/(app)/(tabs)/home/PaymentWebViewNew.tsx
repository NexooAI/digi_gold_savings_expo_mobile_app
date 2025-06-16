import React, { useEffect, useCallback, useState, useRef } from "react";
import {
  View,
  StyleSheet,
  ActivityIndicator,
  BackHandler,
  Alert,
  Text,
  TouchableOpacity,
} from "react-native";
import { useLocalSearchParams, useRouter, useNavigation } from "expo-router";
import { WebView } from "react-native-webview";
import { SafeAreaView } from "react-native-safe-area-context";
import { usePaymentSocket } from "../../../../hooks/usePaymentSocket";
import { theme } from "@/constants/theme";
import { PaymentStatusUpdate } from "./types/payment.types";
import useGlobalStore from "@/store/global.store";

const PaymentWebViewNew = () => {
  const router = useRouter();
  const navigation = useNavigation();
  const {
    paymentUrl,
    totalInstallments,
    installmentNumber,
    schemeName,
    schemeId,
    chitId,
    goldWeight,
  } = useLocalSearchParams();
  const [loadingTimeout, setLoadingTimeout] = useState(false);
  const webViewRef = useRef<WebView>(null);
  const loadingTimerRef = useRef<NodeJS.Timeout>();
  const [isPaymentDone, setIsPaymentDone] = useState(false);
  const { setTabVisibility } = useGlobalStore();
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    setTabVisibility(false);
    return () => {
      setTabVisibility(true);
    };
  }, [setTabVisibility]);

  useEffect(() => {
    if (!paymentUrl) {
      setTimeout(() => {
        Alert.alert(
          "Invalid Payment",
          "Payment URL is missing. Please try again.",
          [{ text: "OK", onPress: () => router.replace("/(tabs)/home") }]
        );
      }, 500);
    } 
  }, [paymentUrl, router]);

  const { emitPaymentEvent } = usePaymentSocket({
    // onPaymentSuccess: (data: PaymentStatusUpdate) => {
    //   console.log("Payment Success Data:", data);
    //   if (!data?.paymentResponse?.txn_id || !data?.paymentResponse?.order_id) {
    //     Alert.alert(
    //       "Payment Error",
    //       "Some payment details are missing. Please contact support.",
    //       [{ text: "OK", onPress: () => router.replace("/(tabs)/home") }]
    //     );
    //     return;
    //   }
    //   setIsPaymentDone(true);
    //   setTabVisibility(true);
    //   router.push({
    //     pathname: "/(app)/(tabs)/home/payment-success",
    //     params: {
    //       amount: data?.paymentResponse?.amount?.toString() || "",
    //       txnId: data?.paymentResponse?.txn_id || "",
    //       orderId: data?.paymentResponse?.order_id || "",
    //       totalInstallments: totalInstallments?.toString() || "",
    //       installmentNumber: installmentNumber?.toString() || "",
    //       schemeName: schemeName || "",
    //       schemeId: schemeId?.toString() || "",
    //       chitId: chitId?.toString() || "",
    //       goldWeight: goldWeight?.toString() || "",
    //       paymentMethod: "Online Payment",
    //       paymentDate: new Date().toISOString(),
    //     },
    //   });
    // },
    // onPaymentFailure: (data: PaymentStatusUpdate) => {
    //   setTabVisibility(true);
    //   router.replace({
    //     pathname: "/(tabs)/home/payment-failure",
    //     params: {
    //       message:
    //         data?.paymentResponse?.payment_gateway_response?.resp_message ||
    //         "Your payment has failed. Please try again.",
    //       orderId: data?.paymentResponse?.order_id,
    //       txnId: data?.paymentResponse?.txn_id,
    //       amount: data?.paymentResponse?.amount,
    //     },
    //   });
    // },
    onPaymentError: (error: any) => {
      setTabVisibility(true);
      router.replace({
        pathname: "/(tabs)/home/payment-failure",
        params: {
          message: "An error occurred while processing the transaction.",
          orderId: error?.paymentResponse?.order_id || "",
          txnId: error?.paymentResponse?.txn_id || "",
          amount: error?.paymentResponse?.amount || "",
        },
      });
    },
    onPaymentExpired: () => {
      setIsPaymentDone(true);
      setTabVisibility(true);
      router.replace({
        pathname: "/(tabs)/home/payment-failure",
        params: {
          message: "Payment session has expired. Please try again.",
          orderId: "",
          txnId: "",
          amount: "",
        },
      });
    },
    parsedUserDetails: undefined,
    router,
  });

  const handleNavigationStateChange = useCallback((navState: any) => {
    if (isProcessing) {
      return;
    }

    const { url } = navState;
    console.log('Navigation URL:', url);
    
    if (loadingTimerRef.current) {
      clearTimeout(loadingTimerRef.current);
    }

    setIsProcessing(true);

    if (url.includes('PageExpired')) {
      emitPaymentEvent('payment_expired', {
        timestamp: new Date().toISOString()
      });
      return;
    }

    if (url.includes('payment-success')) {
      setIsLoading(false);
      emitPaymentEvent('payment_success', {
        url,
        timestamp: new Date().toISOString()
      });
      return;
    }

    if (url.includes('payment-failure')) {
      setIsLoading(false);
      emitPaymentEvent('payment_failed', {
        url,
        timestamp: new Date().toISOString()
      });
      return;
    }

    if (url.includes('payment-error')) {
      setIsLoading(false);
      emitPaymentEvent('payment_error', {
        url,
        timestamp: new Date().toISOString()
      });
      return;
    }

    if (url.includes('netbanking')) {
      setIsLoading(false);
      loadingTimerRef.current = setTimeout(() => {
        setLoadingTimeout(true);
      }, 30000);
    }

    setTimeout(() => {
      setIsProcessing(false);
    }, 1000);
  }, [emitPaymentEvent]);

  const handleError = useCallback(
    (syntheticEvent: any) => {
      const { nativeEvent } = syntheticEvent;
      emitPaymentEvent("payment_error", {
        error: nativeEvent.description,
        timestamp: new Date().toISOString(),
      });
    },
    [emitPaymentEvent]
  );

  useEffect(() => {
    if (isPaymentDone) return;
    const backHandler = BackHandler.addEventListener(
      "hardwareBackPress",
      () => {
        Alert.alert(
          "Cancel Payment",
          "Are you sure you want to cancel the payment?",
          [
            { text: "No", style: "cancel" },
            {
              text: "Yes",
              style: "destructive",
              onPress: () => {
                setTabVisibility(true);
                emitPaymentEvent("payment_cancelled", {
                  timestamp: new Date().toISOString(),
                });
                router.back();
              },
            },
          ]
        );
        return true;
      }
    );
    return () => {
      backHandler.remove();
      if (loadingTimerRef.current) clearTimeout(loadingTimerRef.current);
    };
  }, [router, emitPaymentEvent, isPaymentDone, setTabVisibility]);

  useEffect(() => {
    const unsubscribe = navigation.addListener("beforeRemove", (e: any) => {
      if (!isPaymentDone) e.preventDefault();
      else setTabVisibility(true);
    });
    return unsubscribe;
  }, [navigation, isPaymentDone, setTabVisibility]);

  const handleReload = useCallback(() => {
    webViewRef.current?.reload();
  }, []);

  useEffect(() => {
    return () => {
      setIsProcessing(false);
      if (loadingTimerRef.current) {
        clearTimeout(loadingTimerRef.current);
      }
    };
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
      {loadingTimeout && (
        <View style={styles.timeoutContainer}>
          <Text style={styles.timeoutText}>
            The page is taking longer than expected to load.
          </Text>
          <TouchableOpacity style={styles.reloadButton} onPress={handleReload}>
            <Text style={styles.reloadButtonText}>Reload Page</Text>
          </TouchableOpacity>
        </View>
      )}

      <WebView
        ref={webViewRef}
        source={{ uri: paymentUrl as string }}
        style={styles.webview}
        onNavigationStateChange={handleNavigationStateChange}
        onError={handleError}
        javaScriptEnabled={true}
        domStorageEnabled={true}
        scalesPageToFit={true}
        incognito={true}
        cacheEnabled={false}
        cacheMode="LOAD_NO_CACHE"
        onHttpError={(syntheticEvent) => {
          console.log('syntheticEvent',syntheticEvent)
          if (isProcessing) return;
          
          const { nativeEvent } = syntheticEvent;
          if (nativeEvent.statusCode === 500) {
            emitPaymentEvent("payment_error", {
              error: `HTTP Error: ${nativeEvent.statusCode}`,
              timestamp: new Date().toISOString(),
            });
          } else {
            handleCancel();
          }
        }}
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
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  timeoutContainer: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    backgroundColor: "rgba(255, 255, 255, 0.9)",
    padding: 20,
    zIndex: 2,
    alignItems: "center",
  },
  timeoutText: {
    fontSize: 16,
    color: theme.colors.textPrimary,
    textAlign: "center",
    marginBottom: 10,
  },
  reloadButton: {
    backgroundColor: theme.colors.primary,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 5,
  },
  reloadButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
});

export default PaymentWebViewNew;
