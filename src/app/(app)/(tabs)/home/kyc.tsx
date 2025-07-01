import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Alert,
  StyleSheet,
  Keyboard,
  ImageBackground,
} from "react-native";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { Picker } from "@react-native-picker/picker";
import DateTimePicker from "@react-native-community/datetimepicker";
import useGlobalStore from "@/store/global.store";
import RNPickerSelect from "react-native-picker-select";
import api from "@/services/api";
import { theme } from "@/constants/theme";
import { LinearGradient } from "expo-linear-gradient";

const indianStates = [
  "Andhra Pradesh",
  "Arunachal Pradesh",
  "Assam",
  "Bihar",
  "Chhattisgarh",
  "Goa",
  "Gujarat",
  "Haryana",
  "Himachal Pradesh",
  "Jharkhand",
  "Karnataka",
  "Kerala",
  "Madhya Pradesh",
  "Maharashtra",
  "Manipur",
  "Meghalaya",
  "Mizoram",
  "Nagaland",
  "Odisha",
  "Punjab",
  "Rajasthan",
  "Sikkim",
  "Tamil Nadu",
  "Telangana",
  "Tripura",
  "Uttar Pradesh",
  "Uttarakhand",
  "West Bengal",
];

const idTypes = [
  { name: "Aadhar", value: "aadhar" },
  { name: "PAN", value: "pan" },
  { name: "Voter ID", value: "voterid" },
];

const nomineeRelationship = [
  // { name: "Aadhar", value: "aadhar" },
  { name: "Father", value: "father" },
  { name: "Mother", value: "mother" },
  { name: "Brother", value: "brother" },
  { name: "Sister", value: "sister" },
  { name: "Son", value: "son" },
  { name: "Daughter", value: "daughter" },
  { name: "Spouse", value: "spouse" },
  { name: "Friend", value: "friend" },
  { name: "Relative", value: "relative" },
  { name: "Other", value: "other" },
  // { name: "PAN", value: "pan" },
  // { name: "Voter ID", value: "voterid" },
];

// Add interfaces at the top of the file
interface FormData {
  doorno: string;
  street: string;
  area: string;
  city: string;
  district: string;
  state: string;
  country: string;
  pincode: string;
  dob: string;
  addressprooftype: string;
  idNumber: string;
  nominee_name: string;
  nominee_relationship: string;
}

interface FormDatePickerProps {
  label: string;
  value: string;
  onDateChange: (date: string) => void;
  error?: string;
}

export default function KycForm() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { language, user } = useGlobalStore();
  const [formData, setFormData] = useState<FormData>({
    doorno: "",
    street: "",
    area: "",
    city: "",
    district: "",
    state: "",
    country: "India",
    pincode: "",
    dob: "",
    addressprooftype: "",
    idNumber: "",
    nominee_name: "",
    nominee_relationship: "",
  });

  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [keyboardVisible, setKeyboardVisible] = useState(false);
  const [kycId, setKycId] = useState<string | null>(null);

  const navBarHeight = 56; // Typical bottom nav bar height

  // Keyboard listeners
  React.useEffect(() => {
    const keyboardDidShowListener = Keyboard.addListener(
      "keyboardDidShow",
      () => {
        setKeyboardVisible(true);
      }
    );
    const keyboardDidHideListener = Keyboard.addListener(
      "keyboardDidHide",
      () => {
        setKeyboardVisible(false);
      }
    );

    return () => {
      keyboardDidShowListener.remove();
      keyboardDidHideListener.remove();
    };
  }, []);

  // Fetch KYC details on mount
  useEffect(() => {
    const fetchKyc = async () => {
      try {
        const res = await api.get(`/kyc/status/${user?.id}`);
        if (res.data && res.data.data) {
          const kycData = res.data.data;
          setKycId(kycData.id?.toString() || null);

          // Map the API response to form fields
          setFormData({
            doorno: kycData.doorno || "",
            street: kycData.street || "",
            area: kycData.area || "",
            city: kycData.city || "",
            district: kycData.district || "",
            state: kycData.state || "",
            country: kycData.country || "India",
            pincode: kycData.pincode || "",
            dob: kycData.dob
              ? new Date(kycData.dob).toLocaleDateString("en-GB")
              : "",
            addressprooftype: kycData.addressproof || "",
            idNumber: kycData.enternumber || "",
            nominee_name: kycData.nominee_name || "",
            nominee_relationship: kycData.nominee_relationship || "",
          });

        }
      } catch (e) {
        console.error("Error fetching KYC:", e);
      }
    };
    fetchKyc();
  }, [user?.id]);

  // Update the FormDatePicker component with proper types
  const FormDatePicker: React.FC<FormDatePickerProps> = ({
    label,
    value,
    onDateChange,
    error,
  }) => {
    const [showPicker, setShowPicker] = useState(false);
    const [selectedDate, setSelectedDate] = useState(
      value ? new Date(value.split("/").reverse().join("-")) : new Date()
    );

    const handleDateChange = (event: any, date?: Date) => {
      if (date) {
        setSelectedDate(date);
        if (Platform.OS === "android") {
          setShowPicker(false);
          onDateChange(formatDate(date));
        }
      }
    };

    const handleIosConfirmation = () => {
      setShowPicker(false);
      onDateChange(formatDate(selectedDate));
    };

    const formatDate = (date: Date): string => {
      return date.toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      });
    };

    const minDate = new Date();
    minDate.setFullYear(minDate.getFullYear() - 100); // Optional, for past dates

    // Calculate the maximum date (18 years ago)
    const maxDate = new Date();
    maxDate.setFullYear(maxDate.getFullYear() - 18); // 18 years before today

    return (
      <View style={styles.formGroup}>
        <Text style={styles.label}>{label}</Text>

        <TouchableOpacity
          onPress={() => {
            Keyboard.dismiss();
            setShowPicker(true);
          }}
          style={styles.dateInputWrapper}
        >
          <TextInput
            style={styles.dateInput}
            pointerEvents="none"
            editable={false}
            value={formatDate(selectedDate)}
            placeholder="DD/MM/YYYY"
          />
          <Ionicons
            name="calendar"
            size={24}
            color="#007AFF"
            style={styles.calendarIcon}
          />
        </TouchableOpacity>

        {showPicker && (
          <View>
            <DateTimePicker
              value={selectedDate}
              mode="date"
              display={Platform.OS === "ios" ? "inline" : "default"}
              onChange={handleDateChange}
              minimumDate={minDate}
              maximumDate={maxDate}
              themeVariant="light"
            />

            {Platform.OS === "ios" && (
              <View style={styles.iosButtonContainer}>
                <TouchableOpacity
                  onPress={handleIosConfirmation}
                  style={styles.iosButton}
                >
                  <Text style={styles.buttonText}>Confirm Date</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        )}

        {error && <Text style={styles.errorText}>{error}</Text>}
      </View>
    );
  };

  const handleChange = (field: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
    // Clear error for the field when the user starts typing/changing
    if (value) {
      setErrors({ ...errors, [field]: "" });
    }
  };

  // Update the validateForm function to handle type safety
  const validateForm = () => {
    const newErrors: { [key: string]: string } = {};

    // Check for empty fields first
    Object.keys(formData).forEach((field) => {
      const value = formData[field as keyof FormData];
      if (typeof value === "string" && !value.trim()) {
        newErrors[field] = "This field is required";
      }
    });

    // Validate Date of Birth (DD/MM/YYYY)
    if (
      formData.dob &&
      !/^(0[1-9]|[12]\d|3[01])\/(0[1-9]|1[0-2])\/\d{4}$/.test(formData.dob)
    ) {
      newErrors.dob = "Date of Birth must be in DD/MM/YYYY format";
    }

    // Validate Pincode (must be 6 digits)
    if (formData.pincode && !/^\d{6}$/.test(formData.pincode)) {
      newErrors.pincode = "Pincode must be 6 digits";
    }

    // Validate ID Number based on Address Proof Type
    if (formData.idNumber) {
      if (
        formData.addressprooftype === "aadhar" &&
        !/^\d{12}$/.test(formData.idNumber)
      ) {
        newErrors.idNumber = "Aadhar number must be 12 digits";
      } else if (
        formData.addressprooftype === "pan" &&
        !/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/.test(formData.idNumber)
      ) {
        newErrors.idNumber =
          "PAN number must be in valid format (e.g., ABCDE1234F)";
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Update the getPlaceholderText function with proper typing
  const getPlaceholderText = (idType: string): string => {
    const placeholders: { [key: string]: string } = {
      aadhar: "Enter your 12-digit Aadhar number",
      pan: "Enter your PAN number (e.g., ABCDE1234F)",
      voterid: "Enter your Voter ID number",
    };
    return placeholders[idType] || "Enter your ID number";
  };

  // Update the formatIdNumber function with proper typing
  const formatIdNumber = (text: string, idType: string): string => {
    return idType === "pan" ? text.toUpperCase() : text;
  };

  // Update the getMaxLength function with proper typing
  const getMaxLength = (idType: string): number => {
    const maxLengths: { [key: string]: number } = {
      aadhar: 12,
      pan: 10,
      voterid: 10,
    };
    return maxLengths[idType] || 20;
  };

  const handleSubmit = async () => {
    if (validateForm()) {
      try {
        // Convert DOB format from DD/MM/YYYY to YYYY-MM-DD
        const parts = formData.dob.split("/");
        const convertedDob = `${parts[2]}-${parts[1]}-${parts[0]}`;

        // Prepare request body
        const requestBody = {
          user_id: user?.id || 2,
          doorno: formData.doorno,
          street: formData.street,
          area: formData.area,
          city: formData.city,
          district: formData.district,
          state: formData.state,
          country: formData.country,
          pincode: formData.pincode,
          dob: convertedDob,
          addressproof: formData.addressprooftype,
          enternumber: formData.idNumber,
          nominee_name: formData.nominee_name,
          nominee_relationship: formData.nominee_relationship,
        };

        let response;
        if (kycId) {
          // Update existing KYC
          response = await api.put(`/kyc/${kycId}`, requestBody);
        } else {
          // Create new KYC
          response = await api.post("/kyc", requestBody);
        }

        // Check API response for success
        if (response.data?.data?.affectedRows > 0 || response.data?.data?.id) {
          Alert.alert(
            kycId ? "KYC Updated" : "KYC Submitted",
            response.data?.message ||
              (kycId
                ? "Your KYC details have been updated successfully."
                : "Your KYC details have been submitted successfully.")
          );
          router.back(); // Navigate back on success
        } else {
          Alert.alert("Error", "KYC submission failed. Please try again.");
        }
      } catch (error: any) {
        console.error("KYC Submission Error:", error);
        const errorMessage =
          error.response?.data?.message ||
          "An error occurred. Please try again.";
        Alert.alert("Error", errorMessage);
      }
    } else {
      Alert.alert("Error", "Please fix the errors in the form.");
    }
  };

  const handleGoToSchemes = () => {
    router.replace("/(tabs)/savings");
  };

  const handleRetryPayment = async () => {
    // ... existing code ...
  };

  return (
    <View style={styles.container}>
      <ImageBackground
        source={theme.image.bg_image}
        style={styles.backgroundImage}
        resizeMode="cover"
      >
        <LinearGradient
          colors={["rgba(0,0,0,0.6)", "rgba(0,0,0,0.8)"]}
          style={StyleSheet.absoluteFillObject}
        />
        <SafeAreaView style={styles.safeArea}>
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity
              onPress={() => router.back()}
              style={styles.backButton}
              activeOpacity={0.7}
            >
              <Ionicons name="arrow-back" size={24} color="#FFC857" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Know Your Customer</Text>
          </View>

          <KeyboardAvoidingView
            behavior={Platform.OS === "ios" ? "padding" : "height"}
            style={styles.keyboardAvoid}
            keyboardVerticalOffset={Platform.OS === "ios" ? 88 : 0}
          >
            <ScrollView
              style={styles.scrollView}
              contentContainerStyle={[
                styles.scrollViewContent,
                { paddingBottom: keyboardVisible ? 200 : 100 },
              ]}
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
            >
              {/* Address Section */}
              <View style={[styles.groupCard, styles.groupAddress]}>
                <View style={styles.groupHeader}>
                  <Ionicons name="home-outline" size={24} color="#1976d2" />
                  <Text style={[styles.groupTitle, { color: "#1976d2" }]}>
                    Address Details
                  </Text>
                </View>
                <View style={styles.formContent}>
                  {/* Door Number */}
                  <View style={styles.formGroup}>
                    <Text style={styles.label}>Door No.</Text>
                    <TextInput
                      style={styles.input}
                      placeholder="Enter your door number"
                      value={formData.doorno}
                      placeholderTextColor="gray"
                      onChangeText={(text) => handleChange("doorno", text)}
                    />
                    {errors.doorno && (
                      <Text style={styles.errorText}>{errors.doorno}</Text>
                    )}
                  </View>
                  {/* Street */}
                  <View style={styles.formGroup}>
                    <Text style={styles.label}>Street</Text>
                    <TextInput
                      style={styles.input}
                      placeholder="Enter your street name"
                      placeholderTextColor="gray"
                      value={formData.street}
                      onChangeText={(text) => handleChange("street", text)}
                    />
                    {errors.street && (
                      <Text style={styles.errorText}>{errors.street}</Text>
                    )}
                  </View>
                  {/* Area */}
                  <View style={styles.formGroup}>
                    <Text style={styles.label}>Area</Text>
                    <TextInput
                      style={styles.input}
                      placeholder="Enter your area/locality"
                      placeholderTextColor="gray"
                      value={formData.area}
                      onChangeText={(text) => handleChange("area", text)}
                    />
                    {errors.area && (
                      <Text style={styles.errorText}>{errors.area}</Text>
                    )}
                  </View>
                  {/* City */}
                  <View style={styles.formGroup}>
                    <Text style={styles.label}>City</Text>
                    <TextInput
                      style={styles.input}
                      placeholder="Enter your city"
                      placeholderTextColor="gray"
                      value={formData.city}
                      onChangeText={(text) => handleChange("city", text)}
                    />
                    {errors.city && (
                      <Text style={styles.errorText}>{errors.city}</Text>
                    )}
                  </View>
                  {/* District */}
                  <View style={styles.formGroup}>
                    <Text style={styles.label}>District</Text>
                    <TextInput
                      style={styles.input}
                      placeholder="Enter your district"
                      placeholderTextColor="gray"
                      value={formData.district}
                      onChangeText={(text) => handleChange("district", text)}
                    />
                    {errors.district && (
                      <Text style={styles.errorText}>{errors.district}</Text>
                    )}
                  </View>
                  {/* State (Dropdown) */}
                  <View style={styles.formGroup}>
                    <Text style={styles.label}>State</Text>
                    <RNPickerSelect
                      onValueChange={(value) => handleChange("state", value)}
                      onDonePress={() => {}}
                      placeholder={{ label: "Select your state", value: "" }}
                      value={formData.state}
                      items={indianStates.map((state) => ({
                        label: state,
                        value: state,
                      }))}
                      style={pickerSelectStyles}
                      useNativeAndroidPickerStyle={false}
                    />
                    {errors.state && (
                      <Text style={styles.errorText}>{errors.state}</Text>
                    )}
                  </View>
                  {/* Country (Default to India) */}
                  <View style={styles.formGroup}>
                    <Text style={styles.label}>Country</Text>
                    <TextInput
                      style={[styles.input, styles.disabledInput]}
                      placeholder="Country"
                      value={formData.country}
                      editable={false}
                    />
                    {errors.country && (
                      <Text style={styles.errorText}>{errors.country}</Text>
                    )}
                  </View>
                  {/* Pincode */}
                  <View style={styles.formGroup}>
                    <Text style={styles.label}>Pincode</Text>
                    <TextInput
                      style={styles.input}
                      placeholder="Enter your 6-digit pincode"
                      placeholderTextColor="gray"
                      keyboardType="number-pad"
                      value={formData.pincode}
                      onChangeText={(text) => handleChange("pincode", text)}
                      maxLength={6}
                    />
                    {errors.pincode && (
                      <Text style={styles.errorText}>{errors.pincode}</Text>
                    )}
                  </View>
                </View>
              </View>

              {/* ID Proof Section */}
              <View style={[styles.groupCard, styles.groupIdProof]}>
                <View style={styles.groupHeader}>
                  <Ionicons name="card-outline" size={24} color="#bfa14a" />
                  <Text style={[styles.groupTitle, { color: "#bfa14a" }]}>
                    ID Proof
                  </Text>
                </View>
                <View style={styles.formContent}>
                  <View style={styles.formGroup}>
                    <Text style={styles.label}>Date of Birth</Text>
                    <FormDatePicker
                      label="Date of Birth"
                      value={formData.dob}
                      onDateChange={(date) => handleChange("dob", date)}
                      error={errors.dob}
                    />
                  </View>
                  <View style={styles.formGroup}>
                    <Text style={styles.label}>Address Proof Type</Text>
                    <RNPickerSelect
                      onValueChange={(value) =>
                        handleChange("addressprooftype", value)
                      }
                      onDonePress={() => {}}
                      placeholder={{ label: "Select your ID proof", value: "" }}
                      value={formData.addressprooftype}
                      items={idTypes.map((id) => ({
                        label: id.name,
                        value: id.value,
                      }))}
                      style={pickerSelectStyles}
                      useNativeAndroidPickerStyle={false}
                    />
                    {errors.addressprooftype && (
                      <Text style={styles.errorText}>
                        {errors.addressprooftype}
                      </Text>
                    )}
                  </View>
                  <View style={styles.formGroup}>
                    <Text style={styles.label}>ID Number</Text>
                    <TextInput
                      style={styles.input}
                      placeholderTextColor="gray"
                      placeholder={getPlaceholderText(
                        formData.addressprooftype
                      )}
                      value={formData.idNumber}
                      onChangeText={(text) =>
                        handleChange(
                          "idNumber",
                          formatIdNumber(text, formData.addressprooftype)
                        )
                      }
                      autoCapitalize={
                        formData.addressprooftype === "pan"
                          ? "characters"
                          : "none"
                      }
                      keyboardType={
                        formData.addressprooftype === "pan"
                          ? "default"
                          : "number-pad"
                      }
                      maxLength={getMaxLength(formData.addressprooftype)}
                    />
                    {errors.idNumber && (
                      <Text style={styles.errorText}>{errors.idNumber}</Text>
                    )}
                  </View>
                </View>
              </View>

              {/* Nominee Section */}
              <View style={[styles.groupCard, styles.groupNominee]}>
                <View style={styles.groupHeader}>
                  <Ionicons name="people-outline" size={24} color="#388e3c" />
                  <Text style={[styles.groupTitle, { color: "#388e3c" }]}>
                    Nominee Details
                  </Text>
                </View>
                <View style={styles.formContent}>
                  <View style={styles.formGroup}>
                    <Text style={styles.label}>Nominee Name</Text>
                    <TextInput
                      style={styles.input}
                      placeholder="Enter your nominee's full name"
                      placeholderTextColor="gray"
                      value={formData.nominee_name}
                      onChangeText={(text) =>
                        handleChange("nominee_name", text)
                      }
                    />
                    {errors.nominee_name && (
                      <Text style={styles.errorText}>
                        {errors.nominee_name}
                      </Text>
                    )}
                  </View>
                  <View style={styles.formGroup}>
                    <Text style={styles.label}>Nominee Relationship</Text>
                    <RNPickerSelect
                      onValueChange={(value) =>
                        handleChange("nominee_relationship", value)
                      }
                      onDonePress={() => {}}
                      placeholder={{ label: "Select relationship", value: "" }}
                      value={formData.nominee_relationship}
                      items={nomineeRelationship.map((id) => ({
                        label: id.name,
                        value: id.value,
                      }))}
                      style={pickerSelectStyles}
                      useNativeAndroidPickerStyle={false}
                    />
                    {errors.nominee_relationship && (
                      <Text style={styles.errorText}>
                        {errors.nominee_relationship}
                      </Text>
                    )}
                  </View>
                </View>
              </View>

              {/* Submit Button */}
              <View style={styles.buttonContainer}>
                <TouchableOpacity
                  onPress={handleSubmit}
                  style={styles.submitButton}
                  activeOpacity={0.9}
                >
                  <LinearGradient
                    colors={["#1a2a39", "#5a000b", "#2e0406"]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.gradientButton}
                  >
                    <Text style={styles.submitButtonText}>
                      {kycId ? "Update KYC" : "Submit KYC"}
                    </Text>
                    <Ionicons
                      name="arrow-forward"
                      size={20}
                      color="#FFC857"
                      style={styles.buttonIcon}
                    />
                  </LinearGradient>
                </TouchableOpacity>
              </View>

              {/* Extra space at the bottom */}
              <View style={styles.bottomSpace} />
            </ScrollView>
          </KeyboardAvoidingView>
        </SafeAreaView>
      </ImageBackground>
    </View>
  );
}

const pickerSelectStyles = StyleSheet.create({
  inputIOS: {
    backgroundColor: "#fff",
    borderColor: "#E0E0E0",
    borderWidth: 1,
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 12,
    fontSize: 16,
    color: "#333",
    paddingRight: 30,
    marginBottom: 10,
  },
  inputAndroid: {
    fontSize: 16,
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: "#E0E0E0",
    borderRadius: 12,
    color: "#333",
    paddingRight: 30,
    backgroundColor: "#fff",
  },
});

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  backgroundImage: {
    flex: 1,
  },
  keyboardAvoid: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: "rgba(133, 1, 17, 0.9)",
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255, 200, 87, 0.3)",
  },
  backButton: {
    padding: 8,
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    borderRadius: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "600",
    color: "#FFC857",
    marginLeft: 12,
    textShadowColor: "rgba(0, 0, 0, 0.3)",
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  scrollView: {
    flex: 1,
  },
  scrollViewContent: {
    padding: 16,
  },
  groupCard: {
    borderRadius: 20,
    padding: 20,
    marginBottom: 24,
    backgroundColor: "rgba(255, 255, 255, 0.95)",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 4,
  },
  groupHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(0,0,0,0.1)",
  },
  groupTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginLeft: 12,
  },
  formContent: {
    paddingHorizontal: 4,
  },
  formGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 15,
    fontWeight: "600",
    color: "#444",
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: "#E0E0E0",
    borderRadius: 12,
    padding: 14,
    fontSize: 16,
    backgroundColor: "#FFFFFF",
    color: "#333",
  },
  disabledInput: {
    backgroundColor: "#F5F5F5",
    color: "#666",
  },
  errorText: {
    color: "#FF3B30",
    fontSize: 13,
    marginTop: 6,
    fontWeight: "500",
  },
  buttonContainer: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: "rgba(255, 255, 255, 0.95)",
    borderRadius: 24,
    marginTop: 16,
    marginBottom: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 10,
  },
  submitButton: {
    borderRadius: 16,
    overflow: "hidden",
    shadowColor: "#1a2a39",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  gradientButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 16,
    paddingHorizontal: 24,
  },
  submitButtonText: {
    color: "#FFC857",
    fontSize: 18,
    fontWeight: "bold",
    letterSpacing: 1,
  },
  buttonIcon: {
    marginLeft: 8,
  },
  bottomSpace: {
    height: 100,
  },
  groupAddress: {
    borderLeftWidth: 4,
    borderLeftColor: "#1976d2",
  },
  groupIdProof: {
    borderLeftWidth: 4,
    borderLeftColor: "#bfa14a",
  },
  groupNominee: {
    borderLeftWidth: 4,
    borderLeftColor: "#388e3c",
  },
  dateInputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#E0E0E0",
    borderRadius: 12,
    paddingHorizontal: 14,
    height: 56,
    backgroundColor: "#FFFFFF",
  },
  dateInput: {
    flex: 1,
    fontSize: 16,
    color: "#333",
    paddingVertical: 16,
  },
  calendarIcon: {
    marginLeft: 10,
    color: "#1976d2",
  },
  iosButtonContainer: {
    flexDirection: "row",
    justifyContent: "flex-end",
    marginTop: 16,
    paddingHorizontal: 20,
  },
  iosButton: {
    backgroundColor: "#1976d2",
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 12,
  },
  buttonText: {
    color: "white",
    fontWeight: "600",
    fontSize: 16,
  },
});
