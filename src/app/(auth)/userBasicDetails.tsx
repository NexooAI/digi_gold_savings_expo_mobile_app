import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ImageBackground,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  Dimensions,
  Image,
} from "react-native";
import { useFocusEffect, useRouter } from "expo-router";
import { useLocalSearchParams } from "expo-router";
import { theme } from "@/constants/theme";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";

const { width } = Dimensions.get("window");
const logoWidth = width * 0.3;

// Error Alert Component (matching login page)
const ErrorAlert = ({ message, onClose }: { message: string; onClose: () => void }) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, 3000);

    return () => clearTimeout(timer);
  }, []);

  return (
    <View style={styles.errorAlert}>
      <View style={styles.errorContent}>
        <Ionicons name="alert-circle" size={24} color="#fff" />
        <Text style={styles.errorMessage}>{message}</Text>
      </View>
      <TouchableOpacity onPress={onClose} style={styles.closeButton}>
        <Ionicons name="close" size={20} color="#fff" />
      </TouchableOpacity>
    </View>
  );
};

const GlassmorphismCard = ({ children }: { children: React.ReactNode }) => {
  return (
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
      <View style={styles.cardContent}>{children}</View>
    </View>
  );
};

export default function BasicDetailsForm() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [referralCode, setReferralCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [showError, setShowError] = useState(false);
  const [nameError, setNameError] = useState("");
  const [emailError, setEmailError] = useState("");
  const [referralError, setReferralError] = useState("");
  
  const router = useRouter();
  const { mobile } = useLocalSearchParams();
  const mobileStr = Array.isArray(mobile) ? mobile[0] : mobile || "";

  useFocusEffect(
    React.useCallback(() => {
      setName("");
      setEmail("");
      setReferralCode("");
      setNameError("");
      setEmailError("");
      setReferralError("");
    }, [])
  );

  const showErrorAlert = (message: string) => {
    setErrorMessage(message);
    setShowError(true);
  };

  const hideErrorAlert = () => {
    setShowError(false);
  };

  const validateName = (value: string) => {
    if (!value.trim()) {
      setNameError("Please enter your full name");
      return false;
    }
    if (value.trim().length < 2) {
      setNameError("Name must be at least 2 characters");
      return false;
    }
    setNameError("");
    return true;
  };

  const validateEmail = (value: string) => {
    if (!value.trim()) {
      setEmailError("Please enter your email address");
      return false;
    }
    if (!/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/.test(value)) {
      setEmailError("Please enter a valid email address");
      return false;
    }
    setEmailError("");
    return true;
  };

  const validateReferralCode = (value: string) => {
    if (value && value.length > 0 && value.length < 6) {
      setReferralError("Referral code must be 6 characters");
      return false;
    }
    if (value && !/^[A-Z0-9]{6}$/.test(value)) {
      setReferralError("Invalid referral code format");
      return false;
    }
    setReferralError("");
    return true;
  };

  const validateForm = () => {
    const isNameValid = validateName(name);
    const isEmailValid = validateEmail(email);
    const isReferralValid = validateReferralCode(referralCode);

    return isNameValid && isEmailValid && isReferralValid;
  };

  const handleSubmit = () => {
    if (validateForm()) {
      setLoading(true);
      setTimeout(() => {
        router.push({
          pathname: "/(auth)/setmpin",
          params: {
            name: name.trim(),
            email: email.trim(),
            mobile: mobile,
            referral_code: referralCode.trim(),
          },
        });
        setLoading(false);
      }, 500);
    }
  };

  const handleReferralCodeChange = (text: string) => {
    const formattedValue = text.replace(/[^A-Za-z0-9]/g, "");
    const upperValue = formattedValue.slice(0, 6).toUpperCase();
    setReferralCode(upperValue);
    validateReferralCode(upperValue);
  };

  return (
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
          {/* <View style={styles.logoContainer}>
            <Image
              source={theme.image.transparentLogo}
              style={[styles.logo, { width: logoWidth }]}
              resizeMode="contain"
            />
          </View> */}

          <View style={styles.formContainer}>
            <GlassmorphismCard>
              <Text style={styles.pageTitle}>Almost There!</Text>
              <Text style={styles.subtitle}>Complete your registration details</Text>

              {/* Mobile Number (Read-only) */}
              <View style={styles.inputContainer}>
                <View style={styles.inputWrapper}>
                  <View style={styles.inputIcon}>
                    <Ionicons name="call" size={20} color={theme.colors.secondary} />
                  </View>
                  <View style={styles.inputContent}>
                    <Text style={styles.inputLabel}>Registered Mobile</Text>
                    <TextInput
                      style={[styles.input, styles.disabledInput]}
                      value={mobileStr}
                      editable={false}
                      placeholderTextColor="rgba(10, 1, 1, 0.6)"
                    />
                  </View>
                </View>
              </View>

              {/* Full Name */}
              <View style={styles.inputContainer}>
                <View style={styles.inputWrapper}>
                  <View style={styles.inputIcon}>
                    <Ionicons name="person-outline" size={20} color={theme.colors.secondary} />
                  </View>
                  <View style={styles.inputContent}>
                    <Text style={styles.inputLabel}>Full Name *</Text>
                    <TextInput
                      style={styles.input}
                      placeholder="Enter your full name"
                      placeholderTextColor="rgba(10, 1, 1, 0.6)"
                      value={name}
                      onChangeText={(text) => {
                        setName(text);
                        validateName(text);
                      }}
                      autoCapitalize="words"
                    />
                  </View>
                </View>
                {nameError ? (
                  <Text style={styles.errorText}>{nameError}</Text>
                ) : null}
              </View>

              {/* Email */}
              <View style={styles.inputContainer}>
                <View style={styles.inputWrapper}>
                  <View style={styles.inputIcon}>
                    <Ionicons name="mail-outline" size={20} color={theme.colors.secondary} />
                  </View>
                  <View style={styles.inputContent}>
                    <Text style={styles.inputLabel}>Email Address *</Text>
                    <TextInput
                      style={styles.input}
                      placeholder="Enter your email address"
                      placeholderTextColor="rgba(10, 1, 1, 0.6)"
                      value={email}
                      onChangeText={(text) => {
                        setEmail(text);
                        validateEmail(text);
                      }}
                      keyboardType="email-address"
                      autoCapitalize="none"
                      autoCorrect={false}
                    />
                  </View>
                </View>
                {emailError ? (
                  <Text style={styles.errorText}>{emailError}</Text>
                ) : null}
              </View>

              {/* Referral Code */}
              <View style={styles.inputContainer}>
                <View style={styles.inputWrapper}>
                  <View style={styles.inputIcon}>
                    <Ionicons name="gift-outline" size={20} color={theme.colors.secondary} />
                  </View>
                  <View style={styles.inputContent}>
                    <Text style={styles.inputLabel}>Referral Code (Optional)</Text>
                    <TextInput
                      style={styles.input}
                      placeholder="6 alphanumeric characters"
                      placeholderTextColor="rgba(10, 1, 1, 0.6)"
                      value={referralCode}
                      onChangeText={handleReferralCodeChange}
                      keyboardType="default"
                      autoCapitalize="characters"
                      maxLength={6}
                    />
                  </View>
                </View>
                {referralError ? (
                  <Text style={styles.errorText}>{referralError}</Text>
                ) : null}
                {referralCode.length > 0 && !referralError && (
                  <View style={styles.successContainer}>
                    <Ionicons name="checkmark-circle" size={16} color="#4CAF50" />
                    <Text style={styles.successText}>Valid referral code!</Text>
                  </View>
                )}
              </View>

              {/* Submit Button */}
              <TouchableOpacity
                style={[styles.loginButton, loading && styles.loginButtonDisabled]}
                onPress={handleSubmit}
                disabled={loading}
              >
                <LinearGradient
                  colors={["#ffc90c", "#ffd700"]}
                  style={styles.gradientButton}
                >
                  <View style={styles.buttonContent}>
                    {loading ? (
                      <>
                        <Ionicons name="hourglass" size={20} color={theme.colors.textDark} />
                        <Text style={styles.loginButtonText}>Processing...</Text>
                      </>
                    ) : (
                      <>
                        <Ionicons name="arrow-forward" size={20} color={theme.colors.textDark} />
                        <Text style={styles.loginButtonText}>Continue</Text>
                      </>
                    )}
                  </View>
                </LinearGradient>
              </TouchableOpacity>

              {/* Info Section */}
              <View style={styles.infoSection}>
                <View style={styles.infoItem}>
                  <Ionicons name="shield-checkmark" size={16} color={theme.colors.secondary} />
                  <Text style={styles.infoText}>Your data is secure and encrypted</Text>
                </View>
                <View style={styles.infoItem}>
                  <Ionicons name="time-outline" size={16} color={theme.colors.secondary} />
                  <Text style={styles.infoText}>Quick 2-minute setup</Text>
                </View>
              </View>

              {/* Back Button */}
              <TouchableOpacity
                style={styles.backButton}
                onPress={() => router.back()}
              >
                <Ionicons name="arrow-back" size={20} color={theme.colors.white} />
                <Text style={styles.backButtonText}>Back</Text>
              </TouchableOpacity>
            </GlassmorphismCard>
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
    paddingBottom: Platform.OS === "ios" ? 40 : 20,
  },
  logoContainer: {
    width: "100%",
    alignItems: "center",
    paddingTop: Platform.OS === "ios" ? 60 : 40,
    marginBottom: 0,
  },
  logo: {
    aspectRatio: 0.8,
  },
  formContainer: {
    flex: 1,
    justifyContent: "center",
    paddingHorizontal: 20,
    paddingBottom: Platform.OS === "ios" ? 40 : 0,
  },
  cardContainer: {
    backgroundColor: "rgba(255, 255, 255, 0.6)",
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
  inputContainer: {
    width: "100%",
    marginBottom: 15,
  },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.91)",
    borderRadius: 15,
    borderWidth: 1,
    borderColor: "rgba(208, 38, 38, 0.65)",
    paddingHorizontal: 15,
    paddingVertical: 5,
  },
  inputIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(208, 38, 38, 0.65)",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 15,
  },
  inputContent: {
    flex: 1,
  },
  inputLabel: {
    color: theme.colors.darkGrey,
    fontSize: 12,
    opacity: 0.8,
    marginBottom: 5,
  },
  input: {
    color: theme.colors.black,
    fontSize: 16,
    paddingVertical: 10,
    paddingHorizontal: 0,
  },
  disabledInput: {
    opacity: 0.6,
  },
  errorText: {
    color: "#ff4444",
    fontSize: 12,
    marginTop: 5,
    marginLeft: 55,
  },
  successContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 5,
    marginLeft: 55,
  },
  successText: {
    color: "#4CAF50",
    fontSize: 12,
    marginLeft: 5,
  },
  loginButton: {
    width: "100%",
    height: 50,
    borderRadius: 25,
    overflow: "hidden",
    marginTop: 15,
    marginBottom: 15,
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
  loginButtonDisabled: {
    opacity: 0.6,
  },
  buttonContent: {
    flexDirection: "row",
    alignItems: "center",
  },
  loginButtonText: {
    color: theme.colors.textDark,
    fontSize: 18,
    fontWeight: "bold",
    marginLeft: 8,
  },
  infoSection: {
    marginTop: 5,
    marginBottom: 15,
  },
  infoItem: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  infoText: {
    color: theme.colors.textLight,
    fontSize: 14,
    marginLeft: 8,
    opacity: 0.8,
  },
  backButton: {
    marginTop: 20,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  backButtonText: {
    color: theme.colors.white,
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
