import React, { useEffect, useState, useRef, useCallback } from "react";
import { View, ActivityIndicator, StyleSheet, BackHandler } from "react-native";
import { WebView } from "react-native-webview";
import { useLocalSearchParams, useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { theme } from "@/constants/theme";
import useGlobalStore from "@/store/global.store";
import { usePaymentSocket } from "@/hooks/usePaymentSocket";

const PaymentWebView = () => {
  const { paymentUrl } = useLocalSearchParams();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const loadingTimeout = useRef<NodeJS.Timeout>();
  const { setTabVisibility } = useGlobalStore();

  const handlePaymentSuccess = useCallback(
    (data: any) => {
      const { txn_id, amount, order_id } = data.paymentResponse;
      router.push({
        pathname: "/(tabs)/home/payment-success",
        params: {
          amount,
          txnId: txn_id,
          orderId: order_id,
        },
      });
    },
    [router]
  );

  const handlePaymentFailure = useCallback(() => {
    router.replace({
      pathname: "/(tabs)/home/PaymentFailure",
      params: { status: "failure" },
    });
  }, [router]);

  const handlePaymentError = useCallback(
    (error: any) => {
      console.error("Payment error:", error);
      router.replace({
        pathname: "/(tabs)/home/PaymentFailure",
        params: { status: "error" },
      });
    },
    [router]
  );

  const { emitPaymentEvent } = usePaymentSocket({
    // onPaymentSuccess: handlePaymentSuccess,
    // onPaymentFailure: handlePaymentFailure,
    // onPaymentError: handlePaymentError
  });

  // Hide tabs when component mounts
  useEffect(() => {
    setTabVisibility(false);
    return () => {
      setTabVisibility(true);
    };
  }, []);

  // Handle WebView close event when component unmounts
  const handleWebViewClose = useCallback(() => {
    emitPaymentEvent("payment_flow_exited", {
      status: "webview_closed",
    });
    router.replace({
      pathname: "/(tabs)/home/PaymentFailure",
      params: { status: "failure" },
    });
  }, [emitPaymentEvent, router]);

  useEffect(() => {
    return () => {
      handleWebViewClose();
      if (loadingTimeout.current) {
        clearTimeout(loadingTimeout.current);
      }
    };
  }, [handleWebViewClose]);

  // Listen for hardware back press
  useEffect(() => {
    const backHandler = BackHandler.addEventListener(
      "hardwareBackPress",
      () => {
        emitPaymentEvent("payment_flow_exited", {
          status: "user_cancelled",
        });
        router.replace({
          pathname: "/(tabs)/home/PaymentFailure",
          params: { status: "cancelled" },
        });
        return true;
      }
    );
    return () => backHandler.remove();
  }, [emitPaymentEvent, router]);

  const handleNavigationStateChange = useCallback(
    (navState: any) => {
      const currentUrl = navState.url.toLowerCase();

      if (currentUrl.includes("success")) {
        let paymentId = "";
        let amount = "";
        let transaction_no = "";

        try {
          const urlObj = new URL(navState.url);
          paymentId =
            urlObj.searchParams.get("paymentId") ||
            `PAY${Math.floor(Math.random() * 100000)}`;
          amount = urlObj.searchParams.get("amount") || "";
          transaction_no = urlObj.searchParams.get("txn_id") || "";
        } catch (error) {
          console.warn("URL parsing error:", error);
        }

        emitPaymentEvent("payment_completed", {
          status: "success",
          paymentId,
          amount,
          transaction_no,
        });
      } else if (
        currentUrl.includes("failure") ||
        currentUrl.includes("cancel")
      ) {
        emitPaymentEvent("payment_failed", {
          status: "failure",
        });
        router.replace({
          pathname: "/(tabs)/home/PaymentFailure",
          params: { status: "cancelled" },
        });
      }
    },
    [emitPaymentEvent, router]
  );

  const handleLoadStart = useCallback(() => {
    setIsLoading(true);
    if (loadingTimeout.current) {
      clearTimeout(loadingTimeout.current);
    }
    loadingTimeout.current = setTimeout(() => {
      setIsLoading(false);
    }, 10000);
  }, []);

  const handleLoadEnd = useCallback(() => {
    setIsLoading(false);
    if (loadingTimeout.current) {
      clearTimeout(loadingTimeout.current);
    }
  }, []);

  const handleError = useCallback(
    (syntheticEvent: any) => {
      const { nativeEvent } = syntheticEvent;
      setIsLoading(false);
      if (loadingTimeout.current) {
        clearTimeout(loadingTimeout.current);
      }
      emitPaymentEvent("payment_error", {
        error: nativeEvent.description,
        code: nativeEvent.code,
      });
      router.replace({
        pathname: "/(tabs)/home/PaymentFailure",
        params: { status: "error" },
      });
    },
    [emitPaymentEvent, router]
  );

  return (
    <SafeAreaView style={styles.container}>
      {isLoading && (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
        </View>
      )}

      <WebView
        source={{ uri: Array.isArray(paymentUrl) ? paymentUrl[0] : paymentUrl }}
        style={styles.webview}
        onLoadStart={handleLoadStart}
        onLoadEnd={handleLoadEnd}
        onNavigationStateChange={handleNavigationStateChange}
        onError={handleError}
        onHttpError={handleError}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  webview: {
    flex: 1,
  },
  loadingContainer: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.8)",
    zIndex: 1,
  },
});

export default PaymentWebView;
