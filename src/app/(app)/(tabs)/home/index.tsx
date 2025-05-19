import { SafeAreaView } from "react-native-safe-area-context";
import React, { useEffect, useMemo, useState } from "react";
import {
  View,
  ScrollView,
  Text,
  Alert,
  Dimensions,
  RefreshControl,
  TouchableOpacity,
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

export default function Home() {
  const { language, user } = useGlobalStore();
  const router = useRouter();
  const [schemeData, setSchemeData] = useState(null);
  const [ratesData, setRatesData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const { width } = Dimensions.get("window");

  // Date formatting utility
  const formatDateToIndian = (isoString) => {
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

  return (
    <SafeAreaView style={styles.safeArea}>
      <LinearGradient
        colors={['#5a000b', '#2e0406']}
        style={styles.background}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
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
              messages={[
                translations.discountOffer20,
                translations.newFeaturesAvailable,
                translations.limitedTimeOffer,
                translations.specialOffer20,
              ]}
              textColor="#fff"
              duration={8000}
            />

            <ProductsList schemes={schemeData} />

            {/* Gold Schemes Button */}
            <TouchableOpacity
              style={styles.goldSchemesButton}
              onPress={() => router.push("/(app)/(tabs)/home/schemes")}
            >
              <LinearGradient
                colors={['#D4AF37', '#FFD700']}
                style={styles.goldSchemesGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
              >
                <Text style={styles.goldSchemesText}>{translations.goldSchemes}</Text>
              </LinearGradient>
            </TouchableOpacity>
            
            <YouTubeVideo />

            <SupportContactCard />

            <View style={styles.spacer} />
          </View>
        </ScrollView>

        <View style={styles.languageSwitcherContainer}>
          <LanguageSwitcher />
        </View>
      </LinearGradient>
    </SafeAreaView>
  );
}

// Styles
const styles = ScaledSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#5a000b",
  },
  background: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
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
    width: '90%',
    marginVertical: moderateScale(16),
    borderRadius: moderateScale(8),
    overflow: 'hidden',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  goldSchemesGradient: {
    paddingVertical: moderateScale(16),
    paddingHorizontal: moderateScale(24),
    alignItems: 'center',
    justifyContent: 'center',
  },
  goldSchemesText: {
    color: '#000000',
    fontSize: moderateScale(16),
    fontWeight: '600',
    textTransform: 'uppercase',
  },
});
