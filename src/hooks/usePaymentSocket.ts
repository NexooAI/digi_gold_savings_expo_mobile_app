import { useEffect, useRef } from "react";
import { io, Socket } from "socket.io-client";
import { useRouter } from "expo-router";
import paymentService from "@/services/payment.service";
import api from "@/services/api";
import { Alert } from 'react-native';
import { theme } from "@/constants/theme";

interface PaymentSocketProps {
  onPaymentSuccess?: (data: any) => void;
  onPaymentFailure?: (data: any) => void;
  onPaymentError?: (error: any) => void;
  onPaymentExpired?: () => void;
  parsedUserDetails: any;
  router: ReturnType<typeof useRouter>;
  orderId?: string;
}

export const usePaymentSocket = ({
  onPaymentSuccess,
  onPaymentFailure,
  onPaymentError,
  onPaymentExpired,
  parsedUserDetails,
  router,
  orderId,
}: PaymentSocketProps) => {
  const socketRef = useRef<Socket | null>(null);
  const isPaymentCompleted = useRef(false);

  const handlePaymentSuccess = async (data: any) => {
    try {
      console.log("Processing successful payment:", data);

      const paymentPayload = {
        "investmentId": parsedUserDetails.data?.data?.id || parsedUserDetails.id || '',
        "userId":  parsedUserDetails.data?.data?.userId || parsedUserDetails.userId || '',
        "paymentAmount": data.paymentResponse.amount,
        "paymentMethod": data.paymentResponse.txn_detail.txn_flow_type,
        "schemeId": parsedUserDetails.data?.data?.schemeId || parsedUserDetails.schemeId || '',
        "chitId": parsedUserDetails.data?.data?.chitId || parsedUserDetails.chitId || '',
        "transactionId": data.paymentResponse.txn_id,
        "orderId": data.orderId,
        "isManual": "no",
        "utr_reference_number": ""
      };

      console.log("Payment payload:", paymentPayload);
      const paymentResult = await paymentService.createPayment(paymentPayload);
      console.log("Payment result:", paymentResult);

      const paymentId = paymentResult?.data?.paymentId || 0;

      const transactionPayload = {
        userId: parsedUserDetails.data?.data?.userId || parsedUserDetails.userId || '',
        investmentId: parsedUserDetails.data?.data?.id || parsedUserDetails.id || '',
        schemeId: parsedUserDetails.data?.data?.schemeId || parsedUserDetails.schemeId || '',
        chitId: parsedUserDetails.data?.data?.chitId || parsedUserDetails.chitId || '',
        accountNumber: parsedUserDetails.data?.data?.accountNo || parsedUserDetails.accountNo || '',
        paymentId,
        orderId: data?.paymentResponse?.order_id || '',
        amount: data?.paymentResponse?.amount || '',
        currency: data?.paymentResponse?.currency || 'INR',
        paymentMethod: data?.paymentResponse?.payment_method || '',
        signature: '000',
        paymentStatus: data?.paymentResponse?.payment_gateway_response?.resp_message || 'Success',
        paymentDate: data?.paymentResponse?.date_created || '',
        status: data?.paymentResponse?.status || 'CHARGED',
        gatewayTransactionId: data?.paymentResponse?.txn_id || '',
      };

      console.log("Transaction payload:", transactionPayload);
      await paymentService.createTransaction(transactionPayload);

      // Update investment status
      const investmentPayload = {
        userId: parsedUserDetails.data?.data?.userId || parsedUserDetails.userId || '',
        schemeId: parsedUserDetails.data?.data?.schemeId || parsedUserDetails.schemeId || '',
        chitId: parsedUserDetails.data?.data?.chitId || parsedUserDetails.chitId || '',
        accountName: parsedUserDetails.data?.data?.accountName || parsedUserDetails.accountName || '',
        accountNo: parsedUserDetails.data?.data?.accountNo || parsedUserDetails.accountNo || '',
        paymentStatus: 'PAID',
        paymentAmount: data?.paymentResponse?.amount || '',
      };

      console.log("Investment payload:", investmentPayload);
      const investmentId = parsedUserDetails.data?.data?.id || parsedUserDetails.id || '';
      await api.put(`/investments/${investmentId}`, investmentPayload);

      return true;
    } catch (error) {
      console.error("Error in handlePaymentSuccess:", error);
      throw error;
    }
  };

  useEffect(() => {
    // Initialize socket connection
    const socketInstance = io(theme.baseUrl, {
      transports: ["websocket"],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });

    socketRef.current = socketInstance;

    // Handle connection events
    socketInstance.on("connect", () => {
      console.log("Socket connected:", socketInstance.id);
      console.log("check orderid", parsedUserDetails);

      // Join the order room if we have an order ID
      const currentOrderId = orderId || parsedUserDetails?.orderId;
      if (currentOrderId) {
        socketInstance.emit("joinOrderRoom", currentOrderId);
        console.log(`Joined room for order ${currentOrderId}`);
      } else {
        console.warn("No order ID available for socket room");
      }
    });

    socketInstance.on("connect_error", (error) => {
      console.error("Socket connection error:", error);
      onPaymentError?.({
        error: "Connection Error",
        message: "Failed to connect to payment server",
      });
    });

    socketInstance.on("disconnect", (reason) => {
      console.log("Socket disconnected:", reason);
      if (!isPaymentCompleted.current) {
        onPaymentError?.({
          error: "Disconnected",
          message: "Lost connection to payment server",
        });
      }
    });

    // Listen for payment status updates
    socketInstance.on("payment_status_update", async (data: any) => {
      console.log("Payment status update received:", data);

      // Check both the top-level status and the payment response status
      const isSuccess = data?.status === "success" ||
        data?.paymentResponse?.status === "CHARGED" ||
        data?.paymentResponse?.txn_detail?.status === "CHARGED";

      try {
        if (isSuccess) {
          console.log('Payment charged successfully');
          isPaymentCompleted.current = true;

          if (parsedUserDetails && router) {
            try {
              await handlePaymentSuccess(data);
              onPaymentSuccess?.(data);

              // Navigate to success page
              router.replace({
                pathname: '/(tabs)/home/payment-success',
                params: {
                  amount: data?.paymentResponse?.amount,
                  txnId: data?.paymentResponse?.txn_id,
                  orderId: data?.paymentResponse?.order_id,
                  message: data?.paymentResponse?.payment_gateway_response?.resp_message || 'Payment Successful'
                }
              });
            } catch (error) {
              console.error("Error processing successful payment:", error);
              onPaymentError?.({
                error: "Payment Processing Error",
                message: "Failed to process successful payment",
              });
            }
          }

          if (socketInstance && socketInstance.connected) {
            socketInstance.disconnect();
          }
        } else {
          console.log('Payment not charged');
          isPaymentCompleted.current = true;

          if (parsedUserDetails && router) {
            const transactionPayload = {
              userId: parsedUserDetails.data?.data?.userId || parsedUserDetails.userId || '',
              investmentId: parsedUserDetails.data?.data?.id || parsedUserDetails.id || '',
              schemeId: parsedUserDetails.data?.data?.schemeId || parsedUserDetails.schemeId || '',
              chitId: parsedUserDetails.data?.data?.chitId || parsedUserDetails.chitId || '',
              accountNumber: parsedUserDetails.data?.data?.accountNo || parsedUserDetails.accountNo || '',
              paymentId: 0,
              orderId: data?.paymentResponse?.order_id || '',
              amount: data?.paymentResponse?.amount || '',
              currency: data?.paymentResponse?.currency || 'INR',
              paymentMethod: data?.paymentResponse?.payment_method || '',
              signature: '000',
              paymentStatus: data?.paymentResponse?.payment_gateway_response?.resp_message || 'Failed',
              paymentDate: data?.paymentResponse?.date_created || '',
              status: data?.paymentResponse?.status || 'FAILED',
              gatewayTransactionId: data?.paymentResponse?.txn_id || '',
            };

            try {
              await paymentService.createTransaction(transactionPayload);
            } catch (error) {
              console.error("Error posting failed transaction:", error);
            }

            router.replace({
              pathname: '/(tabs)/home/payment-failure',
              params: {
                message: data?.paymentResponse?.payment_gateway_response?.resp_message ||
                  data?.paymentResponse?.txn_detail?.error_message ||
                  'Payment Failed',
                orderId: data?.paymentResponse?.order_id,
                txnId: data?.paymentResponse?.txn_id,
                amount: data?.paymentResponse?.amount,
                status: data?.paymentResponse?.status
              }
            });
          }

          onPaymentFailure?.(data);
          if (socketInstance && socketInstance.connected) {
            socketInstance.disconnect();
          }
        }
      } catch (error) {
        console.error('Error in payment status update API sequence:', error);
        onPaymentError?.({
          error: "API Error",
          message: "Failed to process payment status",
        });
      }
    });

    // Cleanup on unmount
    return () => {
      if (socketInstance && socketInstance.connected) {
        socketInstance.disconnect();
      }

    };
  }, [parsedUserDetails, router, onPaymentSuccess, onPaymentFailure, onPaymentError, onPaymentExpired, orderId]);

  const handleCancel = () => {
    if (socketRef.current && socketRef.current.connected) {
      socketRef.current.disconnect();
    }
    router.replace({ pathname: '/(tabs)/home/payment-failure', params: {} });
  };

  return {
    socket: socketRef.current,
    handleCancel,
  };
}; 
