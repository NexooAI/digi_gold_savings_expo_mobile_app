import React, { useEffect, useState, useMemo, useCallback } from "react";
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
  BackHandler,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { BlurView } from "expo-blur";
import AsyncStorage from '@react-native-async-storage/async-storage';
import useGlobalStore from "@/store/global.store";
import { theme } from "@/constants/theme";
import CustomAlert from "@/app/components/Alert";
import paymentService from "../../../../services/payment.service";
import { usePaymentSocket } from "../../../../hooks/usePaymentSocket";
import { 
  PaymentDetails, 
  UserDetails, 
  PaymentRetryData,
  PaymentStatusUpdate,
  PaymentInitPayload
} from "./types/payment.types";

const { width } = Dimensions.get("window");

interface PaymentState {
  amount: number;
  goldWeight: number;
  schemeName: string;
  installmentNumber: number;
  totalInstallments: number;
  investmentType: string;
  maturityDate: string;
  currentGoldPrice: number;
  paymentFrequency: string;
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

  const [isProcessing, setIsProcessing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [sessionDataLoading, setSessionDataLoading] = useState(true);
  const [sessionData, setSessionData] = useState<any>(null);
  const [isRetry, setIsRetry] = useState(false);

  const scaleAnim = React.useRef(new Animated.Value(1)).current;
  const fadeAnim = React.useRef(new Animated.Value(0)).current;
  const slideAnim = React.useRef(new Animated.Value(50)).current;

  const { 
    getCurrentPaymentSession, 
    getPaymentRetryData, 
    hasPaymentRetryData,
    clearPaymentRetryData,
    clearPaymentSession,
    storePaymentRetryData
  } = useGlobalStore();

  const parsedUserDetails = useMemo(
    () => {
      try {
        if (userDetails) {
          return JSON.parse(
            Array.isArray(userDetails) ? userDetails[0] : userDetails || "{}"
          );
        }
        return {};
      } catch (error) {
        console.error('Error parsing userDetails:', error);
        return {};
      }
    },
    [userDetails]
  );

  const [paymentDetails, setPaymentDetails] = useState<PaymentState>({
    amount: 0,
    goldWeight: 0,
    schemeName: "",
    installmentNumber: 1,
    totalInstallments: 11,
    investmentType: "Monthly",
    maturityDate: "",
    currentGoldPrice: 0,
    paymentFrequency: "Monthly"
  });

  const finalUserDetails = useMemo<UserDetails>(() => {
    if (Object.keys(parsedUserDetails).length > 0) {
      return {
        ...parsedUserDetails,
        paymentFrequency: parsedUserDetails.paymentFrequency || "Monthly"
      };
    } else if (sessionData?.userDetails) {
      const userDetails = sessionData.userDetails;
      return {
        ...userDetails,
        name: userDetails.name || userDetails.accountname,
        accNo: userDetails.accNo || userDetails.accountNo,
        mobile: userDetails.mobile,
        email: userDetails.email,
        userId: userDetails.userId,
        investmentId: userDetails.investmentId,
        schemeId: userDetails.schemeId,
        chitId: userDetails.chitId,
        paymentFrequency: userDetails.paymentFrequency || "Monthly",
        retryData: userDetails.isRetryAttempt ? userDetails.retryData : undefined
      };
    }
    return { paymentFrequency: "Monthly" };
  }, [parsedUserDetails, sessionData]);

  const handlePaymentSuccess = useCallback((data: PaymentStatusUpdate) => {
    clearPaymentRetryData();
    clearPaymentSession();
    
    setPaymentSuccessData({
      txn_id: data.paymentResponse.txn_id,
      amount: data.paymentResponse.amount,
      order_id: data.paymentResponse.order_id,
    });
    
    router.push({
      pathname: "/(tabs)/home/payment-success",
      params: {
        amount: data.paymentResponse.amount,
        txnId: data.paymentResponse.txn_id,
        orderId: data.paymentResponse.order_id,
        goldWeight: paymentDetails.goldWeight,
        schemeName: paymentDetails.schemeName,
        installmentNumber: paymentDetails.installmentNumber,
        totalInstallments: paymentDetails.totalInstallments,
        schemeId: finalUserDetails.data?.data?.schemeId || finalUserDetails.schemeId,
        chitId: finalUserDetails.data?.data?.chitId || finalUserDetails.chitId
      }
    });
  }, [clearPaymentRetryData, clearPaymentSession, router, paymentDetails, finalUserDetails]);

  const handlePaymentFailure = useCallback((data: PaymentStatusUpdate) => {
    setAlertState({
      visible: true,
      title: "Payment Failed",
      message: data.paymentResponse.payment_gateway_response?.resp_message || 
              "Your payment has failed. Please try again.",
      type: "error",
      txn_id: data.paymentResponse.txn_id || "",
      order_id: data.paymentResponse.order_id || "",
      amount: data.paymentResponse.amount?.toString() || "",
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
  }, [router]);

  const handlePaymentError = useCallback((error: any) => {
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
  }, [router]);

  const { emitPaymentEvent } = usePaymentSocket({
    onPaymentSuccess: handlePaymentSuccess,
    onPaymentFailure: handlePaymentFailure,
    onPaymentError: handlePaymentError
  });

  useEffect(() => {
    const loadSessionData = async () => {
      try {
        setSessionDataLoading(true);
        const isRetryFromParams = params.isRetry === 'true';
        
        const storedSessionData = getCurrentPaymentSession();
        
        if (storedSessionData) {
          setSessionData(storedSessionData);
          if (isRetryFromParams || storedSessionData.userDetails?.isRetryAttempt) {
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

  useEffect(() => {
    const fetchCurrentGoldRate = async () => {
      try {
        const cachedRate = await AsyncStorage.getItem('gold_rate');
        if (cachedRate) {
          const rate = parseFloat(cachedRate);
          setPaymentDetails((prev: PaymentState) => ({
            ...prev,
            currentGoldPrice: rate,
            goldWeight: amount / rate
          }));
          return;
        }

        const response = await paymentService.getLiveRates();
        if (response.data?.data?.gold_rate) {
          const rate = parseFloat(response.data.data.gold_rate);
          setPaymentDetails((prev: PaymentState) => ({
            ...prev,
            currentGoldPrice: rate,
            goldWeight: amount / rate
          }));
          await AsyncStorage.setItem('gold_rate', response.data.data.gold_rate);
        } else {
          const fallbackRate = 7315;
          setPaymentDetails((prev: PaymentState) => ({
            ...prev,
            currentGoldPrice: fallbackRate,
            goldWeight: amount / fallbackRate
          }));
        }
      } catch (error) {
        console.error('Error fetching gold rate:', error);
        const fallbackRate = 7315;
        setPaymentDetails((prev: PaymentState) => ({
          ...prev,
          currentGoldPrice: fallbackRate,
          goldWeight: amount / fallbackRate
        }));
      }
    };

    fetchCurrentGoldRate();
  }, [amount]);

  useEffect(() => {
    if (paymentDetails.currentGoldPrice > 0) {
      const calculatedWeight = amount / paymentDetails.currentGoldPrice;
      setPaymentDetails(prev => ({
        ...prev,
        goldWeight: calculatedWeight
      }));
    }
  }, [amount, paymentDetails.currentGoldPrice]);

  const animateButton = useCallback(() => {
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
  }, [scaleAnim]);

  const handlePayPress = useCallback(async () => {
    animateButton();
    setIsLoading(true);

    try {
      const payload: PaymentInitPayload = {
        userId: finalUserDetails.userId || finalUserDetails.data?.data?.userId || '',
        amount: amount,
        investmentId: finalUserDetails.investmentId || finalUserDetails.data?.data?.id || '',
        schemeId: finalUserDetails.schemeId || finalUserDetails.data?.data?.schemeId || '',
        userEmail: finalUserDetails.email || finalUserDetails.userEmail || '',
        userMobile: finalUserDetails.mobile || finalUserDetails.userMobile || '',
        userName: finalUserDetails.name || finalUserDetails.accountname || '',
        chitId: finalUserDetails.chitId || finalUserDetails.data?.data?.chitId || 1,
      };

      const response = await paymentService.initiatePayment(payload);
      const paymentUrl = response.session.payment_links.web;
      
      router.push({
        pathname: "/(tabs)/home/PaymentWebViewNew",
        params: { paymentUrl },
      });
    } catch (error: any) {
      emitPaymentEvent('payment_initiation_failed', {
        error: error.message,
        isRetryAttempt: isRetry,
      });
      Alert.alert("Payment Error", "Failed to initiate payment. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }, [animateButton, amount, finalUserDetails, isRetry, router, emitPaymentEvent]);

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
    
    const isRetryFromParams = params.isRetry === 'true';
    const isRetryFromUserDetails = finalUserDetails.isRetryAttempt;
    const isRetryFromSessionData = sessionData?.userDetails?.isRetryAttempt;
    
    if (isRetryFromParams || isRetryFromUserDetails || isRetryFromSessionData) {
      setIsRetry(true);
      loadRetryData();
    }
  }, [finalUserDetails.isRetryAttempt, params.isRetry, sessionData]);

  const loadRetryData = useCallback(async () => {
    try {
      const paymentRetryData = getPaymentRetryData();
      if (paymentRetryData) {
        setPaymentDetails((prev: PaymentState) => ({
          ...prev,
          amount: paymentRetryData.paymentData.amount,
          goldWeight: Number(paymentRetryData.displayData.goldWeight) || 0,
          schemeName: paymentRetryData.displayData.schemeName || "Gold Savings Scheme",
          installmentNumber: Number(paymentRetryData.displayData.monthsPaid) + 1 || 1,
          totalInstallments: Number(paymentRetryData.displayData.noOfIns) || 11,
          investmentType: "Monthly",
          maturityDate: paymentRetryData.displayData.maturityDate,
          currentGoldPrice: 0,
          paymentFrequency: "Monthly"
        }));
        return paymentRetryData;
      }
    } catch (error) {
      console.error('Error loading retry data:', error);
    }
    return null;
  }, [getPaymentRetryData]);

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

      {/* Processing Overlay */}
      {isProcessing && (
        <View style={styles.processingOverlay}>
          <ActivityIndicator size="large" color="#fff" />
          <Text style={styles.processingText}>Updating records...</Text>
        </View>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  gradientBackground: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    paddingTop: Platform.OS === 'ios' ? 10 : 20,
    backgroundColor: 'rgba(0,0,0,0.3)',
  },
  backButton: {
    marginRight: 15,
    padding: 5,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  scrollContent: {
    paddingBottom: 30,
  },
  amountCard: {
    borderRadius: 20,
    overflow: 'hidden',
    marginBottom: 20,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  amountCardBlur: {
    padding: 25,
    alignItems: 'center',
  },
  amountHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  amountLabel: {
    fontSize: 18,
    color: '#fff',
    fontWeight: '500',
  },
  amountDecoration: {
    height: 1,
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.3)',
    marginLeft: 10,
  },
  amountValue: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#fff',
    marginVertical: 5,
  },
  goldWeightContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingVertical: 6,
    paddingHorizontal: 15,
    borderRadius: 20,
    marginTop: 10,
  },
  goldWeightText: {
    color: theme.colors.primary,
    fontWeight: '600',
    marginLeft: 5,
    fontSize: 14,
  },
  goldPriceText: {
    color: '#fff',
    fontWeight: '500',
    marginLeft: 5,
    fontSize: 12,
  },
  schemeInfoCard: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 20,
    marginBottom: 20,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  schemeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },
  schemeIconContainer: {
    backgroundColor: 'rgba(139, 0, 0, 0.1)',
    borderRadius: 12,
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  schemeName: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.colors.textPrimary,
    flex: 1,
  },
  schemeDetails: {
    marginTop: 10,
  },
  schemeDetailItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  schemeDetailLabel: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  schemeDetailValue: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.textPrimary,
  },
  userDetailsCard: {
    backgroundColor: '#fff',
    borderRadius: 20,
    overflow: 'hidden',
    marginBottom: 20,
  },
  userDetailsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    backgroundColor: theme.colors.primary,
  },
  userDetailsIconContainer: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 10,
    width: 30,
    height: 30,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  userDetailsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  userDetailsContent: {
    padding: 15,
  },
  userDetailsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 15,
  },
  userDetailItem: {
    flexDirection: 'row',
    flex: 1,
    alignItems: 'center',
    marginRight: 10,
  },
  userDetailIconContainer: {
    backgroundColor: theme.colors.primary,
    borderRadius: 8,
    width: 30,
    height: 30,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  userDetailInfo: {
    flex: 1,
  },
  userDetailLabel: {
    fontSize: 12,
    color: '#888',
    marginBottom: 2,
  },
  userDetailValue: {
    fontSize: 14,
    fontWeight: '500',
    color: theme.colors.textPrimary,
  },
  userDetailDivider: {
    height: 1,
    backgroundColor: '#eee',
    marginVertical: 10,
  },
  payButtonContainer: {
    marginTop: 10,
    marginBottom: 30,
  },
  payButton: {
    borderRadius: 25,
    overflow: 'hidden',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  payButtonGradient: {
    paddingVertical: 16,
    paddingHorizontal: 30,
  },
  payButtonContent: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  payButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
  },
  payButtonIconContainer: {
    marginLeft: 10,
  },
  loadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 30,
  },
  loadingText: {
    marginTop: 15,
    fontSize: 16,
    color: theme.colors.primary,
    textAlign: 'center',
  },
  processingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  processingText: {
    color: '#fff',
    marginTop: 15,
    fontSize: 16,
    fontWeight: '500',
  },
});

export default PaymentProcessScreen;