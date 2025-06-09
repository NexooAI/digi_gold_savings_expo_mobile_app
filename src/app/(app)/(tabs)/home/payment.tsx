import React, { useEffect, useState, useMemo, useRef } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  Dimensions,
  Animated,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, useNavigation, useRouter } from "expo-router";
import io from "socket.io-client";
import apiService, { rates } from "@/services/api";
import { theme } from "@/constants/theme";
import { Ionicons } from "@expo/vector-icons";
import CustomAlert from "@/app/components/Alert";
import { LinearGradient } from "expo-linear-gradient";
import { BlurView } from "expo-blur";
import AsyncStorage from '@react-native-async-storage/async-storage';
import useGlobalStore from "@/store/global.store";

const { width } = Dimensions.get("window");

interface PaymentData {
  amount: number;
  goldWeight: number;
  schemeName: string;
  installmentNumber: number;
  totalInstallments: number;
  investmentType: string;
  maturityDate?: string;
  currentGoldPrice: number;
  paymentFrequency: string;
}

interface DisplayData {
  schemeName: string;
  accountHolder: string;
  accNo: string;
  totalPaid: string;
  monthsPaid: string;
  noOfIns: string;
  goldWeight: string;
  maturityDate: string;
  paymentFrequency: string;
}

interface UserDetails {
  name?: string;
  accountname?: string;
  accNo?: string;
  accountNo?: string;
  mobile?: string;
  email?: string;
  userId?: string;
  investmentId?: string;
  schemeId?: string;
  chitId?: string;
  paymentFrequency?: string;
  schemeName?: string;
  isRetryAttempt?: boolean;
  retryData?: any;
  data?: {
    data?: {
      schemeId?: string;
      chitId?: string;
    };
  };
  userEmail?: string;
  userMobile?: string;
}

interface PaymentRetryData {
  paymentData: {
    amount: number;
  };
  displayData: DisplayData;
}

const PaymentProcessScreen = () => {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { amount: amountString, userDetails } = useLocalSearchParams();
  const amount = parseFloat(
    Array.isArray(amountString) ? amountString[0] : amountString
  );
  
  // Add debugging for amount
  console.log('=== PAYMENT SCREEN MOUNTED ===');
  console.log('Raw amount parameter:', amountString);
  console.log('Parsed amount:', amount);
  console.log('Raw userDetails parameter:', userDetails);

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

  // Memoize parsed details so they don't change on every render.
  const parsedUserDetails = useMemo(
    () => {
      try {
        // First try to parse from URL parameters (for backward compatibility)
        if (userDetails) {
          return JSON.parse(
            Array.isArray(userDetails) ? userDetails[0] : userDetails || "{}"
          );
        }
        
        // If no userDetails in URL, we'll load from storage in useEffect
        return {};
      } catch (error) {
        console.error('Error parsing userDetails from URL:', error);
        return {};
      }
    },
    [userDetails]
  );
  
  // State for session data loaded from storage
  const [sessionData, setSessionData] = useState<any>(null);
  const [sessionDataLoading, setSessionDataLoading] = useState(true);

  // Get global store functions
  const { 
    getCurrentPaymentSession, 
    getPaymentRetryData, 
    hasPaymentRetryData,
    clearPaymentRetryData,
    clearPaymentSession,
    storePaymentRetryData
  } = useGlobalStore();

  // Load session data from global store if userDetails is not provided via URL
  useEffect(() => {
    const loadSessionData = async () => {
      try {
        setSessionDataLoading(true);
        
        // Check if this is a retry attempt from URL parameters
        const isRetryFromParams = params.isRetry === 'true';
        
        console.log('Loading payment session data from global store...');
        console.log('Is retry from params:', isRetryFromParams);
        
        const storedSessionData = getCurrentPaymentSession();
        
        if (storedSessionData) {
          console.log('Loaded session data from global store:', storedSessionData);
          setSessionData(storedSessionData);
          
          // If this is a retry, set the retry flag
          if (isRetryFromParams || storedSessionData.userDetails?.isRetryAttempt) {
            console.log('Setting retry flag to true');
            setIsRetry(true);
          }
        } else if (!userDetails || Object.keys(parsedUserDetails).length === 0) {
          console.warn('No stored session data found and no userDetails from URL');
        }
        
        // If we have userDetails from URL but no session data, we still might be in a retry
        if (userDetails && Object.keys(parsedUserDetails).length > 0) {
          console.log('Using userDetails from URL parameters');
          if (isRetryFromParams || parsedUserDetails.isRetryAttempt) {
            console.log('Setting retry flag to true from URL userDetails');
            setIsRetry(true);
          }
        }
      } catch (error) {
        console.error('Error loading session data:', error);
      } finally {
        setSessionDataLoading(false);
      }
    };

    loadSessionData();
  }, [userDetails, parsedUserDetails, params.isRetry]);

  // Combine user details from URL params and session data
  const finalUserDetails = useMemo<UserDetails>(() => {
    if (Object.keys(parsedUserDetails).length > 0) {
      // Use URL parameters if available
      console.log('Using user details from URL parameters');
      return {
        ...parsedUserDetails,
        paymentFrequency: parsedUserDetails.paymentFrequency || "Monthly"
      };
    } else if (sessionData?.userDetails) {
      // Use session data as fallback
      console.log('Using user details from session data');
      const userDetails = sessionData.userDetails;
      
      // Ensure all necessary fields are available and properly mapped
      const mappedUserDetails: UserDetails = {
        ...userDetails,
        // Map different field variations to standard names
        name: userDetails.name || userDetails.accountname,
        accNo: userDetails.accNo || userDetails.accountNo,
        mobile: userDetails.mobile,
        email: userDetails.email,
        userId: userDetails.userId,
        investmentId: userDetails.investmentId,
        schemeId: userDetails.schemeId,
        chitId: userDetails.chitId,
        paymentFrequency: userDetails.paymentFrequency || "Monthly"
      };
      
      // If this is retry data, make sure retryData is accessible
      if (userDetails.isRetryAttempt && userDetails.retryData) {
        console.log('Adding retry data to user details from session');
        mappedUserDetails.retryData = userDetails.retryData;
      }
      
      return mappedUserDetails;
    }
    
    console.log('No user details available from URL or session');
    return { paymentFrequency: "Monthly" };
  }, [parsedUserDetails, sessionData]);

  const paramsParse = useMemo(
    () =>
      JSON.parse(
        Array.isArray(params.data) ? params.data[0] : params.data || "{}"
      ),
    [params.data]
  );

  const [isLoading, setIsLoading] = useState(false);
  const [socket, setSocket] = useState<any>(null);
  const navigation = useNavigation();
  const [isNavigationReady, setIsNavigationReady] = useState(false);

  // This ref will guard against duplicate processing of the payment event
  const processedPaymentRef = useRef(false);

  const scaleAnim = useRef(new Animated.Value(1)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;

  const [paymentDetails, setPaymentDetails] = useState<PaymentData>({
    amount: amount,
    goldWeight: 0,
    schemeName: finalUserDetails?.schemeName || "Gold Savings Scheme",
    installmentNumber: 1,
    totalInstallments: 11,
    investmentType: finalUserDetails?.paymentFrequency || "Monthly",
    maturityDate: undefined,
    currentGoldPrice: 0,
    paymentFrequency: finalUserDetails?.paymentFrequency || "Monthly",
  });

  // Add new state for retry
  const [isRetry, setIsRetry] = useState(false);

  // Update payment details when finalUserDetails changes
  useEffect(() => {
    if (finalUserDetails?.paymentFrequency) {
      const frequency = finalUserDetails.paymentFrequency;
      setPaymentDetails(prev => ({
        ...prev,
        paymentFrequency: frequency,
        investmentType: frequency,
      }));
    }
  }, [finalUserDetails?.paymentFrequency]);

  // Check if this is a retry using global store
  const checkRetryStatus = async () => {
    try {
      if (hasPaymentRetryData()) {
        console.log('Retry data found in global store');
        setIsRetry(true);
        const paymentRetryData = getPaymentRetryData() as PaymentRetryData;
        if (paymentRetryData) {
          // Update payment details with stored data
          setPaymentDetails(prev => ({
            ...prev,
            amount: paymentRetryData.paymentData.amount,
            goldWeight: Number(paymentRetryData.displayData.goldWeight) || 0,
            schemeName: paymentRetryData.displayData.schemeName,
            installmentNumber: Number(paymentRetryData.displayData.monthsPaid) + 1 || 1,
            totalInstallments: Number(paymentRetryData.displayData.noOfIns) || 11,
            investmentType: paymentRetryData.displayData.paymentFrequency || "Monthly",
            maturityDate: paymentRetryData.displayData.maturityDate,
            currentGoldPrice: 0,
            paymentFrequency: paymentRetryData.displayData.paymentFrequency || "Monthly",
          }));
        }
      }
    } catch (error) {
      console.error('Error checking retry status:', error);
    }
  };

  // Add useEffect to check retry status on mount
  useEffect(() => {
    const debugGlobalStore = async () => {
      try {
        console.log('=== GLOBAL STORE DEBUG ===');
        const currentPaymentSession = getCurrentPaymentSession();
        const paymentRetryData = getPaymentRetryData();
        const hasRetryData = hasPaymentRetryData();
        
        console.log('Current payment session:', currentPaymentSession);
        console.log('Payment retry data:', paymentRetryData);
        console.log('Has retry data:', hasRetryData);
        
        // If we have session data but missing user details, try to combine them
        if (currentPaymentSession && (!parsedUserDetails.schemeId || !parsedUserDetails.investmentId)) {
          console.log('Found session data to supplement user details:', currentPaymentSession);
        }
      } catch (error) {
        console.error('Error debugging global store:', error);
      }
    };
    
    debugGlobalStore();
    checkRetryStatus();
  }, []);

  // Fetch current gold rate and calculate gold weight
  useEffect(() => {
    const fetchCurrentGoldRate = async () => {
      try {
        // First try to get from AsyncStorage (cached from home page)
        const cachedRate = await AsyncStorage.getItem('gold_rate');
        if (cachedRate) {
          const rate = parseFloat(cachedRate);
          setPaymentDetails(prev => ({
            ...prev,
            currentGoldPrice: rate,
            goldWeight: amount / rate
          }));
          console.log('Using cached gold rate:', rate);
          return;
        }

        // If no cached rate, fetch from API
        console.log('Fetching fresh gold rate from API...');
        const response = await rates.getLiveRates();
        if (response.data?.data?.gold_rate) {
          const rate = parseFloat(response.data.data.gold_rate);
          setPaymentDetails(prev => ({
            ...prev,
            currentGoldPrice: rate,
            goldWeight: amount / rate
          }));
          // Cache the rate
          await AsyncStorage.setItem('gold_rate', response.data.data.gold_rate);
          console.log('Fetched and cached new gold rate:', rate);
        } else {
          // Fallback rate if API fails
          const fallbackRate = 7315; // Default rate
          setPaymentDetails(prev => ({
            ...prev,
            currentGoldPrice: fallbackRate,
            goldWeight: amount / fallbackRate
          }));
          console.log('Using fallback gold rate:', fallbackRate);
        }
      } catch (error) {
        console.error('Error fetching gold rate:', error);
        // Use fallback rate
        const fallbackRate = 7315;
        setPaymentDetails(prev => ({
          ...prev,
          currentGoldPrice: fallbackRate,
          goldWeight: amount / fallbackRate
        }));
      }
    };

    fetchCurrentGoldRate();
  }, [amount]);

  // Update gold weight when amount or gold price changes
  useEffect(() => {
    if (paymentDetails.currentGoldPrice > 0) {
      const calculatedWeight = amount / paymentDetails.currentGoldPrice;
      setPaymentDetails(prev => ({
        ...prev,
        goldWeight: calculatedWeight
      }));
    }
  }, [amount, paymentDetails.currentGoldPrice]);

  const animateButton = () => {
    Animated.sequence([
      Animated.timing(scaleAnim, {
        toValue: 0.95,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start();
  };

  // Define paymentInit before handlePayPress
  const paymentInit = async () => {
    if (!isNavigationReady) return;
    processedPaymentRef.current = false;
    setIsLoading(true);

    try {
      // Add debugging to see what data we have
      console.log('=== PAYMENT INIT DEBUG ===');
      console.log('finalUserDetails:', finalUserDetails);
      console.log('sessionData:', sessionData);
      console.log('parsedUserDetails:', parsedUserDetails);
      console.log('amount:', amount);
      console.log('isRetry state:', isRetry);
      console.log('parsedUserDetails.isRetryAttempt:', finalUserDetails.isRetryAttempt);
      
      let payloadToUse = {
        userId: finalUserDetails.userId || finalUserDetails.data?.data?.userId,
        amount: amount,
        investmentId: finalUserDetails.investmentId || finalUserDetails.data?.data?.id,
        schemeId: finalUserDetails.schemeId || finalUserDetails.data?.data?.schemeId,
        userEmail: finalUserDetails.email || finalUserDetails.userEmail,
        userMobile: finalUserDetails.mobile || finalUserDetails.userMobile,
        userName: finalUserDetails.name || finalUserDetails.userName || finalUserDetails.accountname,
        chitId: finalUserDetails.chitId || finalUserDetails.data?.data?.chitId || 1,
      };

      console.log('=== PAYMENT API CALL ===');
      console.log('API Endpoint:', '/payments/initiate');
      console.log('Request Payload:', payloadToUse);

      // Convert payload to x-www-form-urlencoded format
      const formBody = new URLSearchParams();
      Object.entries(payloadToUse).forEach(([key, value]) => {
        formBody.append(key, String(value));
      });

      const response = await apiService.post("/payments/initiate", formBody.toString(), {
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
      });

      console.log('=== PAYMENT API RESPONSE ===');
      console.log('Response Status:', response.status);
      console.log('Response Data:', response.data);
      console.log('Payment URL:', response.data.session.payment_links.web);

      const paymentUrl = response.data.session.payment_links.web;
      router.push({
        pathname: "/(tabs)/home/PaymentWebView",
        params: { paymentUrl },
      });
    } catch (error: any) {
      console.error('=== PAYMENT API ERROR ===');
      console.error('Error Type:', error.name);
      console.error('Error Message:', error.message);
      console.error('Error Response:', error.response?.data);
      console.error('Error Status:', error.response?.status);
      
      if (socket) {
        socket.emit("payment_initiation_failed", {
          error: error.message,
          timestamp: new Date().toISOString(),
          isRetryAttempt: isRetry,
        });
      }
      Alert.alert("Payment Error", "Failed to initiate payment. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handlePayPress = () => {
    animateButton();
    paymentInit();
  };

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

  // Keep the implementation inside useEffect
  useEffect(() => {
    if (!socket) return;

    const handlePaymentStatusUpdate = async (data: any) => {
      if (processedPaymentRef.current) return;
      processedPaymentRef.current = true;
      console.log("Payment status update received:", data);
      
      try {
        let paymentId = 0;
        
        // Use stored retry data if available
        let baseUserDetails = finalUserDetails;
        const isRetryAttempt = finalUserDetails.isRetryAttempt || isRetry;
        
        if (isRetryAttempt && finalUserDetails.retryData) {
          console.log('Using stored retry data for payment processing');
          baseUserDetails = {
            ...finalUserDetails,
            data: {
              data: {
                userId: finalUserDetails.retryData.paymentData.userId,
                id: finalUserDetails.retryData.paymentData.investmentId,
                schemeId: finalUserDetails.retryData.paymentData.schemeId,
                chitId: finalUserDetails.retryData.paymentData.chitId,
                accountName: finalUserDetails.retryData.investmentData.accountName,
                accountNo: finalUserDetails.retryData.investmentData.accountNo,
              }
            }
          };
        }

        // Check if this is an API error
        if (data?.data?.data?.error) {
          // Show API error in popup
          setAlertState({
            visible: true,
            title: "Payment Error",
            message: data.data.data.message || "An error occurred while processing the payment.",
            type: "error",
            txn_id: data?.paymentResponse?.txn_id || "",
            order_id: data?.paymentResponse?.order_id || "",
            amount: data?.paymentResponse?.amount?.toString() || "",
            buttons: [
              {
                text: "OK",
                onPress: () => {
                  setAlertState(prev => ({ ...prev, visible: false }));
                  router.back();
                }
              }
            ]
          });
          return;
        }
        
        // Check payment status
        const paymentStatus = data?.paymentResponse?.txn_detail?.status;
        const isSuccess = paymentStatus === "CHARGED";
        
        if (isSuccess) {
          // Clear stored payment data on success from global store
          clearPaymentRetryData();
          clearPaymentSession();
          
          setPaymentSuccessData({
            txn_id: data?.paymentResponse?.txn_id,
            amount: data?.paymentResponse?.amount,
            order_id: data?.paymentResponse?.order_id,
          });
          
          router.push({
            pathname: "/(tabs)/home/payment-success",
            params: {
              amount: data?.paymentResponse?.amount,
              txnId: data?.paymentResponse?.txn_id,
              orderId: data?.paymentResponse?.order_id,
              goldWeight: paymentDetails.goldWeight,
              schemeName: paymentDetails.schemeName,
              installmentNumber: paymentDetails.installmentNumber,
              totalInstallments: paymentDetails.totalInstallments,
              schemeId: finalUserDetails.data?.data?.schemeId || finalUserDetails.schemeId,
              chitId: finalUserDetails.data?.data?.chitId || finalUserDetails.chitId
            }
          });
        } else {
          // Show payment failure in popup
          setAlertState({
            visible: true,
            title: "Payment Failed",
            message: data?.paymentResponse?.payment_gateway_response?.resp_message || 
                    data?.message || 
                    "Your payment has failed. Please try again.",
            type: "error",
            txn_id: data?.paymentResponse?.txn_id || "",
            order_id: data?.paymentResponse?.order_id || "",
            amount: data?.paymentResponse?.amount?.toString() || "",
            buttons: [
              {
                text: "OK",
                onPress: () => {
                  setAlertState(prev => ({ ...prev, visible: false }));
                  router.back();
                }
              }
            ]
          });
        }
        
        console.log('Payment processing completed', {
          isRetry: isRetryAttempt,
          paymentId,
          transactionId: data?.paymentResponse?.txn_id
        });
      } catch (error) {
        console.error("Error processing payment status update:", error);
        setAlertState({
          visible: true,
          title: "Payment Error",
          message: "An error occurred while processing the transaction.",
          type: "error",
          txn_id: "",
          order_id: "",
          amount: "",
          buttons: [
            {
              text: "OK",
              onPress: () => {
                setAlertState(prev => ({ ...prev, visible: false }));
                router.back();
              }
            }
          ]
        });
      }
    };

    socket.on("payment_status_update", handlePaymentStatusUpdate);
    return () => {
      socket.off("payment_status_update", handlePaymentStatusUpdate);
    };
  }, [socket, isRetry, finalUserDetails]);

  // API call functions
  const postTransaction = async (payload: any) => {
    try {
      console.log('=== CREATE TRANSACTION API ===');
      console.log('API Endpoint:', '/transactions');
      console.log('Request Payload:', payload);

      const response = await apiService.post("/transactions", payload);
      
      console.log('=== TRANSACTION API RESPONSE ===');
      console.log('Response Status:', response.status);
      console.log('Response Data:', response.data);
      
      return response.data;
    } catch (error: any) {
      console.error('=== TRANSACTION API ERROR ===');
      console.error('Error Type:', error.name);
      console.error('Error Message:', error.message);
      console.error('Error Response:', error.response?.data);
      console.error('Error Status:', error.response?.status);
      throw error;
    }
  };

  const postPayment = async (payload: any) => {
    try {
      console.log('=== CREATE PAYMENT RECORD API ===');
      console.log('API Endpoint:', '/payments');
      console.log('Request Payload:', payload);

      const response = await apiService.post("/payments", payload);
      
      console.log('=== PAYMENT RECORD API RESPONSE ===');
      console.log('Response Status:', response.status);
      console.log('Response Data:', response.data);
      
      return response.data;
    } catch (error: any) {
      console.error('=== PAYMENT RECORD API ERROR ===');
      console.error('Error Type:', error.name);
      console.error('Error Message:', error.message);
      console.error('Error Response:', error.response?.data);
      console.error('Error Status:', error.response?.status);
      throw error;
    }
  };

  const updateInversment = async (id: any, payload: any) => {
    try {
      console.log('=== UPDATE INVESTMENT API ===');
      console.log('API Endpoint:', `/investments/${id}`);
      console.log('Request Payload:', payload);

      const response = await apiService.put(`/investments/${id}`, payload);
      
      console.log('=== INVESTMENT UPDATE API RESPONSE ===');
      console.log('Response Status:', response.status);
      console.log('Response Data:', response.data);
      
      return response.data;
    } catch (error: any) {
      console.error('=== INVESTMENT UPDATE API ERROR ===');
      console.error('Error Type:', error.name);
      console.error('Error Message:', error.message);
      console.error('Error Response:', error.response?.data);
      console.error('Error Status:', error.response?.status);
      throw error;
    }
  };

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 800,
        useNativeDriver: true,
      }),
    ]).start();
    
    // Check if this is a retry attempt from multiple sources
    const isRetryFromParams = params.isRetry === 'true';
    const isRetryFromUserDetails = finalUserDetails.isRetryAttempt;
    const isRetryFromSessionData = sessionData?.userDetails?.isRetryAttempt;
    
    if (isRetryFromParams || isRetryFromUserDetails || isRetryFromSessionData) {
      console.log('Retry attempt detected in useEffect');
      console.log('Retry sources:', { 
        fromParams: isRetryFromParams, 
        fromUserDetails: isRetryFromUserDetails, 
        fromSessionData: isRetryFromSessionData 
      });
      setIsRetry(true);
      loadRetryData();
    }
  }, [finalUserDetails.isRetryAttempt, params.isRetry, sessionData]);

  // Add function to load retry data
  const loadRetryData = async () => {
    try {
      const paymentRetryData = getPaymentRetryData();
      if (paymentRetryData) {
        console.log('Loading retry data from global store:', paymentRetryData);
        
        // Update payment details with stored data
        setPaymentDetails({
          amount: paymentRetryData.paymentData.amount,
          goldWeight: Number(paymentRetryData.displayData.goldWeight) || 0,
          schemeName: paymentRetryData.displayData.schemeName || "Gold Savings Scheme",
          installmentNumber: Number(paymentRetryData.displayData.monthsPaid) + 1 || 1,
          totalInstallments: Number(paymentRetryData.displayData.noOfIns) || 11,
          investmentType: "Monthly",
          maturityDate: paymentRetryData.displayData.maturityDate,
          currentGoldPrice: 0,
          paymentFrequency: paramsParse?.paymentFrequency || "Monthly",
        });

        console.log('Payment screen configured for retry with stored data from global store');
        return paymentRetryData;
      }
    } catch (error) {
      console.error('Error loading retry data from global store:', error);
    }
    return null;
  };

  const handlePaymentFailure = async (data: any) => {
    console.log("Payment Failed:", data);
    
    // Check if this is an API error
    if (data?.data?.data?.error) {
      setAlertState({
        visible: true,
        title: "Payment Error",
        message: data.data.data.message || "An error occurred while processing the payment.",
        type: "error",
        txn_id: data?.paymentResponse?.txn_id || "",
        order_id: data?.paymentResponse?.order_id || "",
        amount: data?.paymentResponse?.amount?.toString() || "",
        buttons: [
          {
            text: "OK",
            onPress: () => {
              setAlertState(prev => ({ ...prev, visible: false }));
              router.back();
            }
          }
        ]
      });
      return;
    }

    // Check if payment was actually successful
    const paymentStatus = data?.paymentResponse?.txn_detail?.status;
    if (paymentStatus === "CHARGED") {
      // Clear stored payment data on success from global store
      clearPaymentRetryData();
      clearPaymentSession();
      
      setPaymentSuccessData({
        txn_id: data?.paymentResponse?.txn_id,
        amount: data?.paymentResponse?.amount,
        order_id: data?.paymentResponse?.order_id,
      });
      
      router.push({
        pathname: "/(tabs)/home/payment-success",
        params: {
          amount: data?.paymentResponse?.amount,
          txnId: data?.paymentResponse?.txn_id,
          orderId: data?.paymentResponse?.order_id,
          goldWeight: paymentDetails.goldWeight,
          schemeName: paymentDetails.schemeName,
          installmentNumber: paymentDetails.installmentNumber,
          totalInstallments: paymentDetails.totalInstallments,
          schemeId: finalUserDetails.data?.data?.schemeId || finalUserDetails.schemeId,
          chitId: finalUserDetails.data?.data?.chitId || finalUserDetails.chitId
        }
      });
      return;
    }
    
    // Show payment failure in popup
    setAlertState({
      visible: true,
      title: "Payment Failed",
      message: data?.paymentResponse?.payment_gateway_response?.resp_message || 
              data?.message || 
              "Your payment has failed. Please try again.",
      type: "error",
      txn_id: data?.paymentResponse?.txn_id || "",
      order_id: data?.paymentResponse?.order_id || "",
      amount: data?.paymentResponse?.amount?.toString() || "",
      buttons: [
        {
          text: "OK",
          onPress: () => {
            setAlertState(prev => ({ ...prev, visible: false }));
            router.back();
          }
        }
      ]
    });
    
    // The payment retry data should already be stored in global store
    console.log('Payment failed, retry data should be available in global store');
  };

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient
        colors={[theme.colors.primary, '#8B0000']}
        style={styles.gradientBackground}
      >
        <View style={styles.header}>
          <TouchableOpacity 
            onPress={() => router.back()} 
            style={styles.backButton}
          >
            <Ionicons name="arrow-back" size={24} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Payment Overview</Text>
        </View>

        {/* Show loading screen while session data is being loaded */}
        {sessionDataLoading && Object.keys(finalUserDetails).length === 0 ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#fff" />
            <Text style={styles.loadingText}>Loading payment details...</Text>
          </View>
        ) : (
          <Animated.ScrollView 
            style={styles.content}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={[
              styles.scrollContent,
              {
                opacity: fadeAnim,
                transform: [{ translateY: slideAnim }]
              }
            ]}
          >
            <View style={styles.amountCard}>
              <BlurView intensity={30} style={styles.amountCardBlur}>
                <View style={styles.amountHeader}>
                  <Text style={styles.amountLabel}>Total Amount</Text>
                  <View style={styles.amountDecoration} />
                </View>
                <Text style={styles.amountValue}>₹{amount}</Text>
                <View style={styles.goldWeightContainer}>
                  <Ionicons name="cube-outline" size={16} color={theme.colors.primary} />
                  <Text style={styles.goldWeightText}>
                    {paymentDetails.goldWeight.toFixed(3)} grams
                  </Text>
                  <Text style={styles.goldPriceText}>
                    @ ₹{paymentDetails.currentGoldPrice}/gram
                  </Text>
                </View>
              </BlurView>
            </View>

            <View style={styles.schemeInfoCard}>
              <View style={styles.schemeHeader}>
                <View style={styles.schemeIconContainer}>
                  <Ionicons name="gift-outline" size={24} color={theme.colors.primary} />
                </View>
                <Text style={styles.schemeName}>{paymentDetails.schemeName}</Text>
              </View>
              <View style={styles.schemeDetails}>
                <View style={styles.schemeDetailItem}>
                  <Text style={styles.schemeDetailLabel}>Installment</Text>
                  <Text style={styles.schemeDetailValue}>
                    {paymentDetails.installmentNumber} of {paymentDetails.totalInstallments}
                  </Text>
                </View>
                <View style={styles.schemeDetailItem}>
                  <Text style={styles.schemeDetailLabel}>Frequency</Text>
                  <Text style={styles.schemeDetailValue}>{paymentDetails.paymentFrequency}</Text>
                </View>
                {paymentDetails.maturityDate && (
                  <View style={styles.schemeDetailItem}>
                    <Text style={styles.schemeDetailLabel}>Maturity Date</Text>
                    <Text style={styles.schemeDetailValue}>{paymentDetails.maturityDate}</Text>
                  </View>
                )}
              </View>
            </View>

            <View style={styles.userDetailsCard}>
              <View style={styles.userDetailsHeader}>
                <View style={styles.userDetailsIconContainer}>
                  <Ionicons name="person-circle-outline" size={20} color={theme.colors.primary} />
                </View>
                <Text style={styles.userDetailsTitle}>User Details</Text>
              </View>
              
              <View style={styles.userDetailsContent}>
                <View style={styles.userDetailsRow}>
                  <View style={styles.userDetailItem}>
                    <View style={styles.userDetailIconContainer}>
                      <Ionicons name="person-outline" size={16} color="#fff" />
                    </View>
                    <View style={styles.userDetailInfo}>
                      <Text style={styles.userDetailLabel}>Name</Text>
                      <Text style={styles.userDetailValue} numberOfLines={1}>
                        {finalUserDetails.name || "Test User"}
                      </Text>
                    </View>
                  </View>

                  <View style={styles.userDetailItem}>
                    <View style={styles.userDetailIconContainer}>
                      <Ionicons name="call-outline" size={16} color="#fff" />
                    </View>
                    <View style={styles.userDetailInfo}>
                      <Text style={styles.userDetailLabel}>Mobile</Text>
                      <Text style={styles.userDetailValue}>
                        {finalUserDetails.mobile || "9999999999"}
                      </Text>
                    </View>
                  </View>
                </View>

                <View style={styles.userDetailDivider} />

                <View style={styles.userDetailItem}>
                  <View style={styles.userDetailIconContainer}>
                    <Ionicons name="mail-outline" size={16} color="#fff" />
                  </View>
                  <View style={styles.userDetailInfo}>
                    <Text style={styles.userDetailLabel}>Email</Text>
                    <Text style={styles.userDetailValue} numberOfLines={1}>
                      {finalUserDetails.email || "user@example.com"}
                    </Text>
                  </View>
                </View>
              </View>
            </View>

            <View style={styles.payButtonContainer}>
              {isLoading ? (
                <View style={styles.loadingContainer}>
                  <ActivityIndicator size="large" color={theme.colors.primary} />
                  <Text style={styles.loadingText}>Processing Payment...</Text>
                </View>
              ) : (
                <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
                  <TouchableOpacity 
                    style={styles.payButton} 
                    onPress={handlePayPress}
                    activeOpacity={0.7}
                  >
                    <LinearGradient
                      colors={[theme.colors.primary, '#8B0000']}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 0 }}
                      style={styles.payButtonGradient}
                    >
                      <View style={styles.payButtonContent}>
                        <Text style={styles.payButtonText}>Pay Now</Text>
                        <View style={styles.payButtonIconContainer}>
                          <Ionicons name="arrow-forward" size={20} color="#fff" />
                        </View>
                      </View>
                    </LinearGradient>
                  </TouchableOpacity>
                </Animated.View>
              )}
            </View>
          </Animated.ScrollView>
        )}
      </LinearGradient>

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
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  gradientBackground: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    paddingTop: 8,
  },
  backButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#fff",
    marginLeft: 16,
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    padding: 12,
    paddingBottom: Platform.OS === 'ios' ? 110 : 100,
  },
  amountCard: {
    width: '100%',
    height: 130,
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 12,
    ...Platform.select({
      ios: {
        shadowColor: theme.colors.primary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 6,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  amountCardBlur: {
    flex: 1,
    padding: 16,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.95)',
  },
  amountHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  amountLabel: {
    fontSize: 13,
    color: "#666",
    marginBottom: 4,
  },
  amountDecoration: {
    position: 'absolute',
    top: -20,
    right: -20,
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(133,1,17,0.1)',
  },
  amountValue: {
    fontSize: 36,
    fontWeight: "700",
    color: theme.colors.primary,
    marginBottom: 8,
  },
  goldWeightContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(133,1,17,0.1)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  goldWeightText: {
    color: theme.colors.primary,
    fontSize: 13,
    fontWeight: '600',
    marginLeft: 6,
  },
  goldPriceText: {
    color: theme.colors.primary,
    fontSize: 12,
    marginLeft: 8,
    opacity: 0.8,
  },
  schemeInfoCard: {
    width: "100%",
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 6,
      },
      android: {
        elevation: 3,
      },
    }),
  },
  schemeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  schemeIconContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(133,1,17,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  schemeName: {
    fontSize: 16,
    fontWeight: '700',
    color: theme.colors.primary,
  },
  schemeDetails: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  schemeDetailItem: {
    flex: 1,
    minWidth: '45%',
  },
  schemeDetailLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  schemeDetailValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  userDetailsCard: {
    width: "100%",
    backgroundColor: "#fff",
    borderRadius: 16,
    marginBottom: 12,
    overflow: 'hidden',
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 6,
      },
      android: {
        elevation: 3,
      },
    }),
  },
  userDetailsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    backgroundColor: 'rgba(133,1,17,0.05)',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(133,1,17,0.1)',
  },
  userDetailsIconContainer: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(133,1,17,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  userDetailsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.primary,
  },
  userDetailsContent: {
    padding: 12,
  },
  userDetailsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  userDetailItem: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
  },
  userDetailIconContainer: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: theme.colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  userDetailInfo: {
    flex: 1,
  },
  userDetailLabel: {
    fontSize: 11,
    color: '#666',
    marginBottom: 2,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  userDetailValue: {
    fontSize: 13,
    fontWeight: '600',
    color: '#333',
  },
  userDetailDivider: {
    height: 1,
    backgroundColor: 'rgba(0,0,0,0.05)',
    marginVertical: 8,
  },
  payButtonContainer: {
    position: 'absolute',
    bottom: 16,
    left: 16,
    right: 16,
    padding: 16,
    paddingBottom: Platform.OS === 'ios' ? 30 : 16,
    backgroundColor: 'rgba(255,255,255,0.95)',
    borderRadius: 20,
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 6,
      },
      android: {
        elevation: 6,
      },
    }),
  },
  payButton: {
    width: '100%',
    height: 50,
    borderRadius: 25,
    overflow: 'hidden',
    ...Platform.select({
      ios: {
        shadowColor: theme.colors.primary,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 6,
      },
      android: {
        elevation: 6,
      },
    }),
  },
  payButtonGradient: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  payButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  payButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: "#fff",
    marginRight: 8,
  },
  payButtonIconContainer: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: theme.colors.primary,
    fontWeight: '500',
  },
});

export default PaymentProcessScreen;
