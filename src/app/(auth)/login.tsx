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
} from "react-native";
import { useFocusEffect, useRouter } from "expo-router";
import NetInfo from "@react-native-community/netinfo";
import PhoneInput from "../components/PhoneInputs";
import useGlobalStore from "@/store/global.store";
import api from "@/services/api";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as SecureStore from "expo-secure-store";
import SmsRetriever from "react-native-sms-retriever";
import { Feather, Ionicons } from "@expo/vector-icons";
import { theme } from "@/constants/theme";
import { LinearGradient } from "expo-linear-gradient";

const { width } = Dimensions.get("window");
const logoWidth = width * 0.3;

const ErrorAlert = ({ message, onClose }) => {
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
        styles.errorAlert,
        {
          transform: [{ translateY }],
          opacity,
        },
      ]}
    >
      <View style={styles.errorContent}>
        <Ionicons name="alert-circle" size={24} color="#fff" />
        <Text style={styles.errorMessage}>{message}</Text>
      </View>
      <TouchableOpacity onPress={onClose} style={styles.closeButton}>
        <Ionicons name="close" size={20} color="#fff" />
      </TouchableOpacity>
    </Animated.View>
  );
};

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
  const [errorMessage, setErrorMessage] = useState("");
  const [showError, setShowError] = useState(false);

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

  const showErrorAlert = (message) => {
    setErrorMessage(message);
    setShowError(true);
  };

  const hideErrorAlert = () => {
    setShowError(false);
  };

  const verifyOtp = (otp) => {
    setLoading(true);
    api
      .post("/auth/verify-otp", { mobile_number: mobile, otp })
      .then(async (res) => {
        console.log("OTP verification response:", res);
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
        showErrorAlert(error.response?.data?.error || "Invalid OTP");
      })
      .finally(() => setLoading(false));
  };

  const loginAxio = () => {
    const indianMobilePattern = /^[6-9]\d{9}$/;
    if (!mobile || !indianMobilePattern.test(mobile)) {
      showErrorAlert("Please enter a valid 10-digit mobile number.");
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
        showErrorAlert(error.response?.data?.error || "You are not registered.");
      })
      .finally(() => setLoading(false));
  };

  const resendOtp = () => {
    if (resendAttempts >= 3) {
      showErrorAlert("Max resend attempts exceeded.");
      return;
    }
    api
      .post("/auth/check-mobile", { mobile_number: mobile })
      .then(() => {
        setTimer(120);
        setPins(["", "", "", ""]);
      })
      .catch((error) => {
        showErrorAlert(error.response?.data?.error || "Something went wrong.");
      });
    setResendAttempts((prev) => prev + 1);
  };

  if (isLoggedIn) return null;

  return (
    <ImageBackground
      source={theme.image.bg_image}
      style={styles.backgroundImage}
    >
      <LinearGradient
        colors={['rgba(0,0,0,0.7)', 'rgba(0,0,0,0.5)', 'rgba(0,0,0,0.7)']}
        style={styles.gradient}
      >
        {showError && (
          <ErrorAlert message={errorMessage} onClose={hideErrorAlert} />
        )}
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

            <View style={styles.cardContainer}>
              <Text style={styles.pageTitle}>Welcome Back!</Text>
              <Text style={styles.subtitle}>Sign in to continue</Text>

              {!isShowOtp ? (
                <>
                  <View style={styles.inputContainer}>
                    <PhoneInput
                      value={mobile}
                      onChangeText={setMobile}
                      loading={loading}
                    />
                  </View>
                  <TouchableOpacity
                    style={[styles.loginButton, loading && styles.loginButtonDisabled]}
                    onPress={loginAxio}
                    disabled={loading}
                  >
                    <LinearGradient
                      colors={['#ffc90c', '#ffd700']}
                      style={styles.gradientButton}
                    >
                      <Text style={styles.loginButtonText}>
                        {loading ? "Processing..." : "Get OTP"}
                      </Text>
                    </LinearGradient>
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
                    <Ionicons name="time-outline" size={20} color={theme.colors.white} />
                    <Text style={styles.timerText}>Resend in {timer}s</Text>
                  </View>
                  
                  {timer === 0 && resendAttempts < 3 && (
                    <TouchableOpacity onPress={resendOtp} style={styles.resendButton}>
                      <Text style={styles.resendText}>Resend OTP</Text>
                    </TouchableOpacity>
                  )}
                  
                  <TouchableOpacity
                    style={[styles.loginButton, loading && styles.loginButtonDisabled]}
                    onPress={() => verifyOtp(pins.join(""))}
                    disabled={loading || pins.includes("")}
                  >
                    <LinearGradient
                      colors={['#ffc90c', '#ffd700']}
                      style={styles.gradientButton}
                    >
                      <Text style={styles.loginButtonText}>Submit</Text>
                    </LinearGradient>
                  </TouchableOpacity>
                </View>
              )}

              <TouchableOpacity
                style={styles.backButton}
                onPress={() => router.back()}
              >
                <Ionicons name="arrow-back" size={20} color={theme.colors.white} />
                <Text style={styles.backButtonText}>Back</Text>
              </TouchableOpacity>
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
    resizeMode: "cover" 
  },
  gradient: {
    flex: 1,
  },
  container: { 
    flex: 1, 
    justifyContent: "center" 
  },
  formContainer: { 
    paddingHorizontal: 20, 
    alignItems: "center" 
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
  loginButton: {
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
  loginButtonDisabled: { 
    opacity: 0.6 
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
    borderRadius: 12,
    color: theme.colors.white,
    fontSize: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    textAlign: "center",
  },
  eyeButton: {
    position: "absolute",
    right: -40,
    top: 20,
  },
  timerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 15,
  },
  timerText: { 
    color: theme.colors.white, 
    marginLeft: 8,
    fontSize: 16,
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
    marginTop: 20,
    justifyContent: 'center',
  },
  registerText: { 
    color: theme.colors.white, 
    fontSize: 16 
  },
  registerLink: {
    color: theme.colors.secondary,
    fontSize: 16,
    fontWeight: "bold",
    textDecorationLine: "underline",
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
  errorAlert: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 50 : 30,
    left: 20,
    right: 20,
    backgroundColor: 'rgba(255, 68, 68, 0.95)',
    borderRadius: 12,
    padding: 15,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    zIndex: 1000,
    shadowColor: '#000',
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
    flexDirection: 'row',
    alignItems: 'center',
  },
  errorMessage: {
    color: '#fff',
    fontSize: 16,
    marginLeft: 10,
    flex: 1,
  },
  closeButton: {
    padding: 5,
  },
});
