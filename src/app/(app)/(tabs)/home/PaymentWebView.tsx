import React, { useEffect, useState } from "react";
import { View, Modal, StyleSheet, Alert, Text, TouchableOpacity } from "react-native";
import { WebView } from "react-native-webview";
import { useLocalSearchParams, useRouter } from "expo-router";
import { usePaymentSocket } from "@/hooks/usePaymentSocket";
// import your socket library here if needed

let errorTimeout: NodeJS.Timeout | null = null;

export default function PaymentWebView() {
  const params = useLocalSearchParams();
  const router = useRouter();
  const [showExitModal, setShowExitModal] = useState(false);
  
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

  // Handle back button press
  const handleBackPress = () => {
    setShowExitModal(true);
  };

  // Handle exit confirmation
  const handleExitConfirm = () => {
    // Disconnect socket
    if (socket && socket.connected) {
      socket.disconnect();
    }
    
    // Navigate to paymentNewOverView page
    router.replace({
      pathname: "/(tabs)/home/paymentNewOverView",
      params: {
        userDetails: params.userDetails,
        amount: params.amount,
        schemeName: params.schemeName,
        schemeId: params.schemeId,
        chitId: params.chitId,
        paymentFrequency: params.paymentFrequency,
        schemeType: params.schemeType,
      },
    });
  };

  // Handle exit cancellation
  const handleExitCancel = () => {
    setShowExitModal(false);
  };

  // Cleanup socket on component unmount
  useEffect(() => {
    return () => {
      if (socket && socket.connected) {
        socket.disconnect();
      }
    };
  }, [socket]);

  return (
    <>
      <Modal visible={true} animationType="slide" presentationStyle="fullScreen">
        <View style={styles.container}>
          {/* Header with back button */}
          <View style={styles.header}>
            <TouchableOpacity onPress={handleBackPress} style={styles.backButton}>
              <Text style={styles.backButtonText}>← Back</Text>
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Payment</Text>
            <View style={styles.placeholder} />
          </View>
          
          <WebView
            source={{ uri: params.url as string }}
            style={{ flex: 1 }}
            javaScriptEnabled={true}
            domStorageEnabled={true}
            originWhitelist={["*"]}
            startInLoadingState={true}
            allowsInlineMediaPlayback={true}
            sharedCookiesEnabled={true}
            thirdPartyCookiesEnabled={true}
            cacheEnabled={true}
            incognito={false}
            onNavigationStateChange={(navState) => {
              console.log("Payment Navigation State:", {
                url: navState.url,
                title: navState.title,
                loading: navState.loading,
                canGoBack: navState.canGoBack,
              });

              const currentUrl = navState.url.toLowerCase();
              if (
                currentUrl.includes("/cancel") ||
                currentUrl.includes("/error") ||
                currentUrl.includes("/failed") ||
                (currentUrl.includes("payment") &&
                  currentUrl.includes("status=failed"))
              ) {
                if (socket && socket.connected) {
                  socket.disconnect();
                }
                handleCancel();
              }
            }}
            onError={(err) => console.log("WebView Error:", err)}
            onHttpError={(e) => console.log("HTTP error:", e.nativeEvent)}
          />
        </View>
      </Modal>

      {/* Exit Confirmation Modal */}
      <Modal
        visible={showExitModal}
        transparent={true}
        animationType="fade"
        onRequestClose={handleExitCancel}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Cancel Payment?</Text>
            <Text style={styles.modalMessage}>
              Are you sure you want to cancel this payment? This action cannot be undone.
            </Text>
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={handleExitCancel}
              >
                <Text style={styles.cancelButtonText}>No, Continue</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.confirmButton]}
                onPress={handleExitConfirm}
              >
                <Text style={styles.confirmButtonText}>Yes, Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#e0e0e0",
  },
  backButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  backButtonText: {
    fontSize: 16,
    color: "#007AFF",
    fontWeight: "500",
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#000",
  },
  placeholder: {
    width: 60,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 24,
    marginHorizontal: 32,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "600",
    color: "#000",
    marginBottom: 12,
    textAlign: "center",
  },
  modalMessage: {
    fontSize: 16,
    color: "#666",
    textAlign: "center",
    marginBottom: 24,
    lineHeight: 22,
  },
  modalButtons: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: "100%",
  },
  modalButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginHorizontal: 8,
  },
  cancelButton: {
    backgroundColor: "#f0f0f0",
    borderWidth: 1,
    borderColor: "#ddd",
  },
  confirmButton: {
    backgroundColor: "#FF3B30",
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: "500",
    color: "#666",
    textAlign: "center",
  },
  confirmButtonText: {
    fontSize: 16,
    fontWeight: "500",
    color: "#fff",
    textAlign: "center",
  },
});
