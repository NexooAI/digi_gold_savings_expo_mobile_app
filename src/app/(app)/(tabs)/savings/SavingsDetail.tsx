import React, { useEffect, useMemo, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Platform,
  useWindowDimensions,
  StyleSheet,
  ActivityIndicator,
  Modal,
  Alert,
} from "react-native";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";
import AppHeader from "@/app/components/AppHeader";
import { useLocalSearchParams, useNavigation, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { t } from "@/i18n";
import useGlobalStore from "@/store/global.store";
import api from "@/services/api";
import { initiatePayment, initializeSocket } from "@/utils/paymentUtils";
import { moderateScale } from "react-native-size-matters";
import SupportContactCard from "@/app/components/SupportContactCard";
import CustomAlert from "@/app/components/Alert";
import Icon from "react-native-vector-icons/AntDesign";
import { LinearGradient } from "expo-linear-gradient";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Clipboard from "expo-clipboard";
import { Socket } from "socket.io-client";

type Transaction = {
  paymentId: number;
  amountPaid: string;
  paymentDate: string;
  paymentMode: string;
  transactionId: string;
  status: string;
  current_goldrate: string;
  gold_rate: string;
};

type SchemeParams = {
  accNo: any;
  chitId: any;
  accountNo: any;
  schemeName: string;
  totalPaid: string;
  monthsPaid: string;
  emiAmount: string;
  maturityDate: string;
  goldWeight: string;
  accountHolder: string;
  schemeCode: string;
  transactionId: string;
  id: string;
  noOfIns: string;
  paymentFrequency?: string;
};

interface DetailRowProps {
  label: string;
  value: string;
  labelColor?: string;
  valueColor?: string;
  icon?: string;
}

const HEADER_HEIGHT = Platform.OS === "ios" ? 44 : 56;

// Payment data storage keys
const PAYMENT_DATA_KEY = "@payment_data_retry";
const INVESTMENT_DATA_KEY = "@investment_data_retry";
const TRANSACTION_DATA_KEY = "@transaction_data_retry";

// PDF Generation function
const generateInvoicePDF = async (transaction: Transaction) => {
  try {
    // Create invoice content as text
    const invoiceText = `
DIGIGOLD SAVINGS
Transaction Invoice
==================

Amount Paid: ₹${Number(transaction.amountPaid).toLocaleString()}

Transaction Details:
- Transaction ID: ${transaction.transactionId}
- Payment ID: ${transaction.paymentId}
- Date: ${new Date(transaction.paymentDate).toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    })}
- Payment Mode: ${(transaction.paymentMode || "NB").toUpperCase()}
- Status: ${transaction.status}
- Gold Rate: ₹${transaction.gold_rate}/gram

Thank you for your investment with DigiGold Savings
Generated on: ${new Date().toLocaleDateString("en-GB")}
    `;

    // Copy to clipboard
    await Clipboard.setStringAsync(invoiceText);
    Alert.alert(
      "Success",
      "Invoice details copied to clipboard. You can paste and share it anywhere."
    );
  } catch (error) {
    console.error("Error generating invoice:", error);
    Alert.alert("Error", "Failed to generate invoice. Please try again.");
  }
};

const SavingsDetail = () => {
  const router = useRouter();
  const navigation = useNavigation();
  const params = useLocalSearchParams<any>();
  const { language, user } = useGlobalStore();
  const [paymentHistrory, setPaymentHistrory] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [isLoading, setIsLoading] = useState(false);
  const [socket, setSocket] = useState<Socket | null>(null);
  const { height } = useWindowDimensions();
  const { bottom } = useSafeAreaInsets();
  const bottomPadding = height * 0.1 + bottom;
  const [isNavigationReady, setIsNavigationReady] = useState(false);
  const [selectedTransaction, setSelectedTransaction] =
    useState<Transaction | null>(null);
  const [alertVisible, setAlertVisible] = useState(false);
  const [alertMessage, setAlertMessage] = useState("");
  const [alertType, setAlertType] = useState<"success" | "error" | "info">(
    "info"
  );
  const translations = useMemo(
    () => ({
      totalInvested: t("totalInvested"),
      goldAccumulated: t("goldAccumulated"),
      accountHolder: t("accountHolder"),
      schemeCode: t("schemeCode"),
      monthlyEMI: t("monthlyEMI"),
      maturityDate: t("maturityDate"),
      paymentProgress: t("paymentProgress"),
      transactionHistory: t("transactionHistory"),
      noTransactionsFound: t("noTransactionsFound"),
      months: t("months"),
      back: t("back"),
      goldRate: t("goldRate"),
      paymentMethod: t("paymentMethod"),
    }),
    [language]
  );

  // Initialize socket connection
  useEffect(() => {
    const socketInstance = initializeSocket();
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

  // Construct user details in the format expected by payment function
  const parsedUserDetails = useMemo(
    () => ({
      name: params.accountHolder,
      email: user?.email || "",
      mobile: user?.mobile || "",
      data: { data: { userId: user?.id, schemeId: params.schemeCode } },
    }),
    [params, user]
  );

  const PaymentNow = async () => {
    if (!user) {
      setAlertMessage("User not found. Please log in again.");
      setAlertType("error");
      setAlertVisible(true);
      return;
    }

    let payload = {
      userId: user.id,
      investmentId: params.id,
    };

    try {
      let responce = await api.post("investments/check-payment", payload);
      if (responce?.data?.success === false) {
        setAlertMessage(responce?.data.message || "Something went wrong");
        setAlertType("error");
        setAlertVisible(true);
        return;
      }

      // Store comprehensive payment data for retry functionality using global store
      const paymentRetryData = {
        // Payment payload data
        paymentData: {
          amount: Number(params.emiAmount),
          userId: user.id || "",
          investmentId: params.id,
          schemeId: params.schemeCode,
          chitId: params.chitId,
          userEmail: user.email || "",
          userMobile: user.mobile?.toString() || "",
          userName: params.accountHolder,
        },

        // Investment payload data
        investmentData: {
          userId: user.id || "",
          schemeId: params.schemeCode,
          chitId: params.chitId,
          accountName: params.accountHolder,
          accountNo: params.accNo,
          paymentAmount: Number(params.emiAmount),
          investmentId: params.id,
        },

        // Transaction payload data
        transactionData: {
          userId: user.id || "",
          investmentId: params.id,
          schemeId: params.schemeCode,
          chitId: params.chitId,
          accountNumber: params.accNo,
          amount: Number(params.emiAmount),
        },

        // UI/Display data
        displayData: {
          schemeName: params.schemeName,
          accountHolder: params.accountHolder,
          accNo: params.accNo,
          totalPaid: params.totalPaid,
          monthsPaid: params.monthsPaid,
          noOfIns: params.noOfIns,
          goldWeight: params.goldWeight,
          maturityDate: params.maturityDate,
          paymentFrequency: params.paymentFrequency || "Monthly",
        },

        // Timestamp for retry reference
        timestamp: new Date().toISOString(),
        source: "savings_detail",
      };

      // Store payment retry data in global store
      const { storePaymentRetryData, storePaymentSession } =
        useGlobalStore.getState();
      storePaymentRetryData(paymentRetryData);

      // Store current payment session data
      const currentPaymentSession = {
        amount: Number(params.emiAmount),
        userDetails: {
          accountname: params.accountHolder,
          accNo: params.accNo,
          name: params.accountHolder,
          mobile: user.mobile?.toString() || "",
          email: user.email || "",
          userId: user.id || "",
          investmentId: params.id,
          chitId: params.chitId,
          schemeId: params.schemeCode,
          paymentFrequency: params.paymentFrequency || "Monthly",
          // Additional context
          isRetryAttempt: false,
          originalPaymentTimestamp: paymentRetryData.timestamp,
          source: "savings_detail",
        },
        timestamp: new Date().toISOString(),
      };

      storePaymentSession(currentPaymentSession);

      //console.log("Payment data stored successfully in global store");

      // Navigate to payment screen with minimal parameters
      router.push({
        pathname: "/(tabs)/home/paymentNewOverView",
        params: {
          amount: params.emiAmount,
          sessionId: Date.now().toString(),
          paymentFrequency: params.paymentFrequency || "Monthly",
        },
      });
    } catch (error) {
      console.error("Error in PaymentNow:", error);
      setAlertMessage("An error occurred. Please try again.");
      setAlertType("error");
      setAlertVisible(true);
    }
  };

  useEffect(() => {
    const fetchTransactions = async () => {
      try {
        const response = await api.get(`investments/${params.id}`);
        if (response.data.data.paymentHistory) {
          setPaymentHistrory(response.data.data.paymentHistory);
        }
      } catch (error) {
        console.error("Error fetching transactions:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchTransactions();
  }, [params.id]);

  const DetailRow: React.FC<DetailRowProps> = ({
    label,
    value,
    labelColor = "#595959",
    valueColor = "#262626",
    icon,
  }) => (
    <View
      style={{ flexDirection: "row", alignItems: "center", paddingVertical: 4 }}
    >
      {icon && (
        <Icon
          name={icon}
          size={16}
          color="#bfbfbf"
          style={{ marginRight: 8 }}
        />
      )}
      <Text style={{ flex: 1, color: labelColor, fontSize: 14 }}>{label}</Text>
      <Text style={{ color: valueColor, fontSize: 14, fontWeight: "500" }}>
        {value}
      </Text>
    </View>
  );

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#f3f4f6" }}>
      {/* Fixed Header */}
      <View style={{ backgroundColor: "white", height: HEADER_HEIGHT }}>
        <AppHeader showBackButton={true} backRoute="index" />
      </View>

      <ScrollView
        contentContainerStyle={{
          padding: 16,
          paddingTop: 24,
          paddingBottom: bottomPadding,
        }}
        style={{ flex: 1 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Summary Card */}
        <LinearGradient
          colors={["#850111", "#5a000b", "#2e0406"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.summaryCard}
        >
          <View style={styles.summaryHeader}>
            <View style={styles.schemeInfo}>
              <View style={styles.schemeIconContainer}>
                <Ionicons name="diamond-outline" size={20} color="#fff" />
              </View>
              <View style={styles.schemeTextContainer}>
                <Text style={styles.schemeName}>{params.schemeName}</Text>
                <View style={styles.schemeDetails}>
                  <Text style={styles.schemeCode}>{params.schemeCode}</Text>
                  <View style={styles.statusBadge}>
                    <View style={styles.statusDot} />
                    <Text style={styles.statusText}>Active</Text>
                  </View>
                </View>
              </View>
            </View>
          </View>

          <View style={styles.summaryStats}>
            <View style={styles.statItem}>
              <View style={styles.statIconContainer}>
                <Ionicons name="wallet-outline" size={18} color="#fff" />
              </View>
              <View style={styles.statInfo}>
                <Text style={styles.statLabel}>
                  {translations.totalInvested}
                </Text>
                <Text style={styles.statValue}>
                  ₹{Number(params.totalPaid).toLocaleString()}
                </Text>
              </View>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <View style={styles.statIconContainer}>
                <Ionicons name="diamond-outline" size={18} color="#fff" />
              </View>
              <View style={styles.statInfo}>
                <Text style={styles.statLabel}>
                  {translations.goldAccumulated}
                </Text>
                <Text style={styles.statValue}>{params.goldWeight}g</Text>
              </View>
            </View>
          </View>

          <View style={styles.progressSection}>
            <View style={styles.progressHeader}>
              <Text style={styles.progressLabel}>
                {translations.paymentProgress}
              </Text>
              <Text style={styles.progressValue}>
                {params.monthsPaid}/{params.noOfIns} months
              </Text>
            </View>
            <View style={styles.progressBar}>
              <View
                style={[
                  styles.progressFill,
                  {
                    width: `${
                      (Number(params.monthsPaid) / Number(params.noOfIns)) * 100
                    }%`,
                  },
                ]}
              />
            </View>
          </View>
        </LinearGradient>

        {/* Details Section */}
        <View style={[styles.detailsCard, { backgroundColor: "#FFF8DC" }]}>
          <Text style={styles.sectionTitle}>Account Details</Text>
          <View style={styles.detailsGrid}>
            <View style={styles.detailItem}>
              <Ionicons name="person-outline" size={20} color="#8B4513" />
              <Text style={styles.detailLabel}>
                {translations.accountHolder}
              </Text>
              <Text style={styles.detailValue}>{params.accountHolder}</Text>
            </View>
            <View style={styles.detailItem}>
              <Ionicons name="calendar-outline" size={20} color="#8B4513" />
              <Text style={styles.detailLabel}>{translations.monthlyEMI}</Text>
              <Text style={styles.detailValue}>
                ₹{Number(params.emiAmount).toLocaleString()}
              </Text>
            </View>
            <View style={styles.detailItem}>
              <Ionicons name="time-outline" size={20} color="#8B4513" />
              <Text style={styles.detailLabel}>
                {translations.maturityDate}
              </Text>
              <Text style={styles.detailValue}>{params.maturityDate}</Text>
            </View>
          </View>
        </View>

        {/* Transactions Section */}
        <View style={[styles.transactionsCard, { backgroundColor: "#FFF8DC" }]}>
          <View style={styles.transactionsHeader}>
            <Text style={styles.sectionTitle}>
              {translations.transactionHistory}
            </Text>
            <TouchableOpacity style={styles.filterButton}>
              <Ionicons name="filter" size={20} color="#8B4513" />
            </TouchableOpacity>
          </View>

          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#7b0006" />
            </View>
          ) : paymentHistrory.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Ionicons name="receipt-outline" size={48} color="#8B4513" />
              <Text style={styles.emptyText}>
                {translations.noTransactionsFound}
              </Text>
            </View>
          ) : (
            <View style={styles.transactionsList}>
              {paymentHistrory.map((transaction, index) => (
                <View
                  key={transaction.paymentId?.toString() || index.toString()}
                >
                  <TouchableOpacity
                    style={styles.transactionItem}
                    onPress={() => setSelectedTransaction(transaction)}
                  >
                    <View style={styles.transactionIcon}>
                      <Ionicons
                        name="checkmark-circle"
                        size={24}
                        color="#00cc44"
                      />
                    </View>
                    <View style={styles.transactionInfo}>
                      <Text style={styles.transactionDate}>
                        {new Date(transaction.paymentDate).toLocaleDateString(
                          "en-GB",
                          {
                            day: "2-digit",
                            month: "short",
                            year: "numeric",
                          }
                        )}
                      </Text>
                      <Text style={styles.transactionId}>
                        {transaction.transactionId}
                      </Text>
                    </View>
                    <Text style={styles.transactionAmount}>
                      ₹{Number(transaction.amountPaid).toLocaleString()}
                    </Text>
                  </TouchableOpacity>

                  {/* Transaction Actions */}
                  <View style={styles.transactionActions}>
                    <TouchableOpacity
                      style={styles.actionButton}
                      onPress={() => {
                        setSelectedTransaction(transaction);
                      }}
                    >
                      <Ionicons name="eye-outline" size={20} color="#8B4513" />
                      <Text style={styles.actionText}>View Invoice</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={styles.actionButton}
                      onPress={() => generateInvoicePDF(transaction)}
                    >
                      <Ionicons
                        name="download-outline"
                        size={20}
                        color="#8B4513"
                      />
                      <Text style={styles.actionText}>Download</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ))}
            </View>
          )}
        </View>

        {/* Pay Now Button */}
        <TouchableOpacity
          style={styles.payButton}
          onPress={PaymentNow}
          disabled={isLoading}
        >
          <LinearGradient
            colors={["#850111", "#B8860B", "#DAA520"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.payButtonGradient}
          >
            {isLoading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <>
                <Text style={styles.payButtonText}>Pay Now</Text>
                <Ionicons name="arrow-forward" size={24} color="#fff" />
              </>
            )}
          </LinearGradient>
        </TouchableOpacity>

        <CustomAlert
          visible={alertVisible}
          message={alertMessage}
          type={alertType}
          onClose={() => setAlertVisible(false)}
        />
      </ScrollView>

      {/* Transaction Details Modal */}
      <Modal
        visible={!!selectedTransaction}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setSelectedTransaction(null)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <LinearGradient
              colors={["#850111", "#B8860B", "#DAA520"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.modalHeader}
            >
              <View style={styles.modalHeaderContent}>
                <View style={styles.modalTitleContainer}>
                  <Ionicons name="receipt" size={24} color="#fff" />
                  <Text style={styles.modalTitle}>Transaction Details</Text>
                </View>
                <TouchableOpacity
                  style={styles.closeButton}
                  onPress={() => setSelectedTransaction(null)}
                >
                  <Ionicons name="close" size={24} color="#fff" />
                </TouchableOpacity>
              </View>
            </LinearGradient>

            <View style={styles.modalBody}>
              <View style={styles.transactionStatus}>
                <View style={styles.statusIconContainer}>
                  <Ionicons name="checkmark-circle" size={32} color="#00cc44" />
                </View>
                <Text style={styles.modalStatusText}>Payment Successful</Text>
              </View>

              <View style={styles.amountContainer}>
                <Text style={styles.amountLabel}>Amount Paid</Text>
                <Text style={styles.amountValue}>
                  ₹
                  {selectedTransaction &&
                    Number(selectedTransaction.amountPaid).toLocaleString()}
                </Text>
              </View>

              <View style={styles.detailsContainer}>
                <View style={styles.detailCard}>
                  <View style={styles.detailRow}>
                    <View style={styles.detailIconContainer}>
                      <Ionicons
                        name="calendar-outline"
                        size={20}
                        color="#850111"
                      />
                    </View>
                    <View style={styles.detailInfo}>
                      <Text style={styles.modalDetailLabel}>Date</Text>
                      <Text style={styles.modalDetailValue}>
                        {selectedTransaction &&
                          new Date(
                            selectedTransaction.paymentDate
                          ).toLocaleDateString("en-GB", {
                            day: "2-digit",
                            month: "short",
                            year: "numeric",
                          })}
                      </Text>
                    </View>
                  </View>

                  <View style={styles.detailRow}>
                    <View style={styles.detailIconContainer}>
                      <Ionicons name="card-outline" size={20} color="#850111" />
                    </View>
                    <View style={styles.detailInfo}>
                      <Text style={styles.modalDetailLabel}>
                        Transaction ID
                      </Text>
                      <Text style={styles.modalDetailValue}>
                        {selectedTransaction?.transactionId}
                      </Text>
                    </View>
                  </View>

                  <View style={styles.detailRow}>
                    <View style={styles.detailIconContainer}>
                      <Ionicons
                        name="wallet-outline"
                        size={20}
                        color="#850111"
                      />
                    </View>
                    <View style={styles.detailInfo}>
                      <Text style={styles.modalDetailLabel}>Payment Mode</Text>
                      <Text style={styles.modalDetailValue}>
                        {(
                          selectedTransaction?.paymentMode || "NB"
                        ).toUpperCase()}
                      </Text>
                    </View>
                  </View>
                </View>
              </View>
            </View>

            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={styles.downloadButton}
                onPress={() =>
                  selectedTransaction && generateInvoicePDF(selectedTransaction)
                }
              >
                <Ionicons name="download-outline" size={20} color="#fff" />
                <Text style={styles.downloadButtonText}>Copy Invoice</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  payButton: {
    marginBottom: 20,
    borderRadius: 16,
    overflow: "hidden",
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  payButtonGradient: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: 16,
    gap: 8,
  },
  payButtonText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "700",
  },
  summaryCard: {
    borderRadius: 16,
    padding: 14,
    marginBottom: 14,
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.2,
        shadowRadius: 12,
      },
      android: {
        elevation: 8,
      },
    }),
  },
  summaryHeader: {
    marginBottom: 14,
  },
  schemeInfo: {
    flexDirection: "row",
    alignItems: "center",
  },
  schemeIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.15)",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  schemeTextContainer: {
    flex: 1,
  },
  schemeName: {
    fontSize: 18,
    fontWeight: "700",
    color: "#fff",
    marginBottom: 3,
  },
  schemeDetails: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  schemeCode: {
    fontSize: 12,
    color: "rgba(255,255,255,0.8)",
  },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.15)",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
    gap: 4,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#4caf50",
  },
  statusText: {
    color: "#fff",
    fontSize: 11,
    fontWeight: "600",
  },
  summaryStats: {
    flexDirection: "row",
    backgroundColor: "rgba(255,255,255,0.1)",
    borderRadius: 12,
    padding: 12,
    marginBottom: 14,
  },
  statItem: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
  },
  statIconContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "rgba(255,255,255,0.15)",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 10,
  },
  statInfo: {
    flex: 1,
  },
  statLabel: {
    fontSize: 11,
    color: "rgba(255,255,255,0.8)",
    marginBottom: 3,
  },
  statValue: {
    fontSize: 16,
    fontWeight: "700",
    color: "#fff",
  },
  statDivider: {
    width: 1,
    height: 32,
    backgroundColor: "rgba(255,255,255,0.2)",
    marginHorizontal: 12,
  },
  progressSection: {
    marginTop: 14,
  },
  progressHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 6,
  },
  progressLabel: {
    fontSize: 13,
    fontWeight: "600",
    color: "#fff",
  },
  progressValue: {
    fontSize: 13,
    fontWeight: "700",
    color: "#fff",
  },
  progressBar: {
    height: 8,
    backgroundColor: "rgba(255,255,255,0.2)",
    borderRadius: 4,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    backgroundColor: "#4caf50",
    borderRadius: 4,
  },
  detailsCard: {
    backgroundColor: "#fff",
    borderRadius: 20,
    padding: 20,
    marginBottom: 20,
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
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#2C1810",
    marginBottom: 16,
  },
  detailsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 16,
  },
  detailItem: {
    flex: 1,
    minWidth: "45%",
    backgroundColor: "#F5DEB3",
    padding: 16,
    borderRadius: 12,
  },
  detailLabel: {
    fontSize: 12,
    color: "#8B4513",
    marginTop: 8,
    marginBottom: 4,
  },
  detailValue: {
    fontSize: 16,
    fontWeight: "600",
    color: "#2C1810",
  },
  transactionsCard: {
    backgroundColor: "#fff",
    borderRadius: 20,
    padding: 20,
    marginBottom: 20,
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
  transactionsHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  filterButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: "#F5DEB3",
  },
  transactionsList: {
    gap: 12,
  },
  transactionItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F5DEB3",
    padding: 16,
    borderRadius: 12,
  },
  transactionIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(0,204,68,0.1)",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  transactionInfo: {
    flex: 1,
  },
  transactionDate: {
    fontSize: 14,
    fontWeight: "600",
    color: "#2C1810",
    marginBottom: 4,
  },
  transactionId: {
    fontSize: 12,
    color: "#8B4513",
  },
  transactionAmount: {
    fontSize: 16,
    fontWeight: "700",
    color: "#2C1810",
  },
  loadingContainer: {
    padding: 40,
    alignItems: "center",
  },
  emptyContainer: {
    padding: 40,
    alignItems: "center",
  },
  emptyText: {
    marginTop: 12,
    fontSize: 16,
    color: "#8B4513",
    textAlign: "center",
  },
  transactionActions: {
    flexDirection: "row",
    justifyContent: "flex-end",
    paddingHorizontal: 16,
    paddingBottom: 12,
    gap: 12,
  },
  actionButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F5DEB3",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    gap: 4,
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  actionText: {
    fontSize: 12,
    color: "#8B4513",
    fontWeight: "600",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    width: "90%",
    backgroundColor: "#fff",
    borderRadius: 24,
    overflow: "hidden",
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
      },
      android: {
        elevation: 8,
      },
    }),
  },
  modalHeader: {
    padding: 20,
  },
  modalHeaderContent: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  modalTitleContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#fff",
  },
  closeButton: {
    padding: 4,
    backgroundColor: "rgba(255,255,255,0.2)",
    borderRadius: 12,
  },
  modalBody: {
    padding: 20,
  },
  transactionStatus: {
    alignItems: "center",
    marginBottom: 24,
  },
  statusIconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: "rgba(0,204,68,0.1)",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 12,
  },
  modalStatusText: {
    fontSize: 18,
    fontWeight: "600",
    color: "#00cc44",
  },
  amountContainer: {
    alignItems: "center",
    marginBottom: 24,
    padding: 16,
    backgroundColor: "#FFF8DC",
    borderRadius: 16,
  },
  amountLabel: {
    fontSize: 14,
    color: "#8B4513",
    marginBottom: 4,
  },
  amountValue: {
    fontSize: 28,
    fontWeight: "700",
    color: "#850111",
  },
  detailsContainer: {
    marginBottom: 24,
  },
  detailCard: {
    backgroundColor: "#FFF8DC",
    borderRadius: 16,
    padding: 16,
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  detailRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  detailIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#F5DEB3",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  detailInfo: {
    flex: 1,
  },
  modalDetailLabel: {
    fontSize: 12,
    color: "#8B4513",
    marginBottom: 2,
  },
  modalDetailValue: {
    fontSize: 16,
    fontWeight: "600",
    color: "#2C1810",
  },
  modalFooter: {
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: "#f0f0f0",
  },
  downloadButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#850111",
    padding: 16,
    borderRadius: 12,
    gap: 8,
  },
  downloadButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
});

export default SavingsDetail;
