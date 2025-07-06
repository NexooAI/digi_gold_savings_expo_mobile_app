import React, { useRef, useState, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ImageBackground,
  TextInput,
  Image,
  KeyboardAvoidingView,
  Platform,
  Dimensions,
  Alert,
  Animated,
  NativeSyntheticEvent,
  TextInputKeyPressEventData,
  Linking,
  ScrollView,
} from "react-native";
import { useFocusEffect, useRouter } from "expo-router";
import NetInfo from "@react-native-community/netinfo";
import PhoneInput from "../components/PhoneInputs";
import useGlobalStore from "@/store/global.store";
import api from "@/services/api";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as SecureStore from "expo-secure-store";
import { Feather, Ionicons } from "@expo/vector-icons";
import { theme } from "@/constants/theme";
import { LinearGradient } from "expo-linear-gradient";
import { SafeAreaView } from "react-native-safe-area-context";
import { t } from "@/i18n";
import { registerStyles } from "../../_styles/registerStyles";
import { useAuth } from "@/contexts/AuthContext";
import LanguageSwitcher from "@/contexts/LanguageSwitcher";
import { AppLocale } from "@/i18n";
import ModernAuthCard from '../components/ModernAuthCard';

const { width } = Dimensions.get("window");
const logoWidth = width * 0.3;

const ErrorAlert = ({
  message,
  onClose,
}: {
  message: string;
  onClose: () => void;
}) => {
  const translateY = useRef(new Animated.Value(-100)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(translateY, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(opacity, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start();

    const timer = setTimeout(() => {
      Animated.parallel([
        Animated.timing(translateY, {
          toValue: -100,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start(() => onClose());
    }, 3000);

    return () => clearTimeout(timer);
  }, []);

  return (
    <Animated.View
      style={[
        registerStyles.errorAlert,
        {
          transform: [{ translateY }],
          opacity,
        },
      ]}
    >
      <View style={registerStyles.errorContent}>
        <Ionicons name="alert-circle" size={24} color="#fff" />
        <Text style={registerStyles.errorMessage}>{message}</Text>
      </View>
      <TouchableOpacity onPress={onClose} style={registerStyles.closeButton}>
        <Ionicons name="close" size={20} color="#fff" />
      </TouchableOpacity>
    </Animated.View>
  );
};

const GlassmorphismCard = ({ children }: { children: React.ReactNode }) => {
  return (
    <View style={registerStyles.cardContainer}>
      {/* Base fog layer */}
      <LinearGradient
        colors={[
          "rgba(174, 0, 0, 0.1)",
          "rgba(34, 0, 0, 0.35)",
          "rgba(134, 1, 1, 0.4)",
        ]}
        style={StyleSheet.absoluteFill}
      />
      {/* Top fog highlight */}
      <LinearGradient
        colors={[
          "rgba(112, 0, 0, 0.38)",
          "rgba(130, 0, 0, 0.4)",
        ]}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 0.5 }}
        style={StyleSheet.absoluteFill}
      />
      {/* Bottom fog highlight */}
      <LinearGradient
        colors={[
          "rgba(143, 0, 0, 0.29)",
          "rgba(122, 5, 5, 0.53)",
        ]}
        start={{ x: 0, y: 0.5 }}
        end={{ x: 0, y: 1 }}
        style={StyleSheet.absoluteFill}
      />
      {/* Content */}
      <View style={registerStyles.cardContent}>{children}</View>
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

export default function Login() {
  // State for mobile number and OTP
  const [mobile, setMobile] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  // OTP related state
  const [pins, setPins] = useState(["", "", "", ""]);
  const [timer, setTimer] = useState(120);
  const [resendAttempts, setResendAttempts] = useState(3);
  const [isShowOtp, setIsShowOtp] = useState(false);
  const [showOtp, setShowOtp] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [otpVerified, setOtpVerified] = useState(false);
  const [otpValidated, setOtpValidated] = useState(false);
  const [otp, setOtp] = useState("");

  // Refs for OTP inputs
  const inputRefs = [
    useRef<TextInput>(null),
    useRef<TextInput>(null),
    useRef<TextInput>(null),
    useRef<TextInput>(null),
  ];

  // Global state and error handling
  const { login, isLoggedIn } = useGlobalStore();
  const [errorMessage, setErrorMessage] = useState("");
  const [showError, setShowError] = useState(false);
  const [mobileError, setMobileError] = useState("");

  // Platform detection
  // const isAndroid = Platform.OS === "android";
  // const isIOS = Platform.OS === "ios";

  useEffect(() => {
    checkTokenValidity();
  }, []);

  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener((state) => {
      if (!state.isConnected) showNetworkAlert();
    });
    return () => unsubscribe();
  }, []);

  useFocusEffect(
    React.useCallback(() => {
      setPins(["", "", "", ""]);
      setIsShowOtp(false);
    }, [])
  );

  useEffect(() => {
    let countdown: NodeJS.Timeout;
    if (isShowOtp && timer > 0) {
      countdown = setInterval(() => {
        setTimer((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(countdown);
  }, [isShowOtp, timer]);

  const checkTokenValidity = async () => {
    try {
      const token = await SecureStore.getItem("authToken");
      if (!token) return;
    } catch (error) {
      console.error("Error checking token:", error);
    }
  };

  const showNetworkAlert = () => {
    Alert.alert(t("noInternetTitle"), t("noInternetMessage"), [
      {
        text: t("retry"),
        onPress: async () => {
          const netState = await NetInfo.fetch();
          if (!netState.isConnected) showNetworkAlert();
        },
      },
    ]);
  };

  const handlePinChange = (text: string, index: number) => {
    // Only allow numeric input
    const numericValue = text.replace(/[^0-9]/g, "");
    if (numericValue === "" || /^\d+$/.test(numericValue)) {
      const newPins = [...pins];
      newPins[index] = numericValue;
      setPins(newPins);

      // Auto-focus next input if there's a value
      if (numericValue && index < 3 && inputRefs[index + 1]?.current) {
        inputRefs[index + 1].current?.focus();
      }

      // Auto-submit when all digits are entered
      const isOtpComplete = newPins.every((pin) => pin.trim() !== "");
      if (isOtpComplete) {
        verifyOtp(newPins.join(""));
      }
    }
  };

  const handleKeyPress = (
    e: NativeSyntheticEvent<TextInputKeyPressEventData>,
    index: number
  ) => {
    if (e.nativeEvent.key === "Backspace" && !pins[index] && index > 0) {
      const newPins = [...pins];
      newPins[index - 1] = "";
      setPins(newPins);
      inputRefs[index - 1]?.current?.focus();
    }
  };

  const extractOtpFromMessage = (message: string) => {
    const otpMatch = message.match(/\d{4}/); // Assuming 4-digit OTP
    return otpMatch ? otpMatch[0] : null;
  };

  const showErrorAlert = (message: string) => {
    setErrorMessage(message);
    setShowError(true);
  };

  const hideErrorAlert = () => {
    setShowError(false);
  };

  const verifyOtp = (otp: string) => {
    setLoading(true);
    fetch(`${theme.baseUrl}/auth/verify-otp`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({ mobile_number: mobile, otp }),
    })
      .then(async (response) => {
        const data = await response.json();
        // console.log("OTP verification response:", data);
        if (data.success) {
          await SecureStore.setItemAsync("authToken", data.token);
          await AsyncStorage.setItem("userData", JSON.stringify(data.user));
          login(data.token, {
            id: data.user.user_id,
            name: data.user.name,
            email: data.user.email,
            mobile: data.user.mobile_number,
            referralCode: data.user.referralCode,
          });

          const storedHashedMPIN = await SecureStore.getItemAsync("user_mpin");
          router.push({
            pathname: storedHashedMPIN ? "/mpin_verify" : "/reset_mpin",
            params: {
              mode: "create",
              from: "login",
            },
          });
          setIsShowOtp(false);
        } else {
          setPins(["", "", "", ""]);
          Alert.alert(
            t("error"),
            data.message || data.error,
            [{ text: t("ok") }]
          );
        }
      })
      .catch((error) => {
        setPins(["", "", "", ""]);
        if (error.response) {
          if (error.response.status === 400) {
            Alert.alert(
              t("invalidOtp"),
              error.response.data.message || t("invalidOtpMessage"),
              [{ text: t("ok") }]
            );
          } else {
            Alert.alert(
              t("error"),
              error.response.data.message || t("somethingWentWrong"),
              [{ text: t("ok") }]
            );
          }
        } else if (error.request) {
          Alert.alert(
            t("networkError"),
            t("checkInternetConnection"),
            [{ text: t("ok") }]
          );
        } else {
          Alert.alert(
            t("error"),
            t("anUnexpectedError"),
            [{ text: t("ok") }]
          );
        }
      })
      .finally(() => setLoading(false));
  };

  const loginAxio = async () => {
    const indianMobilePattern = /^[6-9]\d{9}$/;
    if (!mobile) {
      setMobileError(t("pleaseEnterMobile"));
      return;
    }
    if (!indianMobilePattern.test(mobile)) {
      setMobileError(t("valid10DigitIndianMobile"));
      return;
    }

    setMobileError("");
    setLoading(true);

    try {
      const response = await fetch(`${theme.baseUrl}/auth/check-mobile`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({ mobile_number: mobile }),
      });

      const data = await response.json();

      if (response.ok) {
        // Show OTP screen
        setIsShowOtp(true);
        setTimer(120);
        // Auto-focus first OTP input
        setTimeout(() => inputRefs[0]?.current?.focus(), 100);
      } else {
        throw new Error(data?.error || t("failedToSendOtp"));
      }

      // Start SMS listener for Android
      // if (isAndroid) {
      //   startSmsListener();
      // }
      setLoading(false);
    } catch (error: any) {
      const errorMessage = error.response?.data?.error || error.message || t("youAreNotRegistered");
      if (errorMessage.toLowerCase().includes(t("invalidMobileNumber"))) {
        Alert.alert(
          t("invalidMobile"),
          t("createNewAccountMessage"),
          [
            {
              text: t("cancel"),
              style: "cancel",
              onPress: () => setLoading(false),
            },
            {
              text: t("createAccount"),
                              onPress: () => {
                  // Handle create account navigation
                  try {
                    router.push(`/(auth)/register?mobile=${mobile}`);
                  } catch (error) {
                    console.error('Navigation error:', error);
                  }
                  setLoading(false);
                },
            },
          ]
        );
      } else {
        showErrorAlert(errorMessage);
        setLoading(false);
      }
    }
  };

  const handleResendOtp = async () => {
    if (resendAttempts <= 0) return;

    setLoading(true);
    try {
      const response = await fetch(`${theme.baseUrl}/auth/check-mobile`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({ mobile_number: mobile }),
      });

      const data = await response.json();

      if (response.ok) {
        setResendAttempts((prev) => prev - 1);
        // setTimer(INITIAL_TIMER);
        setPins(["", "", "", ""]);
        Alert.alert(t("success"), t("otpResentSuccess"));
        // Auto-focus first OTP input
        setTimeout(() => inputRefs[0]?.current?.focus(), 100);
      } else {
        throw new Error(data?.error || t("failedToResendOtp"));
      }
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : t("failedToResendOtp");
      showErrorAlert(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleBackButton = () => {
    if (isShowOtp) {
      // If OTP fields are showing, hide them and go back to mobile input
      setIsShowOtp(false);
      setPins(["", "", "", ""]);
      setTimer(120);
      setResendAttempts(0);
      // Stop SMS listener when going back to mobile input
      // stopSmsListener();
    } else {
      // If mobile input is showing, navigate back to previous route
      router.back();
    }
  };

  if (isLoggedIn) return null;

  return (
    <View style={[registerStyles.container, { minHeight: '100%' }]}>
      <ImageBackground
        source={theme.image.bg_image}
        style={[registerStyles.backgroundImage, { minHeight: '100%' }]}
        resizeMode="cover"
      >
        <SafeAreaView style={{ flex: 1, minHeight: '100%' }}>
        <View style={registerStyles.darkOverlay} />
        <LinearGradient
          colors={["rgba(32, 1, 1, 0.55)", "rgba(167, 0, 0, 0)", "rgba(118, 1, 1, 0)"]}
          style={[registerStyles.gradient, { minHeight: '100%' }]}
        >
          <SimpleLanguageSwitcher />
          {showError && (
            <ErrorAlert message={errorMessage} onClose={hideErrorAlert} />
          )}
          <KeyboardAvoidingView
            behavior={Platform.OS === "ios" ? "padding" : "height"}
            style={registerStyles.keyboardAvoidingView}
            keyboardVerticalOffset={Platform.OS === "ios" ? 100 : 50}
          >
            <ScrollView 
              contentContainerStyle={registerStyles.scrollViewContent} 
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
              bounces={false}
              automaticallyAdjustKeyboardInsets={true}
            >
              <View style={[registerStyles.logoContainer, { paddingTop: 10, marginBottom: 0 }]}> 
                <Image
                  source={theme.image.transparentLogo}
                  style={[registerStyles.logo, { width: 220, height: 220 }]}
                  resizeMode="contain"
                />
              </View>

              <ModernAuthCard activeTab="login" onTabChange={(tab) => { 
                try {
                  if(tab==='register'){
                    router.push('/(auth)/register');
                  }
                } catch (error) {
                  console.error('Navigation error:', error);
                }
              }}>
                <Text style={[registerStyles.pageTitle, { color: '#ffffff' }]}>{t("welcomeBack")}</Text>
                <Text style={[registerStyles.subtitle, { color: '#b8c5d6' }]}>{t("signInToContinue")}</Text>
                {!isShowOtp ? (
                  <>
                    <View style={registerStyles.inputContainer}>
                      <PhoneInput
                        value={mobile}
                        onChangeText={text => {
                          setMobile(text);
                          setOtpSent(false);
                          setOtpVerified(false);
                          setOtpValidated(false);
                          setOtp('');
                          setTimer(120);
                          setResendAttempts(3);
                        }}
                        loading={loading || otpVerified}
                      />
                      {mobileError ? (
                        <Text style={registerStyles.errorText}>{mobileError}</Text>
                      ) : null}
                    </View>
                    <TouchableOpacity
                      style={[
                        registerStyles.loginButton,
                        loading && registerStyles.loginButtonDisabled,
                      ]}
                      onPress={loginAxio}
                      disabled={loading}
                    >
                      <LinearGradient
                        colors={["#ffc90c", "#ffd700"]}
                        style={registerStyles.gradientButton}
                      >
                        <Text style={registerStyles.loginButtonText}>
                          {loading ? t("processing") : t("getOtp")}
                        </Text>
                      </LinearGradient>
                    </TouchableOpacity>
                    {/* <View style={registerStyles.registerContainer}>
                      <Text style={registerStyles.registerText}>
                        {t("dontHaveAccount")} {" "}
                      </Text>
                      <TouchableOpacity onPress={() => {
                        try {
                          router.push("/(auth)/register");
                        } catch (error) {
                          console.error('Navigation error:', error);
                        }
                      }}> 
                        <Text style={registerStyles.registerLink}>{t("register")}</Text>
                      </TouchableOpacity>
                    </View> */}
                  </>
                ) : (
                  <View style={registerStyles.otpContainer}>
                    <Text style={[registerStyles.otpTitle, { color: '#ffffff' }]}>{t("enterOTP")}</Text>
                    <Text style={[registerStyles.otpSentText, { color: '#b8c5d6' }]}>
                      {t("otpSentTo")}
                      {mobile.replace(/(\d{3})(\d{3})(\d{4})/, "$1-$2-$3")}
                    </Text>
                    <View style={registerStyles.otpInputsWrapper}>
                      <View style={registerStyles.otpInputsContainer}>
                        {pins.map((pin, index) => (
                          <TextInput
                            key={index}
                            ref={inputRefs[index]}
                            style={[registerStyles.otpInput, { color: '#1a2a39' }]}
                            keyboardType="numeric"
                            maxLength={1}
                            value={pin}
                            onChangeText={(text) => handlePinChange(text, index)}
                            onKeyPress={(e) => handleKeyPress(e, index)}
                            secureTextEntry={!showOtp}
                            textContentType="oneTimeCode"
                            autoComplete="sms-otp"
                            editable={!loading}
                          />
                        ))}
                      </View>
                      <TouchableOpacity
                        onPress={() => setShowOtp((prev) => !prev)}
                        style={registerStyles.eyeButton}
                      >
                        <Feather
                          name={showOtp ? "eye-off" : "eye"}
                          size={24}
                          color={theme.colors.white}
                        />
                      </TouchableOpacity>
                    </View>
                    <View style={registerStyles.timerContainer}>
                      <Ionicons
                        name="time-outline"
                        size={20}
                        color={theme.colors.white}
                      />
                      <Text style={[registerStyles.timerText, { color: '#b8c5d6' }]}>{t("resendIn")} {timer}s</Text>
                    </View>
                    {timer === 0 && resendAttempts < 3 && (
                      <TouchableOpacity
                        onPress={handleResendOtp}
                        style={registerStyles.resendButton}
                      >
                        <Text style={[registerStyles.resendText, { color: '#ffd700' }]}>{t("resendOTP")}</Text>
                      </TouchableOpacity>
                    )}
                    <TouchableOpacity
                      style={[
                        registerStyles.loginButton,
                        (loading || !pins.every((pin) => pin.trim() !== "")) &&
                          registerStyles.loginButtonDisabled,
                      ]}
                      onPress={() => verifyOtp(pins.join(""))}
                      disabled={
                        loading || !pins.every((pin) => pin.trim() !== "")
                      }
                    >
                      <LinearGradient
                        colors={["#ffc90c", "#ffd700"]}
                        style={registerStyles.gradientButton}
                      >
                        <Text style={registerStyles.loginButtonText}>
                          {loading ? t("verifying") : t("submit")}
                        </Text>
                      </LinearGradient>
                    </TouchableOpacity>
                  </View>
                )}
              </ModernAuthCard>
            </ScrollView>
          </KeyboardAvoidingView>
          <View style={registerStyles.poweredByContainer}>
            <Text style={registerStyles.poweredByText}>
              {t("poweredBy")} <Text style={{textDecorationLine: 'underline', color: theme.colors.textLight}} onPress={() => Linking.openURL('https://agnisofterp.com/')}>Agni Soft ERP</Text>
            </Text>
          </View>
        </LinearGradient>
        </SafeAreaView>
      </ImageBackground>
    </View>
  );
}

