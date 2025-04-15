import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import i18n, { AppLocale,  } from '@/i18n'; // Add i18n import
import * as SecureStore from 'expo-secure-store';

interface GlobalStore {
  isLoggedIn: boolean;
  token: string | null;
  user: { id?: string; name?: string; email?: string; mobile?: number, profileImage:string,
    idProof:string,
    referralCode:string,
    rewards:number
   } | null;
  language: AppLocale; // Change type to AppLocale
  login: (token: string, user: any) => void;
  logout: () => void;
  setLanguage: (lang: AppLocale) => Promise<void>; // Make async
  updateUser: (user: any) => void
}

const useGlobalStore = create<GlobalStore>()(
  persist(
    (set) => ({
      isLoggedIn: false,
      token: null,
      user: null,
      language: 'en',
      login: async(token, user) => {
        await SecureStore.setItemAsync('authToken', token);
        set({ isLoggedIn: true, token, user })
      },
      logout: async () => {
        console.log('-----------------------------------------Logging out');
        await SecureStore.deleteItemAsync('authToken');
        set({ isLoggedIn: false, token: null, user: null })
      },
      setLanguage: async (lang) => {
        // Update both store and i18n
        await AsyncStorage.setItem('user-locale', lang);
        i18n.locale = lang;
        set({ language: lang });
      },
      updateUser: (user: any) => void set((state) => ({ user: { ...state.user, ...user } }))
    }),
    {
      name: 'global-storage',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        language: state.language,
        user: state.user
      })
    }
  )
);

export default useGlobalStore