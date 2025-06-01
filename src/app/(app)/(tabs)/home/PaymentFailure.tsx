import React, { useEffect, useRef, useState } from "react";
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  Animated, 
  Dimensions,
  StatusBar,
  ScrollView,
  Platform,
  Image,
  Share,
  Alert
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { theme } from "@/constants/theme";

const { width } = Dimensions.get("window");

const PaymentFailure = () => {
  const router = useRouter();
  const params = useLocalSearchParams();
  const status = params.status || "failure";
  const [isLoading, setIsLoading] = useState(true);

  // Animation refs
  const scaleAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;

  useEffect(() => {
    // Start animations
    Animated.sequence([
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 800,
          useNativeDriver: true,
        }),
      ]),
    ]).start();

    // Simulate loading time
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 2000);

    return () => clearTimeout(timer);
  }, []);

  const getFailureDetails = () => {
    switch (status) {
      
      case "cancelled":
        Alert.alert("Payment Status", status);
        return {
          title: "Payment Cancelled",
          message: "You cancelled the payment process",
          icon: "close-circle-outline",
          suggestion: "You can try again anytime or contact support if you need help."
        };
      case "error":
        Alert.alert("Payment Status", status);
        return {
          title: "Payment Error",
          message: "An error occurred during payment processing",
          icon: "warning-outline",
          suggestion: "Please check your internet connection and try again."
        };
      default:
        Alert.alert("Payment Status", status);
        return {
          title: "Payment Failed",
          message: "Something went wrong while processing your payment",
          icon: "alert-circle-outline",
          suggestion: "Please try again or contact our support team for assistance."
        };
    }
  };

  const failureDetails = getFailureDetails();

  const handleRetryPayment = () => {
    // Get all payment related params
    const paymentParams = {
      amount: params.amount,
      order_id: params.order_id,
      scheme_id: params.scheme_id,
      payment_type: params.payment_type,
      installment_no: params.installment_no,
      payment_url: params.payment_url,
    };

    // Navigate back to payment page with preserved data
    router.replace({
      pathname: "/(tabs)/home/PaymentWebView",
      params: paymentParams
    });
  };

  const handleContactSupport = () => {
    router.replace("/(tabs)/home");
  };
  const  homePage = ()=>{
    router.replace("/(tabs)/home");
  }
  const handleShare = async () => {
    try {
      const message = `Payment Details\n\nAmount: ₹${params.amount}\nOrder ID: ${params.order_id}\nStatus: ${status === "cancelled" ? "Cancelled" : "Failed"}\nDate: ${formatDate()}\n\n${failureDetails.message}`;
      
      await Share.share({
        message,
        title: failureDetails.title
      });
    } catch (error) {
      Alert.alert('Error', 'Failed to share payment details');
    }
  };

  const formatDate = () => {
    return new Date().toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <StatusBar backgroundColor="#850111" barStyle="light-content" />
        <LinearGradient
          colors={['#850111', '#5c0000']}
          style={styles.loadingGradient}
        >
          <Image
            source={require('../../../../../assets/splashscreen_logo.png')}
            style={styles.loadingLogo}
            resizeMode="contain"
          />
        </LinearGradient>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar backgroundColor="#850111" barStyle="light-content" />
      <LinearGradient
        colors={['#850111', '#5c0000']}
        style={styles.gradientBackground}
      >
        <View style={styles.header}>
          <TouchableOpacity 
            onPress={() => router.back()} 
            style={styles.backButton}
          >
            <Ionicons name="arrow-back" size={24} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Payment Failed</Text>
          <TouchableOpacity 
            onPress={handleShare}
            style={styles.shareButton}
          >
            <Ionicons name="share-outline" size={24} color="#fff" />
          </TouchableOpacity>
        </View>

        <ScrollView contentContainerStyle={styles.scrollContent}>
          {/* Failure Icon */}
          <Animated.View 
            style={[
              styles.iconContainer,
              { transform: [{ scale: scaleAnim }] }
            ]}
          >
            <View style={styles.failureIconBackground}>
              <Ionicons name="close-circle" size={80} color="#fff" />
            </View>
          </Animated.View>

          {/* Failure Message */}
          <Animated.View 
            style={[
              styles.messageContainer,
              { 
                opacity: fadeAnim,
                transform: [{ translateY: slideAnim }]
              }
            ]}
          >
            <Text style={styles.title}>{failureDetails.title}</Text>
            <Text style={styles.subtitle}>{failureDetails.message}</Text>
          </Animated.View>

          {/* Payment Details Card */}
          <Animated.View 
            style={[
              styles.detailsCard,
              { 
                opacity: fadeAnim,
                transform: [{ translateY: slideAnim }]
              }
            ]}
          >
            <View style={styles.cardHeader}>
              <Ionicons name="information-circle-outline" size={24} color={theme.colors.primary} />
              <Text style={styles.cardTitle}>Transaction Details</Text>
            </View>

            <View style={styles.detailsContainer}>
              {params.amount && (
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Amount</Text>
                  <Text style={styles.detailValue}>₹{params.amount}</Text>
                </View>
              )}

              {params.order_id && (
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Order ID</Text>
                  <Text style={styles.detailValue}>{params.order_id}</Text>
                </View>
              )}

              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Date & Time</Text>
                <Text style={styles.detailValue}>{formatDate()}</Text>
              </View>

              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Status</Text>
                <View style={styles.statusContainer}>
                  <View style={styles.statusDot} />
                  <Text style={styles.statusText}>
                    {status === "cancelled" ? "Cancelled" : "Failed"}
                  </Text>
                </View>
              </View>
            </View>

            {/* Suggestion Box */}
            <View style={styles.suggestionBox}>
              <Ionicons name="bulb-outline" size={20} color="#ff9800" />
              <Text style={styles.suggestionText}>{failureDetails.suggestion}</Text>
            </View>
          </Animated.View>

          {/* Action Buttons */}
          <Animated.View 
            style={[
              styles.buttonContainer,
              { 
                opacity: fadeAnim,
                transform: [{ translateY: slideAnim }]
              }
            ]}
          >
            <TouchableOpacity 
              style={styles.primaryButton} 
              onPress={homePage}
              activeOpacity={0.8}
            >
              <LinearGradient 
                colors={['#4CAF50', '#2E7D32']}
                style={styles.buttonGradient}
              >
                <Text style={styles.primaryButtonText}>Home</Text>
              </LinearGradient>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.secondaryButton} 
              onPress={handleContactSupport}
              activeOpacity={0.8}
            >
              <Text style={styles.secondaryButtonText}>Contact Support</Text>
            </TouchableOpacity>
          </Animated.View>

          {/* Help Message */}
          <Animated.View 
            style={[
              styles.footerMessage,
              { opacity: fadeAnim }
            ]}
          >
            <Ionicons name="headset-outline" size={16} color="rgba(255,255,255,0.8)" />
            <Text style={styles.footerText}>
              Need help? Our support team is available 24/7 to assist you
            </Text>
          </Animated.View>
        </ScrollView>
      </LinearGradient>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  gradientBackground: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.1)',
  },
  backButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
  },
  shareButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    paddingTop: 20,
    paddingBottom: Platform.OS === 'ios' ? 40 : 20,
  },
  iconContainer: {
    marginBottom: 20,
  },
  failureIconBackground: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  messageContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#fff",
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: "rgba(255,255,255,0.8)",
    textAlign: 'center',
    lineHeight: 20,
  },
  detailsCard: {
    width: '100%',
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginLeft: 8,
  },
  detailsContainer: {
    gap: 12,
    marginBottom: 16,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  detailLabel: {
    fontSize: 13,
    color: '#666',
    flex: 1,
  },
  detailValue: {
    fontSize: 13,
    fontWeight: '600',
    color: '#333',
    flex: 1,
    textAlign: 'right',
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#f44336',
    marginRight: 6,
  },
  statusText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#f44336',
  },
  suggestionBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#fff3e0',
    padding: 12,
    borderRadius: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#ff9800',
  },
  suggestionText: {
    fontSize: 13,
    color: '#e65100',
    marginLeft: 8,
    flex: 1,
    lineHeight: 18,
  },
  buttonContainer: {
    width: '100%',
    gap: 12,
    marginTop: 8,
  },
  primaryButton: {
    width: '100%',
    height: 50,
    borderRadius: 25,
    overflow: 'hidden',
    ...Platform.select({
      ios: {
        shadowColor: '#4CAF50',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
      },
      android: {
        elevation: 3,
      },
    }),
  },
  buttonGradient: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  primaryButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  secondaryButton: {
    width: '100%',
    height: 44,
    borderRadius: 22,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  secondaryButtonText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#fff',
  },
  footerMessage: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 16,
    paddingHorizontal: 16,
  },
  footerText: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.8)',
    textAlign: 'center',
    marginLeft: 6,
    lineHeight: 16,
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: '#fff',
  },
  loadingGradient: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingLogo: {
    width: width * 0.6,
    height: width * 0.6,
  },
});

export default PaymentFailure;
