<script setup>
import { ref, reactive, watch, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { notificationsApi } from '@/api/notifications.api'
import { useAppStore } from '@/stores/app.store'
import { formatDateTime } from '@/utils/formatters'
import LoadingSpinner from '@/components/common/LoadingSpinner.vue'
import EmptyState from '@/components/common/EmptyState.vue'
import ErrorAlert from '@/components/common/ErrorAlert.vue'
import Pagination from '@/components/common/Pagination.vue'
import {
  Bell,
  CheckCheck,
  CheckCircle,
  XCircle,
  HelpCircle,
  FileText,
  Award,
  RefreshCw,
  Clock,
  RotateCcw,
} from 'lucide-vue-next'

const { t, locale } = useI18n()
const appStore = useAppStore()

const filters = reactive({
  isRead: '', // '' = all, 'false' = unread, 'true' = read
  page: 1,
  limit: 10,
})

const notifications = ref([])
const unreadCount = ref(0)
const totalItems = ref(0)
const totalPages = ref(1)
const loading = ref(false)
const markingAll = ref(false)
const markingId = ref(null)
const error = ref(null)

async function fetchNotifications() {
  loading.value = true
  error.value = null

  try {
    const params = {
      page: filters.page,
      limit: filters.limit,
    }

    if (filters.isRead !== '') {
      params.isRead = filters.isRead
    }

    const response = await notificationsApi.getMyNotifications(params)

    notifications.value = Array.isArray(response?.data?.notifications)
      ? response.data.notifications
      : (Array.isArray(response?.data) ? response.data : [])

    unreadCount.value = response?.data?.unreadCount ?? 0
    totalItems.value = response?.pagination?.totalItems ?? notifications.value.length
    totalPages.value = response?.pagination?.totalPages ?? 1

    // Sync globally with appStore so header reflects current count
    appStore.unreadNotificationsCount = unreadCount.value
  } catch (err) {
    console.error('Failed to load notifications:', err)
    error.value = err.message || 'Unable to retrieve notifications.'
  } finally {
    loading.value = false
  }
}

watch(
  () => filters.isRead,
  () => {
    filters.page = 1
    fetchNotifications()
  }
)

watch(
  [() => filters.page, () => filters.limit],
  () => {
    fetchNotifications()
  }
)

onMounted(() => {
  fetchNotifications()
})

async function markSingleAsRead(item) {
  if (item.is_read || markingId.value) return
  markingId.value = item.id

  try {
    await notificationsApi.markAsRead(item.id)
    item.is_read = true
    if (unreadCount.value > 0) {
      unreadCount.value--
      appStore.unreadNotificationsCount = unreadCount.value
    }
  } catch (err) {
    console.error('Failed to mark notification as read:', err)
  } finally {
    markingId.value = null
  }
}

async function markAllAsRead() {
  if (markingAll.value || unreadCount.value === 0) return
  markingAll.value = true

  try {
    await notificationsApi.markAllAsRead()
    notifications.value.forEach(n => {
      n.is_read = true
    })
    unreadCount.value = 0
    appStore.unreadNotificationsCount = 0
  } catch (err) {
    console.error('Failed to mark all as read:', err)
  } finally {
    markingAll.value = false
  }
}

function getNotificationIcon(type) {
  switch (type) {
    case 'APPLICATION_APPROVED':
      return { icon: CheckCircle, bgClass: 'bg-emerald-50 text-emerald-700 border-emerald-300' }
    case 'LICENSE_ISSUED':
      return { icon: Award, bgClass: 'bg-blue-50 text-blue-900 border-blue-300' }
    case 'APPLICATION_REJECTED':
      return { icon: XCircle, bgClass: 'bg-red-50 text-red-700 border-red-300' }
    case 'APPLICATION_NEEDS_INFORMATION':
      return { icon: HelpCircle, bgClass: 'bg-amber-50 text-amber-700 border-amber-300' }
    case 'APPLICATION_SUBMITTED':
    case 'APPLICATION_UNDER_REVIEW':
    default:
      return { icon: FileText, bgClass: 'bg-slate-100 text-slate-700 border-slate-300' }
  }
}
</script>

<template>
  <div class="space-y-6">
    <!-- Header -->
    <div class="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
      <div>
        <div class="flex items-center gap-2.5">
          <h1 class="text-xl font-bold text-slate-900 tracking-tight">
            {{ t('notification.centerTitle') }}
          </h1>
          <span
            v-if="unreadCount > 0"
            class="px-2 py-0.5 bg-red-600 text-white text-[11px] font-bold rounded-full"
          >
            {{ unreadCount }}
          </span>
        </div>
        <p class="text-xs text-slate-500 mt-1">
          {{ t('notification.centerSubtitle') }}
        </p>
      </div>

      <div class="flex items-center gap-2">
        <!-- Mark All As Read Button -->
        <button
          type="button"
          @click="markAllAsRead"
          :disabled="unreadCount === 0 || markingAll"
          class="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-semibold rounded transition-colors disabled:opacity-50"
        >
          <CheckCheck :class="['w-4 h-4', markingAll ? 'animate-pulse text-blue-900' : 'text-slate-500']" />
          <span>{{ t('notification.markAllAsRead') }}</span>
        </button>

        <!-- Refresh Button -->
        <button
          type="button"
          @click="fetchNotifications"
          :disabled="loading"
          class="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-medium rounded transition-colors disabled:opacity-60"
        >
          <RefreshCw :class="['w-3.5 h-3.5', loading ? 'animate-spin' : '']" />
          <span>{{ t('common.refresh') }}</span>
        </button>
      </div>
    </div>

    <!-- Error Alert -->
    <ErrorAlert v-if="error" :message="error" :show-retry="true" @retry="fetchNotifications" />

    <!-- Filter Bar (Flat Tabs) -->
    <div class="flat-card bg-white border border-slate-300 rounded-md p-3 flex items-center justify-between gap-3">
      <div class="inline-flex rounded border border-slate-300 bg-slate-50 p-0.5 text-xs">
        <button
          type="button"
          @click="filters.isRead = ''"
          :class="[
            'px-3 py-1 font-semibold rounded transition-colors',
            filters.isRead === '' ? 'bg-white text-blue-900 shadow-none border border-slate-300 font-bold' : 'text-slate-600 hover:text-slate-900'
          ]"
        >
          {{ t('notification.all') }}
        </button>
        <button
          type="button"
          @click="filters.isRead = 'false'"
          :class="[
            'px-3 py-1 font-semibold rounded transition-colors',
            filters.isRead === 'false' ? 'bg-white text-blue-900 shadow-none border border-slate-300 font-bold' : 'text-slate-600 hover:text-slate-900'
          ]"
        >
          {{ t('notification.unreadOnly') }}
          <span v-if="unreadCount > 0" class="ml-1 px-1.5 py-0.2 bg-red-100 text-red-700 rounded-full text-[10px]">
            {{ unreadCount }}
          </span>
        </button>
        <button
          type="button"
          @click="filters.isRead = 'true'"
          :class="[
            'px-3 py-1 font-semibold rounded transition-colors',
            filters.isRead === 'true' ? 'bg-white text-blue-900 shadow-none border border-slate-300 font-bold' : 'text-slate-600 hover:text-slate-900'
          ]"
        >
          {{ t('notification.readOnly') }}
        </button>
      </div>

      <div class="text-[11px] text-slate-500 font-medium">
        {{ totalItems }} {{ t('common.records') }}
      </div>
    </div>

    <!-- Notification List Panel -->
    <div class="flat-card bg-white border border-slate-300 rounded-md overflow-hidden">
      <!-- Loading State -->
      <LoadingSpinner v-if="loading && notifications.length === 0" />

      <!-- Empty State -->
      <EmptyState
        v-else-if="notifications.length === 0"
        :title="t('notification.noNotifications')"
      />

      <!-- Notifications List Items -->
      <div v-else class="divide-y divide-slate-200">
        <div
          v-for="item in notifications"
          :key="item.id"
          :class="[
            'p-4 flex items-start justify-between gap-4 transition-colors',
            item.is_read ? 'bg-white hover:bg-slate-50/70' : 'bg-blue-50/30 hover:bg-blue-50/60'
          ]"
        >
          <div class="flex items-start gap-3.5 min-w-0">
            <!-- Icon -->
            <div :class="['p-2 rounded border shrink-0 mt-0.5', getNotificationIcon(item.type).bgClass]">
              <component :is="getNotificationIcon(item.type).icon" class="w-4 h-4" />
            </div>

            <!-- Content -->
            <div class="space-y-1 min-w-0">
              <div class="flex items-center gap-2 flex-wrap">
                <span class="text-xs font-bold text-slate-900">
                  {{ item.title }}
                </span>
                <span
                  v-if="!item.is_read"
                  class="inline-block w-2 h-2 rounded-full bg-blue-900 shrink-0"
                  title="Unread"
                ></span>
                <span class="text-[10px] font-mono px-1.5 py-0.2 bg-slate-100 text-slate-600 rounded border border-slate-200">
                  {{ item.type }}
                </span>
              </div>

              <p class="text-xs text-slate-700 leading-relaxed break-words">
                {{ item.message }}
              </p>

              <div class="flex items-center gap-1.5 text-[11px] text-slate-400 font-mono pt-1">
                <Clock class="w-3 h-3 text-slate-400" />
                <span>{{ formatDateTime(item.createdAt || item.created_at, locale) }}</span>
              </div>
            </div>
          </div>

          <!-- Action: Mark as read button if unread -->
          <div class="shrink-0 flex items-center">
            <button
              v-if="!item.is_read"
              type="button"
              @click="markSingleAsRead(item)"
              :disabled="markingId === item.id"
              class="inline-flex items-center gap-1 px-2.5 py-1 bg-white hover:bg-blue-900 hover:text-white border border-slate-300 text-slate-700 text-[11px] font-semibold rounded transition-colors disabled:opacity-50"
            >
              <CheckCheck class="w-3.5 h-3.5" />
              <span>{{ t('notification.markAsRead') }}</span>
            </button>
            <span v-else class="text-[10px] text-slate-400 font-medium px-2 py-1">
              {{ t('notification.read') }}
            </span>
          </div>
        </div>
      </div>

      <!-- Pagination Component -->
      <Pagination
        v-if="notifications.length > 0"
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
