import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  Dimensions,
  StyleSheet,
  Animated,
  ImageBackground,
  Platform,
} from "react-native";
import { useRouter } from "expo-router";
import { t } from "@/i18n";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { theme } from "@/constants/theme";
import api from "@/services/api";
import AsyncStorage from "@react-native-async-storage/async-storage";

const { width: screenWidth } = Dimensions.get("window");
const CARD_WIDTH = screenWidth * 0.8;
const CARD_HEIGHT = 280;
const CARD_MARGIN = 16;

interface Scheme {
  SCHEMEID: number;
  SCHEMENAME: string;
  DESCRIPTION: string;
  BENEFITS?: string[];
  SCHEMETYPE: string;
  SLOGAN?: string;
  IMAGE?: string;
  ICON?: string;
  DURATION_MONTHS?: number;
  FIXED?: string;
  ACTIVE: string;
  chits: Array<{
    CHITID: number;
    AMOUNT: string;
    NOINS?: number;
    TOTALMEMBERS?: number;
    PAYMENT_FREQUENCY?: string;
    ACTIVE?: string;
    REGNO?: string;
    PAYMENT_FREQUENCY_ID?: string;
  }>;
}

interface SchemesHorizontalScrollProps {
  onSchemePress?: (scheme: Scheme) => void;
  showViewAll?: boolean;
}

export default function SchemesHorizontalScroll({ 
  onSchemePress, 
  showViewAll = true 
}: SchemesHorizontalScrollProps) {
  const [schemes, setSchemes] = useState<Scheme[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedScheme, setSelectedScheme] = useState<number | null>(null);
  const router = useRouter();
  const flatListRef = useRef<FlatList>(null);
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const shimmerAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    fetchSchemes();
    startShimmerAnimation();
  }, []);

  const startShimmerAnimation = () => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(shimmerAnim, {
          toValue: 1,
          duration: 1500,
          useNativeDriver: true,
        }),
        Animated.timing(shimmerAnim, {
          toValue: 0,
          duration: 1500,
          useNativeDriver: true,
        }),
      ])
    ).start();
  };

  const fetchSchemes = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/schemes`);
      if (response.data?.data) {
        // Filter active schemes and take first 5 for horizontal scroll
        const activeSchemes = response.data.data
          .filter((scheme: Scheme) => scheme.ACTIVE === "Y")
          .slice(0, 5);
        setSchemes(activeSchemes);
      }
    } catch (error) {
      console.error("Error fetching schemes:", error);
      // Use fallback data
      setSchemes(fallbackSchemes);
    } finally {
      setLoading(false);
    }
  };

  const handleSchemePress = async (scheme: Scheme) => {
    try {
      // Store scheme data for join page
      const schemeDataToStore = {
        schemeId: scheme.SCHEMEID,
        name: scheme.SCHEMENAME,
        description: scheme.DESCRIPTION,
        type: scheme.SCHEMETYPE,
        chits: scheme.chits || [],
        schemeType: scheme.SCHEMETYPE.toLowerCase() === "flexi" ? "flexi" : "fixed",
        benefits: scheme.BENEFITS,
        timestamp: new Date().toISOString(),
      };

      await AsyncStorage.setItem(
        "@current_scheme_data",
        JSON.stringify(schemeDataToStore)
      );

      if (onSchemePress) {
        onSchemePress(scheme);
      } else {
        router.push({
          pathname: "/home/join_savings",
          params: {
            schemeId: scheme.SCHEMEID.toString(),
          },
        });
      }
    } catch (error) {
      console.error("Error handling scheme press:", error);
    }
  };

  const getSchemeGradient = (schemeType: string): [string, string, string] => {
    switch (schemeType.toLowerCase()) {
      case "daily":
        return ["#FF6B6B", "#FF8E53", "#FFA726"];
      case "weekly":
        return ["#4ECDC4", "#44A08D", "#2E8B57"];
      case "monthly":
        return ["#A8E6CF", "#7FCDCD", "#5F9EA0"];
      case "flexi":
        return ["#FFD93D", "#FFB347", "#FF8C42"];
      default:
        return ["#667eea", "#764ba2", "#f093fb"];
    }
  };

  const getSchemeIcon = (schemeType: string): string => {
    switch (schemeType.toLowerCase()) {
      case "daily":
        return "today";
      case "weekly":
        return "calendar";
      case "monthly":
        return "moon";
      case "flexi":
        return "options";
      default:
        return "diamond";
    }
  };

  const getSchemeImage = (schemeType: string) => {
    switch (schemeType.toLowerCase()) {
      case "daily":
        return require("../../../assets/images/scheme1.jpg");
      case "weekly":
        return require("../../../assets/images/scheme2.jpg");
      case "monthly":
        return require("../../../assets/images/scheme3.jpg");
      case "flexi":
        return require("../../../assets/images/scheme4.jpg");
      default:
        return require("../../../assets/images/scheme1.jpg");
    }
  };

  const renderShimmerCard = () => (
    <View style={styles.cardContainer}>
      <View style={styles.card}>
        <LinearGradient
          colors={["#f0f0f0", "#e0e0e0", "#f0f0f0"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.cardGradient}
        >
          <Animated.View
            style={[
              styles.shimmerOverlay,
              {
                opacity: shimmerAnim,
                transform: [
                  {
                    translateX: shimmerAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [-CARD_WIDTH, CARD_WIDTH],
                    }),
                  },
                ],
              },
            ]}
          />
          <View style={styles.cardHeader}>
            <View style={styles.schemeTypeContainer}>
              <View style={[styles.iconContainer, { backgroundColor: "#ddd" }]} />
              <View style={[styles.shimmerText, { width: 60, height: 16 }]} />
            </View>
            <View style={[styles.shimmerBadge, { width: 40, height: 20 }]} />
          </View>
          <View style={styles.cardContent}>
            <View style={[styles.shimmerText, { width: "80%", height: 24, marginBottom: 8 }]} />
            <View style={[styles.shimmerText, { width: "60%", height: 16, marginBottom: 12 }]} />
            <View style={[styles.shimmerText, { width: "100%", height: 16, marginBottom: 4 }]} />
            <View style={[styles.shimmerText, { width: "90%", height: 16, marginBottom: 4 }]} />
            <View style={[styles.shimmerText, { width: "70%", height: 16 }]} />
          </View>
          <View style={styles.cardFooter}>
            <View style={styles.benefitsPreview}>
              <View style={[styles.shimmerText, { width: "60%", height: 14, marginBottom: 6 }]} />
              <View style={[styles.shimmerText, { width: "80%", height: 14 }]} />
            </View>
            <View style={[styles.shimmerButton, { width: 80, height: 32 }]} />
          </View>
        </LinearGradient>
      </View>
    </View>
  );

  const renderSchemeCard = ({ item, index }: { item: Scheme; index: number }) => {
    const isSelected = selectedScheme === item.SCHEMEID;
    const gradientColors = getSchemeGradient(item.SCHEMETYPE);
    const schemeIcon = getSchemeIcon(item.SCHEMETYPE);
    const schemeImage = getSchemeImage(item.SCHEMETYPE);

    return (
      <Animated.View
        style={[
          styles.cardContainer,
          {
            transform: [{ scale: isSelected ? 1.05 : 1 }],
          },
        ]}
      >
        <TouchableOpacity
          style={styles.card}
          onPress={() => {
            setSelectedScheme(item.SCHEMEID);
            handleSchemePress(item);
          }}
          activeOpacity={0.9}
        >
          <ImageBackground
            source={schemeImage}
            style={styles.cardBackground}
            imageStyle={styles.backgroundImage}
          >
            <LinearGradient
              colors={gradientColors}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.cardGradient}
            >
              {/* Header */}
              <View style={styles.cardHeader}>
                <View style={styles.schemeTypeContainer}>
                  <View style={styles.iconContainer}>
                    <Ionicons name={schemeIcon as any} size={20} color="#fff" />
                  </View>
                  <Text style={styles.schemeType}>{item.SCHEMETYPE}</Text>
                </View>
                <View style={styles.badgeContainer}>
                  <Text style={styles.badgeText}>
                    {item.SCHEMETYPE === "Flexi" ? "Flexi" : "Fixed"}
                  </Text>
                </View>
              </View>

              {/* Content */}
              <View style={styles.cardContent}>
                <Text style={styles.schemeName} numberOfLines={2}>
                  {item.SCHEMENAME}
                </Text>
                {item.SLOGAN && (
                  <Text style={styles.slogan} numberOfLines={1}>
                    {item.SLOGAN}
                  </Text>
                )}
                <Text style={styles.description} numberOfLines={3}>
                  {item.DESCRIPTION || "Save gold with our flexible plan."}
                </Text>
              </View>

              {/* Footer */}
              <View style={styles.cardFooter}>
                <View style={styles.benefitsPreview}>
                  {item.BENEFITS?.slice(0, 2).map((benefit, idx) => (
                    <View key={idx} style={styles.benefitItem}>
                      <Ionicons name="checkmark-circle" size={14} color="#fff" />
                      <Text style={styles.benefitText} numberOfLines={1}>
                        {benefit}
                      </Text>
                    </View>
                  ))}
                </View>
                <View style={styles.joinButton}>
                  <Text style={styles.joinButtonText}>Join Now</Text>
                  <Ionicons name="arrow-forward" size={16} color="#fff" />
                </View>
              </View>
            </LinearGradient>
          </ImageBackground>
        </TouchableOpacity>
      </Animated.View>
    );
  };

  const handleViewAll = () => {
    router.push("/(app)/(tabs)/home/schemes");
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <View style={styles.headerContainer}>
          <View style={styles.titleContainer}>
            <Text style={styles.title}>{t("joinSchemes")}</Text>
            <Text style={styles.subtitle}>{t("exploreGoldSavingsPlans")}</Text>
          </View>
          {showViewAll && (
            <TouchableOpacity style={styles.viewAllButton} onPress={handleViewAll}>
              <Text style={styles.viewAllText}>View All</Text>
              <Ionicons name="chevron-forward" size={16} color={theme.colors.primary} />
            </TouchableOpacity>
          )}
        </View>
        <FlatList
          data={[1, 2, 3]} // Show 3 shimmer cards
          renderItem={() => renderShimmerCard()}
          keyExtractor={(_, index) => index.toString()}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.listContainer}
          snapToInterval={CARD_WIDTH + CARD_MARGIN}
          decelerationRate="fast"
          pagingEnabled={false}
          bounces={true}
          style={styles.flatList}
        />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.headerContainer}>
        <View style={styles.titleContainer}>
          <Text style={styles.title}>{t("joinSchemes")}</Text>
          <Text style={styles.subtitle}>{t("exploreGoldSavingsPlans")}</Text>
        </View>
        {showViewAll && (
          <TouchableOpacity style={styles.viewAllButton} onPress={handleViewAll}>
            <Text style={styles.viewAllText}>View All</Text>
            <Ionicons name="chevron-forward" size={16} color={theme.colors.primary} />
          </TouchableOpacity>
        )}
      </View>

      <FlatList
        ref={flatListRef}
        data={schemes}
        renderItem={renderSchemeCard}
        keyExtractor={(item) => item.SCHEMEID.toString()}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.listContainer}
        snapToInterval={CARD_WIDTH + CARD_MARGIN}
        decelerationRate="fast"
        pagingEnabled={false}
        bounces={true}
        style={styles.flatList}
      />
    </View>
  );
}

// Fallback schemes data
const fallbackSchemes: Scheme[] = [
  {
    SCHEMEID: 1,
    SCHEMENAME: "Daily Gold Saver",
    DESCRIPTION: "Save gold daily with our flexible plan. Perfect for consistent savings.",
    BENEFITS: ["Daily savings", "Flexible amounts", "Zero charges", "Instant access"],
    SCHEMETYPE: "Daily",
    SLOGAN: "Save daily, grow steadily",
    ACTIVE: "Y",
    chits: [],
  },
  {
    SCHEMEID: 2,
    SCHEMENAME: "Weekly Gold Plan",
    DESCRIPTION: "Weekly gold savings plan with competitive rates and flexible options.",
    BENEFITS: ["Weekly deposits", "Competitive rates", "Free locker", "Easy tracking"],
    SCHEMETYPE: "Weekly",
    SLOGAN: "Weekly wealth building",
    ACTIVE: "Y",
    chits: [],
  },
  {
    SCHEMEID: 3,
    SCHEMENAME: "Monthly Gold Scheme",
    DESCRIPTION: "Monthly gold investment scheme with high returns and secure storage.",
    BENEFITS: ["Monthly savings", "High returns", "Secure storage", "Tax benefits"],
    SCHEMETYPE: "Monthly",
    SLOGAN: "Monthly milestones",
    ACTIVE: "Y",
    chits: [],
  },
  {
    SCHEMEID: 4,
    SCHEMENAME: "Flexi Gold Saver",
    DESCRIPTION: "Ultimate flexibility in gold savings. Save whenever you want.",
    BENEFITS: ["No fixed schedule", "Save anytime", "Zero penalties", "Maximum flexibility"],
    SCHEMETYPE: "Flexi",
    SLOGAN: "Freedom to save",
    ACTIVE: "Y",
    chits: [],
  },
];

const styles = StyleSheet.create({
  container: {
    marginVertical: 20,
  },
  headerContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  titleContainer: {
    flex: 1,
  },
  title: {
    fontSize: 24,
    fontWeight: "700",
    color: theme.colors.primary,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    fontWeight: "400",
  },
  viewAllButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: `${theme.colors.primary}10`,
  },
  viewAllText: {
    fontSize: 14,
    fontWeight: "600",
    color: theme.colors.primary,
    marginRight: 4,
  },
  flatList: {
    flexGrow: 0,
  },
  listContainer: {
    paddingHorizontal: 20,
    paddingBottom: 10,
  },
  cardContainer: {
    width: CARD_WIDTH,
    height: CARD_HEIGHT,
    marginRight: CARD_MARGIN,
  },
  card: {
    flex: 1,
    borderRadius: 20,
    overflow: "hidden",
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.3,
        shadowRadius: 12,
      },
      android: {
        elevation: 8,
      },
    }),
  },
  cardBackground: {
    flex: 1,
  },
  backgroundImage: {
    opacity: 0.3,
  },
  cardGradient: {
    flex: 1,
    padding: 20,
    justifyContent: "space-between",
  },
  shimmerOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(255, 255, 255, 0.3)",
    zIndex: 1,
  },
  shimmerText: {
    backgroundColor: "#ddd",
    borderRadius: 4,
  },
  shimmerBadge: {
    backgroundColor: "#ddd",
    borderRadius: 12,
  },
  shimmerButton: {
    backgroundColor: "#ddd",
    borderRadius: 20,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  schemeTypeContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  iconContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 8,
  },
  schemeType: {
    fontSize: 14,
    fontWeight: "600",
    color: "#fff",
    textTransform: "uppercase",
  },
  badgeContainer: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
  },
  badgeText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#fff",
  },
  cardContent: {
    flex: 1,
    justifyContent: "center",
    paddingVertical: 16,
  },
  schemeName: {
    fontSize: 20,
    fontWeight: "700",
    color: "#fff",
    marginBottom: 4,
    textShadowColor: "rgba(0, 0, 0, 0.5)",
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  slogan: {
    fontSize: 12,
    color: "rgba(255, 255, 255, 0.8)",
    fontStyle: "italic",
    marginBottom: 12,
  },
  description: {
    fontSize: 14,
    color: "rgba(255, 255, 255, 0.9)",
    lineHeight: 20,
  },
  cardFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
  },
  benefitsPreview: {
    flex: 1,
    marginRight: 12,
  },
  benefitItem: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 6,
  },
  benefitText: {
    fontSize: 12,
    color: "rgba(255, 255, 255, 0.9)",
    marginLeft: 6,
    flex: 1,
  },
  joinButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
  },
  joinButtonText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#fff",
    marginRight: 4,
  },
}); 