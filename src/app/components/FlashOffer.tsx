import React, { useEffect, useRef, useState } from "react";
import { View, Text, StyleSheet, Dimensions, Animated, TouchableOpacity, Easing } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";

const { width } = Dimensions.get("window");

interface FlashOfferProps {
  fallbackMessages?: string[];
  textColor?: string;
  duration?: number;
  onPress?: () => void;
}

const FlashOffer: React.FC<FlashOfferProps> = ({
  fallbackMessages = ["🎉 Welcome to Digital Gold Savings!"],
  textColor = "#fff",
  duration = 8000,
  onPress,
}) => {
  const translateX = useRef(new Animated.Value(width)).current;
  const [currentNewsIndex, setCurrentNewsIndex] = useState(0);

  // Rotate through news items
  useEffect(() => {
    if (fallbackMessages.length <= 1) return;
    
    const interval = setInterval(() => {
      setCurrentNewsIndex(prevIndex => (prevIndex + 1) % fallbackMessages.length);
    }, duration);
    
    return () => clearInterval(interval);
  }, [fallbackMessages, duration]);

  // Text scrolling animation
  useEffect(() => {
    if (fallbackMessages.length === 0) return;

    const currentMessage = fallbackMessages[currentNewsIndex];
    const messageWidth = currentMessage.length * 8; // Approximate width of text
    
    // Reset position to start from right
    translateX.setValue(width);

    // Create the scrolling animation
    const animation = Animated.loop(
      Animated.sequence([
        // Initial pause
        Animated.delay(500),
        // Scroll from right to left
        Animated.timing(translateX, {
          toValue: -messageWidth,
          duration: messageWidth * 10, // Faster animation
          useNativeDriver: true,
          easing: Easing.linear,
        }),
        // Reset position
        Animated.timing(translateX, {
          toValue: width,
          duration: 0,
          useNativeDriver: true,
        }),
      ])
    );

    animation.start();

    return () => {
      animation.stop();
    };
  }, [currentNewsIndex, fallbackMessages]);

  if (fallbackMessages.length === 0) {
    return null;
  }

  const handlePress = () => {
    if (onPress) {
      onPress();
    }
  };

  return (
    <TouchableOpacity 
      style={styles.container} 
      onPress={handlePress}
      activeOpacity={0.8}
    >
      <LinearGradient
        colors={['#850111', '#2e0406']}
        style={styles.gradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <View style={styles.contentContainer}>
          <View style={styles.iconContainer}>
            <Ionicons name="flash" size={16} color="#fff" />
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
                {fallbackMessages[currentNewsIndex]}
              </Text>
            </Animated.View>
          </View>

          {fallbackMessages.length > 1 && (
            <View style={styles.counterContainer}>
              <Text style={styles.counterText}>
                {currentNewsIndex + 1}/{fallbackMessages.length}
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
    shadowColor: "#850111",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
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
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  textWrapper: {
    flex: 1,
    overflow: 'hidden',
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
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    marginLeft: 8,
  },
  counterText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '500',
  },
});

export default FlashOffer;
