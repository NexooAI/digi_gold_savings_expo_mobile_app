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
  Animated,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import api from "@/services/api";
import * as SecureStore from "expo-secure-store";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Crypto from "expo-crypto";
import { theme } from "@/constants/theme";
import { COLORS } from "@/constants/colors";
import { LinearGradient } from "expo-linear-gradient";
import { t } from "@/i18n";
// import { useAuth } from "@/contexts/AuthContext";
import useGlobalStore from "@/store/global.store";
import { SafeAreaView } from "react-native-safe-area-context";
import { registerStyles } from "../../_styles/registerStyles";

const { width } = Dimensions.get("window");
const logoWidth = width * 0.12;
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

// Security Strength Component
const SecurityStrength = ({ mpin }: { mpin: string }) => {
  const getStrengthColor = () => {
    if (mpin.length === 0) return COLORS.grey;
    if (mpin.length < 4) return COLORS.error;
    if (mpin.length === 4) return COLORS.success;
    return COLORS.success;
  };

  const getStrengthText = () => {
    if (mpin.length === 0) return 'Enter MPIN';
    if (mpin.length < 4) return 'Weak';
    if (mpin.length === 4) return 'Strong';
    return 'Strong';
  };

  return (
    <View style={styles.securityContainer}>
      <View style={styles.strengthBar}>
        <View 
          style={[
            styles.strengthFill, 
            { 
              width: `${(mpin.length / 4) * 100}%`,
              backgroundColor: getStrengthColor()
            }
          ]} 
        />
      </View>
      <Text style={[styles.strengthText, { color: getStrengthColor() }]}>
        {getStrengthText()}
      </Text>
    </View>
  );
};

// Progress Indicator Component
const ProgressIndicator = ({ currentStep }: { currentStep: number }) => {
  return (
    <View style={styles.progressContainer}>
      <View style={styles.progressBar}>
        <View style={[styles.progressFill, { width: `${(currentStep / 2) * 100}%` }]} />
      </View>
      <Text style={styles.progressText}>Step {currentStep} of 2</Text>
    </View>
  );
};

interface MpinInputProps {
  length?: number;
  onComplete: (value: string) => void;
  secureTextEntry?: boolean;
  onClear?: () => void;
  showClearButton?: boolean;
}

const MpinInput: React.FC<MpinInputProps> = ({ 
  length = 4, 
  onComplete, 
  secureTextEntry,
  onClear,
  showClearButton = false
}) => {
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

  const handleClear = () => {
    setValues(Array(length).fill(""));
    onComplete("");
    onClear?.();
    // Focus first input after clearing
    inputs.current[0]?.focus();
  };

  return (
    <View style={styles.mpinInputContainer}>
      <View style={registerStyles.otpInputsContainer}>
        {values.map((value, index) => (
          <TextInput
            key={index}
            ref={(ref) => {
              inputs.current[index] = ref;
            }}
            style={registerStyles.otpInput}
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
      {showClearButton && values.some(v => v !== "") && (
        <TouchableOpacity
          style={styles.clearButton}
          onPress={handleClear}
        >
          <Ionicons name="close-circle" size={20} color={COLORS.error} />
        </TouchableOpacity>
      )}
    </View>
  );
};

export default function MpinSetup() {
  const { name, email, mobile, referral_code } = useLocalSearchParams();
  const router = useRouter();
  // const { register } = useAuth();
  const [mpin, setMpin] = useState("");
  const [confirmMpin, setConfirmMpin] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPin, setShowPin] = useState(false);
  const [error, setError] = useState("");
  const [currentStep, setCurrentStep] = useState(1);
  const [clearKey, setClearKey] = useState(0);


  useEffect(() => {
    if (mpin.length === 4 && confirmMpin.length === 4) {
      setError(mpin !== confirmMpin ? "MPIN mismatch" : "");
      setCurrentStep(2);
    } else if (mpin.length === 4) {
      setCurrentStep(2);
      setError("");
    } else {
      setCurrentStep(1);
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
      // MPIN is now stored on server, no need for local hashing
      const response = await api.post("/register/complete", {
        name,
        email,
        mobile_number: mobile,
        mpin,
        password: mpin,
        referral_code: referral_code || ""
      });

      console.log('🔍 Registration API response status:', response.status);
      console.log('🔍 Registration API response data:', response.data);

      if (response.status === 200) {
        const data = response.data;
        
        console.log('🔍 Registration successful, response data:', data);
        
        // Validate response structure
        if (!data.accessToken || !data.token || !data.refreshtoken || !data.user) {
          console.error('🔍 Invalid response structure:', data);
          Alert.alert(t("error"), "Invalid response from server");
          return;
        }
        
        try {
          // Store all tokens securely like in login flow
          await SecureStore.setItemAsync("authToken", data.token);
          await SecureStore.setItemAsync("accessToken", data.accessToken);
          await SecureStore.setItemAsync("token", data.token);
          await SecureStore.setItemAsync("refreshToken", data.refreshtoken);
          
          // Store user data in AsyncStorage like in login flow
          await AsyncStorage.setItem("userData", JSON.stringify(data.user));
          
                     // Login to global store like in login flow
           console.log('🔍 Setting user data in global store (MPIN):', {
            id: data.user.user_id || data.user.id,
             name: data.user.name,
             email: data.user.email,
             mobile: data.user.mobile_number,
             referralCode: data.user.referralCode || data.user.referral_code,
             profile_photo: data.user.profile_photo,
             mpinStatus: data.user.mpinStatus,
             usertype: data.user.userType || data.user.user_type,
           });
           useGlobalStore.getState().login(data.token, {
             id: data.user.user_id || data.user.id,
             name: data.user.name,
             email: data.user.email,
             mobile: data.user.mobile_number,
             referralCode: data.user.referralCode || data.user.referral_code,
             profile_photo: data.user.profile_photo,
             mpinStatus: data.user.mpinStatus,
             usertype: data.user.userType || data.user.user_type,
           });
          
          // Store registration timestamp to bypass MPIN verification
          await SecureStore.setItemAsync("registrationTimestamp", Date.now().toString());
          
          // Directly navigate to home page after successful registration
          console.log('🔍 Registration successful, navigating directly to home page');
          router.replace("/(app)/(tabs)/home");
        } catch (storageError) {
          console.error("Error storing authentication data:", storageError);
          Alert.alert(
            t("error"),
            t("failedToStoreAuthData"),
            [{ text: t("ok") }]
          );
        }
      }
    } catch (error: any) {
      console.error('🔍 Registration error:', error);
      console.error('🔍 Error response:', error.response?.data);
      Alert.alert(
        t("error"),
        error.response?.data?.message || t("registrationFailed")
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={registerStyles.container}>
      <ImageBackground
        source={theme.images.auth.loginBg}
        style={registerStyles.backgroundImage}
      >
        {/* Dark overlay for background */}
        <View style={registerStyles.darkOverlay} />
        <LinearGradient
          colors={[theme.colors.bgPrimaryMedium, theme.colors.transparent, theme.colors.transparent]}
          style={registerStyles.gradient}
        >
          <KeyboardAvoidingView
            behavior={Platform.OS === "ios" ? "padding" : "height"}
            style={registerStyles.keyboardAvoidingView}
            keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 0}
            enabled={true}
          >
            <ScrollView 
              contentContainerStyle={[registerStyles.scrollViewContent, { flexGrow: 1, justifyContent: 'space-between', paddingVertical: 20 }]} 
              keyboardShouldPersistTaps="always"
              showsVerticalScrollIndicator={false}
              scrollEnabled={true}
              bounces={true}
              keyboardDismissMode="none"
            >
              <View style={styles.logoContainer}>
                <Image
                  source={require('../../../assets/images/logo_trans.png')}
                  style={styles.logo}
                  resizeMode="contain"
                />
              </View>

              <View style={styles.formContainer}>
                <View style={registerStyles.cardContainer}>
                  {/* Base fog layer */}
                  <LinearGradient
                    colors={[
                      theme.colors.bgPrimaryHeavy,
                      theme.colors.bgPrimaryLight,
                      theme.colors.bgPrimaryMedium,
                    ]}
                    style={StyleSheet.absoluteFill}
                  />
                  {/* Top fog highlight */}
                  <LinearGradient
                    colors={[
                      theme.colors.bgPrimaryLight,
                      theme.colors.text.mediumGrey,
                    ]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 0, y: 0.5 }}
                    style={StyleSheet.absoluteFill}
                  />
                  {/* Bottom fog highlight */}
                  <LinearGradient
                    colors={[
                      theme.colors.bgBlackMedium,
                      theme.colors.bgBlackLight,
                    ]}
                    start={{ x: 0, y: 0.5 }}
                    end={{ x: 0, y: 1 }}
                    style={StyleSheet.absoluteFill}
                  />
                  {/* Content */}
                  <View style={registerStyles.cardContent}>
                    <ProgressIndicator currentStep={currentStep} />
                    <Text style={registerStyles.pageTitle}>{t("setMpinTitle")}</Text>
                    <Text style={registerStyles.subtitle}>{t("setMpinSubtitle")}</Text>

                    <View style={styles.inputSection}>
                      <Text style={styles.label}>{t("createMpinLabel")}</Text>
                      <View style={registerStyles.otpInputsWrapper}>
                        <MpinInput
                          key={`mpin-${clearKey}`}
                          length={4}
                          onComplete={setMpin}
                          secureTextEntry={!showPin}
                          showClearButton={mpin.length > 0}
                          onClear={() => setMpin("")}
                        />
                        <TouchableOpacity
                          onPress={() => setShowPin(!showPin)}
                          style={registerStyles.eyeButton}
                        >
                          <Ionicons
                            name={showPin ? "eye-off" : "eye"}
                            size={24}
                            color={theme.colors.white}
                          />
                        </TouchableOpacity>
                      </View>
                      <SecurityStrength mpin={mpin} />
                    </View>

                    <View style={styles.inputSection}>
                      <Text style={styles.label}>{t("confirmMpinLabel")}</Text>
                      <View style={registerStyles.otpInputsWrapper}>
                        <MpinInput
                          key={`confirm-mpin-${clearKey}`}
                          length={4}
                          onComplete={setConfirmMpin}
                          secureTextEntry={!showPin}
                          showClearButton={confirmMpin.length > 0}
                          onClear={() => setConfirmMpin("")}
                        />
                        <TouchableOpacity
                          onPress={() => setShowPin(!showPin)}
                          style={registerStyles.eyeButton}
                        >
                          <Ionicons
                            name={showPin ? "eye-off" : "eye"}
                            size={24}
                            color={theme.colors.white}
                          />
                        </TouchableOpacity>
                      </View>
                      <SecurityStrength mpin={confirmMpin} />
                    </View>

                    {error ? (
                      <View style={styles.errorContainer}>
                        <Ionicons name="alert-circle" size={20} color={COLORS.error} />
                        <Text style={styles.errorText}>{error}</Text>
                      </View>
                    ) : null}

                    <View style={styles.buttonRow}>
                      <TouchableOpacity
                        style={styles.actionButton}
                        onPress={() => {
                          setMpin("");
                          setConfirmMpin("");
                          setCurrentStep(1);
                          setError("");
                          setClearKey(prev => prev + 1);
                        }}
                      >
                        <Ionicons name="refresh" size={20} color={theme.colors.white} />
                        <Text style={styles.actionButtonText}>{t("clear")}</Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                        style={styles.actionButton}
                        onPress={() => setShowPin(!showPin)}
                      >
                        <Ionicons
                          name={showPin ? "eye-off" : "eye"}
                          size={20}
                          color={theme.colors.white}
                        />
                        <Text style={styles.actionButtonText}>
                          {showPin ? t("hideMpinLabel") : t("showMpinLabel")}
                        </Text>
                      </TouchableOpacity>
                    </View>

                    <TouchableOpacity
                      style={[
                        registerStyles.loginButton,
                        (error || loading) && registerStyles.loginButtonDisabled,
                      ]}
                      onPress={handleSubmit}
                      disabled={!!error || loading}
                    >
                      <LinearGradient
                        colors={[COLORS.secondary, COLORS.gold]}
                        style={registerStyles.gradientButton}
                      >
                        <Text style={registerStyles.loginButtonText}>
                          {loading ? t("processing") : t("setMpinButton")}
                        </Text>
                      </LinearGradient>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            </ScrollView>
          </KeyboardAvoidingView>
        </LinearGradient>
      </ImageBackground>


    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  inputSection: {
    marginBottom: 25,
    width: "100%",
    alignItems: "center",
  },
  label: {
            color: COLORS.white,
    fontSize: 16,
    marginBottom: 15,
    textAlign: "center",
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 68, 68, 0.1)',
    padding: 10,
    borderRadius: 8,
    marginBottom: 20,
    alignSelf: 'center',
  },
  errorText: {
            color: COLORS.error,
    fontSize: 14,
    marginLeft: 8,
  },
  mpinInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  clearButton: {
    marginLeft: 10,
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 20,
    paddingHorizontal: 20,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 25,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    width: 140,
    height: 45,
  },
  actionButtonText: {
    color: theme.colors.white,
    fontSize: 14,
    marginLeft: 8,
    fontWeight: '600',
  },
  formContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 20,
    width: "100%",
    maxWidth: 400,
    minHeight: 600,
  },
  logoContainer: {
    width: "100%",
    alignItems: "center",
    justifyContent: "center",
    paddingTop: Platform.OS === "ios" ? 5 : 2,
    marginBottom: 10,
    height: 60,
  },
  logo: {
    width: logoWidth,
    height: logoWidth * 0.8,
    resizeMode: "contain",
  },
  securityContainer: {
    width: '100%',
    alignItems: 'center',
    marginTop: 10,
  },
  strengthBar: {
    width: '80%',
    height: 8,
    backgroundColor: COLORS.darkGrey,
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 5,
  },
  strengthFill: {
    height: '100%',
    borderRadius: 4,
  },
  strengthText: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  progressContainer: {
    width: '100%',
    alignItems: 'center',
    marginTop: 20,
  },
  progressBar: {
    width: '80%',
    height: 8,
    backgroundColor: COLORS.darkGrey,
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
    backgroundColor: COLORS.gold,
  },
  progressText: {
    marginTop: 5,
    color: COLORS.white,
    fontSize: 12,
  },
  // Success Modal Styles
  modalOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: COLORS.blackOverlay,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  successModal: {
    width: '90%',
    maxWidth: 400,
    borderRadius: 20,
    overflow: 'hidden',
    elevation: 10,
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  successModalGradient: {
    padding: 30,
    alignItems: 'center',
  },
  successIconContainer: {
    marginBottom: 20,
  },
  successTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.white,
    textAlign: 'center',
    marginBottom: 10,
  },
  successSubtitle: {
    fontSize: 16,
    color: COLORS.white,
    textAlign: 'center',
    marginBottom: 25,
    lineHeight: 22,
  },
  successFeatures: {
    width: '100%',
    marginBottom: 25,
  },
  featuresTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.white,
    marginBottom: 15,
    textAlign: 'center',
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    paddingHorizontal: 10,
  },
  featureText: {
    fontSize: 14,
    color: theme.colors.white,
    marginLeft: 12,
    flex: 1,
  },
  referralContainer: {
    width: '100%',
    alignItems: 'center',
    marginBottom: 25,
  },
  referralLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    color: theme.colors.white,
    marginBottom: 10,
  },
  referralCodeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.overlayLight,
    paddingHorizontal: 15,
    paddingVertical: 10,
    borderRadius: 25,
  },
  referralCode: {
    fontSize: 18,
    fontWeight: 'bold',
    color: theme.colors.white,
    marginRight: 10,
  },
  copyButton: {
    padding: 5,
  },
  getStartedButton: {
    width: '100%',
    borderRadius: 25,
    overflow: 'hidden',
  },
  getStartedGradient: {
    paddingVertical: 15,
    alignItems: 'center',
  },
  getStartedText: {
    fontSize: 18,
    fontWeight: 'bold',
            color: COLORS.black,
  },
});
