import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  Dimensions,
  Animated,
  Platform,
  PanResponder,
  ScrollView,
  ImageBackground,
  Image,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { t } from "@/i18n";
import useGlobalStore from "@/store/global.store";
import { theme } from "@/constants/theme";
import api from "@/app/services/api";
import { LinearGradient } from "expo-linear-gradient";
import { BlurView } from "expo-blur";
import { rgbaColor } from "react-native-reanimated/lib/typescript/Colors";

const { width } = Dimensions.get("window");
const TAB_WIDTH = width / 4;

interface Scheme {
  SCHEMEID: number;
  SCHEMENAME: string;
  DESCRIPTION: string;
  BENEFITS?: string[];
  SCHEMETYPE: string;
  SLOGAN?: string;
  IMAGE?: string;
  ICON?: string;
  DURATION_MONTHS?: number;
  FIXED?: string;
  ACTIVE: string;
  chits: Array<{
    CHITID: number;
    AMOUNT: string;
    NOINS?: number;
    TOTALMEMBERS?: number;
    PAYMENT_FREQUENCY?: string;
    ACTIVE?: string;
    REGNO?: string;
    PAYMENT_FREQUENCY_ID?: string;
  }>;
  branch?: Array<{
    branchId: number;
    branchName: string;
    branchAddress: string;
    branchCity: string;
    branchState: string;
    branchPhone: string;
  }>;
  relevantChits?: Array<{
    CHITID: number;
    AMOUNT: number;
  }>;
}

// Default scheme category if not specified
const DEFAULT_SCHEME_TYPE = "Monthly";

export default function SchemeList() {
  // Changed default tab to Flexi since we're reversing the order
  const [activeTab, setActiveTab] = useState<"Daily" | "Weekly" | "Monthly" | "Flexi">("Monthly");
  const [schemes, setSchemes] = useState<Scheme[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const { language } = useGlobalStore();
  const underlineAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(0)).current;
  const [tabLayouts, setTabLayouts] = useState<{ [key: string]: { x: number, width: number } }>({});
  // Reversed the order of tabs
  const tabs: ("Daily" | "Weekly" | "Monthly" | "Flexi")[] = ["Monthly", "Weekly", "Daily", "Flexi"];

  const flatListRef = useRef<FlatList>(null);
  const scrollViewRef = useRef<ScrollView>(null);
  const currentTabIndex = tabs.indexOf(activeTab);
  const [allSchemes, setAllSchemes] = useState<Scheme[]>([]);
  const [expandedCard, setExpandedCard] = useState<number | null>(null);

  // Fetch all schemes only once on mount
  useEffect(() => {
    const fetchAllSchemes = async () => {
      setLoading(true);
      try {
        const response = await api.get(`/schemes`);
        setAllSchemes(response.data?.data || []);
      } catch (error) {
        console.error("Error fetching schemes:", error);
        Alert.alert("Error", "Failed to fetch schemes. Please try again later.");
      } finally {
        setLoading(false);
      }
    };
    fetchAllSchemes();
  }, []);

  // Filter schemes locally when activeTab or allSchemes changes
  useEffect(() => {
    if (!allSchemes.length) return;
    setLoading(true);
    // Create buckets for each frequency
    const buckets: { [key: string]: any[] } = {
      daily: [],
      weekly: [],
      monthly: [],
      flexi: []
    };
    // Process all schemes and their chits
    allSchemes.forEach((scheme: Scheme) => {
      console.log(scheme);
      if (scheme.ACTIVE !== 'Y') return;
      scheme?.chits.forEach(chit => {
        console.log(chit);
        const frequency = (chit.PAYMENT_FREQUENCY || '').toLowerCase();
        if (frequency in buckets) {
          buckets[frequency].push({
            SCHEMEID: scheme.SCHEMEID,
            SCHEMENAME: scheme.SCHEMENAME,
            CHITID: chit.CHITID,
            AMOUNT: chit.AMOUNT,
            NOINS: chit.NOINS,
            TOTALMEMBERS: chit.TOTALMEMBERS,
            REGNO: chit.REGNO,
            PAYMENT_FREQUENCY: chit.PAYMENT_FREQUENCY,
            PAYMENT_FREQUENCY_ID: chit.PAYMENT_FREQUENCY_ID
          });
        }
      });
    });
    const activeTabLower = activeTab.toLowerCase();
    const filteredSchemes = buckets[activeTabLower].map(item => ({
      SCHEMEID: item.SCHEMEID,
      SCHEMENAME: item.SCHEMENAME,
      DESCRIPTION: "Save gold with our flexible plan.",
      BENEFITS: [
        "Competitive rates",
        "Flexible payments",
        "Zero making charges",
        "Free locker facility"
      ],
      SCHEMETYPE: activeTabLower === 'flexi' ? 'Flexi' : 'Fixed',
      ACTIVE: 'Y',
      chits: [{
        CHITID: item.CHITID,
        AMOUNT: item.AMOUNT,
        NOINS: item.NOINS,
        TOTALMEMBERS: item.TOTALMEMBERS,
        REGNO: item.REGNO,
        PAYMENT_FREQUENCY: item.PAYMENT_FREQUENCY
      }],
      relevantChits: [{
        CHITID: item.CHITID,
        AMOUNT: parseFloat(item.AMOUNT)
      }]
    }));
    setSchemes(filteredSchemes);
    setLoading(false);
  }, [activeTab, allSchemes]);

  useEffect(() => {
    // Animate the slide transition when active tab changes
    Animated.timing(slideAnim, {
      toValue: currentTabIndex * -width,
      duration: 300,
      useNativeDriver: true,
    }).start();
  }, [currentTabIndex]);

  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, gestureState) => {
        return Math.abs(gestureState.dx) > 20;
      },
      onPanResponderRelease: (_, gestureState) => {
        const currentIndex = tabs.indexOf(activeTab);

        // Swipe right to left (next tab)
        if (gestureState.dx < -50 && currentIndex < tabs.length - 1) {
          handleTabPress(tabs[currentIndex + 1]);
        }
        // Swipe left to right (previous tab)
        else if (gestureState.dx > 50 && currentIndex > 0) {
          handleTabPress(tabs[currentIndex - 1]);
        }
      },
    })
  ).current;

  const handleJoinScheme = (item: Scheme) => {
    console.log(item);
    router.push({
      pathname: "/home/join_savings",
      params: {
        schemeId: item.SCHEMEID,
        schemeData: JSON.stringify({
          name: item.SCHEMENAME,
          description: item.DESCRIPTION,
          type: item.SCHEMETYPE,
          chits: item.chits.filter(chit => chit.PAYMENT_FREQUENCY === activeTab) || [],
          schemeType: item.SCHEMETYPE.toLowerCase() === 'flexi' ? 'flexi' : 'fixed'
        }),
      },
    });
  };

  const handleTabPress = (title: "Daily" | "Weekly" | "Monthly" | "Flexi") => {
    setActiveTab(title);
    if (tabLayouts[title]) {
      Animated.spring(underlineAnim, {
        toValue: tabLayouts[title].x,
        useNativeDriver: true,
      }).start();
    }

    // Scroll to the corresponding section
    const newIndex = tabs.indexOf(title);
    if (flatListRef.current) {
      flatListRef.current.scrollToOffset({ offset: 0, animated: true });
    }
  };

  const getTabColor = (title: string) => {
    return '#FFC857';
  };

  const getTabBackground = (title: string): string => {
    return `${theme.colors.primary}15`; // 15% opacity of primary color
  };

  const getCardGradient = (title: string): [string, string, ...string[]] => {
    switch (title) {
      case "Daily": return ["rgba(56,0,0,0.6)", "rgba(56,0,0,0.8)"];
      case "Weekly": return ["rgba(0,48,44,0.6)", "rgba(0,48,44,0.8)"];
      case "Monthly": return ["rgba(44,0,66,0.6)", "rgba(44,0,66,0.8)"];
      case "Flexi": return ["rgba(61,40,0,0.6)", "rgba(61,40,0,0.8)"];
      default: return ["rgba(21,0,44,0.6)", "rgba(21,0,44,0.8)"];
    }
  };

  // Simplified image function - using one image per scheme type
  const getCardImage = (item: Scheme) => {
    // First check if the scheme has its own image
    if (item.IMAGE && item.IMAGE.startsWith('/uploads/')) {
      // This could be a relative path that needs to be prepended with base URL
      // For now, we'll fallback to our local images
      return getDefaultImageByType(item.SCHEMETYPE || DEFAULT_SCHEME_TYPE);
    }

    return getDefaultImageByType(item.SCHEMETYPE || DEFAULT_SCHEME_TYPE);
  };

  const getDefaultImageByType = (type: string) => {
    switch (type) {
      case "Daily": return require("../../../../../assets/images/scheme2.jpg");
      case "Weekly": return require("../../../../../assets/images/scheme2.jpg");
      case "Monthly": return require("../../../../../assets/images/scheme3.jpg");
      case "Flexi": return require("../../../../../assets/images/scheme4.jpg");
      default: return require("../../../../../assets/images/scheme1.jpg");
    }
  };

  const getTabIcon = (title: string) => {
    switch (title) {
      case "Daily": return "today-outline";
      case "Weekly": return "calendar-outline";
      case "Monthly": return "moon-outline";
      case "Flexi": return "options-outline";
      default: return "grid-outline";
    }
  };

  const renderTab = (title: "Daily" | "Weekly" | "Monthly" | "Flexi") => {
    const isActive = activeTab === title;
    const tabColor = getTabColor(title);
    const tabBackground = isActive ? getTabBackground(title) : 'transparent';

    return (
      <View
        key={title}
        onLayout={(e) => {
          const { x, width } = e.nativeEvent.layout;
          setTabLayouts(prev => ({ ...prev, [title]: { x, width } }));
        }}
        style={{ flex: 1 }}
      >
        <TouchableOpacity
          onPress={() => handleTabPress(title)}
          style={[styles.tab, { backgroundColor: tabBackground }]}
          activeOpacity={0.7}
        >
          <Ionicons
            name={getTabIcon(title)}
            size={18}
            color={isActive ? tabColor : "#888"}
            style={styles.tabIcon}
          />
          <Text
            style={[
              styles.tabText,
              isActive && styles.activeTabText,
              isActive && { color: tabColor }
            ]}
          >
            {title}
          </Text>
          {isActive && (
            <View style={[styles.activeTabIndicator, { backgroundColor: tabColor }]} />
          )}
        </TouchableOpacity>
      </View>
    );
  };

  const handleToggleExpand = (schemeId: number) => {
    setExpandedCard(prev => (prev === schemeId ? null : schemeId));
  };

  const renderSchemeItem = ({ item }: { item: Scheme }) => {
    const scaleValue = new Animated.Value(1);
    const tabColor = getTabColor(item.SCHEMETYPE);
    const gradientColors = getCardGradient(item.SCHEMETYPE);
    console.log(item);
    return (
      <Animated.View
        style={[
          styles.schemeCard,
          {
            transform: [
              { scale: scaleValue }
            ],
          }
        ]}
      >
        <View style={styles.cardTouchable}>
          <ImageBackground
            source={getCardImage(item)}
            style={styles.cardBackground}
            imageStyle={styles.backgroundImage}
          >
            <LinearGradient
              colors={gradientColors}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.cardGradient}
            >
              <View style={styles.cardHeader}>
                <View style={styles.headerTopRow}>
                  <View style={styles.schemeNameContainer}>
                    <Text style={[
                      styles.schemeName,
                      item.SCHEMETYPE === 'Flexi' && styles.flexiSchemeName
                    ]}>
                      {item.SCHEMENAME}
                    </Text>
                    {item.SLOGAN && (
                      <Text style={styles.slogan}>{item.SLOGAN}</Text>
                    )}
                  </View>
                  <View style={styles.typePill}>
                    <Text style={[
                      styles.typeText,
                      item.SCHEMETYPE === 'Flexi' && styles.flexiTypeText
                    ]}>
                      {item.SCHEMETYPE}
                    </Text>
                  </View>
                </View>
              </View>
            </LinearGradient>
          </ImageBackground>

          <View style={styles.cardContent}>
            <Text style={styles.schemeDescription}>{item.DESCRIPTION}</Text>

            <View style={styles.divider} />

            <View style={styles.benefitsHeaderRow}>
              <Text style={styles.benefitsTitle}>Key Benefits</Text>
              <TouchableOpacity onPress={() => handleToggleExpand(item.SCHEMEID)}>
                <Ionicons
                  name={expandedCard === item.SCHEMEID ? "chevron-up" : "chevron-down"}
                  size={20}
                  color="#888"
                />
              </TouchableOpacity>
            </View>
            {expandedCard === item.SCHEMEID && (
              <View style={styles.benefitsContainer}>
                {item.BENEFITS?.map((benefit, index) => (
                  <View style={styles.benefitItem} key={`benefit-${item.SCHEMEID}-${index}`}>
                    <View style={[styles.checkmarkCircle, { backgroundColor: tabColor }]}>
                      <Ionicons name="checkmark" size={12} color="#fff" />
                    </View>
                    <Text style={styles.benefitText}>{benefit}</Text>
                  </View>
                ))}
              </View>
            )}

            <View style={styles.amountContainer}>
              <Text style={styles.amountLabel}>Available Plans:</Text>
              <View style={styles.amountChipsContainer}>
                <Text style={[styles.amountChipText, { color: '#850111' }]}>
                  ₹100 to ₹10,000
                </Text>
              </View>
            </View>

            <TouchableOpacity
              onPress={() => handleJoinScheme(item)}
              activeOpacity={0.7}
            >
              <LinearGradient
                colors={['#850111', '#850111']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.joinButton}
              >
                <Text style={styles.joinButtonText}>Join Now</Text>
                <Ionicons name="arrow-forward" size={18} color="#fff" />
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </View>
      </Animated.View>
    );
  };

  const TabSlider = () => (
    <View style={styles.tabSliderContainer}>
      <View style={styles.tabSliderTrack}>
        {tabs.map((tab) => (
          <View
            key={`slider-${tab}`}
            style={[
              styles.tabSliderDot,
              activeTab === tab && { backgroundColor: getTabColor(tab) }
            ]}
          />
        ))}
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container} {...panResponder.panHandlers}>
      <View style={styles.mainBackground}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color={getTabColor(activeTab)} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: getTabColor(activeTab) }]}>
            {t("goldSchemes")}
          </Text>
          <TabSlider />
        </View>

        <View style={styles.tabsContainer}>
          {tabs.map((tab) => renderTab(tab))}
        </View>

        <View style={styles.contentContainer}>
          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={getTabColor(activeTab)} />
              <Text style={[styles.loadingText, { color: getTabColor(activeTab) }]}>
                Loading {activeTab} Schemes...
              </Text>
            </View>
          ) : (
            <FlatList
              ref={flatListRef}
              data={schemes}
              renderItem={renderSchemeItem}
              keyExtractor={item => item.SCHEMEID.toString()}
              contentContainerStyle={styles.listContainer}
              showsVerticalScrollIndicator={false}
              ListEmptyComponent={
                <View style={styles.emptyContainer}>
                  <Ionicons name="sad-outline" size={40} color="#777" />
                  <Text style={styles.emptyMessage}>No schemes available for this category</Text>
                </View>
              }
            />
          )}
        </View>

        <View style={styles.floatingHint}>
          <Ionicons name="swap-horizontal" size={16} color="#fff" />
          <Text style={styles.floatingHintText}>Swipe to switch plans</Text>
        </View>
      </View>
    </SafeAreaView>
  );
}

// Mock data for testing
const mockSchemes: Scheme[] = [
  {
    SCHEMEID: 1,
    SCHEMENAME: "Daily Gold Saver",
    DESCRIPTION: "Save a small amount daily to accumulate gold over time with guaranteed returns.",
    BENEFITS: [
      "Low daily commitment",
      "Regular savings habit",
      "No lock-in period",
      "Zero making charges"
    ],
    SCHEMETYPE: "Fixed",
    ACTIVE: "Y",
    chits: [
      { CHITID: 101, AMOUNT: "500.00", PAYMENT_FREQUENCY: "Daily" },
      { CHITID: 102, AMOUNT: "1000.00", PAYMENT_FREQUENCY: "Daily" }
    ],
    relevantChits: [
      { CHITID: 101, AMOUNT: 500.00 },
      { CHITID: 102, AMOUNT: 1000.00 }
    ]
  },
  {
    SCHEMEID: 2,
    SCHEMENAME: "Weekly Gold Builder",
    DESCRIPTION: "Weekly contribution plan for systematic gold investment with bonus at maturity.",
    BENEFITS: [
      "Higher weekly returns",
      "Flexible withdrawal options",
      "24K purity guaranteed",
      "Free gold certification"
    ],
    SCHEMETYPE: "Fixed",
    ACTIVE: "Y",
    chits: [
      { CHITID: 201, AMOUNT: "2000.00", PAYMENT_FREQUENCY: "Weekly" },
      { CHITID: 202, AMOUNT: "3000.00", PAYMENT_FREQUENCY: "Weekly" }
    ],
    relevantChits: [
      { CHITID: 201, AMOUNT: 2000.00 },
      { CHITID: 202, AMOUNT: 3000.00 }
    ]
  },
  {
    SCHEMEID: 3,
    SCHEMENAME: "Gold Plus Monthly",
    DESCRIPTION: "Premium monthly gold savings with additional benefits and higher returns.",
    BENEFITS: [
      "Premium returns",
      "Lower making charges",
      "Free gold certificate",
      "Priority customer service"
    ],
    SCHEMETYPE: "Fixed",
    ACTIVE: "Y",
    chits: [
      { CHITID: 301, AMOUNT: "5000.00", PAYMENT_FREQUENCY: "Monthly" },
      { CHITID: 302, AMOUNT: "10000.00", PAYMENT_FREQUENCY: "Monthly" }
    ],
    relevantChits: [
      { CHITID: 301, AMOUNT: 5000.00 },
      { CHITID: 302, AMOUNT: 10000.00 }
    ]
  },
  {
    SCHEMEID: 4,
    SCHEMENAME: "Flexi Gold Saver",
    DESCRIPTION: "Save gold whenever you want with our flexible plan with zero penalties.",
    BENEFITS: [
      "No fixed schedule",
      "Save as per convenience",
      "Competitive rates",
      "Free locker facility"
    ],
    SCHEMETYPE: "Flexi",
    ACTIVE: "Y",
    chits: [
      { CHITID: 401, AMOUNT: "1500.00", PAYMENT_FREQUENCY: "Flexi" },
      { CHITID: 402, AMOUNT: "3500.00", PAYMENT_FREQUENCY: "Flexi" }
    ],
    relevantChits: [
      { CHITID: 401, AMOUNT: 1500.00 },
      { CHITID: 402, AMOUNT: 3500.00 }
    ]
  }
];

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  mainBackground: {
    flex: 1,
    width: '100%',
    height: '100%',
    backgroundColor: theme.colors.background,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    backgroundColor: theme.colors.primary,
    borderBottomWidth: 1,
    borderBottomColor: `${theme.colors.border}15`,
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: "700",
    marginLeft: 16,
    flex: 1,
    color: "#FFC857",
  },
  tabsContainer: {
    flexDirection: "row",
    backgroundColor: theme.colors.primary,
    position: "relative",
    paddingTop: 8,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: `${theme.colors.border}15`,
  },
  tab: {
    paddingVertical: 12,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 12,
    marginHorizontal: 4,
    flexDirection: "row",
    position: "relative",
    backgroundColor: "rgba(0,0,0,0.8)",
  },
  tabIcon: {
    marginRight: 6,
    color: "#FFC857",
  },
  tabText: {
    fontSize: 14,
    fontWeight: "600",
    color: "rgba(255, 255, 255, 0.7)",
    textTransform: "capitalize",
  },
  activeTabText: {
    fontWeight: "700",
    color: "#FFC857",
  },
  activeTabIndicator: {
    position: "absolute",
    bottom: -8,
    height: 4,
    width: 30,
    borderRadius: 2,
    alignSelf: "center",
    backgroundColor: "#FFC857",
  },
  contentContainer: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 16,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 15,
    fontWeight: "500",
    color: theme.colors.textPrimary,
  },
  listContainer: {
    padding: 16,
    paddingBottom: 100,
  },
  schemeCard: {
    borderRadius: 16,
    marginBottom: 24,
    marginHorizontal: 2,
    ...Platform.select({
      ios: {
        shadowColor: theme.colors.primary,
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.3,
        shadowRadius: 12,
      },
      android: {
        elevation: 12,
        overflow: 'hidden',
      },
    }),
    backgroundColor: theme.colors.background,
    borderWidth: 1,
    borderColor: `${theme.colors.border}15`,
  },
  cardTouchable: {
    borderRadius: 16,
    overflow: 'hidden',
  },
  cardBackground: {
    width: '100%',
    height: 100,
  },
  backgroundImage: {
    opacity: 0.85,
  },
  cardGradient: {
    flex: 1,
    padding: 10,
    justifyContent: "flex-start",
    paddingBottom: 12,
  },
  cardHeader: {
    flexDirection: "column",
    position: "relative",
    padding: 0,
    margin: 0,
  },
  headerTopRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 0,
  },
  schemeNameContainer: {
    flex: 1,
    paddingRight: 70,
  },
  cardContent: {
    backgroundColor: theme.colors.background,
    padding: 16,
  },
  schemeName: {
    fontSize: 16,
    fontWeight: "700",
    color: "#fff",
    marginBottom: 2,
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  flexiSchemeName: {
    fontSize: 9,
    letterSpacing: 0.3,
    fontWeight: "600",
    textTransform: 'uppercase',
  },
  slogan: {
    fontSize: 11,
    fontStyle: 'italic',
    color: "rgba(255,255,255,0.8)",
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  typePill: {
    position: 'absolute',
    top: -4,
    right: -4,
    paddingVertical: 3,
    paddingHorizontal: 10,
    borderRadius: 16,
    backgroundColor: `${theme.colors.primary}30`,
    borderWidth: 1,
    borderColor: `${theme.colors.primary}30`,
    zIndex: 1,
  },
  typeText: {
    fontSize: 11,
    fontWeight: "600",
    color: "#850111",
    textTransform: 'capitalize',
  },
  flexiTypeText: {
    fontSize: 14,
    fontWeight: "700",
  },
  schemeDescription: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    lineHeight: 22,
    marginBottom: 16,
  },
  divider: {
    height: 1,
    backgroundColor: `${theme.colors.border}15`,
    marginVertical: 16,
  },
  benefitsHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  benefitsTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#850111",
  },
  benefitsContainer: {
    marginBottom: 16,
  },
  benefitItem: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
  },
  checkmarkCircle: {
    width: 18,
    height: 18,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.primary,
  },
  benefitText: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    marginLeft: 10,
    flex: 1,
  },
  amountContainer: {
    marginBottom: 20,
  },
  amountLabel: {
    fontSize: 15,
    fontWeight: "600",
    color: "#850111",
    marginBottom: 10,
  },
  amountChipsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  amountChip: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  amountChipText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#850111",
  },
  joinButton: {
    padding: 16,
    borderRadius: 12,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 8,
  },
  joinButtonText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 16,
  },
  emptyContainer: {
    alignItems: "center",
    justifyContent: "center",
    padding: 40,
    gap: 16,
  },
  emptyMessage: {
    textAlign: "center",
    color: theme.colors.textSecondary,
    fontSize: 16,
    lineHeight: 24,
  },
  tabSliderContainer: {
    marginLeft: 'auto',
    paddingRight: 8,
  },
  tabSliderTrack: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 10,
    padding: 3,
    position: 'relative',
  },
  tabSliderDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255,255,255,0.3)',
    marginHorizontal: 3,
  },
  floatingHint: {
    position: 'absolute',
    bottom: 20,
    alignSelf: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    paddingVertical: 6,
    paddingHorizontal: 16,
    borderRadius: 20,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  floatingHintText: {
    color: theme.colors.textPrimary,
    fontSize: 12,
  }
});