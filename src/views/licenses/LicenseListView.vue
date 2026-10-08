<script setup>
import { ref, reactive, watch, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { licensesApi } from '@/api/licenses.api'
import { useAuthStore } from '@/stores/auth.store'
import { formatDate, formatNumber } from '@/utils/formatters'
import { useDebounce } from '@/composables/useDebounce'
import StatusBadge from '@/components/common/StatusBadge.vue'
import LoadingSpinner from '@/components/common/LoadingSpinner.vue'
import EmptyState from '@/components/common/EmptyState.vue'
import ErrorAlert from '@/components/common/ErrorAlert.vue'
import Pagination from '@/components/common/Pagination.vue'
import ConfirmModal from '@/components/common/ConfirmModal.vue'
import {
  Award,
  Search,
  Filter,
  RotateCcw,
  Eye,
  RefreshCw,
  Ban,
  CheckCircle2,
} from 'lucide-vue-next'

const router = useRouter()
const { t, locale } = useI18n()
const authStore = useAuthStore()

const searchInput = ref('')
const debouncedSearch = useDebounce(searchInput, 400)

const filters = reactive({
  status: '',
  sortBy: 'issuedAt',
  sortOrder: 'DESC',
  page: 1,
  limit: 10,
})

const licenses = ref([])
const totalItems = ref(0)
const totalPages = ref(1)
const loading = ref(false)
const error = ref(null)
const successMessage = ref('')

// Revocation modal state
const revokeModalOpen = ref(false)
const licenseToRevoke = ref(null)
const revoking = ref(false)

async function fetchLicenses() {
  loading.value = true
  error.value = null

  try {
    const params = {
      page: filters.page,
      limit: filters.limit,
      sortBy: filters.sortBy,
      sortOrder: filters.sortOrder,
    }

    if (debouncedSearch.value.trim()) {
      params.search = debouncedSearch.value.trim()
    }
    if (filters.status) {
      params.status = filters.status
    }

    const response = await licensesApi.list(params)

    licenses.value = Array.isArray(response?.data)
      ? response.data
      : (response?.data?.licenses || [])

    totalItems.value = response?.pagination?.totalItems ?? (response?.data?.pagination?.totalItems ?? licenses.value.length)
    totalPages.value = response?.pagination?.totalPages ?? (response?.data?.pagination?.totalPages ?? 1)
  } catch (err) {
    console.error('Failed to fetch licenses:', err)
    error.value = err.message || 'Unable to retrieve licenses list.'
  } finally {
    loading.value = false
  }
}

watch(
  [debouncedSearch, () => filters.status, () => filters.sortBy, () => filters.sortOrder],
  () => {
    filters.page = 1
    fetchLicenses()
  }
)

watch(
  [() => filters.page, () => filters.limit],
  () => {
    fetchLicenses()
  }
)

onMounted(() => {
  fetchLicenses()
})

function resetFilters() {
  searchInput.value = ''
  filters.status = ''
  filters.sortBy = 'issuedAt'
  filters.sortOrder = 'DESC'
  filters.page = 1
}

function viewDetail(id) {
  router.push(`/licenses/${id}`)
}

function openRevokeModal(lic) {
  licenseToRevoke.value = lic
  revokeModalOpen.value = true
}

async function handleRevokeConfirm(reason) {
  if (!licenseToRevoke.value) return

  revoking.value = true
  try {
    await licensesApi.revoke(licenseToRevoke.value.id, { reason })
    revokeModalOpen.value = false
    successMessage.value = `License ${licenseToRevoke.value.license_number} was successfully revoked.`
    setTimeout(() => { successMessage.value = '' }, 4000)
    await fetchLicenses()
  } catch (err) {
    error.value = err.message || 'Failed to revoke license.'
  } finally {
    revoking.value = false
    licenseToRevoke.value = null
  }
}
</script>

<template>
  <div class="space-y-6">
    <!-- Header -->
    <div class="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
      <div>
        <h1 class="text-xl font-bold text-slate-900 tracking-tight">
          {{ t('navigation.licenses') }}
        </h1>
        <p class="text-xs text-slate-500 mt-1">
          គ្រប់គ្រងអាជ្ញាបណ្ណសារព័ត៌មានដែលបានចេញ និងការតាមដានសុពលភាព (Issued Licenses Management)
        </p>
      </div>

      <button
        type="button"
        @click="fetchLicenses"
        :disabled="loading"
        class="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-medium rounded transition-colors disabled:opacity-60"
      >
        <RefreshCw :class="['w-3.5 h-3.5', loading ? 'animate-spin' : '']" />
        <span>{{ t('common.refresh') }}</span>
      </button>
    </div>

    <!-- Success Message Banner -->
    <div
      v-if="successMessage"
      class="p-3.5 bg-emerald-50 border border-emerald-300 rounded-md text-xs text-emerald-900 flex items-center gap-2"
    >
      <CheckCircle2 class="w-4 h-4 text-emerald-700 shrink-0" />
      <span>{{ successMessage }}</span>
    </div>

    <!-- Error Alert -->
    <ErrorAlert v-if="error" :message="error" :show-retry="true" @retry="fetchLicenses" />

    <!-- Filter & Search Toolbar -->
    <div class="flat-card bg-white border border-slate-300 rounded-md p-4">
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        <!-- Search Input -->
        <div>
          <label class="block text-[11px] font-semibold text-slate-700 mb-1">
            {{ t('common.search') }}
          </label>
          <div class="relative">
            <Search class="w-4 h-4 text-slate-400 absolute left-3 top-2.5 pointer-events-none" />
            <input
              v-model="searchInput"
              type="text"
              :placeholder="t('license.searchPlaceholder') || 'Search by License number (MIC-)...'"
              class="flat-input pl-10 text-xs"
            />
          </div>
        </div>

        <!-- Status Filter -->
        <div>
          <label class="block text-[11px] font-semibold text-slate-700 mb-1">
            {{ t('common.status') }}
          </label>
          <select v-model="filters.status" class="flat-input text-xs">
            <option value="">{{ t('common.allStatuses') || 'All Statuses' }}</option>
            <option value="ACTIVE">{{ t('status.active') }}</option>
            <option value="EXPIRED">{{ t('status.expired') }}</option>
            <option value="REVOKED">{{ t('status.revoked') }}</option>
          </select>
        </div>

        <!-- Sort Filter & Reset -->
        <div class="flex items-end gap-2">
          <div class="flex-1">
            <label class="block text-[11px] font-semibold text-slate-700 mb-1">
              {{ t('common.sort') || 'Sort By' }}
            </label>
            <select v-model="filters.sortBy" class="flat-input text-xs">
              <option value="issuedAt">{{ t('license.issuedDate') || 'Issued Date' }}</option>
              <option value="expiresAt">{{ t('license.expiryDate') || 'Expiry Date' }}</option>
              <option value="licenseNumber">{{ t('license.licenseNumber') || 'License Number' }}</option>
            </select>
          </div>

          <button
            type="button"
            @click="resetFilters"
            class="px-3 py-2 bg-slate-100 hover:bg-slate-200 border border-slate-300 text-slate-700 rounded text-xs font-medium transition-colors shrink-0"
            :title="t('common.reset')"
          >
            <RotateCcw class="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>

    <!-- Licenses Table Panel -->
    <div class="flat-card bg-white border border-slate-300 rounded-md overflow-hidden">
      <!-- Loading State -->
      <LoadingSpinner v-if="loading && licenses.length === 0" />

      <!-- Empty State -->
      <EmptyState
        v-else-if="licenses.length === 0"
        :title="t('license.noLicensesFound') || 'No licenses match your filter criteria.'"
      />

      <!-- Table Content -->
      <div v-else class="overflow-x-auto">
        <table class="w-full text-left border-collapse text-xs">
          <thead>
            <tr class="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase text-[10px] tracking-wider">
              <th class="py-3 px-4">{{ t('license.licenseNumber') || 'License Number' }}</th>
              <th class="py-3 px-4">{{ t('application.title') || 'Application' }}</th>
              <th class="py-3 px-4">{{ t('application.mediaOutlet') }}</th>
              <th class="py-3 px-4">{{ t('application.applicant') }}</th>
              <th class="py-3 px-4">{{ t('common.status') }}</th>
              <th class="py-3 px-4">{{ t('license.issuedDate') || 'Issued Date' }}</th>
              <th class="py-3 px-4">{{ t('license.expiryDate') || 'Expiry Date' }}</th>
              <th class="py-3 px-4 text-right">{{ t('common.actions') }}</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-200">
            <tr
              v-for="lic in licenses"
              :key="lic.id"
              class="hover:bg-slate-50 transition-colors"
            >
              <!-- License Number Link -->
              <td class="py-3 px-4 font-mono font-bold whitespace-nowrap">
                <router-link
                  :to="`/licenses/${lic.id}`"
                  class="text-blue-900 hover:underline"
                >
                  {{ lic.license_number }}
                </router-link>
              </td>

              <!-- Linked Application -->
              <td class="py-3 px-4 font-mono text-slate-600 whitespace-nowrap">
                <router-link
                  v-if="lic.application?.id"
                  :to="`/applications/${lic.application.id}`"
                  class="text-slate-700 hover:text-blue-900 underline"
                >
                  {{ lic.application?.application_number }}
                </router-link>
                <span v-else>—</span>
              </td>

              <!-- Media Outlet -->
              <td class="py-3 px-4 whitespace-nowrap">
                <div class="font-bold text-slate-900">{{ lic.application?.mediaOutlet?.name || '—' }}</div>
                <div v-if="lic.application?.mediaOutlet?.media_type" class="text-[10px] text-slate-500 font-mono">
                  {{ lic.application.mediaOutlet.media_type }}
                </div>
              </td>

              <!-- Licensee -->
              <td class="py-3 px-4 text-slate-700 whitespace-nowrap">
                {{ lic.application?.licensee?.full_name || '—' }}
              </td>

              <!-- Status Badge -->
              <td class="py-3 px-4 whitespace-nowrap">
                <StatusBadge :status="lic.status" />
              </td>

              <!-- Issued Date -->
              <td class="py-3 px-4 text-slate-600 whitespace-nowrap">
                {{ formatDate(lic.issued_at, locale) }}
              </td>

              <!-- Expiry Date -->
              <td class="py-3 px-4 whitespace-nowrap font-medium">
                <span :class="lic.status === 'ACTIVE' && new Date(lic.expires_at) < new Date() ? 'text-red-700 font-bold' : 'text-slate-600'">
                  {{ formatDate(lic.expires_at, locale) }}
                </span>
              </td>

              <!-- Actions (View & Revoke) -->
              <td class="py-3 px-4 text-right whitespace-nowrap space-x-1.5">
                <button
                  type="button"
                  @click="viewDetail(lic.id)"
                  class="inline-flex items-center gap-1 px-2.5 py-1 bg-slate-100 hover:bg-blue-900 hover:text-white text-slate-700 border border-slate-300 rounded text-xs font-medium transition-colors"
                >
                  <Eye class="w-3.5 h-3.5" />
                  <span>{{ t('common.view') }}</span>
                </button>

                <!-- Revoke button for ACTIVE licenses -->
                <button
                  v-if="lic.status === 'ACTIVE' && authStore.isAdmin"
                  type="button"
                  @click="openRevokeModal(lic)"
                  class="inline-flex items-center gap-1 px-2.5 py-1 bg-red-50 hover:bg-red-700 hover:text-white text-red-700 border border-red-200 rounded text-xs font-medium transition-colors"
                  :title="t('license.revoke') || 'Revoke License'"
                >
                  <Ban class="w-3.5 h-3.5" />
                  <span>{{ t('license.revoke') || 'Revoke' }}</span>
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Pagination Component -->
      <Pagination
        v-if="licenses.length > 0"
        :page="filters.page"
        :limit="filters.limit"
        :total-items="totalItems"
        :total-pages="totalPages"
        @update:page="filters.page = $event"
        @update:limit="filters.limit = $event"
      />
    </div>

    <!-- Revoke Confirmation Modal -->
    <ConfirmModal
      :is-open="revokeModalOpen"
      :danger="true"
      title="Revoke Media License"
      :message="`Are you sure you want to revoke official license ${licenseToRevoke?.license_number}? This action immediately voids legal operating rights and cannot be undone.`"
      confirm-text="Revoke License"
      :require-reason="true"
      reason-placeholder="Enter mandatory reason for revoking this license (e.g. regulatory violation)..."
      :loading="revoking"
      @confirm="handleRevokeConfirm"
      @cancel="revokeModalOpen = false"
    />
  </div>
</template>
