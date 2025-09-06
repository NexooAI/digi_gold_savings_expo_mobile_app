import React, {
  useEffect,
  useMemo,
  useState,
  useRef,
  useCallback,
} from "react";
import {
  View,
  ScrollView,
  Text,
  Alert,
  Dimensions,
  RefreshControl,
  TouchableOpacity,
  ImageBackground,
  StyleSheet,
  Animated,
  FlatList,
  Image,
  StatusBar,
  ActivityIndicator,
  Easing,
  ListRenderItem,
  Linking,
  SafeAreaView,
  Modal,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import LanguageSwitcher from "@/contexts/LanguageSwitcher";
import LiveRateCard from "@/app/components/LiveRateCard";
import ImageSlider from "@/app/components/ImageSlider";
import { t } from "@/i18n";
// AppHeader is now handled by the layout wrapper
import ProductsList from "@/app/components/Products";
import FlashOffer from "@/app/components/FlashOffer";
import YouTubeVideo from "@/app/components/YouTubeVideo";
import SupportContactCard from "@/app/components/SupportContactCard";
import SocialMediaCard from "@/app/components/SocialMediaCard";
import useGlobalStore from "@/store/global.store";
import api from "@/services/api";
import NetInfo from "@react-native-community/netinfo";
import { ScaledSheet, moderateScale } from "react-native-size-matters";
import { theme } from "@/constants/theme";
import AsyncStorage from "@react-native-async-storage/async-storage";
import FlashBanner from "@/app/components/FlashBanner";
import { Ionicons } from "@expo/vector-icons";
import StatusView from "@/app/components/StatusView";
import NotificationService from "@/services/NotificationService";
import { AppLocale } from "@/i18n";
import AuthGuard from "@/components/AuthGuard";
import { getFullImageUrl, formatGoldWeight } from "@/utils/imageUtils";
// Import API logging utilities
import {
  logApiSummary,
  logRecentApiCalls,
  getApiLogs,
  getFailedApiLogs,
  apiLogManager,
  monitorEndpoint,
  checkForContinuousCalls,
} from "@/utils/apiLogger";

// Constants
const { width: screenWidth } = Dimensions.get("window");
const STATUS_IMAGE_SIZE = 70;
const STATUS_BORDER_RADIUS = 35;
const REFRESH_INTERVAL = 15000; // 15 seconds

// Fallback data
const dummyData = {
  rates: {
    gold: {
      price: "7,315",
      purity: "24K",
      image: require("../../../../../assets/images/gold.png"),
    },
    silver: {
      price: "101.00",
      purity: "999",
      image: require("../../../../../assets/images/silver.png"),
    },
  },
  sliderImages: [
    require("../../../../../assets/images/slider1.png"),
    require("../../../../../assets/images/slider2.png"),
    require("../../../../../assets/images/slider3.png"),
  ],
};

const banners: Banner[] = [
  {
    id: 2,
    image: require("../../../../../assets/images/banner.png"),
    schemeUrl: "/(app)/(tabs)/home/schemes",
    schemeType: "flexi",
  },
  {
    id: 3,
    image: require("../../../../../assets/images/banner2.png"),
    schemeUrl: "/(app)/(tabs)/home/schemes",
    schemeType: "monthly",
  },
  {
    id: 4,
    image: require("../../../../../assets/images/slider1.png"),
    schemeUrl: "/(app)/(tabs)/home/schemes",
    schemeType: "weekly",
  },
  {
    id: 5,
    image: require("../../../../../assets/images/slider2.png"),
    schemeUrl: "/(app)/(tabs)/home/schemes",
    schemeType: "daily",
  },
  {
    id: 6,
    image: require("../../../../../assets/images/slider3.png"),
    schemeUrl: "/(app)/(tabs)/home/schemes",
    schemeType: "flexi",
  },
  {
    id: 7,
    image: require("../../../../../assets/images/slider4.png"),
    schemeUrl: "/(app)/(tabs)/home/schemes",
    schemeType: "monthly",
  },
];

// Add default status images
const defaultStatusImages: Collection[] = [
  {
    id: 1,
    name: t("goldCollection"),
    thumbnail: require("../../../../../assets/images/status1.jpg"),
    status_images: [
      require("../../../../../assets/images/status1.jpg"),
      require("../../../../../assets/images/status2.jpg"),
      require("../../../../../assets/images/status3.jpg"),
    ],
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 2,
    name: t("silverCollection"),
    thumbnail: require("../../../../../assets/images/status2.jpg"),
    status_images: [
      require("../../../../../assets/images/status2.jpg"),
      require("../../../../../assets/images/status3.jpg"),
      require("../../../../../assets/images/status4.jpg"),
    ],
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 3,
    name: t("diamondCollection"),
    thumbnail: require("../../../../../assets/images/status3.jpg"),
    status_images: [
      require("../../../../../assets/images/status3.jpg"),
      require("../../../../../assets/images/status4.jpg"),
      require("../../../../../assets/images/status5.jpg"),
    ],
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 4,
    name: t("platinumCollection"),
    thumbnail: require("../../../../../assets/images/status4.jpg"),
    status_images: [
      require("../../../../../assets/images/status4.jpg"),
      require("../../../../../assets/images/status5.jpg"),
      require("../../../../../assets/images/status1.jpg"),
    ],
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 5,
    name: t("exclusiveCollection"),
    thumbnail: require("../../../../../assets/images/status5.jpg"),
    status_images: [
      require("../../../../../assets/images/status5.jpg"),
      require("../../../../../assets/images/status1.jpg"),
      require("../../../../../assets/images/status2.jpg"),
    ],
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
];

// Interfaces
interface HomeApiResponse {
  success: boolean;
  data: {
    currentRates: {
      gold_rate: string;
      silver_rate: string;
      updated_at: string;
    };
    collections: Collection[];
    posters: Poster[];
    flashNews: FlashNews[];
    introScreen: {
      title: string | null;
      image: string | null;
      startDate: string | null;
      endDate: string | null;
    };
    initialPopups: any[];
    investments:
      | {
          error: boolean;
          message: string;
        }
      | {
          data: any[];
        };
    videos: Video[];
  };
}

interface Banner {
  id: number;
  image: any;
  schemeUrl: string;
  schemeType: string;
}

interface Collection {
  id: number;
  name: string;
  thumbnail: string | any;
  status_images: string[] | any[];
  created_at?: string;
  updated_at?: string;
}

interface Poster {
  id: number;
  title: string;
  image: string;
  startDate: string;
  endDate: string;
  status: number;
  createdAt: string;
  updatedAt: string;
}

interface FlashNews {
  id: number;
  title: string;
  status: string;
  startDate: string;
  endDate: string;
}

interface Video {
  id: number;
  title: string;
  url: string | null;
  created_at: string;
}

interface UserInfoCardProps {
  userName: string | undefined;
  activeSchemesCount: number;
  onPress: () => void;
  totalGoldSavings?: number;
  totalAmount?: number;
  showTotalGold?: boolean;
  userId: number;
  profilePhoto?: string;
}

// Components
const UserInfoCard: React.FC<UserInfoCardProps> = React.memo(
  ({
    userName,
    activeSchemesCount,
    onPress,
    userId,
    totalGoldSavings = 0,
    totalAmount = 0,
    showTotalGold = true,
    profilePhoto,
  }) => {
    const arrowOpacity = useRef(new Animated.Value(1)).current;

    useEffect(() => {
      const blink = Animated.loop(
        Animated.sequence([
          Animated.timing(arrowOpacity, {
            toValue: 0.3,
            duration: 800,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(arrowOpacity, {
            toValue: 1,
            duration: 800,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
        ])
      );
      blink.start();
      return () => blink.stop();
    }, [arrowOpacity]);

    return (
      <TouchableOpacity
        style={styles.userInfoCard}
        onPress={onPress}
        activeOpacity={0.8}
      >
        <LinearGradient
          colors={["#850111", "#5a000b"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.userInfoGradient}
        >
          <View style={styles.userInfoTopRow}>
            <View style={styles.welcomeContainer}>
              <Text style={styles.welcomeText}>{t("welcomeBack")}</Text>
              <Text style={styles.userName}>
                {userName?.toUpperCase()}
                <Text style={styles.userIdText}>( {userId} )</Text>
              </Text>
            </View>
            <View style={styles.userAvatarContainer}>
              {profilePhoto ? (
                <Image
                  source={{ uri: profilePhoto }}
                  style={styles.userAvatar}
                  resizeMode="cover"
                />
              ) : (
                <Ionicons name="person-circle" size={45} color="#FFD700" />
              )}
            </View>
          </View>

          <View style={styles.statsRow}>
            <View style={styles.statsContainer}>
              <View style={styles.statItem}>
                <Text style={styles.statLabel}>{t("activeInvestments")}</Text>
                <View style={styles.statValue}>
                  <Text style={styles.countText}>
                    {activeSchemesCount || 0}
                  </Text>
                  <Ionicons name="trending-up" size={16} color="#FFD700" />
                </View>
              </View>
              <View style={styles.statDivider} />
              {showTotalGold && (
                <>
                  <View style={styles.statItem}>
                    <Text style={styles.statLabel}>{t("totalGold")}</Text>
                    <View style={styles.statValue}>
                      <Text style={styles.countText}>
                        {formatGoldWeight(totalGoldSavings).replace(" g", "")}
                      </Text>
                      <Text style={styles.unitText}>g</Text>
                    </View>
                  </View>
                  <View style={styles.statDivider} />
                </>
              )}
              <View style={styles.statItem}>
                <Text style={styles.statLabel}>{t("totalAmount")}</Text>
                <View style={styles.statValue}>
                  <Text style={styles.countText}>
                    ₹{totalAmount.toLocaleString()}
                  </Text>
                </View>
              </View>
            </View>
          </View>

          <View style={styles.viewDetailsContainer}>
            <LinearGradient
              colors={["#FFD700", "#FFA500", "#FF8C00"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.viewDetailsGradient}
            >
              {/* <Ionicons name="eye-outline" size={20} color="#850111" /> */}
              <Text style={styles.viewDetailsText}>
                {t("viewInvestmentDetails")}
              </Text>
              <Animated.View
                style={[styles.doubleArrowContainer, { opacity: arrowOpacity }]}
              >
                <Ionicons name="chevron-forward" size={16} color="#850111" />
                <Ionicons
                  name="chevron-forward"
                  size={16}
                  color="#850111"
                  style={styles.secondArrow}
                />
              </Animated.View>
            </LinearGradient>
          </View>
        </LinearGradient>
      </TouchableOpacity>
    );
  }
);

// AnimatedGoldRate: Decorative gold rate label with theme color, 22KT, live dot, and last updated timestamp
const AnimatedGoldRate: React.FC<{ goldRate: string; updatedAt?: string }> = ({
  goldRate,
  updatedAt,
}) => {
  const scaleAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(scaleAnim, {
          toValue: 1.08,
          duration: 700,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(scaleAnim, {
          toValue: 1,
          duration: 700,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    );
    pulse.start();
    return () => pulse.stop();
  }, [scaleAnim]);

  // Format timestamp
  const formatDateToIndian = (isoString: string | undefined) => {
    if (!isoString) return "-";
    const date = new Date(isoString);
    return date.toLocaleString("en-IN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
  };

  return (
    <View
      style={styles.goldRateLabelContainer}
      accessibilityLabel="Gold Rate Label"
    >
      <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
        <LinearGradient
          colors={["#850111", "#2e0406"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.goldRateLabel}
        >
          <Text style={styles.goldRateTitle}>{t("goldRate")}</Text>
          <View style={styles.goldRateRow}>
            <Ionicons
              name="star"
              size={18}
              color="#FFD700"
              style={{ marginRight: 4 }}
            />
            <Text style={styles.goldRatePrice}>₹{goldRate}/-</Text>
            <Text style={styles.goldRatePurity}>22KT</Text>
            <View style={styles.liveDot} />
          </View>
          {updatedAt && (
            <Text style={styles.goldRateUpdatedAt}>
              Last updated: {formatDateToIndian(updatedAt)}
            </Text>
          )}
        </LinearGradient>
      </Animated.View>
    </View>
  );
};

// BannerCard component for FlatList renderItem
interface BannerCardProps {
  item: Banner;
  router: ReturnType<typeof useRouter>;
  onAboutSchemesPress: (schemeType: string) => void;
}
const BannerCard: React.FC<BannerCardProps> = ({
  item,
  router,
  onAboutSchemesPress,
}) => {
  const joinNowScale = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(joinNowScale, {
          toValue: 1.08,
          duration: 700,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(joinNowScale, {
          toValue: 1,
          duration: 700,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    );
    pulse.start();
    return () => pulse.stop();
  }, [joinNowScale]);

  return (
    <View style={styles.bannerCard}>
      <TouchableOpacity
        style={styles.bannerImageWrapper}
        onPress={() => router.push(item.schemeUrl)}
        activeOpacity={0.9}
      >
        <Image
          source={item.image}
          style={styles.bannerImage}
          resizeMode="cover"
        />
      </TouchableOpacity>
      <View style={styles.bannerButtonRow}>
        <TouchableOpacity
          style={styles.aboutSchemesButton}
          onPress={() => onAboutSchemesPress(item.schemeType)}
          activeOpacity={0.85}
          accessibilityLabel={t("aboutSchemes")}
        >
          <Text style={styles.aboutSchemesButtonText}>{t("aboutSchemes")}</Text>
        </TouchableOpacity>
        <Animated.View
          style={{ flex: 1, transform: [{ scale: joinNowScale }] }}
        >
          <TouchableOpacity
            style={styles.joinNowButton}
            onPress={() => router.push(item.schemeUrl)}
            activeOpacity={0.85}
            accessibilityLabel={t("joinNow") + " - Highlighted"}
            accessibilityHint={
              t("joinNowHint") ||
              "Tap to join the scheme. This button is highlighted for your attention."
            }
          >
            <Text style={styles.joinNowButtonText}>{t("joinNow")}</Text>
          </TouchableOpacity>
        </Animated.View>
      </View>
    </View>
  );
};

export default function Home2() {
  // State
  const { language, user, debugState } = useGlobalStore();

  // Debug: Check global store state on component mount
  useEffect(() => {
    console.log("🔍 Home: Component mounted, checking global store state...");
    debugState();
  }, [debugState]);
  const router = useRouter();
  const [homeData, setHomeData] = useState<HomeApiResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showFlashBanner, setShowFlashBanner] = useState(false);
  const [activeSchemesCount, setActiveSchemesCount] = useState(0);
  const [selectedCollection, setSelectedCollection] =
    useState<Collection | null>(null);
  const [showStatus, setShowStatus] = useState(false);
  const [collectionsData, setCollectionsData] = useState<Collection[]>([]);
  const [totalGoldSavings, setTotalGoldSavings] = useState(0);
  const [totalAmount, setTotalAmount] = useState(0);
  const [flashNews, setFlashNews] = useState<any[]>([]);
  const [sliderImages, setSliderImages] = useState<any[]>([]);
  const [isSliderLoading, setIsSliderLoading] = useState(true);
  const [viewedCollections, setViewedCollections] = useState<{
    [id: number]: boolean;
  }>({});
  const [showTotalGold, setShowTotalGold] = useState(true);
  const [localProfilePhoto, setLocalProfilePhoto] = useState<string | null>(
    null
  );

  // Schemes modal state
  const [schemesModalVisible, setSchemesModalVisible] = useState(false);
  const [selectedSchemeType, setSelectedSchemeType] = useState<string>("");

  // Static schemes data
  const staticSchemesData = {
    flexi: {
      name: "Flexi Gold Saver",
      type: "Flexi",
      description:
        "Save gold whenever you want with our flexible plan. No fixed schedule, save as per your convenience with competitive rates and zero penalties.",
      benefits: [
        "No fixed schedule",
        "Save as per convenience",
        "Competitive rates",
        "Free locker facility",
        "Zero making charges",
        "Flexible withdrawal options",
      ],
      plans: [
        { amount: "₹100", frequency: "Daily" },
        { amount: "₹500", frequency: "Weekly" },
        { amount: "₹1000", frequency: "Monthly" },
        { amount: "₹5000", frequency: "Quarterly" },
      ],
    },
    monthly: {
      name: "Gold Plus Monthly",
      type: "Monthly",
      description:
        "Premium monthly gold savings with additional benefits and higher returns. Perfect for systematic investors looking for regular gold accumulation.",
      benefits: [
        "Premium returns",
        "Lower making charges",
        "Free gold certificate",
        "Priority customer service",
        "Systematic investment",
        "Bonus at maturity",
      ],
      plans: [
        { amount: "₹500", frequency: "Monthly" },
        { amount: "₹1000", frequency: "Monthly" },
        { amount: "₹2000", frequency: "Monthly" },
        { amount: "₹5000", frequency: "Monthly" },
      ],
    },
    weekly: {
      name: "Weekly Gold Builder",
      type: "Weekly",
      description:
        "Weekly contribution plan for systematic gold investment with bonus at maturity. Build your gold portfolio week by week.",
      benefits: [
        "Higher weekly returns",
        "Flexible withdrawal options",
        "24K purity guaranteed",
        "Free gold certification",
        "Weekly compounding",
        "Early maturity benefits",
      ],
      plans: [
        { amount: "₹200", frequency: "Weekly" },
        { amount: "₹500", frequency: "Weekly" },
        { amount: "₹1000", frequency: "Weekly" },
        { amount: "₹2000", frequency: "Weekly" },
      ],
    },
    daily: {
      name: "Daily Gold Saver",
      type: "Daily",
      description:
        "Save a small amount daily to accumulate gold over time with guaranteed returns. Perfect for building a daily savings habit.",
      benefits: [
        "Low daily commitment",
        "Regular savings habit",
        "No lock-in period",
        "Zero making charges",
        "Daily compounding",
        "Guaranteed returns",
      ],
      plans: [
        { amount: "₹50", frequency: "Daily" },
        { amount: "₹100", frequency: "Daily" },
        { amount: "₹200", frequency: "Daily" },
        { amount: "₹500", frequency: "Daily" },
      ],
    },
  };

  // Refs
  const scrollX = useRef(new Animated.Value(0)).current;
  const sliderRef = useRef<FlatList<Banner>>(null);

  // Memoized translations
  const translations = useMemo(
    () => ({
      goldPurity: t("goldPurity"),
      silverPurity: t("silverPurity"),
      gold: t("gold"),
      silver: t("silver"),
      discountOffer20: t("flashOfferDigiGold"),
      newFeaturesAvailable: t("instantGoldBonus"),
      limitedTimeOffer: t("megaGoldSavings"),
      specialOffer20: t("exclusiveJoinOffer"),
      digigold: t("digigold"),
      saveasgold: t("saveasgold"),
      saveasmoney: t("saveasmoney"),
      futureplus: t("futureplus"),
      goldSchemes: t("goldSchemes"),
      aboutSchemes: t("aboutSchemes"),
      joinNow: t("joinNow"),
      joinNowHint: t("joinNowHint"),
    }),
    [language]
  );

  // Utility functions
  const formatDateToIndian = useCallback(
    (isoString: string | null | undefined) => {
      if (!isoString) return "N/A";
      const date = new Date(isoString);
      return date.toLocaleString("en-IN", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hour12: true,
      });
    },
    []
  );

  // Get profile photo from local storage
  const getLocalProfilePhoto = async () => {
    try {
      const userData = await AsyncStorage.getItem("userData");
      if (userData) {
        const parsedUser = JSON.parse(userData);
        if (parsedUser.profile_photo) {
          setLocalProfilePhoto(parsedUser.profile_photo);
        }
      }
    } catch (error) {
      console.error("Error getting local profile photo:", error);
    }
  };

  // Function to get the best available profile image
  const getProfileImageSource = () => {
    // Priority: 1. Server profileImage, 2. Local profile_photo, 3. null
    if (user?.profileImage) {
      return getFullImageUrl(user.profileImage);
    } else if (localProfilePhoto) {
      return getFullImageUrl(localProfilePhoto);
    }
    return undefined;
  };

  // Load local profile photo on component mount and when user changes
  useEffect(() => {
    getLocalProfilePhoto();
  }, [user]);

  // New image source handling
  const getImageSource = (path: string | any) => {
    if (!path) return undefined;
    // If it's a local resource (require statement), return as is
    if (typeof path === "number") return path;
    // If it's a string, use getFullImageUrl to get the URI
    if (typeof path === "string") {
      const url = getFullImageUrl(path);
      return url ? { uri: url } : undefined;
    }
    return undefined;
  };

  // Fetch investment data separately
  const fetchInvestmentData = useCallback(async () => {
    if (!user || !user.id) {
      console.log(
        "⚠️ No user or userId available, skipping investment data fetch"
      );
      return;
    }

    try {
      console.log("🔍 Fetching investment data for user:", user.id);
      const response = await api.get(`investments/user_investments/${user.id}`);
      console.log("Investment API response:", response.data);

      // Handle different possible response structures
      let investments = [];

      if (response.data && response.data.data) {
        // If response has data.data structure
        investments = response.data.data;
      } else if (response.data && Array.isArray(response.data)) {
        // If response.data is directly an array
        investments = response.data;
      } else if (response.data && response.data.investments) {
        // If response has investments property
        investments = response.data.investments;
      }

      // Ensure investments is an array
      if (!Array.isArray(investments)) {
        console.warn("Expected investments to be an array, got:", investments);
        investments = [];
      }

      console.log("Total investments found:", investments.length);

      setActiveSchemesCount(investments.length || 0);

      // Safely filter investments by schemeType
      const weightBased = investments.filter(
        (inv: any) => inv && inv.scheme && inv.scheme.schemeType === "weight"
      );
      const amountBased = investments.filter(
        (inv: any) => inv && inv.scheme && inv.scheme.schemeType === "amount"
      );

      if (weightBased.length > 0) {
        // Calculate total gold only for weight-based schemes
        const totalGold = weightBased.reduce((sum: number, investment: any) => {
          const goldWeight =
            parseFloat(investment?.totalgoldweight || "0") || 0;
          return sum + goldWeight;
        }, 0);
        setTotalGoldSavings(totalGold);
        setShowTotalGold(true);
      } else {
        setTotalGoldSavings(0);
        setShowTotalGold(false);
      }

      // Calculate total amount for all investments
      const totalAmount = investments.reduce((sum: number, investment: any) => {
        const amount = parseFloat(investment?.total_paid || "0") || 0;
        return sum + amount;
      }, 0);
      setTotalAmount(totalAmount);
    } catch (error) {
      console.error("Error fetching investment data:", error);
      setActiveSchemesCount(0);
      setTotalGoldSavings(0);
      setTotalAmount(0);
      setShowTotalGold(false);
    }
  }, [user]);

  // Open schemes modal
  const openSchemesModal = useCallback((schemeType: string) => {
    setSelectedSchemeType(schemeType);
    setSchemesModalVisible(true);
  }, []);

  // Data fetching - Single API call
  const fetchHomeData = useCallback(
    async (isRefreshing = false) => {
      try {
        console.log("Starting single API data fetch...");
        console.log("🔍 Current user object:", user);
        console.log("🔍 User ID from global store:", user?.id);

        const userId = user?.id;
        console.log("🔍 Using userId for API call:", userId);

        // Only make API call if userId is present
        if (!userId) {
          console.log("⚠️ No userId available, skipping API call");
          isRefreshing ? setRefreshing(false) : setIsLoading(false);
          setIsSliderLoading(false);
          return;
        }

        isRefreshing ? setRefreshing(true) : setIsLoading(true);
        const response = await api.get(`/home?userId=${userId}`);

        if (response.data.success) {
          const data = response.data.data;
          console.log("Home API response:", data);

          setHomeData(response.data);

          // Set collections data
          if (data.collections && data.collections.length > 0) {
            console.log(
              "🔍 Home: Using API collections data:",
              data.collections.length,
              "collections"
            );
            console.log(
              "🔍 Home: First collection sample:",
              data.collections[0]
            );
            setCollectionsData(data.collections);
          } else {
            console.log("🔍 Home: No collections found, using default images");
            console.log(
              "🔍 Home: Default images count:",
              defaultStatusImages.length
            );
            console.log(
              "🔍 Home: First default collection sample:",
              defaultStatusImages[0]
            );
            setCollectionsData(defaultStatusImages);
          }

          // Set slider images from posters
          if (data.posters && data.posters.length > 0) {
            const images = data.posters.map((poster: Poster) => ({
              id: poster.id,
              image:
                poster.image && poster.image.startsWith("http")
                  ? poster.image
                  : poster.image
                  ? `${theme.baseUrl}${poster.image}`
                  : "",
              title: poster.title || "",
            }));
            setSliderImages(images);
          } else {
            console.log("No posters found, using dummy images");
            setSliderImages(
              dummyData.sliderImages.map((image, index) => ({
                id: index,
                image,
                title: `Slider ${index + 1}`,
              }))
            );
          }

          // Set flash news
          console.log(
            "🔍 FlashNews Debug: Checking data.flashNews:",
            data.flashNews
          );
          if (data.flashNews && data.flashNews.length > 0) {
            console.log(
              "🔍 FlashNews Debug: Found flashNews data:",
              data.flashNews
            );
            const flashArray = data.flashNews
              .map((f: any) => f.title || "")
              .filter((title: any) => title);
            console.log(
              "🔍 FlashNews Debug: Processed flashArray:",
              flashArray
            );
            setFlashNews(flashArray);
          } else {
            console.log(
              "🔍 FlashNews Debug: No flashNews data found, using fallback"
            );
            // Set fallback flash news messages
            setFlashNews([
              "🎉 Welcome to Digital Gold Savings!",
              "🔥 Gold price updates available!",
              "🌟 Special offers for new users!",
            ]);
          }

          // Log videos data
          if (data.videos && data.videos.length > 0) {
            console.log("📹 Videos data received from API:", data.videos);
          } else {
            console.log(
              "📹 No videos data received from API, will use fallback"
            );
          }

          // Store gold rate in AsyncStorage
          if (
            data.currentRates?.gold_rate &&
            typeof data.currentRates.gold_rate === "string"
          ) {
            await AsyncStorage.setItem(
              "gold_rate",
              data.currentRates.gold_rate
            );
          }
        } else {
          throw new Error("API response indicates failure");
        }
      } catch (error) {
        console.error("Error in fetchHomeData:", error);
        // Set default data on error
        setCollectionsData(defaultStatusImages);
        setSliderImages(
          dummyData.sliderImages.map((image, index) => ({
            id: index,
            image,
            title: `Slider ${index + 1}`,
          }))
        );
        Alert.alert(t("error"), t("failedToFetchData"), [
          {
            text: t("retry"),
            onPress: () => fetchHomeData(true),
          },
          {
            text: t("ok"),
            style: "cancel",
          },
        ]);
      } finally {
        isRefreshing ? setRefreshing(false) : setIsLoading(false);
        setIsSliderLoading(false);
      }
    },
    [user?.id]
  );

  // Effects
  useEffect(() => {
    console.log("🔍 Home: Initial useEffect triggered");
    console.log("🔍 Home: User object:", user);
    console.log("🔍 Home: User ID:", user?.id);
    console.log("🔍 Home: Is user logged in:", !!user);

    fetchHomeData();
    fetchInvestmentData();
  }, [fetchHomeData, fetchInvestmentData, user]);

  useEffect(() => {
    if (user) {
      console.log("Setting up notifications...");
      NotificationService.sendFcmTokenToApi();
    }
  }, [user]);

  // Monitor flash-news endpoint for continuous calls
  useEffect(() => {
    console.log("🔍 Setting up flash-news endpoint monitoring...");
    const monitoringInterval = monitorEndpoint("/flash-news/active", 10000); // Check every 10 seconds

    // Check for continuous calls every 30 seconds
    const continuousCheckInterval = setInterval(() => {
      const isContinuous = checkForContinuousCalls("/flash-news/active", 3, 1); // 3+ calls in 1 minute
      if (isContinuous) {
        console.log("🚨 WARNING: Continuous flash-news API calls detected!");
      }
    }, 30000);

    return () => {
      clearInterval(monitoringInterval);
      clearInterval(continuousCheckInterval);
    };
  }, []);

  useEffect(() => {
    const checkBanner = async () => {
      const seen = await AsyncStorage.getItem("flashBannerSeen");
      if (!seen) setShowFlashBanner(true);
    };
    checkBanner();
  }, []);

  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener((state) => {
      if (!state.isConnected) {
        Alert.alert(
          t("noInternetTitle"),
          t("noInternetMessage"),
          [
            {
              text: t("retry"),
              onPress: async () => {
                const netState = await NetInfo.fetch();
                if (!netState.isConnected) {
                  Alert.alert(
                    t("noInternetTitle"),
                    t("noInternetMessage"),
                    [{ text: t("retry") }],
                    { cancelable: false }
                  );
                }
              },
            },
          ],
          { cancelable: false }
        );
      }
    });
    return () => unsubscribe();
  }, []);

  // Event handlers
  const handleRefresh = useCallback(() => fetchHomeData(true), [fetchHomeData]);

  const handleCloseBanner = useCallback(async () => {
    setShowFlashBanner(false);
    await AsyncStorage.setItem("flashBannerSeen", "true");
  }, []);

  const handleStatusClose = useCallback(() => {
    if (selectedCollection) {
      // Check if all statuses in the selected collection have been viewed
      // We'll use localStorage or a callback from StatusView if you want to persist, but for now, local state only
      setViewedCollections((prev) => ({
        ...prev,
        [selectedCollection.id]: true, // Mark as viewed when closed (for demo, always true)
      }));
    }
    setShowStatus(false);
    setSelectedCollection(null);
  }, [selectedCollection]);

  // API Logging demonstration function
  const demonstrateApiLogging = useCallback(() => {
    console.log("🔍 DEMONSTRATING API LOGGING FUNCTIONALITY");
    console.log("==========================================");

    // Log API summary
    logApiSummary();

    // Log recent API calls
    logRecentApiCalls(5);

    // Get all API logs
    const allLogs = getApiLogs();
    console.log(`📋 Total API logs collected: ${allLogs.length}`);

    // Get failed API logs
    const failedLogs = getFailedApiLogs();
    console.log(`❌ Failed API calls: ${failedLogs.length}`);

    // Get logs by service
    const mainLogs = apiLogManager.getLogsByService("main");
    const serviceLogs = apiLogManager.getLogsByService("apiService");
    const paymentLogs = apiLogManager.getLogsByService("payment");

    console.log(`📊 Logs by service:`);
    console.log(`  Main API: ${mainLogs.length}`);
    console.log(`  API Service: ${serviceLogs.length}`);
    console.log(`  Payment Service: ${paymentLogs.length}`);

    // Get slowest endpoints
    const slowestEndpoints = apiLogManager.getSlowestEndpoints(3);
    console.log("🐌 Slowest endpoints:", slowestEndpoints);

    // Get error-prone endpoints
    const errorProneEndpoints = apiLogManager.getErrorProneEndpoints(3);
    console.log("⚠️ Error-prone endpoints:", errorProneEndpoints);

    if (__DEV__) {
      // Export logs (for debugging)
      const exportedLogs = apiLogManager.exportLogs();
      console.log("📤 Exported logs length:", exportedLogs.length);
    }
    // Show alert with summary
    const summary = apiLogManager.getApiSummary();
    Alert.alert(
      t("apiLogsSummary"),
      `${t("totalRequests")}: ${summary.totalRequests}\n` +
        `${t("successful")}: ${summary.successful}\n` +
        `${t("failed")}: ${summary.failed}\n` +
        `${t("avgResponseTime")}: ${summary.averageResponseTime.toFixed(
          2
        )}ms\n\n` +
        `${t("checkConsoleForDetails")}`,
      [{ text: t("ok") }]
    );
  }, []);

  // Render functions
  const renderBanner: ListRenderItem<Banner> = useCallback(
    ({ item }) => (
      <BannerCard
        item={item}
        router={router}
        onAboutSchemesPress={openSchemesModal}
      />
    ),
    [router, openSchemesModal]
  );

  const renderStatusItem = useCallback(
    ({ item }: { item: Collection }) => (
      <TouchableOpacity
        style={styles.statusItem}
        onPress={() => {
          if (__DEV__) {
            console.log("🔍 Home: Status item pressed:", item.name);
            console.log("🔍 Home: Item thumbnail type:", typeof item.thumbnail);
            console.log(
              "🔍 Home: Item status_images count:",
              item.status_images?.length
            );
          }
          setSelectedCollection(item);
          setShowStatus(true);
        }}
      >
        <View style={styles.statusItemWrapper}>
          <View
            style={[
              styles.statusImageContainer,
              { borderColor: viewedCollections[item.id] ? "#ccc" : "#00FF00" }, // green if not viewed, gray if viewed
            ]}
          >
            <Image
              source={getImageSource(item.thumbnail) ?? undefined}
              style={styles.statusImage}
              resizeMode="cover"
              onError={(e) => {
                console.error(
                  "Collection thumbnail failed to load:",
                  getImageSource(item.thumbnail),
                  e.nativeEvent
                );
              }}
            />
          </View>
          <Text style={styles.statusItemName} numberOfLines={1}>
            {item.name}
          </Text>
        </View>
      </TouchableOpacity>
    ),
    [getImageSource, viewedCollections]
  );

  // Show loading screen while data is being fetched
  if (isLoading) {
    return (
      <>
        <StatusBar
          backgroundColor="#5a000b"
          barStyle="light-content"
          translucent={false}
        />
        <ImageBackground
          source={require("../../../../../assets/images/bg_new.jpg")}
          style={styles.backgroundImage}
          resizeMode="contain"
        >
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#FFD700" />
            <Text style={styles.loadingText}>{t("loading")}</Text>
          </View>
        </ImageBackground>
      </>
    );
  }

  // Show message if no user data is available
  if (!user || !user.id) {
    return (
      <>
        <StatusBar
          backgroundColor="#5a000b"
          barStyle="light-content"
          translucent={false}
        />
        <ImageBackground
          source={require("../../../../../assets/images/bg_new.jpg")}
          style={styles.backgroundImage}
          resizeMode="contain"
        >
          <View style={styles.loadingContainer}>
            <Ionicons name="person-circle-outline" size={60} color="#FFD700" />
            <Text style={styles.loadingText}>
              Please login to view your dashboard
            </Text>
            <TouchableOpacity
              style={styles.loginButton}
              onPress={() => router.push("/(auth)/login")}
            >
              <Text style={styles.loginButtonText}>Go to Login</Text>
            </TouchableOpacity>
          </View>
        </ImageBackground>
      </>
    );
  }

  return (
    <AuthGuard>
      <StatusBar
        backgroundColor="#5a000b"
        barStyle="light-content"
        translucent={false}
      />
      <ImageBackground
        source={require("../../../../../assets/images/bg_new.jpg")}
        style={styles.backgroundImage}
        resizeMode="contain"
      >
        {showFlashBanner && (
          <FlashBanner
            imageSource={require("../../../../../assets/images/flashbanner.png")}
            onClose={handleCloseBanner}
          />
        )}
        <SafeAreaView style={styles.mainContainer}>
          <ScrollView
            contentContainerStyle={styles.scrollContent}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={handleRefresh}
                colors={["#FFD700"]}
                tintColor="#FFD700"
              />
            }
          >
            <View style={styles.ratesContainer}>
              {homeData?.data?.currentRates ? (
                <>
                  {/* <View
                    style={[
                      styles.rateCard,
                      !homeData.data.currentRates.silver_rate && styles.singleRateCard,
                    ]}
                  >
                    <LiveRateCard
                      type={translations.gold}
                      rate={
                        homeData.data.currentRates.gold_rate || dummyData.rates.gold.price
                      }
                      lastupdated={formatDateToIndian(
                        homeData.data.currentRates.updated_at
                      )}
                      image={dummyData.rates.gold.image}
                      isSingle={!homeData.data.currentRates.silver_rate}
                    />
                  </View> */}
                  {/* {homeData.data.currentRates.silver_rate && (
                    <View style={styles.rateCard}>
                      <LiveRateCard
                        type={translations.silver}
                        rate={homeData.data.currentRates.silver_rate}
                        lastupdated={formatDateToIndian(
                          homeData.data.currentRates.updated_at
                        )}
                        image={dummyData.rates.silver.image}
                      />
                    </View>
                  )} */}
                </>
              ) : (
                <View style={styles.rateWarningContainer}>
                  <View style={styles.rateWarningContent}>
                    <Ionicons name="warning" size={24} color="#FFD700" />
                    <View style={styles.rateWarningTextContainer}>
                      <Text style={styles.rateWarningTitle}>
                        {t("liveRatesUnavailable")}
                      </Text>
                      <Text style={styles.rateWarningSubtitle}>
                        {t("pleaseTryAgainLater")}
                      </Text>
                    </View>
                  </View>
                  <View style={styles.rateWarningRates}>
                    <View style={styles.rateWarningRateItem}>
                      <Text style={styles.rateWarningRateLabel}>
                        {t("goldRate")}
                      </Text>
                      <Text style={styles.rateWarningRateValue}>0.00</Text>
                    </View>
                    <View style={styles.rateWarningDivider} />
                    <View style={styles.rateWarningRateItem}>
                      <Text style={styles.rateWarningRateLabel}>
                        {t("silverRate")}
                      </Text>
                      <Text style={styles.rateWarningRateValue}>0.00</Text>
                    </View>
                  </View>
                </View>
              )}
            </View>
            {/* Gold Rate Widget (inline, below FlashOffer) */}
            {homeData?.data?.currentRates?.gold_rate && (
              <AnimatedGoldRate
                goldRate={homeData.data.currentRates.gold_rate}
                updatedAt={homeData.data.currentRates.updated_at}
              />
            )}
            <View style={styles.statusContainer}>
              <FlatList
                data={collectionsData}
                renderItem={renderStatusItem}
                keyExtractor={(item) => item.id.toString()}
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.statusListContent}
                removeClippedSubviews={true}
                maxToRenderPerBatch={10}
                windowSize={5}
                initialNumToRender={10}
              />
            </View>

            <View style={styles.mainContent}>
              {isSliderLoading ? (
                <View style={styles.sliderLoadingContainer}>
                  <ActivityIndicator size="large" color="#FFD700" />
                </View>
              ) : (
                <ImageSlider images={sliderImages} />
              )}

              <FlashOffer
                // fallbackMessages={[
                //   "🎉 Welcome to Digital Gold Savings!",
                //   "🔥 Gold price drops! Invest smart.",
                //   "🌟 Special offer for new users!",
                // ]}
                fallbackMessages={flashNews}
                onPress={() => {
                  if (__DEV__) {
                    console.log("Flash news tapped");
                  }
                }}
                textColor="#ffffff"
              />
              <UserInfoCard
                userName={user?.name}
                activeSchemesCount={activeSchemesCount}
                totalGoldSavings={totalGoldSavings}
                totalAmount={totalAmount}
                showTotalGold={showTotalGold}
                onPress={() => router.push("/(tabs)/savings")}
                userId={Number(user?.id) || 0}
                profilePhoto={getProfileImageSource()}
              />

              <View style={styles.sectionHeader}>
                <View style={styles.sectionHeaderContent}>
                  <View style={styles.sectionHeaderLine} />
                  <Text style={styles.sectionHeaderText}>
                    {t("activeSchemes")}
                  </Text>
                  <View style={styles.sectionHeaderLine} />
                </View>
                <Text style={styles.sectionHeaderSubtext}>
                  {t("exploreGoldSavingsPlans")}
                </Text>
              </View>

              <View style={styles.bannerContainer}>
                <FlatList
                  data={banners}
                  renderItem={renderBanner}
                  keyExtractor={(item) => item.id.toString()}
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.bannerListContent}
                  removeClippedSubviews={true}
                  maxToRenderPerBatch={10}
                  windowSize={5}
                  initialNumToRender={10}
                />
              </View>

              <YouTubeVideo videos={homeData?.data?.videos} />

              <SocialMediaCard />

              <SupportContactCard />

              {/* Hallmark Images Section */}
              <View style={styles.hallmarkContainer}>
                <View style={styles.hallmarkHeader}>
                  <View style={styles.hallmarkHeaderLine} />
                  <Text style={styles.hallmarkHeaderText}>
                    {t("certifiedHallmark")}
                  </Text>
                  <View style={styles.hallmarkHeaderLine} />
                </View>
                <FlatList
                  data={hallmarkData}
                  keyExtractor={(item) => item.id.toString()}
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  pagingEnabled={false}
                  snapToAlignment="start"
                  decelerationRate="fast"
                  bounces={true}
                  alwaysBounceHorizontal={true}
                  renderItem={({ item }) => (
                    <View style={styles.hallmarkImageWrapper}>
                      <Image
                        source={item.image}
                        style={styles.hallmarkImage}
                        resizeMode="contain"
                      />
                      <Text style={styles.hallmarkImageLabel}>
                        {t(item.label)}
                      </Text>
                    </View>
                  )}
                  contentContainerStyle={styles.hallmarkImagesContainer}
                />
              </View>

              {/* Powered by Section */}
              <View style={styles.poweredByContainer}>
                <TouchableOpacity
                  style={styles.poweredByButton}
                  onPress={() => Linking.openURL("http://agnisofterp.com/")}
                >
                  <Text style={styles.poweredByText}>{t("poweredBy")}</Text>
                  <Text style={styles.poweredByLink}>agnisofterp.com</Text>
                </TouchableOpacity>
              </View>

              <View style={styles.spacer} />
            </View>
          </ScrollView>

          <StatusView
            collections={collectionsData}
            isVisible={showStatus}
            initialCollectionIndex={(() => {
              if (selectedCollection) {
                const idx = collectionsData.findIndex(
                  (c) => String(c.id) === String(selectedCollection.id)
                );
                return idx >= 0 ? idx : 0;
              }
              return 0;
            })()}
            onClose={handleStatusClose}
          />

          {/* Schemes Modal */}
          <Modal
            visible={schemesModalVisible}
            transparent
            animationType="fade"
            onRequestClose={() => setSchemesModalVisible(false)}
          >
            <View style={styles.modalOverlay}>
              <View style={styles.modalContent}>
                <View style={styles.modalHeader}>
                  <Text style={styles.modalTitle}>
                    {selectedSchemeType &&
                    staticSchemesData[
                      selectedSchemeType as keyof typeof staticSchemesData
                    ]
                      ? staticSchemesData[
                          selectedSchemeType as keyof typeof staticSchemesData
                        ].name
                      : t("schemes.title")}
                  </Text>
                  <TouchableOpacity
                    onPress={() => setSchemesModalVisible(false)}
                    style={styles.closeButton}
                  >
                    <Ionicons
                      name="close"
                      size={24}
                      color={theme.colors.primary}
                    />
                  </TouchableOpacity>
                </View>

                <ScrollView
                  style={styles.modalBody}
                  showsVerticalScrollIndicator={false}
                >
                  {selectedSchemeType &&
                  staticSchemesData[
                    selectedSchemeType as keyof typeof staticSchemesData
                  ] ? (
                    (() => {
                      const scheme =
                        staticSchemesData[
                          selectedSchemeType as keyof typeof staticSchemesData
                        ];
                      return (
                        <View style={styles.schemeItem}>
                          <View style={styles.schemeHeader}>
                            <Text style={styles.schemeName}>{scheme.name}</Text>
                            <View style={styles.schemeTypeContainer}>
                              <Text style={styles.schemeType}>
                                {scheme.type}
                              </Text>
                            </View>
                          </View>

                          <Text
                            style={styles.schemeDescription}
                            numberOfLines={4}
                          >
                            {scheme.description}
                          </Text>

                          <View style={styles.benefitsContainer}>
                            <Text style={styles.benefitsTitle}>
                              {t("schemes.keyBenefits")}:
                            </Text>
                            {scheme.benefits.map(
                              (benefit: string, benefitIndex: number) => (
                                <Text
                                  key={benefitIndex}
                                  style={styles.benefitItem}
                                >
                                  • {benefit}
                                </Text>
                              )
                            )}
                          </View>

                          <View style={styles.chitsContainer}>
                            <Text style={styles.chitsTitle}>
                              {t("schemes.availablePlans")}:
                            </Text>
                            {scheme.plans.map(
                              (plan: any, planIndex: number) => (
                                <View key={planIndex} style={styles.chitItem}>
                                  <Text style={styles.chitAmount}>
                                    {plan.amount}
                                  </Text>
                                  <Text style={styles.chitFrequency}>
                                    {plan.frequency}
                                  </Text>
                                </View>
                              )
                            )}
                          </View>

                          <TouchableOpacity
                            style={styles.joinSchemeButton}
                            onPress={() => {
                              setSchemesModalVisible(false);
                              router.push("/(app)/(tabs)/home/schemes");
                            }}
                          >
                            <Text style={styles.joinSchemeButtonText}>
                              {t("schemes.joinNow")}
                            </Text>
                          </TouchableOpacity>
                        </View>
                      );
                    })()
                  ) : (
                    <View style={styles.emptySchemesContainer}>
                      <Text style={styles.emptySchemesText}>
                        Scheme details not available
                      </Text>
                    </View>
                  )}
                </ScrollView>
              </View>
            </View>
          </Modal>
        </SafeAreaView>
      </ImageBackground>
    </AuthGuard>
  );
}

const styles = StyleSheet.create({
  backgroundImage: {
    flex: 1,
    width: "100%",
    height: "100%",
  },
  mainContainer: {
    flex: 1,
    backgroundColor: "rgba(255, 255, 255, 0.1)",
  },
  headerWrapper: {
    width: "100%",
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    padding: 0,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 10,
  },
  ratesContainer: {
    paddingHorizontal: moderateScale(16),
    width: "100%",
    flexDirection: "row",
    justifyContent: "center",
    marginVertical: 0,
  },
  rateCard: {
    flex: 1,
    margin: 5,
    alignItems: "center",
    maxWidth: 200,
  },
  singleRateCard: {
    maxWidth: 300,
  },
  mainContent: {
    width: "100%",
    alignItems: "center",
    paddingHorizontal: 0,
    marginHorizontal: 0,
  },
  loadingText: {
    textAlign: "center",
    color: "#FFFFFF",
    fontSize: moderateScale(14),
    paddingVertical: moderateScale(20),
  },
  spacer: {
    height: moderateScale(80),
  },
  languageSwitcherHeader: {
    marginLeft: 10,
  },
  bannerContainer: {
    width: "100%",
    marginVertical: 10,
    paddingHorizontal: 10,
  },
  bannerListContent: {
    paddingHorizontal: 10,
    paddingRight: 30,
  },
  bannerCard: {
    backgroundColor: "#fff",
    borderRadius: 20,
    marginHorizontal: 5,
    marginBottom: 8,
    shadowColor: "#FFD700",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 6,
    width: screenWidth * 0.85,
    alignItems: "center",
    overflow: "hidden",
    paddingBottom: 16,
  },
  bannerImageWrapper: {
    width: "100%",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    overflow: "hidden",
  },
  bannerImage: {
    width: screenWidth * 0.85,
    height: 200,
    borderRadius: 20,
  },
  bannerButtonRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    width: "90%",
    alignSelf: "center",
    marginTop: 16,
    gap: 12,
  },
  aboutSchemesButton: {
    flex: 1,
    backgroundColor: "#fffbe6",
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: theme.colors.primary,
    shadowColor: "#FFD700",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
    elevation: 1,
    marginRight: 6,
  },
  aboutSchemesButtonText: {
    color: theme.colors.primary,
    fontWeight: "600",
    fontSize: 15,
    letterSpacing: 0.2,
  },
  joinNowButton: {
    flex: 1,
    backgroundColor: theme.colors.primary,
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: theme.colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 3,
    marginLeft: 6,
  },
  joinNowButtonText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 16,
    letterSpacing: 0.5,
    textTransform: "uppercase",
  },
  userInfoCard: {
    width: "90%",
    borderRadius: 16,
    marginVertical: 10,
    overflow: "hidden",
    elevation: 5,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  userInfoGradient: {
    padding: 16,
  },
  userInfoTopRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  welcomeContainer: {
    flex: 1,
  },
  welcomeText: {
    fontSize: moderateScale(12),
    color: "rgba(255, 255, 255, 0.7)",
    marginBottom: 2,
  },
  userName: {
    fontSize: moderateScale(18),
    fontWeight: "700",
    color: "#FFFFFF",
  },
  userIdText: {
    fontSize: moderateScale(12),
    fontWeight: "400",
    color: "rgba(255, 255, 255, 0.7)",
    marginLeft: 8,
  },
  userAvatarContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    justifyContent: "center",
    alignItems: "center",
    marginLeft: 10,
  },
  userAvatar: {
    width: "100%",
    height: "100%",
    borderRadius: 20,
  },
  statsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.2)",
    borderRadius: 10,
    padding: 10,
  },
  statsContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    flex: 1,
    justifyContent: "space-between",
  },
  statItem: {
    flex: 1,
    alignItems: "center",
    minWidth: 80,
  },
  statLabel: {
    fontSize: moderateScale(10),
    color: "rgba(255, 255, 255, 0.7)",
    marginBottom: 2,
    textAlign: "center",
  },
  statValue: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  countText: {
    fontSize: moderateScale(14),
    fontWeight: "bold",
    color: "#FFFFFF",
  },
  unitText: {
    fontSize: moderateScale(12),
    color: "#FFD700",
    fontWeight: "600",
  },
  statDivider: {
    width: 1,
    height: 30,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
  },
  viewMoreContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginLeft: 12,
  },
  viewMoreText: {
    fontSize: moderateScale(11),
    color: "#FFD700",
    fontWeight: "600",
  },
  statusContainer: {
    width: "100%",
    marginVertical: 10,
    marginTop: 15,
  },
  statusListContent: {
    paddingHorizontal: 10,
  },
  statusItem: {
    marginHorizontal: 5,
    alignItems: "center",
  },
  statusItemWrapper: {
    alignItems: "center",
  },
  statusImageContainer: {
    width: STATUS_IMAGE_SIZE,
    height: STATUS_IMAGE_SIZE,
    borderRadius: STATUS_BORDER_RADIUS,
    borderWidth: 2,
    borderColor: "#850111",
    padding: 2,
    backgroundColor: "#fff",
    marginBottom: 6,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  statusImage: {
    width: "100%",
    height: "100%",
    borderRadius: STATUS_BORDER_RADIUS - 2,
  },
  statusItemName: {
    fontSize: 12,
    color: "#850111",
    textAlign: "center",
    width: STATUS_IMAGE_SIZE,
    fontWeight: "600",
    textShadowColor: "rgba(255, 255, 255, 0.5)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 1,
  },
  headerLanguageButton: {
    flexDirection: "row",
    alignItems: "center",
    padding: 8,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.3)",
  },
  languageIcon: {
    fontSize: 16,
    marginRight: 4,
  },
  headerLanguageText: {
    fontSize: 12,
    fontWeight: "bold",
    color: "#FFFFFF",
  },
  sliderLoadingContainer: {
    width: "100%",
    height: 200,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.1)",
    borderRadius: 8,
    marginVertical: 10,
  },
  sectionHeader: {
    width: "100%",
    paddingHorizontal: 10,
    marginTop: 20,
    marginBottom: 12,
    alignItems: "center",
  },
  sectionHeaderContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    width: "100%",
  },
  sectionHeaderLine: {
    height: 1.5,
    width: 20,
    backgroundColor: "#FFD700",
    marginHorizontal: 5,
  },
  sectionHeaderText: {
    fontSize: moderateScale(16),
    fontWeight: "700",
    color: "#850111",
    textTransform: "uppercase",
    letterSpacing: 0.3,
    textShadowColor: "rgba(0, 0, 0, 0.1)",
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 1,
  },
  sectionHeaderSubtext: {
    fontSize: moderateScale(11),
    color: "#666",
    marginTop: 4,
    textAlign: "center",
    fontStyle: "italic",
  },
  videoContainer: {
    width: "100%",
    paddingHorizontal: 10,
    marginVertical: 15,
  },
  videoHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
    paddingHorizontal: 5,
  },
  videoTitle: {
    fontSize: moderateScale(16),
    fontWeight: "700",
    color: "#850111",
    textTransform: "uppercase",
    letterSpacing: 0.3,
    marginRight: 10,
  },
  videoHeaderLine: {
    flex: 1,
    height: 1.5,
    backgroundColor: "#FFD700",
  },
  videoWrapper: {
    backgroundColor: "#fff",
    borderRadius: 20,
    padding: 2,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5,
  },
  rateWarningContainer: {
    width: "90%",
    backgroundColor: "rgba(133, 1, 17, 0.9)",
    borderRadius: 16,
    padding: 16,
    marginVertical: 10,
  },
  rateWarningContent: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  rateWarningTextContainer: {
    marginLeft: 12,
    flex: 1,
  },
  rateWarningTitle: {
    fontSize: moderateScale(16),
    fontWeight: "700",
    color: "#FFFFFF",
    marginBottom: 4,
  },
  rateWarningSubtitle: {
    fontSize: moderateScale(12),
    color: "rgba(255, 255, 255, 0.7)",
  },
  rateWarningRates: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.2)",
    borderRadius: 12,
    padding: 12,
  },
  rateWarningRateItem: {
    flex: 1,
    alignItems: "center",
  },
  rateWarningRateLabel: {
    fontSize: moderateScale(12),
    color: "rgba(255, 255, 255, 0.7)",
    marginBottom: 4,
  },
  rateWarningRateValue: {
    fontSize: moderateScale(18),
    fontWeight: "bold",
    color: "#FFFFFF",
  },
  rateWarningDivider: {
    width: 1,
    height: 30,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    marginHorizontal: 12,
  },
  debugButton: {
    flexDirection: "row",
    alignItems: "center",
    padding: 8,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.3)",
  },
  debugButtonText: {
    fontSize: 12,
    fontWeight: "bold",
    color: "#FFFFFF",
    marginLeft: 4,
  },
  viewDetailsContainer: {
    marginTop: 16,
    borderRadius: 12,
    overflow: "hidden",
    alignSelf: "flex-end",
    width: "55%",
  },
  viewDetailsGradient: {
    padding: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  viewDetailsText: {
    fontSize: moderateScale(10),
    fontWeight: "bold",
    color: "#850111",
    textAlign: "center",
  },
  doubleArrowContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginLeft: 4,
  },
  secondArrow: {
    marginLeft: -8,
  },
  goldRateLabelContainer: {
    width: "90%",
    alignSelf: "center",
  },
  goldRateLabel: {
    borderRadius: 10,
    borderWidth: 3,
    borderColor: theme.colors.secondary,
    paddingVertical: 2,
    paddingHorizontal: 0,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 3,
  },
  goldRatePurity: {
    color: "#FFF8E1",
    fontWeight: "bold",
    fontSize: 14,
    textAlign: "center",
    letterSpacing: 1,
    marginLeft: 8,
    marginRight: 2,
  },
  liveDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#2ecc40",
    borderWidth: 1,
    borderColor: "#fff",
  },
  goldRateTitle: {
    color: "#FFF8E1",
    fontSize: 12,
    fontWeight: "600",
    marginTop: 2,
    marginBottom: 0,
    textAlign: "center",
    letterSpacing: 0.5,
  },
  goldRateRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 2,
    marginBottom: 0,
  },
  goldRatePrice: {
    color: "#FFF8E1",
    fontWeight: "700",
    fontSize: 18,
    textAlign: "center",
    letterSpacing: 0.5,
  },
  goldRateUpdatedAt: {
    color: "#FFF8E1BB",
    fontSize: 10,
    marginTop: 2,
    textAlign: "center",
    fontStyle: "italic",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  loginButton: {
    backgroundColor: "#FFD700",
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    marginTop: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  loginButtonText: {
    color: "#850111",
    fontSize: moderateScale(16),
    fontWeight: "700",
    textAlign: "center",
  },
  hallmarkContainer: {
    width: "100%",
    paddingHorizontal: 10,
    marginTop: 15,
    marginBottom: 10,
  },
  hallmarkHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
    paddingHorizontal: 5,
  },
  hallmarkHeaderLine: {
    flex: 1,
    height: 1.5,
    backgroundColor: "#FFD700",
    marginHorizontal: 5,
  },
  hallmarkHeaderText: {
    fontSize: moderateScale(16),
    fontWeight: "700",
    color: "#850111",
    textTransform: "uppercase",
    letterSpacing: 0.3,
    textAlign: "center",
  },
  hallmarkImagesContainer: {
    flexDirection: "row",
    justifyContent: "flex-start",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  hallmarkImageWrapper: {
    alignItems: "center",
    width: 200, // Fixed width for better control
    marginRight: 20, // Add spacing between items
  },
  hallmarkImage: {
    width: 180, // Increased width
    height: 150, // Increased height
    marginBottom: 12,
    borderRadius: 8, // Optional: add rounded corners
  },
  hallmarkImageLabel: {
    fontSize: moderateScale(12), // Slightly larger font
    color: "#666",
    textAlign: "center",
    fontStyle: "italic",
    fontWeight: "500",
  },
  poweredByContainer: {
    width: "100%",
    paddingHorizontal: 20,
    marginTop: 10,
    marginBottom: 5,
    alignItems: "center",
  },
  poweredByButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    borderWidth: 1,
    borderColor: "rgba(255, 215, 0, 0.3)",
  },
  poweredByText: {
    fontSize: moderateScale(12),
    color: "#666",
    marginRight: 4,
  },
  poweredByLink: {
    fontSize: moderateScale(12),
    color: "#FFD700",
    fontWeight: "600",
    textDecorationLine: "underline",
  },

  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    backgroundColor: "#fff",
    borderRadius: 20,
    width: "90%",
    maxHeight: "80%",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 24,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
    backgroundColor: "#f8f9fa",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  modalTitle: {
    fontSize: moderateScale(18),
    fontWeight: "700",
    color: "#850111",
  },
  closeButton: {
    padding: 4,
  },
  modalLoadingContainer: {
    padding: 40,
    alignItems: "center",
  },
  modalLoadingText: {
    marginTop: 12,
    fontSize: moderateScale(14),
    color: "#666",
  },
  modalBody: {
    padding: 24,
  },
  schemeItem: {
    backgroundColor: "#f8f9fa",
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#e9ecef",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  schemeHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  schemeName: {
    fontSize: moderateScale(18),
    fontWeight: "700",
    color: "#850111",
    flex: 1,
    marginBottom: 4,
  },
  schemeType: {
    fontSize: moderateScale(12),
    color: "#666",
    backgroundColor: "#e9ecef",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  schemeTypeContainer: {
    backgroundColor: "#e9ecef",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  schemeDescription: {
    fontSize: moderateScale(15),
    color: "#333",
    lineHeight: 22,
    marginBottom: 16,
    textAlign: "justify",
  },
  benefitsContainer: {
    marginBottom: 12,
  },
  benefitsTitle: {
    fontSize: moderateScale(16),
    fontWeight: "600",
    color: "#850111",
    marginBottom: 12,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  benefitItem: {
    fontSize: moderateScale(14),
    color: "#555",
    marginBottom: 6,
    paddingLeft: 12,
    lineHeight: 18,
  },
  chitsContainer: {
    marginBottom: 16,
  },
  chitsTitle: {
    fontSize: moderateScale(16),
    fontWeight: "600",
    color: "#850111",
    marginBottom: 12,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  chitItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#fff",
    padding: 12,
    borderRadius: 10,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: "#dee2e6",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  chitAmount: {
    fontSize: moderateScale(16),
    fontWeight: "700",
    color: "#850111",
  },
  chitFrequency: {
    fontSize: moderateScale(13),
    color: "#666",
    fontWeight: "500",
  },
  joinSchemeButton: {
    backgroundColor: "#FFD700",
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    alignItems: "center",
    marginTop: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  joinSchemeButtonText: {
    color: "#850111",
    fontSize: moderateScale(15),
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  emptySchemesContainer: {
    padding: 40,
    alignItems: "center",
  },
  emptySchemesText: {
    fontSize: moderateScale(15),
    color: "#666",
    textAlign: "center",
    fontStyle: "italic",
  },
});

// Hallmark data for FlatList
const hallmarkData = [
  {
    id: 1,
    image: require("../../../../../assets/images/halmark1.jpg"),
    label: "goldHallmarking",
  },
  {
    id: 2,
    image: require("../../../../../assets/images/halmark2.jpg"),
    label: "certifiedDiamonds",
  },
  // Add more hallmarks to demonstrate scrolling
  {
    id: 3,
    image: require("../../../../../assets/images/halmark1.jpg"),
    label: "silverHallmarking",
  },
  {
    id: 4,
    image: require("../../../../../assets/images/halmark2.jpg"),
    label: "platinumCertified",
  },
];
