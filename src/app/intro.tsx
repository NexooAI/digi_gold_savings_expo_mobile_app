import React, { useRef, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  ImageBackground,
  TouchableOpacity,
  FlatList,
  Animated,
} from "react-native";
import { router } from "expo-router";
import { useFirstLaunch } from "@/common/hooks/useFirstLaunch";
import { LinearGradient } from 'expo-linear-gradient';
import { t } from "@/i18n";
import useGlobalStore from "@/store/global.store";
import { theme } from "@/constants/theme";

const { width, height } = Dimensions.get("window");

// Static data - will be replaced with API data
const staticSlides = [
  {
    id: "1",
    image: theme.images.intro.intro1,
  },
  {
    id: "2",
    image: theme.images.intro.intro2,
  },
  {
    id: "3",
    image: theme.images.intro.intro3,
  },
];

// API service for intro slides
const IntroService = {
  // TODO: Replace with actual API endpoint
  // async fetchIntroSlides() {
  //   try {
  //     const response = await fetch('YOUR_API_ENDPOINT/intro-slides');
  //     const data = await response.json();
  //     return data;
  //   } catch (error) {
  //     console.error('Error fetching intro slides:', error);
  //     return staticSlides; // Fallback to static data
  //   }
  // }
};

export default function Intro() {
  const { markAsLaunched } = useFirstLaunch();
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);
  const flatListRef = useRef<FlatList>(null);
  const scrollX = useRef(new Animated.Value(0)).current;
  const [slides, setSlides] = useState(staticSlides);
  const { language } = useGlobalStore(); // To re-render on language change

  // TODO: Uncomment when API is ready
  // useEffect(() => {
  //   const loadSlides = async () => {
  //     const apiSlides = await IntroService.fetchIntroSlides();
  //     setSlides(apiSlides);
  //   };
  //   loadSlides();
  // }, []);

  const handleGetStarted = async () => {
    await markAsLaunched();
    router.replace("/login");
  };

  const renderSlide = ({ item }) => {
    return (
      <View style={styles.slide}>
        <ImageBackground
          source={item.image}
          style={styles.backgroundImage}
          resizeMode="cover"
        >
          <LinearGradient
            colors={[theme.colors.bgImageOverlayMedium, theme.colors.bgImageOverlay]}
            style={styles.overlay}
          />
        </ImageBackground>
      </View>
    );
  };

  const Footer = () => {
    return (
      <View style={styles.footer}>
        <View style={styles.indicatorContainer}>
          {slides.map((_, index) => {
            const inputRange = [
              (index - 1) * width,
              index * width,
              (index + 1) * width,
            ];

            const dotWidth = scrollX.interpolate({
              inputRange,
              outputRange: [8, 20, 8],
              extrapolate: 'clamp',
            });

            const opacity = scrollX.interpolate({
              inputRange,
              outputRange: [0.4, 1, 0.4],
              extrapolate: 'clamp',
            });

            return (
              <Animated.View
                key={index}
                style={[
                  styles.indicator,
                  {
                    width: dotWidth,
                    opacity,
                  },
                ]}
              />
            );
          })}
        </View>

        <View style={styles.buttonContainer}>
          {currentSlideIndex !== slides.length - 1 ? (
            <TouchableOpacity
              style={styles.button}
              onPress={() => {
                flatListRef.current?.scrollToIndex({
                  index: currentSlideIndex + 1,
                  animated: true,
                });
              }}
            >
              <Text style={styles.buttonText}>{t('next')}</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              style={[styles.button, styles.getStartedButton]}
              onPress={handleGetStarted}
            >
              <Text style={styles.buttonText}>{t('get_started')}</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    );
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
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { x: scrollX } } }],
          { useNativeDriver: false }
        )}
        scrollEventThrottle={16}
        onMomentumScrollEnd={(event) => {
          const index = Math.round(event.nativeEvent.contentOffset.x / width);
          setCurrentSlideIndex(index);
        }}
      />
      <Footer />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.black,
  },
  slide: {
    width,
    height,
  },
  backgroundImage: {
    flex: 1,
    width: "100%",
    height: "100%",
  },
  overlay: {
    flex: 1,
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
    borderRadius: 4,
    backgroundColor: theme.colors.secondary,
    marginHorizontal: 5,
  },
  buttonContainer: {
    paddingHorizontal: 20,
  },
  button: {
    backgroundColor: theme.colors.secondary,
    paddingVertical: 15,
    borderRadius: 25,
    alignItems: "center",
    shadowColor: theme.colors.shadowBlack,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  getStartedButton: {
    backgroundColor: theme.colors.redDark,
  },
  buttonText: {
    color: theme.colors.white,
    fontSize: 18,
    fontWeight: "bold",
  },
});
