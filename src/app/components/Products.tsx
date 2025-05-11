import React, { useMemo, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  Image,
  Dimensions,
  StyleSheet,
  Animated,
} from "react-native";
import { router, useRouter } from "expo-router";
import { t } from "@/i18n";
import useGlobalStore from "@/store/global.store";
import { LinearGradient } from "expo-linear-gradient";
import { theme } from "@/constants/theme";

interface Scheme {
  SCHEMEID: number;
  SCHEMENAME: string;
  SCHEMETYPE: string;
  DESCRIPTION: string;
  SLOGAN: string;
  IMAGE: string;
  ICON: string;
  chits: Array<any>;
}

interface CardProps {
  item: Scheme;
  index: number;
}

const SCREEN_WIDTH = Dimensions.get("window").width;
const CARD_WIDTH = SCREEN_WIDTH * 0.85;
const BANNER_HEIGHT = 40;

const CardComponent = ({ item, index }: CardProps) => {
  const router = useRouter();
  const [fallback, setFallback] = useState(false);
  const [bannerFallback, setBannerFallback] = useState(false);
  const [pressed, setPressed] = useState(false);

  // Animation for card press
  const scaleAnim = new Animated.Value(1);

  const handlePressIn = () => {
    setPressed(true);
    Animated.spring(scaleAnim, {
      toValue: 0.96,
      friction: 5,
      tension: 40,
      useNativeDriver: true,
    }).start();
  };

  const handlePressOut = () => {
    setPressed(false);
    Animated.spring(scaleAnim, {
      toValue: 1,
      friction: 3,
      tension: 40,
      useNativeDriver: true,
    }).start();
  };

  return (
    <Animated.View
      style={[
        {
          width: CARD_WIDTH,
          transform: [{ scale: scaleAnim }],
        },
        styles.cardContainer,
      ]}
      className="mr-4"
    >
      <View className="relative">
        <LinearGradient
          colors={["#1a1a1a", "#2d2d2d"]}
          style={styles.cardGradient}
          className="rounded-3xl shadow-2xl overflow-hidden"
        >
          <Image
            source={require("../../../assets/images/scheme_card_bg.png")}
            style={styles.backgroundImage}
            resizeMode="cover"
          />
          <LinearGradient
            colors={['rgba(0,0,0,0.4)', 'rgba(0,0,0,0.6)']}
            style={styles.contentOverlay}
          >
            <View style={styles.bannerContainer}>
              <Image
                source={
                  bannerFallback
                    ? theme.image.bannerPlaceholder
                    : { uri: `${theme.baseUrl}/banners/${item.SCHEMETYPE.toLowerCase()}_banner.png` }
                }
                style={styles.bannerImage}
                resizeMode="cover"
                onError={() => setBannerFallback(true)}
              />
              <LinearGradient
                colors={['rgba(0,0,0,0.5)', 'transparent']}
                style={styles.bannerOverlay}
              />
              <View style={styles.schemeTypeTag}>
                <Text style={styles.schemeTypeText}>{item.SCHEMETYPE}</Text>
              </View>
            </View>

            <View className="p-4">
              <View className="items-center justify-center">
                <Text
                  style={styles.schemeName}
                  className="text-white text-lg font-bold text-center"
                >
                  {item.SCHEMENAME}
                </Text>
                <Text className="text-gray-300 text-sm text-center mt-1">
                  {item.SLOGAN}
                </Text>

                <View style={styles.separator} />

                <View className="flex-row justify-between space-x-2 mt-4 w-full">
                  <TouchableOpacity
                    className="flex-1 border border-[#850111] rounded-full py-2 mr-2"
                    style={styles.knowMoreButton}
                    onPress={() =>
                      router.push({
                        pathname: "/home/productsdetails",
                        params: { schemeId: item.SCHEMEID },
                      })
                    }
                    onPressIn={handlePressIn}
                    onPressOut={handlePressOut}
                  >
                    <Text className="text-white text-center text-sm font-semibold">
                      {t("knowMore")}
                    </Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity
                    className="flex-1 rounded-full py-2"
                    style={styles.joinButton}
                    onPress={() =>
                      router.push({
                        pathname: "/home/join_savings",
                        params: {
                          schemeId: item.SCHEMEID,
                          schemeData: JSON.stringify({
                            name: item.SCHEMENAME,
                            description: item.DESCRIPTION,
                            type: item.SCHEMETYPE,
                            chit: item.chits,
                          }),
                        },
                      })
                    }
                    onPressIn={handlePressIn}
                    onPressOut={handlePressOut}
                  >
                    <Text className="text-white text-center text-sm font-semibold">
                      {t("joinNow")}
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </LinearGradient>
        </LinearGradient>
      </View>
    </Animated.View>
  );
};

interface InvestmentCardsProps {
  schemes: { data: Scheme[] } | null;
}

const InvestmentCards = ({ schemes }: InvestmentCardsProps) => {
  const { language } = useGlobalStore();

  if (!schemes?.data?.length) {
    return (
      <View className="p-4">
        <Text className="text-gray-500 text-center">No schemes available</Text>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-white" style={{ margin: 0 }}>
      <FlatList
        data={schemes.data}
        horizontal
        keyExtractor={(item) => item.SCHEMEID.toString()}
        renderItem={({ item, index }) => (
          <CardComponent item={item} index={index} />
        )}
        contentContainerStyle={{
          paddingHorizontal: 16,
          paddingVertical: 24,
        }}
        snapToInterval={CARD_WIDTH + 16}
        decelerationRate="fast"
        showsHorizontalScrollIndicator={false}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  cardContainer: {
    elevation: 12,
    shadowColor: "#850111",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    backgroundColor: 'transparent',
  },
  cardGradient: {
    borderRadius: 24,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  backgroundImage: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    opacity: 0.9,
  },
  contentOverlay: {
    width: '100%',
    height: '100%',
    backgroundColor: 'transparent',
  },
  bannerContainer: {
    height: BANNER_HEIGHT,
    width: "100%",
    position: "relative",
  },
  bannerImage: {
    width: "100%",
    height: "100%",
  },
  bannerOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: BANNER_HEIGHT,
  },
  schemeTypeTag: {
    position: "absolute",
    right: 10,
    bottom: 5,
    backgroundColor: "rgba(133,1,17,0.9)",
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  schemeTypeText: {
    color: "white",
    fontSize: 10,
    fontWeight: "bold",
    textShadowColor: 'rgba(0,0,0,0.3)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  separator: {
    height: 1,
    backgroundColor: "rgba(255,255,255,0.15)",
    width: "80%",
    marginTop: 8,
    shadowColor: "#850111",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },
  schemeName: {
    textShadowColor: "rgba(0, 0, 0, 0.5)",
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 3,
  },
  knowMoreButton: {
    elevation: 4,
    shadowColor: "#850111",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    backgroundColor: "rgba(255,255,255,0.1)",
    borderWidth: 1,
    borderColor: '#850111',
  },
  joinButton: {
    elevation: 5,
    shadowColor: "#850111",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    backgroundColor: theme.colors.primary,
    borderWidth: 1,
    borderColor: theme.colors.primary,
  },
});

export default InvestmentCards;