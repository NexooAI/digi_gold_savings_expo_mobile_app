import React, { useEffect } from "react";
import { View, Text, StyleSheet, Dimensions, Animated } from "react-native";
import { LinearGradient } from "expo-linear-gradient";

const { width } = Dimensions.get("window");

const FlashOffer = ({
  messages = ["🎉 Special Offer: Get 20% off on all investments today!"],
  textColor = "#fff",
  duration = 10000,
}) => {
  const translateX = new Animated.Value(width);
  const spacing = 30; // Gap between messages

  useEffect(() => {
    const totalWidth = messages.reduce(
      (acc, msg) => acc + msg.length * 5 + spacing,
      0
    );

    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(translateX, {
          toValue: -totalWidth,
          duration: duration * (totalWidth / width),
          useNativeDriver: true,
        }),
      ])
    );
    animation.start();
    return () => animation.stop();
  }, [messages]);

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#850111', '#2e0406']}
        style={styles.gradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <Animated.View
          style={[styles.textContainer, { transform: [{ translateX }] }]}
        >
          {messages.map((msg, index) => (
            <Text
              key={index}
              style={[styles.text, { color: textColor, marginRight: spacing }]}
            >
              {msg}
            </Text>
          ))}
        </Animated.View>
      </LinearGradient>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    height: 40,
    overflow: "hidden",
    justifyContent: "center",
    borderRadius: 8,
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
  textContainer: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 10,
  },
  text: {
    fontSize: 14,
    fontWeight: "600",
    letterSpacing: 0.5,
  },
});

export default FlashOffer;
