import React, { useState } from "react";
import {
  View,
  TextInput,
  Text,
  Alert,
  StyleSheet,
  Keyboard,
} from "react-native";

const PhoneInput = ({ value, onChangeText, loading }) => {
  const [error, setError] = useState("");

  const validateMobile = (text) => {
    const numericText = text.replace(/[^0-9]/g, "").slice(0, 10);
    onChangeText(numericText);

    if (numericText.length > 0) {
      setError("");
    }
    if (numericText.length === 10) {
      Keyboard.dismiss();
    }
  };

  const handleBlur = () => {
    if (!value) {
      setError("Mobile number is required");
      Alert.alert("Error", "Please enter your mobile number");
      return;
    }

    if (value.length !== 10) {
      setError("Please enter a valid 10-digit mobile number");
      Alert.alert("Error", "Please enter a valid 10-digit mobile number");
      return;
    }

    setError("");
  };

  return (
    <View style={styles.container}>
      <Text style={styles.label}>Mobile Number:</Text>

      <View style={[styles.inputContainer, error && styles.errorContainer]}>
        <View style={styles.countryCodeBox}>
          <Text style={styles.countryCodeText}>+91</Text>
        </View>
        <TextInput
          placeholder="Mobile No."
          placeholderTextColor="#666"
          value={value}
          onChangeText={validateMobile}
          onBlur={handleBlur}
          keyboardType="phone-pad"
          autoCapitalize="none"
          editable={!loading}
          maxLength={10}
          style={[styles.input, error && styles.inputError]}
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
    marginBottom: 16,
    width: "100%",
  },
  label: {
    fontSize: 18,
    fontWeight: "600",
    color: "white",
    marginBottom: 6,
    paddingLeft: 8,
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f6f6f6",
    borderRadius: 24,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "transparent",
  },
  errorContainer: {
    backgroundColor: "#fff",
    borderColor: "red",
  },
  countryCodeBox: {
    backgroundColor: "#e5e5e5",
    paddingHorizontal: 10,
    paddingVertical: 12,
    borderRightWidth: 1,
    borderRightColor: "#ccc",
  },
  countryCodeText: {
    color: "#444",
  },
  input: {
    flex: 1,
    padding: 15,
    fontSize: 16,
    height: 45,
    backgroundColor: "transparent",
  },
  inputError: {
    backgroundColor: "#fff",
  },
  counterText: {
    textAlign: "right",
    paddingRight: 10,
    color: "white",
    fontSize: 12,
    marginTop: 0,
  },
  errorText: {
    color: "red",
    backgroundColor: "white",
    fontSize: 14,
    paddingLeft: 8,
    marginTop: 1,
    width: "60%",
  },
});

export default PhoneInput;
