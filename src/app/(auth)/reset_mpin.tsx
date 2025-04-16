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
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import api from "../services/api";
import * as SecureStore from "expo-secure-store";
import * as Crypto from "expo-crypto";
import { theme } from "@/constants/theme";

const { width } = Dimensions.get("window");
const logoWidth = width * 0.3;
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
  const inputs = React.useRef<TextInput[]>([]);

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
        <TextInput
          key={index}
          ref={(ref) => (inputs.current[index] = ref!)}
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

export default function SetMpin() {
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
      Alert.alert("Error", "MPINs do not match!");
      return;
    }

    setLoading(true);
    try {
      await hashMPIN(mpin);
      Alert.alert("MPIN set successfully!");
      router.replace("/(tabs)/home");
      //   const response = await api.post("/complete-registration", {
      //     name,
      //     email,
      //     mobile_number: mobile,
      //     mpin,
      //     password: mpin,
      //   });
      //   if (response.status === 200) {
      //     Alert.alert("Success", "MPIN set successfully!");
      //     router.push({ pathname: "/(auth)/login", params: { mobile } });
      //   }
    } catch (error: any) {
      Alert.alert(
        "Error",
        error.response?.data?.message || "Registration failed"
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
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={Platform.OS === "ios" ? 60 : 0}
        style={styles.container}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContainer}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.contentContainer}>
            <Image
              source={theme.image.transparentLogo}
              style={[styles.logo, { width: logoWidth, aspectRatio: 1 }]}
              resizeMode="contain"
            />
            <Text style={styles.title}>Set MPIN</Text>

            <Text style={styles.label}>Enter MPIN</Text>
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

            {error ? <Text style={styles.errorText}>{error}</Text> : null}

            <TouchableOpacity
              style={styles.eyeToggle}
              onPress={() => setShowPin(!showPin)}
            >
              <Ionicons
                name={showPin ? "eye-off" : "eye"}
                size={24}
                color="#ffc90c"
              />
              <Text style={styles.eyeText}>
                {showPin ? "Hide MPIN" : "Show MPIN"}
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
              <Text style={styles.buttonText}>
                {loading ? "Processing..." : "Set MPIN"}
              </Text>
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
  contentContainer: {
    paddingHorizontal: 20,
    alignItems: "center",
  },
  logo: {
    aspectRatio: 1,
    marginTop: 90,
  },
  title: {
    color: "#fff",
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 30,
  },
  label: {
    color: "#fff",
    fontSize: 16,
    marginBottom: 15,
    alignSelf: "stretch",
  },
  mpinContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: "70%",
    marginBottom: 25,
  },
  mpinInput: {
    width: 50,
    height: 50,
    borderWidth: 1,
    borderColor: "#fff",
    borderRadius: 10,
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    color: "#fff",
    fontSize: 24,
  },
  eyeToggle: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 20,
  },
  eyeText: {
    color: "#ffc90c",
    marginLeft: 10,
    fontSize: 16,
  },
  button: {
    backgroundColor: "#ffc90c",
    paddingVertical: 15,
    borderRadius: 25,
    width: "100%",
    alignItems: "center",
  },
  disabledButton: {
    opacity: 0.6,
  },
  buttonText: {
    color: "#2e0406",
    fontSize: 18,
    fontWeight: "bold",
  },
  errorText: {
    color: "#ff4444",
    fontSize: 14,
    marginTop: 10,
  },
});
