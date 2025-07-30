import React, { useState, useEffect, useCallback, useRef } from "react";
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
  ScrollView,
} from "react-native";
import { useFocusEffect, useRouter } from "expo-router";
import { useLocalSearchParams } from "expo-router";
import { theme } from "@/constants/theme";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import api from "@/services/api";
import { t } from "@/i18n";

const { width, height } = Dimensions.get("window");
const logoWidth = width * 3;

// Responsive helper functions
const getResponsiveSize = (size: number, maxSize?: number) => {
  const responsiveSize = Math.min(size, width * (size / 400)); // 400 is base width
  return maxSize ? Math.min(responsiveSize, maxSize) : responsiveSize;
};

const getResponsiveHeight = (size: number, maxSize?: number) => {
  const responsiveSize = Math.min(size, height * (size / 800)); // 800 is base height
  return maxSize ? Math.min(responsiveSize, maxSize) : responsiveSize;
};

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
  const [resendTimer, setResendTimer] = useState(0);
  const [resendCount, setResendCount] = useState(0);
  const [otpVerifying, setOtpVerifying] = useState(false);
  const [otpVerified, setOtpVerified] = useState(false);
  const resendLimit = 3;
  const [otpErrorModalVisible, setOtpErrorModalVisible] = useState(false);
  const [otpErrorMessage, setOtpErrorMessage] = useState("");
  const [resendLoading, setResendLoading] = useState(false);
  const [autoOtpSent, setAutoOtpSent] = useState(false);
  const [autoOtpLoading, setAutoOtpLoading] = useState(false);
  const [referralValidating, setReferralValidating] = useState(false);
  const [referralValidated, setReferralValidated] = useState(false);
  const [referralValidationMessage, setReferralValidationMessage] = useState("");
  const [referralValidationTimeout, setReferralValidationTimeout] = useState<NodeJS.Timeout | null>(null);
  const [referralErrorModalVisible, setReferralErrorModalVisible] = useState(false);
  const [referralErrorMessage, setReferralErrorMessage] = useState("");
  const [otpPromptShown, setOtpPromptShown] = useState(false);
  const [isFormValid, setIsFormValid] = useState(false);
  const [progressPercentage, setProgressPercentage] = useState(0);
  const [otpSentFromModal, setOtpSentFromModal] = useState(false);
  const [autoOtpSending, setAutoOtpSending] = useState(false);
  
  // Helper function to get next timer duration
  const getNextTimerDuration = (currentCount: number) => {
    if (currentCount === 0) return 30; // 1st resend: 30 seconds
    if (currentCount === 1) return 60; // 2nd resend: 60 seconds
    return 120; // 3rd and beyond: 120 seconds
  };
  
  const router = useRouter();
  const scrollViewRef = useRef<ScrollView>(null);
  const referralInputRef = useRef<TextInput>(null);
  const emailInputRef = useRef<TextInput>(null);
  const { mobile } = useLocalSearchParams();
  const mobileStr = Array.isArray(mobile) ? mobile[0] : mobile || "";
  
  // Debug logging
  // console.log('🔍 userBasicDetails - mobile param:', mobile);
  // console.log('🔍 userBasicDetails - mobileStr:', mobileStr);

  // Use useEffect for initial setup
  useEffect(() => {
    // console.log('🔍 useEffect triggered - mobileStr:', mobileStr);
    
    if (mobileStr && mobileStr.length === 10 && /^\d{10}$/.test(mobileStr) && !otpPromptShown) {
      console.log('🔍 Setting mobile input from param:', mobileStr);
      setMobileInput(mobileStr);
      
      // Ask user if they want to trigger OTP
      console.log('🔍 Asking user to trigger OTP for mobile:', mobileStr);
      setOtpPromptShown(true);
      Alert.alert(
        'Send OTP',
        `Do you want to send OTP to ${mobileStr}?`,
        [
          {
            text: 'No',
            style: 'cancel',
            onPress: () => {
              console.log('🔍 User declined OTP trigger');
              setAutoOtpSent(false);
              setAutoOtpLoading(false);
            }
          },
          {
            text: 'Yes',
            onPress: () => {
              console.log('🔍 User confirmed OTP trigger');
              setAutoOtpSent(true);
              setAutoOtpLoading(true);
              // Small delay to ensure the component is fully mounted
              setTimeout(() => {
                // Pass the mobile number directly to avoid state timing issues
                handleGetOtpWithMobile(mobileStr);
              }, 500);
            }
          }
        ],
        { cancelable: false }
      );
    } else {
      // console.log('🔍 Not auto-triggering OTP - mobileStr:', mobileStr, 'length:', mobileStr?.length);
      setAutoOtpSent(false);
      setAutoOtpLoading(false);
    }
  }, [mobileStr, otpPromptShown]);

  // Immediate effect to set mobile input if available
  useEffect(() => {
    if (mobileStr && mobileStr.length === 10) {
      console.log('🔍 Immediate effect - Setting mobileInput to:', mobileStr);
      setMobileInput(mobileStr);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      // console.log('🔍 useFocusEffect triggered - mobileStr:', mobileStr);
      
      setName("");
      setEmail("");
      setReferralCode("");
      setNameError("");
      setEmailError("");
      setReferralError("");
      setMobileError("");
      setReferralValidated(false);
      setReferralValidationMessage("");
      setReferralValidating(false);
      setOtpPromptShown(false); // Reset OTP prompt state
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

    // If referral code is provided, it must be validated via API
    if (referralCode && referralCode.length === 6 && !referralValidated) {
      setReferralError("Please wait for referral code validation to complete");
      return false;
    }

    // If referral code is provided but validation failed, show error modal
    if (referralCode && referralCode.length === 6 && !referralValidated && referralValidationMessage) {
      setReferralErrorMessage("Please enter a valid referral code or remove it to continue");
      setReferralErrorModalVisible(true);
      return false;
    }

    // If referral code is provided and validation failed, show error modal
    if (referralCode && referralCode.length === 6 && !referralValidated && referralError) {
      setReferralErrorMessage("Please enter a valid referral code or remove it to continue");
      setReferralErrorModalVisible(true);
      return false;
    }

    const formValid = isMobileValid && isNameValid && isEmailValid && isReferralValid;
    setIsFormValid(formValid);
    return formValid;
  };

  const handleSubmit = () => {
    if (!otpVerified) {
      // Show enhanced OTP modal instead of alert
      setOtpModalVisible(true);
      // Auto-trigger OTP send when modal opens
      setTimeout(() => {
        if (!otpSentFromModal) {
          setOtpSentFromModal(true);
          handleGetOtp();
        }
      }, 500); // Small delay to ensure modal is fully visible
      return;
    }
    if (validateForm()) {
      // Navigate to MPIN page with user data as params
      router.push({
        pathname: "/(auth)/mpin",
        params: {
          name,
          email,
          mobile: mobileInput,
          referral_code: referralCode.trim()
        }
      });
    }
  };

  const validateReferralCodeWithAPI = async (code: string) => {
    if (!code || code.length !== 6) {
      return;
    }
    
    console.log('🔍 Validating referral code:', code);
    setReferralValidating(true);
    setReferralValidated(false);
    setReferralValidationMessage("");
    setReferralError(""); // Clear any existing error
    
    try {
      const response = await fetch(`${theme.baseUrl}/auth/referrals/${code}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });
      
      const data = await response.json();
      console.log('🔍 Referral validation response:', response.status, data);
      
      if (response.ok && data.valid) {
        setReferralValidated(true);
        setReferralValidationMessage("Valid referral code!");
        setReferralError(""); // Clear any existing error
        console.log('🔍 Referral code validated successfully');
      } else {
        setReferralValidated(false);
        setReferralValidationMessage(data.message || "Invalid referral code");
        setReferralError(data.message || "Invalid referral code");
        // Show modal for invalid referral code
        setReferralErrorMessage(data.message || "Referral code not found. Please check the code or remove it to continue.");
        setReferralErrorModalVisible(true);
        console.log('🔍 Referral code validation failed:', data.message);
      }
    } catch (error) {
      console.error('🔍 Referral code validation error:', error);
      setReferralValidated(false);
      setReferralValidationMessage("Failed to validate referral code");
      setReferralError("Failed to validate referral code");
      // Show modal for validation error
      setReferralErrorMessage("Failed to validate referral code. Please check your internet connection and try again.");
      setReferralErrorModalVisible(true);
    } finally {
      setReferralValidating(false);
    }
  };

  const handleReferralCodeChange = (text: string) => {
    const formattedValue = text.replace(/[^A-Za-z0-9]/g, "");
    const upperValue = formattedValue.slice(0, 6).toUpperCase();
    setReferralCode(upperValue);
    validateReferralCode(upperValue);
    
    // Reset validation states when user starts typing
    setReferralValidated(false);
    setReferralValidationMessage("");
    setReferralError(""); // Clear any existing error
    
    // Clear existing timeout
    if (referralValidationTimeout) {
      clearTimeout(referralValidationTimeout);
    }
    
    // Trigger API validation when 6 characters are entered with debounce
    if (upperValue.length === 6) {
      const timeout = setTimeout(() => {
        validateReferralCodeWithAPI(upperValue);
      }, 500); // 500ms debounce
      setReferralValidationTimeout(timeout);
    }
  };

  const clearReferralCode = () => {
    console.log('🔍 Clearing referral code');
    setReferralCode("");
    setReferralError("");
    setReferralValidated(false);
    setReferralValidationMessage("");
    setReferralValidating(false);
    setReferralErrorModalVisible(false); // Close modal if open
    setReferralErrorMessage(""); // Clear modal message
    if (referralValidationTimeout) {
      clearTimeout(referralValidationTimeout);
      setReferralValidationTimeout(null);
    }
    // Show brief success message
    Alert.alert("Success", "Referral code cleared successfully", [{ text: "OK" }]);
    // Focus back to referral input after clearing
    setTimeout(() => {
      referralInputRef.current?.focus();
    }, 100);
  };

  // Timer effect for resend with progressive timing
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (otpModalVisible && resendTimer > 0) {
      timer = setTimeout(() => setResendTimer(resendTimer - 1), 1000);
    }
    return () => clearTimeout(timer);
  }, [otpModalVisible, resendTimer]);

  // Auto-trigger OTP when modal opens
  useEffect(() => {
    if (otpModalVisible && !otpSentFromModal && !otpVerified && !autoOtpSending) {
      // Small delay to ensure modal is fully visible before sending OTP
      const timer = setTimeout(() => {
        setAutoOtpSending(true);
        setOtpSentFromModal(true);
        handleGetOtp();
      }, 300);
      
      return () => clearTimeout(timer);
    }
  }, [otpModalVisible, otpSentFromModal, otpVerified, autoOtpSending]);

  // Cleanup referral validation timeout on unmount
  useEffect(() => {
    return () => {
      if (referralValidationTimeout) {
        clearTimeout(referralValidationTimeout);
      }
    };
  }, [referralValidationTimeout]);

  // Update form validity when fields change
  useEffect(() => {
    validateForm();
    
    // Calculate progress percentage
    const completedFields = (mobileInput ? 1 : 0) + (name ? 1 : 0) + (email ? 1 : 0) + (otpVerified ? 1 : 0);
    const percentage = Math.min(completedFields * 25, 100);
    setProgressPercentage(percentage);
  }, [mobileInput, name, email, referralCode, referralValidated, referralError, referralValidationMessage, otpVerified]);

  // Open OTP modal and reset timer/count with specific mobile number
  const handleGetOtpWithMobile = async (mobileNumber: string) => {
    console.log('🔍 handleGetOtpWithMobile called with:', mobileNumber);
    
    if (!mobileNumber || mobileNumber.length !== 10) {
      console.log('🔍 Error: Invalid mobile number for API call');
      setOtpErrorMessage('Invalid mobile number');
      setOtpErrorModalVisible(true);
      setAutoOtpLoading(false);
      return;
    }
    
    try {
      const response = await fetch(`${theme.baseUrl}/register/mobile`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ mobile_number: mobileNumber }),
      });
      const data = await response.json();
      if (response.ok) {
        setOtp("");
        setOtpModalVisible(true);
        setResendTimer(0); // No initial timer for first OTP send
        setResendCount(0);
        setAutoOtpSent(false); // Reset auto flag after successful OTP send
        setAutoOtpLoading(false); // Reset loading flag
        setAutoOtpSending(false); // Reset auto sending flag
      } else {
        setOtpErrorMessage(data?.error || t("failedToSendOtp"));
        setOtpErrorModalVisible(true);
        setAutoOtpLoading(false); // Reset loading flag on error
      }
    } catch (err) {
      setOtpErrorMessage(t("failedToSendOtp"));
      setOtpErrorModalVisible(true);
      setAutoOtpLoading(false); // Reset loading flag on error
    }
  };

  // Open OTP modal and reset timer/count
  const handleGetOtp = async () => {
    console.log('🔍 handleGetOtp called');
    console.log('🔍 mobileInput:', mobileInput);
    console.log('🔍 mobileStr:', mobileStr);
    
    // Use mobileStr as fallback if mobileInput is empty
    const mobileToUse = mobileInput || mobileStr;
    console.log('🔍 mobileToUse for API call:', mobileToUse);
    
    if (!mobileToUse || mobileToUse.length !== 10) {
      console.log('🔍 Error: Invalid mobile number for API call');
      setOtpErrorMessage('Invalid mobile number');
      setOtpErrorModalVisible(true);
      setAutoOtpLoading(false);
      return;
    }
    
    try {
      const response = await fetch(`${theme.baseUrl}/register/mobile`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ mobile_number: mobileToUse }),
      });
      const data = await response.json();
      if (response.ok) {
        setOtp("");
        setOtpModalVisible(true);
        setResendTimer(0); // No initial timer for first OTP send
        setResendCount(0);
        setAutoOtpSent(false); // Reset auto flag after successful OTP send
        setAutoOtpLoading(false); // Reset loading flag
        setAutoOtpSending(false); // Reset auto sending flag
      } else {
        setOtpErrorMessage(data?.error || t("failedToSendOtp"));
        setOtpErrorModalVisible(true);
        setAutoOtpLoading(false); // Reset loading flag on error
      }
    } catch (err) {
      setOtpErrorMessage(t("failedToSendOtp"));
      setOtpErrorModalVisible(true);
      setAutoOtpLoading(false); // Reset loading flag on error
    }
  };

  // Resend OTP logic with progressive timer
  const handleResendOtp = async () => {
    if (resendCount < resendLimit && !resendLoading && resendTimer === 0) {
      setResendLoading(true);
      
      const mobileToUse = mobileInput || mobileStr;
      console.log('🔍 handleResendOtp - mobileToUse:', mobileToUse);
      
      try {
        const response = await fetch(`${theme.baseUrl}/register/mobile`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ mobile_number: mobileToUse }),
        });
        const data = await response.json();
        
        if (response.ok) {
          setResendCount(resendCount + 1);
          setOtp("");
          
          // Set progressive timer based on resend count
          const timerDuration = getNextTimerDuration(resendCount);
          
          setResendTimer(timerDuration);
          Alert.alert('OTP Sent', `OTP resent to ${mobileInput}. Next resend available in ${timerDuration} seconds.`);
        } else {
          setOtpErrorMessage(data?.error || t("failedToSendOtp"));
          setOtpErrorModalVisible(true);
        }
      } catch (err) {
        setOtpErrorMessage(t("failedToSendOtp"));
        setOtpErrorModalVisible(true);
      } finally {
        setResendLoading(false);
      }
    }
  };

  // OTP verification logic
  const handleVerifyOtp = async () => {
    if (otp.length !== 4) {
      Alert.alert('Invalid OTP', 'Please enter a 4-digit OTP.');
      return;
    }
    setOtpVerifying(true);
    
    const mobileToUse = mobileInput || mobileStr;
    console.log('🔍 handleVerifyOtp - mobileToUse:', mobileToUse);
    
    try {
      const response = await fetch(`${theme.baseUrl}/register/verify-otp`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ mobile_number: mobileToUse, otp }),
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
          keyboardVerticalOffset={Platform.OS === "ios" ? getResponsiveHeight(20, 30) : getResponsiveHeight(20, 30)}
        >
          <ScrollView 
            ref={scrollViewRef}
            style={styles.scrollView}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
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
              
              {/* Progress Indicator */}
              {/* <View style={styles.progressContainer}>
                <View style={styles.progressBar}>
                  <View 
                    style={[
                      styles.progressFill, 
                      { width: `${progressPercentage}%` }
                    ]} 
                  />
                </View>
                <Text style={styles.progressText}>
                  Step 1 of 3 • {progressPercentage}% Complete
                </Text>
              </View> */}

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
                ) : autoOtpSent && mobileStr && mobileStr.length === 10 ? (
                  <View style={styles.autoOtpContainer}>
                    {autoOtpLoading ? (
                      <>
                        <Ionicons name="hourglass-outline" size={16} color="#FFA500" />
                        <Text style={[styles.autoOtpText, { color: '#FFA500' }]}>{t("sendingOtpMessage")}</Text>
                      </>
                    ) : (
                      <>
                        <Ionicons name="checkmark-circle" size={16} color="#4CAF50" />
                        <Text style={styles.autoOtpText}>{t("autoOtpMessage")}</Text>
                      </>
                    )}
                  </View>
                ) : mobileStr && mobileStr.length === 10 && !autoOtpSent ? (
                  <View style={styles.autoOtpContainer}>
                    <Ionicons name="information-circle" size={16} color="#007AFF" />
                    <Text style={[styles.autoOtpText, { color: '#007AFF' }]}>Mobile pre-filled: {mobileStr}</Text>
                    <Text style={[styles.autoOtpText, { color: '#007AFF', fontSize: 12 }]}>Click "Get OTP" to send verification code</Text>
                    <TouchableOpacity
                      style={[styles.getOtpButton, { backgroundColor: '#007AFF', marginTop: 8, alignSelf: 'flex-start' }]}
                      onPress={() => {
                        setAutoOtpSent(true);
                        setAutoOtpLoading(true);
                        handleGetOtpWithMobile(mobileStr);
                      }}
                    >
                      <Text style={styles.getOtpButtonText}>Send OTP Now</Text>
                    </TouchableOpacity>
                  </View>
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
                
                {/* Debug button for testing */}
                {/* {__DEV__ && (
                  <TouchableOpacity
                    style={[styles.getOtpButton, { backgroundColor: '#FF6B35', marginTop: 8 }]}
                    onPress={() => {
                      console.log('🔍 Debug: Manual OTP trigger');
                      console.log('🔍 Debug: mobileInput:', mobileInput);
                      console.log('🔍 Debug: mobileStr:', mobileStr);
                      const mobileToUse = mobileInput || mobileStr;
                      handleGetOtpWithMobile(mobileToUse);
                    }}
                  >
                    <Text style={styles.getOtpButtonText}>Debug: Force OTP</Text>
                  </TouchableOpacity>
                )} */}
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
                      returnKeyType="next"
                      blurOnSubmit={false}
                      onSubmitEditing={() => {
                        // Focus next input (email)
                        emailInputRef.current?.focus();
                      }}
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
                      ref={emailInputRef}
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
                      returnKeyType="next"
                      blurOnSubmit={false}
                      onSubmitEditing={() => {
                        // Focus referral input
                        referralInputRef.current?.focus();
                      }}
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
                    <Text style={styles.inputLabel}>Referral By (Optional)</Text>
                    <TextInput
                      ref={referralInputRef}
                      style={styles.input}
                      placeholder="6 alphanumeric characters"
                      placeholderTextColor="rgba(10, 1, 1, 0.6)"
                      value={referralCode}
                      onChangeText={handleReferralCodeChange}
                      keyboardType="default"
                      autoCapitalize="characters"
                      maxLength={6}
                      onFocus={() => {
                        // Scroll to referral input when focused
                        setTimeout(() => {
                          scrollViewRef.current?.scrollToEnd({ animated: true });
                        }, 300);
                      }}
                      onLayout={(event) => {
                        // Ensure the input is visible when keyboard appears
                        const { y } = event.nativeEvent.layout;
                        if (y > 0) {
                          setTimeout(() => {
                            scrollViewRef.current?.scrollToEnd({ animated: true });
                          }, 100);
                        }
                      }}
                    />
                  </View>
                  {/* Validation status icon */}
                  {(referralValidating || referralValidated) && (
                    <View style={styles.validationIconContainer}>
                      {referralValidating && (
                        <Ionicons name="hourglass-outline" size={16} color="#FFA500" />
                      )}
                      {referralValidated && (
                        <Ionicons name="checkmark-circle" size={16} color="#4CAF50" />
                      )}
                    </View>
                  )}
                  {/* Error icon for invalid referral code */}
                  {!referralValidating && !referralValidated && referralCode.length === 6 && referralError && (
                    <View style={styles.validationIconContainer}>
                      <Ionicons name="close-circle" size={16} color="#ff4444" />
                    </View>
                  )}
                  {/* Clear button for referral code */}
                  {referralCode.length > 0 && (
                    <TouchableOpacity
                      style={styles.clearButton}
                      onPress={clearReferralCode}
                      activeOpacity={0.7}
                    >
                      <Ionicons 
                        name="close-circle" 
                        size={getResponsiveSize(18, 20)} 
                        color="#ff4444" 
                      />
                    </TouchableOpacity>
                  )}
                </View>
                {referralError ? (
                  <Text style={styles.errorText}>{referralError}</Text>
                ) : null}
                {referralValidating && (
                  <View style={styles.validatingContainer}>
                    <Ionicons name="hourglass-outline" size={16} color="#FFA500" />
                    <Text style={[styles.validatingText, { color: '#FFA500' }]}>Validating referral code...</Text>
                  </View>
                )}
                {referralValidated && referralValidationMessage && (
                  <View style={styles.successContainer}>
                    <Ionicons name="checkmark-circle" size={16} color="#4CAF50" />
                    <Text style={styles.successText}>{referralValidationMessage}</Text>
                  </View>
                )}
                {!referralValidating && !referralValidated && referralCode.length === 6 && !referralError && (
                  <View style={styles.infoContainer}>
                    <Ionicons name="information-circle" size={16} color="#007AFF" />
                    <Text style={[styles.referralInfoText, { color: '#007AFF' }]}>Referral code entered - validation pending</Text>
                    <TouchableOpacity
                      style={{ marginLeft: getResponsiveSize(8, 10) }}
                      onPress={() => validateReferralCodeWithAPI(referralCode)}
                    >
                      <Text style={[styles.referralInfoText, { color: '#007AFF', textDecorationLine: 'underline' }]}>
                        Retry
                      </Text>
                    </TouchableOpacity>
                  </View>
                )}

              </View>

              {/* Form Validation Summary */}
              {/* <View style={styles.validationSummary}>
                <Text style={styles.validationTitle}>Form Status:</Text>
                <View style={styles.validationItems}>
                  <View style={styles.validationItem}>
                    <Ionicons 
                      name={mobileInput && !mobileError ? "checkmark-circle" : "ellipse-outline"} 
                      size={16} 
                      color={mobileInput && !mobileError ? "#4CAF50" : "#ccc"} 
                    />
                    <Text style={[styles.validationText, mobileInput && !mobileError && styles.validationTextValid]}>
                      Mobile Number {mobileInput && !mobileError ? "✓" : ""}
                    </Text>
                  </View>
                  <View style={styles.validationItem}>
                    <Ionicons 
                      name={otpVerified ? "checkmark-circle" : "ellipse-outline"} 
                      size={16} 
                      color={otpVerified ? "#4CAF50" : "#ccc"} 
                    />
                    <Text style={[styles.validationText, otpVerified && styles.validationTextValid]}>
                      OTP Verification {otpVerified ? "✓" : ""}
                    </Text>
                  </View>
                  <View style={styles.validationItem}>
                    <Ionicons 
                      name={name && !nameError ? "checkmark-circle" : "ellipse-outline"} 
                      size={16} 
                      color={name && !nameError ? "#4CAF50" : "#ccc"} 
                    />
                    <Text style={[styles.validationText, name && !nameError && styles.validationTextValid]}>
                      Full Name {name && !nameError ? "✓" : ""}
                    </Text>
                  </View>
                  <View style={styles.validationItem}>
                    <Ionicons 
                      name={email && !emailError ? "checkmark-circle" : "ellipse-outline"} 
                      size={16} 
                      color={email && !emailError ? "#4CAF50" : "#ccc"} 
                    />
                    <Text style={[styles.validationText, email && !emailError && styles.validationTextValid]}>
                      Email Address {email && !emailError ? "✓" : ""}
                    </Text>
                  </View>
                  {referralCode && (
                    <View style={styles.validationItem}>
                      <Ionicons 
                        name={referralValidated ? "checkmark-circle" : referralError ? "close-circle" : "ellipse-outline"} 
                        size={16} 
                        color={referralValidated ? "#4CAF50" : referralError ? "#ff4444" : "#ccc"} 
                      />
                      <Text style={[styles.validationText, referralValidated && styles.validationTextValid, referralError && styles.validationTextError]}>
                        Referral Code {referralValidated ? "✓" : referralError ? "✗" : ""}
                      </Text>
                    </View>
                  )}
                </View>
              </View> */}

              {/* Submit Button */}
              <TouchableOpacity
                style={[
                  styles.loginButton, 
                  loading && styles.loginButtonDisabled,
                  !isFormValid && styles.loginButtonDisabled
                ]}
                onPress={handleSubmit}
                disabled={loading || !isFormValid}
              >
                <LinearGradient
                  colors={isFormValid ? ["#ffc90c", "#ffd700"] : ["#ccc", "#aaa"]}
                  style={styles.gradientButton}
                >
                  <View style={styles.buttonContent}>
                    {loading ? (
                      <>
                        <Ionicons name="hourglass" size={20} color={theme.colors.textDark} />
                        <Text style={styles.loginButtonText}>Processing...</Text>
                      </>
                    ) : !isFormValid ? (
                      <>
                        <Ionicons name="alert-circle" size={20} color={theme.colors.textDark} />
                        <Text style={styles.loginButtonText}>Complete Required Fields</Text>
                      </>
                    ) : (
                      <>
                        <Ionicons name="arrow-forward" size={20} color={theme.colors.textDark} />
                        <Text style={styles.loginButtonText}>Continue to MPIN Setup</Text>
                      </>
                    )}
                  </View>
                </LinearGradient>
              </TouchableOpacity>

              {/* Helpful Tips Section */}
              {/* <View style={styles.tipsSection}>
                <Text style={styles.tipsTitle}>💡 Helpful Tips</Text>
                <View style={styles.tipsContainer}>
                  <View style={styles.tipItem}>
                    <Ionicons name="shield-checkmark" size={16} color="#4CAF50" />
                    <Text style={styles.tipText}>Your data is secure and encrypted</Text>
                  </View>
                  <View style={styles.tipItem}>
                    <Ionicons name="time-outline" size={16} color="#FFA500" />
                    <Text style={styles.tipText}>Quick 2-minute setup process</Text>
                  </View>
                  <View style={styles.tipItem}>
                    <Ionicons name="call-outline" size={16} color="#007AFF" />
                    <Text style={styles.tipText}>OTP will be sent to your mobile number</Text>
                  </View>
                  <View style={styles.tipItem}>
                    <Ionicons name="gift-outline" size={16} color="#9C27B0" />
                    <Text style={styles.tipText}>Referral code is optional but recommended</Text>
                  </View>
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
          </ScrollView>
        </KeyboardAvoidingView>
      </LinearGradient>

      {/* OTP Modal */}
      <Modal
        visible={otpModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => {
          setOtpModalVisible(false);
          setOtpSentFromModal(false);
        }}
      >
        <View style={styles.otpModalOverlay}>
          <View style={styles.otpModalContent}>
            <Text style={styles.otpModalTitle}>OTP Verification Required</Text>
            <Text style={styles.otpModalSubtitle}>
              {otpVerified 
                ? "OTP has been verified successfully!" 
                : autoOtpSending
                ? "Sending OTP to your mobile number..."
                : otpSentFromModal
                ? "OTP has been automatically sent to your mobile number. Please enter the 4-digit code below."
                : "Please verify your mobile number by entering the 4-digit OTP sent to your mobile"
              }
            </Text>
            
            {!otpVerified && (
              <>
                <Text style={styles.mobileDisplayText}>
                  Mobile: {mobileInput || mobileStr}
                </Text>
                
                <TextInput
                  style={styles.otpInput}
                  value={otp}
                  onChangeText={text => setOtp(text.replace(/[^0-9]/g, '').slice(0, 4))}
                  keyboardType="number-pad"
                  maxLength={4}
                  placeholder="----"
                  placeholderTextColor="#aaa"
                  editable={!otpVerifying && !autoOtpSending}
                />
                
                <TouchableOpacity
                  style={[styles.verifyOtpButton, (otp.length !== 4 || otpVerifying || autoOtpSending) && styles.getOtpButtonDisabled]}
                  onPress={handleVerifyOtp}
                  disabled={otp.length !== 4 || otpVerifying || autoOtpSending}
                >
                  <Text style={styles.getOtpButtonText}>
                    {otpVerifying ? 'Verifying...' : autoOtpSending ? 'Sending OTP...' : 'Verify OTP'}
                  </Text>
                </TouchableOpacity>
                
                <View style={styles.resendRow}>
                  <Text style={styles.resendText}>Didn't receive OTP?</Text>
                  <Pressable
                    onPress={handleResendOtp}
                    disabled={resendTimer > 0 || resendCount >= resendLimit || resendLoading}
                  >
                                      <Text style={[styles.resendLink, (resendTimer > 0 || resendCount >= resendLimit || resendLoading) && styles.resendLinkDisabled]}>
                    {resendLoading ? 'Sending...' : resendTimer > 0 ? `Resend in ${resendTimer}s` : resendCount >= resendLimit ? 'Resend Limit Reached' : `Resend OTP (${getNextTimerDuration(resendCount)}s wait)`}
                  </Text>
                  </Pressable>
                </View>
                
                {/* <TouchableOpacity
                  style={[styles.getOtpButton, { backgroundColor: '#007AFF', marginTop: 16 }]}
                  onPress={() => {
                    setOtpSentFromModal(true);
                    handleGetOtp();
                  }}
                  disabled={!mobileInput && !mobileStr}
                >
                  <Text style={styles.getOtpButtonText}>Get OTP</Text>
                </TouchableOpacity> */}
              </>
            )}
            
            <View style={styles.modalButtonRow}>
              <TouchableOpacity 
                style={[styles.modalButton, { backgroundColor: '#aaa' }]} 
                onPress={() => {
                  setOtpModalVisible(false);
                  setOtpSentFromModal(false);
                }}
              >
                <Text style={styles.modalButtonText}>Cancel</Text>
              </TouchableOpacity>
              
              {otpVerified && (
                <TouchableOpacity 
                  style={[styles.modalButton, { backgroundColor: theme.colors.primary }]} 
                  onPress={() => {
                    setOtpModalVisible(false);
                    handleSubmit();
                  }}
                >
                  <Text style={styles.modalButtonText}>Continue</Text>
                </TouchableOpacity>
              )}
            </View>
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

      {/* Referral Error Modal */}
      <Modal
        visible={referralErrorModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setReferralErrorModalVisible(false)}
      >
        <View style={styles.otpModalOverlay}>
          <View style={[styles.otpModalContent, { alignItems: 'center' }]}> 
            <Ionicons name="alert-circle" size={getResponsiveSize(40, 45)} color="#ff4444" style={{ marginBottom: getResponsiveHeight(10, 15) }} />
            <Text style={[styles.otpModalTitle, { color: '#ff4444' }]}>Referral Code Not Found</Text>
            <Text style={{ 
              color: '#333', 
              fontSize: getResponsiveSize(16, 18), 
              marginBottom: getResponsiveHeight(24, 30), 
              textAlign: 'center',
              lineHeight: getResponsiveHeight(22, 26)
            }}>
              {referralErrorMessage}
            </Text>
            <View style={{ 
              flexDirection: 'row', 
              justifyContent: 'space-between', 
              width: '100%',
              gap: getResponsiveSize(8, 12)
            }}>
              <TouchableOpacity
                style={[
                  styles.verifyOtpButton, 
                  { 
                    backgroundColor: theme.colors.secondary, 
                    flex: 1,
                    paddingVertical: getResponsiveHeight(12, 15)
                  }
                ]}
                onPress={() => {
                  setReferralErrorModalVisible(false);
                  clearReferralCode();
                }}
              >
                <Text style={[styles.getOtpButtonText, { fontSize: getResponsiveSize(15, 16) }]}>
                  Clear & Continue
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.verifyOtpButton, 
                  { 
                    backgroundColor: '#007AFF', 
                    flex: 1,
                    paddingVertical: getResponsiveHeight(12, 15)
                  }
                ]}
                onPress={() => {
                  setReferralErrorModalVisible(false);
                  // Focus back to referral input for retry
                  setTimeout(() => {
                    referralInputRef.current?.focus();
                  }, 300);
                }}
              >
                <Text style={[styles.getOtpButtonText, { fontSize: getResponsiveSize(15, 16) }]}>
                  Try Again
                </Text>
              </TouchableOpacity>
            </View>
            <TouchableOpacity
              style={styles.closeOtpModalBtn}
              onPress={() => setReferralErrorModalVisible(false)}
            >
              <Text style={styles.closeOtpModalText}>Close</Text>
            </TouchableOpacity>
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
    paddingBottom: getResponsiveHeight(10, 20),
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingVertical: getResponsiveHeight(20, 30),
    minHeight: height - getResponsiveHeight(100, 120),
  },
  logoContainer: {
    width: "100%",
    alignItems: "center",
    paddingTop: Platform.OS === "ios" ? 40 : 20,
    marginBottom: 0,
  },
  logo: {
    aspectRatio: 0.8,
  },
  formContainer: {
    flex: 1,
    justifyContent: "center",
    paddingHorizontal: getResponsiveSize(20, 30),
    paddingVertical: getResponsiveHeight(10, 15),
    ...(height < 600 && {
      paddingVertical: getResponsiveHeight(5, 8),
    }),
  },
  cardContainer: {
    backgroundColor: "rgba(255, 255, 255, 0.6)",
    borderRadius: getResponsiveSize(20, 25),
    padding: getResponsiveSize(20, 25),
    width: "100%",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.4)",
    marginBottom: getResponsiveHeight(10, 15),
    overflow: "hidden",
    ...(height < 600 && {
      padding: getResponsiveSize(15, 20),
      marginBottom: getResponsiveHeight(5, 8),
    }),
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
    fontSize: getResponsiveSize(28, 32),
    fontWeight: "bold",
    marginBottom: getResponsiveHeight(10, 15),
    textAlign: "center",
  },
  subtitle: {
    color: "#ffffff",
    fontSize: getResponsiveSize(16, 18),
    marginBottom: getResponsiveHeight(30, 40),
    textAlign: "center",
    opacity: 0.8,
  },
  inputContainer: {
    width: "100%",
    marginBottom: getResponsiveHeight(15, 20),
  },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.91)",
    borderRadius: getResponsiveSize(15, 20),
    borderWidth: 1,
    borderColor: "rgba(208, 38, 38, 0.65)",
    paddingHorizontal: getResponsiveSize(15, 20),
    paddingVertical: getResponsiveHeight(5, 8),
    minHeight: getResponsiveHeight(50, 60),
  },
  inputIcon: {
    width: getResponsiveSize(40, 45),
    height: getResponsiveSize(40, 45),
    borderRadius: getResponsiveSize(20, 22),
    backgroundColor: "rgba(43, 23, 23, 0.65)",
    justifyContent: "center",
    alignItems: "center",
    marginRight: getResponsiveSize(15, 18),
  },
  inputContent: {
    flex: 1,
  },
  inputLabel: {
    color: theme.colors.darkGrey,
    fontSize: getResponsiveSize(12, 14),
    opacity: 0.8,
    marginBottom: getResponsiveHeight(5, 8),
  },
  input: {
    color: theme.colors.black,
    fontSize: getResponsiveSize(16, 18),
    paddingVertical: getResponsiveHeight(10, 12),
    paddingHorizontal: 0,
    minHeight: getResponsiveHeight(30, 35),
  },
  disabledInput: {
    opacity: 0.6,
  },
  errorText: {
    color: "#ff4444",
    fontSize: Math.min(12, width * 0.03),
    marginTop: Math.min(5, width * 0.012),
    marginLeft: Math.min(55, width * 0.14),
  },
  successContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: Math.min(5, width * 0.012),
    marginLeft: Math.min(55, width * 0.14),
  },
  successText: {
    color: "#4CAF50",
    fontSize: Math.min(12, width * 0.03),
    marginLeft: Math.min(5, width * 0.012),
  },
  loginButton: {
    width: "100%",
    height: getResponsiveHeight(50, 55),
    borderRadius: getResponsiveSize(25, 28),
    overflow: "hidden",
    marginTop: getResponsiveHeight(15, 20),
    marginBottom: getResponsiveHeight(15, 20),
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
    fontSize: getResponsiveSize(18, 20),
    fontWeight: "bold",
    marginLeft: getResponsiveSize(8, 10),
  },
  infoSection: {
    marginTop: Math.min(5, width * 0.012),
    marginBottom: Math.min(15, width * 0.04),
  },
  infoItem: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: Math.min(8, width * 0.02),
  },
  infoText: {
    color: theme.colors.textLight,
    fontSize: Math.min(14, width * 0.035),
    marginLeft: Math.min(8, width * 0.02),
    opacity: 0.8,
  },
  backButton: {
    marginTop: Math.min(20, width * 0.05),
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  backButtonText: {
    color: theme.colors.white,
    fontSize: Math.min(16, width * 0.04),
    marginLeft: Math.min(5, width * 0.012),
    opacity: 0.8,
  },
  errorAlert: {
    position: "absolute",
    top: Platform.OS === "ios" ? 50 : 30,
    left: Math.min(20, width * 0.05),
    right: Math.min(20, width * 0.05),
    backgroundColor: "rgba(255, 68, 68, 0.95)",
    borderRadius: Math.min(12, width * 0.03),
    padding: Math.min(15, width * 0.04),
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
    fontSize: Math.min(16, width * 0.04),
    marginLeft: Math.min(10, width * 0.025),
    flex: 1,
  },
  closeButton: {
    padding: Math.min(5, width * 0.012),
  },
  loginLinkContainer: {
    marginTop: Math.min(18, width * 0.045),
    alignItems: 'center',
    justifyContent: 'center',
  },
  loginLinkText: {
    color: theme.colors.textLight,
    fontSize: Math.min(15, width * 0.038),
    opacity: 0.85,
  },
  logoContainerNew: {
    width: '100%',
    alignItems: 'center',
    marginBottom: getResponsiveSize(18, 25),
    marginTop: getResponsiveHeight(10, 15),
  },
  logoNew: {
    width: getResponsiveSize(240, 300),
    height: getResponsiveHeight(160, 200),
    resizeMode: 'contain',
  },
  getOtpButton: {
    marginTop: Math.min(8, width * 0.02),
    alignSelf: 'flex-end',
    backgroundColor: theme.colors.secondary,
    paddingVertical: Math.min(8, width * 0.02),
    paddingHorizontal: Math.min(22, width * 0.055),
    borderRadius: Math.min(18, width * 0.045),
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
    fontSize: Math.min(15, width * 0.038),
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
    borderRadius: getResponsiveSize(18, 20),
    padding: getResponsiveSize(28, 32),
    width: getResponsiveSize(340, 400),
    maxWidth: width * 0.9,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 8,
  },
  otpModalTitle: {
    fontSize: Math.min(22, width * 0.055),
    fontWeight: 'bold',
    marginBottom: Math.min(8, width * 0.02),
    color: theme.colors.secondary,
  },
  otpModalSubtitle: {
    fontSize: Math.min(15, width * 0.038),
    color: '#333',
    marginBottom: Math.min(18, width * 0.045),
    textAlign: 'center',
  },
  otpInput: {
    fontSize: Math.min(28, width * 0.07),
    letterSpacing: Math.min(16, width * 0.04),
    borderBottomWidth: 2,
    borderColor: theme.colors.secondary,
    width: Math.min(150, width * 0.375),
    textAlign: 'center',
    marginBottom: Math.min(18, width * 0.045),
    color: '#222',
    paddingVertical: Math.min(6, width * 0.015),
  },
  verifyOtpButton: {
    backgroundColor: theme.colors.secondary,
    paddingVertical: Math.min(10, width * 0.025),
    paddingHorizontal: Math.min(32, width * 0.08),
    borderRadius: Math.min(18, width * 0.045),
    marginBottom: Math.min(16, width * 0.04),
  },
  resendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Math.min(10, width * 0.025),
  },
  resendText: {
    color: '#444',
    fontSize: Math.min(14, width * 0.035),
    marginRight: Math.min(8, width * 0.02),
  },
  resendLink: {
    color: theme.colors.secondary,
    fontWeight: 'bold',
    fontSize: Math.min(14, width * 0.035),
    textDecorationLine: 'underline',
  },
  resendLinkDisabled: {
    color: '#aaa',
    textDecorationLine: 'none',
  },
  closeOtpModalBtn: {
    marginTop: Math.min(8, width * 0.02),
    padding: Math.min(6, width * 0.015),
  },
  closeOtpModalText: {
    color: '#888',
    fontSize: Math.min(14, width * 0.035),
    textDecorationLine: 'underline',
  },
  autoOtpContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: Math.min(4, width * 0.01),
    paddingHorizontal: Math.min(4, width * 0.01),
  },
  autoOtpText: {
    color: '#4CAF50',
    fontSize: Math.min(12, width * 0.03),
    marginLeft: Math.min(4, width * 0.01),
    fontStyle: 'italic',
  },
  validatingContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: Math.min(5, width * 0.012),
    marginLeft: Math.min(55, width * 0.14),
  },
  validatingText: {
    fontSize: Math.min(12, width * 0.03),
    marginLeft: Math.min(5, width * 0.012),
    fontStyle: 'italic',
  },
  infoContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: Math.min(5, width * 0.012),
    marginLeft: Math.min(55, width * 0.14),
  },
  referralInfoText: {
    fontSize: Math.min(12, width * 0.03),
    marginLeft: Math.min(5, width * 0.012),
    fontStyle: 'italic',
  },
  validationIconContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    paddingRight: Math.min(10, width * 0.025),
  },
  clearButton: {
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: getResponsiveSize(8, 10),
    paddingVertical: getResponsiveSize(4, 6),
    borderRadius: getResponsiveSize(12, 15),
    backgroundColor: 'rgba(255, 68, 68, 0.1)',
    marginLeft: getResponsiveSize(4, 6),
  },
  progressContainer: {
    marginBottom: Math.min(20, width * 0.05),
    alignItems: 'center',
  },
  progressBar: {
    width: '100%',
    height: Math.min(6, width * 0.015),
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: Math.min(3, width * 0.008),
    overflow: 'hidden',
    marginBottom: Math.min(8, width * 0.02),
  },
  progressFill: {
    height: '100%',
    backgroundColor: theme.colors.secondary,
    borderRadius: Math.min(3, width * 0.008),
  },
  progressText: {
    color: '#ffffff',
    fontSize: Math.min(12, width * 0.03),
    opacity: 0.8,
  },
  validationSummary: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: Math.min(12, width * 0.03),
    padding: Math.min(16, width * 0.04),
    marginBottom: Math.min(20, width * 0.05),
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  validationTitle: {
    color: '#ffffff',
    fontSize: Math.min(14, width * 0.035),
    fontWeight: 'bold',
    marginBottom: Math.min(12, width * 0.03),
  },
  validationItems: {
    gap: Math.min(8, width * 0.02),
  },
  validationItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  mobileDisplayText: {
    color: '#333',
    fontSize: Math.min(16, width * 0.04),
    textAlign: 'center',
    marginBottom: Math.min(16, width * 0.04),
    fontWeight: '500',
  },
  modalButtonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginTop: Math.min(16, width * 0.04),
    gap: Math.min(12, width * 0.03),
  },
  modalButton: {
    flex: 1,
    backgroundColor: theme.colors.secondary,
    paddingVertical: Math.min(12, width * 0.03),
    paddingHorizontal: Math.min(16, width * 0.04),
    borderRadius: Math.min(18, width * 0.045),
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalButtonText: {
    color: '#ffffff',
    fontSize: Math.min(16, width * 0.04),
    fontWeight: 'bold',
  },
  validationText: {
    color: '#ffffff',
    fontSize: Math.min(12, width * 0.03),
    marginLeft: Math.min(8, width * 0.02),
    opacity: 0.7,
  },
  validationTextValid: {
    opacity: 1,
    fontWeight: '500',
  },
  validationTextError: {
    color: '#ff4444',
    opacity: 1,
  },
  tipsSection: {
    marginTop: Math.min(20, width * 0.05),
    marginBottom: Math.min(15, width * 0.04),
  },
  tipsTitle: {
    color: '#ffffff',
    fontSize: Math.min(16, width * 0.04),
    fontWeight: 'bold',
    marginBottom: Math.min(12, width * 0.03),
    textAlign: 'center',
  },
  tipsContainer: {
    gap: Math.min(8, width * 0.02),
  },
  tipItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: Math.min(8, width * 0.02),
    padding: Math.min(10, width * 0.025),
  },
  tipText: {
    color: '#ffffff',
    fontSize: Math.min(12, width * 0.03),
    marginLeft: Math.min(8, width * 0.02),
    opacity: 0.9,
    flex: 1,
  },
});
