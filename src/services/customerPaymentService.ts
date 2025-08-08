import { BANK_CONFIGS, type BankConfig, type CustomerPaymentData } from '@/hooks/useCustomizedPaymentSocket';
import api from './api';

// Customer payment configuration interface
export interface CustomerPaymentConfig {
  customerId: string;
  customerName: string;
  bankDetails: {
    bankName: string;
    accountNumber: string;
    ifscCode: string;
    accountType: 'savings' | 'current' | 'business';
    branchCode?: string;
    micrCode?: string;
  };
  paymentPreferences: {
    preferredPaymentMethod: 'upi' | 'netbanking' | 'card' | 'wallet';
    autoRetry: boolean;
    notificationPreferences: 'sms' | 'email' | 'push' | 'all';
    preferredUPIApps?: string[];
    preferredCards?: string[];
  };
  securitySettings: {
    requireOTP: boolean;
    requireMPIN: boolean;
    requireBiometric: boolean;
    maxTransactionLimit: number;
    dailyTransactionLimit: number;
  };
  customFields?: Record<string, any>;
  kycStatus: 'pending' | 'verified' | 'rejected';
  riskLevel: 'low' | 'medium' | 'high';
  lastPaymentDate?: string;
  paymentHistory?: Array<{
    date: string;
    amount: number;
    status: 'success' | 'failed' | 'pending';
    bankName: string;
    transactionId: string;
  }>;
}

// Bank-specific payment validation rules
export interface BankValidationRules {
  bankCode: string;
  minAmount: number;
  maxAmount: number;
  supportedPaymentMethods: string[];
  requiredFields: string[];
  otpRequired: boolean;
  securePayEnabled: boolean;
  processingTime: number; // in minutes
  failureRate: number; // percentage
  retryPolicy: {
    maxAttempts: number;
    delayBetweenAttempts: number;
    exponentialBackoff: boolean;
  };
}

// Customer payment service class
export class CustomerPaymentService {
  private static instance: CustomerPaymentService;
  private customerConfigs: Map<string, CustomerPaymentConfig> = new Map();
  private bankValidationRules: Map<string, BankValidationRules> = new Map();

  private constructor() {
    this.initializeBankValidationRules();
  }

  public static getInstance(): CustomerPaymentService {
    if (!CustomerPaymentService.instance) {
      CustomerPaymentService.instance = new CustomerPaymentService();
    }
    return CustomerPaymentService.instance;
  }

  // Initialize bank-specific validation rules
  private initializeBankValidationRules(): void {
    const rules: BankValidationRules[] = [
      {
        bankCode: 'HDFC',
        minAmount: 1,
        maxAmount: 1000000,
        supportedPaymentMethods: ['netbanking', 'upi', 'card'],
        requiredFields: ['accountNumber', 'ifscCode', 'customerName'],
        otpRequired: true,
        securePayEnabled: true,
        processingTime: 5,
        failureRate: 2.5,
        retryPolicy: {
          maxAttempts: 3,
          delayBetweenAttempts: 2000,
          exponentialBackoff: true
        }
      },
      {
        bankCode: 'ICICI',
        minAmount: 1,
        maxAmount: 500000,
        supportedPaymentMethods: ['netbanking', 'upi', 'card'],
        requiredFields: ['accountNumber', 'ifscCode', 'customerName'],
        otpRequired: true,
        securePayEnabled: true,
        processingTime: 4,
        failureRate: 3.0,
        retryPolicy: {
          maxAttempts: 2,
          delayBetweenAttempts: 3000,
          exponentialBackoff: false
        }
      },
      {
        bankCode: 'SBI',
        minAmount: 1,
        maxAmount: 2000000,
        supportedPaymentMethods: ['netbanking', 'upi', 'card'],
        requiredFields: ['accountNumber', 'ifscCode', 'customerName'],
        otpRequired: true,
        securePayEnabled: true,
        processingTime: 6,
        failureRate: 4.0,
        retryPolicy: {
          maxAttempts: 4,
          delayBetweenAttempts: 1500,
          exponentialBackoff: true
        }
      },
      {
        bankCode: 'AXIS',
        minAmount: 1,
        maxAmount: 750000,
        supportedPaymentMethods: ['netbanking', 'upi', 'card'],
        requiredFields: ['accountNumber', 'ifscCode', 'customerName'],
        otpRequired: true,
        securePayEnabled: true,
        processingTime: 5,
        failureRate: 2.8,
        retryPolicy: {
          maxAttempts: 3,
          delayBetweenAttempts: 2500,
          exponentialBackoff: true
        }
      },
      {
        bankCode: 'KOTAK',
        minAmount: 1,
        maxAmount: 300000,
        supportedPaymentMethods: ['netbanking', 'upi', 'card'],
        requiredFields: ['accountNumber', 'ifscCode', 'customerName'],
        otpRequired: false,
        securePayEnabled: false,
        processingTime: 4,
        failureRate: 3.5,
        retryPolicy: {
          maxAttempts: 2,
          delayBetweenAttempts: 2000,
          exponentialBackoff: false
        }
      }
    ];

    rules.forEach(rule => {
      this.bankValidationRules.set(rule.bankCode, rule);
    });
  }

  // Get customer payment configuration
  async getCustomerConfig(customerId: string): Promise<CustomerPaymentConfig | null> {
    // Check cache first
    if (this.customerConfigs.has(customerId)) {
      return this.customerConfigs.get(customerId)!;
    }

    try {
      // Fetch from API
      const response = await api.get(`/customers/${customerId}/payment-config`);
      const config: CustomerPaymentConfig = response.data;
      
      // Cache the configuration
      this.customerConfigs.set(customerId, config);
      
      return config;
    } catch (error) {
      console.error('Error fetching customer payment config:', error);
      return null;
    }
  }

  // Update customer payment configuration
  async updateCustomerConfig(customerId: string, config: Partial<CustomerPaymentConfig>): Promise<boolean> {
    try {
      const response = await api.put(`/customers/${customerId}/payment-config`, config);
      
      // Update cache
      const existingConfig = this.customerConfigs.get(customerId);
      if (existingConfig) {
        this.customerConfigs.set(customerId, { ...existingConfig, ...config });
      }
      
      return response.status === 200;
    } catch (error) {
      console.error('Error updating customer payment config:', error);
      return false;
    }
  }

  // Validate payment request for customer
  validatePaymentRequest(
    customerConfig: CustomerPaymentConfig,
    amount: number,
    paymentMethod: string
  ): { isValid: boolean; errors: string[]; warnings: string[] } {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Get bank validation rules
    const bankRules = this.bankValidationRules.get(customerConfig.bankDetails.bankName);
    if (!bankRules) {
      errors.push(`Bank ${customerConfig.bankDetails.bankName} is not supported`);
      return { isValid: false, errors, warnings };
    }

    // Validate amount
    if (amount < bankRules.minAmount) {
      errors.push(`Minimum amount for ${customerConfig.bankDetails.bankName} is ₹${bankRules.minAmount}`);
    }
    if (amount > bankRules.maxAmount) {
      errors.push(`Maximum amount for ${customerConfig.bankDetails.bankName} is ₹${bankRules.maxAmount}`);
    }

    // Validate payment method
    if (!bankRules.supportedPaymentMethods.includes(paymentMethod)) {
      errors.push(`Payment method ${paymentMethod} is not supported by ${customerConfig.bankDetails.bankName}`);
    }

    // Validate required fields
    bankRules.requiredFields.forEach(field => {
      if (!customerConfig.bankDetails[field as keyof typeof customerConfig.bankDetails]) {
        errors.push(`Required field ${field} is missing`);
      }
    });

    // Check KYC status
    if (customerConfig.kycStatus !== 'verified') {
      errors.push('KYC verification is required for payments');
    }

    // Check transaction limits
    if (amount > customerConfig.securitySettings.maxTransactionLimit) {
      errors.push(`Amount exceeds maximum transaction limit of ₹${customerConfig.securitySettings.maxTransactionLimit}`);
    }

    // Check daily limit
    const today = new Date().toDateString();
    const todayPayments = customerConfig.paymentHistory?.filter(payment => 
      new Date(payment.date).toDateString() === today && payment.status === 'success'
    ) || [];
    
    const todayTotal = todayPayments.reduce((sum, payment) => sum + payment.amount, 0);
    if (todayTotal + amount > customerConfig.securitySettings.dailyTransactionLimit) {
      errors.push(`Amount would exceed daily transaction limit of ₹${customerConfig.securitySettings.dailyTransactionLimit}`);
    }

    // Risk level warnings
    if (customerConfig.riskLevel === 'high') {
      warnings.push('High-risk customer: Additional verification may be required');
    }

    // Payment method preference warning
    if (paymentMethod !== customerConfig.paymentPreferences.preferredPaymentMethod) {
      warnings.push(`Consider using ${customerConfig.paymentPreferences.preferredPaymentMethod} for better success rate`);
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }

  // Get optimized bank configuration for customer
  getOptimizedBankConfig(customerConfig: CustomerPaymentConfig): BankConfig {
    const baseConfig = BANK_CONFIGS[customerConfig.bankDetails.bankName] || BANK_CONFIGS['HDFC'];
    const bankRules = this.bankValidationRules.get(customerConfig.bankDetails.bankName);

    if (!bankRules) {
      return baseConfig;
    }

    // Customize configuration based on customer preferences and risk level
    const optimizedConfig: BankConfig = {
      ...baseConfig,
      paymentTimeout: bankRules.processingTime * 60 * 1000, // Convert to milliseconds
      retryAttempts: customerConfig.paymentPreferences.autoRetry ? bankRules.retryPolicy.maxAttempts : 1,
      customHeaders: {
        ...baseConfig.customHeaders,
        'X-Customer-Risk-Level': customerConfig.riskLevel,
        'X-Customer-KYC-Status': customerConfig.kycStatus,
        'X-Preferred-Payment-Method': customerConfig.paymentPreferences.preferredPaymentMethod
      }
    };

    // Add customer-specific custom events
    if (customerConfig.securitySettings.requireOTP) {
      optimizedConfig.customEvents.push(`${customerConfig.bankDetails.bankName.toLowerCase()}_otp_required`);
    }
    if (customerConfig.securitySettings.requireBiometric) {
      optimizedConfig.customEvents.push(`${customerConfig.bankDetails.bankName.toLowerCase()}_biometric_required`);
    }

    return optimizedConfig;
  }

  // Get payment success probability for customer
  getPaymentSuccessProbability(customerConfig: CustomerPaymentConfig, amount: number): number {
    const bankRules = this.bankValidationRules.get(customerConfig.bankDetails.bankName);
    if (!bankRules) return 0;

    let probability = 100 - bankRules.failureRate;

    // Adjust based on customer risk level
    switch (customerConfig.riskLevel) {
      case 'high':
        probability -= 10;
        break;
      case 'medium':
        probability -= 5;
        break;
      case 'low':
        probability += 5;
        break;
    }

    // Adjust based on payment method preference
    if (customerConfig.paymentPreferences.preferredPaymentMethod === 'netbanking') {
      probability += 3;
    } else if (customerConfig.paymentPreferences.preferredPaymentMethod === 'upi') {
      probability += 2;
    }

    // Adjust based on amount
    if (amount > 100000) {
      probability -= 5;
    } else if (amount < 1000) {
      probability += 3;
    }

    // Adjust based on payment history
    const recentPayments = customerConfig.paymentHistory?.filter(payment => 
      new Date(payment.date) > new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) // Last 30 days
    ) || [];

    if (recentPayments.length > 0) {
      const successRate = recentPayments.filter(p => p.status === 'success').length / recentPayments.length;
      probability = probability * 0.7 + (successRate * 100) * 0.3;
    }

    return Math.max(0, Math.min(100, probability));
  }

  // Get recommended payment method for customer
  getRecommendedPaymentMethod(customerConfig: CustomerPaymentConfig, amount: number): string {
    const bankRules = this.bankValidationRules.get(customerConfig.bankDetails.bankName);
    if (!bankRules) return 'netbanking';

    // Check if preferred method is supported
    if (bankRules.supportedPaymentMethods.includes(customerConfig.paymentPreferences.preferredPaymentMethod)) {
      return customerConfig.paymentPreferences.preferredPaymentMethod;
    }

    // Return first supported method
    return bankRules.supportedPaymentMethods[0];
  }

  // Record payment attempt
  async recordPaymentAttempt(
    customerId: string,
    amount: number,
    paymentMethod: string,
    status: 'success' | 'failed' | 'pending',
    transactionId?: string
  ): Promise<void> {
    try {
      await api.post(`/customers/${customerId}/payment-attempts`, {
        amount,
        paymentMethod,
        status,
        transactionId,
        timestamp: new Date().toISOString()
      });

      // Update local cache
      const config = this.customerConfigs.get(customerId);
      if (config) {
        config.paymentHistory = config.paymentHistory || [];
        config.paymentHistory.push({
          date: new Date().toISOString(),
          amount,
          status,
          bankName: config.bankDetails.bankName,
          transactionId: transactionId || 'N/A'
        });
        config.lastPaymentDate = new Date().toISOString();
      }
    } catch (error) {
      console.error('Error recording payment attempt:', error);
    }
  }

  // Get customer payment analytics
  async getCustomerPaymentAnalytics(customerId: string): Promise<{
    totalPayments: number;
    successRate: number;
    averageAmount: number;
    preferredMethod: string;
    riskScore: number;
    lastPaymentDate?: string;
  }> {
    try {
      const response = await api.get(`/customers/${customerId}/payment-analytics`);
      return response.data;
    } catch (error) {
      console.error('Error fetching customer payment analytics:', error);
      return {
        totalPayments: 0,
        successRate: 0,
        averageAmount: 0,
        preferredMethod: 'netbanking',
        riskScore: 0
      };
    }
  }

  // Clear customer cache
  clearCustomerCache(customerId?: string): void {
    if (customerId) {
      this.customerConfigs.delete(customerId);
    } else {
      this.customerConfigs.clear();
    }
  }
}

// Export singleton instance
export const customerPaymentService = CustomerPaymentService.getInstance(); 