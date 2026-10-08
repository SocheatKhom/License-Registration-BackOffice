<script setup>
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { formatNumber } from '@/utils/formatters'
import { ChevronLeft, ChevronRight } from 'lucide-vue-next'

const props = defineProps({
  page: {
    type: Number,
    required: true,
  },
  limit: {
    type: Number,
    required: true,
  },
  totalItems: {
    type: Number,
    required: true,
  },
  totalPages: {
    type: Number,
    required: true,
  },
})

const emit = defineEmits(['update:page', 'update:limit'])
const { t, locale } = useI18n()

const startItem = computed(() => {
  if (props.totalItems === 0) return 0
  return (props.page - 1) * props.limit + 1
})

const endItem = computed(() => {
  return Math.min(props.page * props.limit, props.totalItems)
})

function changePage(newPage) {
  if (newPage >= 1 && newPage <= props.totalPages && newPage !== props.page) {
    emit('update:page', newPage)
  }
}

function changeLimit(event) {
  const newLimit = parseInt(event.target.value, 10)
  emit('update:limit', newLimit)
  emit('update:page', 1)
}
</script>

<template>
  <div class="flex flex-col sm:flex-row items-center justify-between gap-4 py-3 px-4 bg-white border-t border-slate-200 text-xs text-slate-600">
    <!-- Left: Showing records summary -->
    <div class="flex items-center gap-3">
      <div>
        <span>{{ t('common.showing') || 'Showing' }}</span>
        <strong class="mx-1 text-slate-900">{{ formatNumber(startItem, locale) }}</strong>
        <span>-</span>
        <strong class="mx-1 text-slate-900">{{ formatNumber(endItem, locale) }}</strong>
        <span>{{ t('common.of') || 'of' }}</span>
        <strong class="mx-1 text-slate-900">{{ formatNumber(totalItems, locale) }}</strong>
        <span>{{ t('common.records') || 'records' }}</span>
      </div>

      <!-- Limit selector -->
      <div class="flex items-center gap-1.5 pl-3 border-l border-slate-200">
        <span class="text-slate-500">{{ t('common.perPage') || 'Per page:' }}</span>
        <select
          :value="limit"
          @change="changeLimit"
          class="border border-slate-300 rounded px-2 py-1 text-xs bg-white text-slate-800 outline-none focus:border-blue-900"
        >
          <option :value="10">10</option>
          <option :value="20">20</option>
          <option :value="50">50</option>
        </select>
      </div>
    </div>

    <!-- Right: Page buttons -->
    <div class="flex items-center gap-1">
      <button
        type="button"
        @click="changePage(page - 1)"
        :disabled="page <= 1"
        class="inline-flex items-center gap-1 px-2.5 py-1 rounded border border-slate-300 bg-white text-slate-700 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
      >
        <ChevronLeft class="w-3.5 h-3.5" />
        <span class="hidden sm:inline">{{ t('common.previous') || 'Previous' }}</span>
      </button>

      <span class="px-3 py-1 font-semibold text-slate-900 bg-slate-50 border border-slate-200 rounded">
        {{ formatNumber(page, locale) }} / {{ formatNumber(totalPages || 1, locale) }}
      </span>

      <button
        type="button"
        @click="changePage(page + 1)"
        :disabled="page >= totalPages"
        class="inline-flex items-center gap-1 px-2.5 py-1 rounded border border-slate-300 bg-white text-slate-700 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
      >
        <span class="hidden sm:inline">{{ t('common.next') || 'Next' }}</span>
        <ChevronRight class="w-3.5 h-3.5" />
      </button>
    </div>
  </div>
</template>
