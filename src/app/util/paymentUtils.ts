import { Alert } from "react-native";
import { useRouter } from "expo-router";
import apiService from "../services/api";
import io from "socket.io-client";
import { theme } from "@/constants/theme";

// Socket initialization function
export const initializeSocket = () => {
  return io(theme.baseUrl);
};

// Payment function that can be used anywhere
export const initiatePayment = ({
  navigation,
  amount,
  parsedUserDetails,
  socket,
  setIsLoading,
  userId,
}) => {
  if (!navigation) {
    console.log("Navigation not ready yet");
    return;
  }

  setIsLoading(true);

  // Notify server that payment was initiated
  if (socket) {
    socket.emit("payment_initiated", {
      amount: amount,
      userId: userId,
      timestamp: new Date().toISOString(),
    });
  }

  const payload = {
    userId: parsedUserDetails.data?.data?.userId || userId,
    amount: amount,
    investmentId: parsedUserDetails.data?.data?.id,
    schemeId: parsedUserDetails.data?.data?.schemeId,
    userEmail: parsedUserDetails.email,
    userMobile: parsedUserDetails.mobile,
    userName: parsedUserDetails.name,
  };

  // Convert payload to x-www-form-urlencoded format
  const formBody = new URLSearchParams();
  Object.entries(payload).forEach(([key, value]) => {
    if (value) formBody.append(key, value);
  });

  const router = useRouter();

  return apiService
    .post("/initiate", formBody.toString(), {
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
    })
    .then((response) => {
      const paymentUrl = response.data.session.payment_links.web;
      router.push({
        pathname: "/(tabs)/home/PaymentWebView",
        params: { paymentUrl },
      });
      return response;
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
      throw error;
    })
    .finally(() => setIsLoading(false));
};

// API call functions that can be reused
export const postTransaction = async (payload) => {
  try {
    const response = await apiService.post("/transactions", payload);
    console.log("Transaction posted successfully:", response.data);
    return response.data;
  } catch (error) {
    console.error("Error posting transaction:", error);
    throw error;
  }
};

export const postPayment = async (payload) => {
  try {
    const response = await apiService.post("/payment", payload);
    console.log("Payment posted successfully:", response.data);
    return response.data;
  } catch (error) {
    console.error("Error posting payment:", error);
    throw error;
  }
};

export const updateInvestment = async (id, payload) => {
  try {
    const response = await apiService.put(`/investments/${id}`, payload);
    console.log("Investment updated successfully:", response.data);
    return response.data;
  } catch (error) {
    console.error("Error updating investment:", error);
    throw error;
  }
};

// Socket event handler for payment status updates
export const setupPaymentStatusListener = (socket, parsedUserDetails, router, processedPaymentRef) => {
  if (!socket) return () => { };

  const handlePaymentStatusUpdate = async (data) => {
    // Prevent processing the same event twice
    if (processedPaymentRef.current) return;
    processedPaymentRef.current = true;

    console.log("Received payment status update:", data);
    const paymentSuccess = data.status === "success";

    try {
      if (paymentSuccess) {
        // Payment API call
        const paymentPayload = {
          investmentId: parsedUserDetails.data?.data?.id,
          paymentAmount: data?.paymentResponse?.amount,
          userId: parsedUserDetails.data?.data?.userId,
          paymentMethod: data?.paymentResponse?.payment_method_type,
          schemeId: parsedUserDetails.data?.data?.schemeId,
          transactionId: data?.paymentResponse?.txn_id,
        };
        const paymentResult = await postPayment(paymentPayload);
        console.log("Payment API result:", paymentResult);

        // Investment API call
        const investmentPayload = {
          userId: parsedUserDetails.data?.data?.userId,
          schemeId: parsedUserDetails.data?.data?.schemeId,
          chitId: parsedUserDetails.data?.data?.chitId,
          accountName: parsedUserDetails.data?.data?.accountName,
          accountNo: parsedUserDetails.data?.data?.accountNo,
          paymentStatus: "PAID",
          paymentAmount: data?.paymentResponse?.amount,
        };
        const investmentResult = await updateInvestment(
          parsedUserDetails.data?.data?.id,
          investmentPayload
        );
        console.log("Investment API result:", investmentResult);

        router.push({
          pathname: "/(tabs)/home/PaymentSuccess",
        });
      } else if (data.status === "failure") {
        Alert.alert(
          "Payment Failed",
          data.message || "Payment could not be completed"
        );
        router.push({
          pathname: "/(tabs)/home/PaymentFailure",
          params: {},
        });
      }

      // Call the Transaction API with paymentId set accordingly (only once)
      const transactionPayload = {
        userId: parsedUserDetails.data?.data?.userId,
        investmentId: parsedUserDetails.data?.data?.id,
        schemeId: parsedUserDetails.data?.data?.schemeId,
        chitId: parsedUserDetails.data?.data?.chitId,
        installment: 1,
        accountNumber: parsedUserDetails.data?.data?.accountNo,
        paymentId: paymentSuccess ? 1 : 0,
        orderId: data?.orderId,
        amount: data?.paymentResponse?.amount,
        currency: data?.paymentResponse?.currency,
        paymentMethod: data?.paymentResponse?.txn_detail?.txn_flow_type,
        signature: "000",
        paymentStatus:
          data?.paymentResponse?.payment_gateway_response?.resp_code,
        paymentDate: data?.paymentResponse?.date_created,
        status: data?.paymentResponse?.status,
        gatewayTransactionId: data?.paymentResponse?.txn_id,
      };

      const transactionResult = await postTransaction(transactionPayload);
      console.log("Transaction API result:", transactionResult);
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
};