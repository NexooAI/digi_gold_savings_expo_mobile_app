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
  Linking,
  Alert,
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
  const openGoogleMaps = async () => {
    const url =
      "https://www.google.com/maps/place/DC+Jewellers,+Gold+and+Diamonds/data=!4m2!3m1!1s0x0:0x7ee60c0c1146bf78?sa=X&ved=1t:2428&ictx=111";

    const supported = await Linking.canOpenURL(url);

    if (supported) {
      await Linking.openURL(url);
    } else {
      Alert.alert("Can't open the map link");
    }
  };
  const handleCall = () => {
    Linking.openURL(`tel:${theme.constants.mobile}`);
  };
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
                {theme.constants.email}
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
              <TouchableOpacity onPress={handleCall}>
                <Text
                  style={{
                    fontSize: 16,
                    color: "#555",
                    marginBottom: 16,
                    textDecorationLine: "underline",
                  }}
                >
                  {theme.constants.mobile}
                </Text>
              </TouchableOpacity>
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  marginBottom: 12,
                }}
              >
                <Ionicons
                  name="location"
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
              <Text style={{ fontSize: 16, color: "#555", marginBottom: 16 }}>
                {theme.constants.address}
              </Text>
            </View>

            {/* Action Buttons */}
            <View style={{ gap: 16 }}>
              <TouchableOpacity
                style={{
                  backgroundColor: theme.colors.primary,
                  paddingVertical: 16,
                  borderRadius: 12,
                  alignItems: "center",
                  flexDirection: "row",
                  justifyContent: "center",
                }}
                onPress={handleCall}
              >
                <Ionicons name="call" size={20} color="white" />
                <Text
                  style={{
                    color: "white",
                    fontSize: 16,
                    fontWeight: "600",
                    marginLeft: 8,
                  }}
                >
                  Call Now
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={{
                  backgroundColor: "#4CAF50",
                  paddingVertical: 16,
                  borderRadius: 12,
                  alignItems: "center",
                  flexDirection: "row",
                  justifyContent: "center",
                }}
                onPress={openGoogleMaps}
              >
                <FontAwesome5 name="map-marker-alt" size={20} color="white" />
                <Text
                  style={{
                    color: "white",
                    fontSize: 16,
                    fontWeight: "600",
                    marginLeft: 8,
                  }}
                >
                  Open in Maps
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </Animated.ScrollView>
      </SafeAreaView>
    </KeyboardAvoidingView>
  );
}
