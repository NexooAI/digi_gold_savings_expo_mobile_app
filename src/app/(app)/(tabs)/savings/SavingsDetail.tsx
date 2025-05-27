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
import api from "@/services/api";
import { initiatePayment, initializeSocket } from "@/utils/paymentUtils";
import { moderateScale } from "react-native-size-matters";
import SupportContactCard from "@/app/components/SupportContactCard";
import CustomAlert from "@/app/components/Alert";
import Icon from "react-native-vector-icons/AntDesign";
import { LinearGradient } from 'expo-linear-gradient';

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

// const DetailRow = ({ label, value }) => (
//   <View style={styles.detailRow}>
//     <Text style={styles.detailLabel}>{label}:</Text>
//     <Text style={styles.detailValue} numberOfLines={2} ellipsizeMode="tail">
//       {value}
//     </Text>
//   </View>
// );

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
  const DetailRow = ({
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
        <LinearGradient
          colors={['#1a237e', '#283593']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.summaryCard}
        >
          <View style={styles.summaryHeader}>
            <View style={styles.schemeInfo}>
              <View style={styles.schemeIconContainer}>
                <Ionicons name="diamond-outline" size={24} color="#fff" />
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
                <Ionicons name="wallet-outline" size={24} color="#fff" />
              </View>
              <View style={styles.statInfo}>
                <Text style={styles.statLabel}>{translations.totalInvested}</Text>
                <Text style={styles.statValue}>₹{Number(params.totalPaid).toLocaleString()}</Text>
              </View>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <View style={styles.statIconContainer}>
                <Ionicons name="diamond-outline" size={24} color="#fff" />
              </View>
              <View style={styles.statInfo}>
                <Text style={styles.statLabel}>{translations.goldAccumulated}</Text>
                <Text style={styles.statValue}>{params.goldWeight}g</Text>
              </View>
            </View>
          </View>

          <View style={styles.progressSection}>
            <View style={styles.progressHeader}>
              <Text style={styles.progressLabel}>{translations.paymentProgress}</Text>
              <Text style={styles.progressValue}>{params.monthsPaid}/{params.noOfIns} months</Text>
            </View>
            <View style={styles.progressBar}>
              <View 
                style={[
                  styles.progressFill,
                  { width: `${(Number(params.monthsPaid) / Number(params.noOfIns)) * 100}%` }
                ]} 
              />
            </View>
          </View>
        </LinearGradient>

        {/* Details Section */}
        <View style={[styles.detailsCard, { backgroundColor: '#fff5f5' }]}>
          <Text style={styles.sectionTitle}>Account Details</Text>
          <View style={styles.detailsGrid}>
            <View style={styles.detailItem}>
              <Ionicons name="person-outline" size={20} color="#7b0006" />
              <Text style={styles.detailLabel}>{translations.accountHolder}</Text>
              <Text style={styles.detailValue}>{params.accountHolder}</Text>
            </View>
            <View style={styles.detailItem}>
              <Ionicons name="calendar-outline" size={20} color="#7b0006" />
              <Text style={styles.detailLabel}>{translations.monthlyEMI}</Text>
              <Text style={styles.detailValue}>₹{Number(params.emiAmount).toLocaleString()}</Text>
            </View>
            <View style={styles.detailItem}>
              <Ionicons name="time-outline" size={20} color="#7b0006" />
              <Text style={styles.detailLabel}>{translations.maturityDate}</Text>
              <Text style={styles.detailValue}>{params.maturityDate}</Text>
            </View>
          </View>
        </View>

        {/* Transactions Section */}
        <View style={[styles.transactionsCard, { backgroundColor: '#fff5f5' }]}>
          <View style={styles.transactionsHeader}>
            <Text style={styles.sectionTitle}>{translations.transactionHistory}</Text>
            <TouchableOpacity style={styles.filterButton}>
              <Ionicons name="filter" size={20} color="#7b0006" />
            </TouchableOpacity>
          </View>

          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#7b0006" />
            </View>
          ) : paymentHistrory.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Ionicons name="receipt-outline" size={48} color="#7b0006" />
              <Text style={styles.emptyText}>{translations.noTransactionsFound}</Text>
            </View>
          ) : (
            <View style={styles.transactionsList}>
              {paymentHistrory.map((transaction, index) => (
                <View key={transaction.paymentId?.toString() || index.toString()}>
                  <TouchableOpacity
                    style={styles.transactionItem}
                    onPress={() => setSelectedTransaction(transaction)}
                  >
                    <View style={styles.transactionIcon}>
                      <Ionicons name="checkmark-circle" size={24} color="#00cc44" />
                    </View>
                    <View style={styles.transactionInfo}>
                      <Text style={styles.transactionDate}>
                        {new Date(transaction.paymentDate).toLocaleDateString("en-GB", {
                          day: "2-digit",
                          month: "short",
                          year: "numeric",
                        })}
                      </Text>
                      <Text style={styles.transactionId}>{transaction.transactionId}</Text>
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
                      <Ionicons name="eye-outline" size={20} color="#7b0006" />
                      <Text style={styles.actionText}>View Invoice</Text>
                    </TouchableOpacity>
                    
                    <TouchableOpacity 
                      style={styles.actionButton}
                      onPress={() => {
                        // Handle download invoice
                      }}
                    >
                      <Ionicons name="download-outline" size={20} color="#7b0006" />
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
            colors={['#7b0006', '#9b0008']}
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

        {/* Support Contact Card */}
        {/* <SupportContactCard /> */}
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
              colors={['#7b0006', '#9b0008']}
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
                <Text style={styles.statusText}>Payment Successful</Text>
              </View>

              <View style={styles.amountContainer}>
                <Text style={styles.amountLabel}>Amount Paid</Text>
                <Text style={styles.amountValue}>
                  ₹{selectedTransaction && Number(selectedTransaction.amountPaid).toLocaleString()}
                </Text>
              </View>

              <View style={styles.detailsContainer}>
                <View style={styles.detailCard}>
                  <View style={styles.detailRow}>
                    <View style={styles.detailIconContainer}>
                      <Ionicons name="calendar-outline" size={20} color="#7b0006" />
                    </View>
                    <View style={styles.detailInfo}>
                      <Text style={styles.detailLabel}>Date</Text>
                      <Text style={styles.detailValue}>
                        {selectedTransaction && new Date(selectedTransaction.paymentDate).toLocaleDateString("en-GB", {
                          day: "2-digit",
                          month: "short",
                          year: "numeric",
                        })}
                      </Text>
                    </View>
                  </View>

                  <View style={styles.detailRow}>
                    <View style={styles.detailIconContainer}>
                      <Ionicons name="card-outline" size={20} color="#7b0006" />
                    </View>
                    <View style={styles.detailInfo}>
                      <Text style={styles.detailLabel}>Transaction ID</Text>
                      <Text style={styles.detailValue}>{selectedTransaction?.transactionId}</Text>
                    </View>
                  </View>

                  <View style={styles.detailRow}>
                    <View style={styles.detailIconContainer}>
                      <Ionicons name="wallet-outline" size={20} color="#7b0006" />
                    </View>
                    <View style={styles.detailInfo}>
                      <Text style={styles.detailLabel}>Payment Mode</Text>
                      <Text style={styles.detailValue}>
                        {(selectedTransaction?.paymentMode || "NB").toUpperCase()}
                      </Text>
                    </View>
                  </View>
                </View>
              </View>
            </View>

            <View style={styles.modalFooter}>
              <TouchableOpacity 
                style={styles.downloadButton}
                onPress={() => selectedTransaction && generateInvoicePDF(selectedTransaction)}
              >
                <Ionicons name="download-outline" size={20} color="#fff" />
                <Text style={styles.downloadButtonText}>Download Invoice</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
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
    marginBottom: 20,
    borderRadius: 16,
    overflow: 'hidden',
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
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    gap: 8,
  },
  payButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
  },
  summaryCard: {
    borderRadius: 20,
    padding: 20,
    marginBottom: 20,
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
    marginBottom: 20,
  },
  schemeInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  schemeIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255,255,255,0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  schemeTextContainer: {
    flex: 1,
  },
  schemeName: {
    fontSize: 20,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 4,
  },
  schemeDetails: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  schemeCode: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.15)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 6,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#4caf50',
  },
  statusText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  summaryStats: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
  },
  statItem: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  statIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  statInfo: {
    flex: 1,
  },
  statLabel: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.8)',
    marginBottom: 4,
  },
  statValue: {
    fontSize: 18,
    fontWeight: '700',
    color: '#fff',
  },
  statDivider: {
    width: 1,
    height: 40,
    backgroundColor: 'rgba(255,255,255,0.2)',
    marginHorizontal: 16,
  },
  progressSection: {
    marginTop: 20,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  progressLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
  },
  progressValue: {
    fontSize: 14,
    fontWeight: '700',
    color: '#fff',
  },
  progressBar: {
    height: 8,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#4caf50',
    borderRadius: 4,
  },
  detailsCard: {
    backgroundColor: '#fff',
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
    fontWeight: '700',
    color: '#333',
    marginBottom: 16,
  },
  detailsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
  },
  detailItem: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: '#f8f9fa',
    padding: 16,
    borderRadius: 12,
  },
  detailLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 8,
    marginBottom: 4,
  },
  detailValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  transactionsCard: {
    backgroundColor: '#fff',
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  filterButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: '#f8f9fa',
  },
  transactionsList: {
    gap: 12,
  },
  transactionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    padding: 16,
    borderRadius: 12,
  },
  transactionIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0,204,68,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  transactionInfo: {
    flex: 1,
  },
  transactionDate: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  transactionId: {
    fontSize: 12,
    color: '#666',
  },
  transactionAmount: {
    fontSize: 16,
    fontWeight: '700',
    color: '#333',
  },
  loadingContainer: {
    padding: 40,
    alignItems: 'center',
  },
  emptyContainer: {
    padding: 40,
    alignItems: 'center',
  },
  emptyText: {
    marginTop: 12,
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
  transactionActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    paddingHorizontal: 16,
    paddingBottom: 12,
    gap: 12,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
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
    color: '#7b0006',
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: '90%',
    backgroundColor: '#fff',
    borderRadius: 24,
    overflow: 'hidden',
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  modalTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#fff',
  },
  closeButton: {
    padding: 4,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 12,
  },
  modalBody: {
    padding: 20,
  },
  transactionStatus: {
    alignItems: 'center',
    marginBottom: 24,
  },
  statusIconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(0,204,68,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  statusText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#00cc44',
  },
  amountContainer: {
    alignItems: 'center',
    marginBottom: 24,
    padding: 16,
    backgroundColor: '#fff5f5',
    borderRadius: 16,
  },
  amountLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  amountValue: {
    fontSize: 28,
    fontWeight: '700',
    color: '#7b0006',
  },
  detailsContainer: {
    marginBottom: 24,
  },
  detailCard: {
    backgroundColor: '#fff',
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
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  detailIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#fff5f5',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  detailInfo: {
    flex: 1,
  },
  detailLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 2,
  },
  detailValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  modalFooter: {
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  downloadButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#7b0006',
    padding: 16,
    borderRadius: 12,
    gap: 8,
  },
  downloadButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default SavingsDetail;
