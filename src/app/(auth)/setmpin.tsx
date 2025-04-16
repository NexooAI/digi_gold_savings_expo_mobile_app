import React, { useEffect, useRef, useState } from "react";
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
  Keyboard,
} from "react-native";
import { useFocusEffect, useLocalSearchParams, useRouter } from "expo-router";
import * as SecureStore from "expo-secure-store";
import PhoneInput from "../components/PhoneInputs";
import { ActivityIndicator } from "react-native";
import { theme } from "@/constants/theme";

const { width } = Dimensions.get("window");
const logoWidth = width * 0.3; // 30% of screen width

export default function MpinLogin() {
  const { mobile } = useLocalSearchParams<{ mobile?: string }>();
  const [mobilePersistent, setMobilePersistent] = useState(mobile || "");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (mobile) {
      setMobilePersistent(mobile);
    }
  }, [mobile]);

  const router = useRouter();

  const [mpin, setMpin] = useState(["", "", "", ""]);
  const [confirmMpin, setConfirmMpin] = useState(["", "", "", ""]);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  useFocusEffect(
    React.useCallback(() => {
      setMpin(["", "", "", ""]);
      setConfirmMpin(["", "", "", ""]);
      setError("");
      setSuccess(false);
    }, [])
  );

  // Create refs for input fields
  // const mpinRefs = useRef<Array<TextInput | null>>([null, null, null, null]);
  const mpinRefs = Array.from({ length: 4 }, () => useRef(null));
  const confirmRefs = Array.from({ length: 4 }, () => useRef(null));

  // const confirmRefs = useRef<Array<TextInput | null>>([null, null, null, null]);

  const handlePinChange = (value, index, isConfirm = false) => {
    // Clear existing errors
    setError("");

    // Only allow numbers
    if (value && !/^\d+$/.test(value)) {
      return;
    }

    const pins = isConfirm ? [...confirmMpin] : [...mpin];
    pins[index] = value;

    if (isConfirm) {
      setConfirmMpin(pins);
    } else {
      setMpin(pins);
    }

    // Auto-focus next input
    if (value.length === 1 && index < 3) {
      const nextRef = isConfirm ? confirmRefs[index + 1] : mpinRefs[index + 1];
      nextRef.current.focus();
    }
  };

  const handleKeyPress = (e, index, isConfirm = false) => {
    // Handle backspace
    if (e.nativeEvent.key === "Backspace" && index > 0) {
      const pins = isConfirm ? confirmMpin : mpin;
      if (pins[index] === "") {
        const prevRef = isConfirm
          ? confirmRefs[index - 1]
          : mpinRefs[index - 1];
        prevRef.current.focus();
      }
    }
  };

  const handleSubmit = async () => {
    Keyboard.dismiss();
    setError("");
    setLoading(true);

    // Validation checks
    const mpinValue = mpin.join("");
    const confirmValue = confirmMpin.join("");

    if (mpinValue.length !== 4 || confirmValue.length !== 4) {
      setError("M-PIN must be 4 digits");
      setLoading(false);
      return;
    }

    if (!/^\d+$/.test(mpinValue)) {
      setError("M-PIN can only contain numbers");
      setLoading(false);
      return;
    }

    if (mpinValue !== confirmValue) {
      setError("M-PIN and Confirm M-PIN do not match");
      setLoading(false);
      return;
    }

    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1000));
      setSuccess(true);
      setLoading(false);
      router.push({
        pathname: "/(auth)/kyc",
        params: {
          mobile: mobile,
        },
      });
    } catch (err) {
      setError("Failed to set M-PIN. Please try again.");
      setLoading(false);
    }
  };

  const handleLogin = async () => {
    router.replace("/(tabs)/home");
  };
  const [pins, setPins] = useState(["", "", "", ""]);
  const inputRefs = [useRef(null), useRef(null), useRef(null), useRef(null)];

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
            style={[styles.logo, { width: logoWidth, aspectRatio: 1 }]}
            resizeMode="contain"
          />

          <View style={styles.inputContainer}>
            <Text style={styles.label}>M-PIN</Text>
            <View style={styles.pinContainer}>
              {mpin.map((pin, index) => (
                <TextInput
                  key={`mpin-${index}`}
                  ref={mpinRefs[index]}
                  style={styles.input}
                  maxLength={1}
                  keyboardType="numeric"
                  secureTextEntry
                  value={pin}
                  onChangeText={(value) => handlePinChange(value, index)}
                  onKeyPress={(e) => handleKeyPress(e, index)}
                />
              ))}
            </View>
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Confirm M-PIN</Text>
            <View style={styles.pinContainer}>
              {confirmMpin.map((pin, index) => (
                <TextInput
                  key={`confirm-${index}`}
                  ref={confirmRefs[index]}
                  style={styles.input}
                  maxLength={1}
                  keyboardType="numeric"
                  secureTextEntry
                  value={pin}
                  onChangeText={(value) => handlePinChange(value, index, true)}
                  onKeyPress={(e) => handleKeyPress(e, index, true)}
                />
              ))}
            </View>
          </View>

          {error ? (
            <Text style={styles.errorText}>{error}</Text>
          ) : success ? (
            <Text style={styles.successText}>M-PIN set successfully!</Text>
          ) : null}

          <TouchableOpacity
            style={[
              styles.loginButton,
              (loading || success) && styles.buttonDisabled,
            ]}
            onPress={handleSubmit}
            disabled={loading || success}
          >
            {loading ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text className="font-bold text-xl">Set M-PIN</Text>
            )}
          </TouchableOpacity>

          {/* <TouchableOpacity
            style={[styles.loginButton, loading && styles.loginButtonDisabled]}
            onPress={handleLogin}
            disabled={loading}
          >
            <Text style={styles.loginButtonText}>
              {loading ? "Logging in..." : "Set MPIN"}
            </Text>
          </TouchableOpacity> */}

          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
            disabled={loading}
          >
            <Text style={styles.backButtonText}>Back</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  backgroundImage: {
    flex: 1,
    resizeMode: "cover",
  },
  //   container: {
  //     flex: 1,
  //     justifyContent: "center",
  //   },
  formContainer: {
    paddingHorizontal: 20,
    // alignItems: "center",
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#fff",
    marginBottom: 30,
  },

  loginButton: {
    backgroundColor: "#ffc90c",
    paddingVertical: 15,
    paddingHorizontal: 40,
    borderRadius: 25,
    marginVertical: 10,
    width: "100%",
    alignItems: "center",
  },
  loginButtonDisabled: {
    backgroundColor: "#cccccc",
  },
  loginButtonText: {
    color: "#2e0406",
    fontSize: 18,
    fontWeight: "bold",
  },
  backButton: {
    marginTop: 10,
    padding: 10,
    alignItems: "center",
  },
  backButtonText: {
    color: "#fff",
    fontSize: 16,
  },
  logo: {},

  container: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: "100%",
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  input1: {
    width: 50,
    height: 50,
    borderWidth: 1,
    borderColor: "#ffffff",
    borderRadius: 8,
    fontSize: 24,
    color: "#ffffff",
  },

  // container: {
  //   padding: 20,
  //   width: '100%',
  // },
  inputContainer: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: "500",
    marginBottom: 10,
    color: "#fff",
  },
  pinContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: "100%",
  },
  input: {
    width: 50,
    height: 50,
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    textAlign: "center",
    fontSize: 20,
    backgroundColor: "#fff",
  },
  button: {
    backgroundColor: "#007AFF",
    padding: 15,
    borderRadius: 8,
    alignItems: "center",
    marginTop: 20,
  },
  buttonDisabled: {
    backgroundColor: "#999",
  },
  buttonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  errorText: {
    color: "#FF3B30",
    marginTop: 10,
    textAlign: "center",
    fontSize: 20,
    fontWeight: "bold",
  },
  successText: {
    color: "#34C759",
    marginTop: 10,
    textAlign: "center",
    fontSize: 20,
    fontWeight: "bold",
  },
});
