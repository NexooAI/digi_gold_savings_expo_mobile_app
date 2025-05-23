import { SafeAreaView } from "react-native-safe-area-context";
import React, { useEffect, useMemo, useState, useRef } from "react";
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
  PanResponder,
  FlatList,
  Image,
} from "react-native";
import { LinearGradient } from 'expo-linear-gradient';
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
import { schemes, rates } from "@/app/services/api";
import NetInfo from "@react-native-community/netinfo";
import { ScaledSheet, moderateScale } from "react-native-size-matters";
import { theme } from "@/constants/theme";
import AsyncStorage from '@react-native-async-storage/async-storage';
import FlashBanner from '@/app/components/FlashBanner';
import { Ionicons } from '@expo/vector-icons';

// Define interfaces for API response data
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

// Add UserInfoCard props interface
interface UserInfoCardProps {
  userName: string | undefined;
  activeSchemesCount: number;
  onPress: () => void;
}

// Add UserInfoCard component with proper types
const UserInfoCard: React.FC<UserInfoCardProps> = ({ userName, activeSchemesCount, onPress }) => (
  <TouchableOpacity 
    style={styles.userInfoCard}
    onPress={onPress}
    activeOpacity={0.8}
  >
    <View style={styles.userInfoContent}>
      <View style={styles.userInfoLeft}>
        <Ionicons name="person-circle-outline" size={40} color="#5a000b" />
        <Text style={styles.userName}>{userName || 'Guest User'}</Text>
      </View>
      <View style={styles.userInfoRight}>
        <Text style={styles.activeSchemesLabel}>Active Schemes</Text>
        <View style={styles.activeSchemesCount}>
          <Text style={styles.countText}>{activeSchemesCount || 0}</Text>
          <Ionicons name="chevron-forward" size={24} color="#5a000b" />
        </View>
      </View>
    </View>
  </TouchableOpacity>
);

export default function Home() {
  const { language, user } = useGlobalStore();
  const router = useRouter();
  const [schemeData, setSchemeData] = useState(null);
  const [ratesData, setRatesData] = useState<RatesData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [currentSlide, setCurrentSlide] = useState(0);
  const scrollX = useRef(new Animated.Value(0)).current;
  const sliderRef = useRef<FlatList<Banner>>(null);
  const { width: screenWidth } = Dimensions.get("window");
  const [showFlashBanner, setShowFlashBanner] = useState(true);
  const [activeSchemesCount, setActiveSchemesCount] = useState(0);

  // Date formatting utility
  const formatDateToIndian = (isoString: string | null | undefined) => {
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
  };

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

  // Data fetching function
  const fetchData = async (isRefreshing = false) => {
    try {
      isRefreshing ? setRefreshing(true) : setIsLoading(true);

      const [schemesResponse, liveRatesResponse] = await Promise.all([
        schemes.getSchemes(),
        rates.getLiveRates(),
      ]);

      setSchemeData(schemesResponse.data);
      setRatesData(liveRatesResponse.data);

      // Store gold rate in AsyncStorage
      if (liveRatesResponse.data?.data?.gold_rate) {
        await AsyncStorage.setItem('gold_rate', liveRatesResponse.data.data.gold_rate);
      }
    } catch (error) {
      console.error("Error fetching data:", error);
      Alert.alert("Error", "Failed to fetch updated data");
    } finally {
      isRefreshing ? setRefreshing(false) : setIsLoading(false);
    }
  };

  // Initial data load
  useEffect(() => {
    fetchData();
  }, []);

  // Refresh handler
  const handleRefresh = () => fetchData(true);

  // Network connectivity monitor
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

  // Fallback data
  const dummyData = {
    rates: {
      gold: {
        price: "7,315",
        purity: translations.goldPurity,
        image: theme.image.gold_image,
      },
      silver: {
        price: "101.00",
        purity: translations.silverPurity,
        image: theme.image.silver_image,
      },
    },
    sliderImages: theme.image.sliderImages,
  };

  const banners: Banner[] = [
    // {
    //   id: 1,
    //   image: require('../../../../../assets/images/banner1.jpg'),
    //   schemeUrl: '/(app)/(tabs)/home/schemes',
    // },
    {
      id: 2,
      image: require('../../../../../assets/images/banner.png'),
      schemeUrl: '/(app)/(tabs)/home/schemes',
    },
    {
      id: 3,
      image: require('../../../../../assets/images/banner2.png'),
      schemeUrl: '/(app)/(tabs)/home/schemes',
    },
  ];

  const renderBanner = ({ item }: { item: Banner }) => (
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
  );

  useEffect(() => {
    const checkBanner = async () => {
      const seen = await AsyncStorage.getItem('flashBannerSeen');
      if (!seen) setShowFlashBanner(true);
    };
    checkBanner();
  }, []);

  const handleCloseBanner = async () => {
    setShowFlashBanner(false);
    await AsyncStorage.setItem('flashBannerSeen', 'true');
  };

  // Update the fetchActiveSchemesCount function to use a mock count for now
  const fetchActiveSchemesCount = async () => {
    try {
      // TODO: Replace with actual API call when available
      // For now, using a mock count
      setActiveSchemesCount(2); // Mock count
    } catch (error) {
      console.error("Error fetching active schemes count:", error);
    }
  };

  // Add useEffect to fetch active schemes count
  useEffect(() => {
    if (user) {
      fetchActiveSchemesCount();
    }
  }, [user]);

  return (
    <SafeAreaView style={styles.safeArea}>
      {showFlashBanner && (
        <FlashBanner
          imageSource={require('../../../../../assets/images/flashbanner.png')}
          onClose={handleCloseBanner}
        />
      )}
      <View style={{ flex: 1, backgroundColor: '#fff' }}>
        {/* Fixed Header */}
        <View style={styles.headerWrapper}>
          <AppHeader showBackButton={false} backRoute="index" />
        </View>

        {/* Scrollable Content */}
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
          {/* Rates Display */}
          <View style={styles.ratesContainer}>
            {ratesData?.data ? (
              <>
                <View style={styles.rateCard}>
                  <LiveRateCard
                    type={translations.gold}
                    rate={
                      ratesData.data.gold_rate || dummyData.rates.gold.price
                    }
                    lastupdated={formatDateToIndian(ratesData.data.updated_at)}
                    image={dummyData.rates.gold.image}
                  />
                </View>
                <View style={styles.rateCard}>
                  <LiveRateCard
                    type={translations.silver}
                    rate={
                      ratesData.data.silver_rate || dummyData.rates.silver.price
                    }
                    lastupdated={formatDateToIndian(ratesData.data.updated_at)}
                    image={dummyData.rates.silver.image}
                  />
                </View>
              </>
            ) : (
              <Text style={styles.loadingText}>{t("loadingRates")}</Text>
            )}
          </View>

          {/* Main Content */}
          <View style={styles.mainContent}>
            <ImageSlider images={dummyData.sliderImages} />

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

            {/* User Info Card */}
            <UserInfoCard 
              userName={user?.name}
              activeSchemesCount={activeSchemesCount}
              onPress={() => router.push('/(app)/(tabs)/savings/index')}
            />

            {/* <ProductsList schemes={schemeData} /> */}

            {/* Banner List */}
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

        <View style={styles.languageSwitcherContainer}>
          <LanguageSwitcher />
        </View>
      </View>
    </SafeAreaView>
  );
}

// Styles
const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#C0C0C0",
  },
  background: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#C0C0C0",
  },
  headerWrapper: {
    width: "100%",
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    padding: 10,
    // Optionally, add a border for debugging:
    // borderWidth: 1,
    // borderColor: 'red',
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
    justifyContent: "space-around",
    marginVertical: 10,
  },
  rateCard: {
    flex: 1,
    margin: 5,
    alignItems: "center",
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
  flashOffer: {
    backgroundColor: "#B71C1C",
    paddingVertical: moderateScale(12),
  },
  spacer: {
    height: moderateScale(80),
    // backgroundColor: "#FFFFFF",
  },
  supportCard: {
    marginHorizontal: moderateScale(16),
    marginTop: moderateScale(16),
  },
  languageSwitcherContainer: {
    position: 'absolute',
    bottom: 30,
    right: 20,
    zIndex: 999,
  },
  goldSchemesButton: {
    width: '100%',
    height: 120,
    marginVertical: 10,
    overflow: 'hidden',
  },
  goldSchemesGradient: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  goldSchemesText: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: 'bold',
    textShadowColor: 'rgba(0, 0, 0, 0.75)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 3,
  },
  bannerContainer: {
    width: '100%',
    marginVertical: 10,
  },
  bannerListContent: {
    paddingHorizontal: 10,
  },
  bannerItem: {
    marginHorizontal: 5,
    borderRadius: 8,
    overflow: 'hidden',
  },
  bannerImage: {
    width: Dimensions.get('window').width - 40,
    height: 200,
    borderRadius: 8,
  },
  userInfoCard: {
    width: '90%',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginVertical: 10,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#f0f0f0',
  },
  userInfoContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  userInfoLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  userInfoRight: {
    alignItems: 'flex-end',
  },
  userName: {
    fontSize: moderateScale(16),
    fontWeight: '600',
    color: '#333',
  },
  activeSchemesLabel: {
    fontSize: moderateScale(12),
    color: '#666',
    marginBottom: 4,
  },
  activeSchemesCount: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  countText: {
    fontSize: moderateScale(20),
    fontWeight: 'bold',
    color: '#5a000b',
  },
});
