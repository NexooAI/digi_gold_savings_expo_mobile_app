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
import AsyncStorage from "@react-native-async-storage/async-storage";

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
        newLang = 'mal';
        break;
      case 'mal':
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
        return 'മലയാളം';
      case 'mal':
        return 'English';
      default:
        return 'മലയാളം';
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
        backgroundColor: 'rgba(0, 0, 0, 0.7)',
        padding: 12,
        borderRadius: 25,
        flexDirection: 'row',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.3)',
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
  const [currentMpin, setCurrentMpin] = useState("");
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
    if (!isCreatingMPIN && currentMpin.length === 4 && mpin.length === 4 && confirmMpin.length === 4) {
      if (mpin !== confirmMpin) {
        setError(t("mpinMismatch"));
      } else if (currentMpin === mpin) {
        setError(t("newMpinSameAsCurrent"));
      } else {
        setError("");
      }
    } else if (isCreatingMPIN && mpin.length === 4 && confirmMpin.length === 4) {
      setError(mpin !== confirmMpin ? t("mpinMismatch") : "");
    } else {
      setError("");
    }
  }, [currentMpin, mpin, confirmMpin, language, isCreatingMPIN]);

  const handleSubmit = async () => {
    if (!isCreatingMPIN && currentMpin.length !== 4) {
      showErrorAlert(t("enterCurrentMpin"));
      return;
    }
    
    if (mpin !== confirmMpin) {
      showErrorAlert(t("mpinsDoNotMatch"));
      return;
    }

    if (!isCreatingMPIN && currentMpin === mpin) {
      showErrorAlert(t("newMpinSameAsCurrent"));
      return;
    }

    setLoading(true);
    try {
      // Get user data to send with MPIN update
      const userData = JSON.parse(
        (await AsyncStorage.getItem("userData")) || "{}"
      );
      
      if (!userData.mobile_number) {
        showErrorAlert("User mobile number not found");
        return;
      }

      // Call API to update MPIN on server
      const response = await fetch(`${theme.baseUrl}/auth/update-mpin`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({
          mobileNumber: userData.mobile_number,
          currentMpin: !isCreatingMPIN ? currentMpin : undefined,
          mpin: mpin
        }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        showErrorAlert(t("mpinResetSuccess"));
        setTimeout(() => router.replace("/(app)/(tabs)"), 1000);
      } else {
        showErrorAlert(data.message || t("resetFailed"));
      }
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
    <SafeAreaView style={styles.container}>
      <ImageBackground
        source={theme.image.bg_image}
        style={styles.backgroundImage}
      >
        {/* Dark overlay for background */}
        <View style={styles.darkOverlay} />
        <LinearGradient
          colors={["rgba(32, 1, 1, 0.55)", "rgba(167, 0, 0, 0)", "rgba(118, 1, 1, 0)"]}
          style={styles.gradient}
        >
          <SimpleLanguageSwitcher />
          {showError && (
            <ErrorAlert message={errorMessage} onClose={hideErrorAlert} />
          )}
          <KeyboardAvoidingView
            behavior={Platform.OS === "ios" ? "padding" : "height"}
            style={styles.keyboardAvoidingView}
            keyboardVerticalOffset={Platform.OS === "ios" ? 40 : 0}
          >
            <ScrollView
              contentContainerStyle={styles.scrollViewContent}
              keyboardShouldPersistTaps="handled"
            >
              <View style={styles.logoContainer}>
                <Image
                  source={theme.image.transparentLogo}
                  style={styles.logo}
                  resizeMode="contain"
                />
              </View>
              <View style={styles.formContainer}>
                <View style={styles.cardContainer}>
                  {/* Base fog layer */}
                  <LinearGradient
                    colors={[
                      "rgba(6, 2, 2, 0.78)",
                      "rgba(34, 0, 0, 0.35)",
                      "rgba(31, 3, 3, 0.54)",
                    ]}
                    style={StyleSheet.absoluteFill}
                  />
                  {/* Top fog highlight */}
                  <LinearGradient
                    colors={[
                      "rgba(10, 2, 2, 0.38)",
                      "rgba(76, 63, 63, 0.74)",
                    ]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 0, y: 0.5 }}
                    style={StyleSheet.absoluteFill}
                  />
                  {/* Bottom fog highlight */}
                  <LinearGradient
                    colors={[
                      "rgba(0, 0, 0, 0.44)",
                      "rgba(0, 0, 0, 0.28)",
                    ]}
                    start={{ x: 0, y: 0.5 }}
                    end={{ x: 0, y: 1 }}
                    style={StyleSheet.absoluteFill}
                  />
                  {/* Content */}
                  <View style={styles.cardContent}>
                    <Text style={styles.pageTitle}>
                      {isCreatingMPIN ? t("createMpin") : t("resetMpin")}
                    </Text>
                    <Text style={styles.subtitle}>
                      {isCreatingMPIN
                        ? t("createMpinSubtitle")
                        : t("resetMpinSubtitle")}
                    </Text>
                    
                    {!isCreatingMPIN && (
                      <>
                        <Text style={styles.label}>{t("currentMpin")}</Text>
                        <MpinInput
                          length={4}
                          onComplete={setCurrentMpin}
                          secureTextEntry={!showPin}
                        />
                        <View style={{ height: 16 }} />
                      </>
                    )}
                    
                    <Text style={styles.label}>{t("newMpin")}</Text>
                    <MpinInput
                      length={4}
                      onComplete={setMpin}
                      secureTextEntry={!showPin}
                    />
                    <View style={{ height: 16 }} />
                    <Text style={styles.label}>{t("confirmMpin")}</Text>
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
                      <Text style={styles.eyeText}>
                        {showPin ? t("hideMpin") : t("showMpin")}
                      </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[
                        styles.loginButton,
                        (error ||
                          loading ||
                          (!isCreatingMPIN && currentMpin.length < 4) ||
                          mpin.length < 4 ||
                          confirmMpin.length < 4) &&
                          styles.loginButtonDisabled,
                      ]}
                      onPress={handleSubmit}
                      disabled={
                        !!error ||
                        loading ||
                        (!isCreatingMPIN && currentMpin.length < 4) ||
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
              </View>
            </ScrollView>
          </KeyboardAvoidingView>
        </LinearGradient>
      </ImageBackground>
    </SafeAreaView>
  );
}
