// Srimurugan Payment Configuration
export const SrimuruganConfig = {
  brandName: "Srimurugan",
  apiEndpoint: "https://api.srimurugan.com/payments/create",
  basePaymentUrl: "https://payments.srimurugan.com",
  timeout: 300000, // 5 minutes
  retryAttempts: 3,
  headers: {
    "Content-Type": "application/json",
    "Authorization": "Bearer YOUR_SRIMURUGAN_API_KEY"
  }
};

export default SrimuruganConfig; 