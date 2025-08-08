import React, { useEffect } from "react";
import { View, Modal, StyleSheet, Alert } from "react-native";
import { WebView } from "react-native-webview";
import { useLocalSearchParams, useRouter } from "expo-router";
import { usePaymentSocket } from "../hooks/usePaymentSocket";
// import your socket library here if needed

let errorTimeout: NodeJS.Timeout | null = null;

export default function PaymentWebView() {
  const params = useLocalSearchParams();
  const router = useRouter();
  const { socket, handleCancel } = usePaymentSocket({
    onPaymentSuccess: (data) => {
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
        },
      });
    },
    onPaymentFailure: (data) => {
      // Disconnect socket before navigation
      if (socket && socket.connected) {
        socket.disconnect();
      }
      router.replace({
        pathname: "/(tabs)/home/payment-failure",
        params: {
          message:
            (data?.paymentResponse?.txn_detail as any)?.error_message ||
            (data?.paymentResponse?.txn_detail as any)?.response_message ||
            "Payment Failed",
          orderId: data?.paymentResponse?.order_id,
          txnId: data?.paymentResponse?.txn_id,
          amount: data?.paymentResponse?.amount, 
          status: data?.paymentResponse?.txn_detail?.status,
        },
      });
    },
    onPaymentError: (error) => {
      // If it's a disconnect error, wait a bit before showing the alert
      if (error?.error === "Disconnected") {
        if (errorTimeout) clearTimeout(errorTimeout);
        errorTimeout = setTimeout(() => {
          // If still disconnected after 5 seconds, show the alert
          if (socket && !socket.connected) {
            Alert.alert(
              "Payment Error",
              "Lost connection to payment server. Please try again.",
              [
                {
                  text: "OK",
                  onPress: () => {
                    router.back();
                  },
                },
              ]
            );
          }
        }, 5000); // 5 seconds
        return;
      }

      // For other errors, show the alert immediately
      Alert.alert(
        "Payment Error",
        error?.message ||
          "An error occurred during payment processing. Please try again.",
        [
          {
            text: "OK",
            onPress: () => {
              router.back();
            },
          },
        ]
      );
    },
    onPaymentExpired: () => {
      // Disconnect socket before navigation
      if (socket && socket.connected) {
        socket.disconnect();
      }
      Alert.alert(
        "Payment Expired",
        "Your payment session has expired. Please try again to complete the transaction.",
        [
          {
            text: "OK",
            onPress: () => {
              router.back()
              // router.replace({
              //   pathname: "/(tabs)/home/paymentNewOverView",
              //   params: {
              //     userDetails: params.userDetails,
              //     amount: params.amount,
              //     schemeName: params.schemeName,
              //     schemeId: params.schemeId,
              //     chitId: params.chitId,
              //     paymentFrequency: params.paymentFrequency,
              //     schemeType: params.schemeType,
              //   },
              // });
            },
          },
        ]
      );
    },
    parsedUserDetails: params.userDetails
      ? JSON.parse(params.userDetails as string)
      : null,
    router,
    orderId: params.orderId as string,
  });

  // Cleanup socket on component unmount
  useEffect(() => {
    return () => {
      if (socket && socket.connected) {
        socket.disconnect();
      }
    };
  }, [socket]);

  return (
    <Modal visible={true} animationType="slide" presentationStyle="fullScreen">
      <View style={styles.container}>
        <WebView
          source={{ uri: params.url as string }}
          style={{ flex: 1 }}
          onNavigationStateChange={(navState) => {
            console.log("Payment Navigation State:", {
              url: navState.url,
              title: navState.title,
              loading: navState.loading,
              canGoBack: navState.canGoBack,
            });

            const url = navState.url.toLowerCase();
            // Only trigger cancel if explicitly cancelled or failed
            if (
              url.includes("/cancel") ||
              url.includes("/error") ||
              url.includes("/failed") ||
              (url.includes("payment") && url.includes("status=failed"))
            ) {
              //console.log("Payment cancelled/failed detected:", url);
              // Disconnect socket before handling cancel
              if (socket && socket.connected) {
                socket.disconnect();
              }
              handleCancel();
            }
          }}
        />
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
});
