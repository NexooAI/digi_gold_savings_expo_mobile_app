import React from "react";
import {
  View,
  Text,
  ScrollView,
  ImageBackground,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Animated,
  useWindowDimensions,
  FlatList,
  StyleSheet,
} from "react-native";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";
import AppHeader from "@/app/components/AppHeader";
import { Ionicons, MaterialIcons, FontAwesome5 } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { moderateScale } from "react-native-size-matters";
import { theme } from "@/constants/theme";

const milestones = [
  { year: "1990", title: "Founded in Mumbai", icon: "storefront" },
  { year: "2005", title: "First International Store", icon: "public" },
  { year: "2018", title: "Luxury Collection Launch", icon: "diamond" },
  { year: "2023", title: "Digital Experience", icon: "smartphone" },
];

export default function AboutUs() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const scrollY = new Animated.Value(0);
  const { width } = useWindowDimensions();

  const headerOpacity = scrollY.interpolate({
    inputRange: [0, 200],
    outputRange: [1, 0],
    extrapolate: "clamp",
  });

  const renderMilestone = ({ item }) => (
    <View style={{ width: width * 0.4, marginRight: 20, alignItems: "center" }}>
      <View
        style={{
          backgroundColor: "rgba(123,0,6,0.1)",
          padding: 16,
          borderRadius: 50,
        }}
      >
        <MaterialIcons
          name={item.icon}
          size={32}
          color={theme.colors.primary}
        />
      </View>
      <Text
        style={{
          fontSize: 20,
          fontWeight: "800",
          color: theme.colors.primary,
          marginVertical: 8,
        }}
      >
        {item.year}
      </Text>
      <Text style={{ fontSize: 14, color: "#555", textAlign: "center" }}>
        {item.title}
      </Text>
    </View>
  );

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      style={{ flex: 1, backgroundColor: "#fff" }}
    >
      <SafeAreaView style={{ flex: 1, marginBottom: 40 }}>
        {/* Animated Header */}
        <Animated.View
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            zIndex: 20,
            opacity: headerOpacity,
            backgroundColor: "transparent",
            paddingHorizontal: 16,
          }}
        >
          <AppHeader showBackButton={true} backRoute="index" />
        </Animated.View>

        <Animated.ScrollView
          contentContainerStyle={{ paddingTop: 100 }}
          onScroll={Animated.event(
            [{ nativeEvent: { contentOffset: { y: scrollY } } }],
            { useNativeDriver: true }
          )}
          scrollEventThrottle={16}
        >
          <View style={{ paddingHorizontal: 16 }}>
            {/* <TouchableOpacity
              onPress={() => router.back()}
              style={{
                position: "absolute",
                left: 16,
                padding: 10,
                backgroundColor: "rgba(255, 255, 255, 0.8)", // Semi-transparent white background
                borderRadius: 25,
                elevation: 3,
                zIndex: 9999,
                top: insets.top + 40, // Adjust the top position based on insets
              }}
            >
              <Ionicons name="arrow-back" size={28} color="#1a2a39" />
            </TouchableOpacity> */}
            {/* Content Sections */}
            <View
              style={{
                backgroundColor: "white",
                borderRadius: 20,
                padding: 24,
                shadowColor: "#000",
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.1,
                shadowRadius: 20,
                elevation: 5,
              }}
            >
              <Text
                style={{
                  fontSize: 28,
                  fontWeight: "800",
                  color: theme.colors.primary,
                  marginBottom: 24,
                  textAlign: "center",
                  fontFamily: "serif",
                }}
              >
                Crafting Timeless Elegance Since 1990
              </Text>

              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  marginBottom: 16,
                }}
              >
                <FontAwesome5
                  name="crown"
                  size={24}
                  color={theme.colors.primary}
                />
                <Text
                  style={{
                    fontSize: 20,
                    fontWeight: "700",
                    color: theme.colors.primary,
                    marginLeft: 12,
                  }}
                >
                  Who We Are
                </Text>
              </View>
              <Text
                style={{
                  fontSize: 16,
                  color: "#666",
                  lineHeight: 24,
                  marginBottom: 32,
                  letterSpacing: 0.4,
                }}
              >
                DC Jewellers blends centuries-old craftsmanship with
                contemporary design. Our master artisans pour passion into every
                piece, creating heirlooms that transcend generations.
              </Text>

              <ImageBackground
                source={theme.image.store_image}
                style={{ height: 200, borderRadius: 12, marginBottom: 32 }}
                imageStyle={{ borderRadius: 12 }}
              >
                <View
                  style={{
                    flex: 1,
                    backgroundColor: "rgba(0,0,0,0.3)",
                    justifyContent: "flex-end",
                    padding: 16,
                    borderRadius: 12,
                  }}
                >
                  <Text
                    style={{
                      color: "white",
                      fontSize: 18,
                      fontWeight: "600",
                      textShadowColor: "rgba(0,0,0,0.5)",
                      textShadowOffset: { width: 1, height: 1 },
                      textShadowRadius: 4,
                    }}
                  >
                    Master Artisan at Work
                  </Text>
                </View>
              </ImageBackground>

              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  marginBottom: 16,
                }}
              >
                <FontAwesome5
                  name="history"
                  size={24}
                  color={theme.colors.primary}
                />
                <Text
                  style={{
                    fontSize: 20,
                    fontWeight: "700",
                    color: theme.colors.primary,
                    marginLeft: 12,
                  }}
                >
                  Our Journey
                </Text>
              </View>
              <Text
                style={{
                  fontSize: 16,
                  color: "#666",
                  lineHeight: 24,
                  marginBottom: 32,
                  letterSpacing: 0.4,
                }}
              >
                From our humble beginnings in Mumbai's jewelry district to
                becoming a global name, we've maintained our commitment to
                ethical sourcing and exceptional quality. Every piece tells a
                story of dedication and love for the craft.
              </Text>

              <Text
                style={{
                  fontSize: 18,
                  fontWeight: "700",
                  color: theme.colors.primary,
                  marginBottom: 16,
                }}
              >
                Milestones
              </Text>
              <FlatList
                data={milestones}
                renderItem={renderMilestone}
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={{ paddingBottom: 16 }}
              />
            </View>

            {/* Values Section */}
            <View
              style={{
                marginTop: 32,
                backgroundColor: "#f8f5f0",
                borderRadius: 20,
                padding: 24,
              }}
            >
              <Text
                style={{
                  fontSize: 22,
                  fontWeight: "700",
                  color: theme.colors.primary,
                  marginBottom: 24,
                  textAlign: "center",
                }}
              >
                Our Core Values
              </Text>

              <View
                style={{
                  flexDirection: "row",
                  flexWrap: "wrap",
                  justifyContent: "space-between",
                }}
              >
                {["Craftsmanship", "Integrity", "Innovation", "Heritage"].map(
                  (value, index) => (
                    <View
                      key={index}
                      style={{
                        width: "48%",
                        backgroundColor: "white",
                        borderRadius: 12,
                        padding: 16,
                        marginBottom: 16,
                      }}
                    >
                      <MaterialIcons
                        name={
                          value === "Craftsmanship"
                            ? "handyman"
                            : value === "Integrity"
                            ? "verified"
                            : value === "Innovation"
                            ? "auto-awesome"
                            : "history-edu"
                        }
                        size={28}
                        color={theme.colors.primary}
                      />
                      <Text
                        style={{
                          fontSize: 16,
                          fontWeight: "600",
                          color: theme.colors.primary,
                          marginTop: 8,
                        }}
                      >
                        {value}
                      </Text>
                    </View>
                  )
                )}
              </View>
            </View>
          </View>
        </Animated.ScrollView>

        {/* Parallax Header */}
        {/* <Animated.View
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            height: 280,
            opacity: headerOpacity,
            transform: [
              {
                translateY: scrollY.interpolate({
                  inputRange: [0, 200],
                  outputRange: [0, -100],
                  extrapolate: "clamp",
                }),
              },
            ],
          }}
        >
          <ImageBackground
            source={require("../../../../../../assets/images/slider1.png")}
            style={{ flex: 1 }}
            resizeMode="cover"
          >
            <View
              style={{
                flex: 1,
                backgroundColor: "rgba(123,0,6,0.15)",
                justifyContent: "flex-end",
                padding: 24,
              }}
            >
              
              <Text
                style={{
                  fontSize: 32,
                  fontWeight: "800",
                  color: "white",
                  textShadowColor: "rgba(0,0,0,0.5)",
                  textShadowOffset: { width: 1, height: 1 },
                  textShadowRadius: 6,
                  fontFamily: "serif",
                }}
              >
                DC Jewellers 
              </Text>
              <Text
                style={{
                  fontSize: 18,
                  color: "rgba(255,255,255,0.9)",
                  marginTop: 8,
                  textShadowColor: "rgba(0,0,0,0.3)",
                  textShadowOffset: { width: 1, height: 1 },
                  textShadowRadius: 4,
                }}
              >
                Excellence in Jewelry Since 1990
              </Text>
            </View>
          </ImageBackground>
        </Animated.View> */}
        <View style={styles.spacer} />
      </SafeAreaView>
    </KeyboardAvoidingView>
  );
}
const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: theme.colors.primary,
    paddingVertical: 16,
    paddingHorizontal: 20,
    elevation: 4,
  },
  backButton: {
    marginRight: 16,
  },
  headerTitle: {
    color: "white",
    fontSize: 20,
    fontWeight: "600",
    letterSpacing: 0.5,
  },
  spacer: {
    height: moderateScale(80),
  },
});
