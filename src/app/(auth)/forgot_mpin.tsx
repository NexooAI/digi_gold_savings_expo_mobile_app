import React, { useState, useEffect, useRef } from "react";
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
import { theme } from "@/constants/theme";
import { COLORS } from "@/constants/colors";
import { LinearGradient } from "expo-linear-gradient";
import { BlurView } from "expo-blur";
import Icon from "@expo/vector-icons/MaterialIcons";
import { t } from "@/i18n";
import { AppLocale } from "@/i18n";
import apiClient from "@/services/api";
import useGlobalStore from "@/store/global.store";

const { width } = Dimensions.get("window");
const logoWidth = width * 0.3;

// Back to MPIN Button Component
const BackToMpinButton = () => {
  const router = useRouter();
  
  return (
    <TouchableOpacity
      onPress={() => router.push("/(auth)/mpin_verify")}
      style={{
        position: 'absolute',
        top: Platform.OS === 'ios' ? 60 : 40,
        left: 20,
        zIndex: 1000,
        backgroundColor: theme.colors.bgBlackHeavy,
        padding: 12,
        borderRadius: 25,
        flexDirection: 'row',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: theme.colors.borderWhiteMedium,
      }}
    >
      <Icon name="arrow-back" size={20} color={COLORS.white} />
      <Text style={{ color: COLORS.white, fontSize: 14, fontWeight: 'bold', marginLeft: 8 }}>
        {t("backToMpin")}
      </Text>
    </TouchableOpacity>
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
        backgroundColor: theme.colors.bgBlackHeavy,
        padding: 12,
        borderRadius: 25,
        flexDirection: 'row',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: theme.colors.borderWhiteMedium,
      }}
    >
      <Image
                    source={theme.images.translate.malayalam}
        style={{ width: 20, height: 20, marginRight: 8, tintColor: COLORS.white }}
      />
      <Text style={{ color: COLORS.white, fontSize: 14, fontWeight: 'bold' }}>
        {getLanguageDisplayName()}
      </Text>
    </TouchableOpacity>
  );
};

// MPIN Input Component
const MpinInput = ({ 
  length = 4, 
  onComplete, 
  secureTextEntry = true,
  autoFocus = false 
}: {
  length?: number;
  onComplete: (value: string) => void;
  secureTextEntry?: boolean;
  autoFocus?: boolean;
}) => {
  const [values, setValues] = useState(Array(length).fill(""));
  const inputs = useRef<(TextInput | null)[]>([]);

  const handleChange = (text: string, index: number) => {
    const newValues = [...values];
    newValues[index] = text.slice(-1);

    if (text && index < length - 1) {
      inputs.current[index + 1]?.focus();
    }

    if (!text && index > 0) {
      inputs.current[index - 1]?.focus();
    }

    setValues(newValues);
    onComplete(newValues.join(""));
  };

  const handleKeyPress = (
    e: NativeSyntheticEvent<TextInputKeyPressEventData>,
    index: number
  ) => {
    if (e.nativeEvent.key === "Backspace" && !values[index] && index > 0) {
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
            keyboardType="numeric"
            maxLength={1}
            secureTextEntry={secureTextEntry}
            value={value}
            onChangeText={(text) => handleChange(text, index)}
            onKeyPress={(e) => handleKeyPress(e, index)}
            textAlign="center"
            autoFocus={autoFocus && index === 0}
          />
          {value && secureTextEntry && <View style={styles.inputDot} />}
        </View>
      ))}
    </View>
  );
};

export default function ForgotMpin() {
  const [step, setStep] = useState<'verifyOtp' | 'createMpin'>('verifyOtp');
  const [mobileNumber, setMobileNumber] = useState("");
  const [otp, setOtp] = useState("");
  const [newMpin, setNewMpin] = useState("");
  const [confirmMpin, setConfirmMpin] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPin, setShowPin] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [countdown, setCountdown] = useState(0);
  const [initializing, setInitializing] = useState(true);
  const router = useRouter();
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

  // Initialize component and auto-fill mobile number
  useEffect(() => {
    const initializeComponent = async () => {
      try {
        // Get user data from local storage
        const userData = await AsyncStorage.getItem("userData");
        
        if (userData) {
          const parsedUserData = JSON.parse(userData);
          if (parsedUserData.mobile_number) {
            console.log('📱 Auto-filling mobile number:', parsedUserData.mobile_number);
            setMobileNumber(parsedUserData.mobile_number);
            
            // Automatically trigger OTP send immediately
            handleSendOtp(parsedUserData.mobile_number);
          } else {
            console.log('📱 No mobile number found in user data');
            setInitializing(false);
          }
        } else {
          console.log('📱 No user data found');
          setInitializing(false);
        }
      } catch (error) {
        console.error('📱 Error initializing forgot MPIN:', error);
        setInitializing(false);
      }
    };

    initializeComponent();
  }, []);

  // Countdown timer for OTP resend
  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  const validateMobileNumber = (mobile: string) => {
    const mobileRegex = /^[6-9]\d{9}$/;
    return mobileRegex.test(mobile);
  };

  const handleSendOtp = async (mobile?: string) => {
    const numberToUse = mobile || mobileNumber;
    
    if (!validateMobileNumber(numberToUse)) {
      setError(t("invalidMobileNumber"));
      shakeError();
      setInitializing(false);
      return;
    }

    setLoading(true);
    setError("");
    setSuccess("");

    try {
      console.log('📱 Sending OTP to:', numberToUse);
      
      const response = await apiClient.post('/auth/check-mobile', {
        mobile_number: numberToUse
      });

      if (response.data.success) {
        console.log('📱 OTP sent successfully');
        setCountdown(30);
        setInitializing(false);
        setSuccess(t("otpSentSuccessfully"));
        setError("");
      } else {
        console.log('📱 Failed to send OTP:', response.data.message);
        setError(response.data.message || t("failedToSendOtp"));
        shakeError();
        setInitializing(false);
      }
    } catch (error: any) {
      console.error("📱 Error sending OTP:", error);
      
      // Handle specific error cases
      if (error.response?.status === 400) {
        const errorData = error.response.data;
        setError(errorData.message || t("failedToSendOtp"));
      } else if (error.message?.includes('Network request failed')) {
        setError("Network error. Please check your internet connection.");
      } else {
        setError(t("failedToSendOtp"));
      }
      
      shakeError();
      setInitializing(false);
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async () => {
    if (otp.length !== 4) {
      setError(t("pleaseEnterValidOtp"));
      shakeError();
      return;
    }

    setLoading(true);
    setError("");
    setSuccess("");

    try {
      console.log('📱 Verifying OTP for:', mobileNumber);
      
      const response = await apiClient.post('/auth/reset-verify-otp', {
        mobile_number: mobileNumber,
        otp: otp
      });

      if (response.data.success) {
        console.log('📱 OTP verified successfully');
        setStep('createMpin');
        setError("");
        setSuccess("");
      } else {
        console.log('📱 OTP verification failed:', response.data.message);
        setError(response.data.message || t("invalidOtp"));
        shakeError();
      }
    } catch (error: any) {
      console.error("📱 Error verifying OTP:", error);
      
      if (error.response?.status === 400) {
        const errorData = error.response.data;
        setError(errorData.message || t("invalidOtp"));
      } else {
        setError(t("failedToVerifyOtp"));
      }
      
      shakeError();
    } finally {
      setLoading(false);
    }
  };

  // const handleVerifyAndResetMpin = async () => {
  //   if (otp.length !== 4) {
  //     setError(t("pleaseEnterValidOtp"));
  //     shakeError();
  //     return;
  //   }

  //   if (newMpin.length !== 4) {
  //     setError(t("pleaseEnterValidMpin"));
  //     shakeError();
  //     return;
  //   }

  //   if (newMpin !== confirmMpin) {
  //     setError(t("mpinMismatch"));
  //     shakeError();
  //     return;
  //   }

  //   setLoading(true);
  //   setError("");

  //   try {
  //     console.log('📱 Verifying OTP and resetting MPIN for:', mobileNumber);
      
  //     // First verify OTP
  //     const otpResponse = await apiClient.post('/auth/verify-forgot-mpin-otp', {
  //       mobileNumber: mobileNumber,
  //       otp: otp
  //     });

  //     if (!otpResponse.data.success) {
  //       console.log('📱 OTP verification failed:', otpResponse.data.message);
  //       setError(otpResponse.data.message || t("invalidOtp"));
  //       shakeError();
  //       return;
  //     }

  //     console.log('📱 OTP verified successfully, now resetting MPIN');
      
  //     // Then reset MPIN
  //     const resetResponse = await apiClient.post('/auth/reset-mpin', {
  //       mobile: mobileNumber,
  //       newMpin: newMpin
  //     });

  //     if (resetResponse.data.success) {
  //       console.log('📱 MPIN reset successfully');
  //       Alert.alert(
  //         t("success"), 
  //         t("mpinResetSuccess"),
  //         [
  //           {
  //             text: t("ok"),
  //             onPress: () => router.replace("/(auth)/login")
  //           }
  //         ]
  //       );
  //     } else {
  //       console.log('📱 MPIN reset failed:', resetResponse.data.message);
  //       setError(resetResponse.data.message || t("resetFailed"));
  //       shakeError();
  //     }
  //   } catch (error: any) {
  //     console.error("📱 Error in verify and reset process:", error);
      
  //     if (error.response?.status === 400) {
  //       const errorData = error.response.data;
  //       setError(errorData.message || t("resetFailed"));
  //     } else {
  //       setError(t("resetFailed"));
  //     }
      
  //     shakeError();
  //   } finally {
  //     setLoading(false);
  //   }
  // };

  const handleResetMpin = async () => {
    if (newMpin.length !== 4) {
      setError(t("pleaseEnterValidMpin"));
      shakeError();
      return;
    }

    if (newMpin !== confirmMpin) {
      setError(t("mpinMismatch"));
      shakeError();
      return;
    }

    setLoading(true);
    setError("");

    try {
      console.log('📱 Resetting MPIN for:', mobileNumber);
      
      const response = await apiClient.post('/auth/reset-mpin', {
        mobile: mobileNumber,
        newMpin: newMpin
      });
      console.log(response);
      if (response.data.message ==="MPIN reset successfully") {
        console.log('📱 MPIN reset successfully');
        Alert.alert(
          t("success"), 
          t("mpinResetSuccess"),
          [
            {
              text: t("ok"),
              onPress: () => router.replace("/(auth)/mpin_verify")
            }
          ]
        );
      } else {
        console.log('📱 MPIN reset failed:', response.data.message);
        setError(response.data.message || t("resetFailed"));
        shakeError();
      }
    } catch (error: any) {
      console.error("📱 Error resetting MPIN:", error);
      
      if (error.response?.status === 400) {
        const errorData = error.response.data;
        setError(errorData.message || t("resetFailed"));
      } else {
        setError(t("resetFailed"));
      }
      
      shakeError();
    } finally {
      setLoading(false);
    }
  };

  const handleResendOtp = async () => {
    if (countdown > 0) return;
    
    setLoading(true);
    setError("");
    setSuccess("");
    try {
      console.log('📱 Resending OTP to:', mobileNumber);
      
      const response = await apiClient.post('/auth/check-mobile', {
        mobile_number: mobileNumber
      });

      if (response.data.success) {
        console.log('📱 OTP resent successfully');
        setCountdown(30);
        setSuccess(t("otpResentSuccessfully"));
        setError("");
      } else {
        console.log('📱 Failed to resend OTP:', response.data.message);
        setError(response.data.message || t("failedToResendOtp"));
        shakeError();
      }
    } catch (error: any) {
      console.error("📱 Error resending OTP:", error);
      
      if (error.response?.status === 400) {
        const errorData = error.response.data;
        setError(errorData.message || t("failedToResendOtp"));
      } else {
        setError(t("failedToResendOtp"));
      }
      
      shakeError();
    } finally {
      setLoading(false);
    }
  };

  // Show loading screen while initializing
  if (initializing) {
    return (
      <ImageBackground
        source={theme.images.auth.loginBg}
        style={styles.backgroundImage}
      >
        <LinearGradient
          colors={[theme.colors.transparent, theme.colors.transparent, theme.colors.bgPrimaryLight]}
          style={styles.gradient}
        >
          <View style={styles.container}>
            <View style={styles.logoContainer}>
              <Image
                source={theme.images.auth.logo}
                style={[styles.logo, { width: logoWidth }]}
                resizeMode="contain"
              />
            </View>
            <View style={styles.loadingContainer}>
              <Text style={styles.loadingText}>{t("loading")}</Text>
            </View>
          </View>
        </LinearGradient>
      </ImageBackground>
    );
  }



  const renderVerifyOtpStep = () => (
    <View style={styles.stepContainer}>
      <Text style={styles.stepTitle}>{t("verifyOtpTitle")}</Text>
      <Text style={styles.stepSubtitle}>
        {t("otpSentTo")} {mobileNumber}
      </Text>
      
      <Animated.View style={[styles.inputContainer, { transform: [{ translateX: shakeAnim }] }]}>
        <Text style={styles.inputLabel}>{t("enterOtp")}</Text>
        <MpinInput
          length={4}
          onComplete={setOtp}
          secureTextEntry={false}
          autoFocus={true}
        />
      </Animated.View>

      {error ? (
        <View style={styles.errorContainer}>
          <Icon name="error" size={16} color={COLORS.errorLight} />
          <Text style={styles.errorText}>{error}</Text>
        </View>
      ) : null}

      {success ? (
        <View style={styles.successContainer}>
          <Icon name="check-circle" size={16} color={COLORS.success} />
          <Text style={styles.successText}>{success}</Text>
        </View>
      ) : null}

      <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
        <TouchableOpacity
          style={[styles.actionButton, loading && styles.actionButtonDisabled]}
          onPress={() => {
            animatePress();
            handleVerifyOtp();
          }}
          disabled={loading || otp.length !== 4}
        >
          <LinearGradient
            colors={[COLORS.secondary, COLORS.gold]}
            style={styles.buttonGradient}
          >
            <Text style={styles.actionButtonText}>
              {loading ? t("verifying") : t("verifyOtp")}
            </Text>
          </LinearGradient>
        </TouchableOpacity>
      </Animated.View>

      <TouchableOpacity
        style={[styles.resendButton, countdown > 0 && styles.resendButtonDisabled]}
        onPress={handleResendOtp}
        disabled={countdown > 0}
      >
        <Text style={styles.resendText}>
          {countdown > 0 
            ? `${t("resendOtpIn")} ${countdown}s` 
            : t("resendOtp")
          }
        </Text>
      </TouchableOpacity>
    </View>
  );

  const renderCreateMpinStep = () => (
    <View style={styles.stepContainer}>
      <Text style={styles.stepTitle}>{t("createNewMpinTitle")}</Text>
      <Text style={styles.stepSubtitle}>{t("createNewMpinSubtitle")}</Text>
      
      <Animated.View style={[styles.inputContainer, { transform: [{ translateX: shakeAnim }] }]}>
        <Text style={styles.inputLabel}>{t("newMpin")}</Text>
        <MpinInput
          length={4}
          onComplete={setNewMpin}
          secureTextEntry={!showPin}
          autoFocus={true}
        />
      </Animated.View>

      <Animated.View style={[styles.inputContainer, { transform: [{ translateX: shakeAnim }] }]}>
        <Text style={styles.inputLabel}>{t("confirmMpin")}</Text>
        <MpinInput
          length={4}
          onComplete={setConfirmMpin}
          secureTextEntry={!showPin}
        />
      </Animated.View>

      <TouchableOpacity
        style={styles.eyeToggle}
        onPress={() => setShowPin(!showPin)}
      >
        <Icon
          name={showPin ? "visibility-off" : "visibility"}
          size={20}
          color={theme.colors.secondary}
        />
        <Text style={styles.eyeText}>
          {showPin ? t("hideMpin") : t("showMpin")}
        </Text>
      </TouchableOpacity>

      {error ? (
        <View style={styles.errorContainer}>
          <Icon name="error" size={16} color={COLORS.greenLight} />
          <Text style={styles.errorText}>{error}</Text>
        </View>
      ) : null}

      {success ? (
        <View style={styles.successContainer}>
          <Icon name="check-circle" size={16} color={COLORS.success} />
          <Text style={styles.successText}>{success}</Text>
        </View>
      ) : null}

      <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
        <TouchableOpacity
          style={[styles.actionButton, loading && styles.actionButtonDisabled]}
          onPress={() => {
            animatePress();
            handleResetMpin();
          }}
          disabled={loading || newMpin.length !== 4 || confirmMpin.length !== 4 || newMpin !== confirmMpin}
        >
          <LinearGradient
            colors={[COLORS.secondary, COLORS.gold]}
            style={styles.buttonGradient}
          >
            <Text style={styles.actionButtonText}>
              {loading ? t("resetting") : t("resetMpin")}
            </Text>
          </LinearGradient>
        </TouchableOpacity>
      </Animated.View>
    </View>
  );



  return (
    <ImageBackground
      source={theme.images.auth.loginBg}
      style={styles.backgroundImage}
    >
      <LinearGradient
        colors={[theme.colors.transparent, theme.colors.transparent, theme.colors.bgPrimaryLight]}
        style={styles.gradient}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={styles.container}
        >
          <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
            <View style={styles.container}>
              <BackToMpinButton />
              <View style={styles.logoContainer}>
                <Image
                  source={theme.images.auth.logo}
                  style={[styles.logo, { width: logoWidth }]}
                  resizeMode="contain"
                />
              </View>

                               <View style={styles.formContainer}>
                   <View style={styles.cardContainer}>
                     {/* Base fog layer */}
                     <LinearGradient
                       colors={[
                         theme.colors.bgPrimaryHeavy,
                         theme.colors.bgPrimaryLight,
                         theme.colors.bgPrimaryMedium,
                       ]}
                       style={StyleSheet.absoluteFill}
                     />
                     {/* Top fog highlight */}
                     <LinearGradient
                       colors={[
                         theme.colors.bgPrimaryLight,
                         theme.colors.text.mediumGrey,
                       ]}
                       start={{ x: 0, y: 0 }}
                       end={{ x: 0, y: 0.5 }}
                       style={StyleSheet.absoluteFill}
                     />
                     {/* Bottom fog highlight */}
                     <LinearGradient
                       colors={[
                         theme.colors.bgBlackMedium,
                         theme.colors.bgBlackLight,
                       ]}
                       start={{ x: 0, y: 0.5 }}
                       end={{ x: 0, y: 1 }}
                       style={StyleSheet.absoluteFill}
                     />
                     {/* Content */}
                     <View style={styles.cardContent}>
                       {step === 'verifyOtp' && renderVerifyOtpStep()}
                       {step === 'createMpin' && renderCreateMpinStep()}
                     </View>
                   </View>
                 </View>
            </View>
          </TouchableWithoutFeedback>
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
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
    marginBottom: 20,
  },
  logo: {
    aspectRatio: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    color: COLORS.white,
    fontSize: 18,
    fontWeight: "600",
    textAlign: "center",
  },
  scrollContainer: {
    flex: 1,
    justifyContent: "center",
  },
  formContainer: {
    flex: 1,
    justifyContent: "center",
    paddingHorizontal: 20,
    paddingVertical: 20,
  },
  cardContainer: {
    borderRadius: 20,
    padding: 20,
    width: "100%",
    borderWidth: 1,
    borderColor: theme.colors.borderWhiteMedium,
    marginBottom: Platform.OS === "ios" ? 20 : 10,
    overflow: "hidden",
    ...Platform.select({
      ios: {
        shadowColor: COLORS.black,
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.3,
        shadowRadius: 12,
        backdropFilter: "blur(20px)",
      },
      android: {
        elevation: 12,
        shadowColor: COLORS.black,
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
  stepContainer: {
    width: "100%",
  },
  stepTitle: {
    color: COLORS.white,
    fontSize: 28,
    fontWeight: "bold",
    marginBottom: 10,
    textAlign: "center",
  },
  stepSubtitle: {
    color: COLORS.white,
    fontSize: 16,
    marginBottom: 30,
    textAlign: "center",
    opacity: 0.8,
  },
  inputContainer: {
    marginBottom: 20,
  },
  inputLabel: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 10,
  },
  textInput: {
    backgroundColor: theme.colors.bgWhiteLight,
    borderWidth: 1,
    borderColor: theme.colors.borderWhiteMedium,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: COLORS.white,
  },
  mpinContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: "100%",
  },
  inputWrapper: {
    position: "relative",
    width: 45,
    height: 50,
  },
  mpinInput: {
    width: "100%",
    height: "100%",
    borderWidth: 1,
    borderRadius: 12,
    textAlign: "center",
    fontSize: 24,
    color: COLORS.black,
    backgroundColor: COLORS.white,
  },
  mpinInputEmpty: {
    borderColor: theme.colors.errorLight,
    backgroundColor: COLORS.white,
    color: COLORS.black,
  },
  mpinInputFilled: {
    borderColor: theme.colors.secondary,
    backgroundColor: COLORS.white,
    color: COLORS.black,
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
  actionButton: {
    width: "100%",
    height: 50,
    borderRadius: 25,
    overflow: "hidden",
    marginTop: 20,
    ...Platform.select({
      ios: {
        shadowColor: COLORS.black,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
      },
      android: {
        elevation: 8,
      },
    }),
  },
  actionButtonDisabled: {
    opacity: 0.6,
  },
  buttonGradient: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  actionButtonText: {
    color: theme.colors.textDark,
    fontSize: 18,
    fontWeight: "bold",
  },
  eyeToggle: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 15,
  },
  eyeText: {
    color: theme.colors.secondary,
    marginLeft: 8,
    fontSize: 16,
    fontWeight: "600",
  },
  resendButton: {
    alignItems: "center",
    marginTop: 20,
  },
  resendButtonDisabled: {
    opacity: 0.5,
  },
  resendText: {
    color: theme.colors.secondary,
    fontSize: 16,
    fontWeight: "600",
  },
  errorContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: theme.colors.bgErrorLight,
    padding: 12,
    borderRadius: 8,
    marginBottom: 15,
  },
  errorText: {
    color: COLORS.green,
    fontSize: 14,
    marginLeft: 8,
    flex: 1,
  },
  successContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: theme.colors.bgSuccessLight,
    padding: 12,
    borderRadius: 8,
    marginBottom: 15,
  },
  successText: {
    color: COLORS.success,
    fontSize: 14,
    marginLeft: 8,
    flex: 1,
  },
  mpinSection: {
    marginTop: 20,
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: theme.colors.borderWhiteLight,
  },
  sectionTitle: {
    color: COLORS.white,
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 15,
    textAlign: "center",
  },

}); 