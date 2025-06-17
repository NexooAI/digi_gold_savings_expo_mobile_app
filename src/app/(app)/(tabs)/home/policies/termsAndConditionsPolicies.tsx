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
        setError(null);
        api
          .get("/policies/type/terms_and_conditions")
          .then((response: any) => {
            setPolicy(response.data.data);
            //console.log("Terms and Conditions loaded successfully:", response.data.data);
          })
          .catch((err: any) => {
            console.error("Error fetching Terms and Conditions:", err);
            throw new Error("Policy data not found");
          })
          .finally(() => {
            setLoading(false);
          });
      } catch (err: any) {
        console.error("Error in fetchPolicy:", err);
        setError(err);
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
      const response = await api.get("/policies/type/terms_and_conditions");
      setPolicy(response.data.data);
      //console.log("Terms and Conditions retried and loaded successfully:", response.data.data);
    } catch (err: any) {
      console.error("Error retrying Terms and Conditions:", err);
      setError(err);
    } finally {
      setLoading(false);
    }
  };

  // Fallback translations in case API data is missing
  const translations = useMemo(
    () => ({
      defaultTitle: t("termsAndConditionsTitle"), // e.g., "Terms & Conditions"
      defaultContent: t("termsAndConditionsContent"), // default short terms text
      defaultDiscription: t("termsAndConditionsDiscription"), // default long terms text
    }),
    [language]
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <StatusBar backgroundColor="#5a000b" barStyle="light-content" />
        <LinearGradient
          colors={["#850111", "#5a000b"]}
          style={styles.loadingGradient}
        >
          <ActivityIndicator size="large" color="#FFD700" />
          <Text style={styles.loadingText}>Loading Terms & Conditions...</Text>
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
          <Text style={styles.errorTitle}>Oops! Something went wrong</Text>
          <Text style={styles.errorText}>
            Error loading policy: {error.message}
          </Text>
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
            <AppHeader showBackButton={true} backRoute="index" />
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
                <Ionicons
                  name="document-text-outline"
                  size={40}
                  color="#FFD700"
                />
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
                  <Ionicons name="shield-checkmark" size={24} color="#850111" />
                  <Text style={styles.contentHeaderText}>
                    Our Commitment to You
                  </Text>
                </View>

                <Text style={styles.contentText}>
                  {translations.defaultDiscription}
                </Text>

                {/* Additional styled sections */}
                <View style={styles.sectionContainer}>
                  <View style={styles.sectionHeader}>
                    <Ionicons name="people-outline" size={20} color="#850111" />
                    <Text style={styles.sectionTitle}>User Agreement</Text>
                  </View>
                  <Text style={styles.sectionText}>
                    By using our digital gold savings platform, you agree to
                    these terms and conditions.
                  </Text>
                </View>

                <View style={styles.sectionContainer}>
                  <View style={styles.sectionHeader}>
                    <Ionicons name="star-outline" size={20} color="#850111" />
                    <Text style={styles.sectionTitle}>Service Quality</Text>
                  </View>
                  <Text style={styles.sectionText}>
                    We are committed to providing you with the highest quality
                    digital gold investment services.
                  </Text>
                </View>

                <View style={styles.sectionContainer}>
                  <View style={styles.sectionHeader}>
                    <Ionicons
                      name="lock-closed-outline"
                      size={20}
                      color="#850111"
                    />
                    <Text style={styles.sectionTitle}>Security & Privacy</Text>
                  </View>
                  <Text style={styles.sectionText}>
                    Your financial information and personal data are protected
                    with bank-level security.
                  </Text>
                </View>

                <View style={styles.contactSection}>
                  <LinearGradient
                    colors={["#850111", "#5a000b"]}
                    style={styles.contactGradient}
                  >
                    <Ionicons name="mail-outline" size={24} color="#FFD700" />
                    <Text style={styles.contactTitle}>Questions?</Text>
                    <Text style={styles.contactText}>
                      Contact our support team for any clarifications
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
    color: "#850111",
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
    borderLeftColor: "#850111",
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: moderateScale(16),
    fontWeight: "600",
    color: "#850111",
    marginLeft: 8,
  },
  sectionText: {
    fontSize: moderateScale(14),
    color: "#555555",
    lineHeight: moderateScale(20),
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
    color: "#850111",
  },
});
