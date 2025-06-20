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
} from "react-native";
import { useFocusEffect, useRouter, useLocalSearchParams } from "expo-router";
import PhoneInput from "../components/PhoneInputs";
import { theme } from "@/constants/theme";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons, Feather } from "@expo/vector-icons";
import { useOtpAutoFetch } from "@/hooks/useOtpAutoFetch";
import * as SecureStore from "expo-secure-store";
import { API_BASE_URL } from "@/config/api";
import { registerStyles } from "../../_styles/registerStyles";

const OTP_RESEND_LIMIT = 3;
const INITIAL_TIMER = 120;

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
  const [mobile, setMobile] = useState("");
  const [otpSent, setOtpSent] = useState(false);
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
  const inputRefs = [
    useRef<TextInput>(null),
    useRef<TextInput>(null),
    useRef<TextInput>(null),
    useRef<TextInput>(null),
  ];

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
      showErrorAlert("Please enter a valid 10-digit Indian mobile number.");
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
        setResendCount(OTP_RESEND_LIMIT);
        startTimer();
        Alert.alert("Success", data?.message || "OTP sent successfully");
      } else {
        throw new Error(data?.error || "Failed to send OTP");
      }
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : "Failed to send OTP";
      handleApiError(new Error(errorMessage));
    } finally {
      setLoading(false);
    }
  };

  const handleResendOtp = async () => {
    if (resendCount <= 0) return;

    setLoading(true);
    try {
      const response = await fetch(`${theme.baseUrl}/auth/check-mobile`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ mobile_number: mobile }),
      });

      if (response.ok) {
        setResendCount((prev) => prev - 1);
        startTimer();
        setPins(["", "", "", ""]);
        Alert.alert("Success", "OTP resent successfully");
      } else {
        const data = await response.json();
        throw new Error(data?.error || "Failed to resend OTP");
      }
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : "Failed to resend OTP";
      handleApiError(new Error(errorMessage));
    } finally {
      setLoading(false);
    }
  };

  const handleApiError = (error: unknown) => {
    let message = "An error occurred";

    if (error && typeof error === "object") {
      if (
        "response" in error &&
        error.response &&
        typeof error.response === "object" &&
        "error" in error.response
      ) {
        message = String(error.response.error) || message;
      } else if ("message" in error && error.message) {
        message = String(error.message);
      }
    }

    if (message.toLowerCase().includes("already registered")) {
      showErrorAlert(
        "Mobile number already registered. Please go to login page."
      );
      return;
    }
    showErrorAlert(message);
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
    const otp = pins.join("");
    if (otp.length !== 4) {
      showErrorAlert("Please enter complete 4-digit OTP");
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`${theme.baseUrl}/register/verify-otp`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ mobile_number: mobile, otp }),
      });

      const data = await response.json();

      if (response.ok) {
        // Store the token if present in the response
        if (data.token) {
          await SecureStore.setItemAsync("authToken", data.token);
        }
        router.push({
          pathname: "/(auth)/userBasicDetails",
          params: { mobile },
        });
        setPins(["", "", "", ""]);
      } else {
        throw new Error(data?.message || "Invalid OTP");
      }
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : "Failed to verify OTP";
      showErrorAlert(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // Auto-fetch OTP functionality
  const handleOtpAutoFill = (otp: string) => {
    //console.log('Auto-filling OTP in register:', otp);
    const otpArray = otp.split("");
    setPins(otpArray);

    // Auto-verify if we get a complete 4-digit OTP
    if (otp.length === 4) {
      setTimeout(() => {
        handleVerifyOtp();
      }, 500); // Small delay to show the filled OTP to user
    }
  };

  const { startSmsListener, stopSmsListener } = useOtpAutoFetch({
    onOtpReceived: handleOtpAutoFill,
    isActive: otpSent, // Start listening when OTP is sent
    senderName: "Dc Jewellery", // Match your SMS sender
  });

  useFocusEffect(
    React.useCallback(() => {
      return () => {
        setMobile("");
        setOtpSent(false);
        setLoading(false);
        setTimer(INITIAL_TIMER);
        setResendCount(OTP_RESEND_LIMIT);
        if (intervalRef.current) clearInterval(intervalRef.current);
      };
    }, [])
  );

  useEffect(() => {
    let countdown: NodeJS.Timeout;
    if (otpSent && timer > 0) {
      countdown = setInterval(() => {
        setTimer((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(countdown);
  }, [otpSent, timer]);

  useEffect(() => {
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  const handleBackButton = () => {
    if (otpSent) {
      // If OTP fields are showing, hide them and go back to mobile input
      setOtpSent(false);
      setPins(["", "", "", ""]);
      setTimer(INITIAL_TIMER);
      setResendCount(OTP_RESEND_LIMIT);
      if (intervalRef.current) clearInterval(intervalRef.current);
      // Stop SMS listener when going back to mobile input
      stopSmsListener();
    } else {
      // If mobile input is showing, navigate back to previous route
      router.back();
    }
  };

  return (
    <ImageBackground
      source={theme.image.bg_image}
      style={registerStyles.backgroundImage}
    >
      {/* Dark overlay for background */}
      <View style={registerStyles.darkOverlay} />
      <LinearGradient
        colors={["rgba(32, 1, 1, 0.55)",
           "rgba(167, 0, 0, 0)", 
           "rgba(118, 1, 1, 0)"]}
        style={registerStyles.gradient}
      >
        {showError && (
          <ErrorAlert message={errorMessage} onClose={hideErrorAlert} />
        )}
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={{ flex: 1 }}
          keyboardVerticalOffset={Platform.OS === "ios" ? 40 : 0}
        >
          <ScrollView
            contentContainerStyle={{
              flexGrow: 1,
              justifyContent: 'space-between',
              paddingBottom: 24,
            }}
            keyboardShouldPersistTaps="handled"
          >
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
                  <Text style={registerStyles.pageTitle}>Create Account</Text>
                  <Text style={registerStyles.subtitle}>Join us to start your journey</Text>

                  {!otpSent ? (
                    <>
                      <View style={registerStyles.inputContainer}>
                        <PhoneInput
                          value={mobile}
                          onChangeText={setMobile}
                          loading={loading}
                        />
                      </View>
                      <TouchableOpacity
                        style={[
                          registerStyles.loginButton,
                          loading && registerStyles.loginButtonDisabled,
                        ]}
                        onPress={handleGetOtp}
                        disabled={loading}
                      >
                        <LinearGradient
                          colors={["#ffc90c", "#ffd700"]}
                          style={registerStyles.gradientButton}
                        >
                          <Text style={registerStyles.loginButtonText}>
                            {loading ? "Sending..." : "Get OTP"}
                          </Text>
                        </LinearGradient>
                      </TouchableOpacity>
                      <View style={registerStyles.footer}>
                        <Text style={registerStyles.footerText}>
                          Already have an account?{" "}
                        </Text>
                        <TouchableOpacity onPress={() => router.push("/login")}>
                          <Text style={registerStyles.footerLink}>Login</Text>
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

                      {timer === 0 && resendCount > 0 && (
                        <TouchableOpacity
                          onPress={handleResendOtp}
                          style={registerStyles.resendButton}
                        >
                          <Text style={registerStyles.resendText}>
                            Resend OTP ({resendCount} left)
                          </Text>
                        </TouchableOpacity>
                      )}

                      <TouchableOpacity
                        style={[
                          registerStyles.loginButton,
                          loading && registerStyles.loginButtonDisabled,
                        ]}
                        onPress={handleVerifyOtp}
                        disabled={loading || pins.includes("")}
                      >
                        <LinearGradient
                          colors={["#ffc90c", "#ffd700"]}
                          style={registerStyles.gradientButton}
                        >
                          <Text style={registerStyles.loginButtonText}>
                            {loading ? "Verifying..." : "Verify OTP"}
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
        <View style={registerStyles.poweredByContainer}>
          <Text style={registerStyles.poweredByText}>
            Powered by <Text style={{textDecorationLine: 'underline', color: '#ffc90c'}} onPress={() => Linking.openURL('https://agnisofterp.com/')}>Agni Soft ERP</Text>
          </Text>
        </View>
      </LinearGradient>
    </ImageBackground>
  );
}
