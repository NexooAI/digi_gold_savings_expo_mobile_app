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
import api from "../services/api";
import { theme } from "@/constants/theme";

const { width } = Dimensions.get("window");
const logoWidth = width * 0.3;
const OTP_RESEND_LIMIT = 3;
const INITIAL_TIMER = 120;

export default function Login() {
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
            <Text style={styles.pageTitle}>Register</Text>

            <PhoneInput
              value={mobile}
              onChangeText={setMobile}
              loading={loading}
            />

            {otpSent && (
              <View style={styles.otpContainer}>
                <Text style={styles.otpTitle}>Enter OTP</Text>
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
                </TouchableOpacity>
              </View>
            )}

            {!otpSent ? (
              <TouchableOpacity
                style={styles.button}
                onPress={handleGetOtp}
                disabled={loading}
              >
                <Text style={styles.buttonText}>
                  {loading ? "Sending..." : "Get OTP"}
                </Text>
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
                <Text style={styles.buttonText}>
                  {loading ? "Verifying..." : "Verify OTP"}
                </Text>
              </TouchableOpacity>
            )}

            <View style={styles.loginPromptContainer}>
              <Text style={styles.loginPromptText}>
                Do you have an account?{" "}
              </Text>
              <TouchableOpacity onPress={() => router.push("/login")}>
                <Text style={styles.loginLinkText}>Login</Text>
              </TouchableOpacity>
            </View>
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => router.back()}
            >
              <Text style={styles.backButtonText}>Back</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  backgroundImage: {
    flex: 1,
    resizeMode: "cover",
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
  button: {
    backgroundColor: "#ffc90c",
    paddingVertical: 15,
    borderRadius: 25,
    marginVertical: 10,
    width: "100%",
    alignItems: "center",
  },
  buttonText: {
    color: "#2e0406",
    fontSize: 18,
    fontWeight: "bold",
  },
  linkButton: {
    marginTop: 10,
  },
  linkButtonText: {
    color: "#ffc90c",
    fontSize: 14,
    textDecorationLine: "underline",
  },
  loginPromptContainer: {
    flexDirection: "row",
    marginTop: 20,
  },
  loginPromptText: {
    color: "#fff",
    fontSize: 16,
  },
  loginLinkText: {
    color: "#ffc90c",
    fontSize: 16,
    fontWeight: "bold",
  },
  logo: {
    aspectRatio: 1,
    marginTop: 90,
  },
  otpContainer: {
    alignItems: "flex-start",
    marginVertical: 20,
    width: "100%",
  },
  otpTitle: {
    color: "#fff",
    fontSize: 18,
    marginBottom: 10,
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
    borderColor: "#fff",
    borderRadius: 8,
    color: "#fff",
    fontSize: 24,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
  },
  disabledText: {
    opacity: 0.5,
  },
  disabledButton: {
    opacity: 0.6,
  },
  backButton: {
    marginTop: 20,
  },
  backButtonText: {
    color: "#fff",
    fontSize: 16,
  },
  pageTitle: {
    color: theme.colors.textLight,
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 20,
    textAlign: "left", // <- ensures text aligns left
    alignSelf: "flex-start", // <- keeps the title aligned within its container
  },
});
