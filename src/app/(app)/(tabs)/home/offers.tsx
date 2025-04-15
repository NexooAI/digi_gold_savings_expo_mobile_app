import React from "react";
import {
  View,
  Text,
  ScrollView,
  ImageBackground,
  TouchableOpacity,
  StyleSheet,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { MaterialIcons, Ionicons, FontAwesome } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import AppHeader from "@/app/components/AppHeader";
import { moderateScale } from "react-native-size-matters";
import { theme } from "@/constants/theme";

export default function Offers() {
  const router = useRouter();

  const offers = [
    {
      id: 1,
      title: "Festive Special",
      description: "Enjoy up to 20% off on select gold jewelry",
      icon: "festival" as "festival",
      color: "#FFD700",
    },
    {
      id: 2,
      title: "New Arrivals",
      description: "Flat 15% off on diamond collections",
      icon: "diamond" as "diamond",
      color: "#40E0D0",
    },
    {
      id: 3,
      title: "Exclusive Membership",
      description: "Special offers all year round",
      icon: "star" as "star",
      color: theme.colors.primary,
    },
  ];

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      {/* <View style={styles.header}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backButton}
        >
          <Ionicons name="arrow-back" size={24} color="white" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Exclusive Offers</Text>
      </View> */}
      <AppHeader showBackButton={true} backRoute="index" />

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Hero Section */}
        <LinearGradient
          colors={[theme.colors.primary, "#a8000a"]}
          style={styles.hero}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
        >
          <FontAwesome name="tag" size={48} color="rgba(255,255,255,0.2)" />
          <Text style={styles.heroTitle}>Special Deals Await!</Text>
          <Text style={styles.heroSubtitle}>
            Discover limited-time offers curated just for you
          </Text>
        </LinearGradient>

        {/* Offers List */}
        <View style={styles.offersContainer}>
          {offers.map((offer) => (
            <View key={offer.id} style={styles.card}>
              <LinearGradient
                colors={["white", "#FFF8F8"]}
                style={styles.cardGradient}
              >
                <View style={styles.cardHeader}>
                  <View
                    style={[
                      styles.iconContainer,
                      { backgroundColor: offer.color },
                    ]}
                  >
                    <MaterialIcons name={offer.icon} size={24} color="white" />
                  </View>
                  <Text style={styles.cardTitle}>{offer.title}</Text>
                </View>
                <Text style={styles.cardDescription}>{offer.description}</Text>
                <TouchableOpacity style={styles.claimButton}>
                  <Text style={styles.claimButtonText}>View Offer</Text>
                  <MaterialIcons
                    name="chevron-right"
                    size={20}
                    color={theme.colors.primary}
                  />
                </TouchableOpacity>
              </LinearGradient>
            </View>
          ))}
        </View>

        {/* Footer CTA */}
        <TouchableOpacity
          style={styles.ctaButton}
          onPress={() => router.push("/membership")}
        >
          <Text style={styles.ctaText}>Become a VIP Member</Text>
          <Ionicons name="sparkles" size={20} color="white" />
        </TouchableOpacity>

        <View style={styles.spacer} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F9F9F9",
  },
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
  scrollContent: {
    paddingVertical: 24,
    paddingHorizontal: 20,
  },
  hero: {
    borderRadius: 16,
    padding: 24,
    marginBottom: 24,
    overflow: "hidden",
  },
  heroTitle: {
    color: "white",
    fontSize: 24,
    fontWeight: "700",
    marginTop: 16,
    marginBottom: 8,
  },
  heroSubtitle: {
    color: "rgba(255,255,255,0.9)",
    fontSize: 16,
    lineHeight: 24,
  },
  offersContainer: {
    marginBottom: 24,
  },
  card: {
    borderRadius: 16,
    marginBottom: 16,
    backgroundColor: "white",
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  cardGradient: {
    padding: 20,
    borderRadius: 16,
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  iconContainer: {
    borderRadius: 12,
    padding: 10,
    marginRight: 12,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#333",
  },
  cardDescription: {
    fontSize: 14,
    color: "#666",
    lineHeight: 22,
    marginBottom: 16,
  },
  claimButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-end",
  },
  claimButtonText: {
    color: theme.colors.primary,
    fontWeight: "600",
    marginRight: 4,
  },
  ctaButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: theme.colors.primary,
    paddingVertical: 16,
    borderRadius: 12,
    marginHorizontal: 20,
  },
  ctaText: {
    color: "white",
    fontWeight: "600",
    marginRight: 8,
    fontSize: 16,
  },
  spacer: {
    height: moderateScale(80),
  },
});
