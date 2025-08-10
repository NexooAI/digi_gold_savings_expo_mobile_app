import React, { useEffect, useRef, useState } from "react";
import {
  View,
  Image,
  TouchableOpacity,
  Text,
  StyleSheet,
  Dimensions,
  SafeAreaView,
  Animated,
  Share,
  Alert,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation, useRouter, usePathname } from "expo-router";
import theme from "src/constants/theme";
import useGlobalStore from "@/store/global.store";
import { AppLocale, t } from "@/i18n";

const { width } = Dimensions.get("window");

interface RateInfo {
  rate: string;
  purity: string;
}

interface TransactionDetails {
  txnId?: string;
  orderId?: string;
  amount?: string | number;
  status: 'success' | 'failure';
  date?: string;
}

interface AppHeaderProps {
  showBackButton?: boolean;
  backRoute?: string;
  showLanguageSwitcher?: boolean;
  showDrawerToggle?: boolean;
  goldRateInfo?: RateInfo;
  goldRateUpdatedAt?: string;
  title?: string;
  transactionDetails?: TransactionDetails;
}

// Helper to format date as 'dd/MM/yyyy HH:mm'
function formatDateTime(dateString?: string) {
  if (!dateString) return '--/--/---- --:--';
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return '--/--/---- --:--';
  const pad = (n: number) => n < 10 ? '0' + n : n;
  return `${pad(date.getDate())}/${pad(date.getMonth() + 1)}/${date.getFullYear()} ${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

const AppHeader: React.FC<AppHeaderProps> = ({ 
  showBackButton = false, 
  backRoute, 
  showLanguageSwitcher = false, 
  showDrawerToggle = true,
  goldRateInfo, 
  goldRateUpdatedAt, 
  title,
  transactionDetails
}) => {
  const navigation = useNavigation();
  const router = useRouter();
  const pathname = usePathname();
  const { setLanguage, language } = useGlobalStore();

  // Flipping card state
  const [showGold, setShowGold] = useState(true);
  const flipAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const interval = setInterval(() => {
      Animated.timing(flipAnim, {
        toValue: showGold ? 1 : 0,
        duration: 400,
        useNativeDriver: true,
      }).start(() => setShowGold((prev) => !prev));
    }, 2000);
    return () => clearInterval(interval);
  }, [showGold]);

  const frontInterpolate = flipAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '180deg'],
  });
  const backInterpolate = flipAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['180deg', '360deg'],
  });

  const handleBackPress = () => {
    // Prefer explicit back route if provided
    if (backRoute) {
      // If it's an absolute app path, use the router
      if (backRoute.startsWith('/')) {
        try {
          router.replace(backRoute as any);
          return;
        } catch {}
      } else {
        // Otherwise treat it as a route name for the current navigator
        try {
          (navigation as any).navigate(backRoute as any);
          return;
        } catch {}
      }
    }

    // If we can go back via navigation, do so
    try {
      if ((navigation as any)?.canGoBack?.()) {
        (navigation as any).goBack();
        return;
      }
    } catch {}

    // Try router back as a secondary option
    try {
      (router as any).back?.();
      return;
    } catch {}

    // Final fallback: Go to home tab explicitly
    try {
      router.replace('/(app)/(tabs)/home');
    } catch {
      try {
        (navigation as any).navigate('(tabs)', { screen: 'home' });
      } catch {}
    }
  };

  const handleLanguageChange = async (currentLang: AppLocale) => {
    let newLocale: AppLocale;
    
    if (currentLang === "en") {
      newLocale = "mal";
    } else {
      newLocale = "en";
    }
    
    await setLanguage(newLocale);
  };

  const getLanguageDisplayName = () => {
    if (language === "en") {
      return "മലയാളം"; // Malayalam in Malayalam script
    } else {
      return "English";
    }
  };

  const getLanguageImage = () => {
    if (language === "en") {
      return require('../../../assets/images/translate/mal.png'); // Show Malayalam flag to switch to Malayalam
    } else {
      return require('../../../assets/images/translate/eng.png'); // Show English flag to switch to English
    }
  };

  // Check if current page is payment success or failure
  const isPaymentPage = pathname?.includes('payment-success') || pathname?.includes('payment-failure');

  // Handle share functionality for payment pages
  const handleSharePress = async () => {
    if (!isPaymentPage || !transactionDetails) return;

    try {
      const { txnId, orderId, amount, status, date } = transactionDetails;
      
      // Format amount for display
      const formattedAmount = amount ? 
        new Intl.NumberFormat('en-IN', {
          style: 'currency',
          currency: 'INR',
          minimumFractionDigits: 0,
          maximumFractionDigits: 0,
        }).format(Number(amount)) : 'N/A';

      // Format date for display
      const formattedDate = date ? 
        new Date(date).toLocaleString('en-IN', {
          day: '2-digit',
          month: '2-digit',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
        }) : new Date().toLocaleString('en-IN');

      let shareMessage = '';
      
      if (status === 'success') {
        shareMessage = `🎉 Payment Successful!

💰 Amount: ${formattedAmount}
🆔 Transaction ID: ${txnId || 'N/A'}
📋 Order ID: ${orderId || 'N/A'}
📅 Date & Time: ${formattedDate}
✅ Status: Payment Successful

Thank you for using our service! 🚀`;
      } else {
        shareMessage = `📱 Payment Service Update

💡 Transaction Details:
💰 Amount: ${formattedAmount}
🆔 Transaction ID: ${txnId || 'N/A'}
📋 Order ID: ${orderId || 'N/A'}
📅 Date & Time: ${formattedDate}
❌ Status: Payment Failed

Need help? Contact our support team! 📞`;
      }

      const result = await Share.share({
        message: shareMessage,
        title: status === 'success' ? 'Payment Success Details' : 'Payment Details'
      });

      if (result.action === Share.sharedAction) {
        if (result.activityType) {
          console.log('Shared with activity type:', result.activityType);
        } else {
          console.log('Shared successfully');
        }
      } else if (result.action === Share.dismissedAction) {
        console.log('Share dismissed');
      }
    } catch (error) {
      console.error('Share error:', error);
      Alert.alert('Error', 'Failed to share details');
    }
  };

  return (
    <View style={styles.container}>
        {showBackButton && (
          <TouchableOpacity onPress={handleBackPress} style={styles.backButton}>
            <Ionicons
              name="arrow-back-outline"
              size={20}
              color={theme.theme.colors.white}
            />
          </TouchableOpacity>
        )}
        {title ? (
          <View style={styles.titleContainer}>
            <Text style={styles.titleText}>{title}</Text>
          </View>
        ) : (
          <View style={styles.logoContainer}>
            <Image
              source={theme.theme.image.transparentLogo}
              style={styles.logo}
              resizeMode="contain"
            />
          </View>
        )}
        {goldRateInfo && (
          <View style={styles.flipCardWrapper}>
            <Animated.View
              style={[styles.flipCard, { transform: [{ perspective: 1000 }, { rotateX: frontInterpolate }] }]}
            >
              {/* Gold Side 1 */}
              <Image source={require('../../../assets/images/gold_pattern.jpg')} style={styles.plateBg} />
              <View style={styles.plateContent}>
                <View style={{ marginLeft: 6 }}>
                  <Text style={styles.goldRateText}>Gold: ₹{goldRateInfo.rate}</Text>
                  <Text style={styles.goldRatePurity}>22K</Text>
                </View>
              </View>
            </Animated.View>
            <Animated.View
              style={[styles.flipCard, styles.flipCardBack, { transform: [{ perspective: 1000 }, { rotateX: backInterpolate }] }]}
            >
              {/* Gold Side 2 (flipped): Show updated date/time and LIVE */}
              <Image source={require('../../../assets/images/gold_pattern.jpg')} style={styles.plateBg} />
              <View style={[styles.plateContent, { flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }]}> 
                <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 2 }}>
                  <Ionicons name="time-outline" size={14} color="#7a5600" style={{ marginRight: 4 }} />
                  <Text style={styles.updateText}>
                    {formatDateTime(goldRateUpdatedAt)}
                  </Text>
                </View>
                <Text style={styles.liveText}>{t('live')}</Text>
              </View>
            </Animated.View>
          </View>
        )}
        <View style={styles.rightContainer}>
          {showLanguageSwitcher && (
            <TouchableOpacity
              onPress={() => handleLanguageChange(language as AppLocale)}
              style={styles.languageButton}
              activeOpacity={0.7}
            >
              <Image 
                source={getLanguageImage()}
                style={styles.languageImage}
                resizeMode="contain"
              />
              <Text style={styles.languageText}>{getLanguageDisplayName()}</Text>
            </TouchableOpacity>
          )}
          {/* Conditional Share Icon for Payment Pages */}
          {isPaymentPage && (
            <TouchableOpacity
              onPress={handleSharePress}
              style={styles.shareButton}
              activeOpacity={0.7}
            >
              <Ionicons name="share-outline" size={24} color={theme.theme.colors.white} />
            </TouchableOpacity>
          )}
          {showDrawerToggle && (
            <TouchableOpacity
              onPress={() => (navigation as any).openDrawer()}
              style={styles.drawerToggle}
            >
              <Ionicons name="reorder-three-outline" size={28} color="#ffffff" />
            </TouchableOpacity>
          )}
        </View>
      </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: theme.theme.colors.primary,
    flex: 1,
  },
  logoContainer: {
    width: width * 0.25,
    height: 40,
  },
  titleContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  titleText: {
    color: theme.theme.colors.white,
    fontSize: 18,
    fontWeight: 'bold',
  },
  logo: {
    width: "100%",
    height: "100%",
  },
  rightContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  languageButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.6)",
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.3)",
    marginRight: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
    elevation: 4,
  },
  languageImage: {
    width: 20,
    height: 20,
    marginRight: 6,
  },
  languageText: {
    color: "#ffffff",
    fontSize: 12,
    fontWeight: "bold",
  },
  drawerToggle: {
    padding: 8,
  },
  backButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  backButtonText: {
    fontSize: 13, // Smaller text for better UX
    color: theme.theme.colors.white,
    marginLeft: 4,
  },
  flipCardWrapper: {
    width: 110,
    height: 36,
    marginHorizontal: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  flipCard: {
    position: 'absolute',
    width: 110,
    height: 36,
    borderRadius: 14,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
    backfaceVisibility: 'hidden',
  },
  flipCardBack: {
    transform: [{ rotateX: '180deg' }],
  },
  plateBg: {
    ...StyleSheet.absoluteFillObject as any,
    width: '100%',
    height: '100%',
    opacity: 0.15,
  },
  plateContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  goldRateText: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#7a5600',
  },
  goldRatePurity: {
    fontSize: 11,
    color: '#7a5600',
    opacity: 0.9,
    textAlign: 'center',
  },
  updateText: {
    fontSize: 10,
    color: '#7a5600',
  },
  liveText: {
    fontSize: 10,
    color: '#b30000',
    fontWeight: 'bold',
  },
  shareButton: {
    padding: 8,
    marginRight: 8,
  },
});

export default AppHeader;
