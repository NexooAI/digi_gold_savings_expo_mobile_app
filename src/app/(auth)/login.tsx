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
import { useFocusEffect, useRouter } from "expo-router";
import NetInfo from "@react-native-community/netinfo";
import PhoneInput from "../components/PhoneInputs";
import useGlobalStore from "@/store/global.store";
import api from "../services/api";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as SecureStore from "expo-secure-store";
import SmsRetriever from "react-native-sms-retriever";
import { Feather } from "@expo/vector-icons";
import { theme } from "@/constants/theme";

const { width } = Dimensions.get("window");
const logoWidth = width * 0.3;

export default function Login() {
  const [mobile, setMobile] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const [pins, setPins] = useState(["", "", "", ""]);
  const [timer, setTimer] = useState(120);
  const [resendAttempts, setResendAttempts] = useState(0);
  const [isShowOtp, setIsShowOtp] = useState(false);
  const inputRefs = [useRef(null), useRef(null), useRef(null), useRef(null)];
  const { login, isLoggedIn } = useGlobalStore();
  const [error, setError] = useState("");
  const [isAndroid, setIsAndroid] = useState(Platform.OS === "android");
  const [isIOS, setIsIOS] = useState(Platform.OS === "ios");
  const [showOtp, setShowOtp] = useState(false);

  useEffect(() => {
    if (isAndroid) {
      // getOtpFromSms();
    }
  }, [isAndroid]);

  useEffect(() => {
    if (isIOS) {
      setIsShowOtp(true);
    }
  }, [isIOS]);

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
    let countdown;
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

  const handlePinChange = (text, index) => {
    const newPins = [...pins];
    newPins[index] = text;
    setPins(newPins);
    if (text.length === 1 && index < 3) {
      inputRefs[index + 1].current.focus();
    }
  };

  const handleKeyPress = (e, index) => {
    if (e.nativeEvent.key === "Backspace" && !pins[index] && index > 0) {
      const newPins = [...pins];
      newPins[index - 1] = "";
      setPins(newPins);
      inputRefs[index - 1].current.focus();
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

  const extractOtpFromMessage = (message) => {
    const otpMatch = message.match(/\d{4}/); // Assuming 4-digit OTP
    return otpMatch ? otpMatch[0] : null;
  };

  const verifyOtp = (otp) => {
    setLoading(true);
    api
      .post("/auth/verify-otp", { mobile_number: mobile, otp })
      .then(async (res) => {
        if (res.data.success) {
          await SecureStore.setItemAsync("authToken", res.data.token);
          await AsyncStorage.setItem("userData", JSON.stringify(res.data.user));
          login(res.data.token, {
            id: res.data.user.user_id,
            name: res.data.user.name,
            email: res.data.user.email,
            mobile: res.data.user.mobile_number,
            referralCode: res.data.user.referralCode,
          });

          const storedHashedMPIN = await SecureStore.getItemAsync("user_mpin");
          router.push(storedHashedMPIN ? "/mpin_verify" : "/reset_mpin");
          setIsShowOtp(false);
        }
      })
      .catch((error) => {
        Alert.alert("Error", error.response?.data?.error || "Invalid OTP");
      })
      .finally(() => setLoading(false));
  };

  const loginAxio = () => {
    const indianMobilePattern = /^[6-9]\d{9}$/;
    if (!mobile || !indianMobilePattern.test(mobile)) {
      Alert.alert("Error", "Please enter a valid 10-digit mobile number.");
      return;
    }
    setLoading(true);
    api
      .post("/auth/check-mobile", { mobile_number: mobile })
      .then(() => {
        setIsShowOtp(true);
        setTimer(120);
      })
      .catch((error) => {
        Alert.alert(
          "Error",
          error.response?.data?.error || "You are not registered.",
          [
            { text: "Cancel" },
            {
              text: "Register",
              onPress: () => router.push("/register"),
            },
          ]
        );
      })
      .finally(() => setLoading(false));
  };

  const resendOtp = () => {
    if (resendAttempts >= 3) {
      Alert.alert("Limit Reached", "Max resend attempts exceeded.");
      return;
    }
    api
      .post("/auth/check-mobile", { mobile_number: mobile })
      .then(() => {
        setTimer(120);
        setPins(["", "", "", ""]);
      })
      .catch((error) => {
        Alert.alert(
          "Error",
          error.response?.data?.error || "Something went wrong."
        );
      });
    setResendAttempts((prev) => prev + 1);
  };

  if (isLoggedIn) return null;

  return (
    <ImageBackground
      source={theme.image.bg_image}
      style={styles.backgroundImage}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.container}
      >
        <View style={styles.formContainer}>
          <Image
            source={theme.image.transparentLogo}
            style={[styles.logo, { width: logoWidth }]}
            resizeMode="contain"
          />

          <Text style={styles.pageTitle}>Login</Text>

          {!isShowOtp ? (
            <>
              <PhoneInput
                value={mobile}
                onChangeText={setMobile}
                loading={loading}
              />
              <TouchableOpacity
                style={[
                  styles.loginButton,
                  loading && styles.loginButtonDisabled,
                ]}
                onPress={loginAxio}
                disabled={loading}
              >
                <Text style={styles.loginButtonText}>
                  {loading ? "Processing..." : "Get OTP"}
                </Text>
              </TouchableOpacity>
              <View style={styles.registerContainer}>
                <Text style={styles.registerText}>Don't have an account? </Text>
                <TouchableOpacity onPress={() => router.push("/register")}>
                  <Text style={styles.registerLink}>Register</Text>
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

              {/* OTP inputs + Eye button wrapper */}
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

              <Text style={styles.timerText}>Resend in {timer}s</Text>
              {timer === 0 && resendAttempts < 3 && (
                <TouchableOpacity onPress={resendOtp}>
                  <Text style={styles.resendText}>Resend OTP</Text>
                </TouchableOpacity>
              )}
              <TouchableOpacity
                style={[
                  styles.loginButton,
                  loading && styles.loginButtonDisabled,
                ]}
                onPress={() => verifyOtp(pins.join(""))}
                disabled={loading || pins.includes("")}
              >
                <Text style={styles.loginButtonText}>Submit</Text>
              </TouchableOpacity>
            </View>
          )}

          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <Text style={styles.backButtonText}>Back</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  backgroundImage: { flex: 1, resizeMode: "cover" },
  container: { flex: 1, justifyContent: "center" },
  formContainer: { paddingHorizontal: 20, alignItems: "center" },
  logo: { aspectRatio: 1, marginTop: 90 },
  pageTitle: {
    color: theme.colors.textLight,
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 20,
    textAlign: "left",
    alignSelf: "flex-start",
  },
  loginButton: {
    backgroundColor: theme.colors.secondary,
    padding: 15,
    borderRadius: 25,
    width: "100%",
    alignItems: "center",
    marginTop: 20,
  },
  loginButtonDisabled: { backgroundColor: "#cccccc" },
  loginButtonText: {
    color: theme.colors.textDark,
    fontSize: 18,
    fontWeight: "bold",
  },
  otpTitle: {
    color: theme.colors.textLight,
    fontSize: 18,
    marginBottom: 10,
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
    borderColor: theme.colors.white,
    borderRadius: 8,
    color: theme.colors.white,
    fontSize: 24,
    backgroundColor: theme.colors.otpBackground,
    textAlign: "center",
  },
  eyeButton: {
    position: "absolute",
    right: -40,
    top: 20,
  },
  registerContainer: { flexDirection: "row", marginTop: 20 },
  registerText: { color: theme.colors.white, fontSize: 16 },
  registerLink: {
    color: theme.colors.secondary,
    fontSize: 16,
    fontWeight: "bold",
    textDecorationLine: "underline",
  },
  timerText: { color: theme.colors.white, marginTop: 10 },
  resendText: {
    color: theme.colors.secondary,
    marginTop: 10,
    fontWeight: "bold",
  },
  backButton: { marginTop: 20 },
  backButtonText: {
    color: theme.colors.white,
    fontSize: 16,
    textDecorationLine: "underline",
  },
  otpSentText: {
    color: theme.colors.white,
    fontSize: 16,
    marginBottom: 20,
  },
  otpContainer: {
    alignItems: "center",
    marginVertical: 20,
    width: "100%",
  },
});
