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
  const finalUserDetails = useMemo(() => {
    if (Object.keys(parsedUserDetails).length > 0) {
      // Use URL parameters if available
      console.log('Using user details from URL parameters');
      return parsedUserDetails;
    } else if (sessionData?.userDetails) {
      // Use session data as fallback
      console.log('Using user details from session data');
      const userDetails = sessionData.userDetails;
      
      // Ensure all necessary fields are available and properly mapped
      const mappedUserDetails = {
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
      };
      
      // If this is retry data, make sure retryData is accessible
      if (userDetails.isRetryAttempt && userDetails.retryData) {
        console.log('Adding retry data to user details from session');
        mappedUserDetails.retryData = userDetails.retryData;
      }
      
      return mappedUserDetails;
    }
    
    console.log('No user details available from URL or session');
    return {};
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
    schemeName: paramsParse?.schemeName || "Gold Savings Scheme",
    installmentNumber: paramsParse?.installmentNumber || 1,
    totalInstallments: paramsParse?.totalInstallments || 11,
    investmentType: paramsParse?.investmentType || "Monthly",
    maturityDate: paramsParse?.maturityDate,
    currentGoldPrice: 0,
  });

  // Add new state for retry
  const [isRetry, setIsRetry] = useState(false);

  // Check if this is a retry using global store
  const checkRetryStatus = async () => {
    try {
      if (hasPaymentRetryData()) {
        console.log('Retry data found in global store');
        setIsRetry(true);
        const paymentRetryData = getPaymentRetryData();
        if (paymentRetryData) {
          // Update payment details with stored data
          setPaymentDetails(prev => ({
            ...prev,
            amount: paymentRetryData.paymentData.amount,
            goldWeight: Number(paymentRetryData.displayData.goldWeight) || 0,
            schemeName: paymentRetryData.displayData.schemeName,
            installmentNumber: Number(paymentRetryData.displayData.monthsPaid) + 1 || 1,
            totalInstallments: Number(paymentRetryData.displayData.noOfIns) || 11,
            investmentType: "Monthly",
            maturityDate: paymentRetryData.displayData.maturityDate,
            currentGoldPrice: 0,
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

  const handlePaymentSuccess = async (data: any) => {
    console.log("Payment Response:", data);
    
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
      handlePaymentFailure(data);
    }
  };

  const handlePaymentFailure = async (data: any) => {
    console.log("Payment Failed:", data);
    const errorMessage = data?.paymentResponse?.payment_gateway_response?.resp_message || 
                        data?.message || 
                        "Your payment has failed. Please try again.";
    
    // The payment retry data should already be stored in global store from when payment was initiated
    // We don't need to store it again here, just ensure it's available for retry
    console.log('Payment failed, retry data should be available in global store');
    
    router.push({
      pathname: "/(tabs)/home/payment-failure",
      params: {
        amount: data?.paymentResponse?.amount,
        txnId: data?.paymentResponse?.txn_id,
        errorMessage: errorMessage
      }
    });
  };

  const retryPayment = (orderId: any) => {
    // Your retry implementation
    console.log("Retrying payment for order:", orderId);
    processedPaymentRef.current = false;
    paymentInit();
    // Example: router.push(`/payment?orderId=${orderId}`);
  };
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

      console.log('Initial payload (before retry logic):', payloadToUse);

      // Check if this is a retry attempt - look in parsedUserDetails instead of paramsParse
      const isRetryAttempt = finalUserDetails.isRetryAttempt || isRetry;
      
      // If this is a retry attempt, try to load stored data
      if (isRetryAttempt) {
        console.log('Detected retry attempt, loading stored data...');
        
        // First try to use data directly from finalUserDetails (passed from retry or session)
        if (finalUserDetails.userId && finalUserDetails.investmentId && finalUserDetails.schemeId) {
          console.log('Using retry data directly from finalUserDetails');
          payloadToUse = {
            userId: finalUserDetails.userId,
            amount: finalUserDetails.amount || amount,
            investmentId: finalUserDetails.investmentId,
            schemeId: finalUserDetails.schemeId,
            userEmail: finalUserDetails.email,
            userMobile: finalUserDetails.mobile,
            userName: finalUserDetails.name,
            chitId: finalUserDetails.chitId || 1,
          };
          setIsRetry(true);
        } else if (finalUserDetails.retryData?.paymentData) {
          // Try to use retryData stored in finalUserDetails
          console.log('Using retry data from finalUserDetails.retryData');
          const retryData = finalUserDetails.retryData;
          payloadToUse = {
            userId: retryData.paymentData.userId,
            amount: retryData.paymentData.amount,
            investmentId: retryData.paymentData.investmentId,
            schemeId: retryData.paymentData.schemeId,
            userEmail: retryData.paymentData.userEmail,
            userMobile: retryData.paymentData.userMobile,
            userName: retryData.paymentData.userName,
            chitId: retryData.paymentData.chitId,
          };
          
          // Store the complete retry data in finalUserDetails for later use
          finalUserDetails.retryData = retryData;
          setIsRetry(true);
        } else {
          // Try to load complete retry data from global store
          let retryData = getPaymentRetryData();

          // If complete retry data is available, use it
          if (retryData && retryData.paymentData) {
            console.log('Using complete stored payment data for retry from global store');
            payloadToUse = {
              userId: retryData.paymentData.userId,
              amount: retryData.paymentData.amount,
              investmentId: retryData.paymentData.investmentId,
              schemeId: retryData.paymentData.schemeId,
              userEmail: retryData.paymentData.userEmail,
              userMobile: retryData.paymentData.userMobile,
              userName: retryData.paymentData.userName,
              chitId: retryData.paymentData.chitId,
            };
            
            // Store the complete retry data in finalUserDetails for later use
            finalUserDetails.retryData = retryData;
            setIsRetry(true);
          } else {
            // Fallback: try to use stored payloads from finalUserDetails
            console.log('Using fallback retry data from storedPaymentPayload');
            if (finalUserDetails.storedPaymentPayload) {
              payloadToUse = {
                userId: finalUserDetails.storedPaymentPayload.userId,
                amount: finalUserDetails.storedPaymentPayload.amount,
                investmentId: finalUserDetails.storedPaymentPayload.investmentId,
                schemeId: finalUserDetails.storedPaymentPayload.schemeId,
                userEmail: finalUserDetails.storedPaymentPayload.userEmail,
                userMobile: finalUserDetails.storedPaymentPayload.userMobile,
                userName: finalUserDetails.storedPaymentPayload.userName,
                chitId: finalUserDetails.storedPaymentPayload.chitId,
              };
              setIsRetry(true);
            }
          }
        }
        
        console.log('Final retry payload:', payloadToUse);
      }

      // Validate payload before proceeding
      if (!payloadToUse.userId || !payloadToUse.investmentId || !payloadToUse.schemeId) {
        console.error('Critical payment data missing:', payloadToUse);
        console.error('This means retry data was not loaded correctly');
        
        // Try one more time to load from global store
        const emergencyRetryData = getPaymentRetryData();
        if (emergencyRetryData && emergencyRetryData.paymentData) {
          console.log('Emergency retry data load from global store');
          payloadToUse = {
            userId: emergencyRetryData.paymentData.userId,
            amount: emergencyRetryData.paymentData.amount,
            investmentId: emergencyRetryData.paymentData.investmentId,
            schemeId: emergencyRetryData.paymentData.schemeId,
            userEmail: emergencyRetryData.paymentData.userEmail,
            userMobile: emergencyRetryData.paymentData.userMobile,
            userName: emergencyRetryData.paymentData.userName,
            chitId: emergencyRetryData.paymentData.chitId,
          };
          console.log('Emergency retry payload:', payloadToUse);
        }
        
        // Final validation
        if (!payloadToUse.userId || !payloadToUse.investmentId || !payloadToUse.schemeId) {
          Alert.alert("Payment Error", "Some required information is missing. Please try again from the savings screen.");
          router.back();
          return;
        }
      }

      // Store payment data before initiating (for both new and retry attempts) in global store
      const paymentRetryDataToStore = {
        // Payment payload data
        paymentData: {
          amount: payloadToUse.amount,
          userId: payloadToUse.userId,
          investmentId: payloadToUse.investmentId,
          schemeId: payloadToUse.schemeId,
          chitId: payloadToUse.chitId,
          userEmail: payloadToUse.userEmail,
          userMobile: payloadToUse.userMobile,
          userName: payloadToUse.userName,
        },
        
        // Investment payload data
        investmentData: {
          userId: payloadToUse.userId,
          schemeId: payloadToUse.schemeId,
          chitId: payloadToUse.chitId,
          accountName: finalUserDetails.name || finalUserDetails.accountname || payloadToUse.userName,
          accountNo: finalUserDetails.accNo || finalUserDetails.accountNo || sessionData?.userDetails?.accNo || "N/A",
          paymentAmount: payloadToUse.amount,
          investmentId: payloadToUse.investmentId,
        },
        
        // Transaction payload data
        transactionData: {
          userId: payloadToUse.userId,
          investmentId: payloadToUse.investmentId,
          schemeId: payloadToUse.schemeId,
          chitId: payloadToUse.chitId,
          accountNumber: finalUserDetails.accNo || finalUserDetails.accountNo || sessionData?.userDetails?.accNo || "N/A",
          amount: payloadToUse.amount,
        },
        
        // UI/Display data
        displayData: {
          schemeName: paymentDetails.schemeName,
          accountHolder: finalUserDetails.name || finalUserDetails.accountname || payloadToUse.userName,
          accNo: finalUserDetails.accNo || finalUserDetails.accountNo || sessionData?.userDetails?.accNo || "N/A",
          totalPaid: "0", // Will be updated
          monthsPaid: (paymentDetails.installmentNumber - 1).toString(),
          noOfIns: paymentDetails.totalInstallments.toString(),
          goldWeight: paymentDetails.goldWeight.toString(),
          maturityDate: paymentDetails.maturityDate || "",
        },
        
        // Metadata
        timestamp: new Date().toISOString(),
        source: isRetryAttempt ? 'payment_retry' : 'payment_init',
      };

      storePaymentRetryData(paymentRetryDataToStore);
      console.log('Payment retry data stored in global store before initiating payment');

      // Notify server that payment was initiated
      if (socket) {
        socket.emit("payment_initiated", {
          amount: payloadToUse.amount,
          userId: payloadToUse.userId,
          timestamp: new Date().toISOString(),
          isRetryAttempt: isRetryAttempt,
        });
      }

      // Convert payload to x-www-form-urlencoded format
      const formBody = new URLSearchParams();
      Object.entries(payloadToUse).forEach(([key, value]) => {
        formBody.append(key, String(value));
      });

      console.log('=== FINAL PAYMENT PAYLOAD ===');
      console.log('Payment payload being sent:', payloadToUse);

      const response = await apiService.post("/payments/initiate", formBody.toString(), {
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
      });

      const paymentUrl = response.data.session.payment_links.web;
      router.push({
        pathname: "/(tabs)/home/PaymentWebView",
        params: { paymentUrl },
      });
    } catch (error: any) {
      console.error("Payment initiation failed:", error);
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

  // Attach the socket event handler only once
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
        
        // Always record transaction regardless of success/failure
        const transactionPayload = {
          userId: baseUserDetails.data?.data?.userId || baseUserDetails.userId,
          investmentId: baseUserDetails.data?.data?.id || baseUserDetails.investmentId,
          schemeId: baseUserDetails.data?.data?.schemeId || baseUserDetails.schemeId,
          chitId: baseUserDetails.data?.data?.chitId || baseUserDetails.chitId,
          accountNumber: baseUserDetails.data?.data?.accountNo || baseUserDetails.accNo,
          paymentId: paymentId,
          orderId: data?.paymentResponse?.order_id,
          amount: data?.paymentResponse?.amount,
          currency: data?.paymentResponse?.currency,
          paymentMethod: data?.paymentResponse?.txn_detail?.txn_flow_type,
          signature: "000",
          paymentStatus: data?.paymentResponse?.payment_gateway_response?.resp_code || "Canceled",
          paymentDate: data?.paymentResponse?.date_created,
          status: data?.paymentResponse?.status,
          gatewayTransactionId: data?.paymentResponse?.txn_id,
          gatewayresponse: JSON.stringify(data),
          isRetryAttempt: isRetryAttempt,
        };

        await postTransaction(transactionPayload);
        
        if (data?.paymentResponse?.txn_detail?.status === "CHARGED") {
          // Payment API call with stored data if retry
          const paymentPayload = {
            investmentId: baseUserDetails.data?.data?.id || baseUserDetails.investmentId,
            paymentAmount: data?.paymentResponse?.amount,
            userId: baseUserDetails.data?.data?.userId || baseUserDetails.userId,
            paymentMethod: data?.paymentResponse?.payment_method_type,
            schemeId: baseUserDetails.data?.data?.schemeId || baseUserDetails.schemeId,
            transactionId: data?.paymentResponse?.txn_id,
            orderId: data?.paymentResponse?.order_id,
            isManual: "no",
            utr_reference_number: data?.paymentResponse?.txn_detail?.utr_reference_number,
            chitId: baseUserDetails.data?.data?.chitId || baseUserDetails.chitId,
            isRetryAttempt: isRetryAttempt,
          };
          console.log("paymentPayload", paymentPayload);
          const paymentResult = await postPayment(paymentPayload);
          paymentId = paymentResult?.data?.paymentId || 0;

          // Investment API call with stored data if retry
          const investmentPayload = {
            userId: baseUserDetails.data?.data?.userId || baseUserDetails.userId,
            schemeId: baseUserDetails.data?.data?.schemeId || baseUserDetails.schemeId,
            chitId: baseUserDetails.data?.data?.chitId || baseUserDetails.chitId,
            accountName: baseUserDetails.data?.data?.accountName || baseUserDetails.name,
            accountNo: baseUserDetails.data?.data?.accountNo || baseUserDetails.accNo,
            paymentStatus: "PAID",
            paymentAmount: data?.paymentResponse?.amount,
            isRetryAttempt: isRetryAttempt,
          };

          await updateInversment(
            baseUserDetails.data?.data?.id || baseUserDetails.investmentId,
            investmentPayload
          );

          // Clear stored payment data on success from global store
          clearPaymentRetryData();
          clearPaymentSession();
          
          handlePaymentSuccess(data);
        } else {
          // Payment failed - retry data is already in global store, no need to store again
          console.log('Payment failed in handlePaymentStatusUpdate, retry data available in global store');
          
          handlePaymentFailure(data);
        }
        
        console.log('Payment processing completed', {
          isRetry: isRetryAttempt,
          paymentId,
          transactionId: data?.paymentResponse?.txn_id
        });
      } catch (error) {
        console.error("Error processing payment status update:", error);
        handlePaymentFailure({
          message: "An error occurred while processing the transaction.",
          paymentResponse: data?.paymentResponse
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
      const response = await apiService.post("/transactions", payload);
      return response.data;
    } catch (error) {
      console.error("Error posting transaction:", error);
      throw error;
    }
  };

  const postPayment = async (payload: any) => {
    try {
      const response = await apiService.post("/payments", payload);
      return response.data;
    } catch (error) {
      console.error("Error posting payment:", error);
      throw error;
    }
  };

  const updateInversment = async (id: any, payload: any) => {
    try {
      const response = await apiService.put(`/investments/${id}`, payload);
      return response.data;
    } catch (error) {
      console.error("Error updating investment:", error);
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
        });

        console.log('Payment screen configured for retry with stored data from global store');
        return paymentRetryData;
      }
    } catch (error) {
      console.error('Error loading retry data from global store:', error);
    }
    return null;
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
                  <Text style={styles.schemeDetailLabel}>Type</Text>
                  <Text style={styles.schemeDetailValue}>{paymentDetails.investmentType}</Text>
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
