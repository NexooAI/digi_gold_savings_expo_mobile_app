import React, { useRef, useState, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ImageBackground,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  Alert,
  Dimensions,
  Image,
  Animated,
  Easing,
  NativeSyntheticEvent,
  TextInputKeyPressEventData,
  TouchableWithoutFeedback,
  Keyboard,
  ScrollView,
} from "react-native";
import { useRouter } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as SecureStore from "expo-secure-store";
import * as Crypto from "expo-crypto";
import useGlobalStore from "@/store/global.store";
import { theme } from "@/constants/theme";
import { LinearGradient } from "expo-linear-gradient";
import { BlurView } from "expo-blur";
import Icon from "@expo/vector-icons/MaterialIcons";
import { t } from "@/i18n";
import { AppLocale } from "@/i18n";

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

export default function MpinVerify() {
  const [mpinPins, setMpinPins] = useState(["", "", "", ""]);
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { login, isLoggedIn, logout } = useGlobalStore();
  const { width } = Dimensions.get("window");
  const logoWidth = width * 0.3;
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const shakeAnim = useRef(new Animated.Value(0)).current;

  // Animation for button press
  const animatePress = () => {
    Animated.sequence([
      Animated.timing(scaleAnim, {
        toValue: 0.95,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start();
  };

  // Shake animation for error
  const shakeError = () => {
    Animated.sequence([
      Animated.timing(shakeAnim, {
        toValue: 10,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(shakeAnim, {
        toValue: -10,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(shakeAnim, {
        toValue: 10,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(shakeAnim, {
        toValue: 0,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start();
  };

  // Redirect immediately if already logged in
  useEffect(() => {
    if (isLoggedIn) {
      router.replace("/(tabs)/home");
    }
  }, [isLoggedIn, router]);

  // Create refs for each of the 4 MPIN input fields
  const mpinInputRefs = [
    useRef<TextInput>(null),
    useRef<TextInput>(null),
    useRef<TextInput>(null),
    useRef<TextInput>(null),
  ];

  const verifyMPINCheck = async (inputMPIN: string): Promise<boolean> => {
    try {
      const salt = "someRandomSaltValue";
      const storedHashedMPIN = await SecureStore.getItemAsync("user_mpin");
      if (!storedHashedMPIN) {
        console.error("No hashed MPIN found. Please set up your MPIN first.");
        return false;
      }
      const inputHashedMPIN = await Crypto.digestStringAsync(
        Crypto.CryptoDigestAlgorithm.SHA256,
        salt + inputMPIN
      );
      return storedHashedMPIN === inputHashedMPIN;
    } catch (error) {
      console.error("Error verifying MPIN:", error);
      return false;
    }
  };

  const verifyMpin = async (enteredMpin: string) => {
    setLoading(true);
    try {
      const isValid = await verifyMPINCheck(enteredMpin);
      if (isValid) {
        const token = await SecureStore.getItem("authToken");
        const userData = JSON.parse(
          (await AsyncStorage.getItem("userData")) || "{}"
        );

        if (token) {
          useGlobalStore.getState().login(token, {
            id: userData.user_id,
            name: userData.name,
            email: userData.email,
            mobile: userData.mobile_number,
            referralCode: userData.referralCode,
          });
          router.replace("/(tabs)/home");
        }
      } else {
        shakeError();
        Alert.alert(t("error"), t("incorrectMpin"));
        setMpinPins(["", "", "", ""]);
      }
    } catch (error) {
      console.error("Error verifying MPIN:", error);
      Alert.alert(t("error"), t("failedToVerifyMpin"));
    } finally {
      setLoading(false);
    }
  };

  const handleEnterMpinChange = (text: string, index: number): void => {
    const newPins = [...mpinPins];
    newPins[index] = text;
    setMpinPins(newPins);

    if (text.length === 1 && index < 3) {
      mpinInputRefs[index + 1].current?.focus();
    }
  };

  const handleMpinKeyPress = (
    e: NativeSyntheticEvent<TextInputKeyPressEventData>,
    index: number
  ): void => {
    if (e.nativeEvent.key === "Backspace" && !mpinPins[index] && index > 0) {
      const newPins = [...mpinPins];
      newPins[index - 1] = "";
      setMpinPins(newPins);
      mpinInputRefs[index - 1].current?.focus();
    }
  };

  return (
    <ImageBackground
      source={theme.image.bg_image}
      style={styles.backgroundImage}
    >
      <LinearGradient
        colors={["rgba(32, 1, 1, 0)", "rgba(167, 0, 0, 0)", "rgba(118, 1, 1, 0.02)"]}
        style={styles.gradient}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={{ flex: 1 }}
          keyboardVerticalOffset={Platform.OS === "ios" ? 200 : 150}
        >
          <ScrollView
            contentContainerStyle={{ flexGrow: 1, justifyContent: 'center' }}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
              <View style={styles.container}>
                <View style={styles.logoContainer}>
                  <Image
                    source={theme.image.transparentLogo}
                    style={[styles.logo, { width: logoWidth }]}
                    resizeMode="contain"
                  />
                </View>

                <View style={styles.formContainer}>
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
                      <Text style={styles.mpinTitle}>{t("enterMpinTitle")}</Text>
                      <Text style={styles.mpinSubtitle}>
                        {t("enterMpinSubtitle")}
                      </Text>

                      <Animated.View 
                        style={[
                          styles.otpInputsContainer,
                          {
                            transform: [{ translateX: shakeAnim }]
                          }
                        ]}
                      >
                        {mpinPins.map((pin, index) => (
                          <View key={index} style={styles.inputWrapper}>
                            <TextInput
                              ref={mpinInputRefs[index]}
                              style={[
                                styles.otpInput,
                                pin ? styles.otpInputFilled : styles.otpInputEmpty
                              ]}
                              keyboardType="numeric"
                              maxLength={1}
                              value={pin}
                              onChangeText={(text) => handleEnterMpinChange(text, index)}
                              onKeyPress={(e) => handleMpinKeyPress(e, index)}
                              secureTextEntry={true}
                              autoFocus={index === 0}
                            />
                            {pin !== "" && (
                              <View style={styles.inputDot} />
                            )}
                          </View>
                        ))}
                      </Animated.View>

                      <Animated.View
                        style={{
                          transform: [{ scale: scaleAnim }],
                          width: '100%',
                        }}
                      >
                        <TouchableOpacity
                          style={[styles.loginButton, loading && styles.loginButtonDisabled]}
                          onPress={() => {
                            animatePress();
                            verifyMpin(mpinPins.join(""));
                          }}
                          disabled={loading || mpinPins.includes("")}
                        >
                          <LinearGradient
                            colors={["#ffc90c", "#ffd700"]}
                            style={styles.buttonGradient}
                          >
                            <Text style={styles.loginButtonText}>
                              {loading ? t("processing") : t("login")}
                            </Text>
                          </LinearGradient>
                        </TouchableOpacity>
                      </Animated.View>

                      <TouchableOpacity
                        style={styles.forgotContainer}
                        onPress={async () => {
                          await SecureStore.deleteItemAsync("authToken");
                          await SecureStore.deleteItemAsync("user_mpin");
                          logout();
                          setMpinPins(["", "", "", ""]);
                          router.replace("/(auth)/login");
                        }}
                      >
                        <Icon name="help-outline" size={20} color={theme.colors.secondary} />
                        <Text style={styles.loginLink}>
                          {t("forgotMpinText")}
                        </Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                </View>
              </View>
            </TouchableWithoutFeedback>
          </ScrollView>
        </KeyboardAvoidingView>
      </LinearGradient>
      <SimpleLanguageSwitcher />
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  backgroundImage: {
    flex: 1,
    resizeMode: "cover",
  },
  gradient: {
    flex: 1,
  },
  container: {
    flex: 1,
    paddingBottom: Platform.OS === "ios" ? 40 : 20,
  },
  logoContainer: {
    width: "100%",
    alignItems: "center",
    paddingTop: Platform.OS === "ios" ? 60 : 40,
    marginBottom: 20,
  },
  logo: {
    aspectRatio: 1,
  },
  formContainer: {
    flex: 1,
    justifyContent: "center",
    paddingHorizontal: 20,
    paddingBottom: Platform.OS === "ios" ? 40 : 0,
  },
  cardContainer: {
    borderRadius: 20,
    padding: 20,
    width: "100%",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.4)",
    marginBottom: Platform.OS === "ios" ? 20 : 10,
    overflow: "hidden",
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.3,
        shadowRadius: 12,
        backdropFilter: "blur(20px)",
      },
      android: {
        elevation: 12,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.3,
        shadowRadius: 12,
      },
    }),
    position: "relative",
  },
  cardContent: {
    position: "relative",
    zIndex: 1,
  },
  mpinTitle: {
    color: "#ffffff",
    fontSize: 28,
    fontWeight: "bold",
    marginBottom: 10,
    textAlign: "center",
  },
  mpinSubtitle: {
    color: "#ffffff",
    fontSize: 16,
    marginBottom: 30,
    textAlign: "center",
    opacity: 0.8,
  },
  otpInputsContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: "70%",
    alignSelf: "center",
    marginBottom: 30,
  },
  inputWrapper: {
    position: "relative",
    width: 50,
    height: 50,
  },
  otpInput: {
    width: "100%",
    height: "100%",
    borderWidth: 1,
    borderRadius: 12,
    textAlign: "center",
    fontSize: 24,
    color: "#000000",
    backgroundColor: "#ffffff",
  },
  otpInputEmpty: {
    borderColor: "rgba(174, 28, 28, 0.2)",
    backgroundColor: "#ffffff",
    color: "#000000",
  },
  otpInputFilled: {
    borderColor: theme.colors.secondary,
    backgroundColor: "#ffffff",
    color: "#000000",
  },
  inputDot: {
    position: "absolute",
    top: "50%",
    left: "50%",
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: theme.colors.secondary,
    transform: [{ translateX: -4 }, { translateY: -4 }],
  },
  loginButton: {
    width: "100%",
    height: 50,
    borderRadius: 25,
    overflow: "hidden",
    marginTop: 20,
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
      },
      android: {
        elevation: 8,
      },
    }),
  },
  buttonGradient: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loginButtonDisabled: {
    opacity: 0.6,
  },
  loginButtonText: {
    color: theme.colors.textDark,
    fontSize: 18,
    fontWeight: "bold",
  },
  forgotContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 20,
  },
  loginLink: {
    color: theme.colors.secondary,
    marginLeft: 8,
    fontSize: 16,
    fontWeight: "600",
  },
});
