import React, { useEffect, useRef } from "react";
import {
  View,
  Text,
  Image,
  StyleSheet,
  Animated,
  Dimensions,
  Easing,
  ImageSourcePropType,
  TouchableOpacity,
} from "react-native";
import { useRouter } from "expo-router";
import { theme } from '../../constants/theme';

const { width } = Dimensions.get("window");

interface LiveRateCardProps {
  type: string;
  rate: string | number;
  lastupdated: string;
  image: ImageSourcePropType;
  onPress?: () => void;
  isSingle?: boolean;
}

const LiveRateCard = ({ type, rate, lastupdated, image, onPress, isSingle }: LiveRateCardProps) => {
  const router = useRouter();
  
  const handlePress = () => {
    try {
      if (onPress) {
        onPress();
      } else {
        const formattedType = type?.toString().trim() || "Gold";
        // router.push({
        //   pathname: "/(app)/(tabs)/home/live-rates",
        //   params: { type: formattedType }
        // });
      }
    } catch (error) {
      console.error("Navigation error:", error);
      // router.push("/(app)/(tabs)/home/live-rates");
    }
  };

  const isGold = type.toLowerCase() === "gold";
  const glowAnim = useRef(new Animated.Value(0)).current;
  const rateAnim = useRef(new Animated.Value(0)).current;
  const liveDotAnim = useRef(new Animated.Value(0)).current;

  // Glow animation
  useEffect(() => {
    const glow = Animated.sequence([
      Animated.timing(glowAnim, {
        toValue: 1,
        duration: 1500,
        easing: Easing.inOut(Easing.ease),
        useNativeDriver: true,
      }),
      Animated.timing(glowAnim, {
        toValue: 0,
        duration: 1500,
        easing: Easing.inOut(Easing.ease),
        useNativeDriver: true,
      }),
    ]);

    Animated.loop(glow).start();
  }, []);

  // Rate number animation
  useEffect(() => {
    Animated.spring(rateAnim, {
      toValue: 1,
      friction: 8,
      tension: 40,
      useNativeDriver: true,
    }).start();
  }, [rate]);

  // Live dot animation
  useEffect(() => {
    const pulse = Animated.sequence([
      Animated.timing(liveDotAnim, {
        toValue: 1,
        duration: 1000,
        easing: Easing.inOut(Easing.ease),
        useNativeDriver: true,
      }),
      Animated.timing(liveDotAnim, {
        toValue: 0,
        duration: 1000,
        easing: Easing.inOut(Easing.ease),
        useNativeDriver: true,
      }),
    ]);

    Animated.loop(pulse).start();
  }, []);

  const glowStyle = {
    shadowOpacity: glowAnim.interpolate({
      inputRange: [0, 1],
      outputRange: [0.5, 0.8],
    }),
    shadowRadius: glowAnim.interpolate({
      inputRange: [0, 1],
      outputRange: [10, 20],
    }),
  };

  return (
    <TouchableOpacity
      activeOpacity={0.8}
      onPress={handlePress}
    >
      <Animated.View
        style={[
          styles.cardContainer,
          isGold ? styles.goldGlow : styles.silverGlow,
          glowStyle,
          isSingle && styles.singleCardContainer,
        ]}
      >
        <View style={[styles.imageContainer, isSingle && styles.singleImageContainer]}>
          <Image source={image} style={[styles.image, isSingle && styles.singleImage]} resizeMode="contain" />
        </View>

        <View style={[styles.cardContent, isSingle && styles.singleCardContent]}>
          <View style={styles.typeContainer}>
            <Text style={[styles.type, isSingle && styles.singleType]}>{type}</Text>
            <View style={styles.liveIndicator}>
              <Animated.View
                style={[
                  styles.liveDot,
                  {
                    opacity: liveDotAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [0.4, 1],
                    }),
                    transform: [
                      {
                        scale: liveDotAnim.interpolate({
                          inputRange: [0, 1],
                          outputRange: [0.8, 1.2],
                        }),
                      },
                    ],
                  },
                ]}
              />
              <Text style={styles.liveText}>LIVE</Text>
            </View>
          </View>
          <Animated.Text 
            style={[
              styles.rate,
              isSingle && styles.singleRate,
              {
                transform: [
                  { scale: rateAnim },
                  { translateY: rateAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [20, 0],
                    })
                  }
                ],
                opacity: rateAnim
              }
            ]}
          >
            ₹{rate}
          </Animated.Text>
          <Text style={[styles.lastUpdated, isSingle && styles.singleLastUpdated]}>{lastupdated}</Text>
        </View>
      </Animated.View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  cardContainer: {
    backgroundColor: "white",
    borderRadius: 15,
    width: width * 0.42,
    maxWidth: 200,
    alignItems: "center",
    paddingTop: 30,
    paddingBottom: 10,
    marginBottom: 20,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 5,
    overflow: "visible",
  },
  singleCardContainer: {
    width: width * 0.8,
    maxWidth: 300,
    paddingTop: 40,
    paddingBottom: 20,
  },
  goldGlow: {
    shadowColor: theme.colors.gold,
    borderWidth: 2,
    borderColor: theme.colors.gold,
  },
  silverGlow: {
    shadowColor: theme.colors.silver,
    borderWidth: 2,
    borderColor: theme.colors.silver,
  },
  imageContainer: {
    position: "absolute",
    top: "-80%",
    left: "50%",
    transform: [{ translateX: -50 }],
    zIndex: 10,
  },
  singleImageContainer: {
    top: "-100%",
  },
  image: {
    width: 80,
    height: 95,
    borderRadius: 10,
  },
  singleImage: {
    width: 100,
    height: 120,
  },
  cardContent: {
    alignItems: "center",
    justifyContent: "center",
  },
  singleCardContent: {
    paddingTop: 20,
  },
  typeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  liveIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  liveDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: theme.colors.success,
  },
  liveText: {
    fontSize: 10,
    color: theme.colors.success,
    fontWeight: 'bold',
  },
  type: {
    fontSize: 14,
    color: theme.colors.textMediumGrey,
    fontWeight: "bold",
  },
  singleType: {
    fontSize: 18,
  },
  rate: {
    fontSize: 22,
    fontWeight: "bold",
    color: theme.colors.warning,
  },
  singleRate: {
    fontSize: 32,
    marginTop: 10,
  },
  lastUpdated: {
    fontSize: 10,
    color: theme.colors.textLightGrey,
  },
  singleLastUpdated: {
    fontSize: 12,
    marginTop: 5,
  },
});

export default LiveRateCard;

