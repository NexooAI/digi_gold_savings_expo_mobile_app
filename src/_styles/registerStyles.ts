import { StyleSheet, Platform } from "react-native";
import { theme } from "@/constants/theme";
import { useState } from "react";
import { View, Text, TextInput, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";

const [mobile, setMobile] = useState('');
const [otp, setOtp] = useState('');
const [otpSent, setOtpSent] = useState(false);
const [otpVerified, setOtpVerified] = useState(false);

const [name, setName] = useState('');
const [email, setEmail] = useState('');
const [referral, setReferral] = useState('');

export const registerStyles = StyleSheet.create({
  backgroundImage: {
    flex: 1,
    resizeMode: "cover",
  },
  darkOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0)', // Adjust opacity as needed
    zIndex: 0,
  },
  gradient: {
    flex: 1,
  },
  container: {
    flex: 1,
    paddingBottom: Platform.OS === "ios" ? 40 : 20,
  },
  keyboardAvoidingView: {
    flex: 1,
  },
  scrollViewContent: {
    flexGrow: 1,
  },
  formContainer: {
    flex: 1,
    justifyContent: "flex-start",
    paddingHorizontal: 10,
    paddingBottom: 0,
  },
  cardContainer: {
    borderRadius: 16,
    padding: 12,
    paddingBottom: 16,
    width: "100%",
    borderWidth: 1,
    borderColor: "rgba(255, 201, 12, 0.3)",
    marginBottom: 8,
    overflow: "hidden",
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 6,
        backdropFilter: "blur(12px)",
      },
      android: {
        elevation: 6,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 6,
      },
    }),
    position: "relative",
  },
  cardContent: {
    position: "relative",
    zIndex: 1,
    paddingVertical: 0,
  },
  pageTitle: {
    color: "#1a2a39",
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 6,
    textAlign: "center",
  },
  subtitle: {
    color: "#4A4A4A",
    fontSize: 14,
    marginBottom: 12,
    textAlign: "center",
    opacity: 0.85,
  },
  inputContainer: {
    width: "100%",
    marginBottom: 6,
  },
  loginButton: {
    width: "100%",
    height: 50,
    borderRadius: 25,
    overflow: "hidden",
    marginTop: 6,
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
  loginButtonText: {
    color: theme.colors.textDark,
    fontSize: 18,
    fontWeight: "bold",
  },
  otpContainer: {
    alignItems: "center",
    marginVertical: 20,
    width: "100%",
  },
  otpTitle: {
    color: "#000000",
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 10,
  },
  otpSentText: {
    color: "#000000",
    fontSize: 16,
    marginBottom: 20,
    opacity: 0.8,
  },
  otpInputsWrapper: {
    position: "relative",
    width: "70%",
    alignSelf: "center",
    justifyContent: "center",
    alignItems: "center",
  },
  otpInputsContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: "100%",
    marginTop: 10,
  },
  otpInput: {
    width: 50,
    height: 50,
    borderWidth: 1,
    borderColor: "rgba(0, 0, 0, 0.1)",
    borderRadius: 12,
    color: "#FFD700",
    fontSize: 24,
    backgroundColor: "#ffffff",
    textAlign: "center",
  },
  eyeButton: {
    position: "absolute",
    right: -40,
    top: 20,
  },
  timerContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 15,
  },
  timerText: {
    color: "#ffffff",
    marginLeft: 8,
    fontSize: 16,
    opacity: 0.8,
  },
  resendButton: {
    marginTop: 10,
    padding: 10,
  },
  resendText: {
    color: theme.colors.secondary,
    fontSize: 16,
    fontWeight: "bold",
    textDecorationLine: "underline",
  },
  registerContainer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginTop: 20,
  },
  registerText: {
    color: "#ffffff",
    fontSize: 16,
    opacity: 0.8,
  },
  registerLink: {
    color: theme.colors.link,
    fontSize: 16,
    fontWeight: "bold",
    textDecorationLine: "underline",
    marginLeft: 4,
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
  poweredByContainer: {
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 10,
  },
  poweredByText: {
    color: theme.colors.secondary,
    fontSize: 14,
    opacity: 0.7,
    letterSpacing: 1,
  },
  logoContainer: {
    width: "100%",
    alignItems: "center",
    paddingTop: Platform.OS === "ios" ? 20 : 10,
    marginBottom: 0,
  },
  logo: {
    aspectRatio: 1,
  },
  footer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginTop: 20,
  },
  footerText: {
    color: "#ffffff",
    fontSize: 16,
    opacity: 0.8,
  },
  footerLink: {
    color: theme.colors.link,
    fontSize: 16,
    fontWeight: "bold",
    textDecorationLine: "underline",
    marginLeft: 4,
  },
  errorText: {
    color: "#ff4444",
    fontSize: 12,
    marginTop: 4,
    marginLeft: 4,
  },
  mpinContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: "80%",
    alignSelf: "center",
  },
  inputWrapper: {
    position: "relative",
  },
  mpinInput: {
    width: 60,
    height: 60,
    borderWidth: 2,
    borderColor: "rgba(255, 255, 255, 0.3)",
    borderRadius: 15,
    backgroundColor: "rgba(255, 255, 255, 0.95)",
    color: "#000000",
    fontSize: 28,
    fontWeight: "bold",
    textAlign: "center",
    marginVertical: 8,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  mpinInputEmpty: {
    borderColor: "rgba(255, 255, 255, 0.3)",
    backgroundColor: "rgba(255, 255, 255, 0.95)",
  },
  mpinInputFilled: {
    borderColor: "#ffd700",
    backgroundColor: "#ffffff",
    shadowColor: "#ffd700",
    shadowOffset: {
      width: 0,
      height: 0,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  inputIndicator: {
    position: "absolute",
    bottom: 10,
    left: "50%",
    marginLeft: -4,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#000000",
  },
  errorContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255, 68, 68, 0.1)",
    padding: 10,
    borderRadius: 8,
    marginBottom: 20,
  },
  label: {
    color: "#ffffff",
    fontSize: 14,
    marginBottom: 8,
    alignSelf: "center",
    textAlign: "center",
  },
  eyeToggle: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 8,
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
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitButtonText: {
    color: theme.colors.textDark,
    fontSize: 18,
    fontWeight: "bold",
  },
  backButton: {
    marginTop: 10,
    flexDirection: "row",
    alignItems: "center",
  },
  backButtonText: {
    color: "#ffffff",
    fontSize: 16,
    marginLeft: 5,
    opacity: 0.8,
  },
  input: {
    flex: 1,
    marginRight: 8,
  },
  formFieldsContainer: {
    width: '100%',
    alignItems: 'flex-start',
    paddingLeft: 4,
    paddingRight: 4,
  },
  registerInput: {
    width: '100%',
    backgroundColor: '#fffbe6',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 201, 12, 0.3)',
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: '#1a2a39',
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
}); 