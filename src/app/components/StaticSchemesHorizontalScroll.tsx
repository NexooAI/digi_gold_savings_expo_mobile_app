import React, { useState, useRef } from "react";
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
  Modal,
  ScrollView,
} from "react-native";
import { useRouter } from "expo-router";
import { t } from "@/i18n";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { theme } from "@/constants/theme";
import AsyncStorage from "@react-native-async-storage/async-storage";

const { width: screenWidth } = Dimensions.get("window");
const CARD_WIDTH = screenWidth * 0.8;
const CARD_HEIGHT = 320; // Increased height for better spacing
const CARD_MARGIN = 16;

interface StaticScheme {
  id: number;
  name: string;
  description: string;
  benefits: string[];
  type: "weight" | "amount" | "flexible";
  slogan: string;
  minAmount: string;
  maxAmount: string;
  duration: string;
  returns: string;
  icon: string;
  joiningProcedure: string[];
  detailedDescription: string;
  eligibility: string[];
  documents: string[];
}

interface StaticSchemesHorizontalScrollProps {
  onSchemePress?: (scheme: StaticScheme) => void;
  showViewAll?: boolean;
}

export default function StaticSchemesHorizontalScroll({ 
  onSchemePress, 
  showViewAll = true 
}: StaticSchemesHorizontalScrollProps) {
  const [selectedScheme, setSelectedScheme] = useState<number | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedSchemeForModal, setSelectedSchemeForModal] = useState<StaticScheme | null>(null);
  const router = useRouter();
  const flatListRef = useRef<FlatList>(null);

  // Static schemes data with enhanced information
  const staticSchemes: StaticScheme[] = [
    {
      id: 1,
      name: "Gold Weight Based Fixed",
      description: "Save gold by weight with fixed monthly installments. Choose your target gold weight and pay fixed amounts monthly until you reach your goal.",
      benefits: [
        "Fixed monthly payments",
        "Target specific gold weight",
        "Guaranteed gold accumulation",
        "No market fluctuations"
      ],
      type: "weight",
      slogan: "Save by weight, secure by design",
      minAmount: "₹1,000",
      maxAmount: "₹50,000",
      duration: "12-60 months",
      returns: "12% p.a.",
      icon: "scale",
      joiningProcedure: [
        "Complete KYC verification",
        "Choose target gold weight",
        "Select monthly installment amount",
        "Sign agreement and make first payment",
        "Start accumulating gold monthly"
      ],
      detailedDescription: "The Gold Weight Based Fixed scheme allows you to accumulate a specific amount of gold over time. You choose your target gold weight (e.g., 10 grams, 50 grams) and pay fixed monthly installments until you reach your goal. This scheme is perfect for those who have a specific gold accumulation target in mind.",
      eligibility: [
        "Age: 18-65 years",
        "Valid government ID proof",
        "PAN card mandatory",
        "Active bank account",
        "Minimum monthly income: ₹15,000"
      ],
      documents: [
        "Aadhaar Card",
        "PAN Card",
        "Passport size photos",
        "Bank passbook/cancelled cheque",
        "Address proof"
      ]
    },
    {
      id: 2,
      name: "Gold Amount Based Fixed",
      description: "Fixed amount savings plan where you save a predetermined amount monthly. Perfect for disciplined savings with predictable outcomes.",
      benefits: [
        "Fixed monthly amounts",
        "Predictable savings",
        "Regular gold accumulation",
        "Easy to track progress"
      ],
      type: "amount",
      slogan: "Fixed amounts, flexible goals",
      minAmount: "₹500",
      maxAmount: "₹25,000",
      duration: "6-36 months",
      returns: "10% p.a.",
      icon: "calculator",
      joiningProcedure: [
        "Complete KYC verification",
        "Decide monthly savings amount",
        "Choose scheme duration",
        "Sign agreement and pay first installment",
        "Continue monthly payments"
      ],
      detailedDescription: "The Gold Amount Based Fixed scheme is designed for disciplined savers who want predictable monthly payments. You choose a fixed amount to save each month and accumulate gold over the selected duration. This scheme helps build a regular savings habit.",
      eligibility: [
        "Age: 18-60 years",
        "Valid government ID proof",
        "PAN card mandatory",
        "Active bank account",
        "Stable monthly income"
      ],
      documents: [
        "Aadhaar Card",
        "PAN Card",
        "Passport size photos",
        "Bank passbook/cancelled cheque",
        "Income proof (salary slip/ITR)"
      ]
    },
    {
      id: 3,
      name: "Gold Savings Flexible",
      description: "Ultimate flexibility in gold savings. Save any amount, anytime without fixed schedules. Perfect for irregular income earners.",
      benefits: [
        "No fixed schedule",
        "Save any amount",
        "Zero penalties",
        "Maximum flexibility"
      ],
      type: "flexible",
      slogan: "Freedom to save, power to grow",
      minAmount: "₹100",
      maxAmount: "₹10,000",
      duration: "No time limit",
      returns: "8% p.a.",
      icon: "options",
      joiningProcedure: [
        "Complete KYC verification",
        "Open flexible savings account",
        "Start saving any amount anytime",
        "No minimum monthly commitment",
        "Withdraw accumulated gold anytime"
      ],
      detailedDescription: "The Gold Savings Flexible scheme offers maximum freedom in gold savings. You can save any amount, anytime without any fixed schedule or penalties. This scheme is ideal for freelancers, business owners, or anyone with irregular income patterns.",
      eligibility: [
        "Age: 18-70 years",
        "Valid government ID proof",
        "PAN card mandatory",
        "Active bank account",
        "No minimum income requirement"
      ],
      documents: [
        "Aadhaar Card",
        "PAN Card",
        "Passport size photos",
        "Bank passbook/cancelled cheque",
        "Any additional ID proof"
      ]
    }
  ];

  const handleSchemePress = async (scheme: StaticScheme) => {
    try {
      // Store scheme data for join page
      const schemeDataToStore = {
        schemeId: scheme.id,
        name: scheme.name,
        description: scheme.description,
        type: scheme.type,
        benefits: scheme.benefits,
        minAmount: scheme.minAmount,
        maxAmount: scheme.maxAmount,
        duration: scheme.duration,
        returns: scheme.returns,
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
          pathname: "/home/schemes",
          params: {
            schemeId: scheme.id.toString(),
            schemeType: scheme.type,
          },
        });
      }
    } catch (error) {
      console.error("Error handling scheme press:", error);
    }
  };

  const handleInfoPress = (scheme: StaticScheme) => {
    setSelectedSchemeForModal(scheme);
    setModalVisible(true);
  };

  const getSchemeGradient = (schemeType: string): [string, string, string] => {
    switch (schemeType) {
      case "weight":
        return ["#667eea", "#764ba2", "#f093fb"]; // Purple gradient
      case "amount":
        return ["#4ECDC4", "#44A08D", "#2E8B57"]; // Green gradient
      case "flexible":
        return ["#FFD93D", "#FFB347", "#FF8C42"]; // Orange gradient
      default:
        return ["#667eea", "#764ba2", "#f093fb"];
    }
  };

  const getSchemeImage = (schemeType: string) => {
    switch (schemeType) {
      case "weight":
        return require("../../../assets/images/scheme1.jpg");
      case "amount":
        return require("../../../assets/images/scheme2.jpg");
      case "flexible":
        return require("../../../assets/images/scheme3.jpg");
      default:
        return require("../../../assets/images/scheme1.jpg");
    }
  };

  const getSchemeIcon = (schemeType: string): string => {
    switch (schemeType) {
      case "weight":
        return "scale";
      case "amount":
        return "calculator";
      case "flexible":
        return "options";
      default:
        return "diamond";
    }
  };

  const renderSchemeCard = ({ item, index }: { item: StaticScheme; index: number }) => {
    const isSelected = selectedScheme === item.id;
    const gradientColors = getSchemeGradient(item.type);
    const schemeIcon = getSchemeIcon(item.type);
    const schemeImage = getSchemeImage(item.type);

    return (
      <Animated.View
        style={[
          styles.cardContainer,
          {
            transform: [{ scale: isSelected ? 1.05 : 1 }],
          },
        ]}
      >
        <View style={styles.card}>
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
                  <Text style={styles.schemeType}>
                    {item.type === "weight" ? "Weight Based" : 
                     item.type === "amount" ? "Amount Based" : "Flexible"}
                  </Text>
                </View>
                <View style={styles.badgeContainer}>
                  <Text style={styles.badgeText}>
                    {item.type === "flexible" ? "Flexi" : "Fixed"}
                  </Text>
                </View>
              </View>

              {/* Content */}
              <View style={styles.cardContent}>
                <Text style={styles.schemeName} numberOfLines={2}>
                  {item.name}
                </Text>
                <Text style={styles.slogan} numberOfLines={1}>
                  {item.slogan}
                </Text>
                <Text style={styles.description} numberOfLines={2}>
                  {item.description}
                </Text>
              </View>

              {/* Scheme Details */}
              <View style={styles.schemeDetails}>
                <View style={styles.detailRow}>
                  <View style={styles.detailItem}>
                    <Text style={styles.detailLabel}>Amount Range</Text>
                    <Text style={styles.detailValue}>{item.minAmount} - {item.maxAmount}</Text>
                  </View>
                  <View style={styles.detailItem}>
                    <Text style={styles.detailLabel}>Duration</Text>
                    <Text style={styles.detailValue}>{item.duration}</Text>
                  </View>
                </View>
                <View style={styles.detailRow}>
                  <View style={styles.detailItem}>
                    <Text style={styles.detailLabel}>Returns</Text>
                    <Text style={styles.detailValue}>{item.returns}</Text>
                  </View>
                </View>
              </View>

              {/* Footer */}
              <View style={styles.cardFooter}>
                <View style={styles.benefitsPreview}>
                  {item.benefits.slice(0, 2).map((benefit, idx) => (
                    <View key={idx} style={styles.benefitItem}>
                      <Ionicons name="checkmark-circle" size={14} color="#fff" />
                      <Text style={styles.benefitText} numberOfLines={1}>
                        {benefit}
                      </Text>
                    </View>
                  ))}
                </View>
                <View style={styles.actionButtons}>
                  <TouchableOpacity
                    style={styles.infoButtonFooter}
                    onPress={() => handleInfoPress(item)}
                  >
                    <Ionicons name="information-circle" size={16} color="#fff" />
                    <Text style={styles.infoButtonText}>Info</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.joinButton}
                    onPress={() => handleSchemePress(item)}
                  >
                    <Text style={styles.joinButtonText}>Join Now</Text>
                    <Ionicons name="arrow-forward" size={16} color="#fff" />
                  </TouchableOpacity>
                </View>
              </View>
            </LinearGradient>
          </ImageBackground>
        </View>
      </Animated.View>
    );
  };

  const renderModal = () => (
    <Modal
      visible={modalVisible}
      transparent
      animationType="slide"
      onRequestClose={() => setModalVisible(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          {selectedSchemeForModal && (
            <>
              {/* Modal Header */}
              <View style={styles.modalHeader}>
                <View style={styles.modalTitleContainer}>
                  <View style={[styles.modalIconContainer, { backgroundColor: getSchemeGradient(selectedSchemeForModal.type)[0] }]}>
                    <Ionicons name={getSchemeIcon(selectedSchemeForModal.type) as any} size={24} color="#fff" />
                  </View>
                  <View style={styles.modalTitleText}>
                    <Text style={styles.modalTitle}>{selectedSchemeForModal.name}</Text>
                    <Text style={styles.modalSubtitle}>{selectedSchemeForModal.slogan}</Text>
                  </View>
                </View>
                <TouchableOpacity
                  style={styles.closeButton}
                  onPress={() => setModalVisible(false)}
                >
                  <Ionicons name="close" size={24} color="#666" />
                </TouchableOpacity>
              </View>

              {/* Modal Body */}
              <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={false}>
                {/* Scheme Overview */}
                <View style={styles.modalSection}>
                  <Text style={styles.sectionTitle}>Scheme Overview</Text>
                  <Text style={styles.sectionContent}>{selectedSchemeForModal.detailedDescription}</Text>
                </View>

                {/* Key Details */}
                <View style={styles.modalSection}>
                  <Text style={styles.sectionTitle}>Key Details</Text>
                  <View style={styles.detailsGrid}>
                    <View style={styles.detailCard}>
                      <Text style={styles.detailCardLabel}>Amount Range</Text>
                      <Text style={styles.detailCardValue}>{selectedSchemeForModal.minAmount} - {selectedSchemeForModal.maxAmount}</Text>
                    </View>
                    <View style={styles.detailCard}>
                      <Text style={styles.detailCardLabel}>Duration</Text>
                      <Text style={styles.detailCardValue}>{selectedSchemeForModal.duration}</Text>
                    </View>
                    <View style={styles.detailCard}>
                      <Text style={styles.detailCardLabel}>Returns</Text>
                      <Text style={styles.detailCardValue}>{selectedSchemeForModal.returns}</Text>
                    </View>
                    <View style={styles.detailCard}>
                      <Text style={styles.detailCardLabel}>Type</Text>
                      <Text style={styles.detailCardValue}>{selectedSchemeForModal.type === "flexible" ? "Flexible" : "Fixed"}</Text>
                    </View>
                  </View>
                </View>

                {/* Benefits */}
                <View style={styles.modalSection}>
                  <Text style={styles.sectionTitle}>Key Benefits</Text>
                  {selectedSchemeForModal.benefits.map((benefit, index) => (
                    <View key={index} style={styles.benefitModalItem}>
                      <Ionicons name="checkmark-circle" size={20} color={getSchemeGradient(selectedSchemeForModal.type)[0]} />
                      <Text style={styles.benefitModalText}>{benefit}</Text>
                    </View>
                  ))}
                </View>

                {/* Joining Procedure */}
                <View style={styles.modalSection}>
                  <Text style={styles.sectionTitle}>Joining Procedure</Text>
                  {selectedSchemeForModal.joiningProcedure.map((step, index) => (
                    <View key={index} style={styles.procedureItem}>
                      <View style={[styles.procedureNumber, { backgroundColor: getSchemeGradient(selectedSchemeForModal.type)[0] }]}>
                        <Text style={styles.procedureNumberText}>{index + 1}</Text>
                      </View>
                      <Text style={styles.procedureText}>{step}</Text>
                    </View>
                  ))}
                </View>

                {/* Eligibility */}
                <View style={styles.modalSection}>
                  <Text style={styles.sectionTitle}>Eligibility</Text>
                  {selectedSchemeForModal.eligibility.map((item, index) => (
                    <View key={index} style={styles.eligibilityItem}>
                      <Ionicons name="person-circle" size={16} color="#666" />
                      <Text style={styles.eligibilityText}>{item}</Text>
                    </View>
                  ))}
                </View>

                {/* Required Documents */}
                <View style={styles.modalSection}>
                  <Text style={styles.sectionTitle}>Required Documents</Text>
                  {selectedSchemeForModal.documents.map((doc, index) => (
                    <View key={index} style={styles.documentItem}>
                      <Ionicons name="document-text" size={16} color="#666" />
                      <Text style={styles.documentText}>{doc}</Text>
                    </View>
                  ))}
                </View>
              </ScrollView>

              {/* Modal Footer */}
              <View style={styles.modalFooter}>
                <TouchableOpacity
                  style={[styles.modalJoinButton, { backgroundColor: getSchemeGradient(selectedSchemeForModal.type)[0] }]}
                  onPress={() => {
                    setModalVisible(false);
                    router.push({
                      pathname: "/home/schemes",
                      params: {
                        schemeId: selectedSchemeForModal.id.toString(),
                        schemeType: selectedSchemeForModal.type,
                      },
                    });
                  }}
                >
                  <Text style={styles.modalJoinButtonText}>Join This Scheme</Text>
                  <Ionicons name="arrow-forward" size={20} color="#fff" />
                </TouchableOpacity>
              </View>
            </>
          )}
        </View>
      </View>
    </Modal>
  );

  const handleViewAll = () => {
    router.push("/(app)/(tabs)/home/schemes");
  };

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
        data={staticSchemes}
        renderItem={renderSchemeCard}
        keyExtractor={(item) => item.id.toString()}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.listContainer}
        snapToInterval={CARD_WIDTH + CARD_MARGIN}
        decelerationRate="fast"
        pagingEnabled={false}
        bounces={true}
        style={styles.flatList}
      />

      {renderModal()}
    </View>
  );
}

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
    marginBottom: 6,
    textShadowColor: "rgba(0, 0, 0, 0.5)",
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
    lineHeight: 24,
  },
  slogan: {
    fontSize: 12,
    color: "rgba(255, 255, 255, 0.8)",
    fontStyle: "italic",
    marginBottom: 10,
    lineHeight: 16,
  },
  description: {
    fontSize: 13,
    color: "rgba(255, 255, 255, 0.9)",
    lineHeight: 18,
  },
  schemeDetails: {
    marginVertical: 12,
  },
  detailRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  detailItem: {
    flex: 1,
  },
  detailLabel: {
    fontSize: 10,
    color: "rgba(255, 255, 255, 0.7)",
    fontWeight: "500",
    marginBottom: 3,
  },
  detailValue: {
    fontSize: 12,
    color: "#fff",
    fontWeight: "600",
    lineHeight: 16,
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
    fontSize: 11,
    color: "rgba(255, 255, 255, 0.9)",
    marginLeft: 6,
    flex: 1,
    lineHeight: 14,
  },
  actionButtons: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  infoButtonFooter: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    gap: 4,
  },
  infoButtonText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#fff",
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
  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    backgroundColor: "#fff",
    borderRadius: 0,
    width: "100%",
    height: "100%",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  modalTitleContainer: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  modalIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  modalTitleText: {
    flex: 1,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#333",
    marginBottom: 2,
  },
  modalSubtitle: {
    fontSize: 14,
    color: "#666",
    fontStyle: "italic",
  },
  closeButton: {
    padding: 4,
  },
  modalBody: {
    flex: 1,
    padding: 20,
  },
  modalSection: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
    marginBottom: 12,
  },
  sectionContent: {
    fontSize: 14,
    color: "#666",
    lineHeight: 20,
  },
  detailsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  detailCard: {
    backgroundColor: "#f8f9fa",
    padding: 12,
    borderRadius: 8,
    minWidth: "45%",
  },
  detailCardLabel: {
    fontSize: 12,
    color: "#666",
    fontWeight: "500",
    marginBottom: 4,
  },
  detailCardValue: {
    fontSize: 14,
    fontWeight: "600",
    color: "#333",
  },
  benefitModalItem: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  benefitModalText: {
    fontSize: 14,
    color: "#666",
    marginLeft: 8,
    flex: 1,
    lineHeight: 20,
  },
  procedureItem: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 12,
  },
  procedureNumber: {
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
    marginTop: 2,
  },
  procedureNumberText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#fff",
  },
  procedureText: {
    fontSize: 14,
    color: "#666",
    flex: 1,
    lineHeight: 20,
  },
  eligibilityItem: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  eligibilityText: {
    fontSize: 14,
    color: "#666",
    marginLeft: 8,
    flex: 1,
    lineHeight: 20,
  },
  documentItem: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  documentText: {
    fontSize: 14,
    color: "#666",
    marginLeft: 8,
    flex: 1,
    lineHeight: 20,
  },
  modalFooter: {
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: "#f0f0f0",
  },
  modalJoinButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 16,
    borderRadius: 12,
    gap: 8,
  },
  modalJoinButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#fff",
  },
}); 