import { SafeAreaView } from "react-native-safe-area-context";
import React, { useEffect, useMemo, useState } from "react";
import {
  View,
  ImageBackground,
  ScrollView,
  Text,
  Alert,
  Dimensions,
  RefreshControl,
} from "react-native";
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
        image: theme.image.gold_image,
      },
    },
    sliderImages: theme.image.sliderImages,
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ImageBackground
        source={theme.image.menu_bg}
        resizeMode="repeat"
        style={styles.background}
        imageStyle={styles.backgroundImage}
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

            <YouTubeVideo />

            <SupportContactCard />

            <View style={styles.spacer} />

            <LanguageSwitcher />
          </View>
        </ScrollView>
      </ImageBackground>
    </SafeAreaView>
  );
}

// Styles
const styles = ScaledSheet.create({
  safeArea: {
    flex: 1,
  },
  background: {
    flex: 1,
  },
  backgroundImage: {
    width: "100%",
    height: "100%",
    opacity: 0.98,
  },
  headerWrapper: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
    backgroundColor: "transparent",
    paddingHorizontal: moderateScale(16),
  },
  scrollContent: {
    flexGrow: 1,
    paddingTop: moderateScale(100),
  },
  ratesContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: moderateScale(16),
    marginBottom: moderateScale(5),
  },
  rateCard: {
    flex: 1,
    minWidth: "50%",
    maxWidth: "50%",
    marginBottom: moderateScale(5),
  },
  mainContent: {
    flex: 1,
    backgroundColor: "#FFFFFF",
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
});
