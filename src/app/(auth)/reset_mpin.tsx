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
import { registerStyles as styles } from "../../_styles/registerStyles";

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
        {/* Dark overlay for background, if needed for consistency */}
        {/* <View style={styles.darkOverlay} /> */}
        <LinearGradient
          colors={["rgba(32, 1, 1, 0)", "rgba(167, 0, 0, 0)", "rgba(118, 1, 1, 0)"]}
          style={styles.gradient}
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
              <View style={styles.logoContainer}>
                <Image
                  source={theme.image.transparentLogo}
                  style={styles.logo}
                  resizeMode="contain"
                />
              </View>
              <View style={styles.formContainer}>
                <View style={styles.cardContainer}>
                  {/* Base fog layer */}
                  <LinearGradient
                    colors={[
                      "rgba(6, 2, 2, 0.78)",
                      "rgba(34, 0, 0, 0.35)",
                      "rgba(31, 3, 3, 0.54)",
                    ]}
                    style={StyleSheet.absoluteFill}
                  />
                  {/* Top fog highlight */}
                  <LinearGradient
                    colors={[
                      "rgba(10, 2, 2, 0.38)",
                      "rgba(76, 63, 63, 0.74)",
                    ]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 0, y: 0.5 }}
                    style={StyleSheet.absoluteFill}
                  />
                  {/* Bottom fog highlight */}
                  <LinearGradient
                    colors={[
                      "rgba(0, 0, 0, 0.44)",
                      "rgba(0, 0, 0, 0.28)",
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
                    <View style={{ height: 16 }} />
                    <Text style={styles.label}>Confirm MPIN</Text>
                    <MpinInput
                      length={4}
                      onComplete={setConfirmMpin}
                      secureTextEntry={!showPin}
                    />
                    <View style={{ height: 16 }} />
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
                        styles.loginButton,
                        (error ||
                          loading ||
                          mpin.length < 4 ||
                          confirmMpin.length < 4) &&
                          styles.loginButtonDisabled,
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
                        <Text style={styles.loginButtonText}>
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
            </ScrollView>
          </KeyboardAvoidingView>
        </LinearGradient>
      </ImageBackground>
    </Pressable>
  );
}
