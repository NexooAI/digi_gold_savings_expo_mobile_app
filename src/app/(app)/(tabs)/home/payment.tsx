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

const { width } = Dimensions.get("window");

// Add these constants at the top of the file
const PAYMENT_DATA_KEY = '@payment_data';
const PAYMENT_RETRY_KEY = '@payment_retry';

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

  // Add function to store payment data
  const storePaymentData = async (data: any) => {
    try {
      await AsyncStorage.setItem(PAYMENT_DATA_KEY, JSON.stringify(data));
    } catch (error) {
      console.error('Error storing payment data:', error);
    }
  };

  // Add function to clear payment data
  const clearPaymentData = async () => {
    try {
      await AsyncStorage.removeItem(PAYMENT_DATA_KEY);
      await AsyncStorage.removeItem(PAYMENT_RETRY_KEY);
    } catch (error) {
      console.error('Error clearing payment data:', error);
    }
  };

  // Add function to check if this is a retry
  const checkRetryStatus = async () => {
    try {
      const retryData = await AsyncStorage.getItem(PAYMENT_RETRY_KEY);
      if (retryData) {
        setIsRetry(true);
        const paymentData = await AsyncStorage.getItem(PAYMENT_DATA_KEY);
        if (paymentData) {
          const parsedData = JSON.parse(paymentData);
          // Update payment details with stored data
          setPaymentDetails(prev => ({
            ...prev,
            amount: parsedData.amount,
            goldWeight: parsedData.goldWeight,
            schemeName: parsedData.schemeName,
            installmentNumber: parsedData.installmentNumber,
            totalInstallments: parsedData.totalInstallments,
            investmentType: parsedData.investmentType,
            maturityDate: parsedData.maturityDate,
            currentGoldPrice: parsedData.currentGoldPrice,
          }));
        }
      }
    } catch (error) {
      console.error('Error checking retry status:', error);
    }
  };

  // Add useEffect to check retry status on mount
  useEffect(() => {
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
      // Clear stored payment data on success
      await clearPaymentData();
      
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
          schemeId: parsedUserDetails.data?.data?.schemeId || parsedUserDetails.schemeId,
          chitId: parsedUserDetails.data?.data?.chitId || parsedUserDetails.chitId
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
    
    // Store payment data for retry
    await storePaymentData({
      amount: amount,
      goldWeight: paymentDetails.goldWeight,
      schemeName: paymentDetails.schemeName,
      installmentNumber: paymentDetails.installmentNumber,
      totalInstallments: paymentDetails.totalInstallments,
      investmentType: paymentDetails.investmentType,
      maturityDate: paymentDetails.maturityDate,
      currentGoldPrice: paymentDetails.currentGoldPrice,
      userDetails: parsedUserDetails
    });
    
    // Set retry flag
    await AsyncStorage.setItem(PAYMENT_RETRY_KEY, 'true');
    
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

    // Store payment data before initiating
    await storePaymentData({
      amount: amount,
      goldWeight: paymentDetails.goldWeight,
      schemeName: paymentDetails.schemeName,
      installmentNumber: paymentDetails.installmentNumber,
      totalInstallments: paymentDetails.totalInstallments,
      investmentType: paymentDetails.investmentType,
      maturityDate: paymentDetails.maturityDate,
      currentGoldPrice: paymentDetails.currentGoldPrice,
      userDetails: parsedUserDetails
    });

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
      investmentId: parsedUserDetails.data?.data?.id || parsedUserDetails.investmentId,
      schemeId: parsedUserDetails.data?.data?.schemeId || parsedUserDetails.schemeId,
      userEmail: parsedUserDetails.email,
      userMobile: parsedUserDetails.mobile,
      userName: parsedUserDetails.name,
      chitId: parsedUserDetails.data?.data?.chitId || parsedUserDetails.chitId || 1,
    };
    // Convert payload to x-www-form-urlencoded format
    const formBody = new URLSearchParams();
    Object.entries(payload).forEach(([key, value]) => {
      formBody.append(key, value);
    });

    apiService
      .post("/payments/initiate", formBody.toString(), {
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
      })
      .then((response: any) => {
        const paymentUrl = response.data.session.payment_links.web;
        router.push({
          pathname: "/(tabs)/home/PaymentWebView",
          params: { paymentUrl },
        });
      })
      .catch((error: any) => {
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

    const handlePaymentStatusUpdate = async (data: any) => {
      if (processedPaymentRef.current) return;
      processedPaymentRef.current = true;
      console.log("Payment status update received:", data);
      
      try {
        let paymentId = 0;
        
        if (data?.paymentResponse?.txn_detail?.status === "CHARGED") {
          // Payment API call
          const paymentPayload = {
            investmentId: parsedUserDetails.data?.data?.id || parsedUserDetails.investmentId,
            paymentAmount: data?.paymentResponse?.amount,
            userId: parsedUserDetails.data?.data?.userId || parsedUserDetails.userId,
            paymentMethod: data?.paymentResponse?.payment_method_type,
            schemeId: parsedUserDetails.data?.data?.schemeId || parsedUserDetails.schemeId,
            transactionId: data?.paymentResponse?.txn_id,
            orderId: data?.paymentResponse?.order_id,
            isManual: "no",
            utr_reference_number: data?.paymentResponse?.txn_detail?.utr_reference_number,
            chitId: parsedUserDetails.data?.data?.chitId || parsedUserDetails.chitId,
          };
          console.log("paymentPayload", paymentPayload);
          const paymentResult = await postPayment(paymentPayload);
          paymentId = paymentResult?.data?.paymentId || 0;

          // Investment API call
          const investmentPayload = {
            userId: parsedUserDetails.data?.data?.userId || parsedUserDetails.userId,
            schemeId: parsedUserDetails.data?.data?.schemeId || parsedUserDetails.schemeId,
            chitId: parsedUserDetails.data?.data?.chitId || parsedUserDetails.chitId,
            accountName: parsedUserDetails.data?.data?.accountName || parsedUserDetails.name,
            accountNo: parsedUserDetails.data?.data?.accountNo || parsedUserDetails.accNo,
            paymentStatus: "PAID",
            paymentAmount: data?.paymentResponse?.amount,
          };

          await updateInversment(
            parsedUserDetails.data?.data?.id || parsedUserDetails.investmentId,
            investmentPayload
          );

          handlePaymentSuccess(data);
        } else {
          handlePaymentFailure(data);
        }

        // Transaction API call
        const transactionPayload = {
          userId: parsedUserDetails.data?.data?.userId || parsedUserDetails.userId,
          investmentId: parsedUserDetails.data?.data?.id || parsedUserDetails.investmentId,
          schemeId: parsedUserDetails.data?.data?.schemeId || parsedUserDetails.schemeId,
          chitId: parsedUserDetails.data?.data?.chitId || parsedUserDetails.chitId,
          accountNumber: parsedUserDetails.data?.data?.accountNo || parsedUserDetails.accNo,
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
        };

        await postTransaction(transactionPayload);
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
  }, [socket]);

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
  }, []);

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
                      {parsedUserDetails.name || "Test User"}
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
                      {parsedUserDetails.mobile || "9999999999"}
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
                    {parsedUserDetails.email || "user@example.com"}
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
