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
  StatusBar,
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
import api, { schemes, rates, collections } from "@/app/services/api";
import NetInfo from "@react-native-community/netinfo";
import { ScaledSheet, moderateScale } from "react-native-size-matters";
import { theme } from "@/constants/theme";
import AsyncStorage from '@react-native-async-storage/async-storage';
import FlashBanner from '@/app/components/FlashBanner';
import { Ionicons } from '@expo/vector-icons';
import StatusView from '@/app/components/StatusView';
import NotificationService from '@/services/NotificationService';

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
  totalGoldSavings?: number;
}

// Add UserInfoCard component with proper types
const UserInfoCard: React.FC<UserInfoCardProps> = ({ userName, activeSchemesCount, onPress, totalGoldSavings = 0 }) => (
  <TouchableOpacity 
    style={styles.userInfoCard}
    onPress={onPress}
    activeOpacity={0.8}
  >
    <LinearGradient
      colors={['#850111', '#5a000b']}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.userInfoGradient}
    >
      {/* First Row - Welcome and User Info */}
      <View style={styles.userInfoTopRow}>
        <View style={styles.welcomeContainer}>
          <Text style={styles.welcomeText}>Welcome back,</Text>
          <Text style={styles.userName}>{userName || 'Guest User'}</Text>
        </View>
        <View style={styles.userAvatarContainer}>
          <Ionicons name="person-circle" size={45} color="#FFD700" />
        </View>
      </View>

      {/* Second Row - Stats */}
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
              <Text style={styles.countText}>{totalGoldSavings.toFixed(3)}</Text>
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
);

// Add Collection interface
interface Collection {
  id: number;
  name: string;
  thumbnail: string;
  status_images: string[];
  created_at: string;
  updated_at: string;
}

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
  const [selectedStatusIndex, setSelectedStatusIndex] = useState<number | null>(null);
  const [showStatus, setShowStatus] = useState(false);
  const [collectionsData, setCollectionsData] = useState<Collection[]>([]);
  const [selectedCollection, setSelectedCollection] = useState<Collection | null>(null);
  const [totalGoldSavings, setTotalGoldSavings] = useState(0);

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

      const [schemesResponse, liveRatesResponse, collectionsResponse] = await Promise.all([
        schemes.getSchemes(),
        rates.getLiveRates(),
        collections.getCollections(),
      ]);

      setSchemeData(schemesResponse.data);
      setRatesData(liveRatesResponse.data);
      setCollectionsData(collectionsResponse.data.data);

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

  const statusImages = [
    require('../../../../../assets/images/status1.jpg'),
    require('../../../../../assets/images/status2.jpg'),
    require('../../../../../assets/images/status3.jpg'),
    require('../../../../../assets/images/status4.jpg'),
    require('../../../../../assets/images/status5.jpg'),
    require('../../../../../assets/images/status6.jpg'),
    require('../../../../../assets/images/status7.jpg'),
    require('../../../../../assets/images/status8.jpg'),
    require('../../../../../assets/images/status9.jpg'),
    require('../../../../../assets/images/status10.jpg'),
    require('../../../../../assets/images/status11.jpg'),
    require('../../../../../assets/images/status12.jpg'),
    require('../../../../../assets/images/status13.jpg'),
    require('../../../../../assets/images/status14.jpg'),
    require('../../../../../assets/images/status15.jpg'),
    require('../../../../../assets/images/status16.jpg'),
    require('../../../../../assets/images/status17.jpg'),
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

  // Add function to get full image URL
  const getFullImageUrl = (path: string) => {
    if (!path) return '';
    if (path.startsWith('http')) return path;
    return `${theme.baseUrl}/${path}`;
  };

  // Update renderStatusItem to use full image URL
  const renderStatusItem = ({ item, index }: { item: Collection, index: number }) => (
    <TouchableOpacity
      style={styles.statusItem}
      onPress={() => {
        setSelectedCollection(item);
        setShowStatus(true);
      }}
    >
      <Image
        source={{ uri: getFullImageUrl(item.thumbnail) }}
        style={styles.statusImage}
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

  // Update the fetchActiveSchemesCount function to include total gold savings
  const fetchActiveSchemesCount = async () => {
    try {
      if (!user?.id) {
        setActiveSchemesCount(0);
        setTotalGoldSavings(0);
        return;
      }
      const response = await api.get(`investments/user_investments/${user.id}`);
      console.log('User investments response:', response.data);
      const investments = response.data.data || [];
      setActiveSchemesCount(investments.length || 0);
      
      // Calculate total gold savings
      const totalGold = investments.reduce((sum: number, investment: any) => {
        // Check if totalgoldweight exists and is a valid number
        const goldWeight = investment.totalgoldweight ? parseFloat(investment.totalgoldweight) : 0;
        console.log('Investment gold weight:', goldWeight, 'for investment:', investment);
        return sum + goldWeight;
      }, 0);
      
      console.log('Total gold weight calculated:', totalGold);
      setTotalGoldSavings(totalGold);
    } catch (error) {
      console.error("Error fetching active schemes count:", error);
      setActiveSchemesCount(0);
      setTotalGoldSavings(0);
    }
  };

  // Add useEffect to fetch active schemes count
  useEffect(() => {
    if (user) {
      fetchActiveSchemesCount();
    }
  }, [user]);

  // Add useEffect to send FCM token when home page loads
  useEffect(() => {
    if (user) {
      NotificationService.sendTokenToApi();
    }
  }, [user]);

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar
        backgroundColor="#5a000b"
        barStyle="light-content"
      />
      <ImageBackground
        source={require('../../../../../assets/images/bg_new.jpg')}
        style={styles.backgroundImage}
        resizeMode="contain"
      >
        {showFlashBanner && (
          <FlashBanner
            imageSource={require('../../../../../assets/images/flashbanner.png')}
            onClose={handleCloseBanner}
          />
        )}
        <View style={{ flex: 1, backgroundColor: 'rgba(255, 255, 255, 0.1)' }}>
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
                  <View style={[styles.rateCard, !ratesData.data.silver_rate && styles.singleRateCard]}>
                    <LiveRateCard
                      type={translations.gold}
                      rate={
                        ratesData.data.gold_rate || dummyData.rates.gold.price
                      }
                      lastupdated={formatDateToIndian(ratesData.data.updated_at)}
                      image={dummyData.rates.gold.image}
                      isSingle={!ratesData.data.silver_rate}
                    />
                  </View>
                  {ratesData.data.silver_rate && (
                    <View style={styles.rateCard}>
                      <LiveRateCard
                        type={translations.silver}
                        rate={ratesData.data.silver_rate}
                        lastupdated={formatDateToIndian(ratesData.data.updated_at)}
                        image={dummyData.rates.silver.image}
                      />
                    </View>
                  )}
                </>
              ) : (
                <Text style={styles.loadingText}>{t("loadingRates")}</Text>
              )}
            </View>

            {/* Add this after the rates container */}
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
                totalGoldSavings={totalGoldSavings}
                onPress={() => router.push('/(tabs)/savings')}
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

        <StatusView
          images={selectedCollection?.status_images.map(img => getFullImageUrl(img)) || []}
          isVisible={showStatus}
          initialIndex={0}
          collectionName={selectedCollection?.name}
          onClose={() => {
            setShowStatus(false);
            setSelectedCollection(null);
          }}
        />
      </ImageBackground>
    </SafeAreaView>
  );
}

// Styles
const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  backgroundImage: {
    flex: 1,
    width: '100%',
    height: '100%',
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
    borderRadius: 16,
    marginVertical: 10,
    overflow: 'hidden',
    elevation: 5,
    shadowColor: '#000',
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  welcomeContainer: {
    flex: 1,
  },
  welcomeText: {
    fontSize: moderateScale(14),
    color: 'rgba(255, 255, 255, 0.7)',
    marginBottom: 4,
  },
  userName: {
    fontSize: moderateScale(22),
    fontWeight: '700',
    color: '#FFFFFF',
  },
  userAvatarContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 12,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
    borderRadius: 12,
    padding: 12,
  },
  statsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    flex: 1,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statLabel: {
    fontSize: moderateScale(12),
    color: 'rgba(255, 255, 255, 0.7)',
    marginBottom: 4,
  },
  statValue: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  countText: {
    fontSize: moderateScale(18),
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  unitText: {
    fontSize: moderateScale(14),
    color: '#FFD700',
    fontWeight: '600',
  },
  statDivider: {
    width: 1,
    height: 30,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  viewMoreContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginLeft: 12,
  },
  viewMoreText: {
    fontSize: moderateScale(12),
    color: '#FFD700',
    fontWeight: '600',
  },
  statusContainer: {
    width: '100%',
    marginVertical: 10,
  },
  statusListContent: {
    paddingHorizontal: 10,
  },
  statusItem: {
    marginHorizontal: 5,
    borderRadius: 20,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: '#850111',
  },
  statusImage: {
    width: 60,
    height: 60,
    borderRadius: 18,
  },
});
