import React, { useEffect, useState, useMemo, useCallback, useRef } from "react";
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
  StatusBar,
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
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
import { useNavigation } from '@react-navigation/native';

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
  txn_id?: string;
  order_id?: string;
  schemeId?: string;
  chitId?: string;
}

export default function PaymentProcessScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const insets = useSafeAreaInsets();
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

  const navigation = useNavigation();

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      navigation.setOptions({
        tabBarStyle: { display: 'flex' }
      });
    });

    return unsubscribe;
  }, [navigation]);

  const handlePaymentSuccess = useCallback(async () => {
    try {
      setIsLoading(true);
      navigation.setOptions({
        tabBarStyle: { display: 'flex' }
      });
      
      clearPaymentRetryData();
      clearPaymentSession();
      
      router.push({
        pathname: "/(tabs)/home/payment-success",
        params: {
          amount: paymentDetails.amount,
          txnId: paymentDetails.txn_id || '',
          orderId: paymentDetails.order_id || '',
          goldWeight: paymentDetails.goldWeight,
          schemeName: paymentDetails.schemeName,
          schemeId: paymentDetails.schemeId || '',
          chitId: paymentDetails.chitId || '',
          installmentNumber: paymentDetails.installmentNumber,
          totalInstallments: paymentDetails.totalInstallments,
        }
      });
    } catch (error) {
      console.error('Error in payment success:', error);
      setAlertState({
        visible: true,
        title: "Payment Error",
        message: "Failed to process payment success",
        type: "error",
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
    } finally {
      setIsLoading(false);
    }
  }, [clearPaymentRetryData, clearPaymentSession, router, paymentDetails, navigation]);

  const handlePaymentFailure = useCallback(async () => {
    try {
      setIsLoading(true);
      navigation.setOptions({
        tabBarStyle: { display: 'flex' }
      });
      
      setAlertState({
        visible: true,
        title: "Payment Failed",
        message: "Your payment has failed. Please try again.",
        type: "error",
        buttons: [
          {
            text: "Try Again",
            onPress: () => {
              setAlertState(prev => ({ ...prev, visible: false }));
              router.back();
            }
          }
        ]
      });
    } catch (error) {
      console.error('Error in payment failure:', error);
      setAlertState({
        visible: true,
        title: "Payment Error",
        message: "Failed to process payment failure",
        type: "error",
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
    } finally {
      setIsLoading(false);
    }
  }, [router, navigation]);

  const handlePaymentError = useCallback((error: any) => {
    console.error("Error processing payment status update:", error);
    setAlertState({
      visible: true,
      title: "Payment Error",
      message: "An error occurred while processing the transaction.",
      type: "error",
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
    onPaymentError: handlePaymentError,
    parsedUserDetails: finalUserDetails,
    router
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
    try {
      setIsLoading(true);
      navigation.setOptions({
        tabBarStyle: { display: 'none' }
      });

      animateButton();

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
  }, [animateButton, amount, finalUserDetails, isRetry, router, emitPaymentEvent, navigation]);

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

  useEffect(() => {
    return () => {
      navigation.setOptions({
        tabBarStyle: { display: 'flex' }
      });
    };
  }, [navigation]);

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" />
      <LinearGradient
        colors={[theme.colors.primary, '#8B0000']}
        style={styles.gradientBackground}
      >
        {/* Header */}
        <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
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
                transform: [{ translateY: slideAnim }],
                paddingBottom: 140
              }
            ]}
          >
            {/* Amount Card with Modern Design */}
            <View style={styles.amountCard}>
              <LinearGradient
                colors={['#C0C0C0', '#E8E8E8', '#C0C0C0', '#F5F5F5', '#C0C0C0']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.amountCardGradient}
              >
                <View style={styles.amountCardContent}>
                  <View style={styles.cardPattern}>
                    <View style={styles.patternLine} />
                    <View style={styles.patternLine} />
                    <View style={styles.patternLine} />
                    <View style={styles.patternLine} />
                  </View>
                  <View style={styles.amountHeader}>
                    <Text style={styles.amountLabel}>Total Amount</Text>
                    <Text style={styles.amountValue}>₹{amount}</Text>
                  </View>
                  <View style={styles.amountDetails}>
                    <View style={styles.amountDetailRow}>
                      <Text style={styles.amountDetailLabel}>Scheme Amount</Text>
                      <Text style={styles.amountDetailValue}>₹{amount}</Text>
                    </View>
                  </View>
                  <View style={styles.cardShine} />
                </View>
              </LinearGradient>
            </View>

            {/* Scheme Details Card */}
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

            {/* User Details Card */}
            <View style={styles.userDetailsCard}>
              <View style={styles.userDetailsHeader}>
                <View style={styles.userDetailsIconContainer}>
                  <Ionicons name="person-circle-outline" size={20} color={theme.colors.white} />
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
          </Animated.ScrollView>
        )}

        {/* Fixed Pay Button */}
        <View style={styles.payButtonContainer}>
          {isLoading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator color="#fff" size="small" />
              <Text style={styles.processingText}>Processing...</Text>
            </View>
          ) : (
            <TouchableOpacity
              style={styles.payButton}
              onPress={handlePayPress}
              activeOpacity={0.8}
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
          )}
        </View>
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

      {isProcessing && (
        <View style={styles.processingOverlay}>
          <ActivityIndicator size="large" color="#fff" />
          <Text style={styles.processingText}>Updating records...</Text>
        </View>
      )}
    </SafeAreaView>
  );
}

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
    backgroundColor: 'rgba(0,0,0,0.3)',
  },
  backButton: {
    marginRight: 15,
    padding: 5,
  },
  headerTitle: {
    fontSize: 20,
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
    borderRadius: 24,
    marginBottom: 24,
    overflow: 'hidden',
    elevation: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
  },
  amountCardGradient: {
    padding: 2,
  },
  amountCardContent: {
    backgroundColor: '#E8E8E8',
    borderRadius: 22,
    overflow: 'hidden',
    padding: 20,
    position: 'relative',
  },
  cardPattern: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    opacity: 0.1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 10,
  },
  patternLine: {
    width: 1,
    height: '100%',
    backgroundColor: '#2C3E50',
    opacity: 0.2,
    transform: [{ rotate: '45deg' }],
  },
  amountHeader: {
    marginBottom: 16,
    position: 'relative',
    zIndex: 1,
  },
  amountLabel: {
    fontSize: 16,
    color: '#2C3E50',
    marginBottom: 4,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  amountValue: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#2C3E50',
    letterSpacing: 0.5,
  },
  amountDetails: {
    borderTopWidth: 1,
    borderTopColor: 'rgba(44, 62, 80, 0.2)',
    paddingTop: 12,
    position: 'relative',
    zIndex: 1,
  },
  amountDetailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  amountDetailLabel: {
    fontSize: 14,
    color: '#2C3E50',
    fontWeight: '500',
    letterSpacing: 0.3,
  },
  amountDetailValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2C3E50',
    letterSpacing: 0.3,
  },
  cardShine: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: '50%',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    transform: [{ rotate: '-45deg' }],
    opacity: 0.5,
    zIndex: 1,
  },
  schemeInfoCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 24,
    padding: 20,
    marginBottom: 24,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
  },
  schemeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  schemeIconContainer: {
    backgroundColor: 'rgba(139, 0, 0, 0.1)',
    borderRadius: 16,
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  schemeName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000',
    flex: 1,
  },
  schemeDetails: {
    marginTop: 8,
  },
  schemeDetailItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  schemeDetailLabel: {
    fontSize: 14,
    color: '#444',
    fontWeight: '500',
  },
  schemeDetailValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#000',
  },
  userDetailsCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 24,
    overflow: 'hidden',
    marginBottom: 24,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
  },
  userDetailsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: 'rgba(103, 2, 2, 1)',
  },
  userDetailsIconContainer: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 12,
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  userDetailsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  userDetailsContent: {
    padding: 16,
  },
  userDetailsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  userDetailItem: {
    flexDirection: 'row',
    flex: 1,
    alignItems: 'center',
    marginRight: 12,
  },
  userDetailIconContainer: {
    backgroundColor: theme.colors.primary,
    borderRadius: 10,
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  userDetailInfo: {
    flex: 1,
  },
  userDetailLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 2,
  },
  userDetailValue: {
    fontSize: 14,
    fontWeight: '500',
    color: '#000',
  },
  userDetailDivider: {
    height: 1,
    backgroundColor: '#eee',
    marginVertical: 12,
  },
  payButtonContainer: {
    position: 'absolute',
    left: 0,
    right: 0,
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: 'rgba(255,255,255,0.95)',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    bottom: 60,
    height: 120,
  },
  payButton: {
    borderRadius: 24,
    overflow: 'hidden',
    elevation: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  payButtonGradient: {
    paddingVertical: 16,
    paddingHorizontal: 28,
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
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  loadingText: {
    marginTop: 16,
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
    color: theme.colors.primary,
    fontSize: 16,
    fontWeight: '500',
  },
});