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
  Alert,
  Modal,
  Pressable,
} from "react-native";
import { useFocusEffect, useRouter } from "expo-router";
import { useLocalSearchParams } from "expo-router";
import { theme } from "@/constants/theme";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import api from "@/services/api";
import { t } from "@/i18n";

const { width } = Dimensions.get("window");
const logoWidth = width * 3;

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
      <View style={styles.cardContent}>{children}</View>
    </View>
  );
};

export default function BasicDetailsForm() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [referralCode, setReferralCode] = useState("");
  const [mobileInput, setMobileInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [showError, setShowError] = useState(false);
  const [nameError, setNameError] = useState("");
  const [emailError, setEmailError] = useState("");
  const [referralError, setReferralError] = useState("");
  const [mobileError, setMobileError] = useState("");
  const [otpModalVisible, setOtpModalVisible] = useState(false);
  const [otp, setOtp] = useState("");
  const [resendTimer, setResendTimer] = useState(120);
  const [resendCount, setResendCount] = useState(0);
  const [otpVerifying, setOtpVerifying] = useState(false);
  const [otpVerified, setOtpVerified] = useState(false);
  const resendLimit = 3;
  const [otpErrorModalVisible, setOtpErrorModalVisible] = useState(false);
  const [otpErrorMessage, setOtpErrorMessage] = useState("");
  
  const router = useRouter();
  const { mobile } = useLocalSearchParams();
  const mobileStr = Array.isArray(mobile) ? mobile[0] : mobile || "";

  useFocusEffect(
    React.useCallback(() => {
      setName("");
      setEmail("");
      setReferralCode("");
      setMobileInput(mobileStr);
      setNameError("");
      setEmailError("");
      setReferralError("");
      setMobileError("");
    }, [mobileStr])
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

  const validateMobile = (value: string) => {
    if (!value.trim()) {
      setMobileError("Please enter your mobile number");
      return false;
    }
    if (!/^\d{10}$/.test(value.trim())) {
      setMobileError("Mobile number must be 10 digits");
      return false;
    }
    setMobileError("");
    return true;
  };

  const validateForm = () => {
    const isMobileValid = validateMobile(mobileInput);
    const isNameValid = validateName(name);
    const isEmailValid = validateEmail(email);
    const isReferralValid = validateReferralCode(referralCode);

    return isMobileValid && isNameValid && isEmailValid && isReferralValid;
  };

  const handleSubmit =  () => {
    if (!otpVerified) {
      Alert.alert('OTP Not Verified', 'Please verify OTP before continuing.');
      return;
    }
    if (validateForm()) {
      setLoading(true);
      setTimeout(async() => {
        try {
          const response = await api.post("/register/complete", {
            name,
            email,
            mobile_number: mobileInput,
            mpin: '1234',
            password: 1234,
            referral_code:referralCode.trim()
          });
          if (response.status === 200) {
            router.replace({ pathname: "/(auth)/login", params: { mobile: mobileInput } });
          } else {
            showErrorAlert(response.data.message || "Registration failed");
          }
        } catch (error: any) {
          showErrorAlert(error.response?.data?.message || "Registration failed");
        } finally {
          setLoading(false);
        }
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

  // Timer effect for resend
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (otpModalVisible && resendTimer > 0) {
      timer = setTimeout(() => setResendTimer(resendTimer - 1), 1000);
    }
    return () => clearTimeout(timer);
  }, [otpModalVisible, resendTimer]);

  // Open OTP modal and reset timer/count
  const handleGetOtp = async () => {
    try {
      const response = await fetch(`${theme.baseUrl}/register/mobile`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ mobile_number: mobileInput }),
      });
      const data = await response.json();
      if (response.ok) {
        setOtp("");
        setOtpModalVisible(true);
        setResendTimer(120);
        setResendCount(0);
      } else {
        setOtpErrorMessage(data?.error || t("failedToSendOtp"));
        setOtpErrorModalVisible(true);
      }
    } catch (err) {
      setOtpErrorMessage(t("failedToSendOtp"));
      setOtpErrorModalVisible(true);
    }
  };

  // Resend OTP logic
  const handleResendOtp = () => {
    if (resendCount < resendLimit) {
      setResendCount(resendCount + 1);
      setResendTimer(120);
      setOtp("");
      // TODO: Call API to resend OTP here
      Alert.alert('OTP Sent', 'OTP resent to ' + `${mobileInput}`);
    }
  };

  // OTP verification logic
  const handleVerifyOtp = async () => {
    if (otp.length !== 4) {
      Alert.alert('Invalid OTP', 'Please enter a 4-digit OTP.');
      return;
    }
    setOtpVerifying(true);
    try {
      const response = await fetch(`${theme.baseUrl}/register/verify-otp`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ mobile_number: mobileInput, otp }),
      });

      const data = await response.json();
      console.log('handle data', data)
      if (response.ok && data.message && data.message.toLowerCase().includes('otp verified successfully')) {
        setOtpVerified(true);
        setOtpModalVisible(false);
      }
      setTimeout(() => {
        setOtpVerifying(false);
      }, 1000);
    } catch (e) {
      Alert.alert('Error', 'Failed to verify OTP.');
      setOtpVerifying(false);
    }
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
            {/* App Logo above the form card */}
            <View style={styles.logoContainerNew}>
              <Image
                source={theme.image.transparentLogo}
                style={styles.logoNew}
              />
            </View>
            <GlassmorphismCard>
              {/* Page Title and Subtitle */}
              <Text style={styles.pageTitle}>Create Your Account</Text>
              <Text style={styles.subtitle}>Enter your details to get started</Text>

              {/* Mobile Number (Editable) */}
              <View style={styles.inputContainer}>
                <View style={styles.inputWrapper}>
                  <View style={styles.inputIcon}>
                    <Ionicons name="call" size={20} color={theme.colors.secondary} />
                  </View>
                  <View style={styles.inputContent}>
                    <Text style={styles.inputLabel}>Registered Mobile *</Text>
                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                      <TextInput
                        style={[styles.input, otpVerified && { opacity: 0.6 }]}
                        placeholder="Enter your mobile number"
                        placeholderTextColor="rgba(10, 1, 1, 0.6)"
                        value={mobileInput}
                        onChangeText={(text) => {
                          if (!otpVerified) {
                            setMobileInput(text.replace(/[^0-9]/g, "").slice(0, 10));
                            validateMobile(text.replace(/[^0-9]/g, "").slice(0, 10));
                          }
                        }}
                        keyboardType="number-pad"
                        maxLength={10}
                        editable={!otpVerified}
                      />
                      {otpVerified && (
                        <Ionicons name="checkmark-circle" size={20} color="#4CAF50" style={{ marginLeft: 6 }} />
                      )}
                    </View>
                  </View>
                </View>
                {mobileError ? (
                  <Text style={styles.errorText}>{mobileError}</Text>
                ) : null}
                {/* Get OTP Button */}
                {otpVerified ? (
                  <TouchableOpacity
                    style={[styles.getOtpButton, { backgroundColor: '#aaa' }]}
                    onPress={() => {
                      setOtpVerified(false);
                      setMobileInput("");
                      setOtp("");
                      setMobileError("");
                    }}
                  >
                    <Text style={styles.getOtpButtonText}>Reset</Text>
                  </TouchableOpacity>
                ) : (
                  <TouchableOpacity
                    style={[styles.getOtpButton, (!mobileInput || !!mobileError) && styles.getOtpButtonDisabled]}
                    onPress={handleGetOtp}
                    disabled={!mobileInput || !!mobileError}
                  >
                    <Text style={styles.getOtpButtonText}>Get OTP</Text>
                  </TouchableOpacity>
                )}
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
              {/* <View style={styles.infoSection}>
                <View style={styles.infoItem}>
                  <Ionicons name="shield-checkmark" size={16} color={theme.colors.secondary} />
                  <Text style={styles.infoText}>Your data is secure and encrypted</Text>
                </View>
                <View style={styles.infoItem}>
                  <Ionicons name="time-outline" size={16} color={theme.colors.secondary} />
                  <Text style={styles.infoText}>Quick 2-minute setup</Text>
                </View>
              </View> */}

              {/* Back Button */}
              {/* <TouchableOpacity
                style={styles.backButton}
                onPress={() => router.back()}
              >
                <Ionicons name="arrow-back" size={20} color={theme.colors.white} />
                <Text style={styles.backButtonText}>Back</Text>
              </TouchableOpacity> */}

            {/* Login Link at the Bottom */}
            <TouchableOpacity
              style={styles.loginLinkContainer}
              onPress={() => router.replace({ pathname: "/(auth)/login" })}
            >
              <Text style={styles.loginLinkText}>
                Already have an account? <Text style={{ textDecorationLine: 'underline', color: theme.colors.secondary, fontWeight: 'bold' }}>Login</Text>
              </Text>
            </TouchableOpacity>
            </GlassmorphismCard>
          </View>
        </KeyboardAvoidingView>
      </LinearGradient>

      {/* OTP Modal */}
      <Modal
        visible={otpModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setOtpModalVisible(false)}
      >
        <View style={styles.otpModalOverlay}>
          <View style={styles.otpModalContent}>
            <Text style={styles.otpModalTitle}>Enter OTP</Text>
            <Text style={styles.otpModalSubtitle}>Enter the 4-digit OTP sent to your mobile</Text>
            <TextInput
              style={styles.otpInput}
              value={otp}
              onChangeText={text => setOtp(text.replace(/[^0-9]/g, '').slice(0, 4))}
              keyboardType="number-pad"
              maxLength={4}
              placeholder="----"
              placeholderTextColor="#aaa"
              editable={!otpVerifying}
            />
            <TouchableOpacity
              style={[styles.verifyOtpButton, (otp.length !== 4 || otpVerifying) && styles.getOtpButtonDisabled]}
              onPress={handleVerifyOtp}
              disabled={otp.length !== 4 || otpVerifying}
            >
              <Text style={styles.getOtpButtonText}>{otpVerifying ? 'Verifying...' : 'Verify OTP'}</Text>
            </TouchableOpacity>
            <View style={styles.resendRow}>
              <Text style={styles.resendText}>Didn't receive OTP?</Text>
              <Pressable
                onPress={handleResendOtp}
                disabled={resendTimer > 0 || resendCount >= resendLimit}
              >
                <Text style={[styles.resendLink, (resendTimer > 0 || resendCount >= resendLimit) && styles.resendLinkDisabled]}>
                  {resendTimer > 0 ? `Resend in ${resendTimer}s` : resendCount >= resendLimit ? 'Resend Limit Reached' : 'Resend OTP'}
                </Text>
              </Pressable>
            </View>
            <TouchableOpacity style={styles.closeOtpModalBtn} onPress={() => setOtpModalVisible(false)}>
              <Text style={styles.closeOtpModalText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
      {/* OTP Error Modal */}
      <Modal
        visible={otpErrorModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setOtpErrorModalVisible(false)}
      >
        <View style={styles.otpModalOverlay}>
          <View style={[styles.otpModalContent, { alignItems: 'center' }]}> 
            <Ionicons name="alert-circle" size={40} color="#ff4444" style={{ marginBottom: 10 }} />
            <Text style={[styles.otpModalTitle, { color: '#ff4444' }]}>Error</Text>
            <Text style={{ color: '#333', fontSize: 16, marginBottom: 24, textAlign: 'center' }}>{otpErrorMessage}</Text>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', width: '100%' }}>
              <TouchableOpacity
                style={[styles.verifyOtpButton, { backgroundColor: theme.colors.secondary, flex: 1, marginRight: 8 }]}
                onPress={() => {
                  setOtpErrorModalVisible(false);
                  router.replace({ pathname: "/(auth)/login" });
                }}
              >
                <Text style={styles.getOtpButtonText}>Login</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.verifyOtpButton, { backgroundColor: '#aaa', flex: 1, marginLeft: 8 }]}
                onPress={() => {
                  setOtpErrorModalVisible(false);
                  setOtpVerified(false);
                }}
              >
                <Text style={styles.getOtpButtonText}>Close</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
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
    backgroundColor: "rgba(43, 23, 23, 0.65)",
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
  loginLinkContainer: {
    marginTop: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loginLinkText: {
    color: theme.colors.textLight,
    fontSize: 15,
    opacity: 0.85,
  },
  logoContainerNew: {
    width: '100%',
    alignItems: 'center',
    marginBottom: 18,
    marginTop: 10,
  },
  logoNew: {
    width: 240,
    height: 160,
    resizeMode: 'contain',
  },
  getOtpButton: {
    marginTop: 8,
    alignSelf: 'flex-end',
    backgroundColor: theme.colors.secondary,
    paddingVertical: 8,
    paddingHorizontal: 22,
    borderRadius: 18,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.18,
    shadowRadius: 3,
    elevation: 2,
  },
  getOtpButtonDisabled: {
    backgroundColor: '#ccc',
    opacity: 0.6,
  },
  getOtpButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 15,
    textAlign: 'center',
  },
  otpModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  otpModalContent: {
    backgroundColor: '#fff',
    borderRadius: 18,
    padding: 28,
    width: '85%',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 8,
  },
  otpModalTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 8,
    color: theme.colors.secondary,
  },
  otpModalSubtitle: {
    fontSize: 15,
    color: '#333',
    marginBottom: 18,
    textAlign: 'center',
  },
  otpInput: {
    fontSize: 28,
    letterSpacing: 16,
    borderBottomWidth: 2,
    borderColor: theme.colors.secondary,
    width: 150,
    textAlign: 'center',
    marginBottom: 18,
    color: '#222',
    paddingVertical: 6,
  },
  verifyOtpButton: {
    backgroundColor: theme.colors.secondary,
    paddingVertical: 10,
    paddingHorizontal: 32,
    borderRadius: 18,
    marginBottom: 16,
  },
  resendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  resendText: {
    color: '#444',
    fontSize: 14,
    marginRight: 8,
  },
  resendLink: {
    color: theme.colors.secondary,
    fontWeight: 'bold',
    fontSize: 14,
    textDecorationLine: 'underline',
  },
  resendLinkDisabled: {
    color: '#aaa',
    textDecorationLine: 'none',
  },
  closeOtpModalBtn: {
    marginTop: 8,
    padding: 6,
  },
  closeOtpModalText: {
    color: '#888',
    fontSize: 14,
    textDecorationLine: 'underline',
  },
});
