<script setup>
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { ShieldAlert } from 'lucide-vue-next'

const router = useRouter()
const { t } = useI18n()
</script>

<template>
  <div class="min-h-screen bg-slate-100 flex items-center justify-center p-4">
    <div class="flat-card bg-white border border-slate-300 rounded-md p-8 max-w-md w-full text-center">
      <div class="w-12 h-12 bg-red-100 text-red-700 rounded-full mx-auto flex items-center justify-center mb-4">
        <ShieldAlert class="w-6 h-6" />
      </div>
      <h1 class="text-lg font-bold text-slate-900 mb-2">
        {{ t('errors.forbidden') }} (403)
      </h1>
      <p class="text-xs text-slate-600 mb-6 leading-relaxed">
        {{ t('errors.forbiddenMessage') }}
      </p>
      <button
        type="button"
        @click="router.push('/dashboard')"
        class="bg-blue-900 text-white text-xs font-semibold px-4 py-2.5 rounded-md hover:bg-blue-800 transition-colors"
      >
        {{ t('errors.returnHome') }}
      </button>
    </div>
  </div>
</template>
