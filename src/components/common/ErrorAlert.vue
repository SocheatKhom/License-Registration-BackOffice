<script setup>
import { useI18n } from 'vue-i18n'
import { AlertCircle, RefreshCw } from 'lucide-vue-next'

defineProps({
  message: {
    type: String,
    required: true,
  },
  showRetry: {
    type: Boolean,
    default: false,
  },
})

defineEmits(['retry'])
const { t } = useI18n()
</script>

<template>
  <div class="p-4 bg-red-50 border border-red-200 rounded-md flex items-start justify-between gap-3 text-xs text-red-900">
    <div class="flex items-start gap-2.5">
      <AlertCircle class="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
      <div>
        <div class="font-bold">{{ t('common.error') }}</div>
        <p class="mt-0.5 text-red-800">{{ message }}</p>
      </div>
    </div>
    <button
      v-if="showRetry"
      type="button"
      @click="$emit('retry')"
      class="inline-flex items-center gap-1 px-2.5 py-1 bg-red-100 hover:bg-red-200 text-red-900 border border-red-300 rounded text-xs font-medium shrink-0 transition-colors"
    >
      <RefreshCw class="w-3 h-3" />
      <span>{{ t('common.refresh') }}</span>
    </button>
  </div>
</template>
