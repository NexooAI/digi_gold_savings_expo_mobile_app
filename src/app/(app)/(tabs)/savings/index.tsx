import React, {
  useMemo,
  useState,
  useCallback,
  useEffect,
  useRef,
} from "react";
import {
  View,
  Text,
  ImageBackground,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Image,
  StyleSheet,
  useWindowDimensions,
  Platform,
  Animated,
} from "react-native";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useFocusEffect } from "@react-navigation/native";
import { LinearGradient } from "expo-linear-gradient"; // For gradient background
import AppHeader from "@/app/components/AppHeader";
import { t } from "@/i18n";
import useGlobalStore from "@/store/global.store";
import api from "@/services/api";
import { moderateScale } from "react-native-size-matters";
import { theme } from "@/constants/theme";

type Transaction = {
  id: string;
  date: string;
  amount: number;
  status: string;
};

type Scheme = {
  chitId: string | number | (string | number)[];
  investmentId: string;
  id: string;
  schemeName: string;
  metalType: string; // "gold" or "silver"
  savingType: string; // "weight" or "amount"
  status?: string; // e.g., "ACTIVE" or "INACTIVE"
  totalPaid: number;
  monthsPaid: number;
  emiAmount: number;
  maturityDate: string; // parsed date string
  goldWeight: number;
  accountHolder: string; // accountName
  accNo: string; // accountNo
  schemeCode: string;
  noOfIns: string;
  transactions: Transaction[];
  joiningDate: string; // parsed date string
  schemesData: any;
  chitData: any;
  paymentFrequency: string; // Add payment frequency
};

interface InvestmentResponse {
  investmentId: string;
  schemeName?: string;
  scheme?: {
    schemeId: string;
    schemeName: string;
    type: string;
    schemeType: string;
  };
  chits?: {
    amount: string;
    noOfInstallments: number;
  };
  status: string;
  total_paid: string;
  lastInstallment: number;
  start_date: string;
  end_date: string;
  totalgoldweight: string;
  accountName: string;
  accountNo: string;
  amount: string;
  paymentFrequency: string;
}

export default function SavingsScreen() {
  const router = useRouter();
  const { language, user } = useGlobalStore();

  useEffect(() => {
    if (!user) {
      router.replace("/(auth)/login");
    }
  }, [user, router]);

  const [savings, setSavings] = useState<Scheme[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedType, setSelectedType] = useState<'Fixed' | 'Flexi'>('Fixed');
  const { bottom } = useSafeAreaInsets();
  const { height } = useWindowDimensions();
  // Increased bottomPadding multiplier from 0.1 to 0.2
  const bottomPadding = height * 0.1 + bottom;
  // Fetch user investment data
  const fetchUserData = useCallback(async () => {
    if (!user) return;

    setLoading(true);
    setError(null);
    try {
      //console.log("=== FETCHING SAVINGS LIST ===");
      const response = await api.get(`investments/user_investments/${user.id}`);
      // Defensive: log and check response structure
      // console.log("Raw API Response:", JSON.stringify(response.data, null, 2));

      // Improved error handling: check for backend error
      if (response?.data?.success === false) {
        const backendMsg = response.data.message || "Failed to fetch savings data.";
        setError(backendMsg);
        setLoading(false);
        return;
      }

      // Accept both 'data' and 'investments' as possible array fields
      let investments: any[] = [];
      if (Array.isArray(response?.data?.data)) {
        investments = response.data.data;
      } else if (Array.isArray(response?.data?.investments)) {
        investments = response.data.investments;
      } else if (response?.data?.data) {
        // Unexpected structure, log for debugging
        console.error("Expected investments to be an array, got:", response.data.data);
        // Show backend error message if available
        const backendMsg = response.data.data && response.data.data.message ? response.data.data.message : null;
        setError(backendMsg || "Unexpected data format received from server. Please try again later.");
        setLoading(false);
        return;
      } else {
        // No data field or data is undefined
        console.error("No investments data found in response:", response.data);
        // Show backend error message if available
        const backendMsg = response.data && response.data.message ? response.data.message : null;
        setError(backendMsg || "No savings data found. Please try again later.");
        setLoading(false);
        return;
      }

      // If investments is empty and success is true, do not set error (show EmptyState)
      if (Array.isArray(investments) && investments.length === 0) {
        setSavings([]);
        setLoading(false);
        return;
      }

      // Validate and transform each investment
      const transformedSavings: Scheme[] = investments
        .filter((item: InvestmentResponse) => {
          // Basic validation
          const isValid =
            item.investmentId && (item.schemeName || item.scheme?.schemeName);
          if (!isValid) {
            console.warn("Invalid investment item:", item);
          }
          return isValid;
        })
        .map((item: InvestmentResponse) => {
          const schemeObj = item.scheme || {
            schemeId: "",
            schemeName: "",
            type: "gold",
            schemeType: "weight", 
          };
          const chit = item.chits || {
            amount: "0",
            noOfInstallments: 0,
          };

          // Log each investment item for debugging
          // console.log("Processing investment item:", {
          //   investmentId: item.investmentId,
          //   schemeName: schemeObj.schemeName || item.schemeName,
          //   emiAmount: chit.amount,
          //   paymentFrequency: item.paymentFrequency,
          //   schemeType: schemeObj.schemeType,
          //   totalPaid: item.total_paid,
          //   monthsPaid: item.lastInstallment,
          //   noOfInstallments: chit.noOfInstallments,
          // });

          // Parse dates with error handling
          const doj = item.start_date
            ? new Date(item.start_date).toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
                year: "numeric",
              })
            : "N/A";

          const dom = item.end_date
            ? new Date(item.end_date).toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
                year: "numeric",
              })
            : "N/A";

          // Calculate installment amount based on scheme type with validation
          let installmentAmount = 0;
          try {
            // if (schemeObj.schemeType?.toLowerCase() === 'flexi') {
            installmentAmount = parseFloat(item.amount) || 0;
            // } else {
            //   installmentAmount = parseFloat(amount) || 0;
            // }

            // Validate installment amount
            if (isNaN(installmentAmount) || installmentAmount <= 0) {
              console.warn(
                `Invalid installment amount for investment ${item.investmentId}:`,
                installmentAmount
              );
              installmentAmount = 0;
            }
          } catch (error) {
            console.error(
              `Error calculating installment amount for investment ${item.investmentId}:`,
              error
            );
            installmentAmount = 0;
          }

          // Calculate total paid with validation
          let totalPaid = 0;
          try {
            totalPaid = parseFloat(item.total_paid) || 0;
            if (isNaN(totalPaid) || totalPaid < 0) {
              console.warn(
                `Invalid total paid for investment ${item.investmentId}:`,
                totalPaid
              );
              totalPaid = 0;
            }
          } catch (error) {
            console.error(
              `Error calculating total paid for investment ${item.investmentId}:`,
              error
            );
            totalPaid = 0;
          }

          // Calculate gold weight with validation
          let goldWeight = 0;
          try {
            goldWeight = parseFloat(item.totalgoldweight) || 0;
            if (isNaN(goldWeight) || goldWeight < 0) {
              console.warn(
                `Invalid gold weight for investment ${item.investmentId}:`,
                goldWeight
              );
              goldWeight = 0;
            }
          } catch (error) {
            console.error(
              `Error calculating gold weight for investment ${item.investmentId}:`,
              error
            );
            goldWeight = 0;
          }

          // Validate months paid
          const monthsPaid = Math.max(0, item.lastInstallment || 0);

          let chitId: string | number | (string | number)[] = '';
          if (item.chits && 'chitId' in item.chits) {
            const val = item.chits.chitId;
            if (typeof val === 'string' || typeof val === 'number' || (Array.isArray(val) && val.every(v => typeof v === 'string' || typeof v === 'number'))) {
              chitId = val;
            }
          }
          return {
            chitId,
            investmentId: item.investmentId || '',
            id: item.investmentId,
            schemeName:
              schemeObj.schemeName || item.schemeName || "Unknown Scheme",
            metalType: schemeObj.type ? schemeObj.type.toLowerCase() : "gold",
            savingType: schemeObj.schemeType
              ? schemeObj.schemeType.toLowerCase()
              : "weight",
            status: item.status || "active",
            totalPaid,
            monthsPaid,
            emiAmount: installmentAmount,
            maturityDate: dom,
            goldWeight,
            accountHolder: item.accountName || "",
            accNo: item.accountNo || "",
            joiningDate: doj,
            schemeCode: schemeObj.schemeId ? schemeObj.schemeId.toString() : "",
            noOfIns: chit.noOfInstallments ? chit.noOfInstallments.toString() : "0",
            schemesData: schemeObj,
            chitData: chit,
            transactions: [],
            paymentFrequency: item.paymentFrequency || "Monthly",
          };
        });

      // console.log(
      //   "Transformed Savings List:",
      //   JSON.stringify(transformedSavings, null, 2)
      // );
      setSavings(transformedSavings);
    } catch (err: any) {
      console.error("Error fetching data:", err);
      setError(err.message || "Failed to fetch savings data");
    } finally {
      setLoading(false);
    }
  }, [user]);

  useFocusEffect(
    useCallback(() => {
      fetchUserData();
    }, [fetchUserData])
  );

  const translations = useMemo(
    () => ({
      yourGoldPortfolio: t("yourGoldPortfolio"),
      totalInvested: t("totalInvested"),
      activeSavingsPlans: t("activeSavingsPlans"),
      monthsPaid: t("monthsPaid"),
      monthlyEMI: t("monthlyEMI"),
      monthsRemaining: t("monthsRemaining"),
      maturesOn: t("maturesOn"),
      noActiveSchemes: t("noActiveSavingsSchemesFound"),
      gold: t("gold"),
    }),
    [language]
  );

  const totalInvested = savings.reduce((acc, curr) => acc + curr.totalPaid, 0);
  const totalGold = savings.reduce((acc, curr) => acc + curr.goldWeight, 0);
  const hasAmountType = savings.some(s => s.savingType === "amount");

  // Filtered savings based on selectedType
  const filteredSavings = useMemo(() => {
    return savings.filter((item:any) => {
      const schemeType = item.schemesData.paymentFrequencyName;
      // console.log(item, item.schemesData.paymentFrequencyName);
      if (selectedType === 'Flexi') {
        return schemeType === 'Flexi';
      } else {
        return schemeType !== 'Flexi';
      }
    });
  }, [savings, selectedType]);

  // Enhanced Scheme Card Component
  const EnhancedSchemeCard = ({ item }: { item: Scheme }) => {
    // console.log(item)
    const bgColors: readonly [string, string, string] =
      item.metalType === "gold"
        ? ([
            "rgba(1, 133, 69, 0.95)",
            "rgba(90, 0, 11, 0.95)",
            "rgba(46, 4, 6, 0.95)",
          ] as const)
        : ([
            "rgba(192, 192, 192, 0.95)",
            "rgba(168, 168, 168, 0.95)",
            "rgba(128, 128, 128, 0.95)",
          ] as const);

    const [isExpanded, setIsExpanded] = useState(false);
    const animatedHeight = useRef(new Animated.Value(0)).current;
    const [isActive, setIsActive] = useState(false);
    const router = useRouter();

    const progressPercentage = useMemo(() => {
      const monthsPaid = Number(item.monthsPaid) || 0;
      const totalMonths = Number(item.noOfIns) || 1;
      return Math.round((monthsPaid / totalMonths) * 100);
    }, [item.monthsPaid, item.noOfIns]);

    const toggleExpand = () => {
      setIsExpanded(!isExpanded);
      setIsActive(!isActive);
      Animated.spring(animatedHeight, {
        toValue: isExpanded ? 0 : 1,
        useNativeDriver: false,
        friction: 8,
        tension: 40,
      }).start();
    };

    const handleNavigation = (item: Scheme) => {
      // console.log("schems datas ",item)
      if (!item) return;
      router.push({
        pathname: "/(tabs)/savings/SavingsDetail",
        params: {
          schemeName: item.schemeName || "",
          totalPaid: item.totalPaid?.toString() || "0",
          monthsPaid: item.monthsPaid?.toString() || "0",
          emiAmount: item.emiAmount?.toString() || "0",
          maturityDate: item.maturityDate || "",
          goldWeight: item.goldWeight?.toString() || "0.00",
          accountHolder: item.accountHolder || "N/A",
          accNo: item.accNo || "N/A",
          schemeCode: item.schemeCode || "",
          id: item.id || "",
          noOfIns: item.noOfIns || 0,
          chitId: item?.chitData?.chitId || "",
          schemesData: JSON.stringify(item.schemesData || {}),
          transactions: JSON.stringify(item.transactions || []),
          paymentFrequency: item.paymentFrequency,
        },
      });
    };

    const handlePayNow = () => {
      if (!item) return;
      // console.log(item)
      // return
      router.push({
        pathname: "/(tabs)/savings/SavingsDetail",
        params: {
          schemeName: item.schemeName || "",
          totalPaid: item.totalPaid?.toString() || "0",
          monthsPaid: item.monthsPaid?.toString() || "0",
          emiAmount: item.emiAmount?.toString() || "0",
          maturityDate: item.maturityDate || "",
          goldWeight: item.goldWeight?.toString() || "0.00",
          accountHolder: item.accountHolder || "N/A",
          accNo: item.accNo || "N/A",
          schemeCode: item.schemeCode || "",
          id: item.id || "",
          noOfIns: item.noOfIns || 0,
          chitId: item?.chitData?.chitId || "",
          schemesData: JSON.stringify(item.schemesData || {}),
          transactions: JSON.stringify(item.transactions || []),
          paymentFrequency: item.schemesData.paymentFrequencyName,
          autoPayNow: "1",
        },
      });
    };

    return (
      <TouchableOpacity
        activeOpacity={0.9}
        onPress={toggleExpand}
        style={[styles.cardWrapper, isActive && styles.cardWrapperActive]}
      >
        <ImageBackground
          source={
            item.metalType === "gold"
              ? require("../../../../../assets/images/gold_pattern.jpg")
              : require("../../../../../assets/images/silver.png")
          }
          style={styles.cardBackgroundImage}
          imageStyle={styles.cardBackgroundImageStyle}
          resizeMode="cover"
        >
          {/* <LinearGradient colors={bgColors} style={styles.cardContainer}> */}
            <View style={styles.cardHeader}>
              <View style={styles.schemeInfo}>
                <View
                  style={[
                    styles.schemeIconContainer,
                    { backgroundColor: "rgba(255, 255, 255, 0.2)" },
                  ]}
                >
                  {/* <Ionicons
                    name={
                      item.metalType === "gold"
                        ? "diamond-outline"
                        : "cube-outline"
                    }
                    size={24}
                    color="#000"
                  /> */}
              <Image source={require('../../../../../assets/images/gold.png')} style={{ width: 40, height: 40 }} />

                </View>
                <View style={styles.schemeTitleContainer}>
                  <Text style={styles.schemeTitle}>{item.schemeName}</Text>
                  <View style={styles.schemeSubtitleContainer}>
                    <View
                      style={[
                        styles.metalTypeBadge,
                        { backgroundColor: "rgba(255, 255, 255, 0.2)" },
                      ]}
                    >
                      <Text style={styles.metalTypeText}>
                        {item.metalType.charAt(0).toUpperCase() +
                          item.metalType.slice(1)}
                      </Text>
                    </View>
                    <View
                      style={[
                        styles.savingTypeBadge,
                        { backgroundColor: "rgba(255, 255, 255, 0.2)" },
                      ]}
                    >
                      <Text style={styles.savingTypeText}>
                        {item.schemesData?.paymentFrequencyName === 'Flexi'? 'Flexi':'Fixed' }
                      </Text>
                    </View>
                  </View>
                </View>
              </View>
              <View style={styles.headerRight}>
                <View
                  style={[
                    styles.statusBadge,
                    {
                      backgroundColor:
                        item.status === "ACTIVE"
                          ? "rgba(8, 237, 8, 0.56)"
                          : "rgba(255, 0, 0, 0.2)",
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.statusText,
                      {
                        color: item.status === "ACTIVE" ? "#000" : "#FF0000",
                      },
                    ]}
                  >
                    {item.status || "INACTIVE"}
                  </Text>
                </View>
                <View style={styles.expandIcon}>
                  <Ionicons
                    name={isExpanded ? "chevron-up" : "chevron-down"}
                    size={20}
                    color="#FFFFFF"
                  />
                </View>
              </View>
            </View>

            {/* Account Info - Before Action Buttons */}
            <View style={styles.accountInfo}>
              <View style={styles.accountLabelsRow}>
                <View style={styles.accountLabelItem}>
                  <View style={styles.accountIconContainer}>
                    <Ionicons name="person-outline" size={16} color="#FFFFFF" />
                  </View>
                  <Text style={styles.accountLabel}>Account Holder:</Text>
                </View>
                <View style={styles.accountLabelItem}>
                  <View style={styles.accountIconContainer}>
                    <Ionicons name="card-outline" size={16} color="#FFFFFF" />
                  </View>
                  <Text style={styles.accountLabel}>A/C No:</Text>
                </View>
              </View>
              <View style={styles.accountValuesRow}>
                <Text style={styles.accountValue}>{item.accountHolder?.toUpperCase()}</Text>
                <Text style={styles.accountValue}>DCJ-{item.accNo}</Text>
              </View>
            </View>

            {/* Action Buttons Container - Always Visible */}
            <View style={styles.actionButtonsContainer}>
              <TouchableOpacity
                style={styles.detailsButton}
                onPress={() => handleNavigation(item)}
              >
                <LinearGradient
                  colors={["#850111", "#B8860B", "#DAA520"]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.detailsButtonGradient}
                >
                  <Text style={styles.detailsButtonText}>View Details</Text>
                  <Ionicons name="chevron-forward" size={20} color="#fff" />
                </LinearGradient>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.payNowButtonLarge}
                onPress={handlePayNow}
              >
                <LinearGradient
                  colors={["#4CAF50", "#45a049", "#3d8b40"]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.payNowButtonGradient}
                >
                  <Text style={styles.payNowButtonTextLarge}>Pay Now</Text>
                  <Ionicons name="card-outline" size={20} color="#fff" />
                </LinearGradient>
              </TouchableOpacity>
            </View>

            {/* Payment Info Row - Always Visible */}
            <View style={styles.paymentInfoRow}>
              <View style={styles.paymentInfoItem}>
                <View style={styles.paymentInfoIconContainer}>
                  <Ionicons name="time-outline" size={16} color="#FFFFFF" />
                </View>
                <View style={styles.paymentInfoContent}>
                  <Text style={styles.paymentInfoLabel}>Frequency</Text>
                  <Text style={styles.paymentInfoValue}>
                    {/* {item.paymentFrequency} */}
                    {item.schemesData?.paymentFrequencyName === 'Flexi' ? 'Flexi':item.paymentFrequency}
                  </Text>
                </View>
              </View>
              <View style={styles.paymentInfoDivider} />
              <View style={styles.paymentInfoItem}>
                <View style={styles.paymentInfoIconContainer}>
                  <Ionicons name="scale-outline" size={16} color="#FFFFFF" />
                </View>
                <View style={styles.paymentInfoContent}>
                  <Text style={styles.paymentInfoLabel}>Total Weight</Text>
                  <Text style={styles.paymentInfoValue}>
                    {item.goldWeight.toFixed(2)} g
                  </Text>
                </View>
              </View>
            </View>

            <Animated.View
              style={[
                styles.cardContent,
                {
                  maxHeight: animatedHeight.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0, 500],
                  }),
                },
              ]}
            >
              <View style={styles.infoGrid}>
                <View className="infoRow" style={styles.infoRow}>
                  <View style={styles.infoItem}>
                    <View style={styles.infoIconContainer}>
                      <Ionicons name="wallet-outline" size={20} color="#FFFFFF" />
                    </View>
                    <Text style={styles.infoLabel}>Amount Paid</Text>
                    <Text style={styles.infoValue}>
                      ₹{item.totalPaid.toLocaleString()}
                    </Text>
                  </View>
                  {/* Show Months Paid card only for Flexi schemes */}
                  {item.schemesData?.paymentFrequencyName === 'Flexi' && (
                    <View style={styles.infoItem}>
                      <View style={styles.infoIconContainer}>
                        <Ionicons
                          name="calendar-outline"
                          size={20}
                          color="#FFFFFF"
                        />
                      </View>
                      <Text style={styles.infoLabel}>Months Paid</Text>
                      <Text style={styles.infoValue}>
                        {Number(item.noOfIns) !== 0 ? `${item.monthsPaid} / ${item.noOfIns}` : `${item.monthsPaid}` }
                      </Text>
                    </View>
                  )}
                  <View style={styles.infoItem}>
                    <View style={styles.infoIconContainer}>
                      <Ionicons name="cash-outline" size={20} color="#FFFFFF" />
                    </View>
                    <Text style={styles.infoLabel}>Installment</Text>
                    <Text style={styles.infoValue}>₹{item.emiAmount}</Text>
                  </View>
                </View>
              </View>

              <View style={styles.dateContainer}>
                <View style={styles.dateSection}>
                  <View style={styles.dateIconContainer}>
                    <Ionicons
                      name="calendar-outline"
                      size={20}
                      color="#FFFFFF"
                    />
                  </View>
                  <View style={styles.dateInfo}>
                    <Text style={styles.dateLabel}>Date of Joining</Text>
                    <Text style={styles.dateValue}>{item.joiningDate}</Text>
                  </View>
                </View>
                <View style={styles.dateDivider} />
                <View style={styles.dateSection}>
                  <View style={styles.dateIconContainer}>
                    <Ionicons name="time-outline" size={20} color="#FFFFFF" />
                  </View>
                  <View style={styles.dateInfo}>
                    <Text style={styles.dateLabel}>Maturity Date</Text>
                    <Text style={styles.dateValue}>{item.maturityDate}</Text>
                  </View>
                </View>
              </View>

              {/* Installment Progress Section - Only show if not Flexi with payment_duration 0.00 */}
              {!(item.schemesData?.paymentFrequencyName === 'Flexi' && item.schemesData?.payment_duration === '0.00') && (
                <View style={styles.progressContainer}>
                  <View style={styles.progressHeader}>
                    <Text style={styles.progressLabel}>Installment Progress</Text>
                    <View style={styles.progressStats}>
                      <Text style={styles.progressValue}>
                        {progressPercentage}%
                      </Text>
                      <Text style={styles.progressMonths}>
                        {item.monthsPaid}/{item.noOfIns} months
                      </Text>
                    </View>
                  </View>
                  <View style={styles.progressBar}>
                    <Animated.View
                      style={[
                        styles.progressFill,
                        {
                          width: animatedHeight.interpolate({
                            inputRange: [0, 1],
                            outputRange: ["0%", `${progressPercentage}%`],
                          }),
                        },
                      ]}
                    />
                  </View>
                  <View style={styles.monthsInfo}>
                    <View style={styles.monthItem}>
                      <View
                        style={[styles.monthDot, { backgroundColor: "#850111" }]}
                      />
                      <Text style={styles.monthLabel}>Paid</Text>
                      <Text style={styles.monthValue}>{item.monthsPaid}</Text>
                    </View>
                    <View style={styles.monthItem}>
                      <View
                        style={[styles.monthDot, { backgroundColor: "#DAA520" }]}
                      />
                      <Text style={styles.monthLabel}>Pending</Text>
                      <Text style={styles.monthValue}>
                        {Number(item.noOfIns) - Number(item.monthsPaid)}
                      </Text>
                    </View>
                    <View style={styles.monthItem}>
                      <View
                        style={[styles.monthDot, { backgroundColor: "#850111" }]}
                      />
                      <Text style={styles.monthLabel}>Total</Text>
                      <Text style={styles.monthValue}>{item.noOfIns}</Text>
                    </View>
                  </View>
                </View>
              )}
            </Animated.View>
          {/* </LinearGradient> */}
        </ImageBackground>
      </TouchableOpacity>
    );
  };

  const ListHeader = () => (
    <View style={styles.headerContainer}>
      {!hasAmountType && (
        <LinearGradient
          colors={["#1a1a2e", "#16213e", "#0f3460"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.portfolioCard}
        >
          {/* <View style={styles.portfolioHeader}>
            <View style={styles.portfolioTitleContainer}>
              <Text style={styles.portfolioTitle}>
                {translations.yourGoldPortfolio}
              </Text>
              <View style={styles.portfolioBadge}>
                <Ionicons name="star" size={12} color="#ffd700" />
                <Text style={styles.portfolioBadgeText}>Premium</Text>
              </View>
            </View>
            <View style={styles.portfolioIconContainer}>
              <Ionicons name="albums" size={28} color="#ffd700" />
            </View>
          </View> */}

          <View style={styles.portfolioStats}>
            <View style={styles.statItem}>
              <View style={styles.statIconContainer}>
                {/* <Ionicons name="wallet-outline" size={20} color="#ffd700" /> */}
                <Image source={require('../../../../../assets/images/saveasmoneyproduct.png')} style={{ width: 20, height: 20 }} />
                {/* saveasmoneyproduct */}
              </View>
              <View style={styles.statInfo}>
                <Text style={styles.statLabel}>{translations.totalInvested}</Text>
                <Text style={styles.statValue}>
                  ₹{totalInvested.toLocaleString()}
                </Text>
              </View>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <View style={styles.statIconContainer}>
                {/* <Ionicons name="cube-outline" size={20} color="#ffd700" /> */}
                <Image source={require('../../../../../assets/images/savegold.png')} style={{ width: 20, height: 20 }} />
              </View>
              <View style={styles.statInfo}>
                <Text style={styles.statLabel}>{translations.gold}</Text>
                <Text style={styles.statValue}>{totalGold.toFixed(2)} g</Text>
              </View>
            </View>
          </View>

          {/* <View style={styles.portfolioFooter}>
            <View style={styles.footerItem}>
              <Ionicons name="trending-up" size={14} color="#4ade80" />
              <Text style={styles.footerText}>Growing Portfolio</Text>
            </View>
            <View style={styles.footerItem}>
              <Ionicons name="shield-checkmark" size={14} color="#60a5fa" />
              <Text style={styles.footerText}>Secure Investment</Text>
            </View>
          </View> */}
        </LinearGradient>
      )}
      <Text style={styles.sectionTitle}>{translations.activeSavingsPlans}</Text>
      <FilterToggle />
    </View>
  );

  const EmptyState = () => (
    <View style={styles.emptyStateContainer}>
      <LinearGradient
        colors={[
          "rgba(20, 20, 162, 0.9)",
          "rgba(65, 6, 77, 0.7)",
          "rgba(15, 96, 58, 0.9)",
        ]}
        style={styles.emptyStateCard}
      >
        <View style={styles.emptyStateIconContainer}>
          <Ionicons name="trending-up" size={40} color="#ffd700" />
        </View>
        <Image
          source={theme.image.no_data}
          style={styles.emptyStateImage}
          resizeMode="contain"
        />
        <Text style={styles.emptyStateTitle}>
          {translations.noActiveSchemes}
        </Text>
        <Text style={styles.emptyStateSubtitle}>
          Start your gold savings journey today and build your wealth
        </Text>
        <TouchableOpacity
          style={styles.emptyStateButton}
          onPress={() => router.push("/(tabs)/home/schemes")}
        >
          <Ionicons name="add-circle-outline" size={20} color="#000" />
          <Text style={styles.emptyStateButtonText}>Start New Savings</Text>
        </TouchableOpacity>
      </LinearGradient>
    </View>
  );

  // Error State Component
  const ErrorState = () => (
    <View className="flex-1 justify-center items-center px-4">
      <Image
        source={require("../../../../../assets/images/bg_new.jpg")}
        className="w-32 h-32 mb-4"
        resizeMode="contain"
      />
      <Text className="text-lg font-semibold text-gray-800 mb-2">
        {t("somethingWentWrong")}
      </Text>
      <Text className="text-sm text-gray-600 text-center mb-6">
        {t("errorLoadingSavings")}
      </Text>
      <TouchableOpacity
        onPress={fetchUserData}
        className="bg-[#7b0006] px-6 py-3 rounded-full flex-row items-center"
      >
        <Ionicons name="refresh" size={20} color="white" className="mr-2" />
        <Text className="text-white font-semibold">{t("retry")}</Text>
      </TouchableOpacity>
    </View>
  );

  // Filter Toggle UI
  const FilterToggle = () => (
    <View
      style={{
        flexDirection: 'row',
        alignSelf: 'center',
        backgroundColor: theme.colors.primary,
        borderRadius: 30,
        padding: 4,
        marginBottom: 16,
        width: 220,
        height: 44,
      }}
    >
      <TouchableOpacity
        style={{
          flex: 1,
          backgroundColor: selectedType === 'Fixed' ? '#fff' : 'transparent',
          borderRadius: 30,
          justifyContent: 'center',
          alignItems: 'center',
          elevation: selectedType === 'Fixed' ? 2 : 0,
        }}
        onPress={() => setSelectedType('Fixed')}
        activeOpacity={0.8}
      >
        <Text
          style={{
            color: selectedType === 'Fixed' ? theme.colors.primary : '#fff',
            fontWeight: '700',
            fontSize: 16,
          }}
        >
          Fixed
        </Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={{
          flex: 1,
          backgroundColor: selectedType === 'Flexi' ? '#fff' : 'transparent',
          borderRadius: 30,
          justifyContent: 'center',
          alignItems: 'center',
          elevation: selectedType === 'Flexi' ? 2 : 0,
        }}
        onPress={() => setSelectedType('Flexi')}
        activeOpacity={0.8}
      >
        <Text
          style={{
            color: selectedType === 'Flexi' ? theme.colors.primary : '#fff',
            fontWeight: '700',
            fontSize: 16,
          }}
        >
          Flexi
        </Text>
      </TouchableOpacity>
    </View>
  );

  // Memoized renderItem for FlatList
  const renderSchemeItem = useCallback(
    ({ item }) => <EnhancedSchemeCard item={item} />,
    []
  );

  if (!user) {
    return (
      <SafeAreaView className="flex-1 justify-center items-center bg-white">
        <ActivityIndicator size="large" color="#7b0006" />
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView className="flex-1 bg-white">
        <AppHeader showBackButton={false} backRoute={undefined} />
        <ErrorState />
      </SafeAreaView>
    );
  }

  return (
    <View style={{ flex: 1 }}>
      <ImageBackground
        source={require("../../../../../assets/images/bg_new.jpg")}
        style={{ flex: 1 }}
        resizeMode="cover"
      >
        <LinearGradient
          colors={["rgba(0, 0, 0, 0)", "rgba(0, 0, 0, 0.02)", "rgba(0, 0, 0, 0.01)"]}
          style={StyleSheet.absoluteFillObject}
        />

        <SafeAreaView style={{ flex: 1 }}>
          <View className="absolute top-0 left-0 right-0 z-10 px-4">
            <AppHeader showBackButton={false} backRoute="index" />
          </View>

          <FlatList
            data={filteredSavings}
            keyExtractor={(item, index) =>
              item.id && item.id !== "" ? item.id : index.toString()
            }
            renderItem={renderSchemeItem}
            ListHeaderComponent={savings.length > 0 ? <ListHeader /> : null}
            ListEmptyComponent={<EmptyState />}
            contentContainerStyle={{
              paddingTop: 100,
              paddingBottom: bottomPadding,
            }}
            showsVerticalScrollIndicator={false}
            removeClippedSubviews={true}
            maxToRenderPerBatch={10}
            windowSize={5}
            initialNumToRender={10}
          />
        </SafeAreaView>
      </ImageBackground>
    </View>
  );
}

const styles = StyleSheet.create({
  headerContainer: {
    paddingBottom: 0,
    paddingHorizontal: 10,
  },
  portfolioCard: {
    borderRadius: 24,
    padding: 0,
    marginBottom: 20,
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.25,
        shadowRadius: 12,
      },
      android: {
        elevation: 8,
      },
    }),
  },
  portfolioHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  portfolioTitleContainer: {
    flex: 1,
  },
  portfolioTitle: {
    fontSize: 20,
    fontWeight: "800",
    color: "#fff",
    marginBottom: 6,
    textShadowColor: "rgba(0, 0, 0, 0.3)",
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
    letterSpacing: 0.5,
  },
  portfolioBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255,215,0,0.2)",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: "flex-start",
    borderWidth: 1,
    borderColor: "rgba(255,215,0,0.3)",
  },
  portfolioBadgeText: {
    color: "#ffd700",
    fontSize: 11,
    fontWeight: "700",
    marginLeft: 4,
    letterSpacing: 0.5,
  },
  portfolioIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "rgba(255,215,0,0.15)",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(255,215,0,0.2)",
  },
  portfolioStats: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: theme.colors.primary,
    borderRadius: 16,
    padding: 16,
    marginBottom: 0,
    borderWidth: 1,
    borderColor: theme.colors.primary,
  },
  statItem: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
  },
  statIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(255,215,0,0.15)",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
    borderWidth: 1,
    borderColor: "rgba(255,215,0,0.2)",
  },
  statInfo: {
    flex: 1,
  },
  statLabel: {
    fontSize: 12,
    color: "rgba(255,255,255,0.8)",
    marginBottom: 4,
    fontWeight: "500",
    letterSpacing: 0.3,
  },
  statValue: {
    fontSize: 16,
    fontWeight: "800",
    color: "#fff",
    letterSpacing: 0.5,
  },
  statDivider: {
    width: 1,
    height: 36,
    backgroundColor: "rgba(255,255,255,0.15)",
    marginHorizontal: 16,
  },
  portfolioFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    borderTopWidth: 1,
    borderTopColor: "rgba(255,255,255,0.15)",
    paddingTop: 12,
  },
  footerItem: {
    flexDirection: "row",
    alignItems: "center",
  },
  footerText: {
    color: "rgba(255,255,255,0.9)",
    fontSize: 12,
    fontWeight: "600",
    marginLeft: 6,
    letterSpacing: 0.3,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: "800",
    color: "rgba(0, 0, 0, 0.89)",
    textAlign: "center",
    marginBottom: 20,
    textShadowColor: "rgba(34, 34, 209, 0.24)",
    textShadowOffset: { width: 1, height: 2 },
    textShadowRadius: 4,
    letterSpacing: 0.5,
  },
  cardWrapper: {
    marginHorizontal: 16,
    marginBottom: 20,
    borderRadius: 24,
    overflow: "hidden",
    elevation: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
  },
  cardWrapperActive: {
    transform: [{ scale: 1.02 }],
    elevation: 12,
    shadowOpacity: 0.3,
  },
  cardBackgroundImage: {
    flex: 1,
  },
  cardBackgroundImageStyle: {
    borderRadius: 24,
    resizeMode: 'cover',
  },
  cardContainer: {
    padding: 16,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    margin: 12,
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: "rgba(255, 255, 255, 0.15)",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.2)",
  },
  schemeInfo: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  schemeIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
    backgroundColor: "rgba(255, 255, 255, 0.25)",
    borderWidth: 2,
    borderColor: "rgba(255, 255, 255, 0.3)",
  },
  schemeTitleContainer: {
    flex: 1,
  },
  schemeTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#000",
    marginBottom: 6,
    textShadowColor: "rgba(255, 255, 255, 0.5)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  schemeSubtitleContainer: {
    flexDirection: "row",
    gap: 10,
  },
  metalTypeBadge: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: "rgba(255, 255, 255, 0.3)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.4)",
  },
  metalTypeText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#000",
  },
  savingTypeBadge: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: "rgba(255, 255, 255, 0.3)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.4)",
  },
  savingTypeText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#000",
  },
  headerRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: "rgba(255, 255, 255, 0.3)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.4)",
  },
  statusText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#000",
  },
  expandIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(133, 1, 17, 0.4)",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "rgba(133, 1, 17, 0.6)",
  },
  accountInfo: {
    flexDirection: "column",
    marginBottom: 16,
    paddingHorizontal: 12,
    paddingVertical: 12,
    backgroundColor: "rgba(255, 255, 255, 0.4)",
    borderRadius: 16,
    marginHorizontal: 12,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.3)",
  },
  accountLabelsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  accountLabelItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    flex: 1,
  },
  accountIconContainer: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: "rgba(228, 16, 41, 0.62)",
    justifyContent: "center",
    alignItems: "center",
  },
  accountLabel: {
    fontSize: 12,
    color: "rgba(0, 0, 0, 0.8)",
    fontWeight: "600",
  },
  accountValuesRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  accountValue: {
    fontSize: 18,
    fontWeight: "700",
    color: "rgb(0, 0, 0)",
    flex: 1,
    textAlign: "center",
  },
  cardContent: {
    overflow: "hidden",
  },
  infoGrid: {
    marginBottom: 16,
  },
  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 8,
  },
  infoItem: {
    flex: 1,
    alignItems: "center",
    padding: 12,
    backgroundColor: "rgba(255, 255, 255, 0.48)",
    borderRadius: 12,
  },
  infoIconContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "rgba(228, 16, 41, 0.62)",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 8,
  },
  infoLabel: {
    fontSize: 12,
    color: "rgba(7, 0, 0, 0.8)",
    marginBottom: 4,
  },
  infoValue: {
    fontSize: 18,
    fontWeight: "700",
    color: "#000",
  },
  dateContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "rgba(45, 22, 17, 0.78)",
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
  },
  dateSection: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  dateIconContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "rgba(133, 1, 17, 0.1)",
    justifyContent: "center",
    alignItems: "center",
  },
  dateInfo: {
    flex: 1,
  },
  dateLabel: {
    fontSize: 12,
    color: "rgba(255, 255, 255, 0.8)",
    marginBottom: 2,
  },
  dateValue: {
    fontSize: 13,
    fontWeight: "500",
    color: "#FFFFFF",
  },
  dateDivider: {
    width: 1,
    height: "100%",
    backgroundColor: "rgba(0, 0, 0, 0.1)",
    marginHorizontal: 12,
  },
  progressContainer: {
    backgroundColor: "rgba(255, 255, 255, 0.5)",
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
  },
  progressHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  progressLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: "#000",
  },
  progressStats: {
    flexDirection: "row",
    alignItems: "baseline",
    gap: 4,
  },
  progressValue: {
    fontSize: 16,
    fontWeight: "700",
    color: "#000",
  },
  progressMonths: {
    fontSize: 12,
    color: "rgba(14, 13, 13, 0.8)",
  },
  progressBar: {
    height: 8,
    backgroundColor: "rgba(255, 255, 255, 0.84)",
    borderRadius: 4,
    overflow: "hidden",
    marginBottom: 12,
  },
  progressFill: {
    height: "100%",
    backgroundColor: "#850111",
    borderRadius: 4,
  },
  monthsInfo: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  monthItem: {
    alignItems: "center",
    gap: 4,
  },
  monthDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  monthLabel: {
    fontSize: 12,
    color: "rgba(18, 18, 18, 0.8)",
  },
  monthValue: {
    fontSize: 12,
    fontWeight: "500",
    color: "#FFFFFF",
  },
  actionButtonsContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginHorizontal: 12,
    marginBottom: 16,
    gap: 12,
  },
  detailsButton: {
    flex: 1,
    borderRadius: 16,
    overflow: "hidden",
    elevation: 6,
    shadowColor: "#850111",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
  },
  detailsButtonGradient: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 14,
    paddingHorizontal: 24,
  },
  detailsButtonText: {
    fontSize: 15,
    fontWeight: "700",
    color: "#fff",
    marginRight: 8,
    textShadowColor: "rgba(0, 0, 0, 0.3)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  payNowButtonLarge: {
    flex: 1,
    borderRadius: 16,
    overflow: "hidden",
    elevation: 6,
    shadowColor: "#4CAF50",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
  },
  payNowButtonGradient: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 14,
    paddingHorizontal: 24,
  },
  payNowButtonTextLarge: {
    fontSize: 15,
    fontWeight: "700",
    color: "#fff",
    marginRight: 8,
    textShadowColor: "rgba(0, 0, 0, 0.3)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  paymentInfoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.6)",
    borderRadius: 16,
    marginHorizontal: 12,
    marginBottom: 16,
    padding: 16,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.3)",
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  paymentInfoItem: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
  },
  paymentInfoIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(133, 1, 17, 0.7)",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 10,
    borderWidth: 2,
    borderColor: "rgba(133, 1, 17, 0.9)",
  },
  paymentInfoContent: {
    flex: 1,
  },
  paymentInfoLabel: {
    fontSize: 13,
    color: "rgba(0, 0, 0, 0.7)",
    marginBottom: 4,
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  paymentInfoValue: {
    fontSize: 17,
    fontWeight: "800",
    color: "#000",
    textShadowColor: "rgba(255, 255, 255, 0.5)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  paymentInfoDivider: {
    width: 2,
    height: 50,
    backgroundColor: "rgba(133, 1, 17, 0.3)",
    marginHorizontal: 16,
    borderRadius: 1,
  },
  emptyStateContainer: {
    padding: 6,
    marginTop: 2,
  },
  emptyStateCard: {
    borderRadius: 24,
    padding: 12,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(255,215,0,0.2)",
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.25,
        shadowRadius: 12,
      },
      android: {
        elevation: 8,
      },
    }),
  },
  emptyStateIconContainer: {
    width: 60,
    height: 60,
    borderRadius: 40,
    backgroundColor: "rgba(255,215,0,0.15)",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "rgba(255,215,0,0.2)",
  },
  emptyStateImage: {
    width: 150,
    height: 150,
    marginBottom: 20,
  },
  emptyStateTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#fff",
    textAlign: "center",
    marginBottom: 8,
    textShadowColor: "rgba(0,0,0,0.5)",
    textShadowOffset: { width: 1, height: 2 },
    textShadowRadius: 4,
  },
  emptyStateSubtitle: {
    fontSize: 14,
    color: "rgba(255,255,255,0.8)",
    textAlign: "center",
    marginBottom: 24,
    lineHeight: 20,
  },
  emptyStateButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#ffd700",
    paddingVertical: 14,
    paddingHorizontal: 28,
    borderRadius: 16,
    ...Platform.select({
      ios: {
        shadowColor: "#ffd700",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
      },
      android: {
        elevation: 6,
      },
    }),
  },
  emptyStateButtonText: {
    color: "#1a1a2e",
    fontSize: 16,
    fontWeight: "700",
    marginLeft: 8,
  },
});
