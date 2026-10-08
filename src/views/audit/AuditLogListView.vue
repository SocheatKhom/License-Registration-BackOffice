<script setup>
import { ref, reactive, watch, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { auditLogsApi } from '@/api/audit-logs.api'
import { formatDateTime } from '@/utils/formatters'
import LoadingSpinner from '@/components/common/LoadingSpinner.vue'
import EmptyState from '@/components/common/EmptyState.vue'
import ErrorAlert from '@/components/common/ErrorAlert.vue'
import Pagination from '@/components/common/Pagination.vue'
import {
  ClipboardList,
  Search,
  Filter,
  RotateCcw,
  RefreshCw,
  Eye,
  ShieldCheck,
  Globe,
  Terminal,
  X,
  FileCode,
} from 'lucide-vue-next'

const { t, locale } = useI18n()

const filters = reactive({
  action: '',
  entityType: '',
  sortBy: 'createdAt',
  sortOrder: 'DESC',
  page: 1,
  limit: 10,
})

const auditLogs = ref([])
const totalItems = ref(0)
const totalPages = ref(1)
const loading = ref(false)
const error = ref(null)

// Detail modal state
const detailModalOpen = ref(false)
const selectedLog = ref(null)

async function fetchAuditLogs() {
  loading.value = true
  error.value = null

  try {
    const params = {
      page: filters.page,
      limit: filters.limit,
      sortBy: filters.sortBy,
      sortOrder: filters.sortOrder,
    }

    if (filters.action) {
      params.action = filters.action
    }
    if (filters.entityType) {
      params.entityType = filters.entityType
    }

    const response = await auditLogsApi.list(params)

    auditLogs.value = Array.isArray(response?.data)
      ? response.data
      : (response?.data?.auditLogs || [])

    totalItems.value = response?.pagination?.totalItems ?? (response?.data?.pagination?.totalItems ?? auditLogs.value.length)
    totalPages.value = response?.pagination?.totalPages ?? (response?.data?.pagination?.totalPages ?? 1)
  } catch (err) {
    console.error('Failed to fetch audit logs:', err)
    error.value = err.message || 'Unable to retrieve audit logs.'
  } finally {
    loading.value = false
  }
}

watch(
  [() => filters.action, () => filters.entityType, () => filters.sortBy, () => filters.sortOrder],
  () => {
    filters.page = 1
    fetchAuditLogs()
  }
)

watch(
  [() => filters.page, () => filters.limit],
  () => {
    fetchAuditLogs()
  }
)

onMounted(() => {
  fetchAuditLogs()
})

function resetFilters() {
  filters.action = ''
  filters.entityType = ''
  filters.sortBy = 'createdAt'
  filters.sortOrder = 'DESC'
  filters.page = 1
}

function openDetailModal(log) {
  selectedLog.value = log
  detailModalOpen.value = true
}

function getActionBadgeClass(action) {
  if (action.includes('CREATED') || action.includes('APPROVED') || action.includes('ISSUED') || action.includes('ACTIVATED')) {
    return 'bg-emerald-50 text-emerald-800 border-emerald-300'
  }
  if (action.includes('DELETED') || action.includes('REJECTED') || action.includes('REVOKED') || action.includes('DEACTIVATED')) {
    return 'bg-red-50 text-red-800 border-red-300'
  }
  if (action.includes('ROLE') || action.includes('UPDATED')) {
    return 'bg-purple-50 text-purple-800 border-purple-300'
  }
  return 'bg-blue-50 text-blue-800 border-blue-300'
}
</script>

<template>
  <div class="space-y-6">
    <!-- Header -->
    <div class="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
      <div>
        <h1 class="text-xl font-bold text-slate-900 tracking-tight">
          {{ t('navigation.auditLogs') }}
        </h1>
        <p class="text-xs text-slate-500 mt-1">
          ប្រវត្តិកត់ត្រាសកម្មភាពប្រតិបត្តិការក្នុងប្រព័ន្ធ និងសុវត្ថិភាពរដ្ឋបាល (SUPER_ADMIN Only)
        </p>
      </div>

      <button
        type="button"
        @click="fetchAuditLogs"
        :disabled="loading"
        class="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-medium rounded transition-colors disabled:opacity-60"
      >
        <RefreshCw :class="['w-3.5 h-3.5', loading ? 'animate-spin' : '']" />
        <span>{{ t('common.refresh') }}</span>
      </button>
    </div>

    <!-- Error Alert -->
    <ErrorAlert v-if="error" :message="error" :show-retry="true" @retry="fetchAuditLogs" />

    <!-- Filter Toolbar -->
    <div class="flat-card bg-white border border-slate-300 rounded-md p-4">
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <!-- Action Type Filter -->
        <div>
          <label class="block text-[11px] font-semibold text-slate-700 mb-1">
            Action Type
          </label>
          <select v-model="filters.action" class="flat-input text-xs">
            <option value="">All Action Types</option>
            <option value="USER_CREATED">USER_CREATED</option>
            <option value="USER_UPDATED">USER_UPDATED</option>
            <option value="USER_ROLE_CHANGED">USER_ROLE_CHANGED</option>
            <option value="USER_ACTIVATED">USER_ACTIVATED</option>
            <option value="USER_DEACTIVATED">USER_DEACTIVATED</option>
            <option value="APPLICATION_CREATED">APPLICATION_CREATED</option>
            <option value="APPLICATION_SUBMITTED">APPLICATION_SUBMITTED</option>
            <option value="APPLICATION_APPROVED">APPLICATION_APPROVED</option>
            <option value="APPLICATION_REJECTED">APPLICATION_REJECTED</option>
            <option value="LICENSE_ISSUED">LICENSE_ISSUED</option>
            <option value="LICENSE_REVOKED">LICENSE_REVOKED</option>
          </select>
        </div>

        <!-- Entity Type Filter -->
        <div>
          <label class="block text-[11px] font-semibold text-slate-700 mb-1">
            Entity Type
          </label>
          <select v-model="filters.entityType" class="flat-input text-xs">
            <option value="">All Entities</option>
            <option value="Application">Application (ពាក្យស្នើសុំ)</option>
            <option value="User">User (អ្នកប្រើប្រាស់)</option>
            <option value="License">License (អាជ្ញាបណ្ណ)</option>
            <option value="Document">Document (ឯកសារ)</option>
          </select>
        </div>

        <!-- Sort Filter -->
        <div>
          <label class="block text-[11px] font-semibold text-slate-700 mb-1">
            {{ t('common.sort') || 'Sort By' }}
          </label>
          <select v-model="filters.sortBy" class="flat-input text-xs">
            <option value="createdAt">Date (Newest First)</option>
            <option value="action">Action Type</option>
            <option value="entityType">Entity Type</option>
          </select>
        </div>

        <!-- Reset Button -->
        <div class="flex items-end">
          <button
            type="button"
            @click="resetFilters"
            class="w-full inline-flex items-center justify-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 border border-slate-300 text-slate-700 rounded text-xs font-semibold transition-colors"
          >
            <RotateCcw class="w-3.5 h-3.5" />
            <span>{{ t('common.reset') }}</span>
          </button>
        </div>
      </div>
    </div>

    <!-- Audit Logs Table Panel -->
    <div class="flat-card bg-white border border-slate-300 rounded-md overflow-hidden">
      <!-- Loading State -->
      <LoadingSpinner v-if="loading && auditLogs.length === 0" />

      <!-- Empty State -->
      <EmptyState
        v-else-if="auditLogs.length === 0"
        title="No audit log records match your filter criteria."
      />

      <!-- Table Content -->
      <div v-else class="overflow-x-auto">
        <table class="w-full text-left border-collapse text-xs">
          <thead>
            <tr class="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase text-[10px] tracking-wider">
              <th class="py-3 px-4">Date & Time</th>
              <th class="py-3 px-4">Officer / Actor</th>
              <th class="py-3 px-4">Action Type</th>
              <th class="py-3 px-4">Target Entity</th>
              <th class="py-3 px-4">Client IP</th>
              <th class="py-3 px-4 text-right">{{ t('common.actions') }}</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-200">
            <tr
              v-for="log in auditLogs"
              :key="log.id"
              class="hover:bg-slate-50 transition-colors"
            >
              <!-- Timestamp -->
              <td class="py-3 px-4 whitespace-nowrap font-mono text-[11px] text-slate-700">
                {{ formatDateTime(log.createdAt || log.created_at, locale) }}
              </td>

              <!-- User / Actor -->
              <td class="py-3 px-4 whitespace-nowrap">
                <div class="font-bold text-slate-900">{{ log.user?.name || 'System / Anonymous' }}</div>
                <div v-if="log.user?.email" class="text-[10px] text-slate-400 font-mono">{{ log.user.email }}</div>
              </td>

              <!-- Action Type Badge -->
              <td class="py-3 px-4 whitespace-nowrap">
                <span
                  :class="[
                    'inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold border tracking-wider font-mono',
                    getActionBadgeClass(log.action)
                  ]"
                >
                  {{ log.action }}
                </span>
              </td>

              <!-- Target Entity -->
              <td class="py-3 px-4 whitespace-nowrap">
                <span class="font-semibold text-slate-800">{{ log.entity_type }}</span>
                <span v-if="log.entity_id" class="text-[10px] text-slate-400 font-mono ml-1.5" :title="log.entity_id">
                  (#{{ String(log.entity_id).slice(0, 8) }}...)
                </span>
              </td>

              <!-- IP Address -->
              <td class="py-3 px-4 whitespace-nowrap font-mono text-[11px] text-slate-500">
                {{ log.ip_address || '—' }}
              </td>

              <!-- View Details Action -->
              <td class="py-3 px-4 text-right whitespace-nowrap">
                <button
                  type="button"
                  @click="openDetailModal(log)"
                  class="inline-flex items-center gap-1 px-2.5 py-1 bg-slate-100 hover:bg-blue-900 hover:text-white text-slate-700 border border-slate-300 rounded text-[11px] font-medium transition-colors"
                >
                  <Eye class="w-3.5 h-3.5" />
                  <span>Payload</span>
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Pagination Component -->
      <Pagination
        v-if="auditLogs.length > 0"
        :page="filters.page"
        :limit="filters.limit"
        :total-items="totalItems"
        :total-pages="totalPages"
        @update:page="filters.page = $event"
        @update:limit="filters.limit = $event"
      />
    </div>

    <!-- Audit Log Payload Detail Modal -->
    <Teleport to="body">
    <div
      v-if="detailModalOpen"
      class="fixed inset-0 z-[100] overflow-y-auto bg-slate-900/60 backdrop-blur-[1px] flex items-center justify-center p-4 transition-opacity"
      role="dialog"
      aria-modal="true"
    >
      <div class="flat-card bg-white border border-slate-300 rounded-md max-w-2xl w-full p-6 space-y-4 max-h-[90vh] flex flex-col">
        <!-- Modal Header -->
        <div class="flex items-center justify-between border-b border-slate-200 pb-3 shrink-0">
          <div class="flex items-center gap-2">
            <ClipboardList class="w-5 h-5 text-blue-900" />
            <div>
              <h3 class="text-sm font-bold text-slate-900">Audit Record Details</h3>
              <p class="text-[10px] text-slate-500 font-mono">{{ selectedLog?.id }}</p>
            </div>
          </div>
          <button type="button" @click="detailModalOpen = false" class="text-slate-400 hover:text-slate-700">
            <X class="w-4 h-4" />
          </button>
        </div>

        <!-- Metadata Grid -->
        <div class="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-50 p-3 rounded-md border border-slate-200 text-xs shrink-0">
          <div>
            <span class="text-slate-400 text-[10px] uppercase font-bold block">Action</span>
            <span class="font-mono font-bold text-blue-900 text-[11px]">{{ selectedLog?.action }}</span>
          </div>
          <div>
            <span class="text-slate-400 text-[10px] uppercase font-bold block">Entity</span>
            <span class="font-semibold text-slate-800">{{ selectedLog?.entity_type }}</span>
          </div>
          <div>
            <span class="text-slate-400 text-[10px] uppercase font-bold block">Officer</span>
            <span class="font-semibold text-slate-800">{{ selectedLog?.user?.name || 'System' }}</span>
          </div>
          <div>
            <span class="text-slate-400 text-[10px] uppercase font-bold block">Client IP</span>
            <span class="font-mono text-slate-600 text-[11px]">{{ selectedLog?.ip_address || '—' }}</span>
          </div>
        </div>

        <!-- Scrollable JSON Payload comparisons -->
        <div class="space-y-3 overflow-y-auto flex-1 pr-1 text-xs">
          <!-- Old Values -->
          <div v-if="selectedLog?.old_values">
            <div class="flex items-center gap-1.5 font-bold text-slate-700 text-[11px] mb-1">
              <FileCode class="w-3.5 h-3.5 text-amber-600" />
              <span>Prior Values (old_values)</span>
            </div>
            <pre class="bg-slate-900 text-amber-200 p-3 rounded text-[11px] font-mono overflow-x-auto leading-relaxed">{{ JSON.stringify(selectedLog.old_values, null, 2) }}</pre>
          </div>

          <!-- New Values -->
          <div>
            <div class="flex items-center gap-1.5 font-bold text-slate-700 text-[11px] mb-1">
              <FileCode class="w-3.5 h-3.5 text-emerald-600" />
              <span>Recorded Values (new_values)</span>
            </div>
            <pre class="bg-slate-900 text-emerald-200 p-3 rounded text-[11px] font-mono overflow-x-auto leading-relaxed">{{ JSON.stringify(selectedLog?.new_values, null, 2) }}</pre>
          </div>

          <!-- User Agent -->
          <div v-if="selectedLog?.user_agent" class="pt-1 text-[11px] text-slate-500 font-mono">
            <strong>User Agent:</strong> {{ selectedLog.user_agent }}
          </div>
        </div>

        <!-- Modal Footer -->
        <div class="flex items-center justify-between pt-3 border-t border-slate-200 shrink-0">
          <div class="flex items-center gap-1.5 text-[11px] text-slate-400">
            <ShieldCheck class="w-3.5 h-3.5 text-slate-500" />
            <span>Immutable cryptographically stored audit entry</span>
          </div>
          <button
            type="button"
            @click="detailModalOpen = false"
            class="px-4 py-1.5 bg-slate-100 hover:bg-slate-200 border border-slate-300 text-slate-700 text-xs font-semibold rounded"
          >
            {{ t('common.close') }}
          </button>
        </div>
      </div>
    </div>
    </Teleport>
  </div>
</template>
