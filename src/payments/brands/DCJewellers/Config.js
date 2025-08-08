// DCJewellers Payment Configuration
export const DCJewellersConfig = {
  brandName: "DCJewellers",
  apiEndpoint: "https://api.dcjewellers.com/payments/create",
  basePaymentUrl: "https://payments.dcjewellers.com",
  timeout: 300000, // 5 minutes
  retryAttempts: 3,
  headers: {
    "Content-Type": "application/json",
    "Authorization": "Bearer YOUR_DC_JEWELLERS_API_KEY"
  }
};

export default DCJewellersConfig; 