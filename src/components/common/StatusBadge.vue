<script setup>
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

const props = defineProps({
  status: {
    type: String,
    required: true,
  },
})

const { t } = useI18n()

const statusConfig = computed(() => {
  const s = props.status?.toUpperCase() || ''

  switch (s) {
    case 'APPROVED':
    case 'ACTIVE':
      return {
        classes: 'bg-emerald-50 text-emerald-800 border-emerald-300',
        labelKey: s === 'ACTIVE' ? 'status.active' : 'status.approved',
      }
    case 'REJECTED':
    case 'REVOKED':
      return {
        classes: 'bg-red-50 text-red-800 border-red-300',
        labelKey: s === 'REVOKED' ? 'status.revoked' : 'status.rejected',
      }
    case 'UNDER_REVIEW':
      return {
        classes: 'bg-blue-50 text-blue-800 border-blue-300',
        labelKey: 'status.underReview',
      }
    case 'SUBMITTED':
      return {
        classes: 'bg-amber-50 text-amber-800 border-amber-300',
        labelKey: 'status.submitted',
      }
    case 'NEEDS_MORE_INFO':
    case 'NEEDS_INFORMATION':
      return {
        classes: 'bg-orange-50 text-orange-800 border-orange-300',
        labelKey: 'status.needsInformation',
      }
    case 'SUSPENDED':
      return {
        classes: 'bg-purple-50 text-purple-800 border-purple-300',
        labelKey: 'status.suspended',
      }
    case 'EXPIRED':
      return {
        classes: 'bg-zinc-100 text-zinc-700 border-zinc-300',
        labelKey: 'status.expired',
      }
    case 'DRAFT':
    default:
      return {
        classes: 'bg-slate-100 text-slate-700 border-slate-300',
        labelKey: 'status.draft',
      }
  }
})
</script>

<template>
  <span
    :class="[
      'inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold border tracking-wide uppercase',
      statusConfig.classes
    ]"
  >
    {{ t(statusConfig.labelKey) }}
  </span>
</template>
