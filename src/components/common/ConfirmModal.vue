<script setup>
import { ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { AlertTriangle, X } from 'lucide-vue-next'

const props = defineProps({
  isOpen: {
    type: Boolean,
    default: false,
  },
  title: {
    type: String,
    required: true,
  },
  message: {
    type: String,
    required: true,
  },
  confirmText: {
    type: String,
    default: '',
  },
  cancelText: {
    type: String,
    default: '',
  },
  requireReason: {
    type: Boolean,
    default: false,
  },
  reasonPlaceholder: {
    type: String,
    default: 'Please enter a mandatory reason...',
  },
  danger: {
    type: Boolean,
    default: false,
  },
  loading: {
    type: Boolean,
    default: false,
  },
})

const emit = defineEmits(['confirm', 'cancel'])
const { t } = useI18n()

const reasonText = ref('')
const reasonError = ref('')

function handleConfirm() {
  if (props.requireReason && !reasonText.value.trim()) {
    reasonError.value = 'A mandatory reason is required to proceed.'
    return
  }
  reasonError.value = ''
  emit('confirm', reasonText.value.trim())
}

function handleCancel() {
  reasonText.value = ''
  reasonError.value = ''
  emit('cancel')
}
</script>

<template>
  <Teleport to="body">
    <div
      v-if="isOpen"
      class="fixed inset-0 z-[100] overflow-y-auto bg-slate-900/60 backdrop-blur-[1px] flex items-center justify-center p-4 transition-opacity"
      role="dialog"
      aria-modal="true"
    >
      <div class="flat-card bg-white border border-slate-300 rounded-md max-w-md w-full p-6 space-y-4 shadow-2xl relative z-[101]">
        <!-- Modal Header -->
        <div class="flex items-start justify-between">
          <div class="flex items-center gap-3">
            <div :class="['p-2 rounded', danger ? 'bg-red-50 text-red-700 border border-red-200' : 'bg-blue-50 text-blue-900 border border-blue-200']">
              <AlertTriangle class="w-5 h-5" />
            </div>
            <h3 class="text-sm font-bold text-slate-900">
              {{ title }}
            </h3>
          </div>
          <button
            type="button"
            @click="handleCancel"
            class="text-slate-400 hover:text-slate-700 rounded p-1 cursor-pointer"
            :aria-label="t('common.close')"
          >
            <X class="w-4 h-4" />
          </button>
        </div>

        <!-- Modal Message -->
        <p class="text-xs text-slate-600 leading-relaxed">
          {{ message }}
        </p>

        <!-- Optional Reason Input -->
        <div v-if="requireReason" class="space-y-1 pt-1">
          <label class="block text-[11px] font-semibold text-slate-800">
            Reason <span class="text-red-600">*</span>
          </label>
          <textarea
            v-model="reasonText"
            rows="3"
            :placeholder="reasonPlaceholder"
            :class="[
              'flat-input text-xs',
              reasonError ? 'border-red-500' : ''
            ]"
          ></textarea>
          <p v-if="reasonError" class="text-[11px] text-red-600 font-medium">
            {{ reasonError }}
          </p>
        </div>

        <!-- Modal Action Buttons -->
        <div class="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-200">
          <button
            type="button"
            @click="handleCancel"
            :disabled="loading"
            class="px-3.5 py-1.5 bg-slate-100 hover:bg-slate-200 border border-slate-300 text-slate-700 text-xs font-semibold rounded transition-colors disabled:opacity-50 cursor-pointer"
          >
            {{ cancelText || t('common.cancel') }}
          </button>

          <button
            type="button"
            @click="handleConfirm"
            :disabled="loading"
            :class="[
              'px-3.5 py-1.5 text-xs font-semibold rounded transition-colors flex items-center gap-1.5 disabled:opacity-50 cursor-pointer',
              danger
                ? 'bg-red-700 hover:bg-red-800 text-white border border-red-800'
                : 'bg-blue-900 hover:bg-blue-800 text-white border border-blue-950'
            ]"
          >
            <span v-if="loading" class="animate-spin text-white">⋯</span>
            <span>{{ confirmText || t('common.confirm') }}</span>
          </button>
        </div>
      </div>
    </div>
  </Teleport>
</template>
