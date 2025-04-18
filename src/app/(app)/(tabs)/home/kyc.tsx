import React, { useState } from "react";
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
export default function KycForm() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { language, user } = useGlobalStore();
  const [formData, setFormData] = useState({
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

  const FormDatePicker = ({ label, value, onDateChange, error }) => {
    const [showPicker, setShowPicker] = useState(false);
    const [selectedDate, setSelectedDate] = useState(
      value ? new Date(value.split("/").reverse().join("-")) : new Date()
    );

    const handleDateChange = (event, date) => {
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

    const formatDate = (date) => {
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

  const validateForm = () => {
    const newErrors: { [key: string]: string } = {};

    // Check for empty fields first
    Object.keys(formData).forEach((field) => {
      if (typeof formData[field] === "string" && !formData[field].trim()) {
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
  const getPlaceholderText = (idType) => {
    const placeholders = {
      aadhar: "Enter your 12-digit Aadhar number",
      pan: "Enter your PAN number (e.g., ABCDE1234F)",
      voterid: "Enter your Voter ID number",
    };
    return placeholders[idType] || "Enter your ID number";
  };

  const formatIdNumber = (text, idType) => {
    return idType === "pan" ? text.toUpperCase() : text;
  };

  const getMaxLength = (idType) => {
    const maxLengths = {
      aadhar: 12,
      pan: 10,
      voterid: 10,
    };
    return maxLengths[idType] || 20; // Default max length if no type is matched
  };

  const handleSubmit = async () => {
    if (validateForm()) {
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

      try {
        // Send API request
        let response = await api.post("/kyc", requestBody);
        // Check API response for success
        if (response.data?.data?.affectedRows > 0) {
          Alert.alert(
            "KYC Submitted",
            response.data?.message ||
              "Your KYC details have been submitted successfully."
          );
          router.back(); // Navigate back on success
        } else {
          Alert.alert("Error", "KYC submission failed. Please try again.");
        }
      } catch (error) {
        console.error("KYC Submission Error:", error);

        // Handle API error response
        let errorMessage =
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
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => router.back()}
            style={styles.backButton}
            activeOpacity={0.7}
          >
            <Ionicons
              name="arrow-back"
              size={24}
              color={theme.colors.primary}
            />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Know Your Customer</Text>
        </View>

        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : undefined}
          style={styles.keyboardAvoid}
          keyboardVerticalOffset={Platform.OS === "ios" ? 88 : 0}
        >
          <ScrollView
            style={styles.scrollView}
            contentContainerStyle={styles.scrollViewContent}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
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
                {/* <Picker
                  selectedValue={formData.state}
                  onValueChange={(itemValue) =>
                    handleChange("state", itemValue)
                  }
                  style={styles.picker}
                  itemStyle={styles.pickerItem}
                >
                  <Picker.Item label="Select your state" value="" />
                  {indianStates.map((state, index) => (
                    <Picker.Item key={index} label={state} value={state} />
                  ))}
                </Picker> */}
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

            {/* Date of Birth */}
            <View style={styles.formGroup}>
              <FormDatePicker
                label="Date of Birth"
                value={formData.dob}
                onDateChange={(date) => handleChange("dob", date)}
                error={errors.dob}
              />
            </View>

            {/* Address Proof Type (Dropdown) */}
            <View style={styles.formGroup}>
              <Text style={styles.label}>Address Proof Type</Text>
              <View style={styles.pickerContainer}>
                <RNPickerSelect
                  onValueChange={(value) =>
                    handleChange("addressprooftype", value)
                  }
                  onDonePress={() => {}}
                  placeholder={{ label: "Select your ID proof", value: "" }}
                  value={formData.addressprooftype} // Corrected: use addressprooftype here
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

            {/* ID Number (to be sent as enternumber) */}
            {/* <View style={styles.formGroup}>
              <Text style={styles.label}>ID Number</Text>
              <TextInput
                style={styles.input}
                placeholderTextColor="gray"
                placeholder={
                  formData.addressprooftype === "aadhar"
                    ? "Enter your 12-digit Aadhar number"
                    : formData.addressprooftype === "pan"
                    ? "Enter your PAN number (e.g., ABCDE1234F)"
                    : formData.addressprooftype === "voterid"
                    ? "Enter your Voter ID number"
                    : "Enter your ID number"
                }
                value={formData.idNumber}
                onChangeText={(text) =>
                  handleChange(
                    "idNumber",
                    formData.addressprooftype === "pan"
                      ? text.toUpperCase()
                      : text
                  )
                }
                autoCapitalize={
                  formData.addressprooftype === "pan" ? "characters" : "none"
                }
                keyboardType={
                  formData.addressprooftype === "pan" ? "default" : "number-pad"
                }
              />
              {errors.idNumber && (
                <Text style={styles.errorText}>{errors.idNumber}</Text>
              )}
            </View> */}
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
            <View style={styles.formGroup}>
              <Text style={styles.label}>Nominee Relationship</Text>
              <View style={styles.pickerContainer}>
                <RNPickerSelect
                  onValueChange={(value) =>
                    handleChange("nominee_relationship", value)
                  }
                  onDonePress={() => {}}
                  placeholder={{ label: "Select Branch", value: "" }}
                  value={formData.nominee_relationship} // Corrected: use addressprooftype here
                  items={nomineeRelationship.map((id) => ({
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
            {/* Nominee Name */}
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
            {/* Nominee Relationship */}
            {/* <View style={styles.formGroup}>
              <Text style={styles.label}>Nominee Relationship</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter your relationship with the nominee"
                placeholderTextColor="gray"
                value={formData.nominee_relationship}
                onChangeText={(text) =>
                  handleChange("nominee_relationship", text)
                }
              />
              {errors.nominee_relationship && (
                <Text style={styles.errorText}>
                  {errors.nominee_relationship}
                </Text>
              )}
            </View> */}

            {/* Extra space at the bottom */}
            <View style={styles.bottomSpace} />
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>

      {/* Submit Button - Fixed at bottom */}
      <View
        style={[
          styles.buttonContainer,
          {
            paddingBottom: insets.bottom > 0 ? insets.bottom : 16,
          },
        ]}
      >
        <TouchableOpacity
          onPress={handleSubmit}
          style={styles.submitButton}
          activeOpacity={0.8}
        >
          <Text style={styles.submitButtonText}>Submit KYC</Text>
        </TouchableOpacity>
      </View>
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
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "600",
    color: theme.colors.primary,
    marginLeft: 12,
  },
  scrollView: {
    flex: 1,
  },
  scrollViewContent: {
    padding: 16,
    paddingBottom: 100, // Add extra padding for the fixed button
  },
  formGroup: {
    marginBottom: 16,
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
    padding: 16,
    backgroundColor: "#FFFFFF",
    borderTopWidth: 1,
    borderTopColor: "#EEEEEE",
    position: "absolute",
    bottom: 45,
    left: 0,
    right: 0,
  },
  submitButton: {
    backgroundColor: theme.colors.primary,
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: "center",
  },
  submitButtonText: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "600",
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
});
