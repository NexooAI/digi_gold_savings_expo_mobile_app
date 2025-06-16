import { useEffect, useRef, useState } from 'react';
import io from 'socket.io-client';
import { theme } from '@/constants/theme';
import { PaymentSocket, PaymentStatusUpdate } from '@/app/(app)/(tabs)/home/types/payment.types';
import { postPayment, postTransaction, updateInvestment } from '@/utils/paymentUtils';
import { Alert } from 'react-native';

// Add this type before the usePaymentSocket hook
type SocketEvent = `payment_status_update${string}`;

interface UsePaymentSocketProps {
  onPaymentSuccess?: (data: PaymentStatusUpdate) => void;
  onPaymentFailure?: (data: PaymentStatusUpdate) => void;
  onPaymentError?: (error: any) => void;
  onPaymentExpired?: () => void;
}

export const usePaymentSocket = ({
  onPaymentSuccess,
  onPaymentFailure,
  onPaymentError,
  onPaymentExpired,
  parsedUserDetails,
  router
}: UsePaymentSocketProps & { parsedUserDetails?: any, router?: any } = {} as UsePaymentSocketProps & { parsedUserDetails?: any, router?: any }) => {
  const [socket, setSocket] = useState<PaymentSocket | null>(null);
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
    const socketInstance = io(theme.baseUrl) as unknown as PaymentSocket;
    setSocket(socketInstance);

    const orderId = parsedUserDetails?.data?.data?.orderId || parsedUserDetails?.orderId;
    socketInstance.on(`payment_status_update`, async (data: PaymentStatusUpdate) => {
      console.log("------------------------->> ❤️ ❤️ ❤️ ", data);
      console.log("------------------------->> ❤️ ❤️ ❤️ ", parsedUserDetails, router);
      const txnStatus = data?.paymentResponse?.txn_detail?.status;
      console.log(txnStatus, data?.paymentResponse);
      try {
        if (txnStatus === 'CHARGED') {
          console.log('charged');
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
            await updateInvestment(parsedUserDetails.data?.data?.id || parsedUserDetails.id || '', investmentPayload);
          }
          onPaymentSuccess?.(data);
          console.log("------------------------->> end ", data)
          if (socketInstance && socketInstance.connected) {
            socketInstance.disconnect();
          }
        } else if (String(txnStatus) !== 'CHARGED') {
          console.log('charged');
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
              pathname: '/(tabs)/home/payment-failure', params: {
                message: ((data?.paymentResponse?.txn_detail as any)?.error_message || (data?.paymentResponse?.txn_detail as any)?.response_message || 'Payment Failed'),
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
        } else if (String(txnStatus) === 'CANCELLED' || (data as any)?.status === 'cancelled') {
          console.log('charged');
          if (router) {
            router.replace({ pathname: '/(tabs)/home/payment-faliure', params: {} });
          }
          if (socketInstance && socketInstance.connected) {
            socketInstance.disconnect();
          }
        }
      } catch (error) {
        console.error('Error in payment status update API sequence:', error);
        handleError(error);
      }
    });

    (socketInstance as any).on('error', (error: any) => {
      console.error('Socket error received:', error);
      handleError(error);
    });

    (socketInstance as any).on('payment_error', (error: any) => {
      console.error('Payment error received:', error);
      handleError(error);
    });

    return () => {
      if (socketInstance) {
        socketInstance.disconnect();
      }
    };
  }, []);

  const emitPaymentEvent = (event: string, data: any) => {
    console.log("------------------------->>", event, "❤️ ❤️ ❤️", data);
    if (socket) {
      (socket as any).emit(event, {
        ...data,
        timestamp: new Date().toISOString()
      });
    }
  };

  const handleCancel = () => {
    if (router) {
      router.replace({
        pathname: "/(tabs)/home/payment",
        params: {
          amount: parsedUserDetails?.amount || "",
          userDetails: JSON.stringify(parsedUserDetails),
          error: "Payment Cancelled",
          errorTimestamp: new Date().toISOString()
        }
      });
    }
  };

  return {
    socket,
    isPaymentCompleted: isPaymentCompleted.current,
    emitPaymentEvent,
    handleCancel
  };
}; 
