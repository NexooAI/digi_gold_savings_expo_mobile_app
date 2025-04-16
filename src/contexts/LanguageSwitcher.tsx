// components/LanguageSwitcher.tsx
import useGlobalStore from "@/store/global.store";
import { useLanguage } from "../contexts/LanguageContext";
import { Image, TouchableOpacity, StyleSheet, Button } from "react-native";
import { AppLocale } from "@/i18n";
import { theme } from "@/constants/theme";
const LanguageSwitcher = () => {
  const { setLanguage, language } = useGlobalStore();
  const { locale, setLocale } = useLanguage();
  const handleLanguageChange = async (newLocale: AppLocale) => {
    await setLanguage(newLocale);
    await setLocale(newLocale);
  };

  return (
    <TouchableOpacity
      onPress={() => handleLanguageChange(language === "en" ? "ta" : "en")}
      style={styles.languageButton}
      activeOpacity={0.7} // 👈 Add this line
      hitSlop={{ top: 15, bottom: 15, left: 15, right: 15 }} // 👈 And this line
    >
      <Image
        source={locale === "en" ? theme.image.translate : theme.image.translate}
        style={styles.languageImage}
        resizeMode="contain"
      />

      {/* <Button
        title={language === "en" ? "தமிழ்" : "English"}
        onPress={() => handleLanguageChange(language === "en" ? "ta" : "en")}
      /> */}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  languageButton: {
    position: "absolute",
    bottom: 80, // Adjust based on your status bar height
    right: 10,
    zIndex: 1,
    padding: 8,
    backgroundColor: "#f00",
    borderRadius: 24,
  },
  languageImage: {
    width: 36, // Adjust based on your image size
    height: 36,
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
