import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  TextInput,
  Modal,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { customerPaymentService, type CustomerPaymentConfig } from '@/services/customerPaymentService';
import { useCustomizedPaymentSocket, BANK_CONFIGS } from '@/hooks/useCustomizedPaymentSocket';
import { theme } from '@/constants/theme';
import CustomizedPaymentWebView from './CustomizedPaymentWebView';

interface EnhancedPaymentOverviewProps {
  visible: boolean;
  onClose: () => void;
}

export default function EnhancedPaymentOverview({ visible, onClose }: EnhancedPaymentOverviewProps) {
  const params = useLocalSearchParams();
  const router = useRouter();
  
  // State management
  const [customerConfig, setCustomerConfig] = useState<CustomerPaymentConfig | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [validationResult, setValidationResult] = useState<{
    isValid: boolean;
    errors: string[];
    warnings: string[];
  } | null>(null);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<string>('');
  const [amount, setAmount] = useState(parseFloat(params.amount as string) || 0);
  const [showPaymentWebView, setShowPaymentWebView] = useState(false);
  const [paymentAnalytics, setPaymentAnalytics] = useState<any>(null);
  const [successProbability, setSuccessProbability] = useState<number>(0);

  // Extract customer ID from params
  const customerId = params.customerId as string || 'default_customer';

  // Load customer configuration on mount
  useEffect(() => {
    loadCustomerConfiguration();
  }, [customerId]);

  const loadCustomerConfiguration = async () => {
    try {
      setIsLoading(true);
      
      // Load customer payment configuration
      const config = await customerPaymentService.getCustomerConfig(customerId);
      if (config) {
        setCustomerConfig(config);
        
        // Set default payment method
        const recommendedMethod = customerPaymentService.getRecommendedPaymentMethod(config, amount);
        setSelectedPaymentMethod(recommendedMethod);
        
        // Calculate success probability
        const probability = customerPaymentService.getPaymentSuccessProbability(config, amount);
        setSuccessProbability(probability);
        
        // Load payment analytics
        const analytics = await customerPaymentService.getCustomerPaymentAnalytics(customerId);
        setPaymentAnalytics(analytics);
        
        // Validate payment request
        const validation = customerPaymentService.validatePaymentRequest(config, amount, recommendedMethod);
        setValidationResult(validation);
      } else {
        Alert.alert('Error', 'Unable to load customer configuration');
      }
    } catch (error) {
      console.error('Error loading customer configuration:', error);
      Alert.alert('Error', 'Failed to load customer configuration');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAmountChange = (newAmount: string) => {
    const numAmount = parseFloat(newAmount) || 0;
    setAmount(numAmount);
    
    if (customerConfig) {
      // Recalculate success probability
      const probability = customerPaymentService.getPaymentSuccessProbability(customerConfig, numAmount);
      setSuccessProbability(probability);
      
      // Revalidate payment request
      const validation = customerPaymentService.validatePaymentRequest(customerConfig, numAmount, selectedPaymentMethod);
      setValidationResult(validation);
    }
  };

  const handlePaymentMethodChange = (method: string) => {
    setSelectedPaymentMethod(method);
    
    if (customerConfig) {
      // Revalidate payment request
      const validation = customerPaymentService.validatePaymentRequest(customerConfig, amount, method);
      setValidationResult(validation);
    }
  };

  const handleProceedToPayment = async () => {
    if (!customerConfig || !validationResult?.isValid) {
      Alert.alert('Validation Error', 'Please fix the validation errors before proceeding');
      return;
    }

    try {
      // Record payment attempt
      await customerPaymentService.recordPaymentAttempt(
        customerId,
        amount,
        selectedPaymentMethod,
        'pending'
      );

      // Get optimized bank configuration
      const optimizedBankConfig = customerPaymentService.getOptimizedBankConfig(customerConfig);

      // Prepare payment parameters
      const paymentParams = {
        url: params.paymentUrl as string,
        orderId: params.orderId as string,
        amount: amount.toString(),
        currency: params.currency as string || 'INR',
        customerId: customerConfig.customerId,
        customerName: customerConfig.customerName,
        bankName: customerConfig.bankDetails.bankName,
        accountNumber: customerConfig.bankDetails.accountNumber,
        ifscCode: customerConfig.bankDetails.ifscCode,
        accountType: customerConfig.bankDetails.accountType,
        paymentMethod: selectedPaymentMethod,
        autoRetry: customerConfig.paymentPreferences.autoRetry.toString(),
        notificationPreferences: customerConfig.paymentPreferences.notificationPreferences,
        customFields: JSON.stringify(customerConfig.customFields || {})
      };

      // Navigate to customized payment webview
      router.push({
        pathname: "/(tabs)/home/CustomizedPaymentWebView",
        params: paymentParams
      });

      setShowPaymentWebView(true);
    } catch (error) {
      console.error('Error proceeding to payment:', error);
      Alert.alert('Error', 'Failed to initiate payment. Please try again.');
    }
  };

  const getBankColor = (bankName: string): string => {
    switch (bankName) {
      case 'HDFC': return '#00457C';
      case 'ICICI': return '#FF6B35';
      case 'SBI': return '#1E3A8A';
      case 'AXIS': return '#DC2626';
      case 'KOTAK': return '#059669';
      default: return '#00457C';
    }
  };

  const getSuccessProbabilityColor = (probability: number): string => {
    if (probability >= 90) return '#4CAF50';
    if (probability >= 70) return '#FF9800';
    return '#F44336';
  };

  if (isLoading) {
    return (
      <Modal visible={visible} animationType="slide" presentationStyle="fullScreen">
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text style={styles.loadingText}>Loading customer payment configuration...</Text>
        </View>
      </Modal>
    );
  }

  if (!customerConfig) {
    return (
      <Modal visible={visible} animationType="slide" presentationStyle="fullScreen">
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Unable to load customer configuration</Text>
          <TouchableOpacity style={styles.retryButton} onPress={loadCustomerConfiguration}>
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      </Modal>
    );
  }

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="fullScreen">
      <View style={styles.container}>
        {/* Header */}
        <View style={[styles.header, { backgroundColor: getBankColor(customerConfig.bankDetails.bankName) }]}>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Text style={styles.closeButtonText}>✕</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Payment Overview</Text>
          <View style={styles.headerSpacer} />
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* Customer Information */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Customer Information</Text>
            <View style={styles.customerCard}>
              <Text style={styles.customerName}>{customerConfig.customerName}</Text>
              <Text style={styles.customerId}>ID: {customerConfig.customerId}</Text>
              <View style={styles.bankInfo}>
                <Text style={styles.bankName}>{customerConfig.bankDetails.bankName}</Text>
                <Text style={styles.accountInfo}>
                  A/C: {customerConfig.bankDetails.accountNumber} | IFSC: {customerConfig.bankDetails.ifscCode}
                </Text>
              </View>
            </View>
          </View>

          {/* Payment Amount */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Payment Amount</Text>
            <View style={styles.amountContainer}>
              <Text style={styles.currencySymbol}>₹</Text>
              <TextInput
                style={styles.amountInput}
                value={amount.toString()}
                onChangeText={handleAmountChange}
                keyboardType="numeric"
                placeholder="Enter amount"
                placeholderTextColor="#999"
              />
            </View>
          </View>

          {/* Payment Method Selection */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Payment Method</Text>
            <View style={styles.paymentMethodsContainer}>
              {['netbanking', 'upi', 'card', 'wallet'].map((method) => (
                <TouchableOpacity
                  key={method}
                  style={[
                    styles.paymentMethodButton,
                    selectedPaymentMethod === method && styles.selectedPaymentMethod
                  ]}
                  onPress={() => handlePaymentMethodChange(method)}
                >
                  <Text style={[
                    styles.paymentMethodText,
                    selectedPaymentMethod === method && styles.selectedPaymentMethodText
                  ]}>
                    {method.toUpperCase()}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Payment Analytics */}
          {paymentAnalytics && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Payment Analytics</Text>
              <View style={styles.analyticsContainer}>
                <View style={styles.analyticsItem}>
                  <Text style={styles.analyticsLabel}>Total Payments</Text>
                  <Text style={styles.analyticsValue}>{paymentAnalytics.totalPayments}</Text>
                </View>
                <View style={styles.analyticsItem}>
                  <Text style={styles.analyticsLabel}>Success Rate</Text>
                  <Text style={styles.analyticsValue}>{paymentAnalytics.successRate.toFixed(1)}%</Text>
                </View>
                <View style={styles.analyticsItem}>
                  <Text style={styles.analyticsLabel}>Avg Amount</Text>
                  <Text style={styles.analyticsValue}>₹{paymentAnalytics.averageAmount.toFixed(0)}</Text>
                </View>
                <View style={styles.analyticsItem}>
                  <Text style={styles.analyticsLabel}>Risk Score</Text>
                  <Text style={styles.analyticsValue}>{paymentAnalytics.riskScore}</Text>
                </View>
              </View>
            </View>
          )}

          {/* Success Probability */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Payment Success Probability</Text>
            <View style={styles.probabilityContainer}>
              <View style={styles.probabilityBar}>
                <View 
                  style={[
                    styles.probabilityFill, 
                    { 
                      width: `${successProbability}%`,
                      backgroundColor: getSuccessProbabilityColor(successProbability)
                    }
                  ]} 
                />
              </View>
              <Text style={styles.probabilityText}>{successProbability.toFixed(1)}%</Text>
            </View>
          </View>

          {/* Validation Results */}
          {validationResult && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Validation</Text>
              
              {validationResult.errors.length > 0 && (
                <View style={styles.errorContainer}>
                  <Text style={styles.errorTitle}>Errors:</Text>
                  {validationResult.errors.map((error, index) => (
                    <Text key={index} style={styles.errorText}>• {error}</Text>
                  ))}
                </View>
              )}
              
              {validationResult.warnings.length > 0 && (
                <View style={styles.warningContainer}>
                  <Text style={styles.warningTitle}>Warnings:</Text>
                  {validationResult.warnings.map((warning, index) => (
                    <Text key={index} style={styles.warningText}>• {warning}</Text>
                  ))}
                </View>
              )}
              
              {validationResult.isValid && validationResult.errors.length === 0 && (
                <View style={styles.successContainer}>
                  <Text style={styles.successText}>✓ Payment request is valid</Text>
                </View>
              )}
            </View>
          )}

          {/* Customer Preferences */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Customer Preferences</Text>
            <View style={styles.preferencesContainer}>
              <View style={styles.preferenceItem}>
                <Text style={styles.preferenceLabel}>Auto Retry:</Text>
                <Text style={styles.preferenceValue}>
                  {customerConfig.paymentPreferences.autoRetry ? 'Enabled' : 'Disabled'}
                </Text>
              </View>
              <View style={styles.preferenceItem}>
                <Text style={styles.preferenceLabel}>Notifications:</Text>
                <Text style={styles.preferenceValue}>
                  {customerConfig.paymentPreferences.notificationPreferences}
                </Text>
              </View>
              <View style={styles.preferenceItem}>
                <Text style={styles.preferenceLabel}>KYC Status:</Text>
                <Text style={styles.preferenceValue}>
                  {customerConfig.kycStatus.toUpperCase()}
                </Text>
              </View>
              <View style={styles.preferenceItem}>
                <Text style={styles.preferenceLabel}>Risk Level:</Text>
                <Text style={styles.preferenceValue}>
                  {customerConfig.riskLevel.toUpperCase()}
                </Text>
              </View>
            </View>
          </View>
        </ScrollView>

        {/* Footer */}
        <View style={styles.footer}>
          <TouchableOpacity 
            style={[
              styles.proceedButton,
              !validationResult?.isValid && styles.disabledButton
            ]}
            onPress={handleProceedToPayment}
            disabled={!validationResult?.isValid}
          >
            <Text style={styles.proceedButtonText}>
              Proceed to {customerConfig.bankDetails.bankName} Payment
            </Text>
          </TouchableOpacity>
        </View>

        {/* Customized Payment WebView */}
        <CustomizedPaymentWebView
          visible={showPaymentWebView}
          onClose={() => setShowPaymentWebView(false)}
        />
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 20,
  },
  errorText: {
    fontSize: 16,
    color: '#f44336',
    textAlign: 'center',
    marginBottom: 20,
  },
  retryButton: {
    backgroundColor: theme.colors.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 50,
    paddingBottom: 16,
  },
  closeButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButtonText: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
  },
  headerTitle: {
    flex: 1,
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  headerSpacer: {
    width: 40,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
  },
  customerCard: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  customerName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  customerId: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  bankInfo: {
    marginTop: 8,
  },
  bankName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: theme.colors.primary,
    marginBottom: 4,
  },
  accountInfo: {
    fontSize: 12,
    color: '#666',
  },
  amountContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  currencySymbol: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginRight: 8,
  },
  amountInput: {
    flex: 1,
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  paymentMethodsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  paymentMethodButton: {
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
    minWidth: 80,
    alignItems: 'center',
  },
  selectedPaymentMethod: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
  },
  paymentMethodText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
  },
  selectedPaymentMethodText: {
    color: '#fff',
  },
  analyticsContainer: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  analyticsItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  analyticsLabel: {
    fontSize: 14,
    color: '#666',
  },
  analyticsValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  probabilityContainer: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  probabilityBar: {
    height: 8,
    backgroundColor: '#f0f0f0',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 8,
  },
  probabilityFill: {
    height: '100%',
    borderRadius: 4,
  },
  probabilityText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
  },
  errorContainer: {
    backgroundColor: '#ffebee',
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
  },
  errorTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#d32f2f',
    marginBottom: 4,
  },
  warningContainer: {
    backgroundColor: '#fff3e0',
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
  },
  warningTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#f57c00',
    marginBottom: 4,
  },
  warningText: {
    fontSize: 12,
    color: '#f57c00',
    marginBottom: 2,
  },
  successContainer: {
    backgroundColor: '#e8f5e8',
    borderRadius: 8,
    padding: 12,
  },
  successText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#2e7d32',
  },
  preferencesContainer: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  preferenceItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  preferenceLabel: {
    fontSize: 14,
    color: '#666',
  },
  preferenceValue: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
  },
  footer: {
    padding: 16,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  proceedButton: {
    backgroundColor: theme.colors.primary,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  disabledButton: {
    backgroundColor: '#ccc',
  },
  proceedButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
}); 