import React, { useEffect } from "react";
import { View, Text, StyleSheet, Dimensions, Animated } from "react-native";

const { width } = Dimensions.get("window");

const FlashOffer = ({
  messages = ["🎉 Special Offer: Get 20% off on all investments today!"],
  backgroundColor = "#FFD700",
  textColor = "#000",
  duration = 10000,
  className = "bg-[#850111] text-white py-4",
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
    <View className={className}>
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
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    height: 40,
    overflow: "hidden",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
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
