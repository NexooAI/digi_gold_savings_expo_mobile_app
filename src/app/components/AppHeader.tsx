import React from "react";
import {
  View,
  Image,
  TouchableOpacity,
  Text,
  StyleSheet,
  Dimensions,
  SafeAreaView,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "expo-router";
import theme from "src/constants/theme";
import useGlobalStore from "@/store/global.store";
import { AppLocale } from "@/i18n";

const { width } = Dimensions.get("window");

const AppHeader = ({ showBackButton = false, backRoute, showLanguageSwitcher = false }) => {
  const navigation = useNavigation();
  const { setLanguage, language } = useGlobalStore();

  const handleBackPress = () => {
    if (backRoute) {
      // Navigate to the specified back route
      navigation.navigate(backRoute);
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
            <Text style={styles.backButtonText}>Back</Text>
          </TouchableOpacity>
        )}
        <View style={styles.logoContainer}>
          <Image
            source={theme.theme.image.transparentLogo}
            style={styles.logo}
            resizeMode="contain"
          />
        </View>
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
  logo: {
    width: "100%",
    height: "100%",
  },
  rightContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  languageButton: {
    padding: 6,
    marginRight: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    width: 36,
    height: 36,
    justifyContent: 'center',
    alignItems: 'center',
  },
  languageImage: {
    width: 24,
    height: 24,
  },
  languageIcon: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#ffffff',
    textAlign: 'center',
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
});

export default AppHeader;
