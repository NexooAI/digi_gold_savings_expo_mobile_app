import React, { useRef, useState, useEffect } from "react";
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
} from "react-native";
import { useRouter } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as SecureStore from "expo-secure-store";
import * as Crypto from "expo-crypto";
import useGlobalStore from "@/store/global.store";
import { theme } from "@/constants/theme";
import { LinearGradient } from "expo-linear-gradient";
import { BlurView } from "expo-blur";
import Icon from "@expo/vector-icons/MaterialIcons";

export default function MpinVerify() {
  const [mpinPins, setMpinPins] = useState(["", "", "", ""]);
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { login, isLoggedIn, logout } = useGlobalStore();
  const { width } = Dimensions.get("window");
  const logoWidth = width * 0.3;
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

  // Redirect immediately if already logged in
  useEffect(() => {
    if (isLoggedIn) {
      router.replace("/(tabs)/home");
    }
  }, [isLoggedIn, router]);

  // Create refs for each of the 4 MPIN input fields
  const mpinInputRefs = [
    useRef(null),
    useRef(null),
    useRef(null),
    useRef(null),
  ];

  const verifyMPINCheck = async (inputMPIN) => {
    try {
      const salt = "someRandomSaltValue"; // This salt should match the one used when setting the MPIN
      // Retrieve the stored hashed MPIN from secure storage
      const storedHashedMPIN = await SecureStore.getItemAsync("user_mpin");
      if (!storedHashedMPIN) {
        console.error("No hashed MPIN found. Please set up your MPIN first.");
        return false;
      }
      // Hash the input MPIN with the salt
      const inputHashedMPIN = await Crypto.digestStringAsync(
        Crypto.CryptoDigestAlgorithm.SHA256,
        salt + inputMPIN
      );
      return storedHashedMPIN === inputHashedMPIN;
    } catch (error) {
      console.error("Error verifying MPIN:", error);
      return false;
    }
  };

  const verifyMpin = async (enteredMpin: string) => {
    setLoading(true);
    try {
      const isValid = await verifyMPINCheck(enteredMpin);
      if (isValid) {
        const token = await SecureStore.getItem("authToken");
        const userData = JSON.parse(
          (await AsyncStorage.getItem("userData")) || "{}"
        );

        if (token) {
          useGlobalStore.getState().login(token, {
            id: userData.user_id,
            name: userData.name,
            email: userData.email,
            mobile: userData.mobile_number,
            referralCode: userData.referralCode,
          });
          router.replace("/(tabs)/home");
        }
      } else {
        shakeError();
        Alert.alert("Error", "Incorrect MPIN. Please try again.");
        setMpinPins(["", "", "", ""]);
      }
    } catch (error) {
      console.error("Error verifying MPIN:", error);
      Alert.alert("Error", "Failed to verify MPIN. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleEnterMpinChange = (text, index) => {
    const newPins = [...mpinPins];
    newPins[index] = text;
    setMpinPins(newPins);

    if (text.length === 1 && index < 3) {
      mpinInputRefs[index + 1].current.focus();
    }
  };

  const handleMpinKeyPress = (e, index) => {
    if (e.nativeEvent.key === "Backspace" && !mpinPins[index] && index > 0) {
      const newPins = [...mpinPins];
      newPins[index - 1] = "";
      setMpinPins(newPins);
      mpinInputRefs[index - 1].current.focus();
    }
  };

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
          style={styles.container}
        >
          <View style={styles.formContainer}>
            <Image
              source={theme.image.transparentLogo}
              style={[styles.logo, { width: logoWidth }]}
              resizeMode="contain"
            />
            <View style={styles.titleContainer}>
              <Text style={styles.mpinTitle}>Enter MPIN</Text>
              <Text style={styles.mpinSubtitle}>
                Enter your 4-digit MPIN to access your account
              </Text>
            </View>

            <Animated.View 
              style={[
                styles.otpInputsContainer,
                {
                  transform: [{ translateX: shakeAnim }]
                }
              ]}
            >
              {mpinPins.map((pin, index) => (
                <View key={index} style={styles.inputWrapper}>
                  <TextInput
                    ref={mpinInputRefs[index]}
                    style={styles.otpInput}
                    keyboardType="numeric"
                    maxLength={1}
                    value={pin}
                    onChangeText={(text) => handleEnterMpinChange(text, index)}
                    onKeyPress={(e) => handleMpinKeyPress(e, index)}
                    secureTextEntry={true}
                  />
                  {pin !== "" && (
                    <View style={styles.inputDot} />
                  )}
                </View>
              ))}
            </Animated.View>

            <Animated.View
              style={{
                transform: [{ scale: scaleAnim }],
                width: '100%',
              }}
            >
              <TouchableOpacity
                style={[styles.loginButton, loading && styles.loginButtonDisabled]}
                onPress={() => {
                  animatePress();
                  verifyMpin(mpinPins.join(""));
                }}
                disabled={loading || mpinPins.includes("")}
              >
                <LinearGradient
                  colors={['#ffc90c', '#ffb700']}
                  style={styles.buttonGradient}
                >
                  <Text style={styles.loginButtonText}>
                    {loading ? "Processing..." : "Login"}
                  </Text>
                </LinearGradient>
              </TouchableOpacity>
            </Animated.View>

            <TouchableOpacity
              style={styles.forgotContainer}
              onPress={async () => {
                await SecureStore.deleteItemAsync("authToken");
                await SecureStore.deleteItemAsync("user_mpin");
                logout();
                setMpinPins(["", "", "", ""]);
                router.replace("/login");
              }}
            >
              <Icon name="help-outline" size={20} color="#ffc90c" />
              <Text style={styles.loginLink}>
                Forgot MPIN? Login with Mobile Number
              </Text>
            </TouchableOpacity>
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
    justifyContent: "center",
  },
  formContainer: {
    paddingHorizontal: 20,
    alignItems: "center",
  },
  logo: {
    aspectRatio: 1,
    marginTop: 60,
    marginBottom: 20,
  },
  titleContainer: {
    alignItems: 'center',
    marginBottom: 30,
  },
  mpinTitle: {
    color: "#fff",
    fontSize: 28,
    fontWeight: "bold",
    marginBottom: 10,
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  mpinSubtitle: {
    color: "#fff",
    fontSize: 16,
    textAlign: "center",
    opacity: 0.9,
  },
  otpInputsContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: "80%",
    marginBottom: 30,
  },
  inputWrapper: {
    position: 'relative',
    width: 60,
    height: 60,
  },
  otpInput: {
    width: '100%',
    height: '100%',
    borderWidth: 2,
    borderColor: "rgba(255, 255, 255, 0.3)",
    borderRadius: 15,
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    textAlign: "center",
    fontSize: 24,
    color: '#fff',
  },
  inputDot: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#ffc90c',
    transform: [{ translateX: -6 }, { translateY: -6 }],
  },
  loginButton: {
    width: "100%",
    height: 55,
    borderRadius: 28,
    overflow: 'hidden',
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 4.65,
    elevation: 8,
  },
  buttonGradient: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loginButtonDisabled: {
    opacity: 0.7,
  },
  loginButtonText: {
    color: "#2e0406",
    fontSize: 18,
    fontWeight: "bold",
  },
  forgotContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 20,
  },
  loginLink: {
    color: "#ffc90c",
    marginLeft: 8,
    fontWeight: "600",
    fontSize: 16,
  },
});
