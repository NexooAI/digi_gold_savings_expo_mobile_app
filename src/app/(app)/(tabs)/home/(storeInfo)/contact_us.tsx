import React from "react";
import {
  View,
  Text,
  ImageBackground,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Animated,
  useWindowDimensions,
  StyleSheet,
} from "react-native";
import { moderateScale } from "react-native-size-matters";

import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";
import AppHeader from "@/app/components/AppHeader";
import { Ionicons, MaterialIcons, FontAwesome5 } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { theme } from "@/constants/theme";

export default function ContactUs() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const scrollY = new Animated.Value(0);
  const { width } = useWindowDimensions();

  const headerOpacity = scrollY.interpolate({
    inputRange: [0, 200],
    outputRange: [1, 0],
    extrapolate: "clamp",
  });

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
          contentContainerStyle={{
            // Ensure content starts below the parallax header and ends above the tab bar
            paddingTop: 280 + insets.top,
            paddingBottom: 100 + insets.bottom,
            paddingHorizontal: 16,
          }}
          onScroll={Animated.event(
            [{ nativeEvent: { contentOffset: { y: scrollY } } }],
            { useNativeDriver: true }
          )}
          scrollEventThrottle={16}
        >
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
              Get in Touch
            </Text>
            <Text
              style={{
                fontSize: 16,
                color: "#666",
                lineHeight: 24,
                marginBottom: 24,
                letterSpacing: 0.4,
                textAlign: "center",
              }}
            >
              We'd love to hear from you! Whether you have a question about our
              services or need support, feel free to reach out.
            </Text>

            {/* Contact Details Section */}
            <View style={{ marginBottom: 32 }}>
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  marginBottom: 12,
                }}
              >
                <MaterialIcons
                  name="email"
                  size={24}
                  color={theme.colors.primary}
                />
                <Text
                  style={{
                    fontSize: 18,
                    fontWeight: "600",
                    marginLeft: 12,
                    color: theme.colors.primary,
                  }}
                >
                  Email
                </Text>
              </View>
              <Text style={{ fontSize: 16, color: "#555", marginBottom: 16 }}>
                dcjewellerstcr@gmail.com
              </Text>
              {/* <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  marginBottom: 12,
                }}
              >
                <Ionicons name="call" size={24} color="#850111" />
                <Text
                  style={{
                    fontSize: 18,
                    fontWeight: "600",
                    marginLeft: 12,
                    color: "#850111",
                  }}
                >
                  Phone
                </Text>
              </View>
              <Text style={{ fontSize: 16, color: "#555", marginBottom: 16 }}>
                04639 256 444
              </Text> */}
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  marginBottom: 12,
                }}
              >
                <Ionicons name="call" size={24} color={theme.colors.primary} />
                <Text
                  style={{
                    fontSize: 18,
                    fontWeight: "600",
                    marginLeft: 12,
                    color: theme.colors.primary,
                  }}
                >
                  Mobile
                </Text>
              </View>
              <Text style={{ fontSize: 16, color: "#555", marginBottom: 16 }}>
                +91 9061803999
              </Text>
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  marginBottom: 12,
                }}
              >
                <FontAwesome5
                  name="map-marker-alt"
                  size={24}
                  color={theme.colors.primary}
                />
                <Text
                  style={{
                    fontSize: 18,
                    fontWeight: "600",
                    marginLeft: 12,
                    color: theme.colors.primary,
                  }}
                >
                  Address
                </Text>
              </View>
              <Text style={{ fontSize: 16, color: "#555" }}>
                205/64A, Main Bazar, Udangudi, Thoothukudi(D), Tamil Nadu -
                628203
              </Text>
            </View>
          </View>
        </Animated.ScrollView>

        {/* Parallax Header */}
        <Animated.View
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
            source={theme.image.shop_icon}
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
              {/* <TouchableOpacity
                onPress={() => router.back()}
                style={{
                  position: "absolute",
                  top: insets.top + 16,
                  left: 16,
                  backgroundColor: "rgba(255,255,255,0.9)",
                  padding: 10,
                  borderRadius: 25,
                  shadowColor: "#000",
                  shadowOffset: { width: 0, height: 2 },
                  shadowOpacity: 0.1,
                  shadowRadius: 6,
                }}
              >
                <Ionicons name="arrow-back" size={24} color="#850111" />
              </TouchableOpacity> */}
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
                Contact Us
              </Text>
            </View>
          </ImageBackground>
        </Animated.View>
        <View style={styles.spacer} />
      </SafeAreaView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  spacer: {
    height: moderateScale(80),
  },
});
