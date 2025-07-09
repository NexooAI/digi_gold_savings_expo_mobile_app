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

// Define a more complete Policy type
interface Policy {
  title?: string;
  subtitle?: string;
  description?: string;
}

export default function PrivacyPolicy() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { language } = useGlobalStore();

  const [policy, setPolicy] = useState<Policy | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchPolicy = async () => {
      try {
        setLoading(true);
        setError(null);
        api
          .get("/policies/type/privacy_policy")
          .then((response: any) => {
            if (response.data && typeof response.data.data === 'object') {
              setPolicy(response.data.data);
            } else {
              setPolicy(null);
              setError("Invalid policy data received.");
            }
            //console.log("Privacy Policy loaded successfully:", response.data.data);
          })
          .catch((err: any) => {
            console.error("Error fetching Privacy Policy:", err);
            setError("Failed to load Privacy Policy.");
          })
          .finally(() => {
            setLoading(false);
          });
      } catch (err: any) {
        console.error("Error in fetchPolicy:", err);
        setError("Failed to load Privacy Policy.");
        setLoading(false);
      }
    };

    fetchPolicy();
  }, []);

  // Function to retry fetching policy data
  const retryFetchPolicy = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await api.get("/policies/type/privacy_policy");
      if (response.data && typeof response.data.data === 'object') {
        setPolicy(response.data.data);
      } else {
        setPolicy(null);
        setError("Invalid policy data received.");
      }
      //console.log("Privacy Policy retried and loaded successfully:", response.data.data);
    } catch (err: any) {
      console.error("Error retrying Privacy Policy:", err);
      setError("Failed to load Privacy Policy.");
    } finally {
      setLoading(false);
    }
  };

  const translations = useMemo(
    () => ({
      defaultTitle: t("privacyPolicyTitle"), // e.g., "Privacy Policy"
      defaultContent: t("privacyPolicyContent"),
      defaultDiscription: t("privacyPolicyDiscription"),
      defaultPrivacyPolicyDiscription: t("privacyPolicyDiscription"),
      defaultprivacyMidTitle: t("privacyMidTitle"),
      defaultPrivacyPolicyDiscription2: t("privacyPolicyDiscription2"),
    }),
    [language]
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <StatusBar backgroundColor="#5a000b" barStyle="light-content" />
        <LinearGradient
          colors={["#1a2a39", "#5a000b"]}
          style={styles.loadingGradient}
        >
          <ActivityIndicator size="large" color="#FFD700" />
          <Text style={styles.loadingText}>Loading Privacy Policy...</Text>
        </LinearGradient>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={styles.errorContainer}>
        <StatusBar backgroundColor="#5a000b" barStyle="light-content" />
        <LinearGradient
          colors={["#1a2a39", "#5a000b"]}
          style={styles.errorGradient}
        >
          <Ionicons name="alert-circle-outline" size={60} color="#FFD700" />
          <Text style={styles.errorTitle}>Oops! Something went wrong</Text>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity
            style={styles.retryButton}
            onPress={retryFetchPolicy}
          >
            <Text style={styles.retryButtonText}>Try Again</Text>
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
            <AppHeader showBackButton={true} backRoute="home" hideMenuIcon={true} />
          </View>

          {/* Hero Section */}
          <LinearGradient
            colors={["#1a2a39", "#5a000b"]}
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
              { paddingBottom: Math.max(insets.bottom, 20) + 80 }, // Account for tab bar + extra padding
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
                  <Ionicons name="lock-closed" size={24} color="#1a2a39" />
                  <Text style={styles.contentHeaderText}>
                    Your Privacy Matters
                  </Text>
                </View>

                <Text style={styles.contentText}>
                  {translations.defaultPrivacyPolicyDiscription}
                </Text>

                {/* Data Collection Section */}
                <View style={styles.sectionContainer}>
                  <View style={styles.sectionHeader}>
                    <Ionicons
                      name="documents-outline"
                      size={20}
                      color="#1a2a39"
                    />
                    <Text style={styles.sectionTitle}>Data Collection</Text>
                  </View>
                  <Text style={styles.sectionText}>
                    We collect only the necessary information to provide you
                    with the best digital gold investment experience while
                    maintaining the highest standards of privacy.
                  </Text>
                </View>

                {/* Security Section */}
                <View style={styles.sectionContainer}>
                  <View style={styles.sectionHeader}>
                    <Ionicons
                      name="shield-checkmark-outline"
                      size={20}
                      color="#1a2a39"
                    />
                    <Text style={styles.sectionTitle}>Data Security</Text>
                  </View>
                  <Text style={styles.sectionText}>
                    Your personal and financial information is protected with
                    industry-leading encryption and security measures to ensure
                    complete confidentiality.
                  </Text>
                </View>

                {/* Mid Section Title */}
                <View style={styles.midTitleContainer}>
                  <LinearGradient
                    colors={["rgba(133, 1, 17, 0.1)", "rgba(133, 1, 17, 0.05)"]}
                    style={styles.midTitleGradient}
                  >
                    <Text style={styles.midTitle}>
                      {translations.defaultprivacyMidTitle}
                    </Text>
                  </LinearGradient>
                </View>

                <Text style={styles.contentText}>
                  {translations.defaultPrivacyPolicyDiscription2}
                </Text>

                {/* Usage Section */}
                <View style={styles.sectionContainer}>
                  <View style={styles.sectionHeader}>
                    <Ionicons
                      name="analytics-outline"
                      size={20}
                      color="#1a2a39"
                    />
                    <Text style={styles.sectionTitle}>
                      How We Use Your Data
                    </Text>
                  </View>
                  <Text style={styles.sectionText}>
                    Your data is used exclusively to enhance your gold
                    investment experience, provide personalized services, and
                    ensure compliance with financial regulations.
                  </Text>
                </View>

                {/* Rights Section */}
                <View style={styles.sectionContainer}>
                  <View style={styles.sectionHeader}>
                    <Ionicons name="person-outline" size={20} color="#1a2a39" />
                    <Text style={styles.sectionTitle}>Your Rights</Text>
                  </View>
                  <Text style={styles.sectionText}>
                    You have complete control over your personal data, including
                    the right to access, modify, or delete your information at
                    any time.
                  </Text>
                </View>

                <View style={styles.contactSection}>
                  <LinearGradient
                    colors={["#1a2a39", "#5a000b"]}
                    style={styles.contactGradient}
                  >
                    <Ionicons
                      name="help-circle-outline"
                      size={24}
                      color="#FFD700"
                    />
                    <Text style={styles.contactTitle}>Privacy Questions?</Text>
                    <Text style={styles.contactText}>
                      Contact our privacy team for any questions about how we
                      protect your data
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
  },
  backgroundImage: {
    flex: 1,
    width: "100%",
    height: "100%",
  },
  safeArea: {
    flex: 1,
    backgroundColor: "rgba(255, 255, 255, 0.1)",
  },
  headerContainer: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    zIndex: 20,
    backgroundColor: "transparent",
    paddingHorizontal: 16,
  },
  heroSection: {
    paddingTop: 60,
    paddingBottom: 20,
    paddingHorizontal: 20,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
    marginBottom: 20,
  },
  heroContent: {
    alignItems: "center",
  },
  heroTitle: {
    fontSize: moderateScale(22),
    fontWeight: "700",
    color: "#FFFFFF",
    textAlign: "center",
    marginTop: 12,
    marginBottom: 8,
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
    paddingHorizontal: 16,
  },
  contentCard: {
    borderRadius: 20,
    overflow: "hidden",
    elevation: 5,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  cardGradient: {
    padding: 24,
  },
  contentHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(133, 1, 17, 0.2)",
  },
  contentHeaderText: {
    fontSize: moderateScale(20),
    fontWeight: "600",
    color: "#1a2a39",
    marginLeft: 12,
  },
  contentText: {
    fontSize: moderateScale(16),
    color: "#333333",
    lineHeight: moderateScale(24),
    marginBottom: 24,
  },
  sectionContainer: {
    marginBottom: 20,
    padding: 16,
    backgroundColor: "rgba(133, 1, 17, 0.05)",
    borderRadius: 12,
    borderLeftWidth: 4,
    borderLeftColor: "#1a2a39",
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: moderateScale(16),
    fontWeight: "600",
    color: "#1a2a39",
    marginLeft: 8,
  },
  sectionText: {
    fontSize: moderateScale(14),
    color: "#555555",
    lineHeight: moderateScale(20),
  },
  midTitleContainer: {
    marginVertical: 20,
    borderRadius: 12,
    overflow: "hidden",
  },
  midTitleGradient: {
    padding: 16,
    alignItems: "center",
  },
  midTitle: {
    fontSize: moderateScale(20),
    fontWeight: "600",
    color: "#1a2a39",
    textAlign: "center",
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
    fontSize: moderateScale(18),
    fontWeight: "600",
    color: "#FFFFFF",
    marginTop: 8,
    marginBottom: 4,
  },
  contactText: {
    fontSize: moderateScale(14),
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
    fontSize: moderateScale(16),
    color: "#FFFFFF",
    marginTop: 16,
  },
  errorContainer: {
    flex: 1,
  },
  errorGradient: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 32,
  },
  errorTitle: {
    fontSize: moderateScale(20),
    fontWeight: "600",
    color: "#FFFFFF",
    marginTop: 16,
    marginBottom: 8,
    textAlign: "center",
  },
  errorText: {
    fontSize: moderateScale(14),
    color: "rgba(255, 255, 255, 0.8)",
    textAlign: "center",
    marginBottom: 24,
  },
  retryButton: {
    backgroundColor: "#FFD700",
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 25,
  },
  retryButtonText: {
    fontSize: moderateScale(16),
    fontWeight: "600",
    color: "#1a2a39",
  },
});
