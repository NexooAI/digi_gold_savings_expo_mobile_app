import { useLocalSearchParams } from "expo-router";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Modal,
  Pressable,
  Alert,
  TextInput,
} from "react-native";
import { useEffect, useState, useMemo } from "react";
import { t } from "@/i18n";
import useGlobalStore from "@/store/global.store";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { theme } from "@/constants/theme";
import api from "@/services/api";
import paymentService from "../../../../services/payment.service";
import { PaymentInitPayload } from "@/types/payment.types";

export default function PaymentNewOverView() {
  const params = useLocalSearchParams();
  const router = useRouter();
  const { language ,user } = useGlobalStore();
  const [userDetails, setUserDetails] = useState<any>(null);
  const [isTermsAccepted, setIsTermsAccepted] = useState(false);
  const [showTermsModal, setShowTermsModal] = useState(false);
  const [termsContent, setTermsContent] = useState("test");
  const [currentAmount, setCurrentAmount] = useState(Number(params.amount) || 0);
  const [goldRate, setGoldRate] = useState(0);
  const [weightPerGram, setWeightPerGram] = useState(0);
  const [isEditingAmount, setIsEditingAmount] = useState(false);
  const [amountError, setAmountError] = useState("");
  const isFlexi = params.paymentFrequency?.toString().toLowerCase() === "flexi";
  const MAX_AMOUNT = 100000; // 1 lakh rupees

  // Parse user details only once when component mounts
  useEffect(() => {
    if (params.userDetails && !userDetails) {
      try {
        const details = JSON.parse(params.userDetails as string);
        setUserDetails(details);
      } catch (error) {
        console.error("Error parsing user details:", error);
      }
    }
  }, []); // Empty dependency array to run only once

  // Fetch gold rate
  const fetchGoldRate = async () => {
    try {
      const response = await api.get("/rates/current");
      if (response?.data?.data?.gold_rate) {
        setGoldRate(Number(response?.data?.data?.gold_rate));
        calculateWeightPerGram(currentAmount, response.data.data.gold_rate);
      }
    } catch (error) {
      console.error("Error fetching gold rate:", error);
    }
  };

  // Calculate weight per gram based on amount and gold rate
  const calculateWeightPerGram = (amount: number, rate: number) => {
    if (rate > 0) {
      const weight = amount / rate;
      setWeightPerGram(weight);
    }
  };

  // Handle amount adjustment
  const adjustAmount = (increment: number) => {
    if (!isFlexi) return; // Prevent adjustment if not flexi
    const newAmount = currentAmount + increment;
    if (newAmount >= 0 && newAmount <= MAX_AMOUNT) {
      setCurrentAmount(newAmount);
      calculateWeightPerGram(newAmount, goldRate);
      setAmountError(""); // Clear any previous error
    } else if (newAmount > MAX_AMOUNT) {
      setCurrentAmount(MAX_AMOUNT);
      calculateWeightPerGram(MAX_AMOUNT, goldRate);
      setAmountError("Maximum amount allowed is ₹1,00,000");
    }
  };

  // Handle manual amount editing
  const handleAmountEdit = (text: string) => {
    // Remove any non-numeric characters except decimal point
    const cleanText = text.replace(/[^0-9.]/g, '');
    const amount = parseFloat(cleanText) || 0;
    
    if (amount > MAX_AMOUNT) {
      setCurrentAmount(MAX_AMOUNT);
      calculateWeightPerGram(MAX_AMOUNT, goldRate);
      setAmountError("Maximum amount allowed is ₹1,00,000");
    } else {
      setCurrentAmount(amount);
      calculateWeightPerGram(amount, goldRate);
      setAmountError("");
    }
  };

  // Handle edit mode toggle
  const toggleEditMode = () => {
    setIsEditingAmount(!isEditingAmount);
    setAmountError(""); // Clear error when toggling edit mode
  };

  useEffect(() => {
    fetchGoldRate();
  }, []);

  const fetchTermsAndConditions = async () => {
    const response = await api.get("/policies/type/terms_and_conditions");
    setTermsContent(response.data.data.description);
  };
  useEffect(() => {
    fetchTermsAndConditions();
  }, []);
  // Memoize formatted amount to prevent unnecessary recalculations
  const formattedAmount = useMemo(() => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(currentAmount);
  }, [currentAmount]);

  const formattedWeight = useMemo(() => {
    return weightPerGram.toFixed(3);
  }, [weightPerGram]);

  const handlePayment = async () => {
    if (!userDetails) {
      Alert.alert("Error", "User details not available");
      return;
    }
    
    if (currentAmount > MAX_AMOUNT) {
      Alert.alert("Invalid Amount", "Maximum amount allowed is ₹1,00,000");
      return;
    }
    
    try {
      const payload: PaymentInitPayload | any = {
        userId: userDetails.userId || user?.id,
        // amount: currentAmount,
        amount:1,
        investmentId: userDetails.investmentId,
        schemeId: params?.schemeId,
        userEmail: userDetails?.email || user?.email,
        userMobile: userDetails?.mobile || user?.mobile,
        userName: userDetails?.accountname,
        // chitId: Array.isArray(params.chitId) ? params.chitId[0] : params.chitId,
        // paymentFrequency: params.paymentFrequency,
      };
      console.log("initialpayment ======>", payload);
      const response = await paymentService.initiatePayment(payload);
      if (response?.session.payment_links.web) {
        // Extract order ID from the payment response
        const orderId = response?.session?.order_id;

        router.push({
          pathname: "/(tabs)/home/PaymentWebView",
          params: {
            url: response.session.payment_links.web,
            orderId: orderId, // Add orderId to params
            userDetails: JSON.stringify({
              ...userDetails,
              amount: currentAmount,
              orderId: orderId, // Include orderId in userDetails
              // investmentId: params.investmentId,
              // schemeId: params.schemeId,
              // chitId:  params.chitId,
              userId:userDetails.userId || user?.id,
              paymentFrequency: params.paymentFrequency || "Monthly",
            }),
          },
        });
      } else {
        Alert.alert("Error", "No payment URL received");
      }
    } catch (error) {
      Alert.alert("Error", "Failed to initiate payment");
      console.error(error);
    }
  };

  const TermsAndConditionsModal = () => (
    <Modal
      animationType="slide"
      transparent={true}
      visible={showTermsModal}
      onRequestClose={() => setShowTermsModal(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>{t("termsAndConditions")}</Text>
            <TouchableOpacity
              onPress={() => setShowTermsModal(false)}
              style={styles.closeButton}
            >
              <Ionicons name="close" size={24} color={theme.colors.primary} />
            </TouchableOpacity>
          </View>
          <ScrollView style={styles.modalBody}>
            <Text style={styles.termsText}>
              {/* {t('termsAndConditionsContent')} */}
              {termsContent}
            </Text>
          </ScrollView>
          <View style={styles.modalFooter}>
            <TouchableOpacity
              style={styles.acceptButton}
              onPress={() => {
                setIsTermsAccepted(true);
                setShowTermsModal(false);
              }}
            >
              <Text style={styles.acceptButtonText}>{t("accept")}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backButton}
        >
          <Ionicons
            name="arrow-back"
            size={24}
            color={theme.colors.secondary}
          />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t("paymentOverview")}</Text>
      </View>

      <ScrollView
        style={styles.content}
        contentContainerStyle={[
          styles.contentContainer,
          { paddingBottom: 250 }, // Increase padding to ensure all content is visible above footer
        ]}
        showsVerticalScrollIndicator={true}
      >
        {/* Amount Card */}
        {isFlexi ? (
          <View style={styles.amountCard}>
            <View style={styles.amountHeader}>
              <MaterialCommunityIcons
                name="gold"
                size={24}
                color={theme.colors.secondary}
              />
              <Text style={styles.amountTitle}>{t("totalAmount")}</Text>
              <TouchableOpacity
                style={styles.editButton}
                onPress={toggleEditMode}
              >
                <Ionicons
                  name={isEditingAmount ? "checkmark" : "create"}
                  size={20}
                  color={theme.colors.secondary}
                />
              </TouchableOpacity>
            </View>
            
            <View style={styles.amountAdjustmentContainer}>
              <TouchableOpacity
                style={styles.arrowButton}
                onPress={() => adjustAmount(-1000)}
                disabled={isEditingAmount}
              >
                <Ionicons
                  name="chevron-back"
                  size={24}
                  color={isEditingAmount ? theme.colors.secondary + "40" : theme.colors.secondary}
                />
              </TouchableOpacity>
              
              <View style={styles.amountDisplay}>
                {isEditingAmount ? (
                  <TextInput
                    style={styles.amountInput}
                    value={currentAmount.toString()}
                    onChangeText={handleAmountEdit}
                    keyboardType="numeric"
                    placeholder="Enter amount"
                    placeholderTextColor={theme.colors.secondary + "80"}
                    autoFocus={true}
                  />
                ) : (
                  <Text style={styles.amountValue}>{formattedAmount}</Text>
                )}
                <Text style={styles.weightText}>
                  {formattedWeight} grams (₹{Number(goldRate).toFixed(2)}/gram)
                </Text>
                {amountError ? (
                  <Text style={styles.errorText}>{amountError}</Text>
                ) : null}
              </View>
              
              <TouchableOpacity
                style={styles.arrowButton}
                onPress={() => adjustAmount(1000)}
                disabled={isEditingAmount}
              >
                <Ionicons
                  name="chevron-forward"
                  size={24}
                  color={isEditingAmount ? theme.colors.secondary + "40" : theme.colors.secondary}
                />
              </TouchableOpacity>
            </View>
            
            <View style={styles.quickAdjustButtons}>
              <TouchableOpacity
                style={styles.quickButton}
                onPress={() => adjustAmount(-500)}
                disabled={isEditingAmount}
              >
                <Text style={[styles.quickButtonText, isEditingAmount && styles.disabledText]}>-500</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.quickButton}
                onPress={() => adjustAmount(-100)}
                disabled={isEditingAmount}
              >
                <Text style={[styles.quickButtonText, isEditingAmount && styles.disabledText]}>-100</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.quickButton}
                onPress={() => adjustAmount(100)}
                disabled={isEditingAmount}
              >
                <Text style={[styles.quickButtonText, isEditingAmount && styles.disabledText]}>+100</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.quickButton}
                onPress={() => adjustAmount(500)}
                disabled={isEditingAmount}
              >
                <Text style={[styles.quickButtonText, isEditingAmount && styles.disabledText]}>+500</Text>
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          <View style={styles.amountCard}>
            <View style={styles.amountHeader}>
              <MaterialCommunityIcons
                name="gold"
                size={24}
                color={theme.colors.secondary}
              />
              <Text style={styles.amountTitle}>{t("totalAmount")}</Text>
            </View>
            <View style={styles.amountDisplay}>
              <Text style={styles.amountValue}>{formattedAmount}</Text>
              <Text style={styles.weightText}>
                {formattedWeight} grams (₹{Number(goldRate).toFixed(2)}/gram)
              </Text>
            </View>
          </View>
        )}

        {/* Scheme Details Card */}
        <View style={styles.detailsCard}>
          <View style={styles.cardHeader}>
            <MaterialCommunityIcons
              name="file-document"
              size={24}
              color={theme.colors.primary}
            />
            <Text style={styles.cardTitle}>{t("schemeDetails")}</Text>
          </View>
          <View style={styles.detailsRow}>
            <Text style={styles.detailLabel}>{t("schemeName")}</Text>
            <Text style={styles.detailValue}>{params.schemeName?.toString().toUpperCase()}</Text>
          </View>
          <View style={styles.detailsRow}>
            <Text style={styles.detailLabel}>{t("schemeType")}</Text>
            <Text style={styles.detailValue}>{params.schemeType?.toString().toUpperCase()}</Text>
          </View>
          <View style={styles.detailsRow}>
            <Text style={styles.detailLabel}>{t("paymentFrequency")}</Text>
            <Text style={styles.detailValue}>{params.paymentFrequency?.toString().toUpperCase()}</Text>
          </View>
        </View>

        {/* User Account Details Card */}
        <View style={styles.detailsCard}>
          <View style={styles.cardHeader}>
            <MaterialCommunityIcons
              name="account"
              size={24}
              color={theme.colors.primary}
            />
            <Text style={styles.cardTitle}>{t("accountDetails")}</Text>
          </View>
          <View style={styles.detailsRow}>
            <Text style={styles.detailLabel}>{t("accountName")}</Text>
            <Text style={styles.detailValue}>{userDetails?.accountname || user?.name}</Text>
          </View>
          <View style={styles.detailsRow}>
            <Text style={styles.detailLabel}>{t("mobile")}</Text>
            <Text style={styles.detailValue}>{userDetails?.mobile || user?.mobile}</Text>
          </View>
          <View style={styles.detailsRow}>
            <Text style={styles.detailLabel}>{t("email")}</Text>
            <Text style={styles.detailValue}>{userDetails?.email || user?.email}</Text>
          </View>
        </View>
      </ScrollView>

      {/* Pay Now Button and Terms */}
      <View style={styles.footer}>
        <View style={styles.termsContainer}>
          <TouchableOpacity
            style={styles.checkboxContainer}
            onPress={() => setIsTermsAccepted(!isTermsAccepted)}
          >
            <View
              style={[
                styles.checkbox,
                isTermsAccepted && styles.checkboxChecked,
              ]}
            >
              {isTermsAccepted && (
                <Ionicons
                  name="checkmark"
                  size={16}
                  color={theme.colors.secondary}
                />
              )}
            </View>
            <Text style={styles.termsText}>
              {t("iAccept")}{" "}
              <Text
                style={styles.termsLink}
                onPress={() => setShowTermsModal(true)}
              >
                {t("termsAndConditions")}
              </Text>
            </Text>
          </TouchableOpacity>
        </View>
        <TouchableOpacity
          style={[
            styles.payButton,
            !isTermsAccepted && styles.payButtonDisabled,
          ]}
          onPress={handlePayment}
          disabled={!isTermsAccepted}
        >
          <Text style={styles.payButtonText}>{t("payNow")}</Text>
        </TouchableOpacity>
      </View>

      <TermsAndConditionsModal />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    backgroundColor: theme.colors.primary,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255, 255, 255, 0.1)",
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: theme.colors.secondary,
    marginLeft: 16,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 16,
    gap: 16,
  },
  amountCard: {
    backgroundColor: theme.colors.primary,
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: theme.colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  amountHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  amountTitle: {
    fontSize: 16,
    color: theme.colors.secondary,
    marginLeft: 8,
    fontWeight: "600",
    flex: 1,
  },
  amountAdjustmentContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  arrowButton: {
    padding: 8,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    borderRadius: 8,
  },
  amountDisplay: {
    flex: 1,
    alignItems: "center",
  },
  amountValue: {
    fontSize: 32,
    fontWeight: "bold",
    color: theme.colors.secondary,
    textAlign: "center",
  },
  weightText: {
    fontSize: 14,
    color: theme.colors.secondary,
    marginTop: 4,
    opacity: 0.9,
  },
  quickAdjustButtons: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginTop: 12,
  },
  quickButton: {
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  quickButtonText: {
    fontSize: 12,
    color: theme.colors.secondary,
    fontWeight: "600",
  },
  detailsCard: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 20,
    marginBottom: 0,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
    borderWidth: 1,
    borderColor: "#e5e5e5",
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#e5e5e5",
    paddingBottom: 12,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: theme.colors.primary,
    marginLeft: 8,
  },
  detailsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  detailLabel: {
    fontSize: 14,
    color: "#666",
    fontWeight: "500",
  },
  detailValue: {
    fontSize: 14,
    color: "#333",
    fontWeight: "600",
  },
  footer: {
    position: "absolute",
    bottom: 80, // Lift the footer up to avoid tab bar overlap
    left: 0,
    right: 0,
    padding: 16,
    paddingBottom: 20, // Reduced padding since we moved the footer up
    backgroundColor: "#fff",
    borderTopWidth: 1,
    borderTopColor: "#e5e5e5",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 4,
  },
  termsContainer: {
    marginBottom: 16,
  },
  checkboxContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderWidth: 2,
    borderColor: theme.colors.primary,
    borderRadius: 4,
    marginRight: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  checkboxChecked: {
    backgroundColor: theme.colors.primary,
  },
  termsText: {
    fontSize: 14,
    color: "#666",
    flex: 1,
  },
  termsLink: {
    color: theme.colors.primary,
    textDecorationLine: "underline",
  },
  payButtonDisabled: {
    opacity: 0.6,
  },
  payButton: {
    backgroundColor: theme.colors.primary,
    borderRadius: 8,
    padding: 16,
    alignItems: "center",
  },
  payButtonText: {
    color: theme.colors.secondary,
    fontSize: 16,
    fontWeight: "600",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    backgroundColor: "#fff",
    borderRadius: 16,
    width: "90%",
    maxHeight: "80%",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#e5e5e5",
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: theme.colors.primary,
  },
  closeButton: {
    padding: 4,
  },
  modalBody: {
    padding: 16,
    maxHeight: "70%",
  },
  modalFooter: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: "#e5e5e5",
  },
  acceptButton: {
    backgroundColor: theme.colors.primary,
    borderRadius: 8,
    padding: 12,
    alignItems: "center",
  },
  acceptButtonText: {
    color: theme.colors.secondary,
    fontSize: 16,
    fontWeight: "600",
  },
  editButton: {
    padding: 4,
    marginLeft: 8,
  },
  amountInput: {
    fontSize: 32,
    fontWeight: "bold",
    color: theme.colors.secondary,
    textAlign: "center",
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    minWidth: 200,
  },
  errorText: {
    fontSize: 12,
    color: "#ff4444",
    marginTop: 4,
    textAlign: "center",
    fontWeight: "500",
  },
  disabledText: {
    opacity: 0.4,
  },
});
