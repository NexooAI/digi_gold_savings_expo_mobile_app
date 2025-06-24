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
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "expo-router";
import theme from "src/constants/theme";
import useGlobalStore from "@/store/global.store";
import { AppLocale, t } from "@/i18n";

const { width } = Dimensions.get("window");

interface RateInfo {
  rate: string;
  purity: string;
}

interface AppHeaderProps {
  showBackButton?: boolean;
  backRoute?: string;
  showLanguageSwitcher?: boolean;
  goldRateInfo?: RateInfo;
  goldRateUpdatedAt?: string;
  title?: string;
}

// Helper to format date as 'dd/MM/yyyy HH:mm'
function formatDateTime(dateString?: string) {
  if (!dateString) return '--/--/---- --:--';
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return '--/--/---- --:--';
  const pad = (n: number) => n < 10 ? '0' + n : n;
  return `${pad(date.getDate())}/${pad(date.getMonth() + 1)}/${date.getFullYear()} ${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

const AppHeader: React.FC<AppHeaderProps> = ({ showBackButton = false, backRoute, showLanguageSwitcher = false, goldRateInfo, goldRateUpdatedAt, title }) => {
  const navigation = useNavigation();
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
    if (backRoute) {
      // Navigate to the specified back route (string format, bypass type error)
      try {
        navigation.navigate(backRoute as any);
      } catch {
        navigation.goBack();
      }
    } else {
      // Default behavior: go back to the previous screen
      navigation.goBack();
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

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        {showBackButton && (
          <TouchableOpacity onPress={handleBackPress} style={styles.backButton}>
            <Ionicons
              name="arrow-back-outline"
              size={20}
              color={theme.theme.colors.white}
            />
            <Text style={styles.backButtonText}>{t('back')}</Text>
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
          <TouchableOpacity
            onPress={() => (navigation as any).openDrawer()}
            style={styles.drawerToggle}
          >
            <Ionicons name="reorder-three-outline" size={28} color="#ffffff" />
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    backgroundColor: theme.theme.colors.primary,
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    zIndex: 1000,
  },
  container: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 15,
    paddingVertical: 10,
  },
  logoContainer: {
    width: width * 0.3,
    height: 50,
  },
  titleContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  titleText: {
    color: theme.theme.colors.white,
    fontSize: 20,
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
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.3)",
    marginRight: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
    elevation: 4,
  },
  languageImage: {
    width: 24,
    height: 24,
    marginRight: 8,
  },
  languageText: {
    color: "#ffffff",
    fontSize: 14,
    fontWeight: "bold",
  },
  drawerToggle: {
    padding: 10,
  },
  backButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 5,
    paddingHorizontal: 10,
  },
  backButtonText: {
    fontSize: 14, // Smaller text for better UX
    color: theme.theme.colors.white,
    marginLeft: 5,
  },
  flipCardWrapper: {
    width: 120,
    height: 40,
    marginHorizontal: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  flipCard: {
    position: 'absolute',
    width: 120,
    height: 40,
    borderRadius: 16,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
    backfaceVisibility: 'hidden',
  },
  flipCardBack: {
    position: 'absolute',
    width: 120,
    height: 40,
    borderRadius: 16,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
    backfaceVisibility: 'hidden',
  },
  rateImage: {
    width: 28,
    height: 28,
    resizeMode: 'contain',
  },
  goldRateText: {
    color: '#7a5600',
    fontWeight: 'bold',
    fontSize: 15,
    textShadowColor: 'rgba(255,255,255,0.7)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  goldRatePurity: {
    color: '#5a3d00',
    fontSize: 12,
    fontWeight: '600',
    opacity: 0.9,
    textShadowColor: 'rgba(255,255,255,0.6)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 1,
  },
  plateBg: {
    ...StyleSheet.absoluteFillObject,
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
    zIndex: 0,
    borderRadius: 16,
  },
  plateContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1,
    width: '100%',
    paddingLeft: 8,
    paddingRight: 8,
  },
  updateText: {
    color: '#7a5600',
    fontSize: 12,
    fontWeight: '600',
    textShadowColor: 'rgba(255,255,255,0.7)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 1,
  },
  liveText: {
    color: '#d32f2f',
    fontWeight: 'bold',
    fontSize: 13,
    letterSpacing: 1,
    marginTop: 2,
  },
});

export default AppHeader;
