import React, { useEffect } from "react";
import { View, Modal, StyleSheet } from "react-native";
import { WebView } from "react-native-webview";
import { useLocalSearchParams, useRouter } from "expo-router";
import { usePaymentSocket } from "@/hooks/usePaymentSocket";
// import your socket library here if needed

export default function PaymentWebView() {
  const params = useLocalSearchParams();
  const router = useRouter();

  const { socket, handleCancel } = usePaymentSocket({
    onPaymentSuccess: (data) => {
      console.log("Payment Success:", data);
      // Disconnect socket before navigation
      if (socket && socket.connected) {
        socket.disconnect();
      }
      // router.replace({
      //   pathname: '/(tabs)/home/payment-success',
      //   params: {
      //     txnId: data?.paymentResponse?.txn_id,
      //     orderId: data?.paymentResponse?.order_id,
      //     amount: data?.paymentResponse?.amount,
      //   }
      // });
    },
    onPaymentFailure: (data) => {
      console.log("Payment Failed:", data);
      // Disconnect socket before navigation
      if (socket && socket.connected) {
        socket.disconnect();
      }
      // router.replace({
      //   pathname: '/(tabs)/home/payment-failure',
      //   params: {
      //     message: ((data?.paymentResponse?.txn_detail as any)?.error_message || (data?.paymentResponse?.txn_detail as any)?.response_message || 'Payment Failed'),
      //     orderId: data?.paymentResponse?.order_id,
      //     txnId: data?.paymentResponse?.txn_id,
      //     amount: data?.paymentResponse?.amount,
      //     status: data?.paymentResponse?.txn_detail?.status
      //   }
      // });
    },
    onPaymentError: (error) => {
      console.error("Payment Error:", error);
      // Disconnect socket before navigation
      if (socket && socket.connected) {
        socket.disconnect();
      }
      // router.replace({
      //   pathname: '/(tabs)/home/payment-failure',
      //   params: {
      //     message: error?.message || 'An error occurred during payment',
      //     error: error?.error || 'Unknown error'
      //   }
      // });
    },
    onPaymentExpired: () => {
      console.log("Payment Expired");
      // Disconnect socket before navigation
      if (socket && socket.connected) {
        socket.disconnect();
      }
      // router.replace({
      //   pathname: '/(tabs)/home/payment-failure',
      //   params: {
      //     message: 'Payment session expired. Please try again.'
      //   }
      // });
    },
    parsedUserDetails: params.userDetails
      ? JSON.parse(params.userDetails as string)
      : null,
    router,
  });

  // Cleanup socket on component unmount
  // useEffect(() => {
  //   return () => {
  //     if (socket && socket.connected) {
  //       socket.disconnect();
  //     }
  //   };
  // }, [socket]);

  return (
    <Modal visible={true} animationType="slide" presentationStyle="fullScreen">
      <View style={styles.container}>
        <WebView
          source={{ uri: params.url as string }}
          style={{ flex: 1 }}
          onNavigationStateChange={(navState) => {
            const url = navState.url.toLowerCase();
            if (
              url.includes("cancel") ||
              url.includes("error") ||
              url.includes("failed")
            ) {
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
