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
import { useOtpAutoFetch } from "@/hooks/useOtpAutoFetch";
import { registerStyles } from "./registerStyles";

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

  // Global state and error handling
  const { login, isLoggedIn } = useGlobalStore();
  const [errorMessage, setErrorMessage] = useState("");
  const [showError, setShowError] = useState(false);
  const [mobileError, setMobileError] = useState("");

  // Platform detection
  // const isAndroid = Platform.OS === "android";
  // const isIOS = Platform.OS === "ios";

  // Auto-fetch OTP functionality
  const handleOtpAutoFill = (otp: string) => {
    // console.log("Auto-filling OTP:", otp);
    const otpArray = otp.split("");
    setPins(otpArray);

    // Auto-verify if we get a complete 4-digit OTP
    if (otp.length === 4) {
      setTimeout(() => {
        verifyOtp(otp);
      }, 500); // Small delay to show the filled OTP to user
    }
  };

  // useEffect(() => {
  //   let subscription: any;

  //   const startSmsListener = async () => {
  //     if (isAndroid) {
  //       const { status } = await SMSRetriever.requestPhoneNumber();
  //       if (status === "granted") {
  //         subscription = SMSRetriever.addSMSListener(
  //           ({ message }: { message: string }) => {
  //             const otpMatch = /\b\d{4}\b/.exec(message);
  //             if (otpMatch) {
  //               handleOtpAutoFill(otpMatch[0]);
  //             }
  //           }
  //         );
  //       }
  //     }
  //   };

  //   startSmsListener();

  //   return () => {
  //     if (subscription) {
  //       subscription.remove();
  //     }
  //   };
  // }, [isAndroid]);

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
    Alert.alert("No Internet", "Please check your internet connection.", [
      {
        text: "Retry",
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

  // const getOtpFromSms = async () => {
  //   try {
  //     await SmsRetriever.requestPhoneNumber();
  //     SmsRetriever.addSmsListener((event) => {
  //       const otp = extractOtpFromMessage(event.message);
  //       if (otp) {
  //         setPins(otp.split(""));
  //         verifyOtp(otp);
  //       }
  //     });
  //   } catch (error) {
  //     console.error("Error retrieving OTP:", error);
  //   }
  // };

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
            "Error",
            data.message || "Invalid OTP. Please try again.",
            [{ text: "OK" }]
          );
        }
      })
      .catch((error) => {
        setPins(["", "", "", ""]);
        if (error.response) {
          if (error.response.status === 400) {
            Alert.alert(
              "Invalid OTP",
              error.response.data.message || "Incorrect OTP. Try again.",
              [{ text: "OK" }]
            );
          } else {
            Alert.alert(
              "Error",
              error.response.data.message || "Something went wrong. Please try again.",
              [{ text: "OK" }]
            );
          }
        } else if (error.request) {
          Alert.alert(
            "Network Error",
            "Please check your internet connection and try again.",
            [{ text: "OK" }]
          );
        } else {
          Alert.alert(
            "Error",
            "An unexpected error occurred. Please try again.",
            [{ text: "OK" }]
          );
        }
      })
      .finally(() => setLoading(false));
  };

  const loginAxio = async () => {
    const indianMobilePattern = /^[6-9]\d{9}$/;
    if (!mobile) {
      setMobileError("Please enter mobile number");
      return;
    }
    if (!indianMobilePattern.test(mobile)) {
      setMobileError("Please enter a valid 10-digit Indian mobile number");
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
        throw new Error(data?.error || "Failed to send OTP");
      }

      // Start SMS listener for Android
      // if (isAndroid) {
      //   startSmsListener();
      // }
      setLoading(false);
    } catch (error: any) {
      const errorMessage = error.message || "You are not registered.";
      if (errorMessage.toLowerCase().includes("invalid mobile number")) {
        Alert.alert(
          "Invalid Mobile Number",
          "This mobile number is not registered. Would you like to create an account?",
          [
            {
              text: "Cancel",
              style: "cancel",
              onPress: () => setLoading(false),
            },
            {
              text: "Create Account",
              onPress: () => {
                // Handle create account navigation
                router.push(`/register?mobile=${mobile}`);
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
        Alert.alert("Success", "OTP resent successfully");
        // Auto-focus first OTP input
        setTimeout(() => inputRefs[0]?.current?.focus(), 100);
      } else {
        throw new Error(data?.error || "Failed to resend OTP");
      }
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : "Failed to resend OTP";
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
    <ImageBackground
      source={theme.image.bg_image}
      style={registerStyles.backgroundImage}
    >
      {/* Dark overlay for background */}
      <View style={registerStyles.darkOverlay} />
      <LinearGradient
        colors={["rgba(32, 1, 1, 0.55)", "rgba(167, 0, 0, 0.3)", "rgba(118, 1, 1, 0.3)"]}
        style={registerStyles.gradient}
      >
        {showError && (
          <ErrorAlert message={errorMessage} onClose={hideErrorAlert} />
        )}
        <ScrollView contentContainerStyle={{ flexGrow: 1 }} keyboardShouldPersistTaps="handled">
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
              <View style={registerStyles.cardContent}>
                <Text style={registerStyles.pageTitle}>Welcome Back!</Text>
                <Text style={registerStyles.subtitle}>Sign in to continue</Text>
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
                          {loading ? "Processing..." : "Get OTP"}
                        </Text>
                      </LinearGradient>
                    </TouchableOpacity>
                    <View style={registerStyles.registerContainer}>
                      <Text style={registerStyles.registerText}>
                        Don't have an account?{" "}
                      </Text>
                      <TouchableOpacity onPress={() => router.push("/register")}> 
                        <Text style={registerStyles.registerLink}>Register</Text>
                      </TouchableOpacity>
                    </View>
                  </>
                ) : (
                  <View style={registerStyles.otpContainer}>
                    <Text style={registerStyles.otpTitle}>Enter OTP</Text>
                    <Text style={registerStyles.otpSentText}>
                      OTP sent to{" "}
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
                      <Text style={registerStyles.timerText}>Resend in {timer}s</Text>
                    </View>
                    {timer === 0 && resendAttempts < 3 && (
                      <TouchableOpacity
                        onPress={handleResendOtp}
                        style={registerStyles.resendButton}
                      >
                        <Text style={registerStyles.resendText}>Resend OTP</Text>
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
                          {loading ? "Verifying..." : "Submit"}
                        </Text>
                      </LinearGradient>
                    </TouchableOpacity>
                  </View>
                )}
              </View>
            </View>
          </View>
          <View style={registerStyles.poweredByContainer}>
            <Text style={registerStyles.poweredByText}>
              Powered by <Text style={{textDecorationLine: 'underline', color: '#ffc90c'}} onPress={() => Linking.openURL('https://agnisofterp.com/')}>Agni Soft ERP</Text>
            </Text>
          </View>
        </ScrollView>
      </LinearGradient>
    </ImageBackground>
  );
}

