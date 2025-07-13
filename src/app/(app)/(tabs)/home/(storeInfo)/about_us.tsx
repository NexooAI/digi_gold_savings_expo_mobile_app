import React, { useRef, useEffect, useState } from "react";
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
  Dimensions,
  StatusBar,
} from "react-native";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";
import AppHeader from "@/app/components/AppHeader";
import { Ionicons, MaterialIcons, FontAwesome5, AntDesign } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { moderateScale } from "react-native-size-matters";
import { theme } from "@/constants/theme";
import { LinearGradient } from "expo-linear-gradient";

const { width, height } = Dimensions.get('window');

interface Milestone {
  year: string;
  title: string;
  icon: string;
  description: string;
  color: string;
}

const milestones: Milestone[] = [
  { 
    year: "2020", 
    title: "Founded in Mumbai", 
    icon: "storefront",
    description: "Started our journey with a vision to create timeless jewelry",
    color: "#FF6B6B"
  },
  { 
    year: "2021", 
    title: "First Store Expansion", 
    icon: "store",
    description: "Opened our second store and expanded our presence in Mumbai",
    color: "#4ECDC4"
  },
  { 
    year: "2022", 
    title: "Luxury Collection Launch", 
    icon: "diamond",
    description: "Introduced our premium luxury jewelry collection",
    color: "#45B7D1"
  },
  { 
    year: "2023", 
    title: "Digital Experience", 
    icon: "smartphone",
    description: "Embraced technology to enhance customer experience",
    color: "#96CEB4"
  },
  { 
    year: "2024", 
    title: "National Expansion", 
    icon: "public",
    description: "Expanded to multiple cities across India",
    color: "#FFA726"
  },
];

const stats = [
  { number: "4+", label: "Years of Excellence", icon: "trophy" },
  { number: "50+", label: "Stores Worldwide", icon: "store" },
  { number: "100K+", label: "Happy Customers", icon: "heart" },
  { number: "1000+", label: "Unique Designs", icon: "diamond" },
];

export default function AboutUs() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const scrollY = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;
  const { width: screenWidth } = useWindowDimensions();
  const [activeMilestone, setActiveMilestone] = useState(0);

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 1000,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 1200,
        useNativeDriver: true,
      }),
    ]).start();

    // Start rotation animation
    Animated.loop(
      Animated.timing(rotateAnim, {
        toValue: 1,
        duration: 20000,
        useNativeDriver: true,
      })
    ).start();
  }, []);

  // Removed header opacity animation since header is now fixed

  const rotateInterpolate = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  const renderMilestone = ({ item, index }: { item: Milestone; index: number }) => (
    <TouchableOpacity
      onPress={() => setActiveMilestone(index)}
      activeOpacity={0.8}
    >
      <Animated.View 
        style={[
          styles.milestoneCard,
          { 
            width: screenWidth * 0.8,
            backgroundColor: activeMilestone === index ? item.color + '20' : item.color + '15',
            borderLeftColor: item.color,
            borderLeftWidth: activeMilestone === index ? 6 : 4,
            transform: [
              { scale: activeMilestone === index ? 1.02 : 1 },
            ],
          }
        ]}
      >
        <View style={styles.milestoneHeader}>
          <Animated.View 
            style={[
              styles.iconContainer, 
              { 
                backgroundColor: item.color,
                transform: activeMilestone === index ? [{ rotate: rotateInterpolate }] : [],
              }
            ]}
          >
            <MaterialIcons name={item.icon as any} size={24} color="white" />
          </Animated.View>
          <View style={styles.milestoneText}>
            <Text style={styles.milestoneYear}>{item.year}</Text>
            <Text style={styles.milestoneTitle}>{item.title}</Text>
          </View>
        </View>
        <Text style={styles.milestoneDescription}>{item.description}</Text>
        {activeMilestone === index && (
          <View style={[styles.activeIndicator, { backgroundColor: item.color }]} />
        )}
      </Animated.View>
    </TouchableOpacity>
  );

  const renderStat = ({ item, index }: { item: any; index: number }) => (
    <Animated.View 
      style={[
        styles.statCard,
        {
          opacity: fadeAnim,
          transform: [{ translateY: slideAnim }],
        }
      ]}
    >
      <View style={styles.statIconContainer}>
        <MaterialIcons name={item.icon as any} size={24} color="white" />
      </View>
      <Text style={styles.statNumber}>{item.number}</Text>
      <Text style={styles.statLabel}>{item.label}</Text>
    </Animated.View>
  );

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      style={styles.container}
    >
      <StatusBar barStyle="light-content" backgroundColor="#7B0006" />
      <SafeAreaView style={styles.safeArea}>
        {/* Fixed Header */}
        <View style={styles.fixedHeader}>
          <AppHeader showBackButton={true} backRoute="index" showDrawerToggle={false} />
        </View>

        <Animated.ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Hero Section */}
          <LinearGradient
            colors={['#7B0006', '#9B1B30', '#C44569']}
            style={styles.heroSection}
          >
            {/* Floating Elements */}
            <Animated.View 
              style={[
                styles.floatingElement,
                styles.floatingGem1,
                {
                  transform: [
                    { translateY: slideAnim },
                    { rotate: rotateInterpolate },
                  ],
                  opacity: fadeAnim,
                }
              ]}
            >
              <FontAwesome5 name="gem" size={20} color="rgba(255,255,255,0.3)" />
            </Animated.View>
            
            <Animated.View 
              style={[
                styles.floatingElement,
                styles.floatingGem2,
                {
                  transform: [
                    { translateY: slideAnim },
                    { rotate: rotateInterpolate },
                  ],
                  opacity: fadeAnim,
                }
              ]}
            >
              <FontAwesome5 name="diamond" size={16} color="rgba(255,255,255,0.2)" />
            </Animated.View>

            <Animated.View 
              style={[
                styles.heroContent,
                {
                  opacity: fadeAnim,
                  transform: [
                    { translateY: slideAnim },
                    { scale: scaleAnim },
                  ],
                }
              ]}
            >
              <View style={styles.heroIconContainer}>
                <FontAwesome5 name="crown" size={40} color="white" />
              </View>
              <Text style={styles.heroTitle}>DC Jewellers</Text>
              <Text style={styles.heroSubtitle}>Crafting Timeless Elegance Since 2020</Text>
              <View style={styles.heroDivider} />
            </Animated.View>
          </LinearGradient>

          {/* Stats Section */}
          <View style={styles.statsContainer}>
            <Text style={styles.statsTitle}>Our Achievements</Text>
            <FlatList
              data={stats}
              renderItem={renderStat}
              keyExtractor={(item) => item.label}
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.statsList}
              style={styles.statsFlatList}
            />
          </View>

          {/* Main Content */}
          <View style={styles.mainContent}>
            {/* Who We Are Section */}
            <Animated.View 
              style={[
                styles.contentCard,
                {
                  opacity: fadeAnim,
                  transform: [{ translateY: slideAnim }],
                }
              ]}
            >
              <View style={styles.sectionHeader}>
                <View style={styles.sectionIconContainer}>
                  <FontAwesome5 name="gem" size={24} color="white" />
                </View>
                <Text style={styles.sectionTitle}>Who We Are</Text>
              </View>
              <Text style={styles.sectionText}>
                DC Jewellers blends centuries-old craftsmanship with contemporary design. 
                Our master artisans pour passion into every piece, creating heirlooms that 
                transcend generations. We believe in the power of tradition meeting innovation.
              </Text>
            </Animated.View>

            {/* Image Section */}
            <Animated.View 
              style={[
                styles.imageCard,
                {
                  opacity: fadeAnim,
                  transform: [{ translateY: slideAnim }],
                }
              ]}
            >
              <ImageBackground
                source={theme.image.store_image}
                style={styles.backgroundImage}
                imageStyle={styles.backgroundImageStyle}
              >
                <LinearGradient
                  colors={['transparent', 'rgba(0,0,0,0.7)']}
                  style={styles.imageOverlay}
                >
                                     <Text style={styles.imageText}>Our Legacy</Text>
                   <Text style={styles.imageSubtext}>Four years of excellence</Text>
                </LinearGradient>
              </ImageBackground>
            </Animated.View>

            {/* Journey Section */}
            <View style={styles.journeySection}>
              <View style={styles.sectionHeader}>
                <View style={styles.sectionIconContainer}>
                  <MaterialIcons name="timeline" size={24} color="white" />
                </View>
                <Text style={styles.sectionTitle}>Our Journey</Text>
              </View>
              <FlatList
                data={milestones}
                renderItem={renderMilestone}
                keyExtractor={(item) => item.year}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.milestonesList}
              />
            </View>

            {/* Promise Section */}
            <Animated.View 
              style={[
                styles.contentCard,
                {
                  opacity: fadeAnim,
                  transform: [{ translateY: slideAnim }],
                }
              ]}
            >
              <View style={styles.sectionHeader}>
                <View style={styles.sectionIconContainer}>
                  <Ionicons name="diamond" size={24} color="white" />
                </View>
                <Text style={styles.sectionTitle}>Our Promise</Text>
              </View>
              <Text style={styles.sectionText}>
                We commit to delivering exceptional quality, innovative designs, and 
                personalized service. Every piece tells a story, and we're honored to 
                be part of yours. Your trust is our greatest treasure.
              </Text>
            </Animated.View>

            {/* CTA Button */}
            <Animated.View
              style={[
                styles.ctaButton,
                {
                  transform: [{ scale: scaleAnim }],
                }
              ]}
            >
              <TouchableOpacity
                style={styles.ctaTouchable}
                onPress={() => router.push("/(tabs)/home/(storeInfo)/contact_us")}
                activeOpacity={0.8}
              >
                <LinearGradient
                  colors={['#7B0006', '#9B1B30', '#C44569']}
                  style={styles.ctaGradient}
                >
                  <View style={styles.ctaIconContainer}>
                    <FontAwesome5 name="store" size={16} color="white" />
                  </View>
                  <Text style={styles.ctaText}>Visit Our Store</Text>
                  <AntDesign name="arrowright" size={20} color="white" />
                </LinearGradient>
              </TouchableOpacity>
            </Animated.View>
          </View>
        </Animated.ScrollView>
      </SafeAreaView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8f9fa",
  },
  safeArea: {
    flex: 1,
  },
  fixedHeader: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    zIndex: 20,
    backgroundColor: "transparent",
  },
  scrollContent: {
    paddingTop: 10,
  },
  heroSection: {
    height: 300,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 20,
  },
  heroContent: {
    alignItems: "center",
  },
  heroIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "rgba(255,255,255,0.2)",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 20,
  },
  heroTitle: {
    fontSize: 36,
    fontWeight: "800",
    color: "white",
    textAlign: "center",
    marginBottom: 8,
    letterSpacing: 2,
  },
  heroSubtitle: {
    fontSize: 16,
    color: "rgba(255,255,255,0.9)",
    textAlign: "center",
    marginBottom: 20,
    letterSpacing: 1,
  },
  heroDivider: {
    width: 60,
    height: 3,
    backgroundColor: "white",
    borderRadius: 2,
  },
  floatingElement: {
    position: "absolute",
    zIndex: 1,
  },
  floatingGem1: {
    top: 50,
    right: 30,
  },
  floatingGem2: {
    bottom: 80,
    left: 20,
  },
  statsContainer: {
    backgroundColor: "white",
    paddingVertical: 25,
    marginTop: -15,
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    minHeight: 140,
  },
  statsTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: theme.colors.primary,
    textAlign: "center",
    marginBottom: 20,
    paddingHorizontal: 20,
  },
  statsList: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  statsFlatList: {
    flexGrow: 0,
  },
  statCard: {
    alignItems: "center",
    marginHorizontal: 15,
    minWidth: 100,
    backgroundColor: "rgba(123,0,6,0.05)",
    borderRadius: 16,
    padding: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  statIconContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: theme.colors.primary,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 8,
  },
  statNumber: {
    fontSize: 22,
    fontWeight: "800",
    color: theme.colors.primary,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 11,
    color: "#666",
    textAlign: "center",
    fontWeight: "600",
    lineHeight: 14,
  },
  mainContent: {
    paddingHorizontal: 20,
    paddingTop: 15,
  },
  contentCard: {
    backgroundColor: "white",
    borderRadius: 20,
    padding: 24,
    marginBottom: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 5,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },
  sectionIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: theme.colors.primary,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 16,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: "700",
    color: theme.colors.primary,
  },
  sectionText: {
    fontSize: 16,
    color: "#666",
    lineHeight: 26,
    letterSpacing: 0.3,
  },
  imageCard: {
    borderRadius: 20,
    overflow: "hidden",
    marginBottom: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 5,
  },
  backgroundImage: {
    height: 250,
  },
  backgroundImageStyle: {
    borderRadius: 20,
  },
  imageOverlay: {
    flex: 1,
    justifyContent: "flex-end",
    padding: 20,
  },
  imageText: {
    color: "white",
    fontSize: 24,
    fontWeight: "700",
    marginBottom: 4,
  },
  imageSubtext: {
    color: "rgba(255,255,255,0.8)",
    fontSize: 14,
  },
  journeySection: {
    marginBottom: 20,
  },
  milestonesList: {
    paddingBottom: 20,
  },
  milestoneCard: {
    backgroundColor: "white",
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    borderLeftWidth: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 3,
  },
  milestoneHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 16,
  },
  milestoneText: {
    flex: 1,
  },
  milestoneYear: {
    fontSize: 18,
    fontWeight: "800",
    color: theme.colors.primary,
    marginBottom: 2,
  },
  milestoneTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
  },
  milestoneDescription: {
    fontSize: 14,
    color: "#666",
    lineHeight: 20,
  },
  activeIndicator: {
    position: "absolute",
    top: 0,
    right: 0,
    width: 0,
    height: 0,
    borderLeftWidth: 15,
    borderRightWidth: 0,
    borderBottomWidth: 15,
    borderLeftColor: "transparent",
    borderRightColor: "transparent",
    borderBottomColor: "transparent",
  },
  ctaButton: {
    borderRadius: 16,
    overflow: "hidden",
    marginBottom: 40,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 8,
  },
  ctaTouchable: {
    borderRadius: 16,
    overflow: "hidden",
  },
  ctaGradient: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 18,
    paddingHorizontal: 24,
  },
  ctaIconContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "rgba(255,255,255,0.2)",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  ctaText: {
    color: "white",
    fontSize: 18,
    fontWeight: "700",
    marginRight: 12,
  },
});
