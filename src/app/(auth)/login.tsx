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
  Modal,
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
// import { useAuth } from "@/contexts/AuthContext";
import LanguageSwitcher from "@/contexts/LanguageSwitcher";
import { AppLocale } from "@/i18n";

const { width } = Dimensions.get("window");
const logoWidth = width * 0.3;

// Debug Modal Component
const DebugModal = ({
  visible,
  onClose,
  storageData,
  onRefreshToken,
  isRefreshing,
}: {
  visible: boolean;
  onClose: () => void;
  storageData: { [key: string]: any };
  onRefreshToken: () => void;
  isRefreshing: boolean;
}) => {
  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.debugModalOverlay}>
        <View style={styles.debugModalContainer}>
          <View style={styles.debugModalHeader}>
            <Text style={styles.debugModalTitle}>🔍 Debug - Local Storage</Text>
            <TouchableOpacity onPress={onClose} style={styles.debugCloseButton}>
              <Ionicons name="close" size={24} color="#333" />
            </TouchableOpacity>
          </View>
          
          {/* Action Buttons */}
          <View style={styles.debugActionButtons}>
            <TouchableOpacity
              onPress={onRefreshToken}
              disabled={isRefreshing}
              style={[
                styles.debugActionButton,
                isRefreshing && styles.debugActionButtonDisabled
              ]}
            >
              <Ionicons 
                name={isRefreshing ? "refresh" : "refresh-outline"} 
                size={16} 
                color={isRefreshing ? "#999" : "#007AFF"} 
              />
              <Text style={[
                styles.debugActionButtonText,
                isRefreshing && styles.debugActionButtonTextDisabled
              ]}>
                {isRefreshing ? "Refreshing..." : "Refresh Token"}
              </Text>
            </TouchableOpacity>
          </View>
          
          <ScrollView style={styles.debugModalContent}>
            {Object.keys(storageData).length === 0 ? (
              <Text style={styles.debugEmptyText}>No storage data found</Text>
            ) : (
              Object.entries(storageData).map(([key, value]) => (
                <View key={key} style={styles.debugItemContainer}>
                  <Text style={styles.debugItemKey}>{key}:</Text>
                  <Text style={styles.debugItemValue}>
                    {typeof value === 'object' ? JSON.stringify(value, null, 2) : String(value)}
                  </Text>
                </View>
              ))
            )}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

// Custom Modal Component for Invalid Mobile Number
const InvalidMobileModal = ({
  visible,
  onClose,
  onCreateAccount,
  mobileNumber,
}: {
  visible: boolean;
  onClose: () => void;
  onCreateAccount: () => void;
  mobileNumber: string;
}) => {
  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <View style={styles.modalIconContainer}>
              <Ionicons name="alert-circle" size={32} color="#ff6b35" />
            </View>
            <Text style={styles.modalTitle}>{t("invalidMobile")}</Text>
            <Text style={styles.modalSubtitle}>{mobileNumber}</Text>
          </View>

          <View style={styles.modalContent}>
            <Text style={styles.modalMessage}>
              {t("createNewAccountMessage")}
            </Text>

            <View style={styles.modalDetails}>
              <View style={styles.detailRow}>
                <Ionicons name="information-circle" size={16} color="#666" />
                <Text style={styles.detailText}>
                  {t("invalidMobileDetail1")}
                </Text>
              </View>
              <View style={styles.detailRow}>
                <Ionicons name="checkmark-circle" size={16} color="#4CAF50" />
                <Text style={styles.detailText}>
                  {t("invalidMobileDetail2")}
                </Text>
              </View>
              <View style={styles.detailRow}>
                <Ionicons name="star" size={16} color="#FFD700" />
                <Text style={styles.detailText}>
                  {t("invalidMobileDetail3")}
                </Text>
              </View>
            </View>
          </View>

          <View style={styles.modalButtonContainer}>
            <TouchableOpacity
              style={[styles.modalButton, styles.cancelButton]}
              onPress={onClose}
            >
              <Text style={styles.cancelButtonText}>{t("cancel")}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.modalButton, styles.createButton]}
              onPress={onCreateAccount}
            >
              <Text style={styles.createButtonText}>{t("createAccount")}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

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
        newLang = 'mal';
        break;
      case 'mal':
        newLang = 'en';
        break;
      // case 'ta':
      //   newLang = 'en';
      //   break;
      default:
        newLang = 'en';
    }
    setLanguage(newLang);
  };

  const getLanguageDisplayName = () => {
    switch (language) {
      case 'en':
        return 'മലയാളം';
      // case 'mal':
      //   return 'தமிழ்';
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

  // Refs for OTP inputs
  const inputRefs = [
    useRef<TextInput>(null),
    useRef<TextInput>(null),
    useRef<TextInput>(null),
    useRef<TextInput>(null),
  ];

  // Modal state
  const [showInvalidMobileModal, setShowInvalidMobileModal] = useState(false);
  const [showDebugModal, setShowDebugModal] = useState(false);
  const [debugStorageData, setDebugStorageData] = useState<{ [key: string]: any }>({});
  const [isRefreshingToken, setIsRefreshingToken] = useState(false);

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
  // const verifyOtp = (otp: string) => {
  //     setLoading(true);
  //     fetch(`${theme.baseUrl}/auth/verify-otp`, {
  //       method: "POST",
  //       headers: {
  //         "Content-Type": "application/json",
  //         Accept: "application/json",
  //       },
  //       body: JSON.stringify({ mobile_number: mobile, otp }),
  //     })
  //       .then(async (response) => {
  //         const data = await response.json();
  //         // console.log("OTP verification response:", data);
  //         if (data.success) {
  //           // Store all tokens securely like in registration flow
  //           // await SecureStore.setItemAsync("authToken", data.token);
  //           // await SecureStore.setItemAsync("accessToken", data.accessToken);
  //           // await SecureStore.setItemAsync("token", data.token);
  //           // await SecureStore.setItemAsync("refreshToken", data.refreshtoken);
  //           // await AsyncStorage.setItem("userData", JSON.stringify(data.user));

  //           login(data.token, {
  //             id: data.user.user_id,
  //             name: data.user.name,
  //             email: data.user.email,
  //             mobile: data.user.mobile_number,
  //             referralCode: data.user.referralCode,
  //           });

  //           // Navigate to MPIN verification after successful OTP verification
  //           router.replace("/(auth)/mpin_verify");
  //           setIsShowOtp(false);
  //         } else {
  //           setPins(["", "", "", ""]);
  //           // Alert.alert(
  //           //   t("error"),
  //           //   data.message || data.error,
  //           //   [{ text: t("ok") }]
  //           // );
  //         }
  //       })
  //       .catch((error) => {
  //         setPins(["", "", "", ""]);
  //         if (error.response) {
  //           if (error.response.status === 400) {
  //             Alert.alert(
  //               t("invalidOtp"),
  //               error.response.data.message || t("invalidOtpMessage"),
  //               [{ text: t("ok") }]
  //             );
  //           } 
  //           // else {
  //           //   Alert.alert(
  //           //     t("error"),
  //           //     error.response.data.message || t("somethingWentWrong"),
  //           //     [{ text: t("ok") }]
  //           //   );
  //           // }
  //         } else if (error.request) {
  //           Alert.alert(
  //             t("networkError"),
  //             t("checkInternetConnection"),
  //             [{ text: t("ok") }]
  //           );
  //         } else {
  //           Alert.alert(
  //             t("error"),
  //             t("anUnexpectedError"),
  //             [{ text: t("ok") }]
  //           );
  //         }
  //       })
  //       .finally(() => setLoading(false));
  //   };
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
        console.log("OTP verification response:", data);
        if (data.success) {
          try {
            // Store all tokens securely
            await SecureStore.setItemAsync("authToken", data.token);
            await SecureStore.setItemAsync("accessToken", data.accessToken);
            await SecureStore.setItemAsync("token", data.token);
            await SecureStore.setItemAsync("refreshToken", data.refreshtoken);
            await AsyncStorage.setItem("userData", JSON.stringify(data.user));

            // Login to global store
            console.log('🔍 Setting user data in global store:', {
              id: data.user.user_id,
              name: data.user.name,
              email: data.user.email,
              mobile: data.user.mobile_number,
              referralCode: data.user.referralCode,
              profile_photo: data.user.profile_photo,
              mpinStatus: data.user.mpinStatus,
              usertype: data.user.userType,
            });
            login(data.token, {
              id: data.user.user_id,
              name: data.user.name,
              email: data.user.email,
              mobile: data.user.mobile_number,
              referralCode: data.user.referralCode,
              profile_photo: data.user.profile_photo,
              mpinStatus: data.user.mpinStatus,
              usertype: data.user.userType,
            });

            // Navigate to home page after successful OTP verification
            router.replace("/(app)/(tabs)/home");
            setIsShowOtp(false);
          } catch (storageError) {
            console.error("Error storing authentication data:", storageError);
            Alert.alert(
              t("error"),
              t("failedToStoreAuthData"),
              [{ text: t("ok") }]
            );
          }
        } else {
          setPins(["", "", "", ""]);
          Alert.alert(
            t("error"),
            data.message || data.error || t("invalidOtp"),
            [{ text: t("ok") }]
          );
        }
      })
      .catch((error) => {
        setPins(["", "", "", ""]);
        console.error("OTP verification error:", error);

        let errorMessage = t("anUnexpectedError");

        // Handle fetch API error structure
        if (error.message) {
          errorMessage = error.message;
        } else if (error.error) {
          errorMessage = error.error;
        }

        // Check for specific error types
        if (errorMessage.toLowerCase().includes("invalid") ||
          errorMessage.toLowerCase().includes("otp")) {
          Alert.alert(
            t("invalidOtp"),
            errorMessage || t("invalidOtpMessage"),
            [{ text: t("ok") }]
          );
        } else if (errorMessage.toLowerCase().includes("network") ||
          errorMessage.toLowerCase().includes("connection")) {
          Alert.alert(
            t("networkError"),
            t("checkInternetConnection"),
            [{ text: t("ok") }]
          );
        } else {
          Alert.alert(
            t("error"),
            errorMessage,
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
        setResendAttempts(3); // Reset resend attempts when first OTP is sent
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
      console.log('🔍 Login - Error caught:', error);

      // Handle fetch API error structure
      let errorMessage = t("youAreNotRegistered");

      if (error.message) {
        errorMessage = error.message;
      } else if (error.error) {
        errorMessage = error.error;
      }

      console.log('🔍 Login - Error message:', errorMessage);

      // Check if the error message contains "Invalid mobile number" (case insensitive)
      if (errorMessage.toLowerCase().includes("invalid mobile number") ||
        errorMessage.toLowerCase().includes(t("invalidMobileNumber").toLowerCase())) {
        console.log('🔍 Login - Showing invalid mobile modal for mobile:', mobile);
        setShowInvalidMobileModal(true);
        setLoading(false);
      } else {
        showErrorAlert(errorMessage);
        setLoading(false);
      }
    }
  };

  const handleResendOtp = async () => {
    if (resendAttempts <= 0) {
      Alert.alert(t("error"), t("resendLimitReached"));
      return;
    }

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
        setTimer(120);
        setPins(["", "", "", ""]);
        Alert.alert(t("success"), t("otpResentSuccess"));
        // Auto-focus first OTP input
        setTimeout(() => inputRefs[0]?.current?.focus(), 100);
      } else {
        throw new Error(data?.error || t("failedToResendOtp"));
      }
    } catch (error: any) {
      console.log('🔍 Resend OTP - Error caught:', error);

      let errorMessage = t("failedToResendOtp");

      // Handle fetch API error structure
      if (error.message) {
        errorMessage = error.message;
      } else if (error.error) {
        errorMessage = error.error;
      }

      console.log('🔍 Resend OTP - Error message:', errorMessage);
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
      setResendAttempts(3);
      // Stop SMS listener when going back to mobile input
      // stopSmsListener();
    } else {
      // If mobile input is showing, navigate back to previous route
      router.back();
    }
  };

    const handleDebugButton = async () => {
    try {
      // Get all AsyncStorage keys
      const keys = await AsyncStorage.getAllKeys();
      const storageData: { [key: string]: any } = {};
      
      // Get all values
      for (const key of keys) {
        const value = await AsyncStorage.getItem(key);
        try {
          storageData[key] = value ? JSON.parse(value) : value;
        } catch {
          storageData[key] = value;
        }
      }

      // Get SecureStore data
      const secureKeys = ['authToken', 'accessToken', 'token', 'refreshToken'];
      for (const key of secureKeys) {
        try {
          const value = await SecureStore.getItemAsync(key);
          if (value) {
            storageData[`secure_${key}`] = value;
          }
        } catch (error) {
          console.log(`Error getting secure key ${key}:`, error);
        }
      }

      // Add token analysis
      const tokenAnalysis: { [key: string]: any } = {};
      
      // Check main token
      const mainToken = await SecureStore.getItemAsync('token');
      if (mainToken) {
        try {
          const tokenParts = mainToken.split('.');
          if (tokenParts.length === 3) {
            const payload = JSON.parse(atob(tokenParts[1]));
            const expirationTime = payload.exp * 1000;
            const currentTime = Date.now();
            const isExpired = currentTime >= expirationTime;
            
            tokenAnalysis['token_status'] = {
              exists: true,
              format: 'valid',
              expires_at: new Date(expirationTime).toLocaleString(),
              is_expired: isExpired,
              time_until_expiry: isExpired ? 'EXPIRED' : `${Math.round((expirationTime - currentTime) / 1000)}s`,
              payload: payload
            };
          } else {
            tokenAnalysis['token_status'] = {
              exists: true,
              format: 'invalid',
              error: 'Not a valid JWT format'
            };
          }
                 } catch (error) {
            tokenAnalysis['token_status'] = {
              exists: true,
              format: 'error',
              error: error instanceof Error ? error.message : 'Unknown error'
            };
          }
      } else {
        tokenAnalysis['token_status'] = {
          exists: false,
          format: 'none',
          error: 'No token found'
        };
      }

      // Check global store state
      const globalState = useGlobalStore.getState();
      tokenAnalysis['global_store'] = {
        isLoggedIn: globalState.isLoggedIn,
        hasToken: !!globalState.token,
        hasUser: !!globalState.user,
        user: globalState.user
      };

      // Merge all data
      const finalData = {
        ...storageData,
        ...tokenAnalysis
      };

      setDebugStorageData(finalData);
      setShowDebugModal(true);
    } catch (error) {
      console.error('Error getting debug data:', error);
      Alert.alert('Debug Error', 'Failed to get storage data');
    }
  };

  const handleRefreshToken = async () => {
    setIsRefreshingToken(true);
    try {
      const refreshToken = await SecureStore.getItemAsync('refreshToken');
      if (!refreshToken) {
        Alert.alert('Error', 'No refresh token available');
        return;
      }

      const response = await fetch(`${theme.baseUrl}/auth/refresh-token`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify({ refreshToken }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        // Store new tokens
        await SecureStore.setItemAsync('token', data.token);
        await SecureStore.setItemAsync('accessToken', data.accessToken);
        await SecureStore.setItemAsync('refreshToken', data.refreshtoken);
        await SecureStore.setItemAsync('authToken', data.token);

        // Update global store
        const globalState = useGlobalStore.getState();
        globalState.login(data.token, globalState.user || {});

        Alert.alert('Success', 'Token refreshed successfully!');
        
        // Refresh debug data
        handleDebugButton();
      } else {
        Alert.alert('Error', data.message || 'Failed to refresh token');
      }
    } catch (error) {
      console.error('Token refresh error:', error);
      Alert.alert('Error', 'Failed to refresh token. Please try again.');
    } finally {
      setIsRefreshingToken(false);
    }
  };

  if (isLoggedIn) return null;

  return (
    <SafeAreaView style={registerStyles.container}>
      <ImageBackground
        source={theme.image.bg_image}
        style={registerStyles.backgroundImage}
      >
        {/* Dark overlay for background */}
        <View style={registerStyles.darkOverlay} />
        <LinearGradient
          colors={["rgba(32, 1, 1, 0.55)", "rgba(167, 0, 0, 0)", "rgba(118, 1, 1, 0)"]}
          style={registerStyles.gradient}
        >
          <SimpleLanguageSwitcher />
          
          {/* Debug Button */}
          {/* <TouchableOpacity
            onPress={handleDebugButton}
            style={{
              position: 'absolute',
              top: Platform.OS === 'ios' ? 120 : 100,
              right: 20,
              zIndex: 1000,
              backgroundColor: 'rgba(255, 0, 0, 0.8)',
              padding: 12,
              borderRadius: 25,
              flexDirection: 'row',
              alignItems: 'center',
              borderWidth: 1,
              borderColor: 'rgba(255, 255, 255, 0.3)',
            }}
          >
            <Ionicons name="bug" size={20} color="#ffffff" />
            <Text style={{ color: '#ffffff', fontSize: 12, fontWeight: 'bold', marginLeft: 4 }}>
              DEBUG
            </Text>
          </TouchableOpacity> */}
          
          {showError && (
            <ErrorAlert message={errorMessage} onClose={hideErrorAlert} />
          )}
          <KeyboardAvoidingView
            behavior={Platform.OS === "ios" ? "padding" : "height"}
            style={registerStyles.keyboardAvoidingView}
            keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 0} // Increased offset for Android
          >
            <ScrollView contentContainerStyle={[registerStyles.scrollViewContent, { flexGrow: 1 }]} keyboardShouldPersistTaps="handled">
              <View style={registerStyles.logoContainer}>
                <Image
                  source={theme.image.transparentLogo}
                  style={registerStyles.logo}
                  resizeMode="contain"
                />
              </View>

              <View style={registerStyles.formContainer}>
                <View style={registerStyles.cardContainer}>
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
                  <View style={registerStyles.cardContent}>
                    <Text style={registerStyles.pageTitle}>{t("welcomeBack")}!</Text>
                    <Text style={registerStyles.subtitle}>{t("signInToContinue")}</Text>
                    {!isShowOtp ? (
                      <>
                        <View style={registerStyles.inputContainer}>
                          <PhoneInput
                            value={mobile}
                            onChangeText={(text) => {
                              setMobile(text);
                              setMobileError("");
                            }}
                            loading={loading}
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
                        <View style={registerStyles.registerContainer}>
                          <Text style={registerStyles.registerText}>
                            {t("dontHaveAccount")}{" "}
                          </Text>
                          <TouchableOpacity onPress={() => router.push("/userBasicDetails")}>
                            <Text style={registerStyles.registerLink}>{t("register")}</Text>
                          </TouchableOpacity>
                        </View>
                      </>
                    ) : (
                      <View style={[registerStyles.otpContainer, { paddingVertical: 24 }]}>
                        <Text style={registerStyles.otpTitle}>{t("enterOTP")}</Text>
                        <Text style={registerStyles.otpSentText}>
                          {t("otpSentTo")}
                          {mobile.replace(/(\d{3})(\d{3})(\d{4})/, "$1-$2-$3")}
                        </Text>
                        <View style={registerStyles.otpInputsWrapper}>
                          <View style={registerStyles.otpInputsContainer}>
                            {pins.map((pin, index) => (
                              <TextInput
                                key={index}
                                ref={inputRefs[index]}
                                style={registerStyles.otpInput}
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
                          <Text style={registerStyles.timerText}>{t("resendIn")} {timer}s</Text>
                        </View>
                        {timer === 0 && resendAttempts > 0 && (
                          <TouchableOpacity
                            onPress={handleResendOtp}
                            style={registerStyles.resendButton}
                            disabled={loading}
                          >
                            <Text style={registerStyles.resendText}>
                              {loading ? t("resending") : t("resendOTP")} ({resendAttempts} {t("left")})
                            </Text>
                          </TouchableOpacity>
                        )}
                        {timer === 0 && resendAttempts === 0 && (
                          <View style={registerStyles.timerContainer}>
                            <Ionicons
                              name="alert-circle"
                              size={20}
                              color="#ff6b6b"
                            />
                            <Text style={[registerStyles.timerText, { color: "#ff6b6b" }]}>
                              {t("resendLimitReached")}
                            </Text>
                          </View>
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
                  </View>
                </View>
              </View>
            </ScrollView>
          </KeyboardAvoidingView>
          {/* <View style={registerStyles.poweredByContainer}>
            <Text style={registerStyles.poweredByText}>
              {t("poweredBy")} <Text style={{textDecorationLine: 'underline', color: theme.colors.textLight}} onPress={() => Linking.openURL('https://agnisofterp.com/')}>Agni Soft ERP</Text>
            </Text>
          </View> */}
        </LinearGradient>
      </ImageBackground>

      {/* Invalid Mobile Modal */}
      <InvalidMobileModal
        visible={showInvalidMobileModal}
        onClose={() => setShowInvalidMobileModal(false)}
        onCreateAccount={() => {
          console.log('🔍 Login - Creating account with mobile:', mobile);
          setShowInvalidMobileModal(false);
          // Test with hardcoded mobile number to see if the issue is with the mobile state
          const testMobile = mobile || "9876543210";
          console.log('🔍 Login - Using mobile for navigation:', testMobile);
          router.push({
            pathname: '/userBasicDetails',
            params: { mobile: testMobile }
          });
        }}
        mobileNumber={mobile}
      />

      {/* Debug Modal */}
      <DebugModal
        visible={showDebugModal}
        onClose={() => setShowDebugModal(false)}
        storageData={debugStorageData}
        onRefreshToken={handleRefreshToken}
        isRefreshing={isRefreshingToken}
      />
    </SafeAreaView>
  );
}

// Modal Styles
const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.6)",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 20,
  },
  modalContainer: {
    backgroundColor: "white",
    borderRadius: 16,
    width: "100%",
    maxWidth: 400,
    overflow: "hidden",
    elevation: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  modalHeader: {
    alignItems: "center",
    paddingVertical: 24,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  modalIconContainer: {
    marginBottom: 12,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#333",
    textAlign: "center",
  },
  modalSubtitle: {
    fontSize: 16,
    fontWeight: "500",
    color: "#666",
    textAlign: "center",
    marginTop: 4,
  },
  modalContent: {
    padding: 20,
  },
  modalMessage: {
    fontSize: 16,
    color: "#666",
    textAlign: "center",
    marginBottom: 20,
    lineHeight: 24,
  },
  modalDetails: {
    backgroundColor: "#f8f9fa",
    borderRadius: 12,
    padding: 16,
  },
  detailRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 12,
  },
  detailText: {
    fontSize: 14,
    color: "#555",
    marginLeft: 8,
    flex: 1,
    lineHeight: 20,
  },
  modalButtonContainer: {
    flexDirection: "row",
    borderTopWidth: 1,
    borderTopColor: "#f0f0f0",
  },
  modalButton: {
    flex: 1,
    paddingVertical: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  cancelButton: {
    backgroundColor: "#f8f9fa",
    borderRightWidth: 0.5,
    borderRightColor: "#f0f0f0",
  },
  createButton: {
    backgroundColor: "#ff6b35",
    borderLeftWidth: 0.5,
    borderLeftColor: "#f0f0f0",
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#666",
  },
  createButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "white",
  },
  debugModalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.6)",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 20,
  },
  debugModalContainer: {
    backgroundColor: "white",
    borderRadius: 16,
    width: "100%",
    maxWidth: 400,
    overflow: "hidden",
    elevation: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  debugModalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 24,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  debugModalTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#333",
  },
  debugCloseButton: {
    padding: 8,
  },
  debugModalContent: {
    padding: 20,
  },
  debugEmptyText: {
    fontSize: 16,
    color: "#666",
    textAlign: "center",
    paddingVertical: 20,
  },
  debugItemContainer: {
    marginBottom: 15,
  },
  debugItemKey: {
    fontSize: 16,
    fontWeight: "500",
    color: "#555",
    marginBottom: 5,
  },
  debugItemValue: {
    fontSize: 14,
    color: "#333",
    lineHeight: 22,
  },
  debugActionButtons: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
    backgroundColor: '#f8f9fa',
  },
  debugActionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#007AFF',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    marginRight: 10,
  },
  debugActionButtonDisabled: {
    backgroundColor: '#e0e0e0',
  },
  debugActionButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '500',
    marginLeft: 6,
  },
  debugActionButtonTextDisabled: {
    color: '#999999',
  },
});

