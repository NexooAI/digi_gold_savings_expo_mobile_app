import React from "react";
import {
  View,
  Text,
  Image,
  StyleSheet,
  Animated,
  Dimensions,
} from "react-native";

const { width } = Dimensions.get("window");

const LiveRateCard = ({ type, rate, lastupdated, image }) => {
  const isGold = type.toLowerCase() === "gold"; // Check if it's gold or silver

  return (
    <Animated.View
      style={[
        styles.cardContainer,
        isGold ? styles.goldGlow : styles.silverGlow, // Apply different glows
      ]}
    >
      {/* Image Overflow (Moves Image More Outside the Card) */}
      <View style={styles.imageContainer}>
        <Image source={image} style={styles.image} resizeMode="contain" />
      </View>

      {/* Card Content */}
      <View style={styles.cardContent}>
        <Text style={styles.type}>{type}</Text>
        <Text style={styles.rate}>₹{rate}</Text>
        <Text style={styles.lastUpdated}>{lastupdated}</Text>
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  // Smaller Card with Shadow
  cardContainer: {
    backgroundColor: "white",
    borderRadius: 15,
    width: width * 0.42, // Responsive width
    maxWidth: 200,
    alignItems: "center",
    paddingTop: 30, // Space for the image above
    paddingBottom: 10, // Less height
    marginBottom: 20,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 5,
    overflow: "visible", // Allows image to overflow
  },

  // Gold Lightning Glow
  goldGlow: {
    shadowColor: "#FFD700", // Gold glow
    shadowRadius: 15,
    shadowOpacity: 0.8,
    borderWidth: 2,
    borderColor: "#FFD700",
  },

  // Silver Lightning Glow
  silverGlow: {
    shadowColor: "#C0C0C0", // Silver glow
    shadowRadius: 15,
    shadowOpacity: 0.8,
    borderWidth: 2,
    borderColor: "#C0C0C0",
  },

  // Image (Moves More Outside the Card)
  imageContainer: {
    position: "absolute",
    top: "-80%", // Moves the image out even more
    left: "50%",
    transform: [{ translateX: -50 }],
    zIndex: 10, // Ensures image is on top
  },
  image: {
    width: 80, // Slightly bigger for effect
    height: 95,
    borderRadius: 10,
  },

  // Text Content Inside Card
  cardContent: {
    alignItems: "center",
    justifyContent: "center",
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
