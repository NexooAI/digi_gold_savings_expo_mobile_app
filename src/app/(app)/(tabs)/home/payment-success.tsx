import React, { useEffect, useState, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  Animated,
  Platform,
  StatusBar,
  Share,
  Clipboard,
  Alert,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { theme } from "@/constants/theme";
import AsyncStorage from "@react-native-async-storage/async-storage";
import useGlobalStore from "@/store/global.store";

const { width } = Dimensions.get("window");

const PaymentSuccessScreen = () => {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { bottom } = useSafeAreaInsets();
  const [goldWeight, setGoldWeight] = useState(0);
  const [currentGoldRate, setCurrentGoldRate] = useState(0);
  const [currentDate, setCurrentDate] = useState("");
  const { setTabVisibility } = useGlobalStore();

  const scaleAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const checkmarkScale = useRef(new Animated.Value(0)).current;

  // Calculate safe bottom padding
  const bottomPadding = Math.max(bottom, 20) + 80;

  useEffect(() => {
    console.log("Payment Success Params:", params);
  }, [params]);

  useEffect(() => {
    setTabVisibility(false);
    return () => setTabVisibility(true);
  }, []);

  useEffect(() => {
    const getGoldRate = async () => {
      try {
        const cachedRate = await AsyncStorage.getItem("gold_rate");
        if (cachedRate) {
          const rate = parseFloat(cachedRate);
          setCurrentGoldRate(rate);
          const amount = parseFloat(params.amount as string);
          setGoldWeight(amount / rate);
        }
      } catch (error) {
        console.error("Error getting gold rate:", error);
      }
    };

    const now = new Date();
    setCurrentDate(
      now.toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })
    );

    getGoldRate();

    // Start animations
    Animated.parallel([
      Animated.spring(scaleAnim, {
        toValue: 1,
        useNativeDriver: true,
        friction: 8,
        tension: 40,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
    ]).start();

    setTimeout(() => {
      Animated.spring(checkmarkScale, {
        toValue: 1,
        useNativeDriver: true,
        friction: 8,
        tension: 40,
      }).start();
    }, 300);
  }, []);

  const handleCopyText = async (text: string, label: string) => {
    try {
      await Clipboard.setString(text);
      Alert.alert("Success", `${label} copied to clipboard`);
    } catch (error) {
      Alert.alert("Error", `Failed to copy ${label}`);
    }
  };

  const handleShare = async () => {
    try {
      await Share.share({
        message: `
Payment Successful!

Amount Paid: ₹${params.amount}
Gold Weight: ${goldWeight.toFixed(3)}g
Transaction ID: ${params.txnId}
Order ID: ${params.orderId}
Date & Time: ${currentDate}

Scheme: ${params.schemeName}
Installment: ${params.installmentNumber} of ${params.totalInstallments}

Thank you for your payment!
        `,
        title: "Payment Receipt",
      });
    } catch (error) {
      Alert.alert("Error", "Failed to share payment details");
    }
  };

  const handleGoToHome = () => router.replace("/(tabs)/home");
  const handleGoToSchemes = () => router.replace("/(tabs)/savings");

  if (!params?.txnId || !params?.orderId) {
    console.error("Missing required payment data:", params);
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar
        backgroundColor={theme.colors.primary}
        barStyle="light-content"
      />
      <LinearGradient
        colors={["#4CAF50", "#2E7D32"]}
        style={styles.gradientBackground}
      >
        <View style={styles.header}>
          <View style={styles.headerPlaceholder} />
          <Text style={styles.headerTitle}>Payment Success</Text>
          <TouchableOpacity onPress={handleShare} style={styles.shareButton}>
            <Ionicons name="share-outline" size={24} color="#fff" />
          </TouchableOpacity>
        </View>

        <View
          style={[styles.contentContainer, { paddingBottom: bottomPadding }]}
        >
          <Animated.View
            style={[
              styles.successContainer,
              {
                transform: [{ scale: scaleAnim }, { translateY: slideAnim }],
                opacity: fadeAnim,
              },
            ]}
          >
            <View style={styles.iconContainer}>
              <Animated.View
                style={[
                  styles.checkmarkContainer,
                  { transform: [{ scale: checkmarkScale }] },
                ]}
              >
                <Ionicons name="checkmark-circle" size={60} color="#fff" />
              </Animated.View>
            </View>

            <Text style={styles.successTitle}>Payment Successful!</Text>
            <Text style={styles.successSubtitle}>
              Your gold investment has been processed
            </Text>

            <View style={styles.detailsCard}>
              <View style={styles.detailRow}>
                <View style={styles.detailItem}>
                  <Text style={styles.detailLabel}>Amount Paid</Text>
                  <Text style={styles.detailValue}>₹{params.amount}</Text>
                </View>
                <View style={styles.detailItem}>
                  <Text style={styles.detailLabel}>Gold Weight</Text>
                  <Text style={styles.detailValue}>
                    {goldWeight.toFixed(3)} g
                  </Text>
                </View>
              </View>

              <View style={styles.divider} />

              <View style={styles.schemeInfo}>
                <Text style={styles.schemeName}>{params.schemeName}</Text>
                <Text style={styles.installmentInfo}>
                  Installment {params.installmentNumber} of{" "}
                  {params.totalInstallments}
                </Text>
              </View>

              <View style={styles.transactionInfo}>
                <View style={styles.transactionRow}>
                  <View style={styles.transactionItem}>
                    <Text style={styles.transactionLabel}>Transaction ID</Text>
                    <View style={styles.transactionValueContainer}>
                      <Text style={styles.transactionId}>
                        {params.txnId || "Not available"}
                      </Text>
                      {params.txnId && (
                        <TouchableOpacity
                          onPress={() =>
                            handleCopyText(
                              params.txnId as string,
                              "Transaction ID"
                            )
                          }
                          style={styles.copyButton}
                        >
                          <Ionicons
                            name="copy-outline"
                            size={16}
                            color={theme.colors.primary}
                          />
                        </TouchableOpacity>
                      )}
                    </View>
                  </View>
                </View>

                <View style={styles.transactionRow}>
                  <View style={styles.transactionItem}>
                    <Text style={styles.transactionLabel}>Order ID</Text>
                    <View style={styles.transactionValueContainer}>
                      <Text style={styles.transactionId}>
                        {params.orderId || "Not available"}
                      </Text>
                      {params.orderId && (
                        <TouchableOpacity
                          onPress={() =>
                            handleCopyText(params.orderId as string, "Order ID")
                          }
                          style={styles.copyButton}
                        >
                          <Ionicons
                            name="copy-outline"
                            size={16}
                            color={theme.colors.primary}
                          />
                        </TouchableOpacity>
                      )}
                    </View>
                  </View>
                </View>

                <View style={styles.transactionRow}>
                  <View style={styles.transactionItem}>
                    <Text style={styles.transactionLabel}>Date & Time</Text>
                    <Text style={styles.transactionId}>{currentDate}</Text>
                  </View>
                </View>
              </View>
            </View>

            <View style={styles.allButtonsContainer}>
              <View style={styles.buttonRow}>
                <TouchableOpacity
                  style={styles.navigationButton}
                  onPress={handleGoToHome}
                >
                  <LinearGradient
                    colors={["#4CAF50", "#2E7D32"]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={styles.buttonGradient}
                  >
                    <Ionicons name="home-outline" size={16} color="#fff" />
                    <Text style={styles.buttonText}>Home</Text>
                  </LinearGradient>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.navigationButton}
                  onPress={handleGoToSchemes}
                >
                  <LinearGradient
                    colors={["#4CAF50", "#2E7D32"]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={styles.buttonGradient}
                  >
                    <Ionicons name="list-outline" size={16} color="#fff" />
                    <Text style={styles.buttonText}>Schemes</Text>
                  </LinearGradient>
                </TouchableOpacity>
              </View>
            </View>
          </Animated.View>
        </View>
      </LinearGradient>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  gradientBackground: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.1)",
  },
  headerPlaceholder: {
    width: 40,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#fff",
  },
  shareButton: {
    padding: 6,
    borderRadius: 16,
    backgroundColor: "rgba(255,255,255,0.2)",
  },
  contentContainer: {
    flex: 1,
    padding: 16,
    justifyContent: "space-between",
  },
  successContainer: {
    width: "100%",
    alignItems: "center",
    flex: 1,
    justifyContent: "space-around",
  },
  iconContainer: {
    width: 80,
    height: 80,
    marginBottom: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  checkmarkContainer: {
    width: 60,
    height: 60,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.2)",
    borderRadius: 30,
  },
  successTitle: {
    fontSize: 22,
    fontWeight: "700",
    color: "#fff",
    marginBottom: 4,
    textAlign: "center",
  },
  successSubtitle: {
    fontSize: 14,
    color: "rgba(255,255,255,0.8)",
    marginBottom: 16,
    textAlign: "center",
    paddingHorizontal: 20,
  },
  detailsCard: {
    width: "100%",
    backgroundColor: "rgba(255,255,255,0.95)",
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  detailRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  detailItem: {
    flex: 1,
    alignItems: "center",
  },
  detailLabel: {
    fontSize: 12,
    color: "#666",
    marginBottom: 4,
  },
  detailValue: {
    fontSize: 18,
    fontWeight: "700",
    color: "#4CAF50",
  },
  divider: {
    height: 1,
    backgroundColor: "rgba(0,0,0,0.1)",
    marginVertical: 12,
  },
  schemeInfo: {
    alignItems: "center",
    marginBottom: 12,
  },
  schemeName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
    marginBottom: 2,
  },
  installmentInfo: {
    fontSize: 12,
    color: "#666",
  },
  transactionInfo: {
    gap: 8,
  },
  transactionRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  transactionItem: {
    flex: 1,
    alignItems: "center",
  },
  transactionLabel: {
    fontSize: 12,
    color: "#666",
    marginRight: 8,
  },
  transactionValueContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  copyButton: {
    padding: 4,
  },
  transactionId: {
    fontSize: 11,
    color: "#999",
    textAlign: "center",
  },
  allButtonsContainer: {
    width: "100%",
    gap: 8,
  },
  buttonRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 8,
  },
  navigationButton: {
    flex: 1,
    height: 40,
    borderRadius: 20,
    overflow: "hidden",
    ...Platform.select({
      ios: {
        shadowColor: "#4CAF50",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  buttonGradient: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 12,
  },
  buttonText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#fff",
    marginLeft: 6,
  },
});

export default PaymentSuccessScreen;
