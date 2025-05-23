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
import api from "../../../services/api";
import { theme } from "@/constants/theme";

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
          setKycId(res.data.data.id?.toString() || null);
          setFormData({
            doorno: res.data.data.doorno || "",
            street: res.data.data.street || "",
            area: res.data.data.area || "",
            city: res.data.data.city || "",
            district: res.data.data.district || "",
            state: res.data.data.state || "",
            country: res.data.data.country || "India",
            pincode: res.data.data.pincode || "",
            dob: res.data.data.dob ? new Date(res.data.data.dob).toLocaleDateString("en-GB") : "",
            addressprooftype: res.data.data.addressproof || "",
            idNumber: res.data.data.enternumber || "",
            nominee_name: res.data.data.nominee_name || "",
            nominee_relationship: res.data.data.nominee_relationship || "",
          });
        }
      } catch (e) {
        console.error("Error fetching KYC:", e);
      }
    };
    fetchKyc();
  }, [user?.id]);

  // Update the FormDatePicker component with proper types
  const FormDatePicker: React.FC<FormDatePickerProps> = ({ label, value, onDateChange, error }) => {
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

      // Clear ID Number when Address Proof Type changes
      ...(field === "addressprooftype" && { idNumber: "" }),

      // Clear Nominee Name when Nominee Relationship changes
      ...(field === "nominee_relationship" && { nominee_name: "" }),
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

  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        {/* Header - always visible */}
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
              { paddingBottom: (navBarHeight + 72 + (insets.bottom || 0)) }
            ]}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            {/* Address Section */}
            <View style={[styles.groupCard, styles.groupAddress]}>
              <Text style={[styles.groupTitle, { color: '#1976d2' }]}>Address Details</Text>
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
                <View style={styles.pickerContainer}>
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
                </View>
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

            {/* ID Proof Section */}
            <View style={[styles.groupCard, styles.groupIdProof]}>
              <Text style={[styles.groupTitle, { color: '#bfa14a' }]}>ID Proof</Text>
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
                <View style={styles.pickerContainer}>
                  <RNPickerSelect
                    onValueChange={(value) => handleChange("addressprooftype", value)}
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
                </View>
                {errors.addressprooftype && (
                  <Text style={styles.errorText}>{errors.addressprooftype}</Text>
                )}
              </View>
              <View style={styles.formGroup}>
                <Text style={styles.label}>ID Number</Text>
                <TextInput
                  style={styles.input}
                  placeholderTextColor="gray"
                  placeholder={getPlaceholderText(formData.addressprooftype)}
                  value={formData.idNumber}
                  onChangeText={(text) =>
                    handleChange(
                      "idNumber",
                      formatIdNumber(text, formData.addressprooftype)
                    )
                  }
                  autoCapitalize={
                    formData.addressprooftype === "pan" ? "characters" : "none"
                  }
                  keyboardType={
                    formData.addressprooftype === "pan" ? "default" : "number-pad"
                  }
                  maxLength={getMaxLength(formData.addressprooftype)}
                />
                {errors.idNumber && (
                  <Text style={styles.errorText}>{errors.idNumber}</Text>
                )}
              </View>
            </View>

            {/* Nominee Section */}
            <View style={[styles.groupCard, styles.groupNominee]}>
              <Text style={[styles.groupTitle, { color: '#388e3c' }]}>Nominee Details</Text>
              <View style={styles.formGroup}>
                <Text style={styles.label}>Nominee Name</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Enter your nominee's full name"
                  placeholderTextColor="gray"
                  value={formData.nominee_name}
                  onChangeText={(text) => handleChange("nominee_name", text)}
                />
                {errors.nominee_name && (
                  <Text style={styles.errorText}>{errors.nominee_name}</Text>
                )}
              </View>
              <View style={styles.formGroup}>
                <Text style={styles.label}>Nominee Relationship</Text>
                <View style={styles.pickerContainer}>
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
                </View>
                {errors.nominee_relationship && (
                  <Text style={styles.errorText}>{errors.nominee_relationship}</Text>
                )}
              </View>
            </View>

            {/* Extra space at the bottom */}
            <View style={styles.bottomSpace} />
          </ScrollView>
          {/* Submit Button - now at the end, not absolutely positioned */}
          <View style={styles.buttonContainer}>
            <TouchableOpacity
              onPress={handleSubmit}
              style={styles.submitButton}
              activeOpacity={0.9}
            >
              <Text style={styles.submitButtonText}>
                {kycId ? "Update KYC" : "Submit KYC"}
              </Text>
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
}
const pickerSelectStyles = StyleSheet.create({
  inputIOS: {
    backgroundColor: "#fff",
    borderColor: "#CCCCCC",
    borderWidth: 1,
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 10,
    fontSize: 16,
    color: "black",
    paddingRight: 30,
    marginBottom: 10,
  },
  inputAndroid: {
    fontSize: 16,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: "#CCCCCC",
    borderRadius: 8,
    color: "black",
    paddingRight: 30,
  },
});
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  keyboardAvoid: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#EEEEEE",
    backgroundColor: theme.colors.primary,
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "600",
    color: "#FFC857",
    marginLeft: 12,
  },
  scrollView: {
    flex: 1,
  },
  scrollViewContent: {
    padding: 16,
  },
  formGroup: {
    marginBottom: 20,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    marginHorizontal: 16,
  },
  label: {
    fontSize: 16,
    fontWeight: "500",
    color: "#444444",
    marginBottom: 6,
  },
  input: {
    borderWidth: 1,
    borderColor: "#CCCCCC",
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: "#FFFFFF",
  },
  disabledInput: {
    backgroundColor: "#F5F5F5",
  },
  pickerContainer: {
    borderWidth: 1,
    borderColor: "#CCCCCC",
    borderRadius: 8,
    overflow: "hidden",
    backgroundColor: "#FFFFFF",
  },
  picker: {
    height: 50,
    width: "100%",
  },
  pickerItem: {
    fontSize: 16,
  },
  errorText: {
    color: "#FF3B30",
    fontSize: 14,
    marginTop: 4,
  },
  buttonContainer: {
    paddingHorizontal: 26,
    paddingBottom: 100,
    backgroundColor: '#fff',
    borderTopLeftRadius: 18,
    borderTopRightRadius: 18,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 10,
    zIndex: 1000,
    alignItems: 'center',
  },
  submitButton: {
    backgroundColor: theme.colors.primary,
    borderRadius: 20,
    paddingVertical: 22,
    alignItems: "center",
    width: '100%',
    shadowColor: theme.colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.18,
    shadowRadius: 8,
    elevation: 4,
  },
  submitButtonText: {
    color: "#FFC857",
    fontSize: 18,
    fontWeight: "bold",
    letterSpacing: 1,
  },
  bottomSpace: {
    height: 100,
  },
  datePickerButton: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 12,
  },
  dateText: {
    fontSize: 16,
    color: "#000000",
  },
  placeholderText: {
    fontSize: 16,
    color: "#000000",
  },
  datePicker: {
    width: "100%",
    backgroundColor: "white",
  },
  dateContent: {
    flex: 1,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  dateContainer: {
    marginVertical: 12,
    paddingHorizontal: 20,
  },
  dateInputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#cccccc",
    borderRadius: 8,
    paddingHorizontal: 12,
    height: 56,
  },
  dateInput: {
    flex: 1,
    fontSize: 16,
    color: "#333333",
    paddingVertical: 16,
  },
  calendarIcon: {
    marginLeft: 10,
  },
  iosButtonContainer: {
    flexDirection: "row",
    justifyContent: "flex-end",
    marginTop: 16,
    paddingHorizontal: 20,
  },
  iosButton: {
    backgroundColor: "#007AFF",
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
  },
  buttonText: {
    color: "white",
    fontWeight: "500",
    fontSize: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: theme.colors.primary,
    marginBottom: 16,
    marginTop: 24,
    paddingHorizontal: 16,
  },
  groupCard: {
    borderRadius: 18,
    padding: 18,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 2,
  },
  groupTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 12,
    marginLeft: 2,
  },
  groupAddress: {
    backgroundColor: '#e3f2fd', // Light blue
    borderColor: '#90caf9',
    borderWidth: 1,
  },
  groupIdProof: {
    backgroundColor: '#fffde7', // Light yellow
    borderColor: '#ffe082',
    borderWidth: 1,
  },
  groupNominee: {
    backgroundColor: '#e8f5e9', // Light green
    borderColor: '#a5d6a7',
    borderWidth: 1,
  },
});
