import React, { useState, useEffect, useRef } from "react";
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
  NativeSyntheticEvent,
  TextInputKeyPressEventData,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import api from "@/services/api";
import * as SecureStore from "expo-secure-store";
import * as Crypto from "expo-crypto";
import { theme } from "@/constants/theme";
import { LinearGradient } from "expo-linear-gradient";
import { t } from "@/i18n";

const { width } = Dimensions.get("window");
const logoWidth = width * 0.3;
const salt = "someRandomSaltValue";

const hashMPIN = async (mpin: string): Promise<void> => {
  try {
    // Concatenate salt and mpin then hash using SHA-256.
    const hashedMPIN = await Crypto.digestStringAsync(
      Crypto.CryptoDigestAlgorithm.SHA256,
      salt + mpin
    );
    // Store hashedMPIN securely
    await SecureStore.setItemAsync("user_mpin", hashedMPIN);
    // You can also store the salt alongside the hashed MPIN if you need to verify later.
  } catch (error) {
    console.error("Error hashing MPIN:", error);
  }
};

interface MpinInputProps {
  length?: number;
  onComplete: (value: string) => void;
  secureTextEntry?: boolean;
}

const MpinInput: React.FC<MpinInputProps> = ({ length = 4, onComplete, secureTextEntry }) => {
  const [values, setValues] = useState<string[]>(Array(length).fill(""));
  const inputs = useRef<Array<TextInput | null>>(Array(length).fill(null));

  const handleChange = (text: string, index: number) => {
    const newValues = [...values];
    newValues[index] = text.slice(-1); // Only keep last character

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

  const handleKeyPress = (e: NativeSyntheticEvent<TextInputKeyPressEventData>, index: number) => {
    if (e.nativeEvent.key === "Backspace" && !values[index] && index > 0) {
      inputs.current[index - 1]?.focus();
    }
  };

  return (
    <View style={styles.mpinContainer}>
      {values.map((value, index) => (
        <TextInput
          key={index}
          ref={(ref) => {
            inputs.current[index] = ref;
          }}
          style={styles.mpinInput}
          keyboardType="number-pad"
          maxLength={1}
          secureTextEntry={secureTextEntry}
          value={value}
          onChangeText={(text) => handleChange(text, index)}
          onKeyPress={(e) => handleKeyPress(e, index)}
          textAlign="center"
        />
      ))}
    </View>
  );
};

export default function MpinSetup() {
  const { name, email, mobile } = useLocalSearchParams();
  const router = useRouter();
  const [mpin, setMpin] = useState("");
  const [confirmMpin, setConfirmMpin] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPin, setShowPin] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (mpin.length === 4 && confirmMpin.length === 4) {
      setError(mpin !== confirmMpin ? "MPIN mismatch" : "");
    } else {
      setError("");
    }
  }, [mpin, confirmMpin]);

  const handleSubmit = async () => {
    if (mpin !== confirmMpin) {
      Alert.alert(t("error"), t("mpinMismatchError"));
      return;
    }

    setLoading(true);
    try {
      await hashMPIN(mpin);

      const response = await api.post("/register/complete", {
        name,
        email,
        mobile_number: mobile,
        mpin,
        password: mpin,
      });

      if (response.status === 200) {
        Alert.alert(t("success"), t("mpinSetSuccess"));
        router.push({ pathname: "/(auth)/login", params: { mobile } });
      }
    } catch (error: any) {
      Alert.alert(
        t("error"),
        error.response?.data?.message || t("registrationFailed")
      );
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
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={styles.container}
          keyboardVerticalOffset={Platform.OS === "ios" ? 200 : 150}
        >
          <ScrollView
            contentContainerStyle={[styles.scrollContainer, { flexGrow: 1, justifyContent: 'center' }]}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.contentContainer}>
              <Image
                source={theme.image.transparentLogo}
                style={[styles.logo, { width: logoWidth, aspectRatio: 1 }]}
                resizeMode="contain"
              />

              <View style={styles.cardContainer}>
                <Text style={styles.title}>{t("setMpinTitle")}</Text>
                <Text style={styles.subtitle}>{t("setMpinSubtitle")}</Text>

                <View style={styles.inputSection}>
                  <Text style={styles.label}>{t("createMpinLabel")}</Text>
                  <MpinInput
                    length={4}
                    onComplete={setMpin}
                    secureTextEntry={!showPin}
                  />
                </View>

                <View style={styles.inputSection}>
                  <Text style={styles.label}>{t("confirmMpinLabel")}</Text>
                  <MpinInput
                    length={4}
                    onComplete={setConfirmMpin}
                    secureTextEntry={!showPin}
                  />
                </View>

                {error ? (
                  <View style={styles.errorContainer}>
                    <Ionicons name="alert-circle" size={20} color="#ff4444" />
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
                    {showPin ? t("hideMpinLabel") : t("showMpinLabel")}
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.button,
                    (error || loading) && styles.disabledButton,
                  ]}
                  onPress={handleSubmit}
                  disabled={!!error || loading}
                >
                  <LinearGradient
                    colors={['#ffc90c', '#ffd700']}
                    style={styles.gradientButton}
                  >
                    <Text style={styles.buttonText}>
                      {loading ? t("processing") : t("setMpinButton")}
                    </Text>
                  </LinearGradient>
                </TouchableOpacity>
              </View>
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
  contentContainer: {
    paddingHorizontal: 20,
    alignItems: "center",
  },
  logo: {
    aspectRatio: 1,
    marginTop: 90,
    marginBottom: 20,
  },
  cardContainer: {
    backgroundColor: 'rgba(26, 42, 57, 0.85)',
    borderRadius: 20,
    padding: 20,
    width: '100%',
    borderWidth: 1,
    borderColor: 'rgba(255, 201, 12, 0.3)',
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.3,
        shadowRadius: 12,
      },
      android: {
        elevation: 12,
      },
    }),
  },
  title: {
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
  inputSection: {
    marginBottom: 25,
  },
  label: {
    color: theme.colors.textLight,
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
  mpinInput: {
    width: 50,
    height: 50,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 12,
    backgroundColor: '#ffffff',
    color: '#000000',
    fontSize: 24,
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 68, 68, 0.1)',
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
    alignSelf: 'center',
  },
  eyeText: {
    color: theme.colors.secondary,
    marginLeft: 10,
    fontSize: 16,
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
  disabledButton: {
    opacity: 0.6,
  },
  buttonText: {
    color: theme.colors.textDark,
    fontSize: 18,
    fontWeight: "bold",
  },
});
