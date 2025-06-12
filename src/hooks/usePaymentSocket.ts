import { useEffect, useRef, useState } from 'react';
import io from 'socket.io-client';
import { theme } from '@/constants/theme';
import { PaymentSocket, PaymentStatusUpdate } from '@/app/(app)/(tabs)/home/types/payment.types';

interface UsePaymentSocketProps {
  onPaymentSuccess?: (data: PaymentStatusUpdate) => void;
  onPaymentFailure?: (data: PaymentStatusUpdate) => void;
  onPaymentError?: (error: any) => void;
}

export const usePaymentSocket = ({
  onPaymentSuccess,
  onPaymentFailure,
  onPaymentError
}: UsePaymentSocketProps = {}) => {
  const [socket, setSocket] = useState<PaymentSocket | null>(null);
  const isPaymentCompleted = useRef(false);

  useEffect(() => {
    const socketInstance = io(theme.baseUrl) as PaymentSocket;
    setSocket(socketInstance);

    socketInstance.on('payment_status_update', (data: PaymentStatusUpdate) => {
        console.log("------------------------->> ❤️ ❤️ ❤️ ",data)
      const paymentStatus = data?.paymentResponse?.txn_detail?.status;
      
      if (paymentStatus === 'CHARGED') {
        isPaymentCompleted.current = true;
        onPaymentSuccess?.(data);
      } else if (paymentStatus === 'FAILED') {
        isPaymentCompleted.current = true;
        onPaymentFailure?.(data);
      }
    });

    socketInstance.on('error', (error) => {
      onPaymentError?.(error);
    });

    return () => {
      if (socketInstance) {
        socketInstance.disconnect();
      }
    };
  }, []);

  const emitPaymentEvent = (event: string, data: any) => {
    if (socket) {
      socket.emit(event, {
        ...data,
        timestamp: new Date().toISOString()
      });
    }
  };

  return {
    socket,
    isPaymentCompleted: isPaymentCompleted.current,
    emitPaymentEvent
  };
}; 