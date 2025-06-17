import React, { useState, useMemo, useEffect, useRef } from "react";
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
  PanResponder,
  Animated,
  ImageBackground,
  Image,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { t } from "@/i18n";
import useGlobalStore from "@/store/global.store";
import { Picker } from "@react-native-picker/picker";
import { useFocusEffect } from "@react-navigation/native";
import api from "@/services/api";
import { theme } from "@/constants/theme";
import RNPickerSelect from "react-native-picker-select";
import AsyncStorage from "@react-native-async-storage/async-storage";

const { width } = Dimensions.get("window");

// Add type definitions
interface KycDetails {
  doorno: string;
  street: string;
  area: string;
  city: string;
  district: string;
  state: string;
  country: string;
  pincode: string;
  dob: string;
  enternumber: string;
  nominee_name: string;
  nominee_relationship: string;
}

interface Branch {
  id: number;
  branch_name: string;
}

export default function JoinSavings() {
  const { schemeId } = useLocalSearchParams();
  const router = useRouter();
  const { language, user } = useGlobalStore();

  // State for scheme data loaded from AsyncStorage
  const [schemeData, setSchemeData] = useState<any>(null);
  const [schemeDataLoading, setSchemeDataLoading] = useState(true);

  // Load scheme data from AsyncStorage on mount
  useEffect(() => {
    const loadSchemeData = async () => {
      try {
        setSchemeDataLoading(true);
        const storedSchemeData = await AsyncStorage.getItem(
          "@current_scheme_data"
        );

        if (storedSchemeData) {
          const parsedData = JSON.parse(storedSchemeData);
          //console.log('Loaded scheme data from storage:', parsedData);

          // Verify that the stored data matches the current schemeId
          if (parsedData.schemeId.toString() === schemeId?.toString()) {
            setSchemeData(parsedData);
          } else {
            console.warn("Stored scheme data does not match current schemeId");
            // Fallback: try to fetch from API
            await fetchSchemeDataFromAPI();
          }
        } else {
          console.warn("No stored scheme data found");
          // Fallback: try to fetch from API
          await fetchSchemeDataFromAPI();
        }
      } catch (error) {
        console.error("Error loading scheme data:", error);
        await fetchSchemeDataFromAPI();
      } finally {
        setSchemeDataLoading(false);
      }
    };

    const fetchSchemeDataFromAPI = async () => {
      try {
        //console.log('Fetching scheme data from API for schemeId:', schemeId);
        // Add API call here if needed as fallback
        // For now, set a basic structure
        setSchemeData({
          schemeId: schemeId,
          name: "Gold Savings Scheme",
          description: "Save gold with our flexible plan.",
          type: "Monthly",
          chits: [],
          schemeType: "flexi",
          benefits: [
            "Competitive rates",
            "Flexible payments",
            "Zero making charges",
            "Free locker facility",
          ],
        });
      } catch (error) {
        console.error("Error fetching scheme data from API:", error);
      }
    };

    if (schemeId) {
      loadSchemeData();
    }
  }, [schemeId]);

  // Parse schemeData from loaded data instead of query params
  const parsedData = useMemo(() => {
    return schemeData;
  }, [schemeData]);

  // Add selectedChit state
  const [selectedChit, setSelectedChit] = useState<any>(null);

  // Extract unique payment frequencies from parsedData.chits
  const paymentFrequencies: string[] = useMemo(() => {
    if (Array.isArray(parsedData?.chits)) {
      const freqs = parsedData.chits
        .map((chit: any) => chit.PAYMENT_FREQUENCY?.toLowerCase?.())
        .filter(Boolean);
      return Array.from(new Set(freqs)) as string[];
    }
    return [];
  }, [parsedData]);

  // State declarations - now only 3 steps
  const [step, setStep] = useState(1);
  const [schemeType, setSchemeType] = useState(() => {
    // Set initial scheme type based on payment frequency
    const frequency = parsedData?.chits?.[0]?.PAYMENT_FREQUENCY?.toLowerCase();
    return frequency === "flexi" ? "flexi" : "fixed";
  });
  const [paymentFrequency, setPaymentFrequency] = useState("monthly");
  const [amount, setAmount] = useState(0);
  const [kycStatus, setKycStatus] = useState<string | null>(null);
  const [kycDetails, setKycDetails] = useState<KycDetails | null>(null);
  const [isKycLoading, setIsKycLoading] = useState(true);
  const [branch, setBranch] = useState<Branch[]>([]);
  const [formData, setFormData] = useState({
    amount: "",
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
  const [errors, setErrors] = useState<{ [key: string]: string }>({
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
  const [isTyping, setIsTyping] = useState(false);
  const [inputValue, setInputValue] = useState("0");
  const [goldWeight, setGoldWeight] = useState(0);
  const [goldRate, setGoldRate] = useState(5847); // Default fallback
  const [useLoginName, setUseLoginName] = useState(false);

  // Slider animation value
  const sliderValue = useRef(new Animated.Value(0)).current;
  const sliderWidth = useRef(0);

  // Add this above the component return
  const goldIconOpacity = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(goldIconOpacity, {
          toValue: 0.3,
          duration: 500,
          useNativeDriver: true,
        }),
        Animated.timing(goldIconOpacity, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, [goldIconOpacity]);

  // Update amount when payment frequency changes
  useEffect(() => {
    const minAmount = getMinAmount();
    setAmount(minAmount);
    setInputValue(String(minAmount));
    handleChange("amount", String(minAmount));
    sliderValue.setValue(0);
  }, [paymentFrequency]);

  // When parsedData.chits changes, set default selectedChit
  useEffect(() => {
    if (Array.isArray(parsedData?.chits) && parsedData.chits.length > 0) {
      //console.log(parsedData.chits[0]);
      setSelectedChit(parsedData.chits[0]);
    }
  }, [parsedData]);

  // Update getMinAmount, getMaxAmount, getStepAmount to use selectedChit
  const getMinAmount = () => {
    return selectedChit?.MIN_AMOUNT ? Number(selectedChit.MIN_AMOUNT) : 100;
  };
  const getMaxAmount = () => {
    return selectedChit?.MAX_AMOUNT ? Number(selectedChit.MAX_AMOUNT) : 100000;
  };
  const getStepAmount = () => {
    return selectedChit?.STEP_AMOUNT ? Number(selectedChit.STEP_AMOUNT) : 100;
  };

  const formatAmount = (amount: number): string => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const handleSliderChange = (value: number): void => {
    const minAmount = getMinAmount();
    const maxAmount = getMaxAmount();
    const step = getStepAmount();

    // Calculate the amount based on slider position
    const newAmount =
      Math.round((minAmount + (maxAmount - minAmount) * value) / step) * step;
    setAmount(newAmount);
    handleChange("amount", String(newAmount));
  };

  // Fetch branches
  useEffect(() => {
    const fetchBranche = async () => {
      try {
        const branches = await api.get(`/branches`);
        //console.log("branches", branches.data.data);
        setBranch(branches.data.data);
        // Auto-select if only one branch
        if (branches.data.data.length === 1) {
          handleChange("associated_branch", String(branches.data.data[0].id));
        }
      } catch (error) {
        console.error("Error fetching branches:", error);
      }
    };
    fetchBranche();
  }, []);

  // Fetch KYC status
  useFocusEffect(
    React.useCallback(() => {
      const fetchKycStatus = async () => {
        try {
          setIsKycLoading(true);
          const response = await api.get(`/kyc/status/${user?.id}`);
          if (response.data) {
            setKycStatus(response.data.kyc_status || "Not Completed");
            if (response.data.data) {
              setKycDetails(response.data.data);
            } else {
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

  const handleAmountInput = (text: string): void => {
    // Allow only numbers and remove leading zeros
    const numericValue = text.replace(/[^0-9]/g, "").replace(/^0+/, "") || "0";
    let newAmount = parseInt(numericValue, 10) || 0;
    const maxAmount = 100000;

    // First update input value
    setInputValue(numericValue);

    // Handle empty input
    if (numericValue === "0") {
      setAmount(0);
      setGoldWeight(0);
      handleChange("amount", "0");
      return;
    }

    // If amount exceeds max limit
    if (newAmount > maxAmount) {
      // Calculate gold weight for max amount
      const maxGoldWeight = calculateGoldWeight(maxAmount);

      // Update all values to max
      setInputValue(String(maxAmount));
      setAmount(maxAmount);
      setGoldWeight(maxGoldWeight);
      handleChange("amount", String(maxAmount));

      Alert.alert("Maximum Limit", "Maximum amount allowed is ₹1,00,000");

      // Update slider position for max amount
      const minAmount = getMinAmount();
      const sliderPosition = (maxAmount - minAmount) / (maxAmount - minAmount);
      sliderValue.setValue(sliderPosition);
      return;
    }

    // Update amount and gold weight
    const minAmount = getMinAmount();
    const validAmount = Math.max(minAmount, Math.min(maxAmount, newAmount));

    // Calculate exact gold weight for the amount
    const exactGoldWeight = calculateGoldWeight(validAmount);

    setAmount(validAmount);
    setGoldWeight(exactGoldWeight);
    handleChange("amount", String(validAmount));

    // Update slider position
    const sliderPosition = (validAmount - minAmount) / (maxAmount - minAmount);
    sliderValue.setValue(sliderPosition);
  };

  const handleAmountSubmit = () => {
    const minAmount = getMinAmount();
    const maxAmount = 100000;
    const step = getStepAmount();

    // Round to nearest step when done typing
    const roundedAmount = Math.round(amount / step) * step;
    const finalAmount = Math.max(minAmount, Math.min(maxAmount, roundedAmount));

    setAmount(finalAmount);
    setInputValue(
      finalAmount === 0 ? "0" : String(finalAmount).replace(/^0+/, "")
    );
    handleChange("amount", String(finalAmount));
    setGoldWeight(calculateGoldWeight(finalAmount));

    // Update slider position
    const sliderPosition = (finalAmount - minAmount) / (maxAmount - minAmount);
    sliderValue.setValue(sliderPosition);
  };

  const calculateGoldWeight = (amt: number) => {
    return Number((amt / goldRate).toFixed(3));
  };

  const calculateAmount = (weight: number) => {
    return Math.round(weight * goldRate);
  };

  const handleGoldWeightInput = (text: string) => {
    // Allow only numbers and one decimal point
    const numericValue = text.replace(/[^0-9.]/g, "");
    const weight = parseFloat(numericValue) || 0;
    const maxAmount = 100000;

    // Calculate exact amount for the weight
    const calculatedAmount = calculateAmount(weight);

    // If amount would exceed 1 lakh
    if (calculatedAmount > maxAmount) {
      // Calculate max allowed weight based on current gold rate
      const maxWeight = calculateGoldWeight(maxAmount);

      // Update all values to maximum allowed
      setGoldWeight(maxWeight);
      setAmount(maxAmount);
      setInputValue(String(maxAmount));
      handleChange("amount", String(maxAmount));

      Alert.alert(
        "Maximum Limit",
        `Maximum gold weight allowed is ${maxWeight.toFixed(
          3
        )}g based on current rate`
      );

      // Update slider position for max amount
      const minAmount = getMinAmount();
      const sliderPosition = (maxAmount - minAmount) / (maxAmount - minAmount);
      sliderValue.setValue(sliderPosition);
      return;
    }

    // Update with exact values
    setGoldWeight(weight);
    setAmount(calculatedAmount);
    setInputValue(String(calculatedAmount));
    handleChange("amount", String(calculatedAmount));

    // Update slider position
    const minAmount = getMinAmount();
    const sliderPosition =
      (calculatedAmount - minAmount) / (maxAmount - minAmount);
    sliderValue.setValue(sliderPosition);
  };

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

  const calculateReturns = (amount: number): number => {
    const monthlyAmount = parseFloat(String(amount)) || 0;
    const annualRate = 0.12;
    const years = 1;
    const monthlyRate = annualRate / 12;
    const months = years * 12;
    const futureValue =
      (monthlyAmount * (Math.pow(1 + monthlyRate, months) - 1)) / monthlyRate;
    return Math.round(futureValue);
  };

  const validate = (field: keyof typeof formData, value: string): boolean => {
    const newErrors = { ...errors };

    switch (field) {
      case "amount":
        const minAmount = 100;
        const maxAmount = 100000;
        const numValue = Number(value);
        newErrors.amount = !value
          ? "Amount is required"
          : numValue < minAmount
          ? `Minimum amount should be ₹${minAmount}`
          : numValue > maxAmount
          ? `Maximum amount should be ₹${maxAmount}`
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
        newErrors.associated_branch = !value
          ? "Associated Branch is required"
          : "";
        break;
      default:
        break;
    }

    setErrors(newErrors);
    return !newErrors[field];
  };

  const handleChange = (field: keyof typeof formData, value: string): void => {
    setFormData({ ...formData, [field]: value });
    validate(field, value);
  };

  const renderGoldRateArea = () => (
    <View style={styles.progressHeader}>
      <Text style={styles.progressTitle}>
        {step === 1
          ? "Choose Your Plan"
          : `Selected Amount: ${formatAmount(amount)}`}
      </Text>
      <View
        style={[styles.goldRateCard, step > 1 && styles.selectedGoldRateCard]}
      >
        <Animated.View
          style={[styles.goldRateIcon, { opacity: goldIconOpacity }]}
        >
          <MaterialCommunityIcons name="gold" size={20} color="#FFC857" />
        </Animated.View>
        <View>
          <Text style={styles.goldRateLabel}>Today's Gold Rate</Text>
          <Text style={styles.goldRateValue}>
            ₹{goldRate.toLocaleString("en-IN")}/gram
          </Text>
        </View>
      </View>
    </View>
  );

  const renderProgressBar = () => (
    <View style={styles.progressContainer}>
      {[1, 2, 3].map((num) => (
        <TouchableOpacity
          key={num}
          style={styles.progressItemContainer}
          onPress={() => {
            if (num <= step) {
              setStep(num);
            }
          }}
          disabled={num > step}
        >
          <View style={styles.progressLineContainer}>
            {num > 1 && (
              <View
                style={[
                  styles.progressLine,
                  step >= num && styles.progressLineActive,
                ]}
              />
            )}
            <View
              style={[
                styles.progressCircle,
                step >= num && styles.progressCircleActive,
                step === num && styles.progressCircleCurrent,
                num > step && styles.progressCircleLocked,
              ]}
            >
              {num > step ? (
                <Ionicons
                  name="lock-closed"
                  size={12}
                  color="rgba(255, 255, 255, 0.4)"
                />
              ) : (
                <Text
                  style={[
                    styles.progressNumber,
                    step >= num && styles.progressNumberActive,
                  ]}
                >
                  {num}
                </Text>
              )}
            </View>
            {num < 3 && (
              <View
                style={[
                  styles.progressLine,
                  step > num && styles.progressLineActive,
                ]}
              />
            )}
          </View>
          <Text
            style={[
              styles.progressLabel,
              step >= num && styles.progressLabelActive,
              step === num && styles.progressLabelCurrent,
              num > step && styles.progressLabelLocked,
            ]}
          >
            {num === 1 ? "Amount" : num === 2 ? "Details" : "Summary"}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );

  // Step 1 (originally step 2) - Amount selection
  const renderStep1 = () => {
    const minAmount = getMinAmount();
    const maxAmount = getMaxAmount();
    const quickAmounts =
      paymentFrequency === "monthly"
        ? [500, 1000, 2000, 5000, 10000, 20000, 50000, 75000, 100000]
        : [100, 500, 1000, 2000, 5000, 10000, 20000, 50000, 75000, 100000];

    return (
      <View style={styles.stepContainer}>
        <View style={styles.dualInputContainer}>
          {/* Amount Input Side */}
          <View style={[styles.inputSide, styles.amountCardLite]}>
            <Image
              source={require("../../../../../assets/images/rupee-bg.png")}
              style={styles.amountCardBgImage}
              resizeMode="contain"
            />
            <Text style={styles.label}>Amount in Rupees</Text>
            <View style={styles.amountDisplayContainer}>
              {isTyping ? (
                <View style={styles.amountInputContainer}>
                  <Text style={styles.currencySymbol}>₹</Text>
                  <TextInput
                    style={styles.amountInput}
                    value={inputValue}
                    onChangeText={handleAmountInput}
                    keyboardType="numeric"
                    onFocus={() => setIsTyping(true)}
                    onBlur={() => {
                      setIsTyping(false);
                      handleAmountSubmit();
                    }}
                    autoFocus
                    maxLength={8}
                    placeholder="0"
                    placeholderTextColor="rgba(255, 255, 255, 0.5)"
                  />
                </View>
              ) : (
                <TouchableOpacity
                  onPress={() => {
                    setIsTyping(true);
                    setInputValue(String(amount));
                  }}
                  style={styles.amountValueContainer}
                >
                  <Text style={styles.amountValue}>{formatAmount(amount)}</Text>
                  <Ionicons
                    name="pencil"
                    size={20}
                    color="red"
                    style={styles.editIcon}
                  />
                </TouchableOpacity>
              )}
            </View>
          </View>

          {/* Divider */}
          <View style={styles.calculationDivider}>
            <Ionicons
              name="swap-horizontal"
              size={20}
              color="#FFC857"
              style={{ opacity: 0.9 }}
            />
          </View>

          {/* Gold Weight Input Side */}
          <View style={[styles.inputSide, styles.goldCard]}>
            <View style={styles.goldShine} />
            <Text style={styles.goldLabel}>Gold Weight</Text>
            <View style={styles.amountDisplayContainer}>
              <View style={styles.goldInputContainer}>
                <TextInput
                  style={styles.goldInput}
                  value={String(goldWeight)}
                  onChangeText={handleGoldWeightInput}
                  keyboardType="decimal-pad"
                  maxLength={6}
                  placeholder="0.000"
                  placeholderTextColor="#99999980"
                />
                <Text style={styles.goldSymbol}>g</Text>
              </View>
            </View>
          </View>
        </View>

        <View style={styles.quickAmountContainer}>
          <Text style={styles.quickAmountLabel}>Quick Select:</Text>
          <View style={styles.quickAmountGrid}>
            {quickAmounts.map((quickAmount) => (
              <TouchableOpacity
                key={quickAmount}
                style={[
                  styles.quickAmountButton,
                  amount === quickAmount && styles.selectedQuickAmountButton,
                ]}
                onPress={() => {
                  const newValue =
                    (quickAmount - minAmount) / (maxAmount - minAmount);
                  sliderValue.setValue(newValue);
                  setAmount(quickAmount);
                  setGoldWeight(calculateGoldWeight(quickAmount));
                  handleChange("amount", String(quickAmount));
                }}
              >
                <Text
                  style={[
                    styles.quickAmountText,
                    amount === quickAmount && styles.selectedQuickAmountText,
                  ]}
                >
                  ₹{quickAmount.toLocaleString("en-IN")}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {errors.amount && <Text style={styles.errorText}>{errors.amount}</Text>}
      </View>
    );
  };

  // Step 2 (originally step 4) - Account Details
  const renderStep2 = () => (
    <View style={styles.stepContainer}>
      <Text style={styles.sectionTitle}>Account Details</Text>
      <Text style={styles.label}>Account Holder Name</Text>
      <View
        style={{ flexDirection: "row", alignItems: "center", marginBottom: 8 }}
      >
        <TextInput
          style={[
            styles.input,
            errors.accountname ? styles.inputError : null,
            { flex: 1 },
          ]}
          placeholder="Enter your account name"
          placeholderTextColor={"#999"}
          value={formData.accountname}
          onChangeText={(value) => handleChange("accountname", value)}
          editable={!useLoginName}
        />
        <TouchableOpacity
          style={{ flexDirection: "row", alignItems: "center", marginLeft: 8 }}
          onPress={() => {
            const checked = !useLoginName;
            setUseLoginName(checked);
            if (checked && user?.name) {
              handleChange("accountname", user.name);
            }
          }}
        >
          <View
            style={{
              width: 20,
              height: 20,
              borderRadius: 4,
              borderWidth: 1,
              borderColor: "#FFC857",
              backgroundColor: useLoginName ? "#FFC857" : "#fff",
              alignItems: "center",
              justifyContent: "center",
              marginRight: 4,
            }}
          >
            {useLoginName && (
              <Ionicons name="checkmark" size={16} color="#1a237e" />
            )}
          </View>
          <Text style={{ fontSize: 12, color: "#333" }}>Use my login name</Text>
        </TouchableOpacity>
      </View>
      {errors.accountname && (
        <Text style={styles.errorText}>{errors.accountname}</Text>
      )}
      <Text style={styles.label}>Branch Name</Text>
      <RNPickerSelect
        onValueChange={(value) => handleChange("associated_branch", value)}
        onDonePress={() => {}}
        placeholder={{ label: "Select Branch", value: "" }}
        value={formData.associated_branch}
        items={branch.map((id) => ({
          label: id.branch_name,
          value: id.id,
        }))}
        style={pickerSelectStyles}
        useNativeAndroidPickerStyle={false}
      />
      {errors.associated_branch && (
        <Text style={styles.errorText}>{errors.associated_branch}</Text>
      )}
    </View>
  );

  // Step 3 (originally step 5) - Summary
  const renderStep3 = () => {
    return (
      <>
        <View style={styles.summaryCardModern}>
          <View style={styles.summaryCardHeader}>
            <MaterialCommunityIcons
              name="piggy-bank"
              size={22}
              color="#FFC857"
            />
            <Text style={styles.summaryCardTitle}>Saving Summary</Text>
          </View>
          <View style={styles.summaryRowModern}>
            <Text style={styles.summaryLabelModern}>Scheme Type</Text>
            <Text style={styles.summaryValueModern}>
              {schemeType === "fixed" ? "Fixed Amount" : "Flexi Amount"}
            </Text>
          </View>
          <View style={styles.summaryRowModern}>
            <Text style={styles.summaryLabelModern}>Amount</Text>
            <Text style={styles.summaryAmountModern}>₹{formData.amount}</Text>
          </View>
          <View style={styles.summaryRowModern}>
            <Text style={styles.summaryLabelModern}>Payment Frequency</Text>
            <Text style={styles.summaryValueModern}>
              {selectedChit?.PAYMENT_FREQUENCY || ""}
            </Text>
          </View>
        </View>
        {/* KYC Card - only in Step 3 */}
        {kycStatus === "Completed" && kycDetails && (
          <View style={{ marginTop: 24, marginHorizontal: 16 }}>
            {/* KYC Details Title and Edit Icon */}
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                marginBottom: 12,
              }}
            >
              <Text
                style={{
                  fontSize: 18,
                  fontWeight: "bold",
                  color: "#1a237e",
                  flex: 1,
                }}
              >
                KYC Details
              </Text>
              <TouchableOpacity
                onPress={() => router.push("/(tabs)/home/kyc")}
                style={{
                  padding: 4,
                  borderRadius: 8,
                  backgroundColor: "rgba(255, 200, 87, 0.1)",
                }}
              >
                <Ionicons
                  name="pencil"
                  size={18}
                  color={theme.colors.primary}
                />
              </TouchableOpacity>
            </View>
            {/* Address Card */}
            <View
              style={{
                backgroundColor: "#e3f2fd",
                borderRadius: 18,
                padding: 20,
                marginBottom: 16,
                shadowColor: "#2196F3",
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.1,
                shadowRadius: 8,
                elevation: 4,
                borderWidth: 1,
                borderColor: "#90caf9",
              }}
            >
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  marginBottom: 16,
                  borderBottomWidth: 1,
                  borderBottomColor: "#90caf9",
                  paddingBottom: 12,
                }}
              >
                <MaterialCommunityIcons name="home" size={20} color="#2196F3" />
                <Text
                  style={{
                    fontSize: 16,
                    fontWeight: "bold",
                    color: "#1976d2",
                    marginLeft: 8,
                    flex: 1,
                  }}
                >
                  Address Details
                </Text>
              </View>
              <View style={{ gap: 12 }}>
                <View style={styles.kycRow}>
                  <Text style={styles.kycLabel}>Door No</Text>
                  <Text style={styles.kycValue}>{kycDetails.doorno}</Text>
                </View>
                <View style={styles.kycRow}>
                  <Text style={styles.kycLabel}>Street</Text>
                  <Text style={styles.kycValue}>{kycDetails.street}</Text>
                </View>
                <View style={styles.kycRow}>
                  <Text style={styles.kycLabel}>Area</Text>
                  <Text style={styles.kycValue}>{kycDetails.area}</Text>
                </View>
                <View style={styles.kycRow}>
                  <Text style={styles.kycLabel}>City</Text>
                  <Text style={styles.kycValue}>{kycDetails.city}</Text>
                </View>
                <View style={styles.kycRow}>
                  <Text style={styles.kycLabel}>District</Text>
                  <Text style={styles.kycValue}>{kycDetails.district}</Text>
                </View>
                <View style={styles.kycRow}>
                  <Text style={styles.kycLabel}>State</Text>
                  <Text style={styles.kycValue}>{kycDetails.state}</Text>
                </View>
                <View style={styles.kycRow}>
                  <Text style={styles.kycLabel}>Country</Text>
                  <Text style={styles.kycValue}>{kycDetails.country}</Text>
                </View>
                <View style={styles.kycRow}>
                  <Text style={styles.kycLabel}>Pincode</Text>
                  <Text style={styles.kycValue}>{kycDetails.pincode}</Text>
                </View>
              </View>
            </View>
            {/* ID Proof Card */}
            <View
              style={{
                backgroundColor: "#fffde7",
                borderRadius: 18,
                padding: 20,
                marginBottom: 16,
                shadowColor: "#FFC857",
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.1,
                shadowRadius: 8,
                elevation: 4,
                borderWidth: 1,
                borderColor: "#ffe082",
              }}
            >
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  marginBottom: 16,
                  borderBottomWidth: 1,
                  borderBottomColor: "#ffe082",
                  paddingBottom: 12,
                }}
              >
                <MaterialCommunityIcons
                  name="card-account-details"
                  size={20}
                  color="#FFC857"
                />
                <Text
                  style={{
                    fontSize: 16,
                    fontWeight: "bold",
                    color: "#bfa14a",
                    marginLeft: 8,
                    flex: 1,
                  }}
                >
                  ID Proof
                </Text>
              </View>
              <View style={{ gap: 12 }}>
                <View style={styles.kycRow}>
                  <Text style={styles.kycLabel}>Date of Birth</Text>
                  <Text style={styles.kycValue}>
                    {kycDetails.dob
                      ? new Date(kycDetails.dob).toLocaleDateString()
                      : ""}
                  </Text>
                </View>
                <View style={styles.kycRow}>
                  <Text style={styles.kycLabel}>ID Number</Text>
                  <Text style={styles.kycValue}>{kycDetails.enternumber}</Text>
                </View>
                {/* Nominee Card nested inside ID Proof */}
                <View
                  style={{
                    backgroundColor: "#e8f5e9",
                    borderRadius: 14,
                    padding: 16,
                    marginTop: 18,
                    shadowColor: "#81c784",
                    shadowOffset: { width: 0, height: 2 },
                    shadowOpacity: 0.08,
                    shadowRadius: 6,
                    elevation: 2,
                    borderWidth: 1,
                    borderColor: "#a5d6a7",
                  }}
                >
                  <View
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      marginBottom: 16,
                      borderBottomWidth: 1,
                      borderBottomColor: "#a5d6a7",
                      paddingBottom: 12,
                    }}
                  >
                    <MaterialCommunityIcons
                      name="account-multiple"
                      size={20}
                      color="#388e3c"
                    />
                    <Text
                      style={{
                        fontSize: 16,
                        fontWeight: "bold",
                        color: "#388e3c",
                        marginLeft: 8,
                        flex: 1,
                      }}
                    >
                      Nominee
                    </Text>
                  </View>
                  <View style={{ gap: 12 }}>
                    <View style={styles.kycRow}>
                      <Text style={styles.kycLabel}>Nominee Name</Text>
                      <Text style={styles.kycValue}>
                        {kycDetails.nominee_name}
                      </Text>
                    </View>
                    <View style={styles.kycRow}>
                      <Text style={styles.kycLabel}>Relationship</Text>
                      <Text style={styles.kycValue}>
                        {kycDetails.nominee_relationship}
                      </Text>
                    </View>
                  </View>
                </View>
              </View>
            </View>
          </View>
        )}
      </>
    );
  };

  const handleNext = () => {
    // Step 1: Amount selection
    if (step === 1) {
      if (!validate("amount", formData.amount)) return;

      if (isKycLoading) {
        Alert.alert("Please wait", "Checking KYC status...");
        return;
      }

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
      }

      setStep(2);
      return;
    }

    // Step 2: Account details
    if (step === 2) {
      if (
        !validate("accountname", formData.accountname) ||
        !validate("associated_branch", formData.associated_branch)
      ) {
        return;
      }
      setStep(3);
      return;
    }

    // Step 3: Final submission
    if (step === 3) {
      if (!user) {
        Alert.alert("Error", "User not found. Please log in again.");
        return;
      }
      const payload = {
        userId: user.id,
        schemeId: Number(schemeId),
        chitId: selectedChit ? selectedChit.CHITID : null,
        accountName: formData.accountname,
        associated_branch: formData.associated_branch,
        payment_frequency_id: 4,
      };
      //console.log(payload ,selectedChit );
      api
        .post("/investments", payload)
        .then((data: any) => {
          //console.log('Investment API response:', data);

          // Store payment session data in global store
          const { storePaymentSession } = useGlobalStore.getState();
          const paymentSessionData = {
            amount: Number(formData.amount),
            userDetails: {
              accountname: formData.accountname,
              accNo: data.data.data?.accountNo || data.accountNo,
              associated_branch: formData.associated_branch,
              name: formData.accountname,
              mobile: String(user.mobile || ""),
              email: user.email || "",
              userId: user.id || "",
              investmentId: data.data.data?.id || data.id,
              schemeId: Number(schemeId),
              schemeType: schemeType,
              paymentFrequency: selectedChit
                ? selectedChit.PAYMENT_FREQUENCY
                : "",
              chitId: selectedChit ? selectedChit.CHITID : null,
              isRetryAttempt: false,
              source: "join_savings",
            },
            timestamp: new Date().toISOString(),
          };

          storePaymentSession(paymentSessionData);
          //console.log('Payment session stored in global store from join_savings');
          //console.log('paymentSessionData',paymentSessionData);
          router.push({
            pathname: "/(tabs)/home/paymentNewOverView",
            params: {
              amount: formData.amount,
              schemeName: parsedData?.name, // Pass scheme name
              schemeId: parsedData?.schemeId,
              chitId: selectedChit?.CHITID,
              paymentFrequency: selectedChit?.PAYMENT_FREQUENCY,
              schemeType: schemeType,
              userDetails: JSON.stringify({
                accountname: formData.accountname,
                accNo: data.data?.data?.accountNo || data.accountNo,
                associated_branch: formData.associated_branch,
                name: formData.accountname,
                mobile: String(user.mobile || ""),
                email: user.email || "",
                userId: user.id || "",
                investmentId: data.data?.data?.id || data.id,
                schemeId: Number(schemeId),
                schemeType: schemeType,
                schemeName: parsedData?.name, // Also inside userDetails for redundancy
                paymentFrequency: selectedChit?.PAYMENT_FREQUENCY,
                chitId: selectedChit?.CHITID,
                ...data.data.data,
              }),
            },
          });
        })
        .catch((error: any) => {
          console.error("Error creating savings scheme:", error);
          Alert.alert(
            "Error",
            "There was an error creating the savings scheme. Please try again."
          );
        });
    }
  };

  useEffect(() => {
    const fetchGoldRate = async () => {
      try {
        const storedRate = await AsyncStorage.getItem("gold_rate");
        if (storedRate) {
          setGoldRate(Number(storedRate));
        }
      } catch (e) {
        // fallback to default
      }
    };
    fetchGoldRate();
  }, []);

  // On mount, check for step param in query and set step accordingly
  useEffect(() => {
    if (
      typeof globalThis !== "undefined" &&
      (globalThis as any).location &&
      (globalThis as any).location.search
    ) {
      const urlParams = new URLSearchParams(
        (globalThis as any).location.search
      );
      const stepParam = urlParams.get("step");
      if (stepParam && !isNaN(Number(stepParam))) {
        setStep(Number(stepParam));
      }
    }
  }, []);

  // Update scheme type when payment frequency changes
  useEffect(() => {
    if (selectedChit) {
      const frequency = selectedChit.PAYMENT_FREQUENCY?.toLowerCase();
      setSchemeType(frequency === "flexi" ? "flexi" : "fixed");
    }
  }, [selectedChit]);

  // Show loading screen while scheme data is being loaded
  if (schemeDataLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => router.back()}
            style={styles.backButton}
          >
            <Ionicons name="arrow-back" size={24} color="#FFC857" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Loading Scheme...</Text>
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text style={styles.loadingText}>Loading scheme details...</Text>
        </View>
      </SafeAreaView>
    );
  }

  // Show error screen if no scheme data is available
  if (!parsedData) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => router.back()}
            style={styles.backButton}
          >
            <Ionicons name="arrow-back" size={24} color="#FFC857" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Error</Text>
        </View>
        <View style={styles.loadingContainer}>
          <Ionicons
            name="alert-circle"
            size={48}
            color={theme.colors.primary}
          />
          <Text style={styles.loadingText}>Failed to load scheme details</Text>
          <TouchableOpacity style={styles.button} onPress={() => router.back()}>
            <Text style={styles.buttonText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      style={styles.container}
    >
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => {
              if (step > 1) {
                setStep(step - 1);
              } else {
                router.back();
              }
            }}
            style={styles.backButton}
          >
            <Ionicons name="arrow-back" size={24} color="#FFC857" />
          </TouchableOpacity>
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              marginLeft: 16,
            }}
          >
            <Text
              style={[
                styles.headerTitle,
                (parsedData?.name || translations.digiGoldTitle)?.length >
                  18 && { fontSize: 13 },
              ]}
              numberOfLines={1}
              ellipsizeMode="tail"
            >
              {parsedData?.name || translations.digiGoldTitle}
            </Text>
            <View
              style={{
                backgroundColor: schemeType === "fixed" ? "#1a237e" : "#FFC857",
                borderRadius: 8,
                paddingHorizontal: 8,
                paddingVertical: 2,
                marginLeft: 8,
                alignSelf: "center",
              }}
            >
              <Text
                style={{
                  color: schemeType === "fixed" ? "#FFC857" : "#1a237e",
                  fontSize: 11,
                  fontWeight: "bold",
                  letterSpacing: 0.5,
                }}
              >
                {schemeType === "fixed" ? "Fixed" : "Flexi"}
              </Text>
            </View>
          </View>
        </View>

        {renderProgressBar()}
        {renderGoldRateArea()}
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
    backgroundColor: "#fff",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    backgroundColor: theme.colors.primary,
    borderBottomWidth: 1,
    borderBottomColor: `${theme.colors.border}15`,
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: "600",
    marginLeft: 16,
    color: "#FFC857",
  },
  progressContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: "#545454", // Deep indigo color
    borderBottomWidth: 1,
    borderBottomColor: "rgba(92, 85, 69, 0.2)", // Subtle gold border
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  progressItemContainer: {
    alignItems: "center",
    flex: 1,
    position: "relative",
    zIndex: 1,
  },
  progressLineContainer: {
    flexDirection: "row",
    alignItems: "center",
    width: "100%",
    justifyContent: "center",
  },
  progressLine: {
    height: 2,
    flex: 1,
    backgroundColor: "rgba(255, 255, 255, 0.15)",
  },
  progressLineActive: {
    backgroundColor: "#FFC857",
    shadowColor: "#FFC857",
    shadowOffset: {
      width: 0,
      height: 0,
    },
    shadowOpacity: 0.5,
    shadowRadius: 4,
    elevation: 3,
  },
  progressCircle: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "rgba(255, 255, 255, 0.2)",
  },
  progressCircleActive: {
    backgroundColor: "#FFC857",
    borderColor: "#FFC857",
  },
  progressCircleCurrent: {
    transform: [{ scale: 1.2 }],
    elevation: 4,
    shadowColor: "#FFC857",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  progressCircleLocked: {
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    borderColor: "rgba(255, 255, 255, 0.1)",
  },
  progressNumber: {
    fontSize: 12,
    fontWeight: "600",
    color: "rgba(255, 255, 255, 0.6)",
  },
  progressNumberActive: {
    color: "#000",
  },
  progressLabel: {
    marginTop: 8,
    fontSize: 12,
    fontWeight: "500",
    color: "rgba(255, 255, 255, 0.5)",
  },
  progressLabelActive: {
    color: "rgba(255, 255, 255, 0.8)",
  },
  progressLabelCurrent: {
    color: "#FFC857",
    fontWeight: "600",
  },
  progressLabelLocked: {
    color: "rgba(255, 255, 255, 0.3)",
  },
  content: {
    flex: 1,
  },
  stepContainer: {
    padding: 12,
  },
  label: {
    fontSize: 12,
    fontWeight: "600",
    marginBottom: 8,
    color: "#1a237e",
    textAlign: "left",
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
    backgroundColor: theme.colors.primary,
    borderRadius: 16,
    padding: 20,
    shadowColor: theme.colors.primary,
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
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
  schemeTypeContainer: {
    flexDirection: "column",
    gap: 16,
    marginTop: 16,
  },
  schemeTypeCard: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 20,
    borderWidth: 1,
    borderColor: "#e5e5e5",
    alignItems: "center",
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  selectedSchemeTypeCard: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
  },
  schemeTypeText: {
    fontSize: 18,
    fontWeight: "bold",
    marginTop: 12,
    color: theme.colors.primary,
  },
  selectedSchemeTypeText: {
    color: "#fff",
  },
  schemeTypeDescription: {
    fontSize: 14,
    color: "#666",
    textAlign: "center",
    marginTop: 8,
  },
  selectedSchemeTypeDescription: {
    color: "#fff",
  },
  flexiAmountContainer: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 24,
    marginTop: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  amountDisplayContainer: {
    alignItems: "center",
  },
  amountValue: {
    fontSize: 22,
    fontWeight: "700",
    color: "red",
    textAlign: "center",
  },
  amountLabel: {
    fontSize: 16,
    color: "#666",
  },
  amountGridContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    padding: 8,
    marginBottom: 16,
  },
  amountGridItem: {
    width: "31%",
    aspectRatio: 2,
    backgroundColor: "#fff",
    borderRadius: 12,
    marginBottom: 12,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#e5e5e5",
    padding: 8,
  },
  selectedAmountGridItem: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
  },
  amountGridText: {
    fontSize: 14,
    fontWeight: "600",
    color: theme.colors.primary,
    textAlign: "center",
  },
  selectedAmountGridText: {
    color: "#fff",
  },
  amountInfoContainer: {
    marginTop: 16,
    padding: 16,
    backgroundColor: "#f8f9fa",
    borderRadius: 12,
  },
  amountInfoItem: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  amountInfoText: {
    marginLeft: 8,
    fontSize: 14,
    color: "#666",
  },
  frequencyContainer: {
    flexDirection: "column",
    gap: 16,
    marginTop: 16,
  },
  frequencyCard: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 20,
    borderWidth: 1,
    borderColor: "#e5e5e5",
    alignItems: "center",
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  selectedFrequencyCard: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
  },
  frequencyText: {
    fontSize: 18,
    fontWeight: "bold",
    marginTop: 12,
    color: theme.colors.primary,
  },
  selectedFrequencyText: {
    color: "#fff",
  },
  frequencyDescription: {
    fontSize: 14,
    color: "#666",
    textAlign: "center",
    marginTop: 8,
  },
  selectedFrequencyDescription: {
    color: "#fff",
  },
  quickAmountContainer: {
    marginTop: 24,
    marginBottom: 16,
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  quickAmountLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: "#333",
    marginBottom: 12,
  },
  quickAmountGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    gap: 8,
  },
  quickAmountButton: {
    width: "31%",
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderRadius: 8,
    backgroundColor: "#F8F9FA",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    alignItems: "center",
    marginBottom: 8,
  },
  selectedQuickAmountButton: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
  },
  quickAmountText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#1a237e",
  },
  selectedQuickAmountText: {
    color: "#fff",
  },
  sliderContainer: {
    marginBottom: 24,
    paddingHorizontal: 8,
  },
  sliderTrack: {
    height: 40, // Increased height for better touch area
    backgroundColor: "#E5E7EB",
    borderRadius: 2,
    position: "relative",
    justifyContent: "center",
  },
  sliderFill: {
    height: 4,
    backgroundColor: theme.colors.primary,
    borderRadius: 2,
    position: "absolute",
    left: 0,
  },
  sliderThumb: {
    width: 24,
    height: 24,
    backgroundColor: theme.colors.primary,
    borderRadius: 12,
    position: "absolute",
    top: 8,
    marginLeft: -12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  sliderLabels: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 12,
  },
  sliderLabel: {
    fontSize: 12,
    color: "#666",
    fontWeight: "500",
  },
  amountValueContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    borderRadius: 8,
    padding: 10,
    minWidth: 140,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.2)",
  },
  amountInputContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
    backgroundColor: "rgba(138, 13, 180, 0.54)",
    borderRadius: 8,
    padding: 10,
    minWidth: 140,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.2)",
  },
  currencySymbol: {
    fontSize: 18,
    fontWeight: "600",
    color: "#FFC857",
  },
  amountInput: {
    fontSize: 22,
    fontWeight: "700",
    padding: 0,
    minWidth: 100,
    textAlign: "center",
    color: "black",
  },
  editIcon: {
    marginLeft: 8,
    opacity: 0.8,
  },
  progressHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  progressTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: theme.colors.primary,
  },
  goldRateCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f8f9fa",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: `${theme.colors.primary}20`,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  goldRateIcon: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: `${theme.colors.primary}15`,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 8,
  },
  goldRateLabel: {
    fontSize: 10,
    color: "#666",
    marginBottom: 2,
  },
  goldRateValue: {
    fontSize: 14,
    fontWeight: "700",
    color: theme.colors.primary,
  },
  dualInputContainer: {
    flexDirection: "row",
    alignItems: "stretch",
    justifyContent: "space-between",
    marginBottom: 20,
    marginHorizontal: 8,
    backgroundColor: "transparent",
    gap: 8,
  },
  inputSide: {
    flex: 1,
    borderRadius: 12,
    padding: 12,
    elevation: 4,
    minWidth: 150,
  },
  calculationDivider: {
    width: 28,
    alignItems: "center",
    justifyContent: "center",
    alignSelf: "center",
  },
  goldCard: {
    backgroundColor: "#FFF",
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: "#FFC857",
    shadowColor: "#FFC857",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
    position: "relative",
    overflow: "hidden",
  },
  goldShine: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: "100%",
    backgroundColor: "#FFC85715",
    transform: [{ skewX: "-45deg" }],
  },
  goldLabel: {
    fontSize: 12,
    fontWeight: "600",
    marginBottom: 8,
    color: "#1a237e",
    textAlign: "center",
  },
  goldValueContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    backgroundColor: "#FFF",
    borderRadius: 8,
    padding: 10,
    minWidth: 140,
    borderWidth: 1,
    borderColor: "#FFC857",
  },
  goldInputContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
    backgroundColor: "#FFF",
    borderRadius: 8,
    padding: 10,
    minWidth: 140,
    borderWidth: 1,
    borderColor: "#FFC857",
  },
  goldInput: {
    fontSize: 22,
    fontWeight: "700",
    padding: 0,
    minWidth: 100,
    textAlign: "center",
    color: "#1a237e",
  },
  goldSymbol: {
    fontSize: 16,
    fontWeight: "600",
    color: "#FFC857",
  },
  selectedGoldRateCard: {
    borderColor: theme.colors.primary,
    borderWidth: 1,
    backgroundColor: "#fff",
  },
  summaryCardModern: {
    backgroundColor: "#fffbe6",
    borderRadius: 18,
    padding: 20,
    marginBottom: 18,
    marginHorizontal: 16,
    shadowColor: "#FFC857",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 6,
    borderWidth: 1,
    borderColor: "#ffe6a1",
  },
  summaryCardHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 14,
  },
  summaryCardTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: theme.colors.primary,
    marginLeft: 8,
  },
  summaryRowModern: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  summaryLabelModern: {
    fontSize: 15,
    color: "#bfa14a",
    fontWeight: "600",
  },
  summaryValueModern: {
    fontSize: 15,
    color: "#333",
    fontWeight: "600",
  },
  summaryAmountModern: {
    fontSize: 22,
    color: "#FFC857",
    fontWeight: "bold",
  },
  kycRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  kycLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: "#666",
    marginRight: 8,
  },
  kycValue: {
    fontSize: 14,
    fontWeight: "500",
    color: "#333",
  },
  amountCardLite: {
    backgroundColor: "#e8f5e9", // Light gold/cream
    borderRadius: 16,
    padding: 20,
    shadowColor: theme.colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
    overflow: "hidden",
    position: "relative",
  },
  amountCardBgImage: {
    position: "absolute",
    right: 0,
    bottom: 0,
    width: 90,
    height: 90,
    opacity: 0.12,
    zIndex: 0,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
  },
});
