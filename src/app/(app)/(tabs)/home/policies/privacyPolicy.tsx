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
  StyleSheet,
  StatusBar,
} from "react-native";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import AppHeader from "@/app/components/AppHeader";
import { t } from "@/i18n";
import useGlobalStore from "@/store/global.store";
import api from "@/services/api";
import { theme } from "@/constants/theme";
import { moderateScale } from "react-native-size-matters";

const { width, height } = Dimensions.get("window");

// Define a type for the policy object
interface Policy {
  title?: string;
  // Add other fields as needed if used
}

export default function PrivacyPolicy() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { language } = useGlobalStore();

  const [policy, setPolicy] = useState<Policy | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const translations = useMemo(
    () => ({
      defaultTitle: t("privacyPolicyTitle"), // e.g., "Privacy Policy"
      defaultContent: t("privacyPolicyContent"),
      defaultDiscription: t("privacyPolicyDiscription"),
      defaultPrivacyPolicyDiscription: t("privacyPolicyDiscription"),
      defaultprivacyMidTitle: t("privacyMidTitle"),
      defaultPrivacyPolicyDiscription2: t("privacyPolicyDiscription2"),
      yourPrivacyMatters: t("yourPrivacyMatters"),
      dataCollection: t("dataCollection"),
      dataCollectionDescription: t("dataCollectionDescription"),
      howWeUseYourData: t("howWeUseYourData"),
      dataUsageDescription: t("dataUsageDescription"),
      dataProtection: t("dataProtection"),
      dataProtectionDescription: t("dataProtectionDescription"),
      questionsAboutPrivacy: t("questionsAboutPrivacy"),
      privacyContactDescription: t("privacyContactDescription"),
      loadingPrivacyPolicy: t("loadingPrivacyPolicy"),
      oopsSomethingWentWrong: t("oopsSomethingWentWrong"),
      tryAgain: t("tryAgain"),
      failedToLoadPrivacyPolicy: t("failedToLoadPrivacyPolicy"),
    }),
    [language]
  );

  useEffect(() => {
    const fetchPolicy = async () => {
      try {
        setLoading(true);
        setError(null);
        api
          .get("/policies/type/privacy_policy")
          .then((response: any) => {
            setPolicy(response.data.data);
            //console.log("Privacy Policy loaded successfully:", response.data.data);
          })
          .catch((err: any) => {
            console.error("Error fetching Privacy Policy:", err);
            setError(translations.failedToLoadPrivacyPolicy);
          })
          .finally(() => {
            setLoading(false);
          });
      } catch (err: any) {
        console.error("Error in fetchPolicy:", err);
        setError(translations.failedToLoadPrivacyPolicy);
        setLoading(false);
      }
    };

    fetchPolicy();
  }, [translations.failedToLoadPrivacyPolicy]);

  // Function to retry fetching policy data
  const retryFetchPolicy = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await api.get("/policies/type/privacy_policy");
      setPolicy(response.data.data);
      //console.log("Privacy Policy retried and loaded successfully:", response.data.data);
    } catch (err: any) {
      console.error("Error retrying Privacy Policy:", err);
      setError(translations.failedToLoadPrivacyPolicy);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <StatusBar backgroundColor="#5a000b" barStyle="light-content" />
        <LinearGradient
          colors={["#850111", "#5a000b"]}
          style={styles.loadingGradient}
        >
          <ActivityIndicator size="large" color="#FFD700" />
          <Text style={styles.loadingText}>{translations.loadingPrivacyPolicy}</Text>
        </LinearGradient>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={styles.errorContainer}>
        <StatusBar backgroundColor="#5a000b" barStyle="light-content" />
        <LinearGradient
          colors={["#850111", "#5a000b"]}
          style={styles.errorGradient}
        >
          <Ionicons name="alert-circle-outline" size={60} color="#FFD700" />
          <Text style={styles.errorTitle}>{translations.oopsSomethingWentWrong}</Text>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity
            style={styles.retryButton}
            onPress={retryFetchPolicy}
          >
            <Text style={styles.retryButtonText}>{translations.tryAgain}</Text>
          </TouchableOpacity>
        </LinearGradient>
      </SafeAreaView>
    );
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      style={styles.container}
      keyboardVerticalOffset={Platform.OS === "ios" ? 64 : 0}
    >
      <StatusBar backgroundColor="#5a000b" barStyle="light-content" />
      <ImageBackground
        source={require("../../../../../../assets/images/bg_new.jpg")}
        style={styles.backgroundImage}
        resizeMode="contain"
      >
        <SafeAreaView style={styles.safeArea}>
          {/* Fixed Header */}
          <View style={styles.headerContainer}>
            <AppHeader showBackButton={true} backRoute="index" showDrawerToggle={false} showLanguageSwitcher={true}/>
          </View>

          {/* Hero Section */}
          <LinearGradient
            colors={["#850111", "#5a000b"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.heroSection}
          >
            <View style={styles.heroContent}>
              <View style={{ marginTop: 20 }}>
                <Ionicons name="shield-outline" size={40} color="#FFD700" />
              </View>
              <Text style={styles.heroTitle}>
                {policy?.title || translations.defaultTitle}
              </Text>
              <View style={styles.decorativeLine} />
            </View>
          </LinearGradient>

          {/* Content Section */}
          <ScrollView
            style={styles.scrollView}
            contentContainerStyle={[
              styles.scrollContent,
              { paddingBottom: Math.max(insets.bottom, 20) + 20 }, // Reduced padding since no tab bar
            ]}
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.contentCard}>
              <LinearGradient
                colors={[
                  "rgba(255, 255, 255, 0.95)",
                  "rgba(255, 255, 255, 0.85)",
                ]}
                style={styles.cardGradient}
              >
                <View style={styles.contentHeader}>
                  <Ionicons name="lock-closed" size={24} color="#850111" />
                  <Text style={styles.contentHeaderText}>
                    {translations.yourPrivacyMatters}
                  </Text>
                </View>

                <Text style={styles.contentText}>
                  {translations.defaultPrivacyPolicyDiscription}
                </Text>

                {/* Data Collection Section */}
                <View style={styles.sectionContainer}>
                  <View style={styles.sectionHeader}>
                    <Ionicons
                      name="document-text-outline"
                      size={20}
                      color="#850111"
                    />
                    <Text style={styles.sectionTitle}>
                      {translations.dataCollection}
                    </Text>
                  </View>
                  <Text style={styles.sectionText}>
                    {translations.dataCollectionDescription}
                  </Text>
                </View>

                {/* Data Usage Section */}
                <View style={styles.sectionContainer}>
                  <View style={styles.sectionHeader}>
                    <Ionicons name="analytics" size={20} color="#850111" />
                    <Text style={styles.sectionTitle}>
                      {translations.howWeUseYourData}
                    </Text>
                  </View>
                  <Text style={styles.sectionText}>
                    {translations.dataUsageDescription}
                  </Text>
                </View>

                {/* Data Protection Section */}
                <View style={styles.sectionContainer}>
                  <View style={styles.sectionHeader}>
                    <Ionicons name="shield-checkmark" size={20} color="#850111" />
                    <Text style={styles.sectionTitle}>
                      {translations.dataProtection}
                    </Text>
                  </View>
                  <Text style={styles.sectionText}>
                    {translations.dataProtectionDescription}
                  </Text>
                </View>

                {/* Contact Section */}
                <View style={styles.contactSection}>
                  <LinearGradient
                    colors={["#850111", "#5a000b"]}
                    style={styles.contactGradient}
                  >
                    <Ionicons
                      name="information-circle-outline"
                      size={24}
                      color="#FFD700"
                    />
                    <Text style={styles.contactTitle}>
                      {translations.questionsAboutPrivacy}
                    </Text>
                    <Text style={styles.contactText}>
                      {translations.privacyContactDescription}
                    </Text>
                  </LinearGradient>
                </View>
              </LinearGradient>
            </View>
          </ScrollView>
        </SafeAreaView>
      </ImageBackground>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f7f7f7",
  },
  backgroundImage: {
    flex: 1,
    width: "100%",
  },
  safeArea: {
    flex: 1,
    paddingTop: 50,
  },
  headerContainer: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
  },
  heroSection: {
    paddingTop: 20,
    paddingBottom: 30,
    paddingHorizontal: 20,
    alignItems: "center",
  },
  heroContent: {
    alignItems: "center",
  },
  heroTitle: {
    fontSize: 28,
    fontWeight: "800",
    color: "#fff",
    textAlign: "center",
    marginTop: 16,
    marginBottom: 12,
    fontFamily: "serif",
  },
  decorativeLine: {
    width: 60,
    height: 3,
    backgroundColor: "#FFD700",
    borderRadius: 2,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  contentCard: {
    borderRadius: 20,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 5,
  },
  cardGradient: {
    padding: 24,
  },
  contentHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 20,
  },
  contentHeaderText: {
    fontSize: 20,
    fontWeight: "700",
    color: "#850111",
    marginLeft: 12,
  },
  contentText: {
    fontSize: 16,
    color: "#333",
    lineHeight: 26,
    letterSpacing: 0.3,
    marginBottom: 24,
  },
  sectionContainer: {
    marginBottom: 20,
    padding: 16,
    backgroundColor: "rgba(133, 1, 17, 0.05)",
    borderRadius: 12,
    borderLeftWidth: 4,
    borderLeftColor: "#850111",
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#850111",
    marginLeft: 8,
  },
  sectionText: {
    fontSize: 14,
    color: "#555555",
    lineHeight: 20,
  },
  contactSection: {
    marginTop: 20,
    borderRadius: 16,
    overflow: "hidden",
  },
  contactGradient: {
    padding: 20,
    alignItems: "center",
  },
  contactTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#FFFFFF",
    marginTop: 8,
    marginBottom: 4,
  },
  contactText: {
    fontSize: 14,
    color: "rgba(255, 255, 255, 0.8)",
    textAlign: "center",
  },
  loadingContainer: {
    flex: 1,
  },
  loadingGradient: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    color: "#FFD700",
    fontSize: 18,
    fontWeight: "600",
    marginTop: 16,
  },
  errorContainer: {
    flex: 1,
  },
  errorGradient: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  errorTitle: {
    color: "#FFD700",
    fontSize: 24,
    fontWeight: "700",
    marginTop: 20,
    marginBottom: 12,
    textAlign: "center",
  },
  errorText: {
    color: "#fff",
    fontSize: 16,
    textAlign: "center",
    marginBottom: 24,
    lineHeight: 24,
  },
  retryButton: {
    backgroundColor: "#FFD700",
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
  },
  retryButtonText: {
    color: "#850111",
    fontSize: 16,
    fontWeight: "600",
  },
});
