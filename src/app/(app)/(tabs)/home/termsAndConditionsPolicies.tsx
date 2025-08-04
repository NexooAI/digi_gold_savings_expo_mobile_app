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
  StatusBar,
} from "react-native";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import AppLayoutWrapper from "@/components/AppLayoutWrapper";
import { t } from "@/i18n";
import useGlobalStore from "@/store/global.store";
import api from "@/services/api";
import { theme } from "@/constants/theme";

const { width } = Dimensions.get("window");
const HEADER_HEIGHT = 80; // Account for the absolute positioned header

export default function TermsAndConditions() {
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
      try {
        setLoading(true);
        api
          .get("/policies/type/terms_and_conditions")
          .then((response) => {
            setPolicy(response.data.data);
          })
          .catch((err) => {
            throw new Error("Policy data not found");
          })
          .finally(() => {
            setLoading(false);
          });
      } catch (err: any) {
        setError(err);
        setLoading(false);
      }
    };

    fetchPolicy();
  }, []);

  // Fallback translations in case API data is missing
  const translations = useMemo(
    () => ({
      defaultTitle: t("termsAndConditionsTitle"), // e.g., "Terms & Conditions"
      defaultContent: t("termsAndConditionsContent"), // default long terms text
    }),
    [language]
  );

  if (loading) {
    return (
      <SafeAreaView className="flex-1 justify-center items-center bg-white">
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </SafeAreaView>
    );
  }

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
    <AppLayoutWrapper
      showHeader={true}
      showBottomBar={true}
      headerProps={{
        showBackButton: true,
        showDrawerToggle: false,
        showLanguageSwitcher: false,
        title: translations.defaultTitle,
      }}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        className="flex-1"
        keyboardVerticalOffset={Platform.OS === "ios" ? 64 : 0}
      >
        <StatusBar backgroundColor="#5a000b" barStyle="light-content" />

        {/* Scrollable Content */}
        <ScrollView
          className="flex-1"
          contentContainerStyle={{ paddingTop: HEADER_HEIGHT }}
        >
          <View className="relative">
            <ImageBackground
              source={theme.image.gold_pattern}
              className="h-64 justify-end p-6"
              style={{ marginTop: 20 }}
            >


              <View className="bg-white/80 p-4 rounded-xl">
                <Text
                  className="text-2xl font-bold"
                  style={{ color: theme.colors.primary }}
                >
                  {policy?.title || translations.defaultTitle}
                </Text>
                {policy?.subtitle && (
                  <Text className="text-lg text-gray-600">
                    {policy.subtitle}
                  </Text>
                )}
              </View>
            </ImageBackground>

            {/* Terms & Conditions Content */}
            <View className="p-6 pb-24">
              <Text className="text-gray-700 leading-relaxed">
                {policy?.description || translations.defaultContent}
              </Text>
            </View>
                      </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </AppLayoutWrapper>
    );
}
