// AkilaJewellers Payment Configuration
export const AkilaJewellersConfig = {
  brandName: "AkilaJewellers",
  apiEndpoint: "https://api.akilajewellers.com/payments/create",
  basePaymentUrl: "https://payments.akilajewellers.com",
  timeout: 300000, // 5 minutes
  retryAttempts: 3,
  headers: {
    "Content-Type": "application/json",
    "Authorization": "Bearer YOUR_AKILA_JEWELLERS_API_KEY"
  }
};

export default AkilaJewellersConfig; 