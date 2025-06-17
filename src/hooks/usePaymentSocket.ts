import { useEffect, useRef } from "react";
import { io, Socket } from "socket.io-client";
import { useRouter } from "expo-router";
import { postPayment, postTransaction, updateInvestment } from "@/services/payment.service";
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

  const handleError = (error: any) => {
    if (error?.error?.includes('HTTP Error:')) {
      const errorCode = error.error.split('HTTP Error:')[1].trim();

      Alert.alert(
        "Payment Error",
        "There was an error processing your payment. Please try again.",
        [
          {
            text: "OK",
            onPress: () => {
              console.log("------------------------->> ❤️ ❤️ ❤️ ", router)
              router.replace('/(tabs)/home/payment');
              // if (router) {
              //   router.replace({
              //     pathname: "/(tabs)/home/payment",
              //     params: {
              //       amount: parsedUserDetails?.amount || "",
              //       userDetails: JSON.stringify(parsedUserDetails),
              //       error: `Server Error (${errorCode})`,
              //       errorTimestamp: error.timestamp || new Date().toISOString()
              //     }
              //   });
              // }
            }
          }
        ]
      );

      onPaymentError?.({
        error: `Server Error (${errorCode})`,
        message: 'The server encountered an error while processing your payment.',
        timestamp: error.timestamp || new Date().toISOString(),
        type: 'HTTP_ERROR',
        code: errorCode
      });
    } else {
      onPaymentError?.(error);
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
      const txnStatus = data?.paymentResponse?.txn_detail?.status;

      try {
        if (txnStatus === 'CHARGED') {
          console.log('Payment charged successfully');
          isPaymentCompleted.current = true;
          
          if (parsedUserDetails && router) {
            const paymentPayload = {
              investmentId: parsedUserDetails.data?.data?.id || parsedUserDetails.id || '',
              userId: parsedUserDetails.data?.data?.userId || parsedUserDetails.userId || '',
              paymentAmount: data?.paymentResponse?.amount || '',
              paymentMethod: (data?.paymentResponse as any)?.payment_method || '',
              schemeId: parsedUserDetails.data?.data?.schemeId || parsedUserDetails.schemeId || '',
              chitId: parsedUserDetails.data?.data?.chitId || parsedUserDetails.chitId || '',
              transactionId: data?.paymentResponse?.txn_id || '',
              orderId: data?.paymentResponse?.order_id || '',
              isManual: 'no',
              utr_reference_number: '',
            };

            const paymentResult = await postPayment(paymentPayload);
            const paymentId = paymentResult?.id || paymentResult?.paymentId || 1;

            const transactionPayload = {
              userId: parsedUserDetails.data?.data?.userId || parsedUserDetails.userId || '',
              investmentId: parsedUserDetails.data?.data?.id || parsedUserDetails.id || '',
              schemeId: parsedUserDetails.data?.data?.schemeId || parsedUserDetails.schemeId || '',
              chitId: parsedUserDetails.data?.data?.chitId || parsedUserDetails.chitId || '',
              accountNumber: parsedUserDetails.data?.data?.accountNo || parsedUserDetails.accountNo || '',
              paymentId,
              orderId: data?.paymentResponse?.order_id || '',
              amount: data?.paymentResponse?.amount || '',
              currency: (data?.paymentResponse as any)?.currency || 'INR',
              paymentMethod: (data?.paymentResponse as any)?.payment_method || '',
              signature: '000',
              paymentStatus: (data?.paymentResponse?.payment_gateway_response as any)?.resp_message || 'Success',
              paymentDate: (data?.paymentResponse as any)?.date_created || '',
              status: txnStatus || 'CHARGED',
              gatewayTransactionId: data?.paymentResponse?.txn_id || '',
              gatewayresponse: '',
              isManual: 'no',
              utr_reference_number: '',
            };

            await postTransaction(transactionPayload);

            const investmentPayload = {
              userId: parsedUserDetails.data?.data?.userId || parsedUserDetails.userId || '',
              schemeId: parsedUserDetails.data?.data?.schemeId || parsedUserDetails.schemeId || '',
              chitId: parsedUserDetails.data?.data?.chitId || parsedUserDetails.chitId || '',
              accountName: parsedUserDetails.data?.data?.accountName || parsedUserDetails.accountName || '',
              accountNo: parsedUserDetails.data?.data?.accountNo || parsedUserDetails.accountNo || '',
              paymentStatus: 'PAID',
              paymentAmount: data?.paymentResponse?.amount || '',
            };

            await updateInvestment(
              parsedUserDetails.data?.data?.id || parsedUserDetails.id || '',
              investmentPayload
            );
          }

          onPaymentSuccess?.(data);
          if (socketInstance && socketInstance.connected) {
            socketInstance.disconnect();
          }
        } else if (String(txnStatus) !== 'CHARGED') {
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
              currency: (data?.paymentResponse as any)?.currency || 'INR',
              paymentMethod: (data?.paymentResponse as any)?.payment_method || '',
              signature: '000',
              paymentStatus: (data?.paymentResponse?.payment_gateway_response as any)?.resp_message || 'Failed',
              paymentDate: (data?.paymentResponse as any)?.date_created || '',
              status: txnStatus,
              gatewayTransactionId: data?.paymentResponse?.txn_id || '',
              gatewayresponse: '',
              isManual: 'no',
              utr_reference_number: '',
            };

            await postTransaction(transactionPayload);
            router.replace({
              pathname: '/(tabs)/home/payment-failure',
              params: {
                message: ((data?.paymentResponse?.txn_detail as any)?.error_message || 
                         (data?.paymentResponse?.txn_detail as any)?.response_message || 
                         'Payment Failed'),
                orderId: data?.paymentResponse?.order_id,
                txnId: data?.paymentResponse?.txn_id,
                amount: data?.paymentResponse?.amount,
                status: txnStatus
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
