import React from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  ImageBackground,
  StyleSheet,
  Dimensions,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { t } from "@/i18n";
import { Ionicons } from "@expo/vector-icons";

const { width: screenWidth } = Dimensions.get("window");
const CARD_WIDTH = screenWidth * 0.8;
const CARD_SPACING = 16;

interface Scheme {
  id: number;
  name: string;
  description: string;
  image: any;
  type: string;
  duration?: string;
  amount?: string;
}

// Default schemes data
const defaultSchemes: Scheme[] = [
  {
    id: 1,
    name: "Monthly Gold Savings",
    description: "Save gold monthly with flexible plans",
    image: require("../../../assets/images/scheme1.jpg"),
    type: "Monthly",
    duration: "11 months",
    amount: "₹5000/month"
  },
  {
    id: 2,
    name: "Weekly Gold Plan",
    description: "Weekly gold savings for quick returns",
    image: require("../../../assets/images/scheme2.jpg"),
    type: "Weekly",
    duration: "52 weeks",
    amount: "₹1000/week"
  },
  {
    id: 3,
    name: "Daily Gold Savings",
    description: "Daily savings for maximum benefits",
    image: require("../../../assets/images/scheme3.jpg"),
    type: "Daily",
    duration: "365 days",
    amount: "₹100/day"
  },
  {
    id: 4,
    name: "Flexi Gold Plan",
    description: "Flexible savings as per your convenience",
    image: require("../../../assets/images/scheme4.jpg"),
    type: "Flexi",
    duration: "Custom",
    amount: "Variable"
  }
];

const StaticSchemesHorizontalScroll: React.FC = () => {
  const router = useRouter();

  const renderSchemeCard = ({ item, index }: { item: Scheme; index: number }) => {
    const gradientColors = getGradientColors(item.type);
    
    return (
      <TouchableOpacity
        style={[
          styles.cardContainer,
          { marginLeft: index === 0 ? 16 : 0 }
        ]}
        onPress={() => router.push("/(app)/(tabs)/home/schemes")}
        activeOpacity={0.8}
      >
        <ImageBackground
          source={item.image}
          style={styles.cardBackground}
          imageStyle={styles.backgroundImage}
        >
          <LinearGradient
            colors={gradientColors}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.cardGradient}
          >
            <View style={styles.cardContent}>
              <View style={styles.cardHeader}>
                <Text style={styles.schemeName}>{item.name}</Text>
                <View style={styles.typeBadge}>
                  <Text style={styles.typeText}>{item.type}</Text>
                </View>
              </View>
              
              <Text style={styles.schemeDescription}>{item.description}</Text>
              
              <View style={styles.schemeDetails}>
                <View style={styles.detailItem}>
                  <Ionicons name="time-outline" size={16} color="#fff" />
                  <Text style={styles.detailText}>{item.duration}</Text>
                </View>
                <View style={styles.detailItem}>
                  <Ionicons name="wallet-outline" size={16} color="#fff" />
                  <Text style={styles.detailText}>{item.amount}</Text>
                </View>
              </View>
              
              <View style={styles.exploreButton}>
                <Text style={styles.exploreText}>Explore</Text>
                <Ionicons name="arrow-forward" size={16} color="#fff" />
              </View>
            </View>
          </LinearGradient>
        </ImageBackground>
      </TouchableOpacity>
    );
  };

  const getGradientColors = (type: string): [string, string] => {
    switch (type) {
      case "Monthly":
        return ["rgba(44,0,66,0.8)", "rgba(44,0,66,0.9)"];
      case "Weekly":
        return ["rgba(0,48,44,0.8)", "rgba(0,48,44,0.9)"];
      case "Daily":
        return ["rgba(56,0,0,0.8)", "rgba(56,0,0,0.9)"];
      case "Flexi":
        return ["rgba(61,40,0,0.8)", "rgba(61,40,0,0.9)"];
      default:
        return ["rgba(21,0,44,0.8)", "rgba(21,0,44,0.9)"];
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.sectionHeader}>
        <View style={styles.sectionHeaderContent}>
          <View style={styles.sectionHeaderLine} />
          <Text style={styles.sectionHeaderText}>{t('activeSchemes')}</Text>
          <View style={styles.sectionHeaderLine} />
        </View>
        <Text style={styles.sectionHeaderSubtext}>{t('exploreGoldSavingsPlans')}</Text>
      </View>

      <FlatList
        data={defaultSchemes}
        renderItem={renderSchemeCard}
        keyExtractor={(item) => item.id.toString()}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.listContent}
        snapToInterval={CARD_WIDTH + CARD_SPACING}
        decelerationRate="fast"
        removeClippedSubviews={true}
        maxToRenderPerBatch={10}
        windowSize={5}
        initialNumToRender={3}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: 20,
  },
  sectionHeader: {
    marginBottom: 16,
    paddingHorizontal: 16,
  },
  sectionHeaderContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
  },
  sectionHeaderLine: {
    flex: 1,
    height: 1,
    backgroundColor: "#FFD700",
    marginHorizontal: 8,
  },
  sectionHeaderText: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
    textAlign: "center",
  },
  sectionHeaderSubtext: {
    fontSize: 14,
    color: "#666",
    textAlign: "center",
  },
  listContent: {
    paddingRight: 16,
  },
  cardContainer: {
    width: CARD_WIDTH,
    height: 200,
    marginRight: CARD_SPACING,
    borderRadius: 12,
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
  cardBackground: {
    flex: 1,
  },
  backgroundImage: {
    borderRadius: 12,
  },
  cardGradient: {
    flex: 1,
    padding: 16,
    justifyContent: "space-between",
  },
  cardContent: {
    flex: 1,
    justifyContent: "space-between",
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  schemeName: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#fff",
    flex: 1,
    marginRight: 8,
  },
  typeBadge: {
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  typeText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#fff",
  },
  schemeDescription: {
    fontSize: 14,
    color: "#fff",
    opacity: 0.9,
    marginVertical: 8,
  },
  schemeDetails: {
    marginVertical: 8,
  },
  detailItem: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 2,
  },
  detailText: {
    fontSize: 12,
    color: "#fff",
    marginLeft: 6,
  },
  exploreButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-end",
    marginTop: 8,
  },
  exploreText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#fff",
    marginRight: 4,
  },
});

export default StaticSchemesHorizontalScroll; 