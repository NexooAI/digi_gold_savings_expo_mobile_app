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
const CARD_WIDTH = SCREEN_WIDTH * 0.7; // Increased card width
const IMAGE_SIZE = CARD_WIDTH * 0.5; // Slightly larger image

const CardComponent = ({ item, index }: CardProps) => {
  const router = useRouter();
  const [fallback, setFallback] = useState(false);
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

  // Alternate card styles based on index
  const cardColors: [string, string] =
    index % 2 === 0 ? ["#fff1f0", "#fff"] : ["#fffaf0", "#fff"];

  return (
    <Animated.View
      style={[
        {
          width: CARD_WIDTH,
          marginTop: IMAGE_SIZE / 2,
          transform: [{ scale: scaleAnim }],
        },
        styles.cardContainer,
      ]}
      className="mr-4"
    >
      <View className="relative">
        <View style={styles.imageContainer}>
          <Image
            source={
              fallback
                ? theme.image.digigoldproduct
                : { uri: `http://jwlgold.api.ramcarmotor.com${item.IMAGE}` }
            }
            style={{
              width: IMAGE_SIZE,
              height: IMAGE_SIZE,
              left: (CARD_WIDTH - IMAGE_SIZE) / 2,
              top: -IMAGE_SIZE / 2,
            }}
            className="absolute z-10"
            resizeMode="contain"
            onError={() => setFallback(true)}
          />
          {/* Add shine effect over image */}
          <View style={styles.shine} />
        </View>

        <LinearGradient
          colors={cardColors}
          style={styles.cardGradient}
          className="rounded-3xl shadow-2xl"
        >
          <View className="p-6 pt-24">
            <View className="items-center justify-center">
              <Text
                style={styles.schemeName}
                className="text-gray-700 text-xl font-bold text-center"
              >
                {item.SCHEMENAME}
              </Text>
              <Text className="text-gray-600 text-sm text-center mt-2">
                {item.SLOGAN}
              </Text>

              <View style={styles.separator} />

              <View className="flex-row justify-between space-x-2 mt-6 w-full">
                <TouchableOpacity
                  className="flex-1 border bg-[#850111] rounded-full py-3 mr-2"
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
                  <Text className="text-red-700 text-center text-sm font-semibold">
                    {t("knowMore")}
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  className="flex-1 rounded-full py-3"
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
    <View className="flex-1">
      <FlatList
        data={schemes.data}
        horizontal
        keyExtractor={(item) => item.SCHEMEID.toString()}
        renderItem={({ item, index }) => (
          <CardComponent item={item} index={index} />
        )}
        contentContainerStyle={{
          paddingHorizontal: 16,
          paddingVertical: 24, // Increased vertical padding
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
    elevation: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
  },
  imageContainer: {
    alignItems: "center",
    justifyContent: "center",
  },
  shine: {
    position: "absolute",
    top: -IMAGE_SIZE / 2,
    left: (CARD_WIDTH - IMAGE_SIZE) / 2,
    width: IMAGE_SIZE,
    height: IMAGE_SIZE,
    backgroundColor: "rgba(255,255,255,0.15)",
    transform: [{ rotate: "45deg" }],
    zIndex: 20,
  },
  cardGradient: {
    borderRadius: 24,
    padding: 6,
    overflow: "hidden",
  },
  separator: {
    height: 1,
    backgroundColor: "#f0f0f0",
    width: "80%",
    marginTop: 12,
  },
  schemeName: {
    textShadowColor: "rgba(0, 0, 0, 0.1)",
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 1,
  },
  knowMoreButton: {
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    backgroundColor: "white",
  },
  joinButton: {
    elevation: 5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    backgroundColor: theme.colors.primary, // Deeper red
    borderWidth: 1,
    borderColor: theme.colors.primary,
  },
});

export default InvestmentCards;
