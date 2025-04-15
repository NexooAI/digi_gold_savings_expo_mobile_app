import React, { useState, useMemo, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Dimensions,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { t } from "@/i18n";
import useGlobalStore from "@/store/global.store";
import { Picker } from "@react-native-picker/picker";
import { useFocusEffect } from "@react-navigation/native";
import api from "../../../services/api";
import { theme } from "@/constants/theme";

const { width } = Dimensions.get("window");

export default function JoinSavings() {
  const { schemeId, schemeData } = useLocalSearchParams();
  // Parse schemeData from query params
  const parsedData = useMemo(() => {
    if (typeof schemeData === "string") {
      try {
        const parsed = JSON.parse(schemeData);
        if (parsed.data) {
          return (
            parsed.data.find(
              (scheme) => scheme.SCHEMEID === Number(schemeId)
            ) || null
          );
        }
        return parsed;
      } catch (error) {
        console.error("Error parsing schemeData:", error);
        return null;
      }
    }
    return null;
  }, [schemeData, schemeId]);

  console.log("parsedSchemeData----------------->> : ", parsedData);
  let i = 0;
  useEffect(() => {
    const fetchBranche = async () => {
      try {
        const branches = await api.get(`/branches`);
        formData.associated_branch = branches.data.data[0].branch_name;
      } catch (error) {
        console.error("Error fetching branches:", error);
      }
    };
    fetchBranche();
  }, []);
  const chits = parsedData?.chit || [];
  const router = useRouter();
  const { language, user } = useGlobalStore();

  // KYC state: status and details
  const [kycStatus, setKycStatus] = useState(null);
  const [kycDetails, setKycDetails] = useState(null);
  const [isKycLoading, setIsKycLoading] = useState(true);

  useFocusEffect(
    React.useCallback(() => {
      const fetchKycStatus = async () => {
        try {
          setIsKycLoading(true);

          const response = await api.get(`/kyc/status/${user?.id}`);

          if (response.data) {
            console.log("KYC data:", response.data);

            // Set KYC status
            setKycStatus(response.data.kyc_status || "Not Completed");

            // Check if data is available
            if (response.data.data) {
              setKycDetails(response.data.data);
            } else {
              // Handle case when data is null (Not Completed)
              setKycDetails(null);
              Alert.alert(
                "KYC Status",
                "Your KYC is not completed. Please submit the details."
              );
            }
          } else {
            console.warn("No KYC data found");
            setKycStatus("Not Completed");
            setKycDetails(null);
          }
        } catch (error) {
          console.error("Error fetching KYC status:", error);
          Alert.alert("Error", "Failed to fetch KYC status. Please try again.");
        } finally {
          setIsKycLoading(false);
        }
      };

      fetchKycStatus();
    }, [])
  );

  // Get initial amount from parsedData if available.
  const initialAmount = "";

  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    amount: initialAmount,
    accountname: "",
    associated_branch: "",
    name: "",
    mobile: "",
    email: "",
    address: "",
    pincode: "",
    nominee: "",
    pan: "",
  });
  const [errors, setErrors] = useState({
    amount: "",
    accountname: "",
    associated_branch: "",
    name: "",
    email: "",
    mobile: "",
    pincode: "",
    pan: "",
    nominee: "",
  });

  const translations = useMemo(
    () => ({
      title: t("digiGoldTitle"),
      digiGoldTitle: t("digiGoldTitle"),
      amountPlaceholder: t("monthlyAmount"),
      projectedReturns: t("projectedReturnsYear"),
      projectedReturnsYear: t("projectedReturnsYear"),
      returnRateDetail: t("returnRateDetail"),
      fullName: t("fullName"),
      fullNamePlaceholder: t("fullNamePlaceholder"),
      mobileNumber: t("mobileNumber"),
      mobilePlaceholder: t("mobilePlaceholder"),
      emailAddress: t("emailAddress"),
      emailPlaceholder: t("emailPlaceholder"),
      address: t("address"),
      addressPlaceholder: t("addressPlaceholder"),
      pincode: t("pincode"),
      pincodePlaceholder: t("pincodePlaceholder"),
      nomineeName: t("nomineeName"),
      nomineePlaceholder: t("nomineePlaceholder"),
      panNumber: t("panNumber"),
      panPlaceholder: t("panPlaceholder"),
      next: t("next"),
      previous: t("previous"),
      submit: t("submit"),
      minAmountError: t("minAmountError"),
      invalidEmail: t("invalidEmail"),
      invalidMobile: t("invalidMobile"),
      invalidPincode: t("invalidPincode"),
      invalidPan: t("invalidPan"),
      monthlyAmount: t("monthlyAmount"),
      mobileSummary: t("mobile"),
      emailSummary: t("email"),
      panSummary: t("pan"),
      nomineeSummary: t("nominee"),
      successTitle: t("successTitle"),
      successMessage: t("successMessage"),
      confirmAndJoin: t("confirmAndJoin"),
    }),
    [language]
  );

  const calculateReturns = (amount) => {
    const monthlyAmount = parseFloat(amount) || 0;
    const annualRate = 0.12;
    const years = 1;
    const monthlyRate = annualRate / 12;
    const months = years * 12;
    const futureValue =
      (monthlyAmount * (Math.pow(1 + monthlyRate, months) - 1)) / monthlyRate;
    return Math.round(futureValue);
  };

  const validate = (field, value) => {
    const newErrors = { ...errors };

    switch (field) {
      case "amount":
        newErrors.amount = !value
          ? "Amount is required"
          : value < 1000
          ? translations.minAmountError
          : "";
        break;
      case "name":
        newErrors.name = !value.trim() ? "Full Name is required" : "";
        break;
      case "email":
        newErrors.email = !value
          ? "Email is required"
          : !/\S+@\S+\.\S+/.test(value)
          ? translations.invalidEmail
          : "";
        break;
      case "mobile":
        newErrors.mobile = !value
          ? "Mobile number is required"
          : !/^[6-9]\d{9}$/.test(value)
          ? translations.invalidMobile
          : "";
        break;
      case "pan":
        newErrors.pan = !value
          ? "PAN is required"
          : !/^[A-Z]{5}[0-9]{4}[A-Z]$/.test(value)
          ? translations.invalidPan
          : "";
        break;
      case "nominee":
        newErrors.nominee = !value.trim() ? "Nominee Name is required" : "";
        break;
      case "accountname":
        newErrors.accountname = !value.trim() ? "Account Name is required" : "";
        break;
      case "associated_branch":
        newErrors.associated_branch = !value.trim()
          ? "Associated Branch is required"
          : "";
        break;
      default:
        break;
    }

    setErrors(newErrors);
    return !newErrors[field];
  };

  const handleChange = (field, value) => {
    setFormData({ ...formData, [field]: value });
    validate(field, value);
  };

  const renderProgressBar = () => (
    <View style={styles.progressContainer}>
      {[1, 2, 3].map((num) => (
        <View
          key={num}
          style={[
            styles.progressItem,
            { backgroundColor: step >= num ? theme.colors.primary : "#e5e5e5" },
          ]}
        />
      ))}
    </View>
  );

  const renderStep1 = () => (
    <View style={styles.stepContainer}>
      <Text style={styles.label}>{translations.amountPlaceholder}</Text>

      {/* Custom Amount Picker Component */}
      <AmountPicker
        chits={chits}
        formData={formData}
        handleChange={handleChange}
      />

      {errors.amount && <Text style={styles.errorText}>{errors.amount}</Text>}
      {chits.length === 0 && (
        <Text style={styles.errorText}>
          No chit amounts available. Please check the data.
        </Text>
      )}

      {/* {parseFloat(formData.amount) >= 1000 && (
        <View style={styles.returnsCard}>
          <Text style={styles.returnsTitle}>
            {translations.projectedReturnsYear}
          </Text>
          <Text style={styles.returnsAmount}>
            ₹{calculateReturns(formData.amount).toLocaleString()}
          </Text>
          <Text style={styles.returnsRate}>
            {translations.returnRateDetail}
          </Text>
        </View>
      )} */}
    </View>
  );
  const AmountPicker = ({ chits, formData, handleChange }) => {
    return (
      <View style={styles.amountPickerContainer}>
        {chits && chits.length > 0 ? (
          chits.map((chit) => {
            const isSelected = formData.amount === String(chit.AMOUNT);
            return (
              <TouchableOpacity
                key={chit.CHITID}
                onPress={() => handleChange("amount", String(chit.AMOUNT))}
                style={[
                  styles.amountCard,
                  isSelected && styles.selectedAmountCard,
                ]}
              >
                {isSelected && (
                  <View style={styles.checkboxContainer}>
                    <Ionicons name="checkmark-circle" size={22} color="#fff" />
                  </View>
                )}
                <Text style={styles.amountText}>₹{chit.AMOUNT}</Text>
              </TouchableOpacity>
            );
          })
        ) : (
          <Text style={styles.noAmountText}>No amounts available</Text>
        )}
      </View>
    );
  };

  const renderStep2 = () => (
    <View style={styles.stepContainer}>
      <Text style={styles.label}>Account Name</Text>
      <TextInput
        style={[styles.input, errors.accountname ? styles.inputError : null]}
        placeholder="Enter your account name"
        placeholderTextColor={"#999"}
        value={formData.accountname}
        onChangeText={(value) => handleChange("accountname", value)}
      />
      {errors.accountname && (
        <Text style={styles.errorText}>{errors.accountname}</Text>
      )}
      <Text style={styles.label}>Branch</Text>
      <TextInput
        style={[
          styles.input,
          errors.associated_branch ? styles.inputError : null,
        ]}
        placeholder="Enter your account name"
        placeholderTextColor={"#999"}
        value={formData.associated_branch}
        onChangeText={(value) => handleChange("associated_branch", value)}
        editable={!formData.associated_branch}
      />
      {errors.associated_branch && (
        <Text style={styles.errorText}>{errors.associated_branch}</Text>
      )}
    </View>
  );

  // const renderStep2 = () => (
  //   <View style={styles.stepContainer}>
  //     {/* Step 2 fields remain unchanged */}
  //     <View style={styles.row}>
  //       <View style={styles.column}>
  //         <Text style={styles.label}>{translations.fullName}</Text>
  //         <TextInput
  //           style={styles.input}
  //           placeholder={translations.fullNamePlaceholder}
  //           value={formData.name}
  //           onChangeText={(value) => handleChange('name', value)}
  //         />
  //       </View>
  //     </View>

  //     <View style={styles.row}>
  //       <View style={styles.column}>
  //         <Text style={styles.label}>{translations.mobileNumber}</Text>
  //         <TextInput
  //           style={[styles.input, errors.mobile ? styles.inputError : null]}
  //           placeholder={translations.mobilePlaceholder}
  //           keyboardType="numeric"
  //           value={formData.mobile}
  //           onChangeText={(value) => handleChange('mobile', value)}
  //         />
  //         {errors.mobile && <Text style={styles.errorText}>{errors.mobile}</Text>}
  //       </View>
  //     </View>

  //     <View style={styles.row}>
  //       <View style={styles.column}>
  //         <Text style={styles.label}>{translations.emailAddress}</Text>
  //         <TextInput
  //           style={[styles.input, errors.email ? styles.inputError : null]}
  //           placeholder={translations.emailPlaceholder}
  //           keyboardType="email-address"
  //           value={formData.email}
  //           onChangeText={(value) => handleChange('email', value)}
  //         />
  //         {errors.email && <Text style={styles.errorText}>{errors.email}</Text>}
  //       </View>
  //     </View>

  //     <View style={styles.row}>
  //       <View style={styles.column}>
  //         <Text style={styles.label}>{translations.address}</Text>
  //         <TextInput
  //           style={styles.input}
  //           placeholder={translations.addressPlaceholder}
  //           value={formData.address}
  //           onChangeText={(value) => handleChange('address', value)}
  //         />
  //       </View>
  //     </View>

  //     <View style={styles.row}>
  //       <View style={styles.column}>
  //         <Text style={styles.label}>{translations.pincode}</Text>
  //         <TextInput
  //           style={[styles.input, errors.pincode ? styles.inputError : null]}
  //           placeholder={translations.pincodePlaceholder}
  //           keyboardType="numeric"
  //           value={formData.pincode}
  //           onChangeText={(value) => handleChange('pincode', value)}
  //         />
  //         {errors.pincode && <Text style={styles.errorText}>{errors.pincode}</Text>}
  //       </View>
  //     </View>

  //     <View style={styles.row}>
  //       <View style={styles.column}>
  //         <Text style={styles.label}>{translations.panNumber}</Text>
  //         <TextInput
  //           style={[styles.input, errors.pan ? styles.inputError : null]}
  //           placeholder={translations.panPlaceholder}
  //           value={formData.pan}
  //           autoCapitalize="characters"
  //           onChangeText={(value) => handleChange('pan', value.toUpperCase())}
  //         />
  //         {errors.pan && <Text style={styles.errorText}>{errors.pan}</Text>}
  //       </View>
  //     </View>

  //     <View style={styles.row}>
  //       <View style={styles.column}>
  //         <Text style={styles.label}>{translations.nomineeName}</Text>
  //         <TextInput
  //           style={styles.input}
  //           placeholder={translations.nomineePlaceholder}
  //           value={formData.nominee}
  //           onChangeText={(value) => handleChange('nominee', value)}
  //         />
  //       </View>
  //     </View>
  //   </View>
  // );

  // Render Step 3: Display both Savings Summary and KYC Details (if KYC is completed)
  const renderStep3 = () => (
    <View style={styles.stepContainer}>
      <Text style={styles.sectionTitle}>Savings Summary</Text>
      <View style={styles.summaryCard}>
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Monthly Amount</Text>
          <Text style={styles.summaryValue}>₹{formData.amount}</Text>
        </View>
        {/* <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Projected Returns</Text>
          <Text style={styles.summaryValue}>
            ₹{calculateReturns(formData.amount).toLocaleString()}
          </Text>
        </View> */}
      </View>

      {kycStatus === "Completed" && kycDetails && (
        <>
          <Text style={styles.sectionTitle}>KYC Details</Text>
          <View style={styles.summaryCard}>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Door No</Text>
              <Text style={styles.summaryValue}>{kycDetails.doorno}</Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Street</Text>
              <Text style={styles.summaryValue}>{kycDetails.street}</Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Area</Text>
              <Text style={styles.summaryValue}>{kycDetails.area}</Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>City</Text>
              <Text style={styles.summaryValue}>{kycDetails.city}</Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>District</Text>
              <Text style={styles.summaryValue}>{kycDetails.district}</Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>State</Text>
              <Text style={styles.summaryValue}>{kycDetails.state}</Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Country</Text>
              <Text style={styles.summaryValue}>{kycDetails.country}</Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Pincode</Text>
              <Text style={styles.summaryValue}>{kycDetails.pincode}</Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>DOB</Text>
              <Text style={styles.summaryValue}>
                {kycDetails.dob
                  ? new Date(kycDetails.dob).toLocaleDateString()
                  : ""}
              </Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>ID Number</Text>
              <Text style={styles.summaryValue}>{kycDetails.enternumber}</Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Nominee Name</Text>
              <Text style={styles.summaryValue}>{kycDetails.nominee_name}</Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Nominee Relationship</Text>
              <Text style={styles.summaryValue}>
                {kycDetails.nominee_relationship}
              </Text>
            </View>
          </View>
        </>
      )}
    </View>
  );

  const handleNext = () => {
    // Step 1: Amount selection
    if (step === 1) {
      if (!validate("amount", formData.amount)) return;

      if (isKycLoading) {
        Alert.alert("Please wait", "Checking KYC status...");
        return;
      }

      // If KYC is NOT completed, show alert and prompt the user
      if (kycStatus !== "Completed") {
        Alert.alert(
          "KYC Not Completed",
          "Your KYC is not complete. Do you want to complete it now?",
          [
            {
              text: "Cancel",
              style: "cancel",
            },
            {
              text: "Complete Now",
              onPress: () => router.push("/(tabs)/home/kyc"),
            },
          ]
        );
        return;
      } else {
        // If KYC is completed, move to Step 2 to collect account name
        setStep(2);
      }
      return;
    }

    // Step 2: KYC / personal details (only if reached)
    if (step === 2) {
      if (
        !validate("accountname", formData.accountname) ||
        !validate("associated_branch", formData.associated_branch)
        // !validate('mobile', formData.mobile) ||
        // !validate('email', formData.email) ||
        // !validate('pan', formData.pan) ||
        // !validate('nominee', formData.nominee)
      ) {
        return;
      }
      // Proceed to summary step
      setStep(3);
      return;
    }

    // Step 3: Final submission
    if (step === 3) {
      // Find the selected chit from the parsed data based on the selected amount
      const selectedChit = chits.find(
        (chit) => String(chit.AMOUNT) === formData.amount
      );

      // Build the payload
      const payload = {
        userId: user.id, // Replace with actual logged in user id from your global store or auth state
        schemeId: Number(schemeId), // from query params
        chitId: selectedChit ? selectedChit.CHITID : null,
        accountName: formData.accountname,
        associated_branch: formData.associated_branch,
      };

      console.log(
        "Creating savings scheme with payload:--------------->> ** ",
        payload
      );

      api
        .post("/investments", payload)
        .then((data: any) => {
          console.log(
            "Savings scheme created:",
            data,
            "users==========",
            user,
            formData
          );

          // Alert.alert(translations.successTitle, translations.successMessage);
          router.push({
            pathname: "/(tabs)/home/payment",
            params: {
              amount: formData.amount,
              userDetails: JSON.stringify({
                accountname: formData.accountname,
                associated_branch: formData.associated_branch,
                name: formData.accountname,
                mobile: user.mobile,
                email: user.email,
                investmentId: data.id,
                ...data,
              }),
            },
          });
        })
        .catch((error) => {
          console.error("Error creating savings scheme:", error);
          Alert.alert(
            "Error",
            "There was an error creating the savings scheme. Please try again."
          );
        });

      // router.push({
      //   pathname: '/(tabs)/home/payment',
      //   params: {
      //     amount: formData.amount,
      //     userDetails: JSON.stringify({
      //       name: formData.name,
      //       email: formData.email,
      //       mobile: formData.mobile,
      //     }),
      //   },
      // });
      // Alert.alert(translations.successTitle, translations.successMessage);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      style={styles.container}
    >
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => {
              // If on step 3 and KYC is already completed, skip going back to step 2
              if (step === 3 && kycStatus === "Completed") {
                setStep(1);
              } else if (step > 1) {
                setStep(step - 1);
              } else {
                router.back();
              }
            }}
            style={styles.backButton}
          >
            <Ionicons
              name="arrow-back"
              size={24}
              color={theme.colors.primary}
            />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{translations.digiGoldTitle}</Text>
        </View>

        {renderProgressBar()}

        {isKycLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={theme.colors.primary} />
            <Text>Loading KYC status...</Text>
          </View>
        ) : (
          <ScrollView
            style={styles.content}
            contentContainerStyle={{ paddingBottom: 80 }}
          >
            {step === 1 && renderStep1()}
            {step === 2 && renderStep2()}
            {step === 3 && renderStep3()}
          </ScrollView>
        )}

        <View style={styles.footer}>
          <TouchableOpacity style={styles.button} onPress={handleNext}>
            <Text style={styles.buttonText}>
              {step === 3 ? translations.confirmAndJoin : translations.next}
            </Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#e5e5e5",
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "bold",
    marginLeft: 16,
    color: theme.colors.primary,
  },
  progressContainer: {
    flexDirection: "row",
    padding: 16,
    gap: 8,
  },
  progressItem: {
    flex: 1,
    height: 4,
    borderRadius: 2,
  },
  content: {
    flex: 1,
  },
  stepContainer: {
    padding: 16,
  },
  label: {
    fontSize: 16,
    marginBottom: 8,
    color: "#333",
  },
  input: {
    borderWidth: 1,
    borderColor: "#e5e5e5",
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    marginBottom: 16,
  },
  inputError: {
    borderColor: "#dc2626",
  },
  errorText: {
    color: "#dc2626",
    fontSize: 14,
    marginTop: -12,
    marginBottom: 16,
  },
  returnsCard: {
    backgroundColor: "#f0fdf4",
    padding: 16,
    borderRadius: 8,
    marginTop: 16,
  },
  returnsTitle: {
    fontSize: 16,
    fontWeight: "600",
  },
  returnsAmount: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#15803d",
    marginVertical: 8,
  },
  returnsRate: {
    fontSize: 14,
    color: "#15803d",
  },
  row: {
    flexDirection: "row",
    gap: 16,
    marginBottom: 16,
  },
  column: {
    flex: 1,
  },
  summaryCard: {
    backgroundColor: "#f8fafc",
    padding: 16,
    borderRadius: 8,
    marginBottom: 16,
    // Optional: add shadow for better UX on iOS/Android
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  summaryLabel: {
    fontSize: 14,
    color: "#64748b",
  },
  summaryValue: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: theme.colors.primary,
    marginBottom: 8,
  },
  footer: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: "#e5e5e5",
    marginBottom: 80,
  },
  button: {
    backgroundColor: theme.colors.primary,
    padding: 16,
    borderRadius: 8,
    alignItems: "center",
  },
  buttonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  pickerContainer: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 5,
    marginBottom: 10,
  },
  loadingContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 16,
  },

  amountPickerContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    marginVertical: 10,
  },
  amountCard: {
    width: "48%", // Ensuring two cards fit per row with spacing
    height: 90,
    backgroundColor: "#fff",
    borderRadius: 12,
    marginBottom: 12,
    paddingVertical: 15,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#ddd",
    elevation: 4, // Adds subtle shadow (Android)
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 }, // Adds subtle shadow (iOS)
    position: "relative",
  },
  selectedAmountCard: {
    borderColor: theme.colors.primary,
    borderWidth: 2,
    backgroundColor: "#fdf2f2", // Light red background for selected
  },
  checkboxContainer: {
    position: "absolute",
    top: 5,
    right: 5,
    backgroundColor: theme.colors.primary,
    borderRadius: 12,
    padding: 2,
  },
  amountText: {
    fontSize: 18,
    fontWeight: "bold",
    color: theme.colors.primary,
  },
  noAmountText: {
    fontSize: 16,
    color: "gray",
    textAlign: "center",
    width: "100%",
  },
});
