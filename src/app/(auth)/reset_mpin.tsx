import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ImageBackground,
  KeyboardAvoidingView,
  Platform,
  Image,
  Dimensions,
  ScrollView,
  TextInput,
  StatusBar,
  TouchableWithoutFeedback,
  Keyboard,
  Pressable,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import api from "@/services/api";
import * as SecureStore from "expo-secure-store";
import * as Crypto from "expo-crypto";
import { theme } from "@/constants/theme";
import { moderateScale } from "react-native-size-matters";

const { width } = Dimensions.get("window");
const logoWidth = width * 0.3;
const salt = "someRandomSaltValue";

// Error Alert Component
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

const hashMPIN = async (mpin: string) => {
  try {
    // Concatenate salt and mpin then hash using SHA-256.
    const hashedMPIN = await Crypto.digestStringAsync(
      Crypto.CryptoDigestAlgorithm.SHA256,
      salt + mpin
    );
    // Store the hashed MPIN securely
    await SecureStore.setItemAsync("user_mpin", hashedMPIN);
  } catch (error) {
    console.error("Error hashing MPIN:", error);
  }
};

interface MpinInputProps {
  length?: number;
  onComplete: (value: string) => void;
  secureTextEntry: boolean;
}

const MpinInput: React.FC<MpinInputProps> = ({
  length = 4,
  onComplete,
  secureTextEntry,
}) => {
  const [values, setValues] = useState(Array(length).fill(""));
  const inputs = React.useRef<(TextInput | null)[]>([]);

  const handleChange = (text: string, index: number) => {
    const newValues = [...values];
    newValues[index] = text.slice(-1); // Only keep the last character

    // Auto-focus next input if value entered
    if (text && index < length - 1) {
      inputs.current[index + 1]?.focus();
    }

    // Move focus back if deleted
    if (!text && index > 0) {
      inputs.current[index - 1]?.focus();
    }

    setValues(newValues);
    onComplete(newValues.join(""));
  };

  const handleKeyPress = (
    { nativeEvent }: { nativeEvent: { key: string } },
    index: number
  ) => {
    if (nativeEvent.key === "Backspace" && !values[index] && index > 0) {
      inputs.current[index - 1]?.focus();
    }
  };

  return (
    <View style={styles.mpinContainer}>
      {values.map((value, index) => (
        <View key={index} style={styles.inputWrapper}>
          <TextInput
            ref={(ref) => {
              inputs.current[index] = ref;
            }}
            style={[
              styles.mpinInput,
              value ? styles.mpinInputFilled : styles.mpinInputEmpty,
            ]}
            keyboardType="number-pad"
            maxLength={1}
            secureTextEntry={secureTextEntry}
            value={value}
            onChangeText={(text) => handleChange(text, index)}
            onKeyPress={(e) => handleKeyPress(e, index)}
            textAlign="center"
          />
          {value && !secureTextEntry && <View style={styles.inputIndicator} />}
        </View>
      ))}
    </View>
  );
};

export default function ResetMpin() {
  const { name, email, mobile, mode, from } = useLocalSearchParams();

  const router = useRouter();
  const [mpin, setMpin] = useState("");
  const [confirmMpin, setConfirmMpin] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPin, setShowPin] = useState(false);
  const [error, setError] = useState("");
  const [showError, setShowError] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const isCreatingMPIN = mode === "create";
  const fromLogin = from === "login";

  const hideErrorAlert = () => {
    setShowError(false);
  };

  const showErrorAlert = (message: string) => {
    setErrorMessage(message);
    setShowError(true);
    setTimeout(() => setShowError(false), 3000);
  };

  useEffect(() => {
    if (mpin.length === 4 && confirmMpin.length === 4) {
      setError(mpin !== confirmMpin ? "MPIN mismatch" : "");
    } else {
      setError("");
    }
  }, [mpin, confirmMpin]);

  const handleSubmit = async () => {
    if (mpin !== confirmMpin) {
      showErrorAlert("MPINs do not match!");
      return;
    }
    setLoading(true);
    try {
      await hashMPIN(mpin);
      showErrorAlert("MPIN reset successfully!");
      setTimeout(() => router.replace("/(tabs)/home"), 1000);
    } catch (error: any) {
      showErrorAlert(error.response?.data?.message || "Reset failed");
    } finally {
      setLoading(false);
    }
  };

  const dismissKeyboard = () => {
    Keyboard.dismiss();
  };

  return (
    <Pressable style={{ flex: 1 }} onPress={dismissKeyboard}>
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
                  <Text style={styles.pageTitle}>
                    {isCreatingMPIN ? "Create MPIN" : "Reset MPIN"}
                  </Text>
                  <Text style={styles.subtitle}>
                    {isCreatingMPIN
                      ? "Create a new 4-digit MPIN to secure your account"
                      : "Enter your new MPIN to reset it"}
                  </Text>
                  <Text style={styles.label}>New MPIN</Text>
                  <MpinInput
                    length={4}
                    onComplete={setMpin}
                    secureTextEntry={!showPin}
                  />
                  <Text style={styles.label}>Confirm MPIN</Text>
                  <MpinInput
                    length={4}
                    onComplete={setConfirmMpin}
                    secureTextEntry={!showPin}
                  />
                  {error ? (
                    <View style={styles.errorContainer}>
                      <Ionicons name="alert-circle" size={16} color="#FF6B6B" />
                      <Text style={styles.errorText}>{error}</Text>
                    </View>
                  ) : null}
                  <TouchableOpacity
                    style={styles.eyeToggle}
                    onPress={() => setShowPin(!showPin)}
                  >
                    <Ionicons
                      name={showPin ? "eye-off" : "eye"}
                      size={24}
                      color={theme.colors.secondary}
                    />
                    <Text style={styles.eyeText}>
                      {showPin ? "Hide MPIN" : "Show MPIN"}
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[
                      styles.submitButton,
                      (error ||
                        loading ||
                        mpin.length < 4 ||
                        confirmMpin.length < 4) &&
                        styles.submitButtonDisabled,
                    ]}
                    onPress={handleSubmit}
                    disabled={
                      !!error ||
                      loading ||
                      mpin.length < 4 ||
                      confirmMpin.length < 4
                    }
                  >
                    <LinearGradient
                      colors={["#ffc90c", "#ffd700"]}
                      style={styles.gradientButton}
                    >
                      <Text style={styles.submitButtonText}>
                        {loading ? "Processing..." : isCreatingMPIN ?"Create MPIN" :"Reset MPIN"}
                      </Text>
                    </LinearGradient>
                  </TouchableOpacity>
                  {!isCreatingMPIN && (
                    <TouchableOpacity
                      style={styles.backButton}
                      onPress={() => router.back()}
                    >
                      <Ionicons
                        name="arrow-back"
                        size={20}
                        color={theme.colors.white}
                      />
                      <Text style={styles.backButtonText}>Back</Text>
                    </TouchableOpacity>
                  )}
                </View>
              </View>
            </View>
          </KeyboardAvoidingView>
        </LinearGradient>
      </ImageBackground>
    </Pressable>
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
  label: {
    color: "#ffffff",
    fontSize: 16,
    marginBottom: 15,
    alignSelf: "stretch",
  },
  mpinContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: "70%",
    alignSelf: "center",
  },
  inputWrapper: {
    position: "relative",
  },
  mpinInput: {
    width: 50,
    height: 50,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.2)",
    borderRadius: 12,
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    color: "#ffffff",
    fontSize: 24,
    textAlign: "center",
  },
  mpinInputEmpty: {
    borderColor: "rgba(255, 255, 255, 0.2)",
    backgroundColor: "rgba(255, 255, 255, 0.1)",
  },
  mpinInputFilled: {
    borderColor: theme.colors.secondary,
    backgroundColor: "rgba(255, 215, 0, 0.1)",
  },
  inputIndicator: {
    position: "absolute",
    bottom: 8,
    left: "50%",
    marginLeft: -3,
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: theme.colors.secondary,
  },
  errorContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255, 68, 68, 0.1)",
    padding: 10,
    borderRadius: 8,
    marginBottom: 20,
  },
  errorText: {
    color: "#ff4444",
    fontSize: 14,
    marginLeft: 8,
  },
  eyeToggle: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 20,
    alignSelf: "center",
  },
  eyeText: {
    color: theme.colors.secondary,
    marginLeft: 10,
    fontSize: 16,
  },
  submitButton: {
    width: "100%",
    height: 50,
    borderRadius: 25,
    overflow: "hidden",
    marginTop: 20,
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
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitButtonText: {
    color: theme.colors.textDark,
    fontSize: 18,
    fontWeight: "bold",
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
