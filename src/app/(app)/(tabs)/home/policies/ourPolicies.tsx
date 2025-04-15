import React, { useMemo, useState, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  ImageBackground,
  TouchableOpacity,
  Dimensions,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from "react-native";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import AppHeader from "@/app/components/AppHeader";
import { t } from "@/i18n";
import useGlobalStore from "@/store/global.store";
import api from "../../../../services/api";
import { theme } from "@/constants/theme";

const { width } = Dimensions.get("window");
const HEADER_HEIGHT = 0; // Adjust to your header's height if needed

export default function OurPolicy() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { language } = useGlobalStore();

  // State for storing policy data, loading state, and errors
  const [policy, setPolicy] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<any>(null);

  // Fetch policy data on component mount
  useEffect(() => {
    const fetchPolicy = async () => {
      setLoading(true);
      try {
        api
          .get("/policies/type/our_policy")
          .then((response) => {
            setPolicy(response.data.data);
          })
          .catch((err) => {
            setError(err);
          })
          .finally(() => {
            setLoading(false);
          });
      } catch (err) {
        setError(err);
        setLoading(false);
      }
    };

    fetchPolicy();
  }, []);

  // Fallback translations in case API data is missing
  const translations = useMemo(
    () => ({
      defaultTitle: t("ourPolicyTitle"), // e.g., "Our Policy"
      defaultContent: t("ourPolicyContent"), // default content for Our Policy
    }),
    [language]
  );

  // Display a loading indicator while fetching data
  if (loading) {
    return (
      <SafeAreaView className="flex-1 justify-center items-center bg-white">
        <ActivityIndicator size="large" color="#1a2a39" />
      </SafeAreaView>
    );
  }

  // Display an error message if the fetch fails
  if (error) {
    return (
      <SafeAreaView className="flex-1 justify-center items-center bg-white">
        <Text className="text-red-500">
          Error loading policy: {error.message}
        </Text>
      </SafeAreaView>
    );
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      className="flex-1"
      keyboardVerticalOffset={Platform.OS === "ios" ? 64 : 0}
    >
      <SafeAreaView
        className="flex-1 bg-white"
        style={{ paddingTop: insets.top }}
      >
        {/* Fixed Header */}
        <View className="absolute top-0 left-0 right-0 z-20 bg-transparent px-4">
          <AppHeader showBackButton={true} backRoute="index" />
        </View>

        {/* Scrollable Content */}
        <ScrollView
          className="flex-1"
          contentContainerStyle={{ paddingTop: HEADER_HEIGHT }}
        >
          <View className="relative">
            <ImageBackground
              source={theme.image.gold_pattern}
              className="h-64 justify-end p-6 mt-16"
            >
              {/* <TouchableOpacity
                onPress={() => router.back()}
                className="absolute top-6 left-4 p-2 bg-white rounded-full z-10"
              >
                <Ionicons name="arrow-back" size={24} color="#1a2a39" />
              </TouchableOpacity> */}

              <View className="bg-white/80 p-4 rounded-xl">
                <Text className="text-2xl font-bold text-[#1a2a39]">
                  {policy?.title || translations.defaultTitle}
                </Text>
                {policy?.subtitle ? (
                  <Text className="text-lg text-gray-600">
                    {policy.subtitle}
                  </Text>
                ) : null}
              </View>
            </ImageBackground>

            {/* Policy Content */}
            <View className="p-6 pb-24">
              <Text className="text-gray-700 leading-relaxed">
                {policy?.description || translations.defaultContent}
              </Text>
            </View>
          </View>
        </ScrollView>
      </SafeAreaView>
    </KeyboardAvoidingView>
  );
}
