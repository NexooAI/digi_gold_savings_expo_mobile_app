import { StyleSheet, Platform, Dimensions } from "react-native";
import { theme } from "@/constants/theme";

export const registerStyles = StyleSheet.create({
  backgroundImage: {
    flex: 1,
    resizeMode: "cover",
  },
  darkOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: theme.colors.transparent, // Adjust opacity as needed
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
    borderColor: theme.colors.borderWhiteLight,
    marginBottom: 8,
    overflow: "hidden",
    ...Platform.select({
      ios: {
        shadowColor: theme.colors.shadowBlack,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 6,
        backdropFilter: "blur(12px)",
      },
      android: {
        elevation: 6,
        shadowColor: theme.colors.shadowBlack,
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
    color: theme.colors.white,
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 6,
    textAlign: "center",
  },
  subtitle: {
    color: theme.colors.white,
    fontSize: 14,
    marginBottom: 12,
    textAlign: "center",
    opacity: 0.8,
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
        shadowColor: theme.colors.shadowBlack,
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
    color: theme.colors.white,
    fontSize: 18,
    fontWeight: "bold",
  },
  otpContainer: {
    alignItems: "center",
    marginVertical: 24,
    width: "100%",
    paddingVertical: 16, // Added for more vertical space
    minHeight: 220, // Ensures enough space for small screens
  },
  otpTitle: {
    color: theme.colors.white,
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 10,
  },
  otpSentText: {
    color: theme.colors.white,
    fontSize: 16,
    marginBottom: 20,
    opacity: 0.8,
  },
  otpInputsWrapper: {
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 8,
    minHeight: 70,
  },
  otpInputsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '80%', // Responsive width
    maxWidth: 320,
    minWidth: 180,
    alignSelf: 'center',
    gap: 8, // For RN 0.71+, otherwise use marginHorizontal in otpInput
  },
  otpInput: {
    width: 48,
    height: 48,
    borderWidth: 1,
    borderColor: theme.colors.bgBlackLight,
    borderRadius: 10,
    color: theme.colors.black,
    fontSize: 22,
    backgroundColor: theme.colors.white,
    textAlign: 'center',
    marginHorizontal: 4, // For spacing if gap is not supported
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
    color: theme.colors.white,
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
    color: theme.colors.white,
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
    backgroundColor: theme.colors.bgErrorMedium,
    borderRadius: 12,
    padding: 15,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    zIndex: 1000,
    shadowColor: theme.colors.shadowBlack,
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
    color: theme.colors.white,
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
    color: theme.colors.primary,
    fontSize: 14,
    opacity: 0.7,
    letterSpacing: 1,
  },
  logoContainer: {
    width: "100%",
    alignItems: "center",
    paddingTop: Platform.OS === "ios" ? 20 : 1,
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
    color: theme.colors.white,
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
    color: theme.colors.textError,
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
    borderColor: theme.colors.borderWhiteLight,
    borderRadius: 15,
    backgroundColor: theme.colors.bgWhiteVeryHeavy,
    color: theme.colors.black,
    fontSize: 28,
    fontWeight: "bold",
    textAlign: "center",
    marginVertical: 8,
    shadowColor: theme.colors.shadowBlack,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  mpinInputEmpty: {
    borderColor: theme.colors.borderWhiteLight,
    backgroundColor: theme.colors.bgWhiteVeryHeavy,
  },
  mpinInputFilled: {
    borderColor: theme.colors.gold,
    backgroundColor: theme.colors.white,
    shadowColor: theme.colors.shadowGold,
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
    backgroundColor: theme.colors.black,
  },
  errorContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: theme.colors.bgErrorLight,
    padding: 10,
    borderRadius: 8,
    marginBottom: 20,
  },
  label: {
    color: theme.colors.white,
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
        shadowColor: theme.colors.shadowBlack,
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
    color: theme.colors.white,
    fontSize: 16,
    marginLeft: 5,
    opacity: 0.8,
  },
 
}); 
// You'll need to update your registerStyles.ts file with the new styles or add them here.
// For demonstration, I'm adding them directly.
// Ensure your existing registerStyles are merged with these new ones.
export const newRegisterStyles = StyleSheet.create({
  // Add or modify these styles in your _styles/registerStyles.ts file
  mobileInputTopRight: {
    alignSelf: 'flex-end', // Aligns the PhoneInput to the right
    marginTop: -80, // Adjust as needed to move it up
    marginBottom: 20, // Adjust spacing below it
    width: 'auto', // Allow it to shrink to content
    position: 'absolute', // Position it absolutely
    top: 20, // Adjust top position
    right: 20, // Adjust right position
    zIndex: 5, // Bring it to front
    backgroundColor: theme.colors.overlayDark, // Optional: Add a background
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  textInput: {
    height: 50,
    backgroundColor: theme.colors.bgWhiteLight,
    borderRadius: 10,
    paddingHorizontal: 20,
    fontSize: 16,
    color: theme.colors.white,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  additionalDetailsContainer: {
    width: "100%",
    marginTop: 30, // Adjust spacing from OTP
  },
  otpInputsWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center', // Center the OTP inputs and eye icon
    width: '100%',
    marginBottom: 20,
  },
  otpInputsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '70%', // Adjust width for OTP inputs
    marginRight: 10, // Space between OTP inputs and eye icon
  },
  otpInput: {
    width: 50,
    height: 50,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: 10,
    textAlign: 'center',
    fontSize: 24,
    color: theme.colors.white,
    backgroundColor: theme.colors.bgWhiteLight,
  },
  eyeButton: {
    padding: 10,
  },
  // Ensure existing styles are compatible, e.g., registerStyles.formContainer
  // might need adjustment for vertical alignment or padding if the mobile input shifts.
  formContainer: {
    width: "90%",
    maxWidth: 500,
    alignItems: "center",
    justifyContent: "center",
    marginTop: Dimensions.get('window').height * 0.15, // Adjusted to make space for the floating phone input
    marginBottom: 20,
  },
  cardContainer: {
    borderRadius: 20,
    overflow: "hidden",
    width: "100%",
    padding: 20, // Increased padding
  },
  cardContent: {
    paddingTop: 30, // Increased top padding to give space for mobile input moving up
    paddingBottom: 20,
    alignItems: "center",
    justifyContent: "center",
    position: "relative", // Needed for absolute positioning of mobile input
  },
});