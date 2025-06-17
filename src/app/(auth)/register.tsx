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
} from "react-native";
import { useFocusEffect, useRouter, useLocalSearchParams } from "expo-router";
import PhoneInput from "../components/PhoneInputs";
import { theme } from "@/constants/theme";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons, Feather } from "@expo/vector-icons";
import { useOtpAutoFetch } from "@/hooks/useOtpAutoFetch";
import * as SecureStore from "expo-secure-store";
import { API_BASE_URL } from "@/config/api";

const { width } = Dimensions.get("window");
const logoWidth = width * 0.3;
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
      const response = await fetch(`${API_BASE_URL}/auth/check-mobile`, {
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
      const response = await fetch(`${API_BASE_URL}/register/verify-otp`, {
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
      style={styles.backgroundImage}
    >
      <LinearGradient
        colors={["rgba(32, 1, 1, 0.55)", "rgba(167, 0, 0, 0.3)", "rgba(118, 1, 1, 0.3)"]}
        style={styles.gradient}
      >
        {showError && (
          <ErrorAlert message={errorMessage} onClose={hideErrorAlert} />
        )}
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={styles.container}
        >
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
              <View style={styles.cardContent}>
                <Text style={styles.pageTitle}>Create Account</Text>
                <Text style={styles.subtitle}>Join us to start your journey</Text>

                {!otpSent ? (
                  <>
                    <View style={styles.inputContainer}>
                      <PhoneInput
                        value={mobile}
                        onChangeText={setMobile}
                        loading={loading}
                      />
                    </View>
                    <TouchableOpacity
                      style={[
                        styles.loginButton,
                        loading && styles.loginButtonDisabled,
                      ]}
                      onPress={handleGetOtp}
                      disabled={loading}
                    >
                      <LinearGradient
                        colors={["#ffc90c", "#ffd700"]}
                        style={styles.gradientButton}
                      >
                        <Text style={styles.loginButtonText}>
                          {loading ? "Sending..." : "Get OTP"}
                        </Text>
                      </LinearGradient>
                    </TouchableOpacity>
                    <View style={styles.registerContainer}>
                      <Text style={styles.registerText}>
                        Already have an account?{" "}
                      </Text>
                      <TouchableOpacity onPress={() => router.push("/login")}>
                        <Text style={styles.registerLink}>Login</Text>
                      </TouchableOpacity>
                    </View>
                  </>
                ) : (
                  <View style={styles.otpContainer}>
                    <Text style={styles.otpTitle}>Enter OTP</Text>
                    <Text style={styles.otpSentText}>
                      OTP sent to{" "}
                      {mobile.replace(/(\d{3})(\d{3})(\d{4})/, "$1-$2-$3")}
                    </Text>

                    <View style={styles.otpInputsWrapper}>
                      <View style={styles.otpInputsContainer}>
                        {pins.map((pin, index) => (
                          <TextInput
                            key={index}
                            ref={inputRefs[index]}
                            style={styles.otpInput}
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
                        style={styles.eyeButton}
                      >
                        <Feather
                          name={showOtp ? "eye-off" : "eye"}
                          size={24}
                          color={theme.colors.white}
                        />
                      </TouchableOpacity>
                    </View>

                    <View style={styles.timerContainer}>
                      <Ionicons
                        name="time-outline"
                        size={20}
                        color={theme.colors.white}
                      />
                      <Text style={styles.timerText}>Resend in {timer}s</Text>
                    </View>

                    {timer === 0 && resendCount > 0 && (
                      <TouchableOpacity
                        onPress={handleResendOtp}
                        style={styles.resendButton}
                      >
                        <Text style={styles.resendText}>
                          Resend OTP ({resendCount} left)
                        </Text>
                      </TouchableOpacity>
                    )}

                    <TouchableOpacity
                      style={[
                        styles.loginButton,
                        loading && styles.loginButtonDisabled,
                      ]}
                      onPress={handleVerifyOtp}
                      disabled={loading || pins.includes("")}
                    >
                      <LinearGradient
                        colors={["#ffc90c", "#ffd700"]}
                        style={styles.gradientButton}
                      >
                        <Text style={styles.loginButtonText}>
                          {loading ? "Verifying..." : "Verify OTP"}
                        </Text>
                      </LinearGradient>
                    </TouchableOpacity>
                  </View>
                )}

                <TouchableOpacity
                  style={styles.backButton}
                  onPress={handleBackButton}
                >
                  <Ionicons
                    name="arrow-back"
                    size={20}
                    color={theme.colors.white}
                  />
                  <Text style={styles.backButtonText}>Back</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </KeyboardAvoidingView>
      </LinearGradient>
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
  pageTitle: {
    color: "#ffffff",
    fontSize: 28,
    fontWeight: "bold",
    marginBottom: 10,
    textAlign: "center",
  },
  subtitle: {
    color: "#ffffff",
    fontSize: 16,
    marginBottom: 30,
    textAlign: "center",
    opacity: 0.8,
  },
  inputContainer: {
    width: "100%",
    marginBottom: 6,
  },
  loginButton: {
    width: "100%",
    height: 50,
    borderRadius: 25,
    overflow: "hidden",
    marginTop: 6,
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
  gradientButton: {
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
  otpContainer: {
    alignItems: "center",
    marginVertical: 20,
    width: "100%",
  },
  otpTitle: {
    color: "#ffffff",
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 10,
  },
  otpSentText: {
    color: "#ffffff",
    fontSize: 16,
    marginBottom: 20,
    opacity: 0.8,
  },
  otpInputsWrapper: {
    position: "relative",
    width: "70%",
    alignSelf: "center",
    justifyContent: "center",
    alignItems: "center",
  },
  otpInputsContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: "100%",
    marginTop: 10,
  },
  otpInput: {
    width: 50,
    height: 50,
    borderWidth: 1,
    borderColor: "rgba(0, 0, 0, 0.1)",
    borderRadius: 12,
    color: "#000000",
    fontSize: 24,
    backgroundColor: "#ffffff",
    textAlign: "center",
  },
  eyeButton: {
    position: "absolute",
    right: -40,
    top: 20,
  },
  timerContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 15,
  },
  timerText: {
    color: "#ffffff",
    marginLeft: 8,
    fontSize: 16,
    opacity: 0.8,
  },
  resendButton: {
    marginTop: 10,
    padding: 10,
  },
  resendText: {
    color: theme.colors.secondary,
    fontSize: 16,
    fontWeight: "bold",
    textDecorationLine: "underline",
  },
  registerContainer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginTop: 20,
  },
  registerText: {
    color: "#ffffff",
    fontSize: 16,
    opacity: 0.8,
  },
  registerLink: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "bold",
    textDecorationLine: "underline",
    marginLeft: 4,
  },
  backButton: {
    marginTop: 20,
    flexDirection: "row",
    alignItems: "center",
  },
  backButtonText: {
    color: "#ffffff",
    fontSize: 16,
    marginLeft: 5,
    opacity: 0.8,
  },
  errorAlert: {
    position: "absolute",
    top: Platform.OS === "ios" ? 50 : 30,
    left: 20,
    right: 20,
    backgroundColor: "rgba(255, 68, 68, 0.95)",
    borderRadius: 12,
    padding: 15,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    zIndex: 1000,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  errorContent: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
  },
  errorMessage: {
    color: "#fff",
    fontSize: 16,
    marginLeft: 10,
    flex: 1,
  },
  closeButton: {
    padding: 5,
  },
});
