// components/LanguageSwitcher.tsx
import useGlobalStore from "@/store/global.store";
import { useLanguage } from "../contexts/LanguageContext";
import { Image, TouchableOpacity, StyleSheet, Text, View } from "react-native";
import { AppLocale } from "@/i18n";
import { theme } from "@/constants/theme";

const LanguageSwitcher = () => {
  const { setLanguage, language } = useGlobalStore();
  const { locale, setLocale } = useLanguage();
  
  // Function to cycle through languages (en -> ta -> en)
  const handleLanguageChange = async (currentLang: AppLocale) => {
    let newLocale: AppLocale;
    
    if (currentLang === "en") {
      newLocale = "ta";
    } else {
      newLocale = "en";
    }
    
    await setLanguage(newLocale);
    await setLocale(newLocale);
  };

  // Display language label based on current language
  const getNextLanguageLabel = () => {
    if (language === "en") {
      return "தமிழ்"; // Tamil in Tamil script
    } else {
      return "English";
    }
  };

  return (
    <TouchableOpacity
      onPress={() => handleLanguageChange(language as AppLocale)}
      style={styles.languageButton}
      activeOpacity={0.7}
      hitSlop={{ top: 15, bottom: 15, left: 15, right: 15 }}
    >
      <Image
        source={theme.image.translate}
        style={styles.languageImage}
        resizeMode="contain"
      />
      <Text style={styles.languageText}>{getNextLanguageLabel()}</Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  languageButton: {
    position: "absolute",
    bottom: 80,
    right: 10,
    zIndex: 1,
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: "rgba(0, 0, 0, 0.85)",
    borderRadius: 24,
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#ffffff60",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.4,
    shadowRadius: 3,
    elevation: 4,
  },
  languageImage: {
    width: 20,
    height: 20,
    marginRight: 8,
    tintColor: "#ffffff",
  },
  languageText: {
    color: "#ffffff",
    fontSize: 14,
    fontWeight: "bold",
  },
});

export default LanguageSwitcher;

// // components/LanguageSwitcher.tsx
// import React from 'react';
// import { Button } from 'react-native';
// import { useLanguage } from '../contexts/LanguageContext';
// import i18n from '../i18n';

// const LanguageSwitcher: React.FC = () => {
//   const { locale, setLocale } = useLanguage();

//   return (
//     <Button
//       title={locale === 'en' ? 'தமிழ்' : 'English'}
//       onPress={() => setLocale(locale === 'en' ? 'ta' : 'en')}
//     />
//   );
// // };

// export default LanguageSwitcher;
