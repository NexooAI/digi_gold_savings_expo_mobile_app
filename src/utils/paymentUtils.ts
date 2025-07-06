import { Alert } from "react-native";
import { useRouter } from "expo-router";
import apiService from "@/services/api";
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
    return;
  }

  setIsLoading(true);

  // Notify server that payment was initiated
  console.log("=== INITIAL SOCKET EMISSION DEBUG ===");
  console.log("Socket exists:", !!socket);
  if (socket) {
    console.log("Socket connected:", socket.connected);
    console.log("Socket ID:", socket.id);
    console.log("About to emit 'payment_initiated'");
    console.log("Emission data:", {
      amount: amount,
      userId: userId,
      timestamp: new Date().toISOString(),
    });
    
    try {
      socket.emit("payment_initiated", {
        amount: amount,
        userId: userId,
        timestamp: new Date().toISOString(),
      });
      console.log("✅ Initial socket emission successful!");
    } catch (error) {
      console.error("❌ Initial socket emission failed:", error);
    }
  } else {
    console.log("❌ Socket is null - cannot emit initial payment_initiated");
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
    .post("/payments/initiate", formBody.toString(), {
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
    })
    .then((response) => {
      console.log("=== PAYMENT INITIATION API RESPONSE ===");
      console.log("Full response:", JSON.stringify(response, null, 2));
      console.log("Response data:", JSON.stringify(response.data, null, 2));
      console.log("Session data:", JSON.stringify(response.data.session, null, 2));
      
      const paymentUrl = response.data.session.payment_links.web;
      console.log("Payment URL:", paymentUrl);
      
      // Emit payment metadata to socket after successful API call
      if (socket) {
        console.log("=== SOCKET EMISSION DEBUG ===");
        console.log("Socket exists:", !!socket);
        console.log("Socket connected:", socket.connected);
        console.log("Socket ID:", socket.id);
        
        const orderId = response.data.session.order_id;
        console.log("Order ID from response:", orderId);
        
        // Debug parsedUserDetails
        console.log("=== PARSED USER DETAILS DEBUG ===");
        console.log("Full parsedUserDetails:", JSON.stringify(parsedUserDetails, null, 2));
        console.log("parsedUserDetails.data?.data?.id:", parsedUserDetails.data?.data?.id);
        console.log("parsedUserDetails.investmentId:", parsedUserDetails.investmentId);
        console.log("parsedUserDetails.data?.data?.userId:", parsedUserDetails.data?.data?.userId);
        console.log("parsedUserDetails.userId:", parsedUserDetails.userId);
        console.log("parsedUserDetails.data?.data?.schemeId:", parsedUserDetails.data?.data?.schemeId);
        console.log("parsedUserDetails.schemeId:", parsedUserDetails.schemeId);
        console.log("parsedUserDetails.data?.data?.chitId:", parsedUserDetails.data?.data?.chitId);
        console.log("parsedUserDetails.chitId:", parsedUserDetails.chitId);
        console.log("parsedUserDetails.data?.data?.accountNo:", parsedUserDetails.data?.data?.accountNo);
        console.log("parsedUserDetails.accountNo:", parsedUserDetails.accountNo);
        console.log("parsedUserDetails.accNo:", parsedUserDetails.accNo);
        console.log("parsedUserDetails.data?.data?.accountName:", parsedUserDetails.data?.data?.accountName);
        console.log("parsedUserDetails.accountName:", parsedUserDetails.accountName);
        console.log("parsedUserDetails.name:", parsedUserDetails.name);
        console.log("Amount:", amount);
        
        const paymentMetadata = {
          orderId: orderId,
          investmentId: parsedUserDetails.data?.data?.id || parsedUserDetails.investmentId,
          userId: parsedUserDetails.data?.data?.userId || parsedUserDetails.userId,
          schemeId: parsedUserDetails.data?.data?.schemeId || parsedUserDetails.schemeId,
          chitId: parsedUserDetails.data?.data?.chitId || parsedUserDetails.chitId,
          amount: amount,
          isManual: "no",
          utr_reference_number: "",
          accountNumber: parsedUserDetails.data?.data?.accountNo || parsedUserDetails.accountNo || parsedUserDetails.accNo,
          accountName: parsedUserDetails.data?.data?.accountName || parsedUserDetails.accountName || parsedUserDetails.name
        };
        
        console.log("=== FINAL PAYMENT METADATA TO EMIT ===");
        console.log("Payment metadata object:", JSON.stringify(paymentMetadata, null, 2));
        console.log("Individual fields:");
        console.log("- orderId:", paymentMetadata.orderId);
        console.log("- investmentId:", paymentMetadata.investmentId);
        console.log("- userId:", paymentMetadata.userId);
        console.log("- schemeId:", paymentMetadata.schemeId);
        console.log("- chitId:", paymentMetadata.chitId);
        console.log("- amount:", paymentMetadata.amount);
        console.log("- isManual:", paymentMetadata.isManual);
        console.log("- utr_reference_number:", paymentMetadata.utr_reference_number);
        console.log("- accountNumber:", paymentMetadata.accountNumber);
        console.log("- accountName:", paymentMetadata.accountName);
        
        console.log("=== SOCKET EMISSION ===");
        console.log("About to emit 'store_payment_metadata' with data:", paymentMetadata);
        
        try {
          socket.emit("store_payment_metadata", paymentMetadata);
          console.log("✅ Socket emission successful!");
        } catch (error) {
          console.error("❌ Socket emission failed:", error);
        }
      } else {
        console.log("❌ Socket is null or undefined - cannot emit payment metadata");
      }
      
      router.push({
        pathname: "/(tabs)/home/PaymentWebView",
        params: { 
          paymentUrl,
          orderId: response.data.session.order_id,
          userDetails: JSON.stringify(parsedUserDetails)
        },
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
    return response.data;
  } catch (error) {
    console.error("Error posting transaction:", error);
    throw error;
  }
};

export const postPayment = async (payload) => {
  try {
    const response = await apiService.post("/payments", payload);
    return response.data;
  } catch (error) {
    console.error("Error posting payment:", error);
    throw error;
  }
};

export const updateInvestment = async (id, payload) => {
  try {
    const response = await apiService.put(`/investments/${id}`, payload);
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

    const paymentSuccess = data.status === "success";

    try {
      if (paymentSuccess) {
        // Validate required payment data
        // if (!data?.paymentResponse?.txn_id || !data?.paymentResponse?.order_id) {
        //   console.error('Missing required payment data:', {
        //     txnId: data?.paymentResponse?.txn_id,
        //     orderId: data?.paymentResponse?.order_id,
        //     amount: data?.paymentResponse?.amount
        //   });
        //   Alert.alert(
        //     'Payment Error',
        //     'Some payment details are missing. Please contact support.',
        //     [{ text: 'OK', onPress: () => router.replace('/(tabs)/home') }]
        //   );
        //   return;
        // }

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

        // Log payment success data before navigation
        // console.log('Payment Success Data:', {
        //   amount: data?.paymentResponse?.amount,
        //   txnId: data?.paymentResponse?.txn_id,
        //   orderId: data?.paymentResponse?.order_id,
        //   timestamp: new Date().toISOString()
        // });

        router.push({
          pathname: "/(tabs)/home/payment-success",
          params: {
            amount: data?.paymentResponse?.amount,
            txnId: data?.paymentResponse?.txn_id,
            orderId: data?.paymentResponse?.order_id
          }
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