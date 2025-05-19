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
import RNPickerSelect from "react-native-picker-select";

const { width } = Dimensions.get("window");

export default function JoinSavings() {
  const { schemeId, schemeData } = useLocalSearchParams();
  const router = useRouter();
  const { language, user } = useGlobalStore();

  // Parse schemeData from query params
  const parsedData = useMemo(() => {
    if (typeof schemeData === "string") {
      try {
        const parsed = JSON.parse(schemeData);
        return parsed;
      } catch (error) {
        console.error("Error parsing schemeData:", error);
        return null;
      }
    }
    return null;
  }, [schemeData, schemeId]);

  // State declarations
  const [step, setStep] = useState(1);
  const [schemeType, setSchemeType] = useState(parsedData?.schemeType || null);
  const [paymentFrequency, setPaymentFrequency] = useState(null);
  const [amount, setAmount] = useState(100);
  const [kycStatus, setKycStatus] = useState(null);
  const [kycDetails, setKycDetails] = useState(null);
  const [isKycLoading, setIsKycLoading] = useState(true);
  const [branch, setBranch] = useState([]);
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
  const [isTyping, setIsTyping] = useState(false);
  const [inputValue, setInputValue] = useState('');

  // Slider animation value
  const sliderValue = useRef(new Animated.Value(0)).current;
  const sliderWidth = useRef(0);

  // Update amount when payment frequency changes
  useEffect(() => {
    const minAmount = paymentFrequency === 'monthly' ? 500 : 100;
    setAmount(minAmount);
    setInputValue(String(minAmount));
    handleChange('amount', String(minAmount));
    sliderValue.setValue(0);
  }, [paymentFrequency]);

  const getMinAmount = () => {
    switch (paymentFrequency) {
      case 'monthly':
        return 500;
      case 'weekly':
      case 'daily':
        return 100;
      default:
        return 100;
    }
  };

  const getMaxAmount = () => 100000;

  const getStepAmount = () => {
    switch (paymentFrequency) {
      case 'monthly':
        return 500;
      case 'weekly':
      case 'daily':
        return 100;
      default:
        return 100;
    }
  };

  const formatAmount = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const handleSliderChange = (value) => {
    const minAmount = getMinAmount();
    const maxAmount = getMaxAmount();
    const step = getStepAmount();
    
    // Calculate the amount based on slider position
    const newAmount = Math.round((minAmount + (maxAmount - minAmount) * value) / step) * step;
    setAmount(newAmount);
    handleChange('amount', String(newAmount));
  };

  // Fetch branches
  useEffect(() => {
    const fetchBranche = async () => {
      try {
        const branches = await api.get(`/branches`);
        console.log("branches", branches.data.data);
        setBranch(branches.data.data);
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

  const handleAmountInput = (text) => {
    // Allow only numbers
    const numericValue = text.replace(/[^0-9]/g, '');
    setInputValue(numericValue);

    if (numericValue === '') {
      setAmount(0);
      handleChange('amount', '');
      return;
    }

    const newAmount = parseInt(numericValue, 10);
    const minAmount = getMinAmount();
    const maxAmount = getMaxAmount();

    // Only validate min/max, don't round to step while typing
    const validAmount = Math.max(minAmount, Math.min(maxAmount, newAmount));
    
    setAmount(validAmount);
    handleChange('amount', String(validAmount));

    // Update slider position
    const sliderPosition = (validAmount - minAmount) / (maxAmount - minAmount);
    sliderValue.setValue(sliderPosition);
  };

  const handleAmountSubmit = () => {
    const minAmount = getMinAmount();
    const maxAmount = getMaxAmount();
    const step = getStepAmount();

    // Round to nearest step when done typing
    const roundedAmount = Math.round(amount / step) * step;
    const finalAmount = Math.max(minAmount, Math.min(maxAmount, roundedAmount));
    
    setAmount(finalAmount);
    setInputValue(String(finalAmount));
    handleChange('amount', String(finalAmount));

    // Update slider position
    const sliderPosition = (finalAmount - minAmount) / (maxAmount - minAmount);
    sliderValue.setValue(sliderPosition);
  };

  const renderStep2 = () => {
    const minAmount = getMinAmount();
    const maxAmount = getMaxAmount();
    const quickAmounts = paymentFrequency === 'monthly' 
      ? [500, 1000, 2000, 5000, 10000, 20000, 50000, 100000]
      : [100, 500, 1000, 2000, 5000, 10000, 20000, 50000, 100000];

    return (
      <View style={styles.stepContainer}>
        <Text style={styles.label}>{translations.amountPlaceholder}</Text>

        <View style={styles.flexiAmountContainer}>
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
                <Text style={styles.amountValue}>
                  {formatAmount(amount)}
                </Text>
                <Ionicons name="pencil" size={16} color={theme.colors.primary} style={styles.editIcon} />
              </TouchableOpacity>
            )}
            <Text style={styles.amountLabel}>
              {paymentFrequency === 'monthly' ? 'Monthly Amount' : 
               paymentFrequency === 'weekly' ? 'Weekly Amount' : 'Daily Amount'}
            </Text>
          </View>

          <View 
            style={styles.sliderContainer}
            onLayout={(e) => {
              sliderWidth.current = e.nativeEvent.layout.width;
            }}
          >
            <TouchableOpacity
              activeOpacity={1}
              onPress={(e) => {
                const { locationX } = e.nativeEvent;
                const newValue = Math.max(0, Math.min(1, locationX / sliderWidth.current));
                sliderValue.setValue(newValue);
                handleSliderChange(newValue);
              }}
              style={styles.sliderTrack}
            >
              <Animated.View 
                style={[
                  styles.sliderFill,
                  {
                    width: sliderValue.interpolate({
                      inputRange: [0, 1],
                      outputRange: ['0%', '100%'],
                    }),
                  },
                ]}
              />
              <Animated.View
                style={[
                  styles.sliderThumb,
                  {
                    left: sliderValue.interpolate({
                      inputRange: [0, 1],
                      outputRange: [0, sliderWidth.current - 24],
                    }),
                  },
                ]}
              />
            </TouchableOpacity>
            <View style={styles.sliderLabels}>
              <Text style={styles.sliderLabel}>{formatAmount(minAmount)}</Text>
              <Text style={styles.sliderLabel}>{formatAmount(maxAmount)}</Text>
            </View>
          </View>

          <View style={styles.quickAmountContainer}>
            <Text style={styles.quickAmountLabel}>Quick Select:</Text>
            <ScrollView 
              horizontal 
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.quickAmountScroll}
            >
              {quickAmounts.map((quickAmount) => (
                <TouchableOpacity
                  key={quickAmount}
                  style={[
                    styles.quickAmountButton,
                    amount === quickAmount && styles.selectedQuickAmountButton
                  ]}
                  onPress={() => {
                    const newValue = (quickAmount - minAmount) / (maxAmount - minAmount);
                    sliderValue.setValue(newValue);
                    setAmount(quickAmount);
                    handleChange('amount', String(quickAmount));
                  }}
                >
                  <Text style={[
                    styles.quickAmountText,
                    amount === quickAmount && styles.selectedQuickAmountText
                  ]}>
                    ₹{quickAmount.toLocaleString('en-IN')}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
          
          <View style={styles.amountInfoContainer}>
            <View style={styles.amountInfoItem}>
              <Ionicons name="information-circle-outline" size={20} color={theme.colors.primary} />
              <Text style={styles.amountInfoText}>
                {paymentFrequency === 'monthly' ? 
                  'Monthly amount starts from ₹500' : 
                  'Amount starts from ₹100'}
              </Text>
            </View>
            <View style={styles.amountInfoItem}>
              <Ionicons name="information-circle-outline" size={20} color={theme.colors.primary} />
              <Text style={styles.amountInfoText}>
                {paymentFrequency === 'monthly' ? 
                  'Increment by ₹500' : 
                  'Increment by ₹100'}
              </Text>
            </View>
            <View style={styles.amountInfoItem}>
              <Ionicons name="information-circle-outline" size={20} color={theme.colors.primary} />
              <Text style={styles.amountInfoText}>
                Maximum amount: {formatAmount(maxAmount)}
              </Text>
            </View>
          </View>
        </View>

        {errors.amount && <Text style={styles.errorText}>{errors.amount}</Text>}
      </View>
    );
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
        const minAmount = 100;
        const maxAmount = 100000;
        newErrors.amount = !value
          ? "Amount is required"
          : value < minAmount
          ? `Minimum amount should be ₹${minAmount}`
          : value > maxAmount
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

  const handleChange = (field, value) => {
    setFormData({ ...formData, [field]: value });
    validate(field, value);
  };

  const renderProgressBar = () => (
    <View style={styles.progressContainer}>
      {[1, 2, 3, 4, 5].map((num) => (
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
      <Text style={styles.sectionTitle}>Scheme Type</Text>
      <View style={styles.schemeTypeContainer}>
        <View
          style={[
            styles.schemeTypeCard,
            schemeType === 'fixed' && styles.selectedSchemeTypeCard,
          ]}
        >
          <Ionicons 
            name="calendar" 
            size={32} 
            color={schemeType === 'fixed' ? '#fff' : theme.colors.primary} 
          />
          <Text style={[
            styles.schemeTypeText,
            schemeType === 'fixed' && styles.selectedSchemeTypeText
          ]}>Fixed Amount</Text>
          <Text style={[
            styles.schemeTypeDescription,
            schemeType === 'fixed' && styles.selectedSchemeTypeDescription
          ]}>Choose from predefined monthly amounts</Text>
        </View>

        <View
          style={[
            styles.schemeTypeCard,
            schemeType === 'flexi' && styles.selectedSchemeTypeCard,
          ]}
        >
          <Ionicons 
            name="options" 
            size={32} 
            color={schemeType === 'flexi' ? '#fff' : theme.colors.primary} 
          />
          <Text style={[
            styles.schemeTypeText,
            schemeType === 'flexi' && styles.selectedSchemeTypeText
          ]}>Flexi Amount</Text>
          <Text style={[
            styles.schemeTypeDescription,
            schemeType === 'flexi' && styles.selectedSchemeTypeDescription
          ]}>Choose your own monthly amount</Text>
        </View>
      </View>
    </View>
  );

  const AmountPicker = ({ chits, formData, handleChange }) => {
    const getMinAmount = () => {
      switch (paymentFrequency) {
        case 'monthly':
          return 500;
        case 'weekly':
        case 'daily':
          return 100;
        default:
          return 100;
      }
    };

    const getMaxAmount = () => 100000;

    const getStepAmount = () => {
      switch (paymentFrequency) {
        case 'monthly':
          return 500;
        case 'weekly':
        case 'daily':
          return 100;
        default:
          return 100;
      }
    };

    const generateAmounts = () => {
      const min = getMinAmount();
      const max = getMaxAmount();
      const step = getStepAmount();
      const amounts = [];
      
      for (let amount = min; amount <= max; amount += step) {
        amounts.push({
          CHITID: amount,
          AMOUNT: amount.toString()
        });
      }
      
      return amounts;
    };

    const availableAmounts = generateAmounts();

    return (
      <View style={styles.amountPickerContainer}>
        {availableAmounts.map((amount) => {
          const isSelected = formData.amount === amount.AMOUNT;
          return (
            <TouchableOpacity
              key={amount.CHITID}
              onPress={() => handleChange("amount", amount.AMOUNT)}
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
              <Text style={styles.amountText}>₹{amount.AMOUNT}</Text>
            </TouchableOpacity>
          );
        })}
      </View>
    );
  };

  const renderStep3 = () => (
    <View style={styles.stepContainer}>
      <Text style={styles.sectionTitle}>Select Payment Frequency</Text>
      <View style={styles.frequencyContainer}>
        <TouchableOpacity
          style={[
            styles.frequencyCard,
            paymentFrequency === 'monthly' && styles.selectedFrequencyCard,
          ]}
          onPress={() => setPaymentFrequency('monthly')}
        >
          <Ionicons 
            name="calendar" 
            size={32} 
            color={paymentFrequency === 'monthly' ? '#fff' : theme.colors.primary} 
          />
          <Text style={[
            styles.frequencyText,
            paymentFrequency === 'monthly' && styles.selectedFrequencyText
          ]}>Monthly</Text>
          <Text style={[
            styles.frequencyDescription,
            paymentFrequency === 'monthly' && styles.selectedFrequencyDescription
          ]}>Pay once every month</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.frequencyCard,
            paymentFrequency === 'weekly' && styles.selectedFrequencyCard,
          ]}
          onPress={() => setPaymentFrequency('weekly')}
        >
          <Ionicons 
            name="calendar-outline" 
            size={32} 
            color={paymentFrequency === 'weekly' ? '#fff' : theme.colors.primary} 
          />
          <Text style={[
            styles.frequencyText,
            paymentFrequency === 'weekly' && styles.selectedFrequencyText
          ]}>Weekly</Text>
          <Text style={[
            styles.frequencyDescription,
            paymentFrequency === 'weekly' && styles.selectedFrequencyDescription
          ]}>Pay once every week</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.frequencyCard,
            paymentFrequency === 'daily' && styles.selectedFrequencyCard,
          ]}
          onPress={() => setPaymentFrequency('daily')}
        >
          <Ionicons 
            name="today" 
            size={32} 
            color={paymentFrequency === 'daily' ? '#fff' : theme.colors.primary} 
          />
          <Text style={[
            styles.frequencyText,
            paymentFrequency === 'daily' && styles.selectedFrequencyText
          ]}>Daily</Text>
          <Text style={[
            styles.frequencyDescription,
            paymentFrequency === 'daily' && styles.selectedFrequencyDescription
          ]}>Pay every day</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderStep4 = () => (
    <View style={styles.stepContainer}>
      <Text style={styles.sectionTitle}>Account Details</Text>
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

  const renderStep5 = () => (
    <View style={styles.stepContainer}>
      <Text style={styles.sectionTitle}>Savings Summary</Text>
      <View style={styles.summaryCard}>
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Scheme Type</Text>
          <Text style={styles.summaryValue}>{schemeType === 'fixed' ? 'Fixed Amount' : 'Flexi Amount'}</Text>
        </View>
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Amount</Text>
          <Text style={styles.summaryValue}>₹{formData.amount}</Text>
        </View>
        {schemeType === 'fixed' && (
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Payment Frequency</Text>
            <Text style={styles.summaryValue}>
              {paymentFrequency === 'monthly' ? 'Monthly' : 
               paymentFrequency === 'weekly' ? 'Weekly' : 'Daily'}
            </Text>
          </View>
        )}
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
    // Step 1: Scheme Type selection
    if (step === 1) {
      // Skip validation since scheme type is pre-selected
      setStep(2);
      return;
    }

    // Step 2: Amount selection
    if (step === 2) {
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

      // If fixed amount is selected, go to payment frequency step
      if (schemeType === 'fixed') {
        setStep(3);
      } else {
        // If flexi amount, skip to account details
        setStep(4);
      }
      return;
    }

    // Step 3: Payment Frequency (only for fixed amount)
    if (step === 3) {
      if (!paymentFrequency) {
        Alert.alert("Error", "Please select a payment frequency");
        return;
      }
      setStep(4);
      return;
    }

    // Step 4: Account details
    if (step === 4) {
      if (
        !validate("accountname", formData.accountname) ||
        !validate("associated_branch", formData.associated_branch)
      ) {
        return;
      }
      setStep(5);
      return;
    }

    // Step 5: Final submission
    if (step === 5) {
      const selectedChit = parsedData?.chit.find(
        (chit) => String(chit.AMOUNT) === formData.amount
      );

      const payload = {
        userId: user.id,
        schemeId: Number(schemeId),
        chitId: selectedChit ? selectedChit.CHITID : null,
        accountName: formData.accountname,
        associated_branch: formData.associated_branch,
        schemeType: schemeType,
        paymentFrequency: paymentFrequency,
      };

      api
        .post("/investments", payload)
        .then((data: any) => {
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
                schemeType: schemeType,
                paymentFrequency: paymentFrequency,
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
              if (step > 1) {
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
            {step === 4 && renderStep4()}
            {step === 5 && renderStep5()}
          </ScrollView>
        )}

        <View style={styles.footer}>
          <TouchableOpacity style={styles.button} onPress={handleNext}>
            <Text style={styles.buttonText}>
              {step === 5 ? translations.confirmAndJoin : translations.next}
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
  schemeTypeContainer: {
    flexDirection: 'column',
    gap: 16,
    marginTop: 16,
  },
  schemeTypeCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    borderWidth: 1,
    borderColor: '#e5e5e5',
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
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
    fontWeight: 'bold',
    marginTop: 12,
    color: theme.colors.primary,
  },
  selectedSchemeTypeText: {
    color: '#fff',
  },
  schemeTypeDescription: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginTop: 8,
  },
  selectedSchemeTypeDescription: {
    color: '#fff',
  },
  flexiAmountContainer: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 24,
    marginTop: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  amountDisplayContainer: {
    alignItems: 'center',
    marginBottom: 32,
  },
  amountValue: {
    fontSize: 36,
    fontWeight: 'bold',
    color: theme.colors.primary,
    marginBottom: 8,
  },
  amountLabel: {
    fontSize: 16,
    color: '#666',
  },
  amountGridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    padding: 8,
    marginBottom: 16,
  },
  amountGridItem: {
    width: '31%',
    aspectRatio: 2,
    backgroundColor: '#fff',
    borderRadius: 12,
    marginBottom: 12,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e5e5e5',
    padding: 8,
  },
  selectedAmountGridItem: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
  },
  amountGridText: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.primary,
    textAlign: 'center',
  },
  selectedAmountGridText: {
    color: '#fff',
  },
  amountInfoContainer: {
    marginTop: 16,
    padding: 16,
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
  },
  amountInfoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  amountInfoText: {
    marginLeft: 8,
    fontSize: 14,
    color: '#666',
  },
  frequencyContainer: {
    flexDirection: 'column',
    gap: 16,
    marginTop: 16,
  },
  frequencyCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    borderWidth: 1,
    borderColor: '#e5e5e5',
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
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
    fontWeight: 'bold',
    marginTop: 12,
    color: theme.colors.primary,
  },
  selectedFrequencyText: {
    color: '#fff',
  },
  frequencyDescription: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginTop: 8,
  },
  selectedFrequencyDescription: {
    color: '#fff',
  },
  quickAmountContainer: {
    marginBottom: 24,
  },
  quickAmountLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
    paddingHorizontal: 8,
  },
  quickAmountScroll: {
    paddingHorizontal: 8,
    gap: 8,
  },
  quickAmountButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    marginRight: 8,
  },
  selectedQuickAmountButton: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
  },
  quickAmountText: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.primary,
  },
  selectedQuickAmountText: {
    color: '#fff',
  },
  sliderContainer: {
    marginBottom: 24,
    paddingHorizontal: 8,
  },
  sliderTrack: {
    height: 40, // Increased height for better touch area
    backgroundColor: '#E5E7EB',
    borderRadius: 2,
    position: 'relative',
    justifyContent: 'center',
  },
  sliderFill: {
    height: 4,
    backgroundColor: theme.colors.primary,
    borderRadius: 2,
    position: 'absolute',
    left: 0,
  },
  sliderThumb: {
    width: 24,
    height: 24,
    backgroundColor: theme.colors.primary,
    borderRadius: 12,
    position: 'absolute',
    top: 8,
    marginLeft: -12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  sliderLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 12,
  },
  sliderLabel: {
    fontSize: 12,
    color: '#666',
    fontWeight: '500',
  },
  amountValueContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  amountInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  currencySymbol: {
    fontSize: 36,
    fontWeight: 'bold',
    color: theme.colors.primary,
  },
  amountInput: {
    fontSize: 36,
    fontWeight: 'bold',
    color: theme.colors.primary,
    textAlign: 'center',
    padding: 0,
    minWidth: 200,
  },
  editIcon: {
    marginLeft: 8,
  },
});

