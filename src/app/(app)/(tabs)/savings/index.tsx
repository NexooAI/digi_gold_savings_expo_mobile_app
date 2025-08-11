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
// AppHeader is now handled by the layout wrapper
import { t } from "@/i18n";
import useGlobalStore from "@/store/global.store";
import api from "@/services/api";
import { moderateScale } from "react-native-size-matters";
import { theme } from "@/constants/theme";
import { COLORS, GRADIENT_COLORS } from "@/constants/colors";
import AuthGuard from "@/components/AuthGuard";
import { formatGoldWeight } from "@/utils/imageUtils";

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
      viewDetails: t("viewDetails"),
      payNow: t("payNow"),
      accountHolderLabel: t("accountHolderLabel"),
      accountNumberLabel: t("accountNumberLabel"),
      frequency: t("frequency"),
      totalWeight: t("totalWeight"),
      installmentProgress: t("installmentProgress"),
      investmentTimeline: t("investmentTimeline"),
      started: t("started"),
      currentProgress: t("currentProgress"),
      maturity: t("maturity"),
      paid: t("paid"),
      pending: t("pending"),
      total: t("total"),
      startNewSavings: t("startNewSavings"),
      fixed: t("fixed"),
      flexi: t("flexi"),
      totalInvestedLabel: t("totalInvestedLabel"),
      goldWeightLabel: t("goldWeightLabel"),
      monthlyEMILabel: t("monthlyEMILabel"),
      progressLabel: t("progressLabel"),
      remainingLabel: t("remainingLabel"),
      statusLabel: t("statusLabel"),
      monthsLabel: t("monthsLabel"),
      completeLabel: t("completeLabel"),
      somethingWentWrong: t("somethingWentWrong"),
      errorLoadingSavings: t("errorLoadingSavings"),
      retry: t("retry"),
    }),
    [language]
  );

  const totalInvested = savings.reduce((acc, curr) => acc + curr.totalPaid, 0);
  const totalGold = savings.reduce((acc, curr) => acc + curr.goldWeight, 0);
  const hasAmountType = savings.some(s => s.savingType === "amount");

  // Filtered savings based on selectedType
  const filteredSavings = useMemo(() => {
    return savings.filter((item: any) => {
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
          theme.colors.bgSuccessLight,
          theme.colors.redBurgundyDark,
          theme.colors.redDarker,
        ] as const)
        : ([
          theme.colors.silver,
          theme.colors.silverLight,
          theme.colors.silverDark,
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
          source: "savings_index", // Track source
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
          source={theme.images.savings.savingBg}
          style={styles.cardBackgroundImage}
          imageStyle={styles.cardBackgroundImageStyle}
          resizeMode="cover"
        >
          {/* <LinearGradient colors={bgColors} style={styles.cardContainer}> */}
          <View style={styles.cardHeader}>
            <View style={styles.schemeInfo}>
              {/* <View
                style={[
                  styles.schemeIconContainer,
                  { backgroundColor: theme.colors.bgWhiteMedium },
                ]}
              >
                <Ionicons
                    name={
                      item.metalType === "gold"
                        ? "diamond-outline"
                        : "cube-outline"
                    }
                    size={24}
                    color={theme.colors.textSecondary}
                  />
                <Image source={theme.images.products.gold} style={{ width: 40, height: 40 }} />

              </View> */}
              <View style={styles.schemeTitleContainer}>
                <Text style={styles.schemeTitle}>{item.schemeName}</Text>
                <View style={styles.schemeSubtitleContainer}>
                  <View
                    style={[
                      styles.metalTypeBadge,
                      { backgroundColor: "rgb(245, 225, 6)" },
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
                      { backgroundColor: theme.colors.bgErrorMedium },
                    ]}
                  >
                    <Text style={styles.savingTypeText}>
                      {item.schemesData?.paymentFrequencyName === 'Flexi' ? translations.flexi : translations.fixed}
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
                                ? theme.colors.bgSuccessLight
        : theme.colors.bgErrorLight,
                  },
                ]}
              >
                <Text
                  style={[
                    styles.statusText,
                    {
                      color: item.status === "ACTIVE" ? theme.colors.textSecondary : theme.colors.error,
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
                  color={theme.colors.textPrimary}
                />
              </View>
            </View>
          </View>

          {/* Account Info - Before Action Buttons */}
          <View style={styles.accountInfo}>
            <View style={styles.accountLabelsRow}>
              <View style={styles.accountLabelItem}>
                <View style={styles.accountIconContainer}>
                  <Ionicons name="person-outline" size={16} color={COLORS.white} />
                </View>
                <Text style={styles.accountLabel}>{translations.accountHolderLabel}</Text>
              </View>
              <View style={styles.accountLabelItem}>
                <View style={styles.accountIconContainer}>
                  <Ionicons name="card-outline" size={16} color={COLORS.white} />
                </View>
                <Text style={styles.accountLabel}>{translations.accountNumberLabel}</Text>
              </View>
            </View>
            <View style={styles.accountValuesRow}>
              <Text style={styles.accountValue}>{item.accountHolder?.toUpperCase()}</Text>
              <Text style={styles.accountValue}>DCJ-{item.accNo}</Text>
            </View>
          </View>



          {/* Payment Info Row - Always Visible */}
          <View style={styles.paymentInfoRow}>
            <View style={styles.paymentInfoItem}>
              <View style={styles.paymentInfoIconContainer}>
                <Ionicons name="time-outline" size={16} color={COLORS.white} />
              </View>
              <View style={styles.paymentInfoContent}>
                <Text style={styles.paymentInfoLabel}>{translations.frequency}</Text>
                <Text style={styles.paymentInfoValue}>
                  {/* {item.paymentFrequency} */}
                  {item.schemesData?.paymentFrequencyName === 'Flexi' ? translations.flexi : item.paymentFrequency}
                </Text>
              </View>
            </View>
            <View style={styles.paymentInfoDivider} />
            <View style={styles.paymentInfoItem}>
              <View style={styles.paymentInfoIconContainer}>
                <Ionicons name="scale-outline" size={16} color={COLORS.white} />
              </View>
              <View style={styles.paymentInfoContent}>
                <Text style={styles.paymentInfoLabel}>{translations.totalWeight}</Text>
                <Text style={styles.paymentInfoValue}>
                  {formatGoldWeight(item.goldWeight)}
                </Text>
              </View>
            </View>
          </View>
          {/* Action Buttons Container - Always Visible */}
          <View style={styles.actionButtonsContainer}>
            <TouchableOpacity
              style={styles.detailsButton}
              onPress={() => handleNavigation(item)}
            >
              <LinearGradient
                colors={GRADIENT_COLORS.primary as any}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.detailsButtonGradient}
              >
                <Text style={styles.detailsButtonText}>{translations.viewDetails}</Text>
                <Ionicons name="chevron-forward" size={20} color={COLORS.white} />
              </LinearGradient>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.payNowButtonLarge}
              onPress={handlePayNow}
            >
              <LinearGradient
                colors={GRADIENT_COLORS.success as any}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.payNowButtonGradient}
              >
                <Text style={styles.payNowButtonTextLarge}>{translations.payNow}</Text>
                <Ionicons name="card-outline" size={20} color={COLORS.white} />
              </LinearGradient>
            </TouchableOpacity>
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
            {/* Enhanced Info Grid with More Relevant Data */}
            <View style={styles.enhancedInfoGrid}>
              <View style={styles.enhancedInfoRow}>
                <View style={styles.enhancedInfoItem}>
                  <View style={styles.enhancedInfoIconContainer}>
                    <Ionicons name="wallet-outline" size={20} color={COLORS.white} />
                  </View>
                  <Text style={styles.enhancedInfoLabel}>{translations.totalInvestedLabel}</Text>
                  <Text style={styles.enhancedInfoValue}>
                    ₹{item.totalPaid.toLocaleString()}
                  </Text>
                </View>

                <View style={styles.enhancedInfoItem}>
                  <View style={styles.enhancedInfoIconContainer}>
                    <Ionicons name="trending-up" size={20} color={COLORS.white} />
                  </View>
                  <Text style={styles.enhancedInfoLabel}>{translations.goldWeightLabel}</Text>
                  <Text style={styles.enhancedInfoValue}>
                    {formatGoldWeight(item.goldWeight)}
                  </Text>
                </View>

                <View style={styles.enhancedInfoItem}>
                  <View style={styles.enhancedInfoIconContainer}>
                    <Ionicons name="cash-outline" size={20} color={COLORS.white} />
                  </View>
                  <Text style={styles.enhancedInfoLabel}>{translations.monthlyEMILabel}</Text>
                  <Text style={styles.enhancedInfoValue}>₹{item.emiAmount}</Text>
                </View>
              </View>

              {/* Additional Row for More Details */}
              <View style={styles.enhancedInfoRow}>
                <View style={styles.enhancedInfoItem}>
                  <View style={styles.enhancedInfoIconContainer}>
                    <Ionicons name="calendar-outline" size={20} color={COLORS.white} />
                  </View>
                  <Text style={styles.enhancedInfoLabel}>{translations.progressLabel}</Text>
                  <Text style={styles.enhancedInfoValue}>
                    {item.monthsPaid}/{item.noOfIns}
                  </Text>
                </View>

                <View style={styles.enhancedInfoItem}>
                  <View style={styles.enhancedInfoIconContainer}>
                    <Ionicons name="time-outline" size={20} color={COLORS.white} />
                  </View>
                  <Text style={styles.enhancedInfoLabel}>{translations.remainingLabel}</Text>
                  <Text style={styles.enhancedInfoValue}>
                    {Number(item.noOfIns) - Number(item.monthsPaid)} {translations.monthsLabel}
                  </Text>
                </View>

                <View style={styles.enhancedInfoItem}>
                  <View style={styles.enhancedInfoIconContainer}>
                    <Ionicons name="trophy-outline" size={20} color={COLORS.white} />
                  </View>
                  <Text style={styles.enhancedInfoLabel}>{translations.statusLabel}</Text>
                  <Text style={[
                    styles.enhancedInfoValue,
                    { color: item.status === "ACTIVE" ? theme.colors.statusActive : theme.colors.statusInactive }
                  ]}>
                    {item.status || "INACTIVE"}
                  </Text>
                </View>
              </View>
            </View>

            {/* Smart Timeline Section */}
            <View style={styles.smartTimelineContainer}>
              <View style={styles.timelineHeader}>
                <Ionicons name="time-outline" size={18} color={COLORS.black} />
                <Text style={styles.timelineTitle}>{translations.investmentTimeline}</Text>
              </View>

              <View style={styles.timelineContent}>
                <View style={styles.timelineItem}>
                  <View style={styles.timelineDot} />
                  <View style={styles.timelineInfo}>
                    <Text style={styles.timelineLabel}>{translations.started}</Text>
                    <Text style={styles.timelineValue}>{item.joiningDate}</Text>
                  </View>
                </View>

                <View style={styles.timelineConnector} />

                <View style={styles.timelineItem}>
                  <View style={[styles.timelineDot, { backgroundColor: progressPercentage > 50 ? theme.colors.success : theme.colors.warning }]} />
                  <View style={styles.timelineInfo}>
                    <Text style={styles.timelineLabel}>{translations.currentProgress}</Text>
                    <Text style={styles.timelineValue}>{progressPercentage}% {translations.completeLabel}</Text>
                  </View>
                </View>

                <View style={styles.timelineConnector} />

                <View style={styles.timelineItem}>
                  <View style={[styles.timelineDot, { backgroundColor: theme.colors.gold }]} />
                  <View style={styles.timelineInfo}>
                    <Text style={styles.timelineLabel}>{translations.maturity}</Text>
                    <Text style={styles.timelineValue}>{item.maturityDate}</Text>
                  </View>
                </View>
              </View>
            </View>

            {/* Installment Progress Section - Only show if not Flexi with payment_duration 0.00 */}
            {!(item.schemesData?.paymentFrequencyName === 'Flexi' && item.schemesData?.payment_duration === '0.00') && (
              <View style={styles.progressContainer}>
                <View style={styles.progressHeader}>
                  <Text style={styles.progressLabel}>{translations.installmentProgress}</Text>
                  <View style={styles.progressStats}>
                    {/* <Text style={styles.progressValue}>
                      {progressPercentage}%
                    </Text> */}
                    <Text style={styles.progressMonths}>
                      {item.monthsPaid}/{item.noOfIns} {translations.monthsLabel}
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
                      style={[styles.monthDot, { backgroundColor: theme.colors.primary }]}
                    />
                    <Text style={styles.monthLabel}>{translations.paid}</Text>
                    <Text style={styles.monthValue}>{item.monthsPaid}</Text>
                  </View>
                  <View style={styles.monthItem}>
                    <View
                      style={[styles.monthDot, { backgroundColor: theme.colors.goldLight }]}
                    />
                    <Text style={styles.monthLabel}>{translations.pending}</Text>
                    <Text style={styles.monthValue}>
                      {Number(item.noOfIns) - Number(item.monthsPaid)}
                    </Text>
                  </View>
                  <View style={styles.monthItem}>
                    <View
                      style={[styles.monthDot, { backgroundColor: theme.colors.primary }]}
                    />
                    <Text style={styles.monthLabel}>{translations.total}</Text>
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
          colors={GRADIENT_COLORS.blue as any}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.portfolioCard}
        >
          <View style={styles.portfolioStats}>
            <View style={styles.statItem}>
              <View style={styles.statIconContainer}>
                {/* <Ionicons name="wallet-outline" size={20} color="#ffd700" /> */}
                <Image source={theme.images.products.saveAsMoney} style={{ width: 20, height: 20 }} />
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
                <Image source={theme.images.products.saveGold} style={{ width: 20, height: 20 }} />
              </View>
              <View style={styles.statInfo}>
                <Text style={styles.statLabel}>{translations.gold}</Text>
                <Text style={styles.statValue}>{totalGold.toFixed(2)} g</Text>
              </View>
            </View>
          </View>

          {/* <View style={styles.portfolioFooter}>
            <View style={styles.footerItem}>
              <Ionicons name="trending-up" size={14} color={COLORS.green} />
              <Text style={styles.footerText}>Growing Portfolio</Text>
            </View>
            <View style={styles.footerItem}>
              <Ionicons name="shield-checkmark" size={14} color={COLORS.blue} />
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
          theme.colors.blueDark,
          theme.colors.blueDarker,
          theme.colors.greenSuccess,
        ]}
        style={styles.emptyStateCard}
      >
        <View style={styles.emptyStateIconContainer}>
          <Ionicons name="trending-up" size={40} color={COLORS.gold} />
        </View>
        <Image
          source={theme.images.navigation.noData}
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
          <Ionicons name="add-circle-outline" size={20} color={COLORS.black} />
          <Text style={styles.emptyStateButtonText}>{translations.startNewSavings}</Text>
        </TouchableOpacity>
      </LinearGradient>
    </View>
  );

  // Error State Component
  const ErrorState = () => (
    <View className="flex-1 justify-center items-center px-4">
      <Image
        source={theme.images.auth.newBg}
        className="w-32 h-32 mb-4"
        resizeMode="contain"
      />
      <Text className="text-lg font-semibold text-gray-800 mb-2">
        {translations.somethingWentWrong}
      </Text>
      <Text className="text-sm text-gray-600 text-center mb-6">
        {translations.errorLoadingSavings}
      </Text>
      <TouchableOpacity
        onPress={fetchUserData}
        className="bg-[#7b0006] px-6 py-3 rounded-full flex-row items-center"
      >
        <Ionicons name="refresh" size={20} color="white" className="mr-2" />
        <Text className="text-white font-semibold">{translations.retry}</Text>
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
          backgroundColor: selectedType === 'Fixed' ? COLORS.white : COLORS.transparent,
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
            color: selectedType === 'Fixed' ? theme.colors.primary : COLORS.white,
            fontWeight: '700',
            fontSize: 16,
          }}
        >
          {translations.fixed}
        </Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={{
          flex: 1,
          backgroundColor: selectedType === 'Flexi' ? COLORS.white : COLORS.transparent,
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
            color: selectedType === 'Flexi' ? theme.colors.primary : COLORS.white,
            fontWeight: '700',
            fontSize: 16,
          }}
        >
          {translations.flexi}
        </Text>
      </TouchableOpacity>
    </View>
  );

  // Memoized renderItem for FlatList
  const renderSchemeItem = useCallback(
    ({ item }: { item: any }) => <EnhancedSchemeCard item={item} />,
    []
  );

  if (!user) {
    return (
      <SafeAreaView className="flex-1 justify-center items-center bg-white">
        <ActivityIndicator size="large" color={COLORS.burgundy} />
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView className="flex-1 bg-white">
        <ErrorState />
      </SafeAreaView>
    );
  }

  return (
    <AuthGuard>
      <View style={{ flex: 1 }}>
        <ImageBackground
          source={theme.images.auth.newBg}
          style={{ flex: 1 }}
          resizeMode="cover"
        >
          <LinearGradient
            colors={[theme.colors.bgBlackLight, theme.colors.bgBlackLight, theme.colors.transparent]}
            style={StyleSheet.absoluteFillObject}
          />

          <SafeAreaView style={{ flex: 1 }}>
            {/* Header is now handled by the layout wrapper */}

            <FlatList
              data={filteredSavings}
              keyExtractor={(item, index) =>
                item.id && item.id !== "" ? item.id : index.toString()
              }
              renderItem={renderSchemeItem}
              ListHeaderComponent={savings.length > 0 ? <ListHeader /> : null}
              ListEmptyComponent={<EmptyState />}
              contentContainerStyle={{
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
    </AuthGuard>
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
        shadowColor: COLORS.black,
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
    color: COLORS.white,
    marginBottom: 6,
    textShadowColor: theme.colors.textShadowBlack,
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
    letterSpacing: 0.5,
  },
  portfolioBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: theme.colors.bgGoldMedium,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: "flex-start",
    borderWidth: 1,
    borderColor: theme.colors.borderGoldMedium,
  },
  portfolioBadgeText: {
    color: COLORS.gold,
    fontSize: 11,
    fontWeight: "700",
    marginLeft: 4,
    letterSpacing: 0.5,
  },
  portfolioIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: theme.colors.bgGoldLight,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: theme.colors.borderGoldLight,
  },
  portfolioStats: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: theme.colors.bgPrimaryHeavy,
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
    backgroundColor: theme.colors.bgGoldHeavy,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
    borderWidth: 1,
    borderColor: theme.colors.borderGoldMedium,
  },
  statInfo: {
    flex: 1,
  },
  statLabel: {
    fontSize: 12,
    color: theme.colors.bgWhiteVeryHeavy,
    marginBottom: 4,
    fontWeight: "500",
    letterSpacing: 0.3,
  },
  statValue: {
    fontSize: 16,
    fontWeight: "800",
    color: theme.colors.textPrimary,
    letterSpacing: 0.5,
  },
  statDivider: {
    width: 1,
    height: 36,
    backgroundColor: theme.colors.bgWhiteMedium,
    marginHorizontal: 16,
  },
  portfolioFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    borderTopWidth: 1,
    borderTopColor: theme.colors.borderWhiteLight,
    paddingTop: 12,
  },
  footerItem: {
    flexDirection: "row",
    alignItems: "center",
  },
  footerText: {
    color: theme.colors.bgWhiteVeryHeavy,
    fontSize: 12,
    fontWeight: "600",
    marginLeft: 6,
    letterSpacing: 0.3,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: "800",
    color: theme.colors.black,
    textAlign: "center",
    marginBottom: 20,
    textShadowColor: theme.colors.blue,
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
    shadowColor: theme.colors.black,
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
    backgroundColor: theme.colors.bgWhiteVeryHeavy,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: theme.colors.borderWhiteMedium,
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
    backgroundColor: theme.colors.bgWhiteMedium,
    borderWidth: 2,
    borderColor: theme.colors.borderWhiteMedium,
  },
  schemeTitleContainer: {
    flex: 1,
  },
  schemeTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: theme.colors.textSecondary,
    marginBottom: 6,
    textShadowColor: theme.colors.textShadowWhite,
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
    backgroundColor: theme.colors.bgSuccessLight,
    borderWidth: 1,
    borderColor: theme.colors.bgWhiteHeavy,
  },
  metalTypeText: {
    fontSize: 12,
    fontWeight: "600",
    color: theme.colors.textSecondary,
  },
  savingTypeBadge: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: theme.colors.bgWhiteHeavy,
    borderWidth: 1,
    borderColor: theme.colors.bgWhiteHeavy,
  },
  savingTypeText: {
    fontSize: 12,
    fontWeight: "700",
    color: theme.colors.textSecondary,
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
    backgroundColor: theme.colors.bgWhiteHeavy,
    borderWidth: 1,
    borderColor: theme.colors.bgWhiteHeavy,
  },
  statusText: {
    fontSize: 8,
    fontWeight: "600",
    color: theme.colors.textSecondary,
  },
  expandIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: theme.colors.bgPrimaryMedium,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: theme.colors.primary,
  },
  accountInfo: {
    flexDirection: "column",
    marginBottom: 16,
    paddingHorizontal: 12,
    paddingVertical: 12,
    backgroundColor: theme.colors.bgWhiteHeavy,
    borderRadius: 16,
    marginHorizontal: 12,
    borderWidth: 1,
    borderColor: theme.colors.borderWhiteLight,
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
    backgroundColor: theme.colors.bgErrorMedium,
    justifyContent: "center",
    alignItems: "center",
  },
  accountLabel: {
    fontSize: 12,
    color: theme.colors.black,
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
    color: theme.colors.textSecondary,
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
    backgroundColor: theme.colors.bgWhiteMedium,
    borderRadius: 12,
  },
  infoIconContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: theme.colors.bgErrorMedium,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 8,
  },
  infoLabel: {
    fontSize: 12,
    color: theme.colors.black,
    marginBottom: 4,
  },
  infoValue: {
    fontSize: 18,
    fontWeight: "700",
    color: theme.colors.textSecondary,
  },
  dateContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: theme.colors.bgPrimaryHeavy,
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
    backgroundColor: theme.colors.bgPrimaryLight,
    justifyContent: "center",
    alignItems: "center",
  },
  dateInfo: {
    flex: 1,
  },
  dateLabel: {
    fontSize: 12,
    color: theme.colors.bgWhiteVeryHeavy,
    marginBottom: 2,
  },
  dateValue: {
    fontSize: 13,
    fontWeight: "500",
    color: theme.colors.textPrimary,
  },
  dateDivider: {
    width: 1,
    height: "100%",
    backgroundColor: theme.colors.bgBlackLight,
    marginHorizontal: 12,
  },
  progressContainer: {
    backgroundColor: theme.colors.bgWhiteHeavy,
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
    color: theme.colors.textSecondary,
  },
  progressStats: {
    flexDirection: "row",
    alignItems: "baseline",
    gap: 4,
  },
  progressValue: {
    fontSize: 16,
    fontWeight: "700",
    color: theme.colors.textSecondary,
  },
  progressMonths: {
    fontSize: 12,
    color: theme.colors.black,
  },
  progressBar: {
    height: 8,
    backgroundColor: theme.colors.bgWhiteVeryHeavy,
    borderRadius: 4,
    overflow: "hidden",
    marginBottom: 12,
  },
  progressFill: {
    height: "100%",
    backgroundColor: theme.colors.primary,
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
    color: theme.colors.black,
  },
  monthValue: {
    fontSize: 12,
    fontWeight: "500",
    color: theme.colors.textPrimary,
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
    shadowColor: theme.colors.primary,
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
    color: theme.colors.textPrimary,
    marginRight: 8,
    textShadowColor: theme.colors.textShadowBlack,
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  payNowButtonLarge: {
    flex: 1,
    borderRadius: 16,
    overflow: "hidden",
    elevation: 6,
    shadowColor: theme.colors.success,
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
    color: theme.colors.textPrimary,
    marginRight: 8,
    textShadowColor: theme.colors.textShadowBlack,
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  paymentInfoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: theme.colors.bgWhiteHeavy,
    borderRadius: 16,
    marginHorizontal: 12,
    marginBottom: 16,
    padding: 10,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: theme.colors.borderWhiteMedium,
    elevation: 4,
    shadowColor: theme.colors.black,
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
    backgroundColor: theme.colors.bgPrimaryHeavy,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 10,
    borderWidth: 2,
    borderColor: theme.colors.primary,
  },
  paymentInfoContent: {
    flex: 1,
  },
  paymentInfoLabel: {
    fontSize: 13,
    color: theme.colors.black,
    marginBottom: 4,
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  paymentInfoValue: {
    fontSize: 17,
    fontWeight: "800",
    color: theme.colors.textSecondary,
    textShadowColor: theme.colors.textShadowWhite,
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  paymentInfoDivider: {
    width: 2,
    height: 50,
    backgroundColor: theme.colors.bgPrimaryLight,
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
    borderColor: theme.colors.borderGoldMedium,
    backgroundColor: theme.colors.bgWhiteLight,
    ...Platform.select({
      ios: {
        shadowColor: theme.colors.black,
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
    backgroundColor: theme.colors.bgGoldMedium,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
    borderWidth: 1,
    borderColor: theme.colors.borderGoldMedium,
  },
  emptyStateImage: {
    width: 150,
    height: 150,
    marginBottom: 20,
  },
  emptyStateTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: COLORS.white,
    textAlign: "center",
    marginBottom: 8,
    textShadowColor: theme.colors.textShadowBlack,
    textShadowOffset: { width: 1, height: 2 },
    textShadowRadius: 4,
  },
  emptyStateSubtitle: {
    fontSize: 14,
    color: theme.colors.bgWhiteVeryHeavy,
    textAlign: "center",
    marginBottom: 24,
    lineHeight: 20,
  },
  emptyStateButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.gold,
    paddingVertical: 14,
    paddingHorizontal: 28,
    borderRadius: 16,
    ...Platform.select({
      ios: {
        shadowColor: COLORS.gold,
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
    color: theme.colors.blueDark,
    fontSize: 16,
    fontWeight: "700",
    marginLeft: 8,
  },
  enhancedInfoGrid: {
    marginBottom: 16,
  },
  enhancedInfoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 12,
    gap: 8,
  },
  enhancedInfoItem: {
    flex: 1,
    alignItems: "center",
    padding: 12,
    backgroundColor: theme.colors.bgWhiteHeavy,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: theme.colors.borderWhiteLight,
  },
  enhancedInfoIconContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: theme.colors.bgPrimaryHeavy,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 8,
  },
  enhancedInfoLabel: {
    fontSize: 11,
    color: theme.colors.textSecondary,
    marginBottom: 4,
    fontWeight: "600",
    textAlign: "center",
  },
  enhancedInfoValue: {
    fontSize: 14,
    fontWeight: "700",
    color: theme.colors.textSecondary,
    textAlign: "center",
  },
  smartTimelineContainer: {
    backgroundColor: theme.colors.bgWhiteHeavy,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: theme.colors.borderWhiteLight,
  },
  timelineHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
    gap: 8,
  },
  timelineTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: theme.colors.textSecondary,
  },
  timelineContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  timelineItem: {
    alignItems: "center",
    flex: 1,
  },
  timelineDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: theme.colors.primary,
    marginBottom: 8,
  },
  timelineInfo: {
    alignItems: "center",
  },
  timelineLabel: {
    fontSize: 10,
    color: theme.colors.textSecondary,
    marginBottom: 2,
    textAlign: "center",
  },
  timelineValue: {
    fontSize: 11,
    fontWeight: "600",
    color: theme.colors.textSecondary,
    textAlign: "center",
  },
  timelineConnector: {
    flex: 1,
    height: 2,
    backgroundColor: theme.colors.bgErrorLight,
    marginHorizontal: 8,
  },
});
