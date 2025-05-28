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
  Animated,
  Easing,
} from "react-native";
import { useFocusEffect, useLocalSearchParams, useRouter } from "expo-router";
import * as SecureStore from "expo-secure-store";
import PhoneInput from "../components/PhoneInputs";
import { ActivityIndicator } from "react-native";
import { theme } from "@/constants/theme";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";

const { width } = Dimensions.get("window");
const logoWidth = width * 0.3; // 30% of screen width

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

const AnimatedPinInput = ({ value, isActive, onPress }) => {
  const scaleAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (isActive) {
      Animated.sequence([
        Animated.timing(scaleAnim, {
          toValue: 1.1,
          duration: 100,
          useNativeDriver: true,
        }),
        Animated.timing(scaleAnim, {
          toValue: 1,
          duration: 100,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [isActive]);

  return (
    <TouchableOpacity onPress={onPress}>
      <Animated.View
        style={[
          styles.pinInput,
          {
            transform: [{ scale: scaleAnim }],
            backgroundColor: isActive ? 'rgba(255, 201, 12, 0.2)' : 'rgba(255, 255, 255, 0.1)',
          },
        ]}
      >
        <Text style={styles.pinText}>{value}</Text>
      </Animated.View>
    </TouchableOpacity>
  );
};

export default function MpinLogin() {
  const { mobile } = useLocalSearchParams<{ mobile?: string }>();
  const [mobilePersistent, setMobilePersistent] = useState(mobile || "");
  const [loading, setLoading] = useState(false);
  const [showError, setShowError] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [showPin, setShowPin] = useState(false);
  const [activeInput, setActiveInput] = useState(0);

  useEffect(() => {
    if (mobile) {
      setMobilePersistent(mobile);
    }
  }, [mobile]);

  const router = useRouter();

  const [mpin, setMpin] = useState(["", "", "", ""]);
  const [confirmMpin, setConfirmMpin] = useState(["", "", "", ""]);
  const [success, setSuccess] = useState(false);

  useFocusEffect(
    React.useCallback(() => {
      setMpin(["", "", "", ""]);
      setConfirmMpin(["", "", "", ""]);
      setShowError(false);
      setSuccess(false);
    }, [])
  );

  // Create refs for input fields
  // const mpinRefs = useRef<Array<TextInput | null>>([null, null, null, null]);
  const mpinRefs = Array.from({ length: 4 }, () => useRef(null));
  const confirmRefs = Array.from({ length: 4 }, () => useRef(null));

  // const confirmRefs = useRef<Array<TextInput | null>>([null, null, null, null]);

  const showErrorAlert = (message) => {
    setErrorMessage(message);
    setShowError(true);
  };

  const hideErrorAlert = () => {
    setShowError(false);
  };

  const handlePinChange = (value, index, isConfirm = false) => {
    setShowError(false);
    setActiveInput(index);

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

    if (value.length === 1 && index < 3) {
      const nextRef = isConfirm ? confirmRefs[index + 1] : mpinRefs[index + 1];
      nextRef.current?.focus();
    }
  };

  const handleKeyPress = (e, index, isConfirm = false) => {
    if (e.nativeEvent.key === "Backspace" && index > 0) {
      const pins = isConfirm ? confirmMpin : mpin;
      if (pins[index] === "") {
        const prevRef = isConfirm ? confirmRefs[index - 1] : mpinRefs[index - 1];
        prevRef.current?.focus();
      }
    }
  };

  const handleSubmit = async () => {
    Keyboard.dismiss();
    setShowError(false);
    setLoading(true);

    const mpinValue = mpin.join("");
    const confirmValue = confirmMpin.join("");

    if (mpinValue.length !== 4 || confirmValue.length !== 4) {
      showErrorAlert("M-PIN must be 4 digits");
      setLoading(false);
      return;
    }

    if (!/^\d+$/.test(mpinValue)) {
      showErrorAlert("M-PIN can only contain numbers");
      setLoading(false);
      return;
    }

    if (mpinValue !== confirmValue) {
      showErrorAlert("M-PIN and Confirm M-PIN do not match");
      setLoading(false);
      return;
    }

    try {
      await new Promise((resolve) => setTimeout(resolve, 1000));
      setSuccess(true);
      setLoading(false);
      router.push({
        pathname: "/(auth)/kyc",
        params: { mobile },
      });
    } catch (err) {
      showErrorAlert("Failed to set M-PIN. Please try again.");
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
              style={[styles.logo, { width: logoWidth, aspectRatio: 1 }]}
              resizeMode="contain"
            />

            <View style={styles.cardContainer}>
              <Text style={styles.title}>Set M-PIN</Text>
              <Text style={styles.subtitle}>Create a secure M-PIN for your account</Text>

              <View style={styles.inputSection}>
                <Text style={styles.label}>Enter M-PIN</Text>
                <View style={styles.pinContainer}>
                  {mpin.map((pin, index) => (
                    <AnimatedPinInput
                      key={`mpin-${index}`}
                      value={pin}
                      isActive={activeInput === index}
                      onPress={() => mpinRefs[index].current?.focus()}
                    />
                  ))}
                </View>
                <TextInput
                  style={styles.hiddenInput}
                  ref={mpinRefs[0]}
                  keyboardType="numeric"
                  maxLength={4}
                  value={mpin.join("")}
                  onChangeText={(value) => {
                    const newPins = value.split("").slice(0, 4);
                    while (newPins.length < 4) newPins.push("");
                    setMpin(newPins);
                  }}
                />
              </View>

              <View style={styles.inputSection}>
                <Text style={styles.label}>Confirm M-PIN</Text>
                <View style={styles.pinContainer}>
                  {confirmMpin.map((pin, index) => (
                    <AnimatedPinInput
                      key={`confirm-${index}`}
                      value={pin}
                      isActive={activeInput === index + 4}
                      onPress={() => confirmRefs[index].current?.focus()}
                    />
                  ))}
                </View>
                <TextInput
                  style={styles.hiddenInput}
                  ref={confirmRefs[0]}
                  keyboardType="numeric"
                  maxLength={4}
                  value={confirmMpin.join("")}
                  onChangeText={(value) => {
                    const newPins = value.split("").slice(0, 4);
                    while (newPins.length < 4) newPins.push("");
                    setConfirmMpin(newPins);
                  }}
                />
              </View>

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
                  {showPin ? "Hide M-PIN" : "Show M-PIN"}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.button, loading && styles.buttonDisabled]}
                onPress={handleSubmit}
                disabled={loading}
              >
                <LinearGradient
                  colors={['#ffc90c', '#ffd700']}
                  style={styles.gradientButton}
                >
                  {loading ? (
                    <ActivityIndicator color={theme.colors.textDark} />
                  ) : (
                    <Text style={styles.buttonText}>Set M-PIN</Text>
                  )}
                </LinearGradient>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.backButton}
                onPress={() => router.back()}
                disabled={loading}
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
    resizeMode: "cover",
  },
  gradient: {
    flex: 1,
  },
  container: {
    flex: 1,
  },
  formContainer: {
    paddingHorizontal: 20,
    alignItems: "center",
  },
  cardContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 20,
    padding: 20,
    width: '100%',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  logo: {
    marginTop: 90,
    marginBottom: 20,
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
  },
  pinContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: "70%",
    alignSelf: "center",
  },
  pinInput: {
    width: 50,
    height: 50,
    borderWidth: 1,
    borderColor: theme.colors.white,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  pinText: {
    color: theme.colors.white,
    fontSize: 24,
    fontWeight: 'bold',
  },
  hiddenInput: {
    position: 'absolute',
    opacity: 0,
    height: 0,
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
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: theme.colors.textDark,
    fontSize: 18,
    fontWeight: "bold",
  },
  backButton: {
    marginTop: 20,
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'center',
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
