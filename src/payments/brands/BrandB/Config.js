// BrandB Payment Configuration
export const BrandBConfig = {
  brandName: "BrandB",
  apiEndpoint: "https://api.brandb.com/payments/create",
  basePaymentUrl: "https://payments.brandb.com",
  timeout: 300000, // 5 minutes
  retryAttempts: 3,
  headers: {
    "Content-Type": "application/json",
    "Authorization": "Bearer YOUR_BRAND_B_API_KEY"
  }
};

export default BrandBConfig; 