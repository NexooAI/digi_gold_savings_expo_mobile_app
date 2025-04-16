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
} from "react-native";
import { useRouter } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as SecureStore from "expo-secure-store";
import * as Crypto from "expo-crypto";
import useGlobalStore from "@/store/global.store";
import { theme } from "@/constants/theme";

export default function MpinVerify() {
  const [mpinPins, setMpinPins] = useState(["", "", "", ""]);
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { login, isLoggedIn, logout } = useGlobalStore();
  const { width } = Dimensions.get("window");
  const logoWidth = width * 0.3;

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

  const verifyMpin = async (enteredMpin) => {
    setLoading(true);
    try {
      const isValid = await verifyMPINCheck(enteredMpin);
      if (isValid) {
        Alert.alert("Success", "MPIN verified successfully!");

        // const token = await AsyncStorage.getItem("userToken");
        const token = await SecureStore.getItem("authToken");
        const userData = JSON.parse(
          (await AsyncStorage.getItem("userData")) || "{}"
        );

        // Update global login state
        useGlobalStore.getState().login(token, {
          id: userData.user_id,
          name: userData.name,
          email: userData.email,
          mobile: userData.mobile_number,
          referralCode: userData.referralCode,
        });
        // Replace current screen with home
        router.replace("/(tabs)/home");
      } else {
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
          <Text style={styles.mpinTitle}>Enter MPIN</Text>
          <Text style={styles.mpinSubtitle}>
            Enter your 4-digit MPIN to access your account
          </Text>
          <View style={styles.otpInputsContainer}>
            {mpinPins.map((pin, index) => (
              <TextInput
                key={index}
                ref={mpinInputRefs[index]}
                style={styles.otpInput}
                keyboardType="numeric"
                maxLength={1}
                value={pin}
                onChangeText={(text) => handleEnterMpinChange(text, index)}
                onKeyPress={(e) => handleMpinKeyPress(e, index)}
                secureTextEntry={true}
              />
            ))}
          </View>
          <TouchableOpacity
            style={[styles.loginButton, loading && styles.loginButtonDisabled]}
            onPress={() => verifyMpin(mpinPins.join(""))}
            disabled={loading || mpinPins.includes("")}
          >
            <Text style={styles.loginButtonText}>
              {loading ? "Processing..." : "Login"}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={async () => {
              //   await AsyncStorage.removeItem("userToken");
              await SecureStore.deleteItemAsync("authToken");
              await SecureStore.deleteItemAsync("user_mpin");
              logout();
              setMpinPins(["", "", "", ""]);
              router.replace("/login");
            }}
          >
            <Text style={styles.loginLink}>
              Forgot MPIN? Login with Mobile Number
            </Text>
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
  mpinTitle: {
    color: "#fff",
    fontSize: 22,
    fontWeight: "bold",
    marginBottom: 10,
  },
  mpinSubtitle: {
    color: "#fff",
    fontSize: 16,
    marginBottom: 20,
    textAlign: "center",
  },
  otpInputsContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: "70%",
    alignSelf: "center",
    marginTop: 10,
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
    textAlign: "center",
  },
  loginButton: {
    backgroundColor: "#ffc90c",
    padding: 15,
    borderRadius: 25,
    width: "100%",
    alignItems: "center",
    marginTop: 20,
  },
  loginButtonDisabled: { backgroundColor: "#cccccc" },
  loginButtonText: { color: "#2e0406", fontSize: 18, fontWeight: "bold" },
  loginLink: {
    color: "#ffc90c",
    marginTop: 20,
    fontWeight: "bold",
    textDecorationLine: "underline",
  },
});
