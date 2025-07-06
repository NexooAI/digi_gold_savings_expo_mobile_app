import React, { useState } from "react";
import {
  View,
  TextInput,
  Text,
  Alert,
  StyleSheet,
  Keyboard,
} from "react-native";
import { t } from "@/i18n";

interface PhoneInputProps {
  value: string;
  onChangeText: (text: string) => void;
  loading: boolean;
}

const PhoneInput: React.FC<PhoneInputProps> = ({ value, onChangeText, loading }) => {
  const [error, setError] = useState("");

  const validateMobile = (text: string) => {
    try {
      const numericText = text.replace(/[^0-9]/g, "").slice(0, 10);
      onChangeText(numericText);

      if (numericText.length > 0) {
        setError("");
      }
      if (numericText.length === 10) {
        Keyboard.dismiss();
      }
    } catch (error) {
      console.error('PhoneInput validateMobile error:', error);
    }
  };

  const handleBlur = () => {
    try {
      if (!value) {
        setError(t("pleaseEnterMobile"));
        Alert.alert(t("error"), t("pleaseEnterMobile"));
        return;
      }

      if (value.length !== 10) {
        setError(t("validMobileNumber"));
        Alert.alert(t("error"), t("validMobileNumber"));
        return;
      }

      setError("");
    } catch (error) {
      console.error('PhoneInput handleBlur error:', error);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.label}>{t("mobileNumber")}:</Text>

      <View style={[styles.inputContainer, error && styles.errorContainer]}>
        <View style={styles.countryCodeBox}>
          <Text style={styles.countryCodeText}>+91</Text>
        </View>
        <TextInput
          placeholder={t("enterMobileNumber")}
          placeholderTextColor="rgba(0, 0, 0, 0.5)"
          value={value}
          onChangeText={validateMobile}
          onBlur={handleBlur}
          keyboardType="phone-pad"
          autoCapitalize="none"
          editable={!loading}
          maxLength={10}
          style={[styles.input, error && styles.inputError]}
          scrollEnabled={false}
          multiline={false}
          numberOfLines={1}
          textContentType="telephoneNumber"
          autoComplete="tel"
          returnKeyType="done"
          blurOnSubmit={true}
          enablesReturnKeyAutomatically={true}
        />
      </View>

      {/* Count */}
      <Text style={styles.counterText}>{value.length}/10</Text>

      {/* Error message */}
      {error ? <Text style={styles.errorText}>{error}</Text> : null}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 4,
    width: "100%",
  },
  label: {
    fontSize: 16,
    fontWeight: "700",
    color: "#ffd700",
    marginBottom: 8,
    paddingLeft: 4,
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#ffffff",
    borderRadius: 12,
    overflow: "hidden",
    borderWidth: 2,
    borderColor: "#2a4a7a",
    height: 50,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  errorContainer: {
    backgroundColor: "#ffffff",
    borderColor: "#ff4444",
    borderWidth: 2,
  },
  countryCodeBox: {
    backgroundColor: "#ffd700",
    paddingHorizontal: 16,
    paddingVertical: 0,
    borderRightWidth: 2,
    borderRightColor: "#2a4a7a",
    height: "100%",
    justifyContent: "center",
    alignItems: "center",
    minWidth: 50,
  },
  countryCodeText: {
    color: "#1a2a39",
    fontSize: 16,
    fontWeight: "700",
  },
  input: {
    flex: 1,
    paddingHorizontal: 12,
    paddingVertical: 0,
    fontSize: 16,
    height: 50,
    backgroundColor: "#ffffff",
    color: "#000000",
    fontWeight: "500",
    textAlignVertical: "center",
    includeFontPadding: false,
    paddingTop: 0,
    paddingBottom: 0,
    marginTop: 0,
    marginBottom: 0,
  },
  inputError: {
    backgroundColor: "#ffffff",
    color: "#000000",
  },
  counterText: {
    textAlign: "right",
    paddingRight: 4,
    color: "#b8c5d6",
    fontSize: 12,
    marginTop: 4,
    fontWeight: "600",
  },
  errorText: {
    color: "#ff4444",
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    fontSize: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
    marginTop: 4,
    borderRadius: 6,
    alignSelf: "flex-start",
    fontWeight: "500",
  },
});

export default PhoneInput;
