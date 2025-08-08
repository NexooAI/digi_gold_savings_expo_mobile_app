import React, { useEffect, useMemo, useState, useRef, useCallback } from "react";
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
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { ScaledSheet, moderateScale } from "react-native-size-matters";

// Import brand configuration
import { brandConfig, brandTheme, getCurrentBrand } from "@/core/config/BrandConfig.js";
import { createBrandedStyles, createBannerCardStyles, getComponentStyles, getAnimationConfig } from "@/utils/brandStyles";

// Import components
import LanguageSwitcher from "@/contexts/LanguageSwitcher";
import LiveRateCard from "@/app/components/LiveRateCard";
import ImageSlider from "@/app/components/ImageSlider";
import { t } from "@/i18n";
import AppHeader from "@/app/components/AppHeader";
import InvestmentCards from "@/app/components/Products";
import FlashOffer from "@/app/components/FlashOffer";
import YouTubeVideo from "@/app/components/YouTubeVideo";
import SupportContactCard from "@/app/components/SupportContactCard";
import SocialMediaCard from "@/app/components/SocialMediaCard";
import useGlobalStore from "@/store/global.store";
import api from "@/services/api";
import NetInfo from "@react-native-community/netinfo";
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
  checkForContinuousCalls
} from "@/utils/apiLogger";

// Constants
const { width: screenWidth } = Dimensions.get("window");
const STATUS_IMAGE_SIZE = 70;
const STATUS_BORDER_RADIUS = 35;
const REFRESH_INTERVAL = 15000; // 15 seconds

// Brand-specific background images mapping
const getBrandBackgroundImage = (brand: string) => {
  const brandBackgrounds = {
    'akilajewellers': require('@/brands/akilajewellers/assets/images/bg_login.jpg'),
    'dc-jewellers': require('@/brands/dc-jewellers/assets/images/bg_login.jpg'),
    'srimurugangoldhouse': require('@/brands/srimurugangoldhouse/assets/images/bg_login.jpg'),
  };
  return brandBackgrounds[brand as keyof typeof brandBackgrounds] || brandBackgrounds['akilajewellers'];
};

// Brand-specific home page component
const BrandedHomePage: React.FC = () => {
  const currentBrand = getCurrentBrand();
  const theme = brandTheme;
  
  // State management
  const [homeData, setHomeData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [collectionsData, setCollectionsData] = useState<Collection[]>([]);
  const [showStatus, setShowStatus] = useState(false);
  const [selectedCollection, setSelectedCollection] = useState<Collection | null>(null);
  const [userInfo, setUserInfo] = useState<any>(null);
  const [profilePhoto, setProfilePhoto] = useState<string | null>(null);
  const [isOnline, setIsOnline] = useState(true);
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());
  const [refreshCount, setRefreshCount] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const router = useRouter();
  const globalStore = useGlobalStore();
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;

  // Brand-specific styles
  const styles = useMemo(() => createBrandedStyles(theme), [theme]);
  const bannerStyles = useMemo(() => createBannerCardStyles(theme), [theme]);
  const animationConfig = useMemo(() => getAnimationConfig(), []);

  // API call monitoring
  useEffect(() => {
    const intervalId = monitorEndpoint('/home', 5000);

    return () => {
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, []);

  // Network status monitoring
  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener(state => {
      setIsOnline(state.isConnected ?? false);
    });

    return () => unsubscribe();
  }, []);

  // Auto-refresh functionality
  useEffect(() => {
    const interval = setInterval(() => {
      if (isOnline && !loading) {
        setRefreshCount(prev => prev + 1);
        fetchHomeData();
      }
    }, REFRESH_INTERVAL);

    return () => clearInterval(interval);
  }, [isOnline, loading]);

  // Fetch home data
  const fetchHomeData = useCallback(async () => {
    try {
      setError(null);
      const response = await api.get('/home');
      
      if (response.data.success) {
        setHomeData(response.data);
        setCollectionsData(response.data.data.collections || []);
        
        // Log successful API call
        logApiSummary('Home API', 'SUCCESS', response.data);
      } else {
        setError('Failed to fetch home data');
        logApiSummary('Home API', 'ERROR', response.data);
      }
    } catch (error: any) {
      console.error('Error fetching home data:', error);
      setError(error.message || 'Network error');
      logApiSummary('Home API', 'ERROR', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
      setLastRefresh(new Date());
    }
  }, []);

  // Initial data fetch
  useEffect(() => {
    fetchHomeData();
    fetchUserInfo();
  }, [fetchHomeData]);

  // Fetch user info
  const fetchUserInfo = async () => {
    try {
      const userData = await AsyncStorage.getItem('userInfo');
      if (userData) {
        setUserInfo(JSON.parse(userData));
      }
    } catch (error) {
      console.error('Error fetching user info:', error);
    }
  };

  // Handle refresh
  const handleRefresh = useCallback(() => {
    setRefreshing(true);
    fetchHomeData();
  }, [fetchHomeData]);

  // Handle collection selection
  const handleCollectionPress = useCallback((collection: Collection) => {
    setSelectedCollection(collection);
    setShowStatus(true);
  }, []);

  const handleStatusClose = useCallback(() => {
    setShowStatus(false);
    setSelectedCollection(null);
  }, []);

  // Render banner item
  const renderBanner = useCallback(({ item }: { item: Banner }) => (
    <BannerCard item={item} router={router} styles={bannerStyles} />
  ), [router, bannerStyles]);

  // Animated entrance
  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: animationConfig.finalOpacity || 1,
        duration: animationConfig.duration || 800,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: animationConfig.finalScale || 1,
        duration: animationConfig.duration || 800,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
    ]).start();
  }, [fadeAnim, scaleAnim, animationConfig]);

  // Loading component
  if (loading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <ImageBackground
          source={getBrandBackgroundImage(currentBrand)}
          style={styles.backgroundImage}
        >
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={theme.colors.primary} />
            <Text style={styles.loadingText}>{t('loading')}</Text>
          </View>
        </ImageBackground>
      </SafeAreaView>
    );
  }

  return (
    <AuthGuard>
      <SafeAreaView style={styles.safeArea}>
        <StatusBar barStyle="light-content" backgroundColor={theme.colors.primary} />
        <ImageBackground
          source={getBrandBackgroundImage(currentBrand)}
          style={styles.backgroundImage}
        >
          <View style={styles.mainContainer}>
            <Animated.View
              style={[
                styles.animatedContainer,
                {
                  opacity: fadeAnim,
                  transform: [{ scale: scaleAnim }],
                },
              ]}
            >
              <View style={styles.headerWrapper}>
                <AppHeader />
                <LanguageSwitcher style={styles.languageSwitcherHeader} />
              </View>

              <ScrollView
                style={styles.scrollView}
                contentContainerStyle={styles.scrollContent}
                refreshControl={
                  <RefreshControl
                    refreshing={refreshing}
                    onRefresh={handleRefresh}
                    tintColor={theme?.colors?.primary || '#007AFF'}
                    colors={[theme?.colors?.primary || '#007AFF']}
                  />
                }
                showsVerticalScrollIndicator={false}
              >
                <View style={styles.mainContent}>
                  {/* User Info Card */}
                  <UserInfoCard
                    userName={userInfo?.name}
                    activeSchemesCount={userInfo?.activeSchemes || 0}
                    onPress={() => router.push("/(app)/(tabs)/savings")}
                    totalGoldSavings={userInfo?.totalGoldSavings}
                    totalAmount={userInfo?.totalAmount}
                    showTotalGold={true}
                    userId={userInfo?.id || 0}
                    profilePhoto={profilePhoto}
                    styles={styles}
                    theme={theme}
                  />

                  {/* Live Rates */}
                  <View style={styles.ratesContainer}>
                    <LiveRateCard
                      type="Gold"
                      rate={homeData?.data?.currentRates?.gold_rate || "0"}
                      lastupdated={homeData?.data?.currentRates?.updated_at || ""}
                      image={require('../../assets/images/gold.png')}
                      isSingle={!homeData?.data?.currentRates?.silver_rate}
                    />
                    {homeData?.data?.currentRates?.silver_rate && (
                      <LiveRateCard
                        type="Silver"
                        rate={homeData?.data?.currentRates?.silver_rate || "0"}
                        lastupdated={homeData?.data?.currentRates?.updated_at || ""}
                        image={require('../../assets/images/silver.png')}
                      />
                    )}
                  </View>

                  {/* Flash Banner */}
                  <FlashBanner 
                    message={homeData?.data?.flashNews?.[0]?.message}
                    imageSource={require('../../assets/images/flashbanner.png')}
                  />

                  {/* Image Slider */}
                  <ImageSlider
                    images={homeData?.data?.posters || []}
                  />

                  {/* Flash Offers */}
                  <FlashOffer 
                    fallbackMessages={homeData?.data?.initialPopups?.map((popup: any) => popup.message) || ["🎉 Welcome to Digital Gold Savings!"]}
                    textColor="#fff"
                    duration={8000}
                  />

                  {/* Products */}
                  <InvestmentCards
                    schemes={{ data: collectionsData }}
                  />

                  {/* Schemes Section */}
                  <View style={styles.schemesSection}>
                    <View style={styles.sectionHeader}>
                      <View style={styles.sectionHeaderContent}>
                        <Text style={styles.sectionHeaderText}>{t('activeSchemes')}</Text>
                        <View style={styles.sectionHeaderLine} />
                      </View>
                      <Text style={styles.sectionHeaderSubtext}>{t('exploreGoldSavingsPlans')}</Text>
                    </View>

                    <View style={styles.bannerContainer}>
                      <FlatList
                        data={getBrandBanners(currentBrand)}
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
                  </View>

                  {/* YouTube Videos */}
                  <YouTubeVideo videos={homeData?.data?.videos} />

                  {/* Social Media */}
                  <SocialMediaCard />
                  
                  {/* Support Contact */}
                  <SupportContactCard />
                  
                  <View style={styles.spacer} />
                </View>
              </ScrollView>

              {/* Status View */}
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
            </Animated.View>
          </View>
        </ImageBackground>
      </SafeAreaView>
    </AuthGuard>
  );
};

// Brand-specific banner data
const getBrandBanners = (brand: string): Banner[] => {
  const brandBanners = {
    'akilajewellers': [
      {
        id: 1,
        image: require('@/brands/akilajewellers/assets/images/banner.png'),
        schemeUrl: "/(app)/(tabs)/home/schemes",
      },
      {
        id: 2,
        image: require('@/brands/akilajewellers/assets/images/banner2.png'),
        schemeUrl: "/(app)/(tabs)/home/schemes",
      },
    ],
    'dc-jewellers': [
      {
        id: 1,
        image: require('@/brands/dc-jewellers/assets/images/banner.png'),
        schemeUrl: "/(app)/(tabs)/home/schemes",
      },
      {
        id: 2,
        image: require('@/brands/dc-jewellers/assets/images/banner2.png'),
        schemeUrl: "/(app)/(tabs)/home/schemes",
      },
    ],
    'srimurugangoldhouse': [
      {
        id: 1,
        image: require('@/brands/srimurugangoldhouse/assets/images/banner.png'),
        schemeUrl: "/(app)/(tabs)/home/schemes",
      },
      {
        id: 2,
        image: require('@/brands/srimurugangoldhouse/assets/images/banner2.png'),
        schemeUrl: "/(app)/(tabs)/home/schemes",
      },
    ],
  };

  return brandBanners[brand as keyof typeof brandBanners] || brandBanners['akilajewellers'];
};



// User Info Card Component
interface UserInfoCardProps {
  userName: string | undefined;
  activeSchemesCount: number;
  onPress: () => void;
  totalGoldSavings?: number;
  totalAmount?: number;
  showTotalGold?: boolean;
  userId: number;
  profilePhoto?: string;
  styles: any;
  theme: any;
}

const UserInfoCard: React.FC<UserInfoCardProps> = ({
  userName,
  activeSchemesCount,
  onPress,
  totalGoldSavings,
  totalAmount,
  showTotalGold,
  userId,
  profilePhoto,
  styles,
  theme,
}) => {

  return (
    <TouchableOpacity style={styles.userInfoCard} onPress={onPress}>
      <View style={styles.userInfoContent}>
        <View style={styles.userInfoLeft}>
          <Text style={styles.welcomeText}>{t('welcome')}</Text>
          <Text style={styles.userName}>{userName || t('guest')}</Text>
          <Text style={styles.schemesCount}>
            {activeSchemesCount} {t('activeSchemes')}
          </Text>
        </View>
        <View style={styles.userInfoRight}>
          {profilePhoto ? (
            <Image source={{ uri: profilePhoto }} style={styles.profileImage} />
          ) : (
            <View style={[styles.profileImage, { backgroundColor: theme.colors.secondary }]} />
          )}
          {showTotalGold && totalGoldSavings && (
            <>
              <Text style={styles.totalGoldText}>{t('totalGold')}</Text>
              <Text style={styles.totalGoldValue}>
                {formatGoldWeight(totalGoldSavings)} {t('grams')}
              </Text>
            </>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
};

// Banner Card Component
interface BannerCardProps {
  item: Banner;
  router: ReturnType<typeof useRouter>;
  styles: any;
}

const BannerCard: React.FC<BannerCardProps> = ({ item, router, styles }) => {

  return (
    <View style={styles.bannerCard}>
      <View style={styles.bannerImageWrapper}>
        <Image source={item.image} style={styles.bannerImage} />
      </View>
      <View style={styles.bannerButtonRow}>
        <TouchableOpacity
          style={styles.aboutSchemesButton}
          onPress={() => router.push(item.schemeUrl)}
        >
          <Text style={styles.aboutSchemesButtonText}>{t('aboutSchemes')}</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.joinNowButton}
          onPress={() => router.push("/(app)/(tabs)/home/join_savings")}
        >
          <Text style={styles.joinNowButtonText}>{t('joinNow')}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

// Interfaces
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

export default BrandedHomePage; 