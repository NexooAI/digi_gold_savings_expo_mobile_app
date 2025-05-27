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
import apiService from "@/services/api";
import { theme } from "@/constants/theme";
import { Ionicons } from "@expo/vector-icons";
import CustomAlert from "@/app/components/Alert";
import { LinearGradient } from "expo-linear-gradient";
import { BlurView } from "expo-blur";

const { width } = Dimensions.get("window");

interface PaymentData {
  amount: number;
  goldWeight: number;
  schemeName: string;
  installmentNumber: number;
  totalInstallments: number;
  investmentType: string;
  maturityDate?: string;
  currentGoldPrice?: number;
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
  const [socket, setSocket] = useState(null);
  const navigation = useNavigation();
  const [isNavigationReady, setIsNavigationReady] = useState(false);

  // This ref will guard against duplicate processing of the payment event
  const processedPaymentRef = useRef(false);

  const scaleAnim = useRef(new Animated.Value(1)).current;
  const slideAnim = useRef(new Animated.Value(0)).current;

  const [paymentDetails, setPaymentDetails] = useState<PaymentData>({
    amount: amount,
    goldWeight: 0,
    schemeName: paramsParse?.schemeName || "Gold Savings Scheme",
    installmentNumber: paramsParse?.installmentNumber || 1,
    totalInstallments: paramsParse?.totalInstallments || 12,
    investmentType: paramsParse?.investmentType || "Monthly",
    maturityDate: paramsParse?.maturityDate,
    currentGoldPrice: paramsParse?.currentGoldPrice || 0,
  });

  // Calculate gold weight based on amount and current gold price
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

  const handlePaymentSuccess = (data: any) => {
    setPaymentSuccessData({
      txn_id: data?.paymentResponse?.txn_id,
      amount: data?.paymentResponse?.amount,
      order_id: data?.orderId,
    });
    setAlertState({
      visible: true,
      title: "Payment Successful",
      message: data.message || "Your payment was processed successfully",
      type: "success",
      txn_id: data?.paymentResponse?.txn_id || "",
      order_id: data?.orderId || "",
      amount:
        data?.paymentResponse?.amount !== undefined &&
        data?.paymentResponse?.amount !== null
          ? String(data?.paymentResponse?.amount)
          : "",
      buttons: [
        {
          text: "Continue",
          onPress: () => {
            setAlertState((prev) => ({ ...prev, visible: false }));
            setPaymentSuccessData(null);
            router.push("/(tabs)/savings");
          },
        },
      ],
    });
  };

  const handlePaymentFailure = (data) => {
    showPaymentFailureAlert(data);
  };
  const showPaymentFailureAlert = (data) => {
    setAlertState({
      visible: true,
      title: "Payment Failed",
      message:
        data.errorMessage || "Your payment has failed. Please try again.",
      type: "error",
      txn_id: data?.paymentResponse?.txn_id || "",
      order_id: data?.orderId || "",
      amount:
        data?.paymentResponse?.amount !== undefined &&
        data?.paymentResponse?.amount !== null
          ? String(data?.paymentResponse?.amount)
          : "",
      buttons: [
        ...(retryCount > 0
          ? [
              {
                text: `Retry (${retryCount})`,
                onPress: () => {
                  setAlertState((prev) => ({ ...prev, visible: false }));
                  setPaymentSuccessData(null);
                  setRetryCount((prev) => prev - 1);
                  retryPayment(data?.orderId);
                },
              },
            ]
          : []),
        {
          text: "Cancel",
          onPress: () => {
            router.push("/(tabs)/home");
            setAlertState((prev) => ({ ...prev, visible: false }));
            setPaymentSuccessData(null);
          },
        },
      ],
    });
  };

  const retryPayment = (orderId) => {
    // Your retry implementation
    console.log("Retrying payment for order:", orderId);
    processedPaymentRef.current = false;
    paymentInit();
    // Example: router.push(`/payment?orderId=${orderId}`);
  };
  const paymentInit = () => {
    // alert("Payment initiated waiting for payment gateway ");
    if (!isNavigationReady) return;
    processedPaymentRef.current = false;
    setIsLoading(true);

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
      investmentId:
        parsedUserDetails.data?.data?.id || parsedUserDetails.investmentId,
      schemeId:
        parsedUserDetails.data?.data?.schemeId || parsedUserDetails.schemeId,
      userEmail: parsedUserDetails.email,
      userMobile: parsedUserDetails.mobile,
      userName: parsedUserDetails.name,
    };
    // Convert payload to x-www-form-urlencoded format
    const formBody = new URLSearchParams();
    Object.entries(payload).forEach(([key, value]) => {
      formBody.append(key, value);
    });

    apiService
      .post("/initiate", formBody.toString(), {
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
      })
      .then((response) => {
        const paymentUrl = response.data.session.payment_links.web;
        router.push({
          pathname: "/(tabs)/home/PaymentWebView",
          params: { paymentUrl },
        });
      })
      .catch((error) => {
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

    const handlePaymentStatusUpdate = async (data) => {
      // Prevent processing the same event twice.
      if (processedPaymentRef.current) return;
      processedPaymentRef.current = true;
      console.log("Payment status update received:", data);
      const paymentSuccess = data.status === "success";
      let paymentStsId = null;
      try {
        if (paymentSuccess) {
          // Payment API call
          const paymentPayload = {
            investmentId:
              parsedUserDetails.data?.data?.id ||
              parsedUserDetails.investmentId,
            paymentAmount: data?.paymentResponse?.amount,
            userId:
              parsedUserDetails.data?.data?.userId || parsedUserDetails.userId,
            paymentMethod: data?.paymentResponse?.payment_method_type,
            schemeId:
              parsedUserDetails.data?.data?.schemeId ||
              parsedUserDetails.schemeId,
            transactionId: data?.paymentResponse?.txn_id,
            orderId: data?.orderId,
          };
          const paymentResult = await postPayment(paymentPayload);
          paymentStsId = paymentResult?.data?.paymentId || null;
          // Investment API call
          const investmentPayload = {
            userId:
              parsedUserDetails.data?.data?.userId || parsedUserDetails.userId,
            schemeId:
              parsedUserDetails.data?.data?.schemeId ||
              parsedUserDetails.schemeId,
            chitId:
              parsedUserDetails.data?.data?.chitId || parsedUserDetails.chitId,
            accountName:
              parsedUserDetails.data?.data?.accountName ||
              parsedUserDetails.name,
            accountNo:
              parsedUserDetails.data?.data?.accountNo ||
              parsedUserDetails.accNo,
            paymentStatus: "PAID",
            paymentAmount: data?.paymentResponse?.amount,
          };
          const investmentResult = await updateInversment(
            parsedUserDetails.data?.data?.id || parsedUserDetails.investmentId,
            investmentPayload
          );
          handlePaymentSuccess(data);
        } else if (data.status === "failure") {
          handlePaymentFailure(data);
        }

        // Call the Transaction API with paymentId set accordingly (only once)
        const transactionPayload = {
          userId:
            parsedUserDetails.data?.data?.userId || parsedUserDetails.userId,
          investmentId:
            parsedUserDetails.data?.data?.id || parsedUserDetails.investmentId,
          schemeId:
            parsedUserDetails.data?.data?.schemeId ||
            parsedUserDetails.schemeId,
          chitId:
            parsedUserDetails.data?.data?.chitId || parsedUserDetails.chitId,
          accountNumber:
            parsedUserDetails.data?.data?.accountNo || parsedUserDetails.accNo,
          paymentId: paymentStsId ? paymentStsId : 0,
          orderId: data?.orderId,
          amount: data?.paymentResponse?.amount,
          currency: data?.paymentResponse?.currency,
          paymentMethod: data?.paymentResponse?.txn_detail?.txn_flow_type,
          signature: "000",
          paymentStatus:
            data?.paymentResponse?.payment_gateway_response?.resp_code ||
            "Canceled",
          paymentDate: data?.paymentResponse?.date_created,
          status: data?.paymentResponse?.status,
          gatewayTransactionId: data?.paymentResponse?.txn_id,
          gatewayresponse: JSON.stringify(data),
        };

        const transactionResult = await postTransaction(transactionPayload);
      } catch (error) {
        console.error("Error processing payment status update:", error);
        Alert.alert(
          "Error",
          "An error occurred while processing the transaction."
        );
      }
    };

    socket.on("payment_status_update", handlePaymentStatusUpdate);
    return () => {
      socket.off("payment_status_update", handlePaymentStatusUpdate);
    };
  }, [socket]);

  // API call functions
  const postTransaction = async (payload) => {
    try {
      const response = await apiService.post("/transactions", payload);
      return response.data;
    } catch (error) {
      console.error("Error posting transaction:", error);
      throw error;
    }
  };

  const postPayment = async (payload) => {
    try {
      const response = await apiService.post("/payment", payload);
      return response.data;
    } catch (error) {
      console.error("Error posting payment:", error);
      throw error;
    }
  };

  const updateInversment = async (id, payload) => {
    try {
      const response = await apiService.put(`/investments/${id}`, payload);
      return response.data;
    } catch (error) {
      console.error("Error updating investment:", error);
      throw error;
    }
  };
  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient
        colors={[theme.colors.primary, theme.colors.primary + 'CC']}
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

        <View style={styles.content}>
          <View style={styles.amountCard}>
            <BlurView intensity={20} style={styles.amountCardBlur}>
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
                    colors={[theme.colors.primary, '#6a0dad']}
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
    fontSize: 24,
    fontWeight: "700",
    color: "#fff",
    marginLeft: 16,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  amountCard: {
    width: '100%',
    height: 180,
    borderRadius: 24,
    overflow: 'hidden',
    marginBottom: 24,
    ...Platform.select({
      ios: {
        shadowColor: theme.colors.primary,
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.2,
        shadowRadius: 12,
      },
      android: {
        elevation: 8,
      },
    }),
  },
  amountCardBlur: {
    flex: 1,
    padding: 24,
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
    fontSize: 16,
    color: "#666",
    marginBottom: 8,
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
    fontSize: 42,
    fontWeight: "700",
    color: theme.colors.primary,
    marginBottom: 12,
  },
  goldWeightContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(133,1,17,0.1)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  goldWeightText: {
    color: theme.colors.primary,
    fontSize: 15,
    fontWeight: '600',
    marginLeft: 8,
  },
  goldPriceText: {
    color: theme.colors.primary,
    fontSize: 13,
    marginLeft: 12,
    opacity: 0.8,
  },
  schemeInfoCard: {
    width: "100%",
    backgroundColor: "#fff",
    borderRadius: 24,
    padding: 20,
    marginBottom: 24,
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  schemeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  schemeIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(133,1,17,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  schemeName: {
    fontSize: 20,
    fontWeight: '700',
    color: theme.colors.primary,
  },
  schemeDetails: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 20,
  },
  schemeDetailItem: {
    flex: 1,
    minWidth: '45%',
  },
  schemeDetailLabel: {
    fontSize: 13,
    color: '#666',
    marginBottom: 6,
  },
  schemeDetailValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  userDetailsCard: {
    width: "100%",
    backgroundColor: "#fff",
    borderRadius: 24,
    marginBottom: 24,
    overflow: 'hidden',
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  userDetailsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: 'rgba(133,1,17,0.05)',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(133,1,17,0.1)',
  },
  userDetailsIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(133,1,17,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  userDetailsTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.colors.primary,
  },
  userDetailsContent: {
    padding: 16,
  },
  userDetailsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 16,
  },
  userDetailItem: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
  },
  userDetailIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: theme.colors.primary,
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
    marginBottom: 4,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  userDetailValue: {
    fontSize: 15,
    fontWeight: '600',
    color: '#333',
  },
  userDetailDivider: {
    height: 1,
    backgroundColor: 'rgba(0,0,0,0.05)',
    marginVertical: 12,
  },
  payButtonContainer: {
    marginTop: 8,
    marginBottom: 20,
    paddingHorizontal: 4,
  },
  payButton: {
    width: '100%',
    height: 60,
    borderRadius: 30,
    overflow: 'hidden',
    ...Platform.select({
      ios: {
        shadowColor: theme.colors.primary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
      },
      android: {
        elevation: 8,
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
    fontSize: 20,
    fontWeight: '700',
    color: "#fff",
    marginRight: 12,
  },
  payButtonIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
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
