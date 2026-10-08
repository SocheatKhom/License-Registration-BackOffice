<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { useAuthStore } from '@/stores/auth.store'
import { useAppStore } from '@/stores/app.store'
import LanguageSwitcher from '@/components/common/LanguageSwitcher.vue'
import ConfirmModal from '@/components/common/ConfirmModal.vue'
import {
  Menu,
  Bell,
  LogOut,
  User,
} from 'lucide-vue-next'

const router = useRouter()
const { t } = useI18n()
const authStore = useAuthStore()
const appStore = useAppStore()

const showLogoutModal = ref(false)
const isLoggingOut = ref(false)

onMounted(() => {
  if (authStore.isAuthenticated) {
    appStore.fetchUnreadNotifications()
  }
})

function openLogoutModal() {
  showLogoutModal.value = true
}

async function handleConfirmLogout() {
  try {
    isLoggingOut.value = true
    await authStore.logout()
    showLogoutModal.value = false
    router.push('/login')
  } catch (err) {
    console.error('Logout error:', err)
  } finally {
    isLoggingOut.value = false
  }
}

function handleCancelLogout() {
  showLogoutModal.value = false
}
</script>

<template>
  <header class="bg-white border-b border-slate-300 h-16 px-4 sm:px-6 flex items-center justify-between sticky top-0 z-20 shadow-none">
    <!-- Left: Ministry Logo & System Branding -->
    <div class="flex items-center gap-3 sm:gap-4 min-w-0">
      <!-- Mobile Sidebar Toggle (for phones/tablets) -->
      <button
        type="button"
        @click="appStore.toggleMobileSidebar"
        class="lg:hidden p-1.5 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded border border-slate-200"
        :aria-label="t('common.actions')"
      >
        <Menu class="w-5 h-5" />
      </button>

      <!-- Ministry Branding Logo & Name -->
      <div class="flex items-center gap-2.5 overflow-hidden">
        <img
          src="/ministry-logo.png"
          alt="Ministry of Information Logo"
          class="w-9 h-9 object-contain shrink-0"
        />
        <div class="hidden sm:block overflow-hidden whitespace-nowrap">
          <div class="text-xs font-bold text-slate-900 tracking-tight truncate">
            {{ t('app.ministry') }}
          </div>
          <div class="text-[10px] text-slate-500 font-medium truncate">
            {{ t('app.title') }}
          </div>
        </div>
      </div>
    </div>

    <!-- Right: Language Switcher, Notifications, User Badge, Logout -->
    <div class="flex items-center gap-2 sm:gap-3 shrink-0">
      <!-- Language Switcher with Flags -->
      <LanguageSwitcher />

      <!-- Notifications Link & Unread Badge -->
      <router-link
        to="/notifications"
        class="relative p-2 text-slate-600 hover:text-blue-900 hover:bg-slate-100 rounded border border-slate-200 transition-colors"
        :title="t('navigation.notifications')"
      >
        <Bell class="w-4 h-4" />
        <span
          v-if="appStore.unreadNotificationsCount > 0"
          class="absolute -top-1 -right-1 bg-red-600 text-white text-[10px] font-bold px-1.5 py-0.2 rounded-full min-w-4 text-center"
        >
          {{ appStore.unreadNotificationsCount > 99 ? '99+' : appStore.unreadNotificationsCount }}
        </span>
      </router-link>

      <!-- Vertical Divider -->
      <div class="hidden sm:block h-6 w-px bg-slate-300"></div>

      <!-- Current User Profile Info -->
      <div class="flex items-center gap-2">
        <div class="w-8 h-8 rounded-full bg-slate-100 border border-slate-300 flex items-center justify-center font-bold text-slate-700 text-xs">
          <User class="w-4 h-4 text-slate-600" />
        </div>
        <div class="hidden md:block text-left text-xs leading-tight">
          <div class="font-bold text-slate-900">
            {{ authStore.displayName }}
          </div>
          <div class="text-[11px] text-slate-500 font-medium mt-0.5">
            <span class="inline-block px-1.5 py-0.2 bg-blue-100 text-blue-900 rounded font-semibold text-[10px]">
              {{ authStore.currentUser?.role }}
            </span>
          </div>
        </div>
      </div>

      <!-- Logout Button (Triggers Confirmation Modal) -->
      <button
        type="button"
        @click="openLogoutModal"
        class="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-red-700 bg-red-50 hover:bg-red-100 border border-red-200 rounded transition-colors ml-1 cursor-pointer"
        :title="t('auth.logout')"
      >
        <LogOut class="w-3.5 h-3.5" />
        <span class="hidden sm:inline">{{ t('auth.logout') }}</span>
      </button>
    </div>

    <!-- Official Government Logout Confirmation Modal -->
    <ConfirmModal
      :is-open="showLogoutModal"
      :title="t('auth.logout')"
      :message="t('auth.logoutConfirm')"
      :confirm-text="t('auth.logout')"
      :cancel-text="t('common.cancel')"
      :danger="true"
      :loading="isLoggingOut"
      @confirm="handleConfirmLogout"
      @cancel="handleCancelLogout"
    />
  </header>
</template>
