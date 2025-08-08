import { useEffect, useRef, useCallback } from "react";
import { io, Socket } from "socket.io-client";
import { useRouter } from "expo-router";
import { Alert } from 'react-native';
import { AppState, AppStateStatus } from "react-native";
import { theme } from "@/constants/theme";

// Bank-specific payment configurations
export interface BankConfig {
  bankName: string;
  bankCode: string;
  paymentTimeout: number;
  retryAttempts: number;
  customEvents: string[];
  webhookEndpoints: string[];
  successPatterns: string[];
  failurePatterns: string[];
  customHeaders?: Record<string, string>;
}

// Customer-specific payment data
export interface CustomerPaymentData {
  customerId: string;
  customerName: string;
  bankDetails: {
    bankName: string;
    accountNumber: string;
    ifscCode: string;
    accountType: 'savings' | 'current' | 'business';
  };
  paymentPreferences: {
    preferredPaymentMethod: 'upi' | 'netbanking' | 'card' | 'wallet';
    autoRetry: boolean;
    notificationPreferences: 'sms' | 'email' | 'push' | 'all';
  };
  customFields?: Record<string, any>;
}

// Payment socket configuration
export interface CustomizedPaymentSocketConfig {
  bankConfig: BankConfig;
  customerData: CustomerPaymentData;
  orderId: string;
  amount: number;
  currency?: string;
  onPaymentSuccess?: (data: any) => void;
  onPaymentFailure?: (data: any) => void;
  onPaymentError?: (error: any) => void;
  onPaymentExpired?: () => void;
  onBankSpecificEvent?: (eventName: string, data: any) => void;
  customValidation?: (data: any) => boolean;
  retryStrategy?: 'immediate' | 'delayed' | 'exponential';
}

// Bank-specific socket handlers
interface BankSocketHandlers {
  [bankCode: string]: {
    onConnect: (socket: Socket, config: CustomizedPaymentSocketConfig) => void;
    onPaymentUpdate: (data: any, config: CustomizedPaymentSocketConfig) => void;
    onCustomEvent: (eventName: string, data: any, config: CustomizedPaymentSocketConfig) => void;
    onError: (error: any, config: CustomizedPaymentSocketConfig) => void;
    validatePaymentData: (data: any) => boolean;
  };
}

// Predefined bank configurations
export const BANK_CONFIGS: Record<string, BankConfig> = {
  'HDFC': {
    bankName: 'HDFC Bank',
    bankCode: 'HDFC',
    paymentTimeout: 300000, // 5 minutes
    retryAttempts: 3,
    customEvents: ['hdfc_payment_status', 'hdfc_otp_required', 'hdfc_verification_needed'],
    webhookEndpoints: ['/hdfc/webhook', '/hdfc/callback'],
    successPatterns: ['SUCCESS', 'COMPLETED', 'CHARGED'],
    failurePatterns: ['FAILED', 'DECLINED', 'CANCELLED'],
    customHeaders: {
      'X-Bank-Code': 'HDFC',
      'X-Integration-Type': 'direct'
    }
  },
  'ICICI': {
    bankName: 'ICICI Bank',
    bankCode: 'ICICI',
    paymentTimeout: 240000, // 4 minutes
    retryAttempts: 2,
    customEvents: ['icici_payment_update', 'icici_secure_pay', 'icici_verification'],
    webhookEndpoints: ['/icici/webhook', '/icici/status'],
    successPatterns: ['SUCCESS', 'APPROVED', 'COMPLETED'],
    failurePatterns: ['FAILED', 'REJECTED', 'TIMEOUT'],
    customHeaders: {
      'X-Bank-Code': 'ICICI',
      'X-Secure-Pay': 'enabled'
    }
  },
  'SBI': {
    bankName: 'State Bank of India',
    bankCode: 'SBI',
    paymentTimeout: 360000, // 6 minutes
    retryAttempts: 4,
    customEvents: ['sbi_payment_status', 'sbi_otp_verification', 'sbi_secure_pay'],
    webhookEndpoints: ['/sbi/webhook', '/sbi/callback'],
    successPatterns: ['SUCCESS', 'COMPLETED', 'APPROVED'],
    failurePatterns: ['FAILED', 'DECLINED', 'CANCELLED'],
    customHeaders: {
      'X-Bank-Code': 'SBI',
      'X-Secure-Pay': 'enabled'
    }
  },
  'AXIS': {
    bankName: 'Axis Bank',
    bankCode: 'AXIS',
    paymentTimeout: 300000, // 5 minutes
    retryAttempts: 3,
    customEvents: ['axis_payment_update', 'axis_secure_pay', 'axis_verification'],
    webhookEndpoints: ['/axis/webhook', '/axis/status'],
    successPatterns: ['SUCCESS', 'COMPLETED', 'APPROVED'],
    failurePatterns: ['FAILED', 'DECLINED', 'CANCELLED'],
    customHeaders: {
      'X-Bank-Code': 'AXIS',
      'X-Secure-Pay': 'enabled'
    }
  },
  'KOTAK': {
    bankName: 'Kotak Mahindra Bank',
    bankCode: 'KOTAK',
    paymentTimeout: 240000, // 4 minutes
    retryAttempts: 2,
    customEvents: ['kotak_payment_status', 'kotak_secure_pay'],
    webhookEndpoints: ['/kotak/webhook'],
    successPatterns: ['SUCCESS', 'COMPLETED'],
    failurePatterns: ['FAILED', 'DECLINED'],
    customHeaders: {
      'X-Bank-Code': 'KOTAK'
    }
  }
};

// Bank-specific socket handlers
const BANK_SOCKET_HANDLERS: BankSocketHandlers = {
  'HDFC': {
    onConnect: (socket, config) => {
      console.log('🟦 HDFC Bank socket connected');
      socket.emit('hdfc_join_room', {
        orderId: config.orderId,
        customerId: config.customerData.customerId,
        accountNumber: config.customerData.bankDetails.accountNumber
      });
    },
    onPaymentUpdate: (data, config) => {
      console.log('🟦 HDFC payment update:', data);
      // HDFC specific payment processing
      if (data.status === 'SUCCESS' || data.paymentResponse?.status === 'CHARGED') {
        config.onPaymentSuccess?.(data);
      } else if (data.status === 'FAILED' || data.paymentResponse?.status === 'FAILED') {
        config.onPaymentFailure?.(data);
      }
    },
    onCustomEvent: (eventName, data, config) => {
      console.log('🟦 HDFC custom event:', eventName, data);
      if (eventName === 'hdfc_otp_required') {
        // Handle HDFC OTP requirement
        Alert.alert('HDFC OTP Required', 'Please enter the OTP sent to your registered mobile number');
      }
      config.onBankSpecificEvent?.(eventName, data);
    },
    onError: (error, config) => {
      console.error('🟦 HDFC payment error:', error);
      config.onPaymentError?.(error);
    },
    validatePaymentData: (data) => {
      return data && data.paymentResponse && data.paymentResponse.txn_id;
    }
  },
  'ICICI': {
    onConnect: (socket, config) => {
      console.log('🟨 ICICI Bank socket connected');
      socket.emit('icici_join_room', {
        orderId: config.orderId,
        customerId: config.customerData.customerId,
        securePay: true
      });
    },
    onPaymentUpdate: (data, config) => {
      console.log('🟨 ICICI payment update:', data);
      // ICICI specific payment processing
      if (data.status === 'SUCCESS' || data.paymentResponse?.status === 'APPROVED') {
        config.onPaymentSuccess?.(data);
      } else if (data.status === 'FAILED' || data.paymentResponse?.status === 'REJECTED') {
        config.onPaymentFailure?.(data);
      }
    },
    onCustomEvent: (eventName, data, config) => {
      console.log('🟨 ICICI custom event:', eventName, data);
      if (eventName === 'icici_secure_pay') {
        // Handle ICICI SecurePay
        Alert.alert('ICICI SecurePay', 'Please complete the secure payment verification');
      }
      config.onBankSpecificEvent?.(eventName, data);
    },
    onError: (error, config) => {
      console.error('🟨 ICICI payment error:', error);
      config.onPaymentError?.(error);
    },
    validatePaymentData: (data) => {
      return data && data.paymentResponse && data.paymentResponse.txn_id;
    }
  },
  'SBI': {
    onConnect: (socket, config) => {
      console.log('🟩 SBI Bank socket connected');
      socket.emit('sbi_join_room', {
        orderId: config.orderId,
        customerId: config.customerData.customerId,
        accountNumber: config.customerData.bankDetails.accountNumber
      });
    },
    onPaymentUpdate: (data, config) => {
      console.log('🟩 SBI payment update:', data);
      // SBI specific payment processing
      if (data.status === 'SUCCESS' || data.paymentResponse?.status === 'COMPLETED') {
        config.onPaymentSuccess?.(data);
      } else if (data.status === 'FAILED' || data.paymentResponse?.status === 'FAILED') {
        config.onPaymentFailure?.(data);
      }
    },
    onCustomEvent: (eventName, data, config) => {
      console.log('🟩 SBI custom event:', eventName, data);
      if (eventName === 'sbi_otp_verification') {
        // Handle SBI OTP verification
        Alert.alert('SBI OTP Verification', 'Please enter the OTP sent to your registered mobile number');
      }
      config.onBankSpecificEvent?.(eventName, data);
    },
    onError: (error, config) => {
      console.error('🟩 SBI payment error:', error);
      config.onPaymentError?.(error);
    },
    validatePaymentData: (data) => {
      return data && data.paymentResponse && data.paymentResponse.txn_id;
    }
  },
  'AXIS': {
    onConnect: (socket, config) => {
      console.log('🟪 Axis Bank socket connected');
      socket.emit('axis_join_room', {
        orderId: config.orderId,
        customerId: config.customerData.customerId,
        securePay: true
      });
    },
    onPaymentUpdate: (data, config) => {
      console.log('🟪 Axis payment update:', data);
      // Axis specific payment processing
      if (data.status === 'SUCCESS' || data.paymentResponse?.status === 'APPROVED') {
        config.onPaymentSuccess?.(data);
      } else if (data.status === 'FAILED' || data.paymentResponse?.status === 'DECLINED') {
        config.onPaymentFailure?.(data);
      }
    },
    onCustomEvent: (eventName, data, config) => {
      console.log('🟪 Axis custom event:', eventName, data);
      if (eventName === 'axis_secure_pay') {
        // Handle Axis SecurePay
        Alert.alert('Axis SecurePay', 'Please complete the secure payment verification');
      }
      config.onBankSpecificEvent?.(eventName, data);
    },
    onError: (error, config) => {
      console.error('🟪 Axis payment error:', error);
      config.onPaymentError?.(error);
    },
    validatePaymentData: (data) => {
      return data && data.paymentResponse && data.paymentResponse.txn_id;
    }
  },
  'KOTAK': {
    onConnect: (socket, config) => {
      console.log('🟧 Kotak Bank socket connected');
      socket.emit('kotak_join_room', {
        orderId: config.orderId,
        customerId: config.customerData.customerId
      });
    },
    onPaymentUpdate: (data, config) => {
      console.log('🟧 Kotak payment update:', data);
      // Kotak specific payment processing
      if (data.status === 'SUCCESS' || data.paymentResponse?.status === 'COMPLETED') {
        config.onPaymentSuccess?.(data);
      } else if (data.status === 'FAILED' || data.paymentResponse?.status === 'FAILED') {
        config.onPaymentFailure?.(data);
      }
    },
    onCustomEvent: (eventName, data, config) => {
      console.log('🟧 Kotak custom event:', eventName, data);
      config.onBankSpecificEvent?.(eventName, data);
    },
    onError: (error, config) => {
      console.error('🟧 Kotak payment error:', error);
      config.onPaymentError?.(error);
    },
    validatePaymentData: (data) => {
      return data && data.paymentResponse && data.paymentResponse.txn_id;
    }
  }
};

export const useCustomizedPaymentSocket = (config: CustomizedPaymentSocketConfig) => {
  const socketRef = useRef<Socket | null>(null);
  const isPaymentCompleted = useRef(false);
  const retryCount = useRef(0);
  const paymentTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const router = useRouter();

  const { bankConfig, customerData } = config;
  const bankHandler = BANK_SOCKET_HANDLERS[bankConfig.bankCode];

  // Initialize socket connection with bank-specific configuration
  const initializeSocket = useCallback(() => {
    if (socketRef.current?.connected) {
      return;
    }

    console.log(`🏦 Initializing ${bankConfig.bankName} payment socket`);
    
    const socketInstance = io(theme.baseUrl, {
      transports: ["websocket"],
      reconnection: true,
      reconnectionAttempts: bankConfig.retryAttempts,
      reconnectionDelay: 1000,
      timeout: bankConfig.paymentTimeout,
      extraHeaders: bankConfig.customHeaders
    });

    socketRef.current = socketInstance;

    // Set payment timeout
    paymentTimeoutRef.current = setTimeout(() => {
      if (!isPaymentCompleted.current) {
        console.log(`⏰ ${bankConfig.bankName} payment timeout`);
        config.onPaymentExpired?.();
        socketInstance.disconnect();
      }
    }, bankConfig.paymentTimeout);

    // Handle connection events
    socketInstance.on("connect", () => {
      console.log(`✅ ${bankConfig.bankName} socket connected`);
      retryCount.current = 0;
      
      // Use bank-specific connection handler
      if (bankHandler) {
        bankHandler.onConnect(socketInstance, config);
      } else {
        // Fallback to generic connection
        socketInstance.emit("joinOrderRoom", config.orderId);
      }
    });

    socketInstance.on("connect_error", (error) => {
      console.error(`❌ ${bankConfig.bankName} connection error:`, error);
      retryCount.current++;
      
      if (retryCount.current >= bankConfig.retryAttempts) {
        config.onPaymentError?.({
          error: "Connection Error",
          message: `Failed to connect to ${bankConfig.bankName} payment server`,
          bankCode: bankConfig.bankCode
        });
      }
    });

    socketInstance.on("disconnect", (reason) => {
      console.log(`🔌 ${bankConfig.bankName} socket disconnected:`, reason);
      if (!isPaymentCompleted.current) {
        config.onPaymentError?.({
          error: "Disconnected",
          message: `Lost connection to ${bankConfig.bankName} payment server`,
          bankCode: bankConfig.bankCode
        });
      }
    });

    // Listen for bank-specific payment status updates
    socketInstance.on("payment_status_update", async (data: any) => {
      console.log(`${bankConfig.bankName} payment status update:`, data);

      // Use bank-specific payment update handler
      if (bankHandler) {
        bankHandler.onPaymentUpdate(data, config);
      } else {
        // Fallback to generic payment processing
        const isSuccess = bankConfig.successPatterns.some(pattern => 
          data?.status?.includes(pattern) || 
          data?.paymentResponse?.status?.includes(pattern)
        );

        if (isSuccess) {
          isPaymentCompleted.current = true;
          config.onPaymentSuccess?.(data);
        } else {
          isPaymentCompleted.current = true;
          config.onPaymentFailure?.(data);
        }
      }

      // Clear timeout on payment completion
      if (paymentTimeoutRef.current) {
        clearTimeout(paymentTimeoutRef.current);
      }
    });

    // Listen for bank-specific custom events
    bankConfig.customEvents.forEach(eventName => {
      socketInstance.on(eventName, (data: any) => {
        console.log(`${bankConfig.bankName} custom event ${eventName}:`, data);
        if (bankHandler) {
          bankHandler.onCustomEvent(eventName, data, config);
        } else {
          config.onBankSpecificEvent?.(eventName, data);
        }
      });
    });

    // Handle app state changes
    const handleAppStateChange = (nextAppState: AppStateStatus) => {
      if (nextAppState === "active") {
        const socketInstance = socketRef.current;
        if (socketInstance && !socketInstance.connected) {
          console.log(`🔄 Reconnecting to ${bankConfig.bankName} socket`);
          socketInstance.connect();
        }
      }
    };

    const appStateSubscription = AppState.addEventListener("change", handleAppStateChange);

    return () => {
      if (paymentTimeoutRef.current) {
        clearTimeout(paymentTimeoutRef.current);
      }
      appStateSubscription.remove();
    };
  }, [bankConfig, config]);

  // Initialize socket on mount
  useEffect(() => {
    const cleanup = initializeSocket();

    return () => {
      if (socketRef.current?.connected) {
        socketRef.current.disconnect();
      }
      if (paymentTimeoutRef.current) {
        clearTimeout(paymentTimeoutRef.current);
      }
      cleanup?.();
    };
  }, [initializeSocket]);

  // Handle payment cancellation
  const handleCancel = useCallback(() => {
    console.log(`❌ Cancelling ${bankConfig.bankName} payment`);
    isPaymentCompleted.current = true;
    
    if (socketRef.current?.connected) {
      socketRef.current.emit(`${bankConfig.bankCode.toLowerCase()}_cancel_payment`, {
        orderId: config.orderId,
        customerId: customerData.customerId
      });
      socketRef.current.disconnect();
    }

    if (paymentTimeoutRef.current) {
      clearTimeout(paymentTimeoutRef.current);
    }

    config.onPaymentFailure?.({
      status: 'CANCELLED',
      message: 'Payment cancelled by user',
      bankCode: bankConfig.bankCode
    });
  }, [bankConfig, config, customerData]);

  // Retry payment with bank-specific strategy
  const retryPayment = useCallback(() => {
    if (retryCount.current >= bankConfig.retryAttempts) {
      console.log(`🔄 Max retry attempts reached for ${bankConfig.bankName}`);
      return false;
    }

    console.log(`🔄 Retrying ${bankConfig.bankName} payment (attempt ${retryCount.current + 1})`);
    
    if (config.retryStrategy === 'exponential') {
      const delay = Math.pow(2, retryCount.current) * 1000;
      setTimeout(() => {
        initializeSocket();
      }, delay);
    } else if (config.retryStrategy === 'delayed') {
      setTimeout(() => {
        initializeSocket();
      }, 2000);
    } else {
      // Immediate retry
      initializeSocket();
    }

    retryCount.current++;
    return true;
  }, [bankConfig, config, initializeSocket]);

  return {
    socket: socketRef.current,
    handleCancel,
    retryPayment,
    isConnected: socketRef.current?.connected || false,
    bankConfig,
    customerData,
    retryCount: retryCount.current
  };
}; 