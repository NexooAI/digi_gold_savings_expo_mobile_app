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

const { width } = Dimensions.get("window");

interface LiveRateCardProps {
  type: string;
  rate: string | number;
  lastupdated: string;
  image: ImageSourcePropType;
  onPress?: () => void;
}

const LiveRateCard = ({ type, rate, lastupdated, image, onPress }: LiveRateCardProps) => {
  const router = useRouter();
  
  const handlePress = () => {
    try {
      if (onPress) {
        onPress();
      } else {
        // Ensure type is properly formatted to avoid route errors
        const formattedType = type?.toString().trim() || "Gold";
        // Use href pattern for more reliable navigation
        router.push({
          pathname: "/(app)/(tabs)/home/live-rates",
          params: { type: formattedType }
        });
      }
    } catch (error) {
      console.error("Navigation error:", error);
      // Fallback direct navigation if something goes wrong
      router.push("/(app)/(tabs)/home/live-rates");
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
        ]}
      >
      <View style={styles.imageContainer}>
        <Image source={image} style={styles.image} resizeMode="contain" />
      </View>

      <View style={styles.cardContent}>
        <View style={styles.typeContainer}>
          <Text style={styles.type}>{type}</Text>
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
        <Text style={styles.lastUpdated}>{lastupdated}</Text>
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
  goldGlow: {
    shadowColor: "#FFD700",
    borderWidth: 2,
    borderColor: "#FFD700",
  },
  silverGlow: {
    shadowColor: "#C0C0C0",
    borderWidth: 2,
    borderColor: "#C0C0C0",
  },
  imageContainer: {
    position: "absolute",
    top: "-80%",
    left: "50%",
    transform: [{ translateX: -50 }],
    zIndex: 10,
  },
  image: {
    width: 80,
    height: 95,
    borderRadius: 10,
  },
  cardContent: {
    alignItems: "center",
    justifyContent: "center",
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
    backgroundColor: '#4CAF50',
  },
  liveText: {
    fontSize: 10,
    color: '#4CAF50',
    fontWeight: 'bold',
  },
  type: {
    fontSize: 14,
    color: "#555",
    fontWeight: "bold",
  },
  rate: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#ff6f00",
  },
  lastUpdated: {
    fontSize: 10,
    color: "#777",
  },
});
export default LiveRateCard;

