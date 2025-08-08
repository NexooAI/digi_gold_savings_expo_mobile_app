# Payment Brands System

This directory contains the payment system implementation for different brands (AkilaJewellers, DCJewellers, Srimurugan). Each brand has its own configuration and screen implementation while sharing common payment components.

## Structure

```
src/payments/brands/
├── AkilaJewellers/
│   ├── Config.js          # AkilaJewellers-specific configuration
│   └── Screen.js          # AkilaJewellers payment screen
├── DCJewellers/
│   ├── Config.js          # DCJewellers-specific configuration
│   └── Screen.js          # DCJewellers payment screen
├── Srimurugan/
│   ├── Config.js          # Srimurugan-specific configuration
│   └── Screen.js          # Srimurugan payment screen
├── TestPaymentScreen.js   # Test screen for all brands
├── index.js               # Exports all brands
└── README.md              # This file
```

## Real Brand Names

The system now uses your actual brand names:
- **AkilaJewellers** - Gold and jewelry business
- **DCJewellers** - Diamond and jewelry business  
- **Srimurugan** - Precious metals business

## Shared Components

All brand screens use the same shared components:
- `usePaymentSocket` from `../../hooks/usePaymentSocket`
- `PaymentWebView` from `../../components/PaymentWebView`

## Configuration

Each brand has a `Config.js` file containing:
- `brandName`: Display name for the brand
- `apiEndpoint`: API endpoint for creating payments
- `basePaymentUrl`: Base URL for payment gateway
- `timeout`: Payment timeout in milliseconds
- `retryAttempts`: Number of retry attempts
- `headers`: API request headers

## Screen Implementation

Each brand screen (`Screen.js`) implements:
1. **Payment Creation**: Calls the brand's create-payment API
2. **Socket Integration**: Uses `usePaymentSocket` to listen for payment status
3. **WebView Display**: Shows `PaymentWebView` when payment starts
4. **Status Management**: Updates UI based on payment status
5. **Navigation**: Handles success/failure navigation

## Usage

### Import a specific brand screen:
```javascript
import { AkilaJewellersScreen } from '@/payments/brands';
```

### Import all brands:
```javascript
import { AkilaJewellersScreen, DCJewellersScreen, SrimuruganScreen } from '@/payments/brands';
```

### Access brand configurations:
```javascript
import { AkilaJewellersConfig, DCJewellersConfig, SrimuruganConfig } from '@/payments/brands';
```

### Use brand configurations object:
```javascript
import { BrandConfigs } from '@/payments/brands';
const config = BrandConfigs.AkilaJewellers;
```

## Testing "Pay Now" Functionality

### Method 1: Direct Import
```javascript
import { AkilaJewellersScreen } from '@/payments/brands';

// In your component
<AkilaJewellersScreen />
```

### Method 2: Test Screen
```javascript
import TestPaymentScreen from '@/payments/brands/TestPaymentScreen';

// In your component
<TestPaymentScreen />
```

### Method 3: Navigation
```javascript
import { useRouter } from 'expo-router';

const router = useRouter();

// Navigate to test screen
router.push('/test-payment');
```

## How "Pay Now" Works

1. **User clicks "Pay Now"** → Screen calls brand's API
2. **API call** → `fetch(brandConfig.apiEndpoint, {...})`
3. **Transaction ID** → API returns transaction ID
4. **Payment URL** → Constructs: `basePaymentUrl + "/payment/" + transactionId`
5. **WebView opens** → Shows PaymentWebView with payment URL
6. **Socket listens** → usePaymentSocket monitors payment status
7. **Status updates** → UI updates based on payment progress
8. **Completion** → WebView closes, user navigated to success/failure page

## Testing Steps

1. **Select Brand**: Choose AkilaJewellers, DCJewellers, or Srimurugan
2. **Click "Pay Now"**: This triggers the payment flow
3. **Check Console**: Monitor console logs for API calls and responses
4. **Watch WebView**: PaymentWebView should open with payment URL
5. **Monitor Status**: Check for payment status updates
6. **Test Completion**: Verify navigation to success/failure pages

## Adding a New Brand

1. Create a new folder: `src/payments/brands/NewBrand/`
2. Create `Config.js` with brand-specific configuration
3. Create `Screen.js` following the existing pattern
4. Update `src/payments/brands/index.js` to export the new brand
5. Update this README.md

## Key Features

- **No Code Duplication**: All brands reuse the same `usePaymentSocket` and `PaymentWebView` components
- **Brand-Specific Configuration**: Each brand has its own API endpoints and payment URLs
- **Consistent Interface**: All brand screens follow the same pattern
- **Easy Maintenance**: Changes to shared components automatically apply to all brands
- **Scalable**: Easy to add new brands without modifying existing code
- **Real Brand Names**: Uses your actual business brand names

## Payment Flow

1. User clicks "Pay Now" button
2. Screen calls brand's create-payment API
3. API returns transaction ID
4. Screen constructs payment URL with transaction ID
5. PaymentWebView opens with the payment URL
6. usePaymentSocket listens for payment status changes
7. On completion, WebView closes and user is navigated to success/failure page 