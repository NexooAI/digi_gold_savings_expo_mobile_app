import React, { useMemo, useState, useCallback, useEffect, useRef } from "react";
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
};

export default function SavingsScreen() {
  const router = useRouter();
  const { language, user } = useGlobalStore();

  useEffect(() => {
    if (!user) {
      router.replace("/(auth)/login");
    }
  }, [user, router]);

  if (!user) {
    return (
      <SafeAreaView className="flex-1 justify-center items-center bg-white">
        <ActivityIndicator size="large" color="#7b0006" />
      </SafeAreaView>
    );
  }

  const [savings, setSavings] = useState<Scheme[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const { bottom } = useSafeAreaInsets();
  const { height } = useWindowDimensions();
  // Increased bottomPadding multiplier from 0.1 to 0.2
  const bottomPadding = height * 0.1 + bottom;
  // Fetch user investment data
  const fetchUserData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.get(`investments/user_investments/${user.id}`);
      const investments = response.data.data || [];
      // Transform each investment into your Scheme structure
      const transformedSavings: Scheme[] = investments.map((item: any) => {
        const schemeObj = item.scheme || {};
        const chit = item.chits || {};
        // Parse dates
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

        return {
          id: item.investmentId,
          // Prefer scheme name from scheme object if available
          schemeName:
            schemeObj.schemeName || item.schemeName || "Unknown Scheme",
          // New fields: metalType and savingType (default to gold & weight if missing)
          metalType: schemeObj.type ? schemeObj.type.toLowerCase() : "gold",
          savingType: schemeObj.schemeType
            ? schemeObj.schemeType.toLowerCase()
            : "weight",
          status: item.status,
          totalPaid: parseFloat(item.total_paid) || 0,
          // Replace with item.monthsPaid if available; here using item.lastInstallment for demo
          monthsPaid: item.lastInstallment || 0,
          emiAmount: parseFloat(chit.amount) || 0,
          maturityDate: dom,
          goldWeight: parseFloat(item.totalgoldweight) || 0,
          accountHolder: item.accountName || "",
          accNo: item.accountNo || "",
          joiningDate: doj,
          schemeCode: schemeObj.schemeId ? schemeObj.schemeId.toString() : "",
          noOfIns: chit.noOfInstallments,
          schemesData: schemeObj,
          chitData: chit,
          transactions: [],
        };
      });
      setSavings(transformedSavings);
    } catch (err: any) {
      console.error("Error fetching data:", err.message);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [user.id]);

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

  // Enhanced Scheme Card Component
  const EnhancedSchemeCard = ({ item }: { item: Scheme }) => {
    const bgColors: readonly [string, string, string] = item.metalType === "gold" 
      ? ["rgba(221, 204, 113, 0.85)", "rgba(255, 201, 12, 0.85)", "rgba(119, 125, 13, 0.78)"] as const
      : ["rgba(192, 192, 192, 0.85)", "rgba(168, 168, 168, 0.85)", "rgba(128, 128, 128, 0.85)"] as const;

    const [isExpanded, setIsExpanded] = useState(false);
    const animatedHeight = useRef(new Animated.Value(0)).current;
    const [isActive, setIsActive] = useState(false);

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
      if (!item) return;
      router.push({
        pathname: "/savings/savingsDetail",
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
          schemesData: item.schemesData || {},
          transactions: JSON.stringify(item.transactions || []),
        },
      });
    };

    return (
      <TouchableOpacity 
        activeOpacity={0.9}
        onPress={toggleExpand}
        style={[
          styles.cardWrapper,
          isActive && styles.cardWrapperActive
        ]}
      >
        <ImageBackground
          source={item.metalType === "gold" 
            ? require('../../../../../assets/images/gold.png')
            : require('../../../../../assets/images/silver.png')
          }
          style={styles.cardBackgroundImage}
          imageStyle={styles.cardBackgroundImageStyle}
          resizeMode="cover"
        >
          <LinearGradient
            colors={bgColors}
            style={styles.cardContainer}
          >
            <View style={styles.cardHeader}>
              <View style={styles.schemeInfo}>
                <View style={styles.schemeIconContainer}>
                  <Ionicons 
                    name={item.metalType === "gold" ? "diamond-outline" : "cube-outline"} 
                    size={24} 
                    color={item.metalType === "gold" ? "#B8860B" : "#708090"} 
                  />
                </View>
                <View style={styles.schemeTitleContainer}>
                  <Text style={styles.schemeTitle}>{item.schemeName}</Text>
                  <Text style={styles.schemeSubtitle}>
                    {item.metalType.toUpperCase()} • {item.savingType === "weight" ? "Weight" : "Amount"}
                  </Text>
                </View>
              </View>
              <View style={styles.headerRight}>
                <View style={styles.statusBadge}>
                  <Text style={styles.statusText}>{item.status || "ACTIVE"}</Text>
                </View>
                <Animated.View style={[
                  styles.expandIcon,
                  { transform: [{ rotate: animatedHeight.interpolate({
                    inputRange: [0, 1],
                    outputRange: ['0deg', '180deg']
                  })}] }
                ]}>
                  <Ionicons name="chevron-down" size={20} color="#B8860B" />
                </Animated.View>
              </View>
            </View>

            <View style={styles.accountInfo}>
              <View style={styles.accountItem}>
                <Ionicons name="person-outline" size={16} color="#B8860B" />
                <Text style={styles.accountLabel}>Account Holder:</Text>
                <Text style={styles.accountValue}>{item.accountHolder}</Text>
              </View>
              <View style={styles.accountItem}>
                <Ionicons name="card-outline" size={16} color="#B8860B" />
                <Text style={styles.accountLabel}>A/C No:</Text>
                <Text style={styles.accountValue}>{item.accNo}</Text>
              </View>
            </View>

            <Animated.View style={[
              styles.cardContent,
              { maxHeight: animatedHeight.interpolate({
                inputRange: [0, 1],
                outputRange: [0, 500]
              })}
            ]}>
              <View style={styles.infoGrid}>
                <View style={styles.infoItem}>
                  <Text style={styles.infoLabel}>Amount Paid</Text>
                  <Text style={styles.infoValue}>₹{item.totalPaid.toLocaleString()}</Text>
                </View>
                <View style={styles.infoItem}>
                  <Text style={styles.infoLabel}>Months Paid</Text>
                  <Text style={styles.infoValue}>{item.monthsPaid} / {item.noOfIns}</Text>
                </View>
                <View style={styles.infoItem}>
                  <Text style={styles.infoLabel}>Installment</Text>
                  <Text style={styles.infoValue}>₹{item.emiAmount}</Text>
                </View>
                <View style={styles.infoItem}>
                  <Text style={styles.infoLabel}>Total Weight</Text>
                  <Text style={styles.infoValue}>{item.goldWeight.toFixed(2)} g</Text>
                </View>
              </View>

              <View style={styles.dateContainer}>
                <View style={styles.dateSection}>
                  <View style={styles.dateIconContainer}>
                    <Ionicons name="calendar-outline" size={20} color="#850111" />
                  </View>
                  <View style={styles.dateInfo}>
                    <Text style={styles.dateLabel}>Date of Joining</Text>
                    <Text style={styles.dateValue}>{item.joiningDate}</Text>
                  </View>
                </View>
                <View style={styles.dateDivider} />
                <View style={styles.dateSection}>
                  <View style={styles.dateIconContainer}>
                    <Ionicons name="time-outline" size={20} color="#850111" />
                  </View>
                  <View style={styles.dateInfo}>
                    <Text style={styles.dateLabel}>Maturity Date</Text>
                    <Text style={styles.dateValue}>{item.maturityDate}</Text>
                  </View>
                </View>
              </View>

              <View style={styles.progressContainer}>
                <View style={styles.progressHeader}>
                  <Text style={styles.progressLabel}>Installment Progress</Text>
                  <View style={styles.progressStats}>
                    <Text style={styles.progressValue}>{progressPercentage}%</Text>
                    <Text style={styles.progressMonths}>
                      {item.monthsPaid}/{item.noOfIns} months
                    </Text>
                  </View>
                </View>
                <View style={styles.progressBar}>
                  <Animated.View 
                    style={[
                      styles.progressFill,
                      { width: animatedHeight.interpolate({
                        inputRange: [0, 1],
                        outputRange: ['0%', `${progressPercentage}%`]
                      })}
                    ]} 
                  />
                </View>
                <View style={styles.monthsInfo}>
                  <View style={styles.monthItem}>
                    <View style={[styles.monthDot, { backgroundColor: '#850111' }]} />
                    <Text style={styles.monthLabel}>Paid</Text>
                    <Text style={styles.monthValue}>{item.monthsPaid}</Text>
                  </View>
                  <View style={styles.monthItem}>
                    <View style={[styles.monthDot, { backgroundColor: '#DAA520' }]} />
                    <Text style={styles.monthLabel}>Pending</Text>
                    <Text style={styles.monthValue}>{Number(item.noOfIns) - Number(item.monthsPaid)}</Text>
                  </View>
                  <View style={styles.monthItem}>
                    <View style={[styles.monthDot, { backgroundColor: '#B8860B' }]} />
                    <Text style={styles.monthLabel}>Total</Text>
                    <Text style={styles.monthValue}>{item.noOfIns}</Text>
                  </View>
                </View>
              </View>

              <TouchableOpacity
                style={styles.detailsButton}
                onPress={() => handleNavigation(item)}
              >
                <Text style={styles.detailsButtonText}>View Details</Text>
                <Ionicons name="chevron-forward" size={20} color="#fff" />
              </TouchableOpacity>
            </Animated.View>
          </LinearGradient>
        </ImageBackground>
      </TouchableOpacity>
    );
  };

  const ListHeader = () => (
    <View style={styles.headerContainer}>
      <LinearGradient
        colors={['#850111', '#5a000b', '#2e0406']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.portfolioCard}
      >
        <View style={styles.portfolioHeader}>
          <View style={styles.portfolioTitleContainer}>
            <Text style={styles.portfolioTitle}>
              {translations.yourGoldPortfolio}
            </Text>
            <View style={styles.portfolioBadge}>
              <Ionicons name="star" size={10} color="#fff" />
              <Text style={styles.portfolioBadgeText}>Premium</Text>
            </View>
          </View>
          <View style={styles.portfolioIconContainer}>
            <Ionicons name="medal" size={24} color="#fff" />
          </View>
        </View>

        <View style={styles.portfolioStats}>
          <View style={styles.statItem}>
            <View style={styles.statIconContainer}>
              <Ionicons name="wallet-outline" size={18} color="#fff" />
            </View>
            <View style={styles.statInfo}>
              <Text style={styles.statLabel}>{translations.totalInvested}</Text>
              <Text style={styles.statValue}>₹{totalInvested.toLocaleString()}</Text>
            </View>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <View style={styles.statIconContainer}>
              <Ionicons name="diamond-outline" size={18} color="#fff" />
            </View>
            <View style={styles.statInfo}>
              <Text style={styles.statLabel}>{translations.gold}</Text>
              <Text style={styles.statValue}>{totalGold.toFixed(2)} g</Text>
            </View>
          </View>
        </View>

        <View style={styles.portfolioFooter}>
          <View style={styles.footerItem}>
            <Ionicons name="trending-up" size={12} color="#fff" />
            <Text style={styles.footerText}>Growing Portfolio</Text>
          </View>
          <View style={styles.footerItem}>
            <Ionicons name="shield-checkmark" size={12} color="#fff" />
            <Text style={styles.footerText}>Secure Investment</Text>
          </View>
        </View>
      </LinearGradient>
      <Text style={styles.sectionTitle}>
        {translations.activeSavingsPlans}
      </Text>
    </View>
  );

  const EmptyState = () => (
    <View style={styles.emptyStateContainer}>
      <LinearGradient
        colors={['rgba(133, 1, 17, 0.1)', 'rgba(90, 0, 11, 0.1)', 'rgba(46, 4, 6, 0.1)']}
        style={styles.emptyStateCard}
      >
        <View style={styles.emptyStateIconContainer}>
          <Ionicons name="trending-up" size={40} color="#850111" />
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
          onPress={() => router.push('/(tabs)/home/schemes')}
        >
          <Ionicons name="add-circle-outline" size={20} color="#fff" />
          <Text style={styles.emptyStateButtonText}>Start New Savings</Text>
        </TouchableOpacity>
      </LinearGradient>
    </View>
  );

  if (loading) {
    return (
      <SafeAreaView className="flex-1 justify-center items-center bg-white">
        <ActivityIndicator size="large" color="#7b0006" />
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView className="flex-1 justify-center items-center bg-white">
        <Text className="text-red-500">Error: {error}</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1">
      <ImageBackground
        source={theme.image.bg_image}
        className="flex-1"
        resizeMode="cover"
      >
        <LinearGradient
          colors={['rgba(0,0,0,0.6)', 'rgba(0,0,0,0.8)']}
          style={StyleSheet.absoluteFillObject}
        />
        
        <View className="absolute top-0 left-0 right-0 z-10 px-4">
          <AppHeader showBackButton={false} backRoute="index" />
        </View>

        <FlatList
          data={savings}
          keyExtractor={(item, index) =>
            item.id && item.id !== "" ? item.id : index.toString()
          }
          renderItem={({ item }) => <EnhancedSchemeCard item={item} />}
          ListHeaderComponent={savings.length > 0 ? <ListHeader /> : null}
          ListEmptyComponent={<EmptyState />}
          contentContainerStyle={{
            paddingTop: 100,
            paddingHorizontal: 16,
            paddingBottom: bottomPadding,
          }}
          showsVerticalScrollIndicator={false}
        />
      </ImageBackground>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  headerContainer: {
    paddingBottom: 16,
  },
  portfolioCard: {
    borderRadius: 16,
    padding: 14,
    marginBottom: 14,
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.12,
        shadowRadius: 6,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  portfolioHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  portfolioTitleContainer: {
    flex: 1,
  },
  portfolioTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 4,
    textShadowColor: 'rgba(0, 0, 0, 0.2)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
    letterSpacing: 0.5,
  },
  portfolioBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
    alignSelf: 'flex-start',
  },
  portfolioBadgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '600',
    marginLeft: 3,
    letterSpacing: 0.5,
  },
  portfolioIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  portfolioStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
  },
  statItem: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  statIconContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  statInfo: {
    flex: 1,
  },
  statLabel: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.9)',
    marginBottom: 3,
    fontWeight: '500',
    letterSpacing: 0.3,
  },
  statValue: {
    fontSize: 15,
    fontWeight: '700',
    color: '#fff',
    letterSpacing: 0.5,
  },
  statDivider: {
    width: 1,
    height: 32,
    backgroundColor: 'rgba(255,255,255,0.2)',
    marginHorizontal: 12,
  },
  portfolioFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.2)',
    paddingTop: 10,
  },
  footerItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  footerText: {
    color: 'rgba(255,255,255,0.9)',
    fontSize: 11,
    fontWeight: '600',
    marginLeft: 4,
    letterSpacing: 0.3,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#FFD700',
    textAlign: 'center',
    marginBottom: 16,
    textShadowColor: 'rgba(0,0,0,0.3)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  cardWrapper: {
    marginBottom: 12,
    borderRadius: 20,
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
  cardWrapperActive: {
    ...Platform.select({
      ios: {
        shadowColor: theme.colors.primary,
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.2,
        shadowRadius: 12,
      },
      android: {
        elevation: 8,
      },
    }),
  },
  cardBackgroundImage: {
    flex: 1,
    borderRadius: 20,
    overflow: 'hidden',
  },
  cardBackgroundImageStyle: {
    borderRadius: 20,
    opacity: 0.6,
  },
  cardContainer: {
    borderRadius: 20,
    padding: 14,
    overflow: 'hidden',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  schemeInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  schemeIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 215, 0, 0.2)',
    borderWidth: 1,
    borderColor: 'rgba(218, 165, 32, 0.4)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  schemeTitleContainer: {
    flex: 1,
  },
  schemeTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#2C1810',
    marginBottom: 3,
  },
  schemeSubtitle: {
    fontSize: 11,
    color: '#8B4513',
  },
  statusBadge: {
    backgroundColor: 'rgba(25, 210, 16, 0.53)',
    borderWidth: 1,
    borderColor: '#DAA520',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#000000',
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  expandIcon: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(255, 215, 0, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardContent: {
    overflow: 'hidden',
  },
  infoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 14,
  },
  infoItem: {
    flex: 1,
    minWidth: '45%',
  },
  infoLabel: {
    fontSize: 11,
    color: '#A0522D',
    marginBottom: 3,
    fontWeight: '500',
  },
  infoValue: {
    fontSize: 14,
    fontWeight: '700',
    color: '#2F1B14',
  },
  dateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 215, 0, 0.15)',
    borderRadius: 12,
    padding: 12,
    marginTop: 14,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: 'rgba(218, 165, 32, 0.3)',
  },
  dateSection: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  dateIconContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(133, 1, 17, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  dateInfo: {
    flex: 1,
  },
  dateLabel: {
    fontSize: 10,
    color: '#A0522D',
    marginBottom: 3,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    fontWeight: '600',
  },
  dateValue: {
    fontSize: 13,
    fontWeight: '700',
    color: '#2F1B14',
  },
  dateDivider: {
    width: 1,
    height: 32,
    backgroundColor: 'rgba(218, 165, 32, 0.4)',
    marginHorizontal: 12,
  },
  detailsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#850111',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 14,
    elevation: 3,
    shadowColor: '#850111',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  detailsButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#fff',
    marginRight: 6,
  },
  progressContainer: {
    marginTop: 14,
    marginBottom: 14,
    backgroundColor: 'rgba(255, 215, 0, 0.1)',
    borderRadius: 10,
    padding: 12,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  progressLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#2F1B14',
  },
  progressStats: {
    alignItems: 'flex-end',
  },
  progressValue: {
    fontSize: 14,
    fontWeight: '800',
    color: '#850111',
  },
  progressMonths: {
    fontSize: 11,
    color: '#A0522D',
    marginTop: 1,
    fontWeight: '500',
  },
  progressBar: {
    height: 8,
    backgroundColor: 'rgba(218, 165, 32, 0.3)',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 10,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#850111',
    borderRadius: 4,
  },
  monthsInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 6,
  },
  monthItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  monthDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  monthLabel: {
    fontSize: 10,
    color: '#A0522D',
    fontWeight: '500',
  },
  monthValue: {
    fontSize: 11,
    fontWeight: '700',
    color: '#2F1B14',
    marginLeft: 3,
  },
  accountInfo: {
    backgroundColor: 'rgba(255, 215, 0, 0.15)',
    borderRadius: 10,
    padding: 10,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(218, 165, 32, 0.3)',
  },
  accountItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  accountLabel: {
    fontSize: 11,
    color: '#A0522D',
    marginLeft: 6,
    marginRight: 4,
    fontWeight: '500',
  },
  accountValue: {
    fontSize: 12,
    fontWeight: '700',
    color: '#2F1B14',
    flex: 1,
  },
  emptyStateContainer: {
    padding: 16,
    marginTop: 20,
  },
  emptyStateCard: {
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(133, 1, 17, 0.2)',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    ...Platform.select({
      ios: {
        shadowColor: "#850111",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  emptyStateIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(133, 1, 17, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  emptyStateImage: {
    width: 200,
    height: 200,
    marginBottom: 20,
  },
  emptyStateTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: 'white',
    textAlign: 'center',
    marginBottom: 8,
  },
  emptyStateSubtitle: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 20,
  },
  emptyStateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#850111',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 12,
    ...Platform.select({
      ios: {
        shadowColor: "#850111",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.3,
        shadowRadius: 4,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  emptyStateButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
});
