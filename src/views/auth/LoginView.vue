<script setup>
import { ref, reactive } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { useAuthStore } from '@/stores/auth.store'
import LanguageSwitcher from '@/components/common/LanguageSwitcher.vue'
import { Eye, EyeOff, AlertCircle, ShieldCheck, Lock, Mail } from 'lucide-vue-next'

const router = useRouter()
const route = useRoute()
const { t, locale } = useI18n()
const authStore = useAuthStore()

const form = reactive({
  email: '',
  password: '',
  rememberMe: false,
})

const errors = reactive({
  email: '',
  password: '',
})

const showPassword = ref(false)
const errorMessage = ref('')

function switchLanguage(lang) {
  setLocale(lang)
}

function validate() {
  let valid = true
  errors.email = ''
  errors.password = ''
  errorMessage.value = ''

  if (!form.email.trim()) {
    errors.email = t('auth.validationEmailRequired')
    valid = false
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) {
    errors.email = t('auth.validationEmailInvalid')
    valid = false
  }

  if (!form.password) {
    errors.password = t('auth.validationPasswordRequired')
    valid = false
  }

  return valid
}

async function handleLogin() {
  if (!validate()) return

  errorMessage.value = ''

  try {
    await authStore.login({
      email: form.email.trim(),
      password: form.password,
    })

    const redirectPath = route.query.redirect || '/dashboard'
    router.push(redirectPath)
  } catch (err) {
    if (err.code === 'INVALID_CREDENTIALS') {
      errorMessage.value = t('auth.invalidCredentials')
    } else if (err.code === 'ACCOUNT_INACTIVE') {
      errorMessage.value = t('auth.accountInactive')
    } else {
      errorMessage.value = err.message || t('auth.invalidCredentials')
    }
  }
}
</script>

<template>
  <div class="min-h-screen flex flex-col justify-between bg-slate-100 py-6 px-4 sm:px-6 lg:px-8">
    <!-- Top Utility Bar: National Emblem & Language Selector -->
    <header class="max-w-md w-full mx-auto flex items-center justify-between text-xs text-slate-600 pb-2">
      <div class="flex items-center gap-1.5 font-medium">
        <ShieldCheck class="w-4 h-4 text-blue-900" />
        <span>{{ t('app.kingdom') }}</span>
      </div>

      <!-- Language Selector with Flags -->
      <LanguageSwitcher :show-full-name="true" />
    </header>

    <!-- Main Login Card (Strictly Flat Government Administration Style) -->
    <main class="max-w-md w-full mx-auto my-auto">
      <div class="flat-card bg-white border border-slate-300 rounded-md p-6 sm:p-8">
        <!-- Ministry Header Banner -->
        <div class="text-center border-b border-slate-200 pb-5 mb-6">
          <!-- Kingdom Motto -->
          <p class="text-xs font-semibold text-blue-950 tracking-wide uppercase mb-1">
            {{ t('app.kingdom') }}
          </p>
          <p class="text-xs text-slate-500 mb-3 font-medium">
            {{ t('app.motto') }}
          </p>

          <!-- Ministry Title -->
          <div class="w-12 h-1 bg-amber-600 mx-auto mb-3"></div>
          <img
            src="/ministry-logo.png"
            alt="Ministry of Information Logo"
            class="w-16 h-16 mx-auto mb-3 object-contain"
          />
          <h1 class="text-base font-bold text-slate-900 sm:text-lg">
            {{ t('app.ministry') }}
          </h1>
          <p class="text-xs text-slate-600 mt-1">
            {{ t('app.title') }}
          </p>
          <div class="inline-block mt-3 px-2.5 py-0.5 bg-blue-50 border border-blue-200 text-blue-900 text-xs font-medium rounded">
            {{ t('auth.portalTitle') }}
          </div>
        </div>

        <!-- Error Alert -->
        <div
          v-if="errorMessage"
          class="mb-5 p-3.5 bg-red-50 border border-red-300 rounded-md flex items-start gap-2.5 text-xs text-red-900"
          role="alert"
        >
          <AlertCircle class="w-4 h-4 text-red-700 shrink-0 mt-0.5" />
          <div class="flex-1 font-medium">
            {{ errorMessage }}
          </div>
        </div>

        <!-- Login Form -->
        <form @submit.prevent="handleLogin" class="space-y-4" novalidate>
          <!-- Email Field -->
          <div>
            <label for="email" class="block text-xs font-semibold text-slate-800 mb-1.5">
              {{ t('auth.email') }} <span class="text-red-600">*</span>
            </label>
            <div class="relative">
              <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                <Mail class="w-4 h-4" />
              </div>
              <input
                id="email"
                v-model="form.email"
                type="email"
                autocomplete="email"
                required
                :placeholder="t('auth.emailPlaceholder')"
                :class="[
                  'flat-input pl-10',
                  errors.email ? 'border-red-500 focus:outline-red-500 focus:border-red-500' : ''
                ]"
              />
            </div>
            <p v-if="errors.email" class="mt-1 text-xs text-red-600 font-medium">
              {{ errors.email }}
            </p>
          </div>

          <!-- Password Field -->
          <div>
            <label for="password" class="block text-xs font-semibold text-slate-800 mb-1.5">
              {{ t('auth.password') }} <span class="text-red-600">*</span>
            </label>
            <div class="relative">
              <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                <Lock class="w-4 h-4" />
              </div>
              <input
                id="password"
                v-model="form.password"
                :type="showPassword ? 'text' : 'password'"
                autocomplete="current-password"
                required
                :placeholder="t('auth.passwordPlaceholder')"
                :class="[
                  'flat-input pl-10 pr-10',
                  errors.password ? 'border-red-500 focus:outline-red-500 focus:border-red-500' : ''
                ]"
              />
              <button
                type="button"
                @click="showPassword = !showPassword"
                class="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-500 hover:text-slate-800 focus:outline-none"
                tabindex="-1"
                :aria-label="showPassword ? 'Hide password' : 'Show password'"
              >
                <EyeOff v-if="showPassword" class="w-4 h-4" />
                <Eye v-else class="w-4 h-4" />
              </button>
            </div>
            <p v-if="errors.password" class="mt-1 text-xs text-red-600 font-medium">
              {{ errors.password }}
            </p>
          </div>

          <!-- Remember Me Checkbox -->
          <div class="flex items-center justify-between pt-1">
            <label class="inline-flex items-center text-xs text-slate-700 cursor-pointer">
              <input
                type="checkbox"
                v-model="form.rememberMe"
                class="rounded border-slate-300 text-blue-900 focus:ring-0 focus:outline-none"
              />
              <span class="ml-2">{{ t('auth.rememberMe') }}</span>
            </label>
          </div>

          <!-- Submit Button -->
          <div class="pt-2">
            <button
              type="submit"
              :disabled="authStore.loading"
              class="w-full bg-blue-900 text-white font-medium text-sm py-2.5 px-4 rounded-md hover:bg-blue-800 active:bg-blue-950 transition-colors flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed border border-blue-950"
            >
              <svg
                v-if="authStore.loading"
                class="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              <span>{{ authStore.loading ? t('auth.signingIn') : t('auth.login') }}</span>
            </button>
          </div>
        </form>
      </div>

      <!-- Security / Restriction Notice -->
      <div class="mt-4 p-3 bg-slate-200/70 border border-slate-300 rounded-md text-center">
        <p class="text-[11px] text-slate-600 leading-relaxed">
          {{ t('app.restrictedNotice') }}
        </p>
      </div>
    </main>

    <!-- Footer -->
    <footer class="max-w-md w-full mx-auto text-center pt-4">
      <p class="text-[11px] text-slate-500">
        {{ t('app.copyright') }}
      </p>
    </footer>
  </div>
</template>
