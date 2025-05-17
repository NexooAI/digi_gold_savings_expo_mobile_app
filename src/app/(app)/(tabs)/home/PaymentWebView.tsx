import React, { useEffect, useState } from "react";
import { View, ActivityIndicator, StyleSheet, BackHandler } from "react-native";
import { WebView } from "react-native-webview";
import { useLocalSearchParams, useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import io from "socket.io-client";
import api from "@/app/services/api";
import { theme } from "@/constants/theme";

const PaymentWebView = () => {
  const { paymentUrl } = useLocalSearchParams();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [socket, setSocket] = useState<any>(null);

  // Handle WebView close event when component unmounts
  const handleWebViewClose = () => {
    if (socket) {
      socket.emit("payment_flow_exited", {
        timestamp: new Date().toISOString(),
        status: "webview_closed",
      });
    }
    // Navigate back to home screen when WebView is closed
    router.replace("/(tabs)/home");
  };

  useEffect(() => {
    return () => {
      handleWebViewClose();
    };
  }, []);

  // Listen for hardware back press to notify server if user exits payment flow
  useEffect(() => {
    const backHandler = BackHandler.addEventListener(
      "hardwareBackPress",
      () => {
        if (socket) {
          socket.emit("payment_flow_exited", {
            timestamp: new Date().toISOString(),
            status: "user_cancelled",
          });
        }
        // Navigate back to home screen when back is pressed
        router.replace("/(tabs)/home");
        return true; // Prevent default back behavior
      }
    );
    return () => backHandler.remove();
  }, [socket]);

  const handleNavigationStateChange = (navState: any) => {
    const currentUrl = navState.url.toLowerCase();
    
    // Check for success keyword anywhere in the URL
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

      if (socket) {
        socket.emit("payment_completed", {
          status: "success",
          timestamp: new Date().toISOString(),
        });
      }

      router.replace({
        pathname: "/(tabs)/home/PaymentSuccess",
        params: { paymentId, amount, transaction_no },
      });
    }
    // Check for failure keyword anywhere in the URL
    else if (currentUrl.includes("failure") || currentUrl.includes("cancel")) {
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
        onLoadStart={() => setIsLoading(true)}
        onLoad={() => setIsLoading(false)}
        onLoadEnd={() => setIsLoading(false)}
        onNavigationStateChange={handleNavigationStateChange}
        onError={(syntheticEvent) => {
          const { nativeEvent } = syntheticEvent;
          setIsLoading(false);
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
