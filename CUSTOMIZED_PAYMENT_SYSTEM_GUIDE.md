# Customized Payment System Guide

## 🏦 Overview

This guide explains the implementation of a **customized payment system** with **bank-specific socket hooks** for different customers. The system handles different banks (HDFC, ICICI, SBI, Axis, Kotak) with customized payment flows, validation rules, and socket event handling.

---

## 🏗️ Architecture

### Core Components

```
📁 Customized Payment System
├── 🎣 useCustomizedPaymentSocket.ts     # Bank-specific socket hooks
├── 🖥️ CustomizedPaymentWebView.tsx      # Enhanced payment webview
├── 📊 EnhancedPaymentOverview.tsx       # Payment overview with analytics
├── 🔧 customerPaymentService.ts         # Customer payment management
└── 📚 CUSTOMIZED_PAYMENT_SYSTEM_GUIDE.md # This guide
```

### Data Flow

```
Customer Request → EnhancedPaymentOverview → CustomerPaymentService → 
useCustomizedPaymentSocket → CustomizedPaymentWebView → Bank-Specific Processing
```

---

## 🎯 Key Features

### 1. **Bank-Specific Socket Hooks**
- Separate socket configurations for each bank
- Custom event handling per bank
- Bank-specific retry strategies
- Optimized timeout settings

### 2. **Customer-Centric Configuration**
- Individual customer payment preferences
- Risk-based payment validation
- Payment history analytics
- Success probability calculation

### 3. **Enhanced Security**
- Bank-specific validation rules
- KYC status verification
- Transaction limit enforcement
- Risk level assessment

### 4. **Real-time Analytics**
- Payment success probability
- Customer payment history
- Bank performance metrics
- Risk scoring

---

## 🏦 Supported Banks

| Bank | Code | Timeout | Retry Attempts | Special Features |
|------|------|---------|----------------|------------------|
| **HDFC** | HDFC | 5 min | 3 | OTP Required, Direct Integration |
| **ICICI** | ICICI | 4 min | 2 | SecurePay, Fast Processing |
| **SBI** | SBI | 6 min | 4 | High Limits, OTP Verification |
| **Axis** | AXIS | 5 min | 3 | SecurePay, Medium Limits |
| **Kotak** | KOTAK | 4 min | 2 | Basic Integration |

---

## 🚀 Implementation Guide

### Step 1: Setup Customer Configuration

```typescript
// Example customer configuration
const customerConfig: CustomerPaymentConfig = {
  customerId: "CUST_001",
  customerName: "John Doe",
  bankDetails: {
    bankName: "HDFC",
    accountNumber: "1234567890",
    ifscCode: "HDFC0001234",
    accountType: "savings"
  },
  paymentPreferences: {
    preferredPaymentMethod: "netbanking",
    autoRetry: true,
    notificationPreferences: "all"
  },
  securitySettings: {
    requireOTP: true,
    requireMPIN: false,
    requireBiometric: false,
    maxTransactionLimit: 100000,
    dailyTransactionLimit: 500000
  },
  kycStatus: "verified",
  riskLevel: "low"
};
```

### Step 2: Initialize Customized Payment Socket

```typescript
import { useCustomizedPaymentSocket, BANK_CONFIGS } from '@/hooks/useCustomizedPaymentSocket';

const {
  socket,
  handleCancel,
  retryPayment,
  isConnected,
  bankConfig,
  customerData,
  retryCount
} = useCustomizedPaymentSocket({
  bankConfig: BANK_CONFIGS['HDFC'],
  customerData: customerConfig,
  orderId: "ORDER_123",
  amount: 5000,
  currency: "INR",
  onPaymentSuccess: (data) => {
    console.log('Payment successful:', data);
    // Handle success
  },
  onPaymentFailure: (data) => {
    console.log('Payment failed:', data);
    // Handle failure
  },
  onPaymentError: (error) => {
    console.error('Payment error:', error);
    // Handle error
  },
  onBankSpecificEvent: (eventName, data) => {
    console.log('Bank specific event:', eventName, data);
    // Handle bank-specific events
  },
  retryStrategy: 'exponential'
});
```

### Step 3: Use Enhanced Payment Overview

```typescript
import EnhancedPaymentOverview from './EnhancedPaymentOverview';

// In your component
const [showPaymentOverview, setShowPaymentOverview] = useState(false);

<EnhancedPaymentOverview
  visible={showPaymentOverview}
  onClose={() => setShowPaymentOverview(false)}
/>
```

### Step 4: Navigate to Customized Payment WebView

```typescript
// Navigate with customer-specific parameters
router.push({
  pathname: "/(tabs)/home/CustomizedPaymentWebView",
  params: {
    url: paymentUrl,
    orderId: orderId,
    amount: amount.toString(),
    customerId: customerConfig.customerId,
    customerName: customerConfig.customerName,
    bankName: customerConfig.bankDetails.bankName,
    accountNumber: customerConfig.bankDetails.accountNumber,
    ifscCode: customerConfig.bankDetails.ifscCode,
    paymentMethod: selectedPaymentMethod,
    autoRetry: customerConfig.paymentPreferences.autoRetry.toString(),
    notificationPreferences: customerConfig.paymentPreferences.notificationPreferences
  }
});
```

---

## 🔧 Bank-Specific Configurations

### HDFC Bank Configuration

```typescript
const hdfcConfig = {
  bankName: 'HDFC Bank',
  bankCode: 'HDFC',
  paymentTimeout: 300000, // 5 minutes
  retryAttempts: 3,
  customEvents: ['hdfc_payment_status', 'hdfc_otp_required', 'hdfc_verification_needed'],
  webhookEndpoints: ['/hdfc/webhook', '/hdfc/callback'],
  successPatterns: ['SUCCESS', 'COMPLETED', 'CHARGED'],
  failurePatterns: ['FAILED', 'DECLINED', 'CANCELLED'],
  customHeaders: {
    'X-Bank-Code': 'HDFC',
    'X-Integration-Type': 'direct'
  }
};
```

### ICICI Bank Configuration

```typescript
const iciciConfig = {
  bankName: 'ICICI Bank',
  bankCode: 'ICICI',
  paymentTimeout: 240000, // 4 minutes
  retryAttempts: 2,
  customEvents: ['icici_payment_update', 'icici_secure_pay', 'icici_verification'],
  webhookEndpoints: ['/icici/webhook', '/icici/status'],
  successPatterns: ['SUCCESS', 'APPROVED', 'COMPLETED'],
  failurePatterns: ['FAILED', 'REJECTED', 'TIMEOUT'],
  customHeaders: {
    'X-Bank-Code': 'ICICI',
    'X-Secure-Pay': 'enabled'
  }
};
```

---

## 📊 Customer Payment Analytics

### Analytics Features

1. **Payment History Tracking**
   - Total payments made
   - Success/failure rates
   - Average payment amounts
   - Preferred payment methods

2. **Risk Assessment**
   - Customer risk scoring
   - Transaction pattern analysis
   - Fraud detection indicators

3. **Success Probability**
   - Real-time success rate calculation
   - Bank-specific performance metrics
   - Customer behavior analysis

### Example Analytics Response

```typescript
{
  totalPayments: 25,
  successRate: 92.0,
  averageAmount: 15000,
  preferredMethod: "netbanking",
  riskScore: 15,
  lastPaymentDate: "2024-01-15T10:30:00Z"
}
```

---

## 🔐 Security & Validation

### Validation Rules

```typescript
// Bank-specific validation rules
const validationRules = {
  HDFC: {
    minAmount: 1,
    maxAmount: 1000000,
    supportedPaymentMethods: ['netbanking', 'upi', 'card'],
    requiredFields: ['accountNumber', 'ifscCode', 'customerName'],
    otpRequired: true,
    securePayEnabled: true,
    processingTime: 5,
    failureRate: 2.5
  }
};
```

### Security Features

1. **KYC Verification**
   - Status checking before payment
   - Document verification
   - Risk level assessment

2. **Transaction Limits**
   - Per-transaction limits
   - Daily transaction limits
   - Customer-specific limits

3. **Fraud Prevention**
   - Payment pattern analysis
   - Suspicious activity detection
   - Real-time risk scoring

---

## 🎨 UI Components

### Enhanced Payment Overview

The `EnhancedPaymentOverview` component provides:

- **Customer Information Display**
  - Customer details
  - Bank account information
  - KYC status

- **Payment Configuration**
  - Amount input with validation
  - Payment method selection
  - Auto-retry preferences

- **Analytics Dashboard**
  - Payment success probability
  - Historical payment data
  - Risk assessment

- **Validation Results**
  - Real-time validation
  - Error and warning display
  - Success confirmation

### Customized Payment WebView

The `CustomizedPaymentWebView` component features:

- **Bank-Specific Styling**
  - Bank colors and branding
  - Custom headers and footers
  - Brand-specific UI elements

- **Real-time Status**
  - Connection status indicator
  - Payment progress tracking
  - Retry attempt counter

- **Enhanced Error Handling**
  - Bank-specific error messages
  - Retry mechanisms
  - Fallback options

---

## 🔄 Socket Event Handling

### Bank-Specific Events

```typescript
// HDFC Events
socket.on('hdfc_payment_status', (data) => {
  // Handle HDFC payment status updates
});

socket.on('hdfc_otp_required', (data) => {
  // Handle HDFC OTP requirement
  Alert.alert('HDFC OTP Required', 'Please enter the OTP sent to your mobile');
});

// ICICI Events
socket.on('icici_secure_pay', (data) => {
  // Handle ICICI SecurePay verification
  Alert.alert('ICICI SecurePay', 'Please complete secure payment verification');
});

// SBI Events
socket.on('sbi_otp_verification', (data) => {
  // Handle SBI OTP verification
  Alert.alert('SBI OTP Verification', 'Please enter the OTP sent to your mobile');
});
```

### Generic Payment Events

```typescript
socket.on('payment_status_update', (data) => {
  // Handle payment status updates for all banks
  const isSuccess = data?.status === "success" || 
                   data?.paymentResponse?.status === "CHARGED";
  
  if (isSuccess) {
    // Handle success
  } else {
    // Handle failure
  }
});
```

---

## 📱 Usage Examples

### Example 1: Basic Payment Flow

```typescript
// 1. Load customer configuration
const customerConfig = await customerPaymentService.getCustomerConfig(customerId);

// 2. Validate payment request
const validation = customerPaymentService.validatePaymentRequest(
  customerConfig,
  amount,
  paymentMethod
);

// 3. Check if valid
if (validation.isValid) {
  // 4. Proceed to payment
  router.push({
    pathname: "/(tabs)/home/CustomizedPaymentWebView",
    params: {
      customerId: customerConfig.customerId,
      bankName: customerConfig.bankDetails.bankName,
      amount: amount.toString(),
      // ... other params
    }
  });
} else {
  // Handle validation errors
  console.log('Validation errors:', validation.errors);
}
```

### Example 2: Advanced Payment with Analytics

```typescript
// 1. Get payment analytics
const analytics = await customerPaymentService.getCustomerPaymentAnalytics(customerId);

// 2. Calculate success probability
const probability = customerPaymentService.getPaymentSuccessProbability(customerConfig, amount);

// 3. Get optimized bank configuration
const optimizedConfig = customerPaymentService.getOptimizedBankConfig(customerConfig);

// 4. Use enhanced payment overview
<EnhancedPaymentOverview
  visible={true}
  onClose={() => setShowOverview(false)}
/>
```

### Example 3: Bank-Specific Customization

```typescript
// 1. Get bank-specific configuration
const bankConfig = BANK_CONFIGS[customerConfig.bankDetails.bankName];

// 2. Initialize customized socket
const { socket, handleCancel, retryPayment } = useCustomizedPaymentSocket({
  bankConfig,
  customerData: customerConfig,
  orderId: orderId,
  amount: amount,
  onBankSpecificEvent: (eventName, data) => {
    // Handle bank-specific events
    switch (eventName) {
      case 'hdfc_otp_required':
        // Show HDFC-specific OTP dialog
        break;
      case 'icici_secure_pay':
        // Show ICICI SecurePay dialog
        break;
      case 'sbi_otp_verification':
        // Show SBI OTP verification
        break;
    }
  }
});
```

---

## 🛠️ Configuration Management

### Adding New Banks

1. **Add Bank Configuration**
```typescript
// In BANK_CONFIGS
'NEW_BANK': {
  bankName: 'New Bank',
  bankCode: 'NEW_BANK',
  paymentTimeout: 300000,
  retryAttempts: 3,
  customEvents: ['new_bank_payment_status', 'new_bank_verification'],
  webhookEndpoints: ['/new_bank/webhook'],
  successPatterns: ['SUCCESS', 'COMPLETED'],
  failurePatterns: ['FAILED', 'DECLINED'],
  customHeaders: {
    'X-Bank-Code': 'NEW_BANK'
  }
}
```

2. **Add Bank Handler**
```typescript
// In BANK_SOCKET_HANDLERS
'NEW_BANK': {
  onConnect: (socket, config) => {
    socket.emit('new_bank_join_room', {
      orderId: config.orderId,
      customerId: config.customerData.customerId
    });
  },
  onPaymentUpdate: (data, config) => {
    // Handle payment updates
  },
  onCustomEvent: (eventName, data, config) => {
    // Handle custom events
  },
  onError: (error, config) => {
    // Handle errors
  },
  validatePaymentData: (data) => {
    // Validate payment data
    return data && data.paymentResponse && data.paymentResponse.txn_id;
  }
}
```

3. **Add Validation Rules**
```typescript
// In customerPaymentService
{
  bankCode: 'NEW_BANK',
  minAmount: 1,
  maxAmount: 500000,
  supportedPaymentMethods: ['netbanking', 'upi', 'card'],
  requiredFields: ['accountNumber', 'ifscCode', 'customerName'],
  otpRequired: true,
  securePayEnabled: false,
  processingTime: 4,
  failureRate: 3.0,
  retryPolicy: {
    maxAttempts: 2,
    delayBetweenAttempts: 2000,
    exponentialBackoff: false
  }
}
```

---

## 🔍 Testing & Debugging

### Debug Logs

The system provides comprehensive logging:

```typescript
// Socket connection logs
console.log('✅ HDFC Bank socket connected');
console.log('🎯 Emitting joinOrderRoom for orderId:', orderId);

// Payment status logs
console.log('🟦 HDFC payment update:', data);
console.log('✅ Payment successful:', data);

// Error logs
console.error('❌ HDFC connection error:', error);
console.error('🚨 Payment error:', error);
```

### Testing Different Banks

```typescript
// Test HDFC Bank
const hdfcCustomer = {
  bankDetails: { bankName: 'HDFC' },
  // ... other config
};

// Test ICICI Bank
const iciciCustomer = {
  bankDetails: { bankName: 'ICICI' },
  // ... other config
};

// Test SBI Bank
const sbiCustomer = {
  bankDetails: { bankName: 'SBI' },
  // ... other config
};
```

---

## 📈 Performance Optimization

### Caching Strategy

```typescript
// Customer configuration caching
private customerConfigs: Map<string, CustomerPaymentConfig> = new Map();

// Cache customer config
this.customerConfigs.set(customerId, config);

// Retrieve from cache
const config = this.customerConfigs.get(customerId);
```

### Retry Strategies

```typescript
// Exponential backoff
if (config.retryStrategy === 'exponential') {
  const delay = Math.pow(2, retryCount.current) * 1000;
  setTimeout(() => {
    initializeSocket();
  }, delay);
}

// Immediate retry
if (config.retryStrategy === 'immediate') {
  initializeSocket();
}
```

---

## 🚨 Error Handling

### Common Error Scenarios

1. **Connection Errors**
   - Network connectivity issues
   - Bank server unavailability
   - Timeout errors

2. **Validation Errors**
   - Invalid amount
   - Unsupported payment method
   - Missing required fields

3. **Bank-Specific Errors**
   - OTP timeout
   - Account blocked
   - Insufficient funds

### Error Recovery

```typescript
// Automatic retry on connection failure
socketInstance.on("connect_error", (error) => {
  retryCount.current++;
  
  if (retryCount.current >= bankConfig.retryAttempts) {
    config.onPaymentError?.({
      error: "Connection Error",
      message: `Failed to connect to ${bankConfig.bankName} payment server`,
      bankCode: bankConfig.bankCode
    });
  }
});

// Manual retry option
const retryPayment = () => {
  if (retryCount.current < bankConfig.retryAttempts) {
    initializeSocket();
    return true;
  }
  return false;
};
```

---

## 📋 Best Practices

### 1. **Always Validate Before Payment**
```typescript
const validation = customerPaymentService.validatePaymentRequest(
  customerConfig,
  amount,
  paymentMethod
);

if (!validation.isValid) {
  // Handle validation errors
  return;
}
```

### 2. **Use Customer-Specific Configurations**
```typescript
// Get optimized configuration for customer
const optimizedConfig = customerPaymentService.getOptimizedBankConfig(customerConfig);

// Use customer preferences
const recommendedMethod = customerPaymentService.getRecommendedPaymentMethod(
  customerConfig,
  amount
);
```

### 3. **Handle Bank-Specific Events**
```typescript
onBankSpecificEvent: (eventName, data) => {
  // Always handle bank-specific events
  switch (eventName) {
    case 'hdfc_otp_required':
      // Show HDFC OTP dialog
      break;
    case 'icici_secure_pay':
      // Show ICICI SecurePay dialog
      break;
    // ... handle other events
  }
}
```

### 4. **Monitor Payment Analytics**
```typescript
// Track payment attempts
await customerPaymentService.recordPaymentAttempt(
  customerId,
  amount,
  paymentMethod,
  status,
  transactionId
);

// Monitor success rates
const analytics = await customerPaymentService.getCustomerPaymentAnalytics(customerId);
```

---

## 🔄 Migration from Old System

### Step 1: Update Imports
```typescript
// Old
import { usePaymentSocket } from '@/hooks/usePaymentSocket';

// New
import { useCustomizedPaymentSocket, BANK_CONFIGS } from '@/hooks/useCustomizedPaymentSocket';
```

### Step 2: Update Component Usage
```typescript
// Old
const { socket, handleCancel } = usePaymentSocket({
  parsedUserDetails,
  router,
  orderId
});

// New
const { socket, handleCancel, retryPayment, isConnected } = useCustomizedPaymentSocket({
  bankConfig: BANK_CONFIGS[customerConfig.bankDetails.bankName],
  customerData: customerConfig,
  orderId,
  amount,
  // ... other config
});
```

### Step 3: Update Navigation
```typescript
// Old
router.push({
  pathname: "/(tabs)/home/PaymentWebView",
  params: { url, orderId, userDetails }
});

// New
router.push({
  pathname: "/(tabs)/home/CustomizedPaymentWebView",
  params: {
    url,
    orderId,
    customerId,
    bankName,
    amount,
    // ... customer-specific params
  }
});
```

---

## 📞 Support & Troubleshooting

### Common Issues

1. **Socket Connection Failed**
   - Check network connectivity
   - Verify bank server status
   - Check retry configuration

2. **Payment Validation Errors**
   - Verify customer configuration
   - Check bank validation rules
   - Ensure KYC is completed

3. **Bank-Specific Errors**
   - Check bank-specific event handlers
   - Verify custom headers
   - Review bank configuration

### Debug Commands

```typescript
// Enable debug logging
console.log('=== SOCKET CONNECTION DEBUG ===');
console.log('Socket connected:', socketInstance.connected);
console.log('Bank config:', bankConfig);
console.log('Customer data:', customerData);

// Check validation
const validation = customerPaymentService.validatePaymentRequest(
  customerConfig,
  amount,
  paymentMethod
);
console.log('Validation result:', validation);
```

---

*This guide provides comprehensive information about implementing and using the customized payment system with bank-specific socket hooks. For additional support, refer to the individual component documentation or contact the development team.* 