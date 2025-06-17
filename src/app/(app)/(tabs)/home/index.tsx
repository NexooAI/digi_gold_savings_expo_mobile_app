import { SafeAreaView } from "react-native-safe-area-context";
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
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import LanguageSwitcher from "@/contexts/LanguageSwitcher";
import LiveRateCard from "@/app/components/LiveRateCard";
import ImageSlider from "@/app/components/ImageSlider";
import { t } from "@/i18n";
import AppHeader from "@/app/components/AppHeader";
import ProductsList from "@/app/components/Products";
import FlashOffer from "@/app/components/FlashOffer";
import YouTubeVideo from "@/app/components/YouTubeVideo";
import SupportContactCard from "@/app/components/SupportContactCard";
import useGlobalStore from "@/store/global.store";
import api, { schemes, rates, collections, posters } from "@/services/api";
import NetInfo from "@react-native-community/netinfo";
import { ScaledSheet, moderateScale } from "react-native-size-matters";
import { theme } from "@/constants/theme";
import AsyncStorage from "@react-native-async-storage/async-storage";
import FlashBanner from "@/app/components/FlashBanner";
import { Ionicons } from "@expo/vector-icons";
import StatusView from "@/app/components/StatusView";
import NotificationService from "@/services/NotificationService";
import { AppLocale } from "@/i18n";

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
  },
  {
    id: 3,
    image: require("../../../../../assets/images/banner2.png"),
    schemeUrl: "/(app)/(tabs)/home/schemes",
  },
];

// Add default status images
const defaultStatusImages: Collection[] = [
  {
    id: 1,
    name: "Gold Collection",
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
    name: "Silver Collection",
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
    name: "Diamond Collection",
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
    name: "Platinum Collection",
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
    name: "Exclusive Collection",
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
interface RatesData {
  data: {
    gold_rate: string;
    silver_rate: string;
    updated_at: string;
  };
}

interface Banner {
  id: number;
  image: any;
  schemeUrl: string;
}

interface Collection {
  id: number;
  name: string;
  thumbnail: string | any;
  status_images: string[] | any[];
  created_at?: string;
  updated_at?: string;
}

interface UserInfoCardProps {
  userName: string | undefined;
  activeSchemesCount: number;
  onPress: () => void;
  totalGoldSavings?: number;
}

// Components
const UserInfoCard: React.FC<UserInfoCardProps> = React.memo(
  ({ userName, activeSchemesCount, onPress, totalGoldSavings = 0 }) => (
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
            <Text style={styles.welcomeText}>Welcome back,</Text>
            <Text style={styles.userName}>{userName || "Guest User"}</Text>
          </View>
          <View style={styles.userAvatarContainer}>
            <Ionicons name="person-circle" size={45} color="#FFD700" />
          </View>
        </View>

        <View style={styles.statsRow}>
          <View style={styles.statsContainer}>
            <View style={styles.statItem}>
              <Text style={styles.statLabel}>Active Schemes</Text>
              <View style={styles.statValue}>
                <Text style={styles.countText}>{activeSchemesCount || 0}</Text>
                <Ionicons name="trending-up" size={16} color="#FFD700" />
              </View>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statLabel}>Total Gold</Text>
              <View style={styles.statValue}>
                <Text style={styles.countText}>
                  {totalGoldSavings.toFixed(3)}
                </Text>
                <Text style={styles.unitText}>g</Text>
              </View>
            </View>
          </View>
          <View style={styles.viewMoreContainer}>
            <Text style={styles.viewMoreText}>View Details</Text>
            <Ionicons name="chevron-forward" size={20} color="#FFD700" />
          </View>
        </View>
      </LinearGradient>
    </TouchableOpacity>
  )
);

export default function Home() {
  // State
  const { language, user } = useGlobalStore();
  const router = useRouter();
  const [schemeData, setSchemeData] = useState(null);
  const [ratesData, setRatesData] = useState<RatesData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showFlashBanner, setShowFlashBanner] = useState(false);
  const [activeSchemesCount, setActiveSchemesCount] = useState(0);
  const [selectedCollection, setSelectedCollection] =
    useState<Collection | null>(null);
  const [showStatus, setShowStatus] = useState(false);
  const [collectionsData, setCollectionsData] = useState<Collection[]>([]);
  const [totalGoldSavings, setTotalGoldSavings] = useState(0);
  const [flashNews, setFlashNews] = useState<any[]>([]);
  const [sliderImages, setSliderImages] = useState<any[]>([]);
  const [isSliderLoading, setIsSliderLoading] = useState(true);

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
      goldSchemes: "Gold Schemes",
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

  const getFullImageUrl = useCallback((path: string) => {
    if (!path) return "";
    if (path.startsWith("http")) return path;
    return `${theme.baseUrl}/${path}`;
  }, []);

  // Data fetching
  const fetchData = useCallback(async (isRefreshing = false) => {
    try {
      //console.log('Starting data fetch...');
      isRefreshing ? setRefreshing(true) : setIsLoading(true);

      const [
        schemesResponse,
        liveRatesResponse,
        collectionsResponse,
        postersResponse,
      ] = await Promise.all([
        schemes.getSchemes().catch((error) => {
          console.error("Error fetching schemes:", error);
          return { data: null };
        }),
        rates.getLiveRates().catch((error) => {
          console.error("Error fetching rates:", error);
          return { data: null };
        }),
        collections.getCollections().catch((error) => {
          console.error("Error fetching collections:", error);
          return { data: { data: [] } };
        }),
        posters.getActivePosters().catch((error) => {
          console.error("Error fetching posters:", error);
          return { data: { data: [] } };
        }),
      ]);

      console.log("Data fetch completed:", {
        schemes: !!schemesResponse.data,
        rates: !!liveRatesResponse.data,
        collections: !!collectionsResponse.data,
        posters: !!postersResponse.data,
      });

      setSchemeData(schemesResponse.data);
      setRatesData(liveRatesResponse.data);

      // Handle collections data with fallback
      if (collectionsResponse.data?.data?.length > 0) {
        setCollectionsData(collectionsResponse.data.data);
      } else {
        //console.log('No collections found, using default images');
        setCollectionsData(defaultStatusImages);
      }

      // Handle slider images
      if (postersResponse.data?.data?.length > 0) {
        const images = postersResponse.data.data.map((poster: any) => ({
          id: poster.id,
          image: poster.image.startsWith("http")
            ? poster.image
            : `${theme.baseUrl}${poster.image}`,
          title: poster.title,
        }));
        //console.log("=======================",images);
        setSliderImages(images);
      } else {
        //console.log('No posters found, using dummy images');
        setSliderImages(
          dummyData.sliderImages.map((image, index) => ({
            id: index,
            image,
            title: `Slider ${index + 1}`,
          }))
        );
      }

      if (liveRatesResponse.data?.data?.gold_rate) {
        await AsyncStorage.setItem(
          "gold_rate",
          liveRatesResponse.data.data.gold_rate
        );
      }
    } catch (error) {
      console.error("Error in fetchData:", error);
      // Set default data on error
      setCollectionsData(defaultStatusImages);
      setSliderImages(
        dummyData.sliderImages.map((image, index) => ({
          id: index,
          image,
          title: `Slider ${index + 1}`,
        }))
      );
      Alert.alert(
        "Error",
        "Failed to fetch data. Please check your internet connection and try again.",
        [
          {
            text: "Retry",
            onPress: () => fetchData(true),
          },
          {
            text: "OK",
            style: "cancel",
          },
        ]
      );
    } finally {
      isRefreshing ? setRefreshing(false) : setIsLoading(false);
      setIsSliderLoading(false);
    }
  }, []);

  const FetchFlashNews = useCallback(async () => {
    const response = await api.get("flash-news/active");
    setFlashNews(response.data.data);
    //console.log(response.data.data);
  }, []);

  const fetchActiveSchemesCount = useCallback(async () => {
    try {
      if (!user?.id) {
        setActiveSchemesCount(0);
        setTotalGoldSavings(0);
        return;
      }
      const response = await api.get(`investments/user_investments/${user.id}`);
      const investments = response.data.data || [];
      setActiveSchemesCount(investments.length || 0);

      const totalGold = investments.reduce((sum: number, investment: any) => {
        const goldWeight = investment.totalgoldweight
          ? parseFloat(investment.totalgoldweight)
          : 0;
        return sum + goldWeight;
      }, 0);

      setTotalGoldSavings(totalGold);
    } catch (error) {
      console.error("Error fetching active schemes count:", error);
      setActiveSchemesCount(0);
      setTotalGoldSavings(0);
    }
  }, [user?.id]);

  // Effects
  useEffect(() => {
    //console.log('Initial data fetch...');
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    if (user) {
      //console.log('Fetching user data...');
      fetchActiveSchemesCount();
      FetchFlashNews();
    }
  }, [user, fetchActiveSchemesCount, FetchFlashNews]);

  useEffect(() => {
    if (user) {
      //console.log('Setting up notifications...');
      NotificationService.sendTokenToApi();
    }
  }, [user]);

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
  const handleRefresh = useCallback(() => fetchData(true), [fetchData]);

  const handleCloseBanner = useCallback(async () => {
    setShowFlashBanner(false);
    await AsyncStorage.setItem("flashBannerSeen", "true");
  }, []);

  // Render functions
  const renderBanner = useCallback(
    ({ item }: { item: Banner }) => (
      <TouchableOpacity
        style={styles.bannerItem}
        onPress={() => router.push(item.schemeUrl)}
        activeOpacity={0.9}
      >
        <Image
          source={item.image}
          style={styles.bannerImage}
          resizeMode="cover"
        />
      </TouchableOpacity>
    ),
    [router]
  );

  const renderStatusItem = useCallback(
    ({ item }: { item: Collection }) => (
      <TouchableOpacity
        style={styles.statusItem}
        onPress={() => {
          setSelectedCollection(item);
          setShowStatus(true);
        }}
      >
        <View style={styles.statusItemWrapper}>
          <View style={styles.statusImageContainer}>
            <Image
              source={
                typeof item.thumbnail === "string"
                  ? { uri: getFullImageUrl(item.thumbnail) }
                  : item.thumbnail
              }
              style={styles.statusImage}
              resizeMode="cover"
            />
          </View>
          <Text style={styles.statusItemName} numberOfLines={1}>
            {item.name}
          </Text>
        </View>
      </TouchableOpacity>
    ),
    [getFullImageUrl]
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar backgroundColor="#5a000b" barStyle="light-content" />
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
        <View style={styles.mainContainer}>
          <View style={styles.headerWrapper}>
            <AppHeader
              showBackButton={false}
              backRoute="index"
              showLanguageSwitcher={true}
            />
          </View>

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
              {ratesData?.data ? (
                <>
                  <View
                    style={[
                      styles.rateCard,
                      !ratesData.data.silver_rate && styles.singleRateCard,
                    ]}
                  >
                    <LiveRateCard
                      type={translations.gold}
                      rate={
                        ratesData.data.gold_rate || dummyData.rates.gold.price
                      }
                      lastupdated={formatDateToIndian(
                        ratesData.data.updated_at
                      )}
                      image={dummyData.rates.gold.image}
                      isSingle={!ratesData.data.silver_rate}
                    />
                  </View>
                  {ratesData.data.silver_rate && (
                    <View style={styles.rateCard}>
                      <LiveRateCard
                        type={translations.silver}
                        rate={ratesData.data.silver_rate}
                        lastupdated={formatDateToIndian(
                          ratesData.data.updated_at
                        )}
                        image={dummyData.rates.silver.image}
                      />
                    </View>
                  )}
                </>
              ) : (
                <View style={styles.rateWarningContainer}>
                  <View style={styles.rateWarningContent}>
                    <Ionicons name="warning" size={24} color="#FFD700" />
                    <View style={styles.rateWarningTextContainer}>
                      <Text style={styles.rateWarningTitle}>
                        Live Rates Unavailable
                      </Text>
                      <Text style={styles.rateWarningSubtitle}>
                        Please try again later
                      </Text>
                    </View>
                  </View>
                  <View style={styles.rateWarningRates}>
                    <View style={styles.rateWarningRateItem}>
                      <Text style={styles.rateWarningRateLabel}>Gold Rate</Text>
                      <Text style={styles.rateWarningRateValue}>0.00</Text>
                    </View>
                    <View style={styles.rateWarningDivider} />
                    <View style={styles.rateWarningRateItem}>
                      <Text style={styles.rateWarningRateLabel}>
                        Silver Rate
                      </Text>
                      <Text style={styles.rateWarningRateValue}>0.00</Text>
                    </View>
                  </View>
                </View>
              )}
            </View>

            <View style={styles.statusContainer}>
              <FlatList
                data={collectionsData}
                renderItem={renderStatusItem}
                keyExtractor={(item) => item.id.toString()}
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.statusListContent}
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
                fallbackMessages={[
                  translations.discountOffer20,
                  translations.newFeaturesAvailable,
                  translations.limitedTimeOffer,
                  translations.specialOffer20,
                ]}
                textColor="#fff"
                duration={8000}
              />

              <UserInfoCard
                userName={user?.name}
                activeSchemesCount={activeSchemesCount}
                totalGoldSavings={totalGoldSavings}
                onPress={() => router.push("/(tabs)/savings")}
              />

              <View style={styles.sectionHeader}>
                <View style={styles.sectionHeaderContent}>
                  <View style={styles.sectionHeaderLine} />
                  <Text style={styles.sectionHeaderText}>Active Schemes</Text>
                  <View style={styles.sectionHeaderLine} />
                </View>
                <Text style={styles.sectionHeaderSubtext}>
                  Explore our exclusive gold savings plans
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
                />
              </View>

              <YouTubeVideo />

              <SupportContactCard />
              <View style={styles.spacer} />
            </View>
          </ScrollView>

          <StatusView
            collections={collectionsData}
            isVisible={showStatus}
            initialCollectionIndex={
              selectedCollection
                ? collectionsData.findIndex(
                    (c) => c.id === selectedCollection.id
                  )
                : 0
            }
            onClose={() => {
              setShowStatus(false);
              setSelectedCollection(null);
            }}
          />
        </View>
      </ImageBackground>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
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
    padding: 10,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 20,
  },
  ratesContainer: {
    marginTop: moderateScale(50),
    paddingHorizontal: moderateScale(16),
    width: "100%",
    flexDirection: "row",
    justifyContent: "center",
    marginVertical: 10,
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
    paddingRight: 15,
  },
  bannerItem: {
    marginHorizontal: 5,
    borderRadius: 8,
    overflow: "hidden",
  },
  bannerImage: {
    width: screenWidth - 35,
    height: 200,
    borderRadius: 20,
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
  userAvatarContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    justifyContent: "center",
    alignItems: "center",
    marginLeft: 10,
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
    gap: 16,
    flex: 1,
  },
  statItem: {
    flex: 1,
    alignItems: "center",
  },
  statLabel: {
    fontSize: moderateScale(11),
    color: "rgba(255, 255, 255, 0.7)",
    marginBottom: 2,
  },
  statValue: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  countText: {
    fontSize: moderateScale(16),
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
});
