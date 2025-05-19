import React, { useEffect, useState, useMemo, useRef } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, useNavigation, useRouter } from "expo-router";
import io from "socket.io-client";
import apiService from "../../../services/api";
import { theme } from "@/constants/theme";
import { Ionicons } from "@expo/vector-icons";
import CustomAlert from "@/app/components/Alert";

const PaymentProcessScreen = () => {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { amount: amountString, userDetails } = useLocalSearchParams();
  const amount = parseFloat(
    Array.isArray(amountString) ? amountString[0] : amountString
  );
  const [alertState, setAlertState] = React.useState({
    visible: false,
    title: "",
    message: "",
    type: "error" as "success" | "error" | "info",
    txn_id: "",
    order_id: "",
    amount: "",
    buttons: [{ text: "OK", onPress: () => {} }],
  });
  const [paymentSuccessData, setPaymentSuccessData] = useState<{
    txn_id?: string;
    amount?: number | string;
    order_id?: string;
  } | null>(null);
  const MAX_RETRY = 3;
  const [retryCount, setRetryCount] = useState(MAX_RETRY);

  // Memoize parsed details so they don’t change on every render.
  const parsedUserDetails = useMemo(
    () =>
      JSON.parse(
        Array.isArray(userDetails) ? userDetails[0] : userDetails || "{}"
      ),
    [userDetails]
  );
  const paramsParse = useMemo(
    () =>
      JSON.parse(
        Array.isArray(params.data) ? params.data[0] : params.data || "{}"
      ),
    [params.data]
  );

  const [isLoading, setIsLoading] = useState(false);
  const [socket, setSocket] = useState(null);
  const navigation = useNavigation();
  const [isNavigationReady, setIsNavigationReady] = useState(false);

  // This ref will guard against duplicate processing of the payment event
  const processedPaymentRef = useRef(false);

  // Initialize socket connection
  useEffect(() => {
    const socketInstance = io(theme.baseUrl); // Replace with your server URL
    setSocket(socketInstance);

    socketInstance.on("connect", () => {});

    return () => {
      socketInstance.disconnect();
    };
  }, []);

  useEffect(() => {
    const unsubscribe = navigation.addListener("state", () => {
      setIsNavigationReady(true);
    });
    return unsubscribe;
  }, [navigation]);

  const handlePaymentSuccess = (data: any) => {
    setPaymentSuccessData({
      txn_id: data?.paymentResponse?.txn_id,
      amount: data?.paymentResponse?.amount,
      order_id: data?.orderId,
    });
    setAlertState({
      visible: true,
      title: "Payment Successful",
      message: data.message || "Your payment was processed successfully",
      type: "success",
      txn_id: data?.paymentResponse?.txn_id || "",
      order_id: data?.orderId || "",
      amount:
        data?.paymentResponse?.amount !== undefined &&
        data?.paymentResponse?.amount !== null
          ? String(data?.paymentResponse?.amount)
          : "",
      buttons: [
        {
          text: "Continue",
          onPress: () => {
            setAlertState((prev) => ({ ...prev, visible: false }));
            setPaymentSuccessData(null);
            router.push("/(tabs)/savings");
          },
        },
      ],
    });
  };

  // const handlePaymentFailure = (data: {
  //   paymentResponse?: { txn_id?: string; amount?: string | number };
  //   orderId?: string;
  //   errorMessage?: string;
  // }) => {
  //   setAlertState({
  //     visible: true,
  //     title: "Payment Failed",
  //     message:
  //       data.errorMessage || "Your payment has failed. Please try again.",
  //     type: "error",
  //     txn_id: data?.paymentResponse?.txn_id || "",
  //     order_id: data?.orderId || "",
  //     amount:
  //       data?.paymentResponse?.amount !== undefined &&
  //       data?.paymentResponse?.amount !== null
  //         ? String(data?.paymentResponse?.amount)
  //         : "",
  //     buttons: [
  //       ...(retryCount > 0
  //         ? [
  //             {
  //               text: `Retry (${retryCount})`,
  //               onPress: () => {
  //                 setRetryCount((prev) => prev - 1);
  //                 retryPayment(data?.orderId);
  //                 setAlertState((prev) => ({ ...prev, visible: false }));
  //                 setPaymentSuccessData(null);
  //               },
  //             },
  //           ]
  //         : []),
  //       {
  //         text: "Cancel",
  //         onPress: () => {
  //           router.push("/(tabs)/home");
  //           setAlertState((prev) => ({ ...prev, visible: false }));
  //           setPaymentSuccessData(null);
  //         },
  //       },
  //     ],
  //   });
  // };
  const handlePaymentFailure = (data) => {
    showPaymentFailureAlert(data);
  };
  const showPaymentFailureAlert = (data) => {
    setAlertState({
      visible: true,
      title: "Payment Failed",
      message:
        data.errorMessage || "Your payment has failed. Please try again.",
      type: "error",
      txn_id: data?.paymentResponse?.txn_id || "",
      order_id: data?.orderId || "",
      amount:
        data?.paymentResponse?.amount !== undefined &&
        data?.paymentResponse?.amount !== null
          ? String(data?.paymentResponse?.amount)
          : "",
      buttons: [
        ...(retryCount > 0
          ? [
              {
                text: `Retry (${retryCount})`,
                onPress: () => {
                  setAlertState((prev) => ({ ...prev, visible: false }));
                  setPaymentSuccessData(null);
                  setRetryCount((prev) => prev - 1);
                  retryPayment(data?.orderId); // <== call retry (will call handlePaymentFailure if fails)
                },
              },
            ]
          : []),
        {
          text: "Cancel",
          onPress: () => {
            router.push("/(tabs)/home");
            setAlertState((prev) => ({ ...prev, visible: false }));
            setPaymentSuccessData(null);
          },
        },
      ],
    });
  };

  const retryPayment = (orderId) => {
    // Your retry implementation
    console.log("Retrying payment for order:", orderId);
    processedPaymentRef.current = false;
    paymentInit();
    // Example: router.push(`/payment?orderId=${orderId}`);
  };
  const paymentInit = () => {
    // alert("Payment initiated waiting for payment gateway ");
    if (!isNavigationReady) return;
    processedPaymentRef.current = false;
    setIsLoading(true);

    // Notify server that payment was initiated
    if (socket) {
      socket.emit("payment_initiated", {
        amount: amount,
        userId: paramsParse?.userId,
        timestamp: new Date().toISOString(),
      });
    }
    const payload = {
      userId: parsedUserDetails.data?.data?.userId || parsedUserDetails.userId,
      amount: amount,
      investmentId:
        parsedUserDetails.data?.data?.id || parsedUserDetails.investmentId,
      schemeId:
        parsedUserDetails.data?.data?.schemeId || parsedUserDetails.schemeId,
      userEmail: parsedUserDetails.email,
      userMobile: parsedUserDetails.mobile,
      userName: parsedUserDetails.name,
    };
    // Convert payload to x-www-form-urlencoded format
    const formBody = new URLSearchParams();
    Object.entries(payload).forEach(([key, value]) => {
      formBody.append(key, value);
    });

    apiService
      .post("/initiate", formBody.toString(), {
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
      })
      .then((response) => {
        const paymentUrl = response.data.session.payment_links.web;
        router.push({
          pathname: "/(tabs)/home/PaymentWebView",
          params: { paymentUrl },
        });
      })
      .catch((error) => {
        if (socket) {
          socket.emit("payment_initiation_failed", {
            error: error.message,
            timestamp: new Date().toISOString(),
          });
        }
        Alert.alert(
          "Payment Error",
          "Failed to initiate payment. Please try again."
        );
      })
      .finally(() => setIsLoading(false));
  };

  // Attach the socket event handler only once
  useEffect(() => {
    if (!socket) return;

    const handlePaymentStatusUpdate = async (data) => {
      // Prevent processing the same event twice.
      if (processedPaymentRef.current) return;
      processedPaymentRef.current = true;
      console.log("Payment status update received:", data);
      const paymentSuccess = data.status === "success";
      let paymentStsId = null;
      try {
        if (paymentSuccess) {
          // Payment API call
          const paymentPayload = {
            investmentId:
              parsedUserDetails.data?.data?.id ||
              parsedUserDetails.investmentId,
            paymentAmount: data?.paymentResponse?.amount,
            userId:
              parsedUserDetails.data?.data?.userId || parsedUserDetails.userId,
            paymentMethod: data?.paymentResponse?.payment_method_type,
            schemeId:
              parsedUserDetails.data?.data?.schemeId ||
              parsedUserDetails.schemeId,
            transactionId: data?.paymentResponse?.txn_id,
            orderId: data?.orderId,
          };
          const paymentResult = await postPayment(paymentPayload);
          paymentStsId = paymentResult?.data?.paymentId || null;
          // Investment API call
          const investmentPayload = {
            userId:
              parsedUserDetails.data?.data?.userId || parsedUserDetails.userId,
            schemeId:
              parsedUserDetails.data?.data?.schemeId ||
              parsedUserDetails.schemeId,
            chitId:
              parsedUserDetails.data?.data?.chitId || parsedUserDetails.chitId,
            accountName:
              parsedUserDetails.data?.data?.accountName ||
              parsedUserDetails.name,
            accountNo:
              parsedUserDetails.data?.data?.accountNo ||
              parsedUserDetails.accNo,
            paymentStatus: "PAID",
            paymentAmount: data?.paymentResponse?.amount,
          };
          const investmentResult = await updateInversment(
            parsedUserDetails.data?.data?.id || parsedUserDetails.investmentId,
            investmentPayload
          );
          handlePaymentSuccess(data);
          // router.push({
          //   pathname: "/(tabs)/home/PaymentSuccess",
          //   params: {
          //     txn_id: data?.paymentResponse?.txn_id,
          //     amount: data?.paymentResponse?.amount,
          //     order_id: data?.orderId,
          //   },
          // });
        } else if (data.status === "failure") {
          handlePaymentFailure(data);
          // Alert.alert(
          //   "Payment Failed",
          //   data.message || "Payment could not be completed"
          // );
          // router.push({
          //   pathname: "/(tabs)/home/PaymentFailure",
          //   params: {
          //     txn_id: data?.paymentResponse?.txn_id,
          //     amount: data?.paymentResponse?.amount,
          //     order_id: data?.orderId,
          //   },
          // });
        }

        // Call the Transaction API with paymentId set accordingly (only once)
        const transactionPayload = {
          userId:
            parsedUserDetails.data?.data?.userId || parsedUserDetails.userId,
          investmentId:
            parsedUserDetails.data?.data?.id || parsedUserDetails.investmentId,
          schemeId:
            parsedUserDetails.data?.data?.schemeId ||
            parsedUserDetails.schemeId,
          chitId:
            parsedUserDetails.data?.data?.chitId || parsedUserDetails.chitId,
          // installment: 1,
          accountNumber:
            parsedUserDetails.data?.data?.accountNo || parsedUserDetails.accNo,
          paymentId: paymentStsId ? paymentStsId : 0,
          orderId: data?.orderId,
          amount: data?.paymentResponse?.amount,
          currency: data?.paymentResponse?.currency,
          paymentMethod: data?.paymentResponse?.txn_detail?.txn_flow_type,
          signature: "000",
          paymentStatus:
            data?.paymentResponse?.payment_gateway_response?.resp_code ||
            "Canceled",
          paymentDate: data?.paymentResponse?.date_created,
          status: data?.paymentResponse?.status,
          gatewayTransactionId: data?.paymentResponse?.txn_id,
          gatewayresponse: JSON.stringify(data),
        };

        const transactionResult = await postTransaction(transactionPayload);
      } catch (error) {
        console.error("Error processing payment status update:", error);
        Alert.alert(
          "Error",
          "An error occurred while processing the transaction."
        );
      }
    };

    socket.on("payment_status_update", handlePaymentStatusUpdate);
    return () => {
      socket.off("payment_status_update", handlePaymentStatusUpdate);
    };
  }, [socket]);

  // API call functions
  const postTransaction = async (payload) => {
    try {
      const response = await apiService.post("/transactions", payload);
      return response.data;
    } catch (error) {
      console.error("Error posting transaction:", error);
      throw error;
    }
  };

  const postPayment = async (payload) => {
    try {
      const response = await apiService.post("/payment", payload);
      return response.data;
    } catch (error) {
      console.error("Error posting payment:", error);
      throw error;
    }
  };

  const updateInversment = async (id, payload) => {
    try {
      const response = await apiService.put(`/investments/${id}`, payload);
      return response.data;
    } catch (error) {
      console.error("Error updating investment:", error);
      throw error;
    }
  };
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <TouchableOpacity onPress={() => router.back()} style={{ padding: 8 }}>
          <Ionicons name="arrow-back" size={24} color={theme.colors.primary} />
        </TouchableOpacity>
        <Text style={styles.title}>Payment Overview</Text>

        <View style={styles.amountCard}>
          <Text style={styles.amountLabel}>Total Amount</Text>
          <Text style={styles.amountValue}>₹{amount}</Text>
        </View>

        <View style={styles.detailsContainer}>
          <Text style={styles.detailLabel}>Name</Text>
          <Text style={styles.detailValue}>
            {parsedUserDetails.name || "Test User"}
          </Text>

          <Text style={styles.detailLabel}>Email</Text>
          <Text style={styles.detailValue}>
            {parsedUserDetails.email || "user@example.com"}
          </Text>

          <Text style={styles.detailLabel}>Mobile</Text>
          <Text style={styles.detailValue}>
            {parsedUserDetails.mobile || "9999999999"}
          </Text>
        </View>

        {isLoading ? (
          <ActivityIndicator size="large" color={theme.colors.primary} />
        ) : (
          <TouchableOpacity style={styles.payButton} onPress={paymentInit}>
            <Text style={styles.payButtonText}>Pay Now</Text>
          </TouchableOpacity>
        )}
      </View>
      <CustomAlert
        visible={alertState.visible}
        title={alertState.title}
        message={alertState.message}
        type={alertState.type}
        buttons={alertState.buttons}
        onClose={() => setAlertState((prev) => ({ ...prev, visible: false }))}
        txn_id={alertState.txn_id}
        order_id={alertState.order_id}
        amount={alertState.amount}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },
  content: { padding: 20, alignItems: "center" },
  title: {
    fontSize: 22,
    fontWeight: "bold",
    color: theme.colors.primary,
    marginBottom: 20,
  },
  amountCard: {
    backgroundColor: "#f0f0f0",
    padding: 15,
    borderRadius: 10,
    width: "100%",
    alignItems: "center",
    marginBottom: 20,
  },
  amountLabel: { fontSize: 16, color: "#666" },
  amountValue: {
    fontSize: 24,
    fontWeight: "bold",
    color: theme.colors.primary,
  },
  detailsContainer: {
    width: "100%",
    backgroundColor: "#f9f9f9",
    padding: 15,
    borderRadius: 10,
    marginBottom: 20,
  },
  detailLabel: { color: "#666", fontSize: 14, marginTop: 10 },
  detailValue: { fontSize: 16, fontWeight: "600", marginBottom: 5 },
  payButton: {
    backgroundColor: theme.colors.primary,
    padding: 15,
    borderRadius: 10,
    width: "100%",
    alignItems: "center",
  },
  payButtonText: { color: "white", fontSize: 18, fontWeight: "bold" },
});

export default PaymentProcessScreen;
