import React, { useRef, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  ImageBackground,
  TouchableOpacity,
  FlatList,
} from "react-native";
import { router, useRouter } from "expo-router";
import { useFirstLaunch } from "@/common/hooks/useFirstLaunch";
const handleGetStarted = () => {
  markAsLaunched();
  router.replace("/");
};

const { width, height } = Dimensions.get("window");

const slides = [
  {
    id: "1",
    image: require("../../assets/images/intro_1.png"),
    title: "Welcome to GoldApp",
    subtitle: "Your trusted gold trading platform",
  },
  {
    id: "2",
    image: require("../../assets/images/intro_2.png"),
    title: "Trade with Confidence",
    subtitle: "Secure and reliable transactions",
  },
  {
    id: "3",
    image: require("../../assets/images/intro_3.png"),
    title: "Start Your Journey",
    subtitle: "Join thousands of successful traders",
  },
];

export default function Intro() {
  const { markAsLaunched } = useFirstLaunch();
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);
  const router = useRouter();
  const flatListRef = useRef<FlatList>(null);

  const renderSlide = ({ item }) => {
    return (
      <ImageBackground
        source={item.image}
        style={styles.slide}
        resizeMode="cover"
      >
        {/* <View style={styles.overlay}>
          <View style={styles.textContainer}>
            <Text style={styles.title}>{item.title}</Text>
            <Text style={styles.subtitle}>{item.subtitle}</Text>
          </View>
        </View> */}
      </ImageBackground>
    );
  };

  const Footer = () => {
    return (
      <View style={styles.footer}>
        <View style={styles.indicatorContainer}>
          {slides.map((_, index) => (
            <View
              key={index}
              style={[
                styles.indicator,
                currentSlideIndex === index && styles.activeIndicator,
              ]}
            />
          ))}
        </View>

        <View style={styles.buttonContainer}>
          {currentSlideIndex !== slides.length - 1 ? (
            <TouchableOpacity
              style={styles.button}
              onPress={() => {
                flatListRef.current?.scrollToIndex({
                  index: currentSlideIndex + 1,
                });
              }}
            >
              <Text style={styles.buttonText}>Next</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              style={[styles.button, styles.getStartedButton]}
              onPress={() => router.replace("/(tabs)")}
            >
              <Text style={styles.buttonText}>Get Started</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    );
  };

  const onScroll = (event) => {
    const { contentOffset } = event.nativeEvent;
    const index = Math.round(contentOffset.x / width);
    setCurrentSlideIndex(index);
  };

  return (
    <View style={styles.container}>
      <FlatList
        ref={flatListRef}
        data={slides}
        renderItem={renderSlide}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onScroll={onScroll}
        scrollEventThrottle={16}
      />
      <Footer />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  slide: {
    width,
    height,
  },
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.3)",
    justifyContent: "center",
    alignItems: "center",
  },
  textContainer: {
    alignItems: "center",
    paddingHorizontal: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#ffffff",
    textAlign: "center",
    marginBottom: 15,
  },
  subtitle: {
    fontSize: 18,
    color: "#ffffff",
    textAlign: "center",
    paddingHorizontal: 20,
  },
  footer: {
    position: "absolute",
    bottom: 50,
    width: "100%",
  },
  indicatorContainer: {
    flexDirection: "row",
    justifyContent: "center",
    marginBottom: 20,
  },
  indicator: {
    height: 8,
    width: 8,
    borderRadius: 4,
    backgroundColor: "rgba(255,255,255,0.4)",
    marginHorizontal: 5,
  },
  activeIndicator: {
    backgroundColor: "#ffc90c",
    width: 20,
  },
  buttonContainer: {
    paddingHorizontal: 20,
  },
  button: {
    backgroundColor: "#ffc90c",
    paddingVertical: 15,
    borderRadius: 25,
    alignItems: "center",
  },
  getStartedButton: {
    backgroundColor: "#7c0a12",
  },
  buttonText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "bold",
  },
});
function markAsLaunched() {
  throw new Error("Function not implemented.");
}
