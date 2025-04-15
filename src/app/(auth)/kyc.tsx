import React, { useState, useEffect } from "react";
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
  ScrollView,
  Keyboard,
} from "react-native";
import { useFocusEffect, useRouter } from "expo-router";
import { useLocalSearchParams } from "expo-router";
import { theme } from "@/constants/theme";

const { width } = Dimensions.get("window");
const logoWidth = width * 0.3;

export default function BasicDetailsForm() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [referralCode, setReferralCode] = useState("");
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const router = useRouter();
  const { mobile } = useLocalSearchParams();
  const mobileStr = Array.isArray(mobile) ? mobile[0] : mobile || "";
  const scrollRef = React.useRef<ScrollView>(null);

  useFocusEffect(
    React.useCallback(() => {
      setName("");
      setEmail("");
      setReferralCode("");
    }, [])
  );

  useEffect(() => {
    const keyboardDidShow = Keyboard.addListener("keyboardDidShow", (e) => {
      setKeyboardHeight(e.endCoordinates.height);
      scrollRef.current?.scrollToEnd({ animated: true });
    });

    const keyboardDidHide = Keyboard.addListener("keyboardDidHide", () => {
      setKeyboardHeight(0);
    });

    return () => {
      keyboardDidShow.remove();
      keyboardDidHide.remove();
    };
  }, []);

  const validateForm = () => {
    if (!name.trim()) {
      Alert.alert("Error", "Please enter your full name");
      return false;
    }

    if (!/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/.test(email)) {
      Alert.alert("Error", "Please enter a valid email address");
      return false;
    }

    if (referralCode && !/^[A-Z0-9]{6}$/.test(referralCode)) {
      Alert.alert("Error", "Referral code must be 6 alphanumeric characters");
      return false;
    }

    return true;
  };

  const handleSubmit = () => {
    if (validateForm()) {
      router.push({
        pathname: "/(auth)/mpin",
        params: {
          name: name.trim(),
          email: email.trim(),
          mobile: mobile,
          referral_code: referralCode.trim(),
        },
      });
    }
  };

  const handleReferralCodeChange = (text: string) => {
    const formattedValue = text.replace(/[^A-Za-z0-9]/g, "");
    setReferralCode(formattedValue.slice(0, 6).toUpperCase());
  };

  return (
    <ImageBackground
      source={theme.image.bg_image}
      style={styles.backgroundImage}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.container}
        keyboardVerticalOffset={Platform.OS === "ios" ? 60 : 0}
      >
        <ScrollView
          ref={scrollRef}
          contentContainerStyle={[
            styles.scrollContent,
            { paddingBottom: keyboardHeight + 20 },
          ]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.formContainer}>
            <Image
              source={theme.image.transparentLogo}
              style={[styles.logo, { width: logoWidth, aspectRatio: 1 }]}
              resizeMode="contain"
            />

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Registered Mobile</Text>
              <TextInput
                style={[styles.input, styles.disabledInput]}
                value={mobileStr}
                editable={false}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Full Name *</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter your name"
                placeholderTextColor="#999"
                value={name}
                onChangeText={setName}
                autoCapitalize="words"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Email *</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter your email"
                placeholderTextColor="#999"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Referral Code (optional)</Text>
              <TextInput
                style={styles.input}
                placeholder="6 alphanumeric characters"
                placeholderTextColor="#999"
                value={referralCode}
                onChangeText={handleReferralCodeChange}
                keyboardType="default"
                autoCapitalize="characters"
                maxLength={6}
              />
              {referralCode.length > 0 && referralCode.length < 6 && (
                <Text style={styles.errorText}>Must be 6 characters</Text>
              )}
            </View>

            <TouchableOpacity
              style={styles.button}
              onPress={handleSubmit}
              activeOpacity={0.9}
            >
              <Text style={styles.buttonText}>Submit</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.backButton}
              onPress={() => router.back()}
            >
              <Text style={styles.backButtonText}>Back</Text>
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
  scrollContent: {
    flexGrow: 1,
    justifyContent: "center",
  },
  formContainer: {
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  inputGroup: {
    marginBottom: 15,
    width: "100%",
  },
  label: {
    color: "#fff",
    fontSize: 14,
    marginBottom: 5,
    marginLeft: 10,
  },
  input: {
    backgroundColor: "#fff",
    width: "100%",
    padding: 15,
    borderRadius: 25,
    fontSize: 16,
  },
  disabledInput: {
    backgroundColor: "#e8e8e8",
    opacity: 0.9,
  },
  button: {
    backgroundColor: "#ffc90c",
    borderRadius: 25,
    paddingVertical: 15,
    marginTop: 20,
    width: "100%",
    alignItems: "center",
  },
  buttonText: {
    color: "#2e0406",
    fontSize: 16,
    fontWeight: "600",
  },
  backButton: {
    marginTop: 15,
    marginBottom: 20,
    alignSelf: "center",
  },
  backButtonText: {
    color: "#fff",
    fontSize: 14,
    textDecorationLine: "underline",
  },
  logo: {
    aspectRatio: 1,
    marginTop: 90,
  },
  errorText: {
    color: "#ffc90c",
    fontSize: 12,
    marginTop: 5,
    marginLeft: 15,
  },
});
