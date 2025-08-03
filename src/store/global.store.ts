import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { AppLocale, changeLocale } from '@/i18n'; // Import changeLocale function instead of i18n
import * as SecureStore from 'expo-secure-store';

// Payment retry data interface
interface PaymentRetryData {
  // Payment payload data
  paymentData: {
    amount: number;
    userId: string | number;
    investmentId: string | number;
    schemeId: string | number;
    chitId: string | number;
    userEmail: string;
    userMobile: string;
    userName: string;
  };

  // Investment payload data
  investmentData: {
    userId: string | number;
    schemeId: string | number;
    chitId: string | number;
    accountName: string;
    accountNo: string;
    paymentAmount: number;
    investmentId: string | number;
  };

  // Transaction payload data
  transactionData: {
    userId: string | number;
    investmentId: string | number;
    schemeId: string | number;
    chitId: string | number;
    accountNumber: string;
    amount: number;
  };

  // UI/Display data
  displayData: {
    schemeName: string;
    accountHolder: string;
    accNo: string;
    totalPaid: string;
    monthsPaid: string;
    noOfIns: string;
    goldWeight: string;
    maturityDate: string;
  };

  // Metadata
  timestamp: string;
  source: string;
}

// Current payment session interface
interface PaymentSession {
  amount: number;
  userDetails: {
    accountname: string;
    accNo: string;
    name: string;
    mobile: string;
    email: string;
    userId: string | number;
    investmentId: string | number;
    chitId: string | number;
    schemeId: string | number;
    isRetryAttempt: boolean;
    originalPaymentTimestamp?: string;
    retryTimestamp?: string;
    source: string;
    retryData?: PaymentRetryData;
  };
  timestamp: string;
}

interface GlobalStore {
  isLoggedIn: boolean;
  token: string | null;
  user: {
    id?: string;
    name?: string;
    email?: string;
    mobile?: number;
    profileImage: string;
    idProof: string;
    referralCode: string;
    rewards: number;
    firstName?: string;
    lastName?: string;
    username?: string;
    birth?: string;
    gender?: string;
  } | null;
  language: AppLocale;

  // Payment retry data
  paymentRetryData: PaymentRetryData | null;
  currentPaymentSession: PaymentSession | null;

  // Auth functions
  login: (token: string, user: any) => void;
  logout: () => void;
  setLanguage: (lang: AppLocale) => Promise<void>;
  updateUser: (user: any) => void;

  // Payment retry functions
  storePaymentRetryData: (data: PaymentRetryData) => void;
  storePaymentSession: (session: PaymentSession) => void;
  clearPaymentRetryData: () => void;
  clearPaymentSession: () => void;
  hasPaymentRetryData: () => boolean;
  getPaymentRetryData: () => PaymentRetryData | null;
  getCurrentPaymentSession: () => PaymentSession | null;

  // Tab visibility
  isTabVisible: boolean;
  setTabVisibility: (visible: boolean) => void;

  // Debug function
  debugState: () => GlobalStore;
}

const useGlobalStore = create<GlobalStore>()(
  persist(
    (set, get) => ({
      isLoggedIn: false,
      token: null,
      user: null,
      language: 'en',

      // Payment retry data
      paymentRetryData: null,
      currentPaymentSession: null,

      // Auth functions
      login: async (token, user) => {
        console.log('🔍 Global Store: Login called with token:', token ? 'present' : 'missing');
        console.log('🔍 Global Store: Login called with user:', user);
        await SecureStore.setItemAsync('authToken', token);
        const userWithDefaults = {
          idProof: "",
          referralCode: "",
          rewards: 0,
          ...user,
          // Handle profile_photo field from local storage
          profileImage: user.profile_photo || user.profileImage || ""
        };
        console.log('🔍 Global Store: Setting user with defaults:', userWithDefaults);
        set({ isLoggedIn: true, token, user: userWithDefaults })
      },
      logout: async () => {
        console.log('🔍 Global Store: Logout called');
        await SecureStore.deleteItemAsync('authToken');
        await SecureStore.deleteItemAsync('accessToken');
        await SecureStore.deleteItemAsync('token');
        await SecureStore.deleteItemAsync('refreshToken');
        // Note: user_mpin is no longer stored locally, it's on server
        set({
          isLoggedIn: false,
          token: null,
          user: null,
          // Clear payment data on logout
          paymentRetryData: null,
          currentPaymentSession: null,
        })
      },
      setLanguage: async (lang) => {
        await changeLocale(lang);
        set({ language: lang });
      },
      updateUser: (user: any) => set((state) => ({ 
        user: { 
          idProof: "",
          referralCode: "",
          rewards: 0,
          ...state.user, 
          ...user,
          // Handle profile_photo field from local storage
          profileImage: user.profile_photo || user.profileImage || state.user?.profileImage || ""
        } 
      })),

      // Payment retry functions
      storePaymentRetryData: (data: PaymentRetryData) => {
        //console.log('Storing payment retry data in global store:', data);
        set({ paymentRetryData: data });
      },

      storePaymentSession: (session: PaymentSession) => {
        //console.log('Storing payment session in global store:', session);
        set({ currentPaymentSession: session });
      },

      clearPaymentRetryData: () => {
        //console.log('Clearing payment retry data from global store');
        set({ paymentRetryData: null });
      },

      clearPaymentSession: () => {
        //console.log('Clearing payment session from global store');
        set({ currentPaymentSession: null });
      },

      hasPaymentRetryData: () => {
        const state = get();
        return state.paymentRetryData !== null;
      },

      getPaymentRetryData: () => {
        const state = get();
        return state.paymentRetryData;
      },

      getCurrentPaymentSession: () => {
        const state = get();
        return state.currentPaymentSession;
      },

      // Tab visibility
      isTabVisible: true,
      setTabVisibility: (visible: boolean) => set({ isTabVisible: visible }),

      // Debug function to check current state
      debugState: () => {
        const state = get();
        console.log('🔍 Global Store Debug State:');
        console.log('  isLoggedIn:', state.isLoggedIn);
        console.log('  token:', state.token ? 'present' : 'missing');
        console.log('  user:', state.user);
        console.log('  user.id:', state.user?.id);
        return state;
      },
    }),
    {
      name: 'global-storage',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        language: state.language,
        user: state.user,
        // Don't persist payment data for security
        // paymentRetryData and currentPaymentSession will be lost on app restart
      })
    }
  )
);

export default useGlobalStore