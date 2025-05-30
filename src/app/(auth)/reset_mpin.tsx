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
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from 'expo-linear-gradient';
import api from "@/services/api";
import * as SecureStore from "expo-secure-store";
import * as Crypto from "expo-crypto";
import { theme } from "@/constants/theme";
import { moderateScale } from "react-native-size-matters";

const { width, height } = Dimensions.get("window");
const logoWidth = width * 0.25;
const salt = "someRandomSaltValue";

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
            ref={(ref) => {inputs.current[index] = ref}}
            style={[
              styles.mpinInput,
              value ? styles.mpinInputFilled : styles.mpinInputEmpty
            ]}
            keyboardType="number-pad"
            maxLength={1}
            secureTextEntry={secureTextEntry}
            value={value}
            onChangeText={(text) => handleChange(text, index)}
            onKeyPress={(e) => handleKeyPress(e, index)}
            textAlign="center"
          />
          {value && !secureTextEntry && (
            <View style={styles.inputIndicator} />
          )}
        </View>
      ))}
    </View>
  );
};

export default function ResetMpin() {
  const { name, email, mobile } = useLocalSearchParams();
  const router = useRouter();
  const [mpin, setMpin] = useState("");
  const [confirmMpin, setConfirmMpin] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPin, setShowPin] = useState(false);
  const [error, setError] = useState("");
  const [showError, setShowError] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    if (mpin.length === 4 && confirmMpin.length === 4) {
      setError(mpin !== confirmMpin ? "MPIN mismatch" : "");
    } else {
      setError("");
    }
  }, [mpin, confirmMpin]);

  const showErrorAlert = (message: string) => {
    setErrorMessage(message);
    setShowError(true);
    setTimeout(() => setShowError(false), 3000);
  };

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
          <View style={styles.errorAlert}>
            <View style={styles.errorContent}>
              <Ionicons name="alert-circle" size={24} color="#fff" />
              <Text style={styles.errorMessage}>{errorMessage}</Text>
            </View>
            <TouchableOpacity onPress={() => setShowError(false)} style={styles.closeButton}>
              <Ionicons name="close" size={20} color="#fff" />
            </TouchableOpacity>
          </View>
        )}
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={styles.container}
        >
          <View style={styles.formContainer}>
            <View style={styles.contentContainer}>
              <View style={styles.logoContainer}>
                <Image
                  source={theme.image.transparentLogo}
                  style={[styles.logo, { width: 100 }]}
                  resizeMode="contain"
                />
              </View>
              <View style={styles.cardContainer}>
                <Text style={styles.pageTitle}>Reset MPIN </Text>
                <Text style={styles.subtitle}>Create a new 4-digit MPIN to secure your account</Text>
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
                  style={[styles.submitButton, (error || loading || mpin.length < 4 || confirmMpin.length < 4) && styles.submitButtonDisabled]}
                  onPress={handleSubmit}
                  disabled={!!error || loading || mpin.length < 4 || confirmMpin.length < 4}
                >
                  <LinearGradient
                    colors={['#ffc90c', '#ffd700']}
                    style={styles.gradientButton}
                  >
                    <Text style={styles.submitButtonText}>
                      {loading ? "Processing..." : "Reset MPIN"}
                    </Text>
                  </LinearGradient>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.backButtonBottom}
                  onPress={() => router.back()}
                >
                  <Ionicons name="arrow-back" size={20} color={theme.colors.white} />
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
  container: {
    flex: 1,
  },
  backgroundImage: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  gradient: {
    flex: 1,
  },
  logoContainer: {
    width: '100%',
    alignItems: 'center',
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
    marginBottom: 10,
  },
  logo: {
    aspectRatio: 1,
  },
  formContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 0,
  },
  contentContainer: {
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
  },
  cardContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 20,
    padding: 20,
    width: '100%',
    maxWidth: 400,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    marginBottom: 0,
    alignItems: 'center',
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
      },
      android: {
        elevation: 8,
      },
    }),
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
  label: {
    color: theme.colors.textLight,
    fontSize: 16,
    marginBottom: 15,
    alignSelf: "stretch",
  },
  submitButton: {
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
  submitButtonDisabled: { 
    opacity: 0.6 
  },
  submitButtonText: {
    color: theme.colors.textDark,
    fontSize: 18,
    fontWeight: "bold",
  },
  eyeToggle: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 20,
    alignSelf: 'center',
  },
  eyeText: {
    color: theme.colors.secondary,
    marginLeft: 10,
    fontSize: 16,
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
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 107, 107, 0.15)',
    borderRadius: 8,
    padding: 10,
    marginBottom: 15,
    borderLeftWidth: 3,
    borderLeftColor: '#FF6B6B',
  },
  errorText: {
    color: '#FF6B6B',
    fontSize: 14,
    marginLeft: 8,
  },
  backButtonBottom: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 18,
  },
  backButtonText: {
    color: theme.colors.white,
    fontSize: 16,
    marginLeft: 5,
  },
  mpinContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 20,
  },
  inputWrapper: {
    position: 'relative',
  },
  mpinInput: {
    width: 55,
    height: 55,
    borderWidth: 2,
    borderRadius: 15,
    fontSize: moderateScale(20),
    fontWeight: 'bold',
    textAlign: 'center',
    color: '#FFFFFF',
  },
  mpinInputEmpty: {
    borderColor: 'rgba(255, 255, 255, 0.3)',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
  },
  mpinInputFilled: {
    borderColor: '#FFD700',
    backgroundColor: 'rgba(255, 215, 0, 0.1)',
  },
  inputIndicator: {
    position: 'absolute',
    bottom: 8,
    left: '50%',
    marginLeft: -3,
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#FFD700',
  },
});
