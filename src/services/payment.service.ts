import apiService from './api';
import { PaymentInitPayload, PaymentResponse, TransactionPayload, PaymentPayload } from '@/app/(app)/(tabs)/home/types/payment.types';

class PaymentService {
  async initiatePayment(payload: PaymentInitPayload): Promise<PaymentResponse> {
    try {
      const formBody = new URLSearchParams();
      Object.entries(payload).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          formBody.append(key, String(value));
        }
      });

      const response = await apiService.post("/payments/initiate", formBody.toString(), {
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
      });

      if (!response.data.success) {
        throw new Error('Payment initiation failed');
      }

      return response.data;
    } catch (error) {
      console.error('Error initiating payment:', error);
      throw error;
    }
  }

  async createTransaction(payload: TransactionPayload): Promise<any> {
    try {
      const response = await apiService.post("/transactions", payload);
      return response.data;
    } catch (error) {
      console.error('Error creating transaction:', error);
      throw error;
    }
  }

  async createPayment(payload: PaymentPayload): Promise<any> {
    try {
      const response = await apiService.post("/payments", payload);
      return response.data;
    } catch (error) {
      console.error('Error creating payment:', error);
      throw error;
    }
  }

  async getLiveRates(): Promise<{ data: { data: { gold_rate: string } } }> {
    try {
      const response = await apiService.get("/rates/live");
      return response.data;
    } catch (error) {
      console.error('Error fetching live rates:', error);
      throw error;
    }
  }
}

export default new PaymentService(); 