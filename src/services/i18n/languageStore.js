import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createJSONStorage, persist } from 'zustand/middleware';
import { translations } from './translations/index';

export const useLanguageStore = create(
    persist(
        (set, get) => ({
            language: 'en', // default language
            setLanguage: (lang) => set({ language: lang }),

            // Helper to get translation
            t: (key, params = {}) => {
                const { language } = get();
                const keys = key.split('.');
                let value = translations[language];

                for (const k of keys) {
                    value = value?.[k];
                    if (!value) break;
                }

                if (!value) return key; // Fallback to key if not found

                // Simple interpolation for placeholders like {param}
                return value.replace(/\{(\w+)\}/g, (_, k) => params[k] !== undefined ? params[k] : `{${k}}`);
            }
        }),
        {
            name: 'language-storage',
            storage: createJSONStorage(() => AsyncStorage),
        }
    )
);
