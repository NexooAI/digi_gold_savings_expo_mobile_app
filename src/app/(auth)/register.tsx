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
  Linking,
  ScrollView,
  SafeAreaView,
  Modal,
  Pressable,
  ActivityIndicator,
} from "react-native";
import { useFocusEffect, useRouter, useLocalSearchParams } from "expo-router";
import PhoneInput from "../components/PhoneInputs";
import { theme } from "@/constants/theme";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons, Feather } from "@expo/vector-icons";
import * as SecureStore from "expo-secure-store";
import { API_BASE_URL } from "@/config/api";
import { registerStyles } from "../../_styles/registerStyles";
import { t } from "@/i18n";
import LanguageSwitcher from "@/contexts/LanguageSwitcher";
import { AppLocale } from "@/i18n";
import useGlobalStore from "@/store/global.store";
import ModernAuthCard from '../components/ModernAuthCard';
import FloatingLabelInput from '../components/FloatingLabelInput';
import api from "@/services/api";

const OTP_RESEND_LIMIT = 3;
const INITIAL_TIMER = 180;

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

// Error Alert Component (matching login)
const ErrorAlert = ({
  message,
  onClose,
}: {
  message: string;
  onClose: () => void;
}) => (
  <View style={registerStyles.errorAlert}>
    <View style={registerStyles.errorContent}>
      <Ionicons name="alert-circle" size={24} color="#fff" />
      <Text style={registerStyles.errorMessage}>{message}</Text>
    </View>
    <TouchableOpacity onPress={onClose} style={registerStyles.closeButton}>
      <Ionicons name="close" size={24} color="#fff" />
    </TouchableOpacity>
  </View>
);

export default function Register() {
  const [step, setStep] = useState(1); // 1 = initial, 2 = OTP, 3 = post-OTP
  const [mobile, setMobile] = useState('');
  const [otp, setOtp] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [otpVerified, setOtpVerified] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [referral, setReferral] = useState('');
  const [loading, setLoading] = useState(false);
  const [pins, setPins] = useState(["", "", "", ""]);
  const [timer, setTimer] = useState(INITIAL_TIMER);
  const [resendCount, setResendCount] = useState(OTP_RESEND_LIMIT);
  const [showOtp, setShowOtp] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [showError, setShowError] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const router = useRouter();
  const params = useLocalSearchParams();
  const { language } = useGlobalStore();
  const inputRefs = [
    useRef<TextInput>(null),
    useRef<TextInput>(null),
    useRef<TextInput>(null),
    useRef<TextInput>(null),
  ];
  const [otpModalVisible, setOtpModalVisible] = useState(false);
  const [otpValidated, setOtpValidated] = useState(false);
  const [emailError, setEmailError] = useState('');

  // Add useEffect to handle pre-filled mobile number
  useEffect(() => {
    if (params.mobile) {
      setMobile(params.mobile as string);
    }
  }, [params]);

  const startTimer = () => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    setTimer(INITIAL_TIMER);
    intervalRef.current = setInterval(() => {
      setTimer((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
  };

  const showErrorAlert = (message: string) => {
    setErrorMessage(message);
    setShowError(true);
  };

  const hideErrorAlert = () => {
    setShowError(false);
  };

  const handleGetOtp = async () => {
    const indianMobilePattern = /^[6-9]\d{9}$/;

    if (!mobile || !indianMobilePattern.test(mobile)) {
      showErrorAlert(t("pleaseEnterValidIndianMobile"));
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`${theme.baseUrl}/register/mobile`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ mobile_number: mobile }),
      });

      const data = await response.json();

      if (response.ok) {
        setOtpSent(true);
        setOtpModalVisible(true);
        setOtpVerified(false);
        setOtpValidated(false);
        setStep(2);
        startTimer();
        Alert.alert(t("success"), t("otpResentSuccessfully"));
      } else {
        throw new Error(data?.error || t("failedToSendOtp"));
      }
    } catch (error: any) {
      let message = t("anErrorOccurred");
      if (error.response?.data?.message) {
        message = error.response.data.message;
      } else if (error.message) {
        message = error.message;
      }
      if (message.toLowerCase().includes(t("alreadyRegistered"))) {
        Alert.alert(t("accountExists"), t("accountExistsMessage"), [
          { text: t("ok"), onPress: () => router.push("/login") },
        ]);
      } else {
        Alert.alert(t("registrationFailed"), message);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleResendOtp = async () => {
    if (resendCount <= 0 || timer > 0) return;

    setLoading(true);
    try {
      const response = await fetch(`${theme.baseUrl}/register/mobile`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ mobile_number: mobile }),
      });

      if (response.ok) {
        setResendCount((prev) => prev - 1);
        setTimer(INITIAL_TIMER);
        setPins(["", "", "", ""]);
        Alert.alert(t("success"), t("otpResentSuccessfully"));
      } else {
        const data = await response.json();
        throw new Error(data?.error || t("failedToResendOtp"));
      }
    } catch (error: any) {
      let message = t("anErrorOccurred");
      if (error.response?.data?.message) {
        message = error.response.data.message;
      } else if (error.message) {
        message = error.message;
      }
      Alert.alert(t("resendOtpFailed"), message);
    } finally {
      setLoading(false);
    }
  };

  const handlePinChange = (text: string, index: number) => {
    const newPins = [...pins];
    newPins[index] = text;
    setPins(newPins);

    if (text.length === 1 && index < 3) {
      inputRefs[index + 1].current?.focus();
    }
  };

  const handleKeyPress = ({ nativeEvent }: any, index: number) => {
    if (nativeEvent.key === "Backspace" && pins[index] === "" && index > 0) {
      inputRefs[index - 1].current?.focus();
      const newPins = [...pins];
      newPins[index - 1] = "";
      setPins(newPins);
    }
  };

  const handleVerifyOtp = async () => {
    if (otp.length !== 4) {
      showErrorAlert(t("pleaseEnterCompleteOtp"));
      return;
    }
    setLoading(true);
    try {
      console.log('Verifying OTP for:', mobile, 'OTP:', otp);
      const response = await fetch(`${theme.baseUrl}/register/verify-otp`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ mobile_number: mobile, otp }),
      });
      const data = await response.json();
      if (response.ok && data.message && data.message.toLowerCase().includes('otp verified successfully')) {
        setOtpModalVisible(false);
        setOtpValidated(true);
        setOtpVerified(true);
        setStep(3);
        setOtp("");
      } else {
        Alert.alert(
          t("error"),
          data?.message || t("failedToVerifyOtp")
        );
      }
    } catch (error: any) {
      Alert.alert(
        t("error"),
        error.response?.data?.message || t("failedToVerifyOtp")
      );
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async () => {
    setLoading(true);
    try {
      const response = await api.post("/register/complete", {
        name,
        email,
        mobile_number: mobile,
        mpin: '1234',
        password: 1234,
        referral_code: referral.trim(),
      });
      if (response.status === 200) {
        Alert.alert('Success', 'Registration complete!');
        router.replace({ pathname: "/(auth)/login", params: { mobile } });
      } else {
        Alert.alert('Error', response.data.message || 'Registration failed');
      }
    } catch (error: any) {
      Alert.alert('Error', error.response?.data?.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    React.useCallback(() => {
      return () => {
        setMobile("");
        setOtpVerified(false);
        setLoading(false);
        setTimer(INITIAL_TIMER);
        setResendCount(OTP_RESEND_LIMIT);
        if (intervalRef.current) clearInterval(intervalRef.current);
      };
    }, [])
  );

  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    if (otpSent && !otpVerified && timer > 0) {
      interval = setInterval(() => {
        setTimer(prev => (prev > 0 ? prev - 1 : 0));
      }, 1000);
    }
    return () => { if (interval) clearInterval(interval); };
  }, [otpSent, otpVerified, timer]);

  useEffect(() => {
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  useEffect(() => {
    if (!otpModalVisible && otpSent && !otpValidated) {
      // Modal closed but OTP not validated
      showErrorAlert(t('otpNotValidated'));
    }
  }, [otpModalVisible]);

  const handleBackButton = () => {
    if (otpVerified) {
      // If OTP fields are showing, hide them and go back to mobile input
      setOtpVerified(false);
      setPins(["", "", "", ""]);
      setTimer(INITIAL_TIMER);
      setResendCount(OTP_RESEND_LIMIT);
      if (intervalRef.current) clearInterval(intervalRef.current);
    } else {
      // If mobile input is showing, navigate back to previous route
      router.back();
    }
  };

  const validateEmail = (email: string) => {
    return /^[\w-.]+@[\w-]+\.[a-zA-Z]{2,}$/.test(email);
  };

  return (
    <SafeAreaView style={registerStyles.container}>
      <ImageBackground
        source={theme.image.bg_image}
        style={registerStyles.backgroundImage}
      >
        <View style={registerStyles.darkOverlay} />
        <LinearGradient
          colors={["rgba(32, 1, 1, 0.55)", "rgba(167, 0, 0, 0)", "rgba(118, 1, 1, 0)"]}
          style={registerStyles.gradient}
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
                  style={[registerStyles.logo, { width: 220, height: 140 }]}
                  resizeMode="contain"
                />
              </View>
              <ModernAuthCard activeTab="register" onTabChange={(tab) => { if(tab==='login'){router.push('/login')} }}>
                <View style={registerStyles.formFieldsContainer}>
                  <Text style={[registerStyles.pageTitle, { color: '#ffffff' }]}>{t("register")}</Text>
                  <Text style={[registerStyles.subtitle, { color: '#b8c5d6' }]}>{t("registerSubtitle")}</Text>
                  {/* Mobile Number + Get OTP Button */}
                  <View style={{ marginBottom: 16, width: '100%' }}>
                    <PhoneInput
                      value={mobile}
                      onChangeText={text => {
                        setMobile(text);
                        setOtpSent(false);
                        setOtpVerified(false);
                        setOtpValidated(false);
                        setOtp('');
                        setTimer(INITIAL_TIMER);
                        setResendCount(OTP_RESEND_LIMIT);
                      }}
                      loading={loading || otpVerified}
                    />
                    {otpVerified && (
                      <Ionicons name="checkmark-circle" size={24} color="green" style={{ marginLeft: 8 }} />
                    )}
                    {!otpSent && !otpVerified && (
                      <View style={{ alignItems: 'flex-end', marginTop: -16 }}>
                        <TouchableOpacity
                          onPress={handleGetOtp}
                          style={{
                            backgroundColor: '#ffd700',
                            borderRadius: 16,
                            paddingVertical: 8,
                            paddingHorizontal: 16,
                            elevation: 2,
                            shadowColor: '#000',
                            shadowOffset: { width: 0, height: 1 },
                            shadowOpacity: 0.12,
                            shadowRadius: 2,
                            flexDirection: 'row',
                            alignItems: 'center',
                          }}
                          disabled={loading || otpSent || otpVerified || !/^[6-9]\d{9}$/.test(mobile)}
                        >
                          {loading && <ActivityIndicator size="small" color="#1a2a39" style={{ marginRight: 6 }} />}
                          <Text style={{ color: '#1a2a39', fontWeight: 'bold', fontSize: 13 }}>{t('getOtp')}</Text>
                        </TouchableOpacity>
                      </View>
                    )}
                  </View>
                  {/* OTP Input and Verify OTP Button */}
                  {otpSent && !otpVerified && (
                    <>
                      <Modal
                        visible={otpModalVisible}
                        transparent
                        animationType="fade"
                        onRequestClose={() => {}}
                      >
                        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'center', alignItems: 'center' }}>
                          <View style={{ width: '90%', backgroundColor: '#fff', borderRadius: 16, padding: 24, alignSelf: 'center', elevation: 10 }}>
                            <Text style={{ fontSize: 18, fontWeight: 'bold', marginBottom: 12, color: '#1a2a39', textAlign: 'center' }}>{t('enterOtp')}</Text>
                            <Text style={{ fontSize: 16, color: '#666', textAlign: 'center', marginBottom: 8 }}>{mobile}</Text>
                            <TextInput
                              value={otp}
                              onChangeText={setOtp}
                              placeholder={t('enterOtp')}
                              keyboardType="number-pad"
                              style={{ borderWidth: 1, borderColor: '#ccc', borderRadius: 8, padding: 12, fontSize: 18, marginBottom: 16, color: '#1a2a39' }}
                              maxLength={4}
                            />
                           
                            <TouchableOpacity
                              onPress={handleVerifyOtp}
                              style={{ backgroundColor: '#ffd700', borderRadius: 8, paddingVertical: 12, alignItems: 'center', marginBottom: 8 }}
                              disabled={otp.length < 4}
                            >
                              <Text style={{ color: '#1a2a39', fontWeight: 'bold', fontSize: 16 }}>{t('verifyOtp')}</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                              onPress={() => {
                                setOtpModalVisible(false);
                                setOtp("");
                                setOtpSent(false);
                              }}
                              style={{ alignItems: 'center', marginTop: 4 }}
                            >
                              <Text style={{ color: '#ff4444', fontWeight: 'bold', fontSize: 15 }}>{t('cancel')}</Text>
                            </TouchableOpacity>
                            <View style={{ alignItems: 'center', marginTop: 10 }}>
                              <Text style={{ color: '#b8c5d6', fontSize: 14 }}>{t('resendOTP')} {timer}s</Text>
                              <TouchableOpacity
                                onPress={handleResendOtp}
                                disabled={timer > 0 || resendCount <= 0}
                                style={{ marginTop: 8, opacity: timer > 0 || resendCount <= 0 ? 0.5 : 1 }}
                              >
                                <Text style={{ color: '#ffd700', fontWeight: 'bold', fontSize: 15 }}>{t('resendOTP')}</Text>
                              </TouchableOpacity>
                            </View>
                          </View>
                        </View>
                      </Modal>
                    </>
                  )}
                  {/* Name */}
                  <FloatingLabelInput
                    label="Name"
                    value={name}
                    onChangeText={setName}
                    style={{ marginBottom: 12 }}
                    returnKeyType="next"
                  />
                  {/* Email */}
                  <FloatingLabelInput
                    label="Email"
                    value={email}
                    onChangeText={text => {
                      setEmail(text);
                      if (text.length === 0 || validateEmail(text)) {
                        setEmailError('');
                      } else {
                        setEmailError('Please enter a valid email address');
                      }
                    }}
                    keyboardType="email-address"
                    style={{ marginBottom: 12 }}
                    returnKeyType="next"
                  />
                  {emailError ? (
                    <Text style={{ color: 'red', marginBottom: 8, marginLeft: 4, fontSize: 13 }}>{emailError}</Text>
                  ) : null}
                  {/* Referral Code */}
                  <FloatingLabelInput
                    label="Referral Code"
                    value={referral}
                    onChangeText={text => {
                      const filtered = text.replace(/[^a-zA-Z0-9]/g, '').slice(0, 6).toUpperCase();
                      setReferral(filtered);
                    }}
                    maxLength={6}
                    style={{ marginBottom: 24 }}
                    returnKeyType="done"
                  />
                  {/* Submit Button */}
                  <TouchableOpacity
                    onPress={handleRegister}
                    style={[registerStyles.loginButton, { height: 48, borderRadius: 24, marginTop: 0 }]}
                    disabled={!otpVerified || !name || !email || !!emailError || loading}
                  >
                    <LinearGradient
                      colors={["#ffc90c", "#ffd700"]}
                      style={[registerStyles.gradientButton, { borderRadius: 24, height: 48 }]}
                    >
                      <Text style={[registerStyles.loginButtonText, { fontSize: 18 }]}>{t("submit")}</Text>
                    </LinearGradient>
                  </TouchableOpacity>
                </View>
              </ModernAuthCard>
            </ScrollView>
          </KeyboardAvoidingView>
          <View style={registerStyles.poweredByContainer}>
            <Text style={registerStyles.poweredByText}>
              {t("poweredBy")} <Text style={{textDecorationLine: 'underline', color: theme.colors.textLight}} onPress={() => Linking.openURL('https://agnisofterp.com/')}>Agni Soft ERP</Text>
            </Text>
          </View>
        </LinearGradient>
      </ImageBackground>
    </SafeAreaView>
  );
}
