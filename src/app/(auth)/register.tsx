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
  ScrollView,
  Platform,
  Dimensions,
  Alert,
} from "react-native";
import { useFocusEffect, useRouter } from "expo-router";
import PhoneInput from "../components/PhoneInputs";
import api from "@/services/api";
import { theme } from "@/constants/theme";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";

const { width } = Dimensions.get("window");
const logoWidth = width * 0.3;
const OTP_RESEND_LIMIT = 3;
const INITIAL_TIMER = 120;

export default function Register() {
  const [mobile, setMobile] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [pins, setPins] = useState(["", "", "", ""]);
  const [timer, setTimer] = useState(INITIAL_TIMER);
  const [resendCount, setResendCount] = useState(OTP_RESEND_LIMIT);
  const intervalRef = useRef(null);
  const router = useRouter();
  const inputRefs = [useRef(null), useRef(null), useRef(null), useRef(null)];

  const startTimer = () => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    setTimer(INITIAL_TIMER);
    intervalRef.current = setInterval(() => {
      setTimer((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs
      .toString()
      .padStart(2, "0")}`;
  };

  const handleGetOtp = () => {
    const indianMobilePattern = /^[6-9]\d{9}$/;

    if (!mobile || !indianMobilePattern.test(mobile)) {
      Alert.alert(
        "Error",
        "Please enter a valid 10-digit Indian mobile number."
      );
      return;
    }

    setLoading(true);
    api
      .post("/register-mobile", { mobile_number: mobile })
      .then((res) => {
        if (res.status === 200) {
          setOtpSent(true);
          setResendCount(OTP_RESEND_LIMIT);
          startTimer();
          Alert.alert("Success", res.data?.message);
        }
      })
      .catch(handleApiError)
      .finally(() => setLoading(false));
  };

  const handleResendOtp = () => {
    if (resendCount <= 0) return;

    setLoading(true);
    api
      .post("/auth/check-mobile", { mobile_number: mobile })
      .then(() => {
        setResendCount((prev) => prev - 1);
        startTimer();
        Alert.alert("Success", "OTP resent successfully");
      })
      .catch(handleApiError)
      .finally(() => setLoading(false));
  };

  const handleApiError = (error) => {
    const message = error.response?.data?.error || "An error occurred";
    if (message === "Mobile number already registered") {
      Alert.alert(
        "Error",
        "Mobile number already registered. Please goto login page."
      );
      return;
    }
    Alert.alert("Error", message);
  };

  const handlePinChange = (text, index) => {
    const newPins = [...pins];
    newPins[index] = text;
    setPins(newPins);

    if (text.length === 1 && index < 3) {
      inputRefs[index + 1].current.focus();
    }
  };

  const handleKeyPress = ({ nativeEvent }, index) => {
    if (nativeEvent.key === "Backspace" && pins[index] === "" && index > 0) {
      inputRefs[index - 1].current.focus();
      const newPins = [...pins];
      newPins[index - 1] = "";
      setPins(newPins);
    }
  };

  const handleVerifyOtp = () => {
    const otp = pins.join("");
    if (otp.length !== 4) {
      Alert.alert("Error", "Please enter complete 4-digit OTP");
      return;
    }
    setLoading(true);
    const data = { mobile_number: mobile, otp };
    api
      .post("/verify-otp", data)
      .then((res) => {
        if (res.status === 200) {
          router.push({ pathname: "/(auth)/kyc", params: { mobile } });
          setPins(["", "", "", ""]);
        }
      })
      .catch((err) =>
        Alert.alert("Error", err.response?.data?.message || "Invalid OTP")
      )
      .finally(() => setLoading(false));
  };

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
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  return (
    <ImageBackground
      source={theme.image.bg_image}
      style={styles.backgroundImage}
    >
      <LinearGradient
        colors={['rgba(0,0,0,0.7)', 'rgba(0,0,0,0.5)', 'rgba(0,0,0,0.7)']}
        style={styles.gradient}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          keyboardVerticalOffset={Platform.OS === "ios" ? 64 : 0}
          style={styles.container}
        >
          <ScrollView
            contentContainerStyle={styles.scrollContainer}
            keyboardShouldPersistTaps="handled"
          >
            <View style={styles.formContainer}>
              <Image
                source={theme.image.transparentLogo}
                style={[styles.logo, { width: logoWidth, aspectRatio: 1 }]}
                resizeMode="contain"
              />
              
              <View style={styles.cardContainer}>
                <Text style={styles.pageTitle}>Create Account</Text>
                <Text style={styles.subtitle}>Join us to start your journey</Text>

                <View style={styles.inputContainer}>
                  <PhoneInput
                    value={mobile}
                    onChangeText={setMobile}
                    loading={loading}
                  />
                </View>

                {otpSent && (
                  <View style={styles.otpContainer}>
                    <Text style={styles.otpTitle}>Enter OTP</Text>
                    <Text style={styles.otpSentText}>
                      OTP sent to {mobile.replace(/(\d{3})(\d{3})(\d{4})/, "$1-$2-$3")}
                    </Text>
                    
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
                          textAlign="center"
                        />
                      ))}
                    </View>

                    <TouchableOpacity
                      style={styles.linkButton}
                      onPress={handleResendOtp}
                      disabled={timer > 0 || resendCount <= 0}
                    >
                      <View style={styles.resendContainer}>
                        <Ionicons 
                          name="refresh-outline" 
                          size={20} 
                          color={timer > 0 || resendCount <= 0 ? 'rgba(255,255,255,0.5)' : theme.colors.secondary} 
                        />
                        <Text
                          style={[
                            styles.linkButtonText,
                            (timer > 0 || resendCount <= 0) && styles.disabledText,
                          ]}
                        >
                          {resendCount > 0
                            ? `Resend OTP (${resendCount} left) ${
                                timer > 0 ? `- Wait ${formatTime(timer)}` : ""
                              }`
                            : "No resends left"}
                        </Text>
                      </View>
                    </TouchableOpacity>
                  </View>
                )}

                {!otpSent ? (
                  <TouchableOpacity
                    style={styles.button}
                    onPress={handleGetOtp}
                    disabled={loading}
                  >
                    <LinearGradient
                      colors={['#ffc90c', '#ffd700']}
                      style={styles.gradientButton}
                    >
                      <Text style={styles.buttonText}>
                        {loading ? "Sending..." : "Get OTP"}
                      </Text>
                    </LinearGradient>
                  </TouchableOpacity>
                ) : (
                  <TouchableOpacity
                    style={[
                      styles.button,
                      pins.join("").length < 4 && styles.disabledButton,
                    ]}
                    disabled={pins.join("").length < 4 || loading}
                    onPress={handleVerifyOtp}
                  >
                    <LinearGradient
                      colors={['#ffc90c', '#ffd700']}
                      style={styles.gradientButton}
                    >
                      <Text style={styles.buttonText}>
                        {loading ? "Verifying..." : "Verify OTP"}
                      </Text>
                    </LinearGradient>
                  </TouchableOpacity>
                )}

                <View style={styles.loginPromptContainer}>
                  <Text style={styles.loginPromptText}>
                    Already have an account?{" "}
                  </Text>
                  <TouchableOpacity onPress={() => router.push("/login")}>
                    <Text style={styles.loginLinkText}>Login</Text>
                  </TouchableOpacity>
                </View>
              </View>

              <TouchableOpacity
                style={styles.backButton}
                onPress={() => router.back()}
              >
                <Ionicons name="arrow-back" size={20} color={theme.colors.white} />
                <Text style={styles.backButtonText}>Back</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
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
  },
  scrollContainer: {
    flexGrow: 1,
    justifyContent: "center",
  },
  formContainer: {
    paddingHorizontal: 20,
    alignItems: "center",
  },
  cardContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 20,
    padding: 20,
    width: '100%',
    backdropFilter: 'blur(10px)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  logo: {
    aspectRatio: 1,
    marginTop: 90,
    marginBottom: 20,
  },
  pageTitle: {
    color: theme.colors.textLight,
    fontSize: 28,
    fontWeight: "bold",
    marginBottom: 10,
    textAlign: "center",
  },
  subtitle: {
    color: theme.colors.textLight,
    fontSize: 16,
    marginBottom: 30,
    textAlign: "center",
    opacity: 0.8,
  },
  inputContainer: {
    width: '100%',
    marginBottom: 20,
  },
  button: {
    width: "100%",
    height: 50,
    borderRadius: 25,
    overflow: 'hidden',
    marginTop: 20,
  },
  gradientButton: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  buttonText: {
    color: theme.colors.textDark,
    fontSize: 18,
    fontWeight: "bold",
  },
  linkButton: {
    marginTop: 15,
  },
  resendContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  linkButtonText: {
    color: theme.colors.secondary,
    fontSize: 14,
    marginLeft: 8,
  },
  loginPromptContainer: {
    flexDirection: "row",
    marginTop: 20,
    justifyContent: 'center',
  },
  loginPromptText: {
    color: theme.colors.textLight,
    fontSize: 16,
  },
  loginLinkText: {
    color: theme.colors.secondary,
    fontSize: 16,
    fontWeight: "bold",
  },
  otpContainer: {
    alignItems: "center",
    marginVertical: 20,
    width: "100%",
  },
  otpTitle: {
    color: theme.colors.textLight,
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  otpSentText: {
    color: theme.colors.textLight,
    fontSize: 16,
    marginBottom: 20,
    opacity: 0.8,
  },
  otpInputsContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: "70%",
    marginBottom: 15,
  },
  otpInput: {
    width: 50,
    height: 50,
    borderWidth: 1,
    borderColor: theme.colors.white,
    borderRadius: 12,
    color: theme.colors.white,
    fontSize: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  disabledText: {
    opacity: 0.5,
  },
  disabledButton: {
    opacity: 0.6,
  },
  backButton: {
    marginTop: 20,
    flexDirection: 'row',
    alignItems: 'center',
  },
  backButtonText: {
    color: theme.colors.white,
    fontSize: 16,
    marginLeft: 5,
  },
});
