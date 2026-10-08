<script setup>
import { onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { useAuthStore } from '@/stores/auth.store'
import { useDashboard } from '@/composables/useDashboard'
import { formatDate, formatNumber } from '@/utils/formatters'
import StatusBadge from '@/components/common/StatusBadge.vue'
import LoadingSpinner from '@/components/common/LoadingSpinner.vue'
import EmptyState from '@/components/common/EmptyState.vue'
import ErrorAlert from '@/components/common/ErrorAlert.vue'
import {
  FileText,
  Clock,
  Search,
  CheckCircle,
  XCircle,
  Award,
  AlertTriangle,
  RefreshCw,
  Eye,
  Bell,
  CheckCheck,
  ArrowRight,
  ShieldCheck,
} from 'lucide-vue-next'

const router = useRouter()
const { t, locale } = useI18n()
const authStore = useAuthStore()
const {
  loading,
  error,
  stats,
  recentApplications,
  recentNotifications,
  fetchDashboardData,
  markAllNotificationsRead,
} = useDashboard()

onMounted(() => {
  fetchDashboardData()
})

function viewApplication(appId) {
  router.push(`/applications/${appId}`)
}
</script>

<template>
  <div class="space-y-6">
    <!-- Top Dashboard Header with Refresh Action -->
    <div class="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
      <div>
        <h1 class="text-xl font-bold text-slate-900 tracking-tight">
          {{ t('dashboard.title') }}
        </h1>
        <p class="text-xs text-slate-500 mt-1">
          {{ t('dashboard.subtitle') }}
        </p>
      </div>

      <div class="flex items-center gap-2">
        <button
          type="button"
          @click="fetchDashboardData"
          :disabled="loading"
          class="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-300 hover:bg-slate-50 active:bg-slate-100 text-slate-700 text-xs font-medium rounded transition-colors disabled:opacity-60"
        >
          <RefreshCw :class="['w-3.5 h-3.5', loading ? 'animate-spin' : '']" />
          <span>{{ t('common.refresh') }}</span>
        </button>
      </div>
    </div>

    <!-- Error Alert if API failed -->
    <ErrorAlert
      v-if="error"
      :message="error"
      :show-retry="true"
      @retry="fetchDashboardData"
    />

    <!-- Summary Statistics Grid (Responsive and No Ellipsis Truncation - docs/19) -->
    <div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-4 2xl:grid-cols-7 gap-3.5">
      <!-- 1. Total Applications -->
      <div class="flat-card bg-white border border-slate-300 rounded-md p-4 flex flex-col justify-between">
        <div class="flex items-start justify-between gap-2 text-slate-500 mb-2">
          <span class="text-[11px] font-bold uppercase tracking-wider text-slate-700 leading-tight">
            {{ t('dashboard.totalApplications') }}
          </span>
          <div class="p-1.5 bg-slate-100 rounded text-slate-700 shrink-0">
            <FileText class="w-4 h-4" />
          </div>
        </div>
        <div>
          <div class="text-2xl font-bold text-slate-900">
            {{ formatNumber(stats.totalApplications, locale) }}
          </div>
          <div class="text-[11px] text-slate-400 mt-1">
            {{ t('common.status') }}: All
          </div>
        </div>
      </div>

      <!-- 2. Pending Review (SUBMITTED) -->
      <div class="flat-card bg-white border border-slate-300 rounded-md p-4 flex flex-col justify-between">
        <div class="flex items-start justify-between gap-2 text-slate-500 mb-2">
          <span class="text-[11px] font-bold uppercase tracking-wider text-amber-800 leading-tight">
            {{ t('dashboard.pendingReview') }}
          </span>
          <div class="p-1.5 bg-amber-50 rounded text-amber-700 shrink-0">
            <Clock class="w-4 h-4" />
          </div>
        </div>
        <div>
          <div class="text-2xl font-bold text-amber-700">
            {{ formatNumber(stats.pendingReview, locale) }}
          </div>
          <div class="text-[11px] text-amber-600 mt-1">
            {{ t('status.submitted') }}
          </div>
        </div>
      </div>

      <!-- 3. Under Review -->
      <div class="flat-card bg-white border border-slate-300 rounded-md p-4 flex flex-col justify-between">
        <div class="flex items-start justify-between gap-2 text-slate-500 mb-2">
          <span class="text-[11px] font-bold uppercase tracking-wider text-blue-900 leading-tight">
            {{ t('dashboard.underReview') }}
          </span>
          <div class="p-1.5 bg-blue-50 rounded text-blue-800 shrink-0">
            <Search class="w-4 h-4" />
          </div>
        </div>
        <div>
          <div class="text-2xl font-bold text-blue-900">
            {{ formatNumber(stats.underReview, locale) }}
          </div>
          <div class="text-[11px] text-blue-600 mt-1">
            {{ t('status.underReview') }}
          </div>
        </div>
      </div>

      <!-- 4. Approved Applications -->
      <div class="flat-card bg-white border border-slate-300 rounded-md p-4 flex flex-col justify-between">
        <div class="flex items-start justify-between gap-2 text-slate-500 mb-2">
          <span class="text-[11px] font-bold uppercase tracking-wider text-emerald-800 leading-tight">
            {{ t('dashboard.approved') }}
          </span>
          <div class="p-1.5 bg-emerald-50 rounded text-emerald-700 shrink-0">
            <CheckCircle class="w-4 h-4" />
          </div>
        </div>
        <div>
          <div class="text-2xl font-bold text-emerald-700">
            {{ formatNumber(stats.approved, locale) }}
          </div>
          <div class="text-[11px] text-emerald-600 mt-1">
            {{ t('status.approved') }}
          </div>
        </div>
      </div>

      <!-- 5. Rejected Applications -->
      <div class="flat-card bg-white border border-slate-300 rounded-md p-4 flex flex-col justify-between">
        <div class="flex items-start justify-between gap-2 text-slate-500 mb-2">
          <span class="text-[11px] font-bold uppercase tracking-wider text-red-800 leading-tight">
            {{ t('dashboard.rejected') }}
          </span>
          <div class="p-1.5 bg-red-50 rounded text-red-700 shrink-0">
            <XCircle class="w-4 h-4" />
          </div>
        </div>
        <div>
          <div class="text-2xl font-bold text-red-700">
            {{ formatNumber(stats.rejected, locale) }}
          </div>
          <div class="text-[11px] text-red-600 mt-1">
            {{ t('status.rejected') }}
          </div>
        </div>
      </div>

      <!-- 6. Active Licenses (ADMIN / SUPER_ADMIN) -->
      <div class="flat-card bg-white border border-slate-300 rounded-md p-4 flex flex-col justify-between">
        <div class="flex items-start justify-between gap-2 text-slate-500 mb-2">
          <span class="text-[11px] font-bold uppercase tracking-wider text-teal-800 leading-tight">
            {{ t('dashboard.activeLicenses') }}
          </span>
          <div class="p-1.5 bg-teal-50 rounded text-teal-800 shrink-0">
            <Award class="w-4 h-4" />
          </div>
        </div>
        <div>
          <div class="text-2xl font-bold text-teal-800">
            {{ formatNumber(stats.activeLicenses, locale) }}
          </div>
          <div class="text-[11px] text-teal-600 mt-1">
            {{ t('status.active') }}
          </div>
        </div>
      </div>

      <!-- 7. Expired Licenses (ADMIN / SUPER_ADMIN) -->
      <div class="flat-card bg-white border border-slate-300 rounded-md p-4 flex flex-col justify-between">
        <div class="flex items-start justify-between gap-2 text-slate-500 mb-2">
          <span class="text-[11px] font-bold uppercase tracking-wider text-slate-700 leading-tight">
            {{ t('dashboard.expiredLicenses') }}
          </span>
          <div class="p-1.5 bg-zinc-100 rounded text-zinc-700 shrink-0">
            <AlertTriangle class="w-4 h-4" />
          </div>
        </div>
        <div>
          <div class="text-2xl font-bold text-zinc-700">
            {{ formatNumber(stats.expiredLicenses, locale) }}
          </div>
          <div class="text-[11px] text-zinc-500 mt-1">
            {{ t('status.expired') }}
          </div>
        </div>
      </div>
    </div>

    <!-- Official Synchronization Notice -->
    <div class="flex items-center gap-2 px-3.5 py-2 bg-slate-50 border border-slate-200 rounded text-xs text-slate-600">
      <ShieldCheck class="w-4 h-4 text-blue-900 shrink-0" />
      <span>{{ t('dashboard.statsNotice') }}</span>
    </div>

    <!-- Main Grid: Recent Applications & Recent Notifications -->
    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <!-- Recent Applications (2 Columns) -->
      <div class="lg:col-span-2 flat-card bg-white border border-slate-300 rounded-md overflow-hidden flex flex-col">
        <!-- Panel Header -->
        <div class="px-5 py-4 border-b border-slate-200 flex items-center justify-between">
          <div class="flex items-center gap-2">
            <FileText class="w-4 h-4 text-blue-900" />
            <h2 class="text-sm font-bold text-slate-900">
              {{ t('dashboard.recentApplications') }}
            </h2>
          </div>
          <router-link
            to="/applications"
            class="inline-flex items-center gap-1 text-xs font-semibold text-blue-900 hover:underline"
          >
            <span>{{ t('dashboard.viewAll') }}</span>
            <ArrowRight class="w-3.5 h-3.5" />
          </router-link>
        </div>

        <!-- Panel Body / Table -->
        <div class="flex-1 overflow-x-auto">
          <LoadingSpinner v-if="loading && recentApplications.length === 0" />

          <EmptyState
            v-else-if="recentApplications.length === 0"
            :title="t('dashboard.noRecentApplications')"
          />

          <table v-else class="w-full text-left border-collapse text-xs">
            <thead>
              <tr class="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase text-[10px] tracking-wider">
                <th class="py-3 px-4">{{ t('dashboard.applicationNumber') }}</th>
                <th class="py-3 px-4">{{ t('dashboard.mediaOutlet') }}</th>
                <th class="py-3 px-4">{{ t('dashboard.applicant') }}</th>
                <th class="py-3 px-4">{{ t('common.status') }}</th>
                <th class="py-3 px-4">{{ t('dashboard.submittedDate') }}</th>
                <th class="py-3 px-4 text-right">{{ t('dashboard.action') }}</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-200">
              <tr
                v-for="app in recentApplications"
                :key="app.id"
                class="hover:bg-slate-50 transition-colors"
              >
                <!-- Application Number -->
                <td class="py-3 px-4 font-mono font-bold text-blue-900 whitespace-nowrap">
                  {{ app.application_number }}
                </td>

                <!-- Media Outlet Name -->
                <td class="py-3 px-4 font-medium text-slate-900 whitespace-nowrap">
                  {{ app.mediaOutlet?.name || '—' }}
                </td>

                <!-- Licensee / Applicant -->
                <td class="py-3 px-4 text-slate-600 whitespace-nowrap">
                  {{ app.licensee?.full_name || app.user?.name || '—' }}
                </td>

                <!-- Status Badge -->
                <td class="py-3 px-4 whitespace-nowrap">
                  <StatusBadge :status="app.status" />
                </td>

                <!-- Submitted Date -->
                <td class="py-3 px-4 text-slate-500 whitespace-nowrap">
                  {{ formatDate(app.submitted_at || app.created_at, locale) }}
                </td>

                <!-- Actions -->
                <td class="py-3 px-4 text-right whitespace-nowrap">
                  <button
                    type="button"
                    @click="viewApplication(app.id)"
                    class="inline-flex items-center gap-1 px-2.5 py-1 bg-slate-100 hover:bg-blue-900 hover:text-white text-slate-700 border border-slate-300 rounded text-[11px] font-medium transition-colors"
                  >
                    <Eye class="w-3.5 h-3.5" />
                    <span>{{ t('common.view') }}</span>
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- Recent Notifications (1 Column) -->
      <div class="flat-card bg-white border border-slate-300 rounded-md overflow-hidden flex flex-col">
        <!-- Panel Header -->
        <div class="px-5 py-4 border-b border-slate-200 flex items-center justify-between">
          <div class="flex items-center gap-2">
            <Bell class="w-4 h-4 text-amber-700" />
            <h2 class="text-sm font-bold text-slate-900">
              {{ t('dashboard.recentNotifications') }}
            </h2>
          </div>
          <button
            v-if="recentNotifications.some(n => !n.is_read)"
            type="button"
            @click="markAllNotificationsRead"
            class="inline-flex items-center gap-1 text-[11px] text-slate-500 hover:text-blue-900 transition-colors"
            :title="t('dashboard.markAllAsRead')"
          >
            <CheckCheck class="w-3.5 h-3.5" />
            <span>{{ t('dashboard.markAllAsRead') }}</span>
          </button>
        </div>

        <!-- Panel Body -->
        <div class="flex-1 p-4 overflow-y-auto max-h-[460px]">
          <LoadingSpinner v-if="loading && recentNotifications.length === 0" />

          <EmptyState
            v-else-if="recentNotifications.length === 0"
            :title="t('dashboard.noRecentNotifications')"
          />

          <ul v-else class="space-y-3">
            <li
              v-for="item in recentNotifications"
              :key="item.id"
              :class="[
                'p-3 rounded border text-xs transition-colors',
                item.is_read
                  ? 'bg-slate-50/70 border-slate-200 text-slate-600'
                  : 'bg-blue-50/50 border-blue-200 text-slate-900 font-medium'
              ]"
            >
              <div class="flex items-start justify-between gap-2">
                <span class="font-bold text-slate-900">{{ item.title }}</span>
                <span
                  v-if="!item.is_read"
                  class="w-2 h-2 rounded-full bg-blue-700 shrink-0 mt-1"
                ></span>
              </div>
              <p class="text-[11px] text-slate-600 mt-1 leading-relaxed">
                {{ item.message }}
              </p>
              <div class="text-[10px] text-slate-400 mt-2">
                {{ formatDate(item.created_at, locale) }}
              </div>
            </li>
          </ul>
        </div>

        <!-- Footer Link -->
        <div class="p-3 bg-slate-50 border-t border-slate-200 text-center">
          <router-link
            to="/notifications"
            class="text-xs font-semibold text-blue-900 hover:underline"
          >
            {{ t('dashboard.viewAll') }} →
          </router-link>
        </div>
      </div>
    </div>
  </div>
</template>
