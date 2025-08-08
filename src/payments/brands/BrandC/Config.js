// BrandC Payment Configuration
export const BrandCConfig = {
  brandName: "BrandC",
  apiEndpoint: "https://api.brandc.com/payments/create",
  basePaymentUrl: "https://payments.brandc.com",
  timeout: 300000, // 5 minutes
  retryAttempts: 3,
  headers: {
    "Content-Type": "application/json",
    "Authorization": "Bearer YOUR_BRAND_C_API_KEY"
  }
};

export default BrandCConfig; 