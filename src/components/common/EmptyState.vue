<script setup>
import { useI18n } from 'vue-i18n'
import { Inbox } from 'lucide-vue-next'

defineProps({
  title: {
    type: String,
    default: '',
  },
  description: {
    type: String,
    default: '',
  },
})

const { t } = useI18n()
</script>

<template>
  <div class="text-center py-10 px-4">
    <div class="w-12 h-12 rounded-full bg-slate-100 border border-slate-200 text-slate-400 mx-auto flex items-center justify-center mb-3">
      <Inbox class="w-6 h-6" />
    </div>
    <h3 class="text-xs font-bold text-slate-800">
      {{ title || t('common.noData') }}
    </h3>
    <p v-if="description" class="text-[11px] text-slate-500 mt-1 max-w-sm mx-auto leading-relaxed">
      {{ description }}
    </p>
    <div class="mt-4">
      <slot name="action"></slot>
    </div>
  </div>
</template>
