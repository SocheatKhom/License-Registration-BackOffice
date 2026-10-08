<script setup>
import { ref, reactive, watch, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { applicationsApi } from '@/api/applications.api'
import { formatDate, formatNumber } from '@/utils/formatters'
import { useDebounce } from '@/composables/useDebounce'
import StatusBadge from '@/components/common/StatusBadge.vue'
import LoadingSpinner from '@/components/common/LoadingSpinner.vue'
import EmptyState from '@/components/common/EmptyState.vue'
import ErrorAlert from '@/components/common/ErrorAlert.vue'
import Pagination from '@/components/common/Pagination.vue'
import {
  FileText,
  Search,
  Filter,
  RotateCcw,
  Eye,
  RefreshCw,
} from 'lucide-vue-next'

const router = useRouter()
const { t, locale } = useI18n()

// Filters state
const searchInput = ref('')
const debouncedSearch = useDebounce(searchInput, 400)

const filters = reactive({
  status: '',
  mediaType: '',
  sortBy: 'createdAt',
  sortOrder: 'DESC',
  page: 1,
  limit: 10,
})

const applications = ref([])
const totalItems = ref(0)
const totalPages = ref(1)
const loading = ref(false)
const error = ref(null)

async function fetchApplications() {
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
    if (filters.mediaType) {
      params.mediaType = filters.mediaType
    }

    const response = await applicationsApi.list(params)

    applications.value = Array.isArray(response?.data)
      ? response.data
      : (response?.data?.applications || [])

    totalItems.value = response?.pagination?.totalItems ?? (response?.data?.pagination?.totalItems ?? applications.value.length)
    totalPages.value = response?.pagination?.totalPages ?? (response?.data?.pagination?.totalPages ?? 1)
  } catch (err) {
    console.error('Failed to fetch applications:', err)
    error.value = err.message || 'Unable to retrieve applications list.'
  } finally {
    loading.value = false
  }
}

// Watch filters to trigger fetch
watch(
  [debouncedSearch, () => filters.status, () => filters.mediaType, () => filters.sortBy, () => filters.sortOrder],
  () => {
    filters.page = 1
    fetchApplications()
  }
)

watch(
  [() => filters.page, () => filters.limit],
  () => {
    fetchApplications()
  }
)

onMounted(() => {
  fetchApplications()
})

function resetFilters() {
  searchInput.value = ''
  filters.status = ''
  filters.mediaType = ''
  filters.sortBy = 'createdAt'
  filters.sortOrder = 'DESC'
  filters.page = 1
}

function viewDetail(id) {
  router.push(`/applications/${id}`)
}
</script>

<template>
  <div class="space-y-6">
    <!-- Header -->
    <div class="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
      <div>
        <h1 class="text-xl font-bold text-slate-900 tracking-tight">
          {{ t('navigation.applications') }}
        </h1>
        <p class="text-xs text-slate-500 mt-1">
          គ្រប់គ្រង និងត្រួតពិនិត្យពាក្យស្នើសុំអាជ្ញាបណ្ណសារព័ត៌មាន (Application Management)
        </p>
      </div>

      <button
        type="button"
        @click="fetchApplications"
        :disabled="loading"
        class="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-medium rounded transition-colors disabled:opacity-60"
      >
        <RefreshCw :class="['w-3.5 h-3.5', loading ? 'animate-spin' : '']" />
        <span>{{ t('common.refresh') }}</span>
      </button>
    </div>

    <!-- Error Alert -->
    <ErrorAlert
      v-if="error"
      :message="error"
      :show-retry="true"
      @retry="fetchApplications"
    />

    <!-- Filter & Search Toolbar (Flat Card) -->
    <div class="flat-card bg-white border border-slate-300 rounded-md p-4">
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
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
              :placeholder="t('application.searchPlaceholder') || 'Search by APP# or Outlet name...'"
              class="flat-input pl-10 text-xs"
            />
          </div>
        </div>

        <!-- Status Filter -->
        <div>
          <label class="block text-[11px] font-semibold text-slate-700 mb-1">
            {{ t('common.status') }}
          </label>
          <select
            v-model="filters.status"
            class="flat-input text-xs"
          >
            <option value="">{{ t('common.allStatuses') || 'All Statuses' }}</option>
            <option value="DRAFT">{{ t('status.draft') }}</option>
            <option value="SUBMITTED">{{ t('status.submitted') }}</option>
            <option value="UNDER_REVIEW">{{ t('status.underReview') }}</option>
            <option value="NEEDS_INFORMATION">{{ t('status.needsInformation') }}</option>
            <option value="APPROVED">{{ t('status.approved') }}</option>
            <option value="REJECTED">{{ t('status.rejected') }}</option>
          </select>
        </div>

        <!-- Media Type Filter -->
        <div>
          <label class="block text-[11px] font-semibold text-slate-700 mb-1">
            {{ t('application.mediaType') || 'Media Type' }}
          </label>
          <select
            v-model="filters.mediaType"
            class="flat-input text-xs"
          >
            <option value="">{{ t('common.allTypes') || 'All Media Types' }}</option>
            <option value="ONLINE">ONLINE (អនឡាញ)</option>
            <option value="TELEVISION">TELEVISION (ទូរទស្សន៍)</option>
            <option value="RADIO">RADIO (វិទ្យុ)</option>
            <option value="PRINT">PRINT (បោះពុម្ព)</option>
            <option value="PUBLISHING">PUBLISHING (ការបោះផ្សាយ)</option>
            <option value="OTHER">OTHER (ផ្សេងៗ)</option>
          </select>
        </div>

        <!-- Sort Filter & Reset -->
        <div class="flex items-end gap-2">
          <div class="flex-1">
            <label class="block text-[11px] font-semibold text-slate-700 mb-1">
              {{ t('common.sort') || 'Sort By' }}
            </label>
            <select
              v-model="filters.sortBy"
              class="flat-input text-xs"
            >
              <option value="createdAt">{{ t('common.dateCreated') || 'Date Created' }}</option>
              <option value="submittedAt">{{ t('application.submittedDate') }}</option>
              <option value="applicationNumber">{{ t('application.applicationNumber') }}</option>
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

    <!-- Applications Table Panel -->
    <div class="flat-card bg-white border border-slate-300 rounded-md overflow-hidden">
      <!-- Loading State -->
      <LoadingSpinner v-if="loading && applications.length === 0" />

      <!-- Empty State -->
      <EmptyState
        v-else-if="applications.length === 0"
        :title="t('application.noApplicationsFound') || 'No applications match your filter criteria.'"
      />

      <!-- Table Content -->
      <div v-else class="overflow-x-auto">
        <table class="w-full text-left border-collapse text-xs">
          <thead>
            <tr class="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase text-[10px] tracking-wider">
              <th class="py-3 px-4">{{ t('application.applicationNumber') }}</th>
              <th class="py-3 px-4">{{ t('application.mediaOutlet') }}</th>
              <th class="py-3 px-4">{{ t('application.applicant') }}</th>
              <th class="py-3 px-4">{{ t('common.status') }}</th>
              <th class="py-3 px-4">{{ t('application.submittedDate') }}</th>
              <th class="py-3 px-4">{{ t('common.dateCreated') || 'Created At' }}</th>
              <th class="py-3 px-4 text-right">{{ t('common.actions') }}</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-200">
            <tr
              v-for="app in applications"
              :key="app.id"
              class="hover:bg-slate-50 transition-colors"
            >
              <!-- Application Number (Clickable Link) -->
              <td class="py-3 px-4 font-mono font-bold whitespace-nowrap">
                <router-link
                  :to="`/applications/${app.id}`"
                  class="text-blue-900 hover:underline"
                >
                  {{ app.application_number }}
                </router-link>
              </td>

              <!-- Media Outlet Name & Media Type Tag -->
              <td class="py-3 px-4 whitespace-nowrap">
                <div class="font-bold text-slate-900">{{ app.mediaOutlet?.name || '—' }}</div>
                <div v-if="app.mediaOutlet?.media_type" class="text-[10px] text-slate-500 font-mono">
                  {{ app.mediaOutlet.media_type }}
                </div>
              </td>

              <!-- Applicant (Licensee) -->
              <td class="py-3 px-4 text-slate-700 whitespace-nowrap">
                <div>{{ app.licensee?.full_name || app.user?.name || '—' }}</div>
                <div v-if="app.licensee?.position" class="text-[10px] text-slate-400">
                  {{ app.licensee.position }}
                </div>
              </td>

              <!-- Status Badge -->
              <td class="py-3 px-4 whitespace-nowrap">
                <StatusBadge :status="app.status" />
              </td>

              <!-- Submitted Date -->
              <td class="py-3 px-4 text-slate-600 whitespace-nowrap">
                {{ formatDate(app.submitted_at, locale) }}
              </td>

              <!-- Created Date -->
              <td class="py-3 px-4 text-slate-500 whitespace-nowrap font-mono text-[11px]">
                {{ formatDate(app.created_at, locale) }}
              </td>

              <!-- Actions -->
              <td class="py-3 px-4 text-right whitespace-nowrap">
                <button
                  type="button"
                  @click="viewDetail(app.id)"
                  class="inline-flex items-center gap-1.5 px-3 py-1 bg-slate-100 hover:bg-blue-900 hover:text-white text-slate-700 border border-slate-300 rounded text-xs font-medium transition-colors"
                >
                  <Eye class="w-3.5 h-3.5" />
                  <span>{{ t('common.view') }}</span>
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Pagination Component -->
      <Pagination
        v-if="applications.length > 0"
        :page="filters.page"
        :limit="filters.limit"
        :total-items="totalItems"
        :total-pages="totalPages"
        @update:page="filters.page = $event"
        @update:limit="filters.limit = $event"
      />
    </div>
  </div>
</template>
