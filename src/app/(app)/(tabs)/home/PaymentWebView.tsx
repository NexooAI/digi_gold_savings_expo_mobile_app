import React, { useEffect, useState, useRef } from "react";
import { View, ActivityIndicator, StyleSheet, BackHandler } from "react-native";
import { WebView } from "react-native-webview";
import { useLocalSearchParams, useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import io from "socket.io-client";
import api from "@/services/api";
import { theme } from "@/constants/theme";
import useGlobalStore from "@/store/global.store";

const PaymentWebView = () => {
  const { paymentUrl } = useLocalSearchParams();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [socket, setSocket] = useState<any>(null);
  const loadingTimeout = useRef<NodeJS.Timeout>();
  const isPaymentCompleted = useRef(false);
  const { setTabVisibility } = useGlobalStore();

  // Hide tabs when component mounts
  useEffect(() => {
    setTabVisibility(false);
    return () => {
      setTabVisibility(true);
    };
  }, []);

  // Handle WebView close event when component unmounts
  const handleWebViewClose = () => {
    // Only trigger cancellation if payment wasn't completed
    if (!isPaymentCompleted.current) {
      if (socket) {
        socket.emit("payment_flow_exited", {
          timestamp: new Date().toISOString(),
          status: "webview_closed",
        });
      }
      router.replace({
        pathname: "/(tabs)/home/PaymentFailure",
        params: { status: "failure" }
      });
    }
  };

  useEffect(() => {
    return () => {
      handleWebViewClose();
      // Clear any pending loading timeout
      if (loadingTimeout.current) {
        clearTimeout(loadingTimeout.current);
      }
    };
  }, []);

  // Listen for hardware back press to notify server if user exits payment flow
  useEffect(() => {
    const backHandler = BackHandler.addEventListener(
      "hardwareBackPress",
      () => {
        // Only trigger cancellation if payment wasn't completed
        if (!isPaymentCompleted.current) {
          if (socket) {
            socket.emit("payment_flow_exited", {
              timestamp: new Date().toISOString(),
              status: "user_cancelled",
            });
          }
          router.replace({
            pathname: "/(tabs)/home/PaymentFailure",
            params: { status: "cancelled" }
          });
          return true; // Prevent default back behavior
        }
        return false; // Allow default back behavior if payment is completed
      }
    );
    return () => backHandler.remove();
  }, [socket]);

  const handleNavigationStateChange = (navState: any) => {
    const currentUrl = navState.url.toLowerCase();
    
    // Check for success keyword anywhere in the URL
    if (currentUrl.includes("success")) {
      isPaymentCompleted.current = true; // Mark payment as completed
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

      if (socket) {
        socket.emit("payment_completed", {
          status: "success",
          timestamp: new Date().toISOString(),
        });
      }

      router.push({
        pathname: "/(tabs)/home/payment-success",
        params: {
          amount: amount,
          txnId: transaction_no,
          orderId: paymentId
        }
      });
    }
    // Check for failure keyword anywhere in the URL
    else if (currentUrl.includes("failure") || currentUrl.includes("cancel")) {
      isPaymentCompleted.current = true; // Mark payment as completed even for failure
      if (socket) {
        socket.emit("payment_failed", {
          status: "failure",
          timestamp: new Date().toISOString(),
        });
      }
      router.replace({
        pathname: "/(tabs)/home/PaymentFailure",
        params: { status: "cancelled" }
      });
    }
  };

  const handleLoadStart = () => {
    setIsLoading(true);
    // Set a timeout to force hide the loader after 10 seconds
    if (loadingTimeout.current) {
      clearTimeout(loadingTimeout.current);
    }
    loadingTimeout.current = setTimeout(() => {
      setIsLoading(false);
    }, 10000);
  };

  const handleLoadEnd = () => {
    setIsLoading(false);
    if (loadingTimeout.current) {
      clearTimeout(loadingTimeout.current);
    }
  };

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
        onError={(syntheticEvent) => {
          const { nativeEvent } = syntheticEvent;
          setIsLoading(false);
          if (loadingTimeout.current) {
            clearTimeout(loadingTimeout.current);
          }
          if (socket) {
            socket.emit("payment_error", {
              error: nativeEvent.description,
              code: nativeEvent.code,
              timestamp: new Date().toISOString(),
            });
          }
          // Navigate to failure screen on error
          router.replace({
            pathname: "/(tabs)/home/PaymentFailure",
            params: { status: "error" }
          });
        }}
        onHttpError={() => {
          setIsLoading(false);
          if (loadingTimeout.current) {
            clearTimeout(loadingTimeout.current);
          }
          // Navigate to failure screen on HTTP error
          router.replace({
            pathname: "/(tabs)/home/PaymentFailure",
            params: { status: "error" }
          });
        }}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },
  webview: { flex: 1 },
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
