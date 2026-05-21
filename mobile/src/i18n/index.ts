import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { I18nManager } from 'react-native';
import en from './en.json';
import ur from './ur.json';
import romanUr from './roman-ur.json';
import type { Language } from '../types';

i18n.use(initReactI18next).init({
  resources: {
    en: { translation: en },
    ur: { translation: ur },
    'roman-ur': { translation: romanUr },
  },
  lng: 'en',
  fallbackLng: 'en',
  interpolation: { escapeValue: false },
});

export async function applyLanguage(lang: Language) {
  await AsyncStorage.setItem('app_language', lang);
  await i18n.changeLanguage(lang);

  if (lang === 'ur') {
    I18nManager.forceRTL(true);
  } else {
    I18nManager.forceRTL(false);
  }
}

export async function rehydrateLanguage() {
  const saved = await AsyncStorage.getItem('app_language');
  if (saved) {
    await applyLanguage(saved as Language);
  }
}

export default i18n;
