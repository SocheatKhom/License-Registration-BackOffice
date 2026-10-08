import { createI18n } from 'vue-i18n'
import en from './en'
import km from './km'
import { STORAGE_KEYS } from '@/constants/storage-keys'
import { storage } from '@/utils/storage'

const savedLocale = storage.get(STORAGE_KEYS.LOCALE) || 'km'

export const i18n = createI18n({
  legacy: false,
  locale: savedLocale,
  fallbackLocale: 'en',
  messages: {
    en,
    km,
  },
})

export function setLocale(lang) {
  i18n.global.locale.value = lang
  storage.set(STORAGE_KEYS.LOCALE, lang)
  document.documentElement.lang = lang
}
