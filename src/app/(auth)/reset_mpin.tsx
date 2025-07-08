import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ImageBackground,
  KeyboardAvoidingView,
  Platform,
  Image,
  Dimensions,
  ScrollView,
  TextInput,
  StatusBar,
  TouchableWithoutFeedback,
  Keyboard,
  Pressable,
  Linking,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import api from "@/services/api";
import * as SecureStore from "expo-secure-store";
import * as Crypto from "expo-crypto";
import { theme } from "@/constants/theme";
import { moderateScale } from "react-native-size-matters";
import { registerStyles as styles } from "../../_styles/registerStyles";
import { t } from "@/i18n";
import { AppLocale } from "@/i18n";
import useGlobalStore from "@/store/global.store";
import { SafeAreaView } from "react-native-safe-area-context";

const { width } = Dimensions.get("window");
const logoWidth = width * 0.3;
const salt = "someRandomSaltValue";

// Error Alert Component
const ErrorAlert = ({
  message,
  onClose,
}: {
  message: string;
  onClose: () => void;
}) => (
  <View style={styles.errorAlert}>
    <View style={styles.errorContent}>
      <Ionicons name="alert-circle" size={24} color="#fff" />
      <Text style={styles.errorMessage}>{message}</Text>
    </View>
    <TouchableOpacity onPress={onClose} style={styles.closeButton}>
      <Ionicons name="close" size={24} color="#fff" />
    </TouchableOpacity>
  </View>
);

const hashMPIN = async (mpin: string) => {
  try {
    // Concatenate salt and mpin then hash using SHA-256.
    const hashedMPIN = await Crypto.digestStringAsync(
      Crypto.CryptoDigestAlgorithm.SHA256,
      salt + mpin
    );
    // Store the hashed MPIN securely
    await SecureStore.setItemAsync("user_mpin", hashedMPIN);
  } catch (error) {
    console.error("Error hashing MPIN:", error);
  }
};

interface MpinInputProps {
  length?: number;
  onComplete: (value: string) => void;
  secureTextEntry: boolean;
}

const MpinInput: React.FC<MpinInputProps> = ({
  length = 4,
  onComplete,
  secureTextEntry,
}) => {
  const [values, setValues] = useState(Array(length).fill(""));
  const inputs = React.useRef<(TextInput | null)[]>([]);

  const handleChange = (text: string, index: number) => {
    const newValues = [...values];
    newValues[index] = text.slice(-1); // Only keep the last character

    // Auto-focus next input if value entered
    if (text && index < length - 1) {
      inputs.current[index + 1]?.focus();
    }

    // Move focus back if deleted
    if (!text && index > 0) {
      inputs.current[index - 1]?.focus();
    }

    setValues(newValues);
    onComplete(newValues.join(""));
  };

  const handleKeyPress = (
    { nativeEvent }: { nativeEvent: { key: string } },
    index: number
  ) => {
    if (nativeEvent.key === "Backspace" && !values[index] && index > 0) {
      inputs.current[index - 1]?.focus();
    }
  };

  return (
    <View style={styles.mpinContainer}>
      {values.map((value, index) => (
        <View key={index} style={styles.inputWrapper}>
          <TextInput
            ref={(ref) => {
              inputs.current[index] = ref;
            }}
            style={[
              styles.mpinInput,
              value ? styles.mpinInputFilled : styles.mpinInputEmpty,
            ]}
            keyboardType="number-pad"
            maxLength={1}
            secureTextEntry={secureTextEntry}
            value={value}
            onChangeText={(text) => handleChange(text, index)}
            onKeyPress={(e) => handleKeyPress(e, index)}
            textAlign="center"
          />
          {value && !secureTextEntry && <View style={styles.inputIndicator} />}
        </View>
      ))}
    </View>
  );
};

// Simple Language Switcher Component
const SimpleLanguageSwitcher = () => {
  const { language, setLanguage } = useGlobalStore();
  
  const handleLanguageChange = () => {
    let newLang: AppLocale;
    switch (language) {
      case 'en':
        newLang = 'ta';
        break;
      case 'ta':
        newLang = 'en';
        break;
      default:
        newLang = 'en';
    }
    setLanguage(newLang);
  };

  const getLanguageDisplayName = () => {
    switch (language) {
      case 'en':
        return 'தமிழ்'; // Tamil in Tamil script
      case 'ta':
        return 'English';
      default:
        return 'தமிழ்';
    }
  };

  return (
    <TouchableOpacity
      onPress={handleLanguageChange}
      style={{
        position: 'absolute',
        top: Platform.OS === 'ios' ? 60 : 40,
        right: 20,
        zIndex: 1000,
        backgroundColor: 'rgba(0, 0, 0, 0.85)',
        padding: 12,
        borderRadius: 25,
        flexDirection: 'row',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.6)',
      }}
    >
      <Image
        source={theme.image.translate}
        style={{ width: 20, height: 20, marginRight: 8, tintColor: '#ffffff' }}
      />
      <Text style={{ color: '#ffffff', fontSize: 14, fontWeight: 'bold' }}>
        {getLanguageDisplayName()}
      </Text>
    </TouchableOpacity>
  );
};

export default function ResetMpin() {
  const { name, email, mobile, mode, from } = useLocalSearchParams();

  const router = useRouter();
  const [mpin, setMpin] = useState("");
  const [confirmMpin, setConfirmMpin] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPin, setShowPin] = useState(false);
  const [error, setError] = useState("");
  const [showError, setShowError] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const isCreatingMPIN = mode === "create";
  const fromLogin = from === "login";
  const { language } = useGlobalStore();

  const hideErrorAlert = () => {
    setShowError(false);
  };

  const showErrorAlert = (message: string) => {
    setErrorMessage(message);
    setShowError(true);
    setTimeout(() => setShowError(false), 3000);
  };

  useEffect(() => {
    if (mpin.length === 4 && confirmMpin.length === 4) {
      setError(mpin !== confirmMpin ? t("mpinMismatch") : "");
    } else {
      setError("");
    }
  }, [mpin, confirmMpin, language]);

  const handleSubmit = async () => {
    if (mpin !== confirmMpin) {
      showErrorAlert(t("mpinsDoNotMatch"));
      return;
    }
    setLoading(true);
    try {
      await hashMPIN(mpin);
      showErrorAlert(t("mpinResetSuccess"));
      setTimeout(() => router.replace("/(tabs)/home"), 1000);
    } catch (error: any) {
      showErrorAlert(error.response?.data?.message || t("resetFailed"));
    } finally {
      setLoading(false);
    }
  };

  const dismissKeyboard = () => {
    Keyboard.dismiss();
  };

  return (
    <View style={[styles.container, { minHeight: '100%' }]}>
      <ImageBackground
        source={theme.image.bg_image}
        style={[styles.backgroundImage, { minHeight: '100%' }]}
        resizeMode="cover"
      >
        <SafeAreaView style={{ flex: 1, minHeight: '100%' }}>
          <View style={styles.darkOverlay} />
          <LinearGradient
            colors={["rgba(32, 1, 1, 0.55)", "rgba(167, 0, 0, 0)", "rgba(118, 1, 1, 0)"]}
            style={[styles.gradient, { minHeight: '100%' }]}
          >
            <SimpleLanguageSwitcher />
            {showError && (
              <ErrorAlert message={errorMessage} onClose={hideErrorAlert} />
            )}
            <KeyboardAvoidingView
              behavior={Platform.OS === "ios" ? "padding" : "height"}
              style={styles.keyboardAvoidingView}
              keyboardVerticalOffset={Platform.OS === "ios" ? 100 : 50}
            >
              <ScrollView
                contentContainerStyle={styles.scrollViewContent}
                keyboardShouldPersistTaps="handled"
                showsVerticalScrollIndicator={false}
                bounces={false}
                automaticallyAdjustKeyboardInsets={true}
              >
                <View style={[styles.logoContainer, { paddingTop: 10, marginBottom: 0 }]}>
                  <Image
                    source={theme.image.transparentLogo}
                    style={[styles.logo, { width: 220, height: 220 }]}
                    resizeMode="contain"
                  />
                </View>

                <View style={styles.cardContainer}>
                  {/* Base fog layer */}
                  <LinearGradient
                    colors={[
                      "rgba(26, 42, 57, 0.85)",
                      "rgba(42, 90, 141, 0.75)",
                      "rgba(58, 106, 173, 0.80)",
                    ]}
                    style={StyleSheet.absoluteFill}
                  />
                  {/* Top fog highlight */}
                  <LinearGradient
                    colors={[
                      "rgba(255, 201, 12, 0.15)",
                      "rgba(26, 42, 57, 0.60)",
                    ]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 0, y: 0.5 }}
                    style={StyleSheet.absoluteFill}
                  />
                  {/* Bottom fog highlight */}
                  <LinearGradient
                    colors={[
                      "rgba(26, 42, 57, 0.70)",
                      "rgba(255, 201, 12, 0.10)",
                    ]}
                    start={{ x: 0, y: 0.5 }}
                    end={{ x: 0, y: 1 }}
                    style={StyleSheet.absoluteFill}
                  />
                  {/* Content */}
                  <View style={styles.cardContent}>
                    <Text style={[styles.pageTitle, { color: '#ffffff' }]}>
                      {isCreatingMPIN ? t("createMpin") : t("resetMpin")}
                    </Text>
                    <Text style={[styles.subtitle, { color: '#b8c5d6' }]}>
                      {isCreatingMPIN
                        ? t("createMpinSubtitle")
                        : t("resetMpinSubtitle")}
                    </Text>
                    <Text style={[styles.label, { color: '#ffffff' }]}>{t("newMpin")}</Text>
                    <MpinInput
                      length={4}
                      onComplete={setMpin}
                      secureTextEntry={!showPin}
                    />
                    <View style={{ height: 16 }} />
                    <Text style={[styles.label, { color: '#ffffff' }]}>{t("confirmMpin")}</Text>
                    <MpinInput
                      length={4}
                      onComplete={setConfirmMpin}
                      secureTextEntry={!showPin}
                    />
                    <View style={{ height: 16 }} />
                    {error ? (
                      <View style={styles.errorContainer}>
                        <Ionicons name="alert-circle" size={16} color="#FF6B6B" />
                        <Text style={styles.errorText}>{error}</Text>
                      </View>
                    ) : null}
                    <TouchableOpacity
                      style={styles.eyeToggle}
                      onPress={() => setShowPin(!showPin)}
                    >
                      <Ionicons
                        name={showPin ? "eye-off" : "eye"}
                        size={24}
                        color={theme.colors.secondary}
                      />
                      <Text style={[styles.eyeText, { color: '#b8c5d6' }]}>
                        {showPin ? t("hideMpin") : t("showMpin")}
                      </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[
                        styles.loginButton,
                        (error ||
                          loading ||
                          mpin.length < 4 ||
                          confirmMpin.length < 4) &&
                          styles.loginButtonDisabled,
                      ]}
                      onPress={handleSubmit}
                      disabled={
                        !!error ||
                        loading ||
                        mpin.length < 4 ||
                        confirmMpin.length < 4
                      }
                    >
                      <LinearGradient
                        colors={["#ffc90c", "#ffd700"]}
                        style={styles.gradientButton}
                      >
                        <Text style={styles.loginButtonText}>
                          {loading ? t("processing") : isCreatingMPIN ? t("createMpin") : t("resetMpin")}
                        </Text>
                      </LinearGradient>
                    </TouchableOpacity>
                    {!isCreatingMPIN && (
                      <TouchableOpacity
                        style={styles.backButton}
                        onPress={() => router.back()}
                      >
                        <Ionicons
                          name="arrow-back"
                          size={20}
                          color={theme.colors.white}
                        />
                        <Text style={styles.backButtonText}>{t("back")}</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                </View>
              </ScrollView>
            </KeyboardAvoidingView>
            {/* <View style={styles.poweredByContainer}>
              <Text style={styles.poweredByText}>
                {t("poweredBy")} <Text style={{textDecorationLine: 'underline', color: theme.colors.textLight}} onPress={() => Linking.openURL('https://agnisofterp.com/')}>Agni Soft ERP</Text>
              </Text>
            </View> */}
          </LinearGradient>
        </SafeAreaView>
      </ImageBackground>
    </View>
  );
}
