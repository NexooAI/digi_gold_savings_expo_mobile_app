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
          <AppHeader showBackButton={true} backRoute="index" showDrawerToggle={false} />
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
                    }}
                  >
                    Our Legacy
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
                <MaterialIcons
                  name="timeline"
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

              <FlatList
                data={milestones}
                renderItem={renderMilestone}
                keyExtractor={(item) => item.year}
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={{ paddingBottom: 32 }}
              />

              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  marginBottom: 16,
                }}
              >
                <Ionicons
                  name="diamond"
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
                  Our Promise
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
                We commit to delivering exceptional quality, innovative designs,
                and personalized service. Every piece tells a story, and we're
                honored to be part of yours.
              </Text>

              <TouchableOpacity
                style={{
                  backgroundColor: theme.colors.primary,
                  paddingVertical: 16,
                  borderRadius: 12,
                  alignItems: "center",
                }}
                onPress={() => router.push("/(tabs)/home/(storeInfo)/contact_us")}
              >
                <Text
                  style={{
                    color: "white",
                    fontSize: 16,
                    fontWeight: "600",
                  }}
                >
                  Visit Our Store
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </Animated.ScrollView>
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
