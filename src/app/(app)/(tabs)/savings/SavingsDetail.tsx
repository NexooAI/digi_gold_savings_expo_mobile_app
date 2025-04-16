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
  ImageBackground,
  Modal,
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
import api from "../../../services/api";
import { initiatePayment, initializeSocket } from "../../../util/paymentUtils";
import { moderateScale } from "react-native-size-matters";
import SupportContactCard from "@/app/components/SupportContactCard";
import CustomAlert from "@/app/components/Alert";

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
};

const DetailRow = ({ label, value }) => (
  <View style={styles.detailRow}>
    <Text style={styles.detailLabel}>{label}:</Text>
    <Text style={styles.detailValue} numberOfLines={2} ellipsizeMode="tail">
      {value}
    </Text>
  </View>
);

const HEADER_HEIGHT = Platform.OS === "ios" ? 44 : 56;

const SavingsDetail = () => {
  const router = useRouter();
  const navigation = useNavigation();
  const params = useLocalSearchParams<any>();
  const { language, user } = useGlobalStore();
  const [paymentHistrory, setPaymentHistrory] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [isLoading, setIsLoading] = useState(false);
  const [socket, setSocket] = useState(null);
  const { height } = useWindowDimensions();
  const { bottom } = useSafeAreaInsets();
  const bottomPadding = height * 0.1 + bottom;
  const [isNavigationReady, setIsNavigationReady] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState(null);
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
      email: user.email || "",
      mobile: user.mobile || "",
      data: { data: { userId: user.id, schemeId: params.schemeCode } },
    }),
    [params, user]
  );
  const PaymentNow = async () => {
    let payload = {
      userId: user.id,
      investmentId: params.id,
    };
    let responce = await api.post("investments/check-payment", payload);
    if (responce?.data?.success === false) {
      // alert(responce?.data?.message);
      setAlertMessage(responce?.data.message || "Something went wrong");
      setAlertType("error");
      setAlertVisible(true);
      setAlertVisible(true);
      <CustomAlert
        visible={alertVisible}
        message="Transaction completed successfully!"
        type="success"
        onClose={() => setAlertVisible(false)}
      />;
    } else {
      // initiatePayment({
      //   navigation: isNavigationReady ? navigation : null,
      //   amount: Number(params.emiAmount),
      //   parsedUserDetails,
      //   socket,
      //   setIsLoading,
      //   userId: user.id,
      // });
      // return;
      router.push({
        pathname: "/(tabs)/home/payment",
        params: {
          amount: params.emiAmount, // Use EMI amount from route params
          userDetails: JSON.stringify({
            accountname: params.accountHolder, // Using accountHolder from params
            accNo: params.accNo,
            name: params.accountHolder,
            mobile: user.mobile,
            email: user.email,
            userId: user.id,
            investmentId: params.id,
            chitId: params.chitId,
            schemeId: params.schemeCode,
            // ...params,
          }),
        },
      });
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

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#f3f4f6" }}>
      {/* Fixed Header */}
      <View style={{ backgroundColor: "white", height: HEADER_HEIGHT }}>
        <AppHeader showBackButton={true} backRoute="index" />
      </View>

      {/* Back Button */}
      {/* <View style={{ marginTop: 16, height: HEADER_HEIGHT }}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={{
            position: "absolute",
            left: 16,
            top: HEADER_HEIGHT / 2 - 12,
            flexDirection: "row",
            alignItems: "center",
            backgroundColor: "white",
            padding: 10,
            borderRadius: 20,
          }}
        >
          <Ionicons name="arrow-back" size={24} color="#7b0006" />
          <Text style={{ marginLeft: 8, color: "#7b0006", fontWeight: "600" }}>
            {translations.back}
          </Text>
        </TouchableOpacity>
      </View> */}

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
        <View style={styles.summaryCard}>
          <View style={styles.summaryRow}>
            <View>
              <Text style={styles.summaryLabel}>
                {translations.totalInvested}
              </Text>
              <Text style={styles.summaryValue}>
                ₹{Number(params.totalPaid).toLocaleString()}
              </Text>
            </View>
            <View style={styles.summaryColumn}>
              <Text style={styles.summaryLabel}>
                {translations.goldAccumulated}
              </Text>
              <Text style={styles.summaryValue}>{params.goldWeight}g</Text>
            </View>
          </View>
          <View style={{ marginTop: 8 }}>
            <DetailRow
              label={translations.accountHolder}
              value={params.accountHolder || "N/A"}
            />
            <DetailRow
              label={translations.schemeCode}
              value={params.schemeCode || "N/A"}
            />
            <DetailRow
              label={translations.monthlyEMI}
              value={`₹${Number(params.emiAmount).toLocaleString()}`}
            />
            <DetailRow
              label={translations.maturityDate}
              value={params.maturityDate}
            />
            <DetailRow
              label={translations.paymentProgress}
              value={`${params.monthsPaid}/${params.noOfIns} ${translations.months}`}
            />
          </View>
        </View>

        {/* Transactions Section */}
        <View style={{ marginBottom: 16, paddingHorizontal: 8 }}>
          <Text
            style={{
              fontSize: 18,
              fontWeight: "bold",
              color: "#7b0006",
              marginBottom: 12,
            }}
          >
            {translations.transactionHistory}
          </Text>
        </View>

        <View style={styles.transactionContainer}>
          {loading ? (
            <View style={{ paddingVertical: 24, alignItems: "center" }}>
              <Text style={{ color: "#555" }}>Loading transactions...</Text>
            </View>
          ) : paymentHistrory.length === 0 ? (
            <View style={{ paddingVertical: 24, alignItems: "center" }}>
              <Ionicons name="receipt-outline" size={40} color="#7b0006" />
              <Text
                style={{ color: "#555", marginTop: 12, textAlign: "center" }}
              >
                {translations.noTransactionsFound}
              </Text>
            </View>
          ) : (
            <>
              {/* Header Card */}
              <View style={[styles.transactionCard, styles.headerCard]}>
                <View style={styles.headerRow}>
                  <Text style={styles.headerText}>Sl No</Text>
                  <Text style={styles.headerText}>Date</Text>
                  <Text style={[styles.headerText, { paddingRight: 32 }]}>
                    Amount
                  </Text>
                </View>
                <View style={{ alignItems: "flex-end" }}>
                  <Text style={styles.headerText}>View</Text>
                </View>
              </View>

              {/* Transaction List */}
              {paymentHistrory.map((transaction, index) => (
                <View
                  key={
                    transaction.paymentId
                      ? transaction.paymentId.toString()
                      : index.toString()
                  }
                  style={[
                    styles.transactionCard,
                    index !== paymentHistrory.length - 1 && {
                      borderBottomWidth: 1,
                      borderBottomColor: "#eee",
                    },
                  ]}
                >
                  <View style={styles.transactionRow}>
                    <Text>{index + 1}</Text>
                    <Text style={styles.dateText}>
                      {new Date(transaction.paymentDate).toLocaleDateString(
                        "en-GB",
                        {
                          day: "2-digit",
                          month: "short",
                          year: "numeric",
                          timeZone: "UTC",
                        }
                      )}
                    </Text>
                    <View style={styles.amountContainer}>
                      <Ionicons
                        name="checkmark-circle"
                        size={24}
                        color="#00cc44"
                      />
                      <Text style={styles.amountText}>
                        ₹{Number(transaction.amountPaid).toLocaleString()}
                      </Text>
                    </View>
                  </View>

                  <View style={styles.viewContainer}>
                    <TouchableOpacity
                      onPress={() => setSelectedTransaction(transaction)}
                      style={styles.viewButton}
                    >
                      <Ionicons name="eye-outline" size={20} color="#7b0006" />
                    </TouchableOpacity>
                    <Modal
                      visible={!!selectedTransaction}
                      transparent={true}
                      animationType="fade"
                      onRequestClose={() => setSelectedTransaction(null)}
                    >
                      <TouchableOpacity
                        style={styles.modalBackdrop}
                        activeOpacity={1}
                        onPress={() => setSelectedTransaction(null)}
                      >
                        <View style={styles.detailsContainer}>
                          <View style={styles.detailsHeader}>
                            <Ionicons name="receipt" size={24} color="#fff" />
                            <Text style={styles.detailsTitle}>
                              Transaction Details
                            </Text>
                          </View>

                          <View style={styles.detailsContent}>
                            <DetailRow
                              label="Payment Date"
                              value={new Date(
                                selectedTransaction?.paymentDate
                              ).toLocaleDateString("en-GB", {
                                day: "2-digit",
                                month: "short",
                                year: "numeric",
                                timeZone: "UTC",
                              })}
                            />

                            <DetailRow
                              label="Amount"
                              value={`₹${Number(
                                selectedTransaction?.amountPaid
                              ).toLocaleString()}`}
                            />

                            <DetailRow
                              label="Transaction ID"
                              value={selectedTransaction?.transactionId}
                            />

                            <DetailRow
                              label="Payment Mode"
                              value={(
                                selectedTransaction?.paymentMode || "NB"
                              ).toUpperCase()}
                            />
                          </View>

                          <TouchableOpacity
                            style={styles.closeButton}
                            onPress={() => setSelectedTransaction(null)}
                          >
                            <Ionicons
                              name="checkmark-circle"
                              size={24}
                              color="#fff"
                            />
                            <Text style={styles.closeButtonText}>
                              Close Details
                            </Text>
                          </TouchableOpacity>
                        </View>
                      </TouchableOpacity>
                    </Modal>
                  </View>
                </View>
              ))}
            </>
          )}
        </View>

        {/* Pay Now Button */}
        <View style={{ height: 60, marginTop: 30 }}>
          {isLoading ? (
            <ActivityIndicator size="large" color="#7b0006" />
          ) : (
            <TouchableOpacity style={styles.payButton} onPress={PaymentNow}>
              <Text style={styles.payButtonText}>Pay Now</Text>
            </TouchableOpacity>
          )}
          <CustomAlert
            visible={alertVisible}
            message={alertMessage}
            type={alertType}
            onClose={() => setAlertVisible(false)}
          />
        </View>
        {/* Support Contact Card */}
        <SupportContactCard />
      </ScrollView>
    </SafeAreaView>
  );
};

const detailRowStyles = StyleSheet.create({
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  label: {
    fontSize: 14,
    color: "#555",
  },
  value: {
    fontSize: 14,
    fontWeight: "600",
    color: "#000",
  },
});

const styles = StyleSheet.create({
  payButton: {
    backgroundColor: "#7b0006",
    padding: 15,
    borderRadius: 10,
    width: "100%",
    alignItems: "center",
  },
  payButtonText: { color: "white", fontSize: 18, fontWeight: "bold" },
  summaryCard: {
    backgroundColor: "#fff",
    borderRadius: 20,
    padding: 16,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  summaryLabel: {
    color: "#7b0006",
    fontSize: 14,
    marginBottom: 4,
  },
  summaryValue: {
    color: "#7b0006",
    fontSize: 22,
    fontWeight: "bold",
  },
  summaryColumn: {
    alignItems: "flex-end",
  },
  transactionContainer: {
    backgroundColor: "white",
    marginHorizontal: 16,
    borderRadius: 20,
    padding: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
    marginBottom: 16,
  },
  transactionCard: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 12,
  },
  headerCard: {
    backgroundColor: "#f5f5f5",
    borderBottomWidth: 0,
    marginBottom: 8,
  },
  headerRow: {
    flex: 1,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  headerText: {
    fontWeight: "700",
    color: "#7b0006",
    fontSize: 14,
  },
  transactionRow: {
    flex: 1,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  amountContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  amountText: {
    fontSize: 16,
    fontWeight: "600",
    marginRight: 8,
  },
  viewContainer: {
    alignItems: "flex-end",
    justifyContent: "center",
  },
  viewButton: {
    padding: 6,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: "#7b0006",
  },
  dateText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#555",
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "center",
    alignItems: "center",
  },
  detailsContainer: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    width: "90%",
  },
  // Keep other styles from previous answer
  detailsHeader: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#7b0006",
    padding: 16,
    borderRadius: 8,
    marginBottom: 16,
  },
  detailsTitle: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "600",
    marginLeft: 12,
  },
  closeButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#00cc44",
    padding: 14,
    borderRadius: 8,
    marginTop: 16,
  },
  closeButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
    marginLeft: 8,
  },
  detailsContent: {
    paddingHorizontal: 8,
  },
  detailRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start", // Changed from 'center'
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  detailLabel: {
    color: "#666",
    fontSize: 14,
    fontWeight: "500",
    width: "35%", // Fixed width for labels
  },
  detailValue: {
    color: "#333",
    fontSize: 14,
    fontWeight: "600",
    width: "65%", // Fixed width for values
    flexWrap: "wrap",
    textAlign: "right",
    flexShrink: 1, // Allows text to shrink and wrap
    paddingLeft: 8,
  },

  // If you want monospace font for transaction IDs
  transactionId: {
    fontFamily: Platform.OS === "ios" ? "Courier New" : "monospace",
    fontSize: 12,
  },
});

export default SavingsDetail;
