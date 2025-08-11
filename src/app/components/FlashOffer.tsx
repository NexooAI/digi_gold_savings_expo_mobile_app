import React, { useEffect, useState, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  Animated,
  TouchableOpacity,
  Easing,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { theme } from "../../constants/theme";

const { width } = Dimensions.get("window");

interface FlashOfferProps {
  fallbackMessages?: string[];
  textColor?: string;
  duration?: number;
  onPress?: () => void;
  iconColor?: string;
  backgroundGradient?: [string, string];
}

const FlashOffer: React.FC<FlashOfferProps> = ({
  fallbackMessages = ["🎉 Welcome to Digital Gold Savings!"],
  textColor = theme.colors.white,
  duration = 8000,
  onPress,
  iconColor = theme.colors.white,
  backgroundGradient = [theme.colors.primary, theme.colors.textDark],
}) => {
  const translateX = useRef(new Animated.Value(width)).current;
  const [newsMessages, setNewsMessages] = useState<string[]>(fallbackMessages);
  const [currentNewsIndex, setCurrentNewsIndex] = useState(0);

  // Sync newsMessages with fallbackMessages prop
  useEffect(() => {
    console.log('🔍 FlashOffer Debug: Received fallbackMessages:', fallbackMessages);
    setNewsMessages(fallbackMessages);
    setCurrentNewsIndex(0);
  }, [fallbackMessages]);

  // Rotate flash messages
  useEffect(() => {
    if (newsMessages.length <= 1) return;

    const interval = setInterval(() => {
      setCurrentNewsIndex((prev) => (prev + 1) % newsMessages.length);
    }, duration);

    return () => clearInterval(interval);
  }, [newsMessages, duration]);

  // Animate scrolling effect
  useEffect(() => {
    if (!newsMessages.length) return;
  
    const currentMsg = newsMessages[currentNewsIndex];
    const msgWidth = currentMsg.length * 8 + 100; // safe padding
    const duration = Math.max(msgWidth * 20, 4000); // minimum 4s duration
  
    translateX.setValue(width);
  
    const animation = Animated.timing(translateX, {
      toValue: -msgWidth,
      duration,
      useNativeDriver: true,
      easing: Easing.linear,
    });
  
    animation.start(({ finished }) => {
      if (finished) {
        const nextIndex = (currentNewsIndex + 1) % newsMessages.length;
        setCurrentNewsIndex(nextIndex);
      }
    });
  
    return () => animation.stop();
  }, [currentNewsIndex, newsMessages]);
  

  console.log('🔍 FlashOffer Debug: newsMessages length:', newsMessages.length);
  if (newsMessages.length === 0) {
    console.log('🔍 FlashOffer Debug: No messages, returning null');
    return null;
  }

  const handlePress = () => {
    if (onPress) onPress();
  };

  return (
    <TouchableOpacity
      style={styles.container}
      onPress={handlePress}
      activeOpacity={0.85}
    >
      <LinearGradient
        colors={backgroundGradient}
        style={styles.gradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <View style={styles.contentContainer}>
          <View style={styles.iconContainer}>
            <Ionicons name="flash" size={16} color={iconColor} />
          </View>

          <View style={styles.textWrapper}>
            <Animated.View
              style={[
                styles.textContainer,
                {
                  transform: [{ translateX }],
                },
              ]}
            >
              <Text
                style={[styles.text, { color: textColor }]}
                numberOfLines={1}
              >
                {newsMessages[currentNewsIndex]}
              </Text>
            </Animated.View>
          </View>

          {newsMessages.length > 1 && (
            <View style={styles.counterContainer}>
              <Text style={styles.counterText}>
                {currentNewsIndex + 1}/{newsMessages.length}
              </Text>
            </View>
          )}
        </View>
      </LinearGradient>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    height: 40,
    overflow: "hidden",
    justifyContent: "center",
    width: "100%",
    elevation: 5,
  },
  gradient: {
    flex: 1,
    justifyContent: "center",
  },
  contentContainer: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
  },
  iconContainer: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: "rgba(255,255,255,0.2)",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 8,
  },
  textWrapper: {
    flex: 1,
    overflow: "hidden",
  },
  textContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  text: {
    fontSize: 14,
    fontWeight: "600",
    letterSpacing: 0.5,
    paddingRight: 30,
  },
  counterContainer: {
    backgroundColor: "rgba(255,255,255,0.2)",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    marginLeft: 8,
  },
  counterText: {
    color: theme.colors.white,
    fontSize: 12,
    fontWeight: "500",
  },
});

export default FlashOffer;
