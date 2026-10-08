<script setup>
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { useAuthStore } from '@/stores/auth.store'
import { useAppStore } from '@/stores/app.store'
import { ROLES } from '@/constants/roles'
import {
  LayoutDashboard,
  FileText,
  Award,
  Users,
  ClipboardList,
  Bell,
  PanelLeftClose,
  PanelLeftOpen,
  X,
} from 'lucide-vue-next'

const route = useRoute()
const { t } = useI18n()
const authStore = useAuthStore()
const appStore = useAppStore()

// Navigation menu definition with role permission matrix
const menuItems = computed(() => {
  const items = [
    {
      name: 'dashboard',
      path: '/dashboard',
      label: t('navigation.dashboard'),
      icon: LayoutDashboard,
      roles: [ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.OFFICER],
    },
    {
      name: 'applications',
      path: '/applications',
      label: t('navigation.applications'),
      icon: FileText,
      roles: [ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.OFFICER],
    },
    {
      name: 'licenses',
      path: '/licenses',
      label: t('navigation.licenses'),
      icon: Award,
      roles: [ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.OFFICER],
    },
    {
      name: 'users',
      path: '/users',
      label: t('navigation.users'),
      icon: Users,
      roles: [ROLES.SUPER_ADMIN], // SUPER_ADMIN only
    },
    {
      name: 'audit-logs',
      path: '/audit-logs',
      label: t('navigation.auditLogs'),
      icon: ClipboardList,
      roles: [ROLES.SUPER_ADMIN], // SUPER_ADMIN only
    },
    {
      name: 'notifications',
      path: '/notifications',
      label: t('navigation.notifications'),
      icon: Bell,
      roles: [ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.OFFICER],
      badge: appStore.unreadNotificationsCount,
    },
  ]

  const userRole = authStore.userRole
  return items.filter(item => item.roles.includes(userRole))
})

function isActive(itemPath) {
  if (itemPath === '/dashboard') {
    return route.path === '/dashboard'
  }
  return route.path.startsWith(itemPath)
}

function handleNavClick() {
  appStore.closeMobileSidebar()
}
</script>

<template>
  <div class="h-full flex shrink-0">
    <!-- Mobile Backdrop Overlay -->
    <div
      v-if="appStore.mobileSidebarOpen"
      @click="appStore.closeMobileSidebar"
      class="fixed inset-0 bg-slate-900/40 z-30 lg:hidden transition-opacity"
      aria-hidden="true"
    ></div>

    <!-- Clean Light Government Sidebar Container with Continuous Full Screen Height -->
    <aside
      :class="[
        'fixed inset-y-0 left-0 z-40 bg-white text-slate-800 flex flex-col border-r border-slate-300 transition-all duration-200 lg:static lg:translate-x-0 h-full shrink-0',
        appStore.sidebarCollapsed ? 'lg:w-20' : 'lg:w-64',
        appStore.mobileSidebarOpen ? 'translate-x-0 w-64 shadow-xl' : '-translate-x-full w-64'
      ]"
    >
      <!-- Mobile Header in Drawer -->
      <div class="h-16 px-4 flex items-center justify-between border-b border-slate-200 lg:hidden bg-slate-50 shrink-0">
        <div class="flex items-center gap-2">
          <img
            src="/ministry-logo.png"
            alt="Ministry of Information Logo"
            class="w-7 h-7 object-contain shrink-0"
          />
          <span class="text-xs font-bold text-slate-900 truncate">{{ t('app.ministry') }}</span>
        </div>
        <button
          type="button"
          @click="appStore.closeMobileSidebar"
          class="p-1.5 text-slate-500 hover:text-slate-800 rounded hover:bg-slate-200"
          :aria-label="t('common.close')"
        >
          <X class="w-5 h-5" />
        </button>
      </div>

      <!-- Top Sidebar Header with Ministry of Information Logo, Text, and Toggle Button -->
      <div
        :class="[
          'h-14 flex items-center border-b border-slate-200 bg-slate-50/90 shrink-0 transition-all px-3',
          appStore.sidebarCollapsed ? 'justify-center px-1.5' : 'justify-between gap-2'
        ]"
      >
        <!-- Expanded State: Logo + Ministry of Information Text -->
        <div v-show="!appStore.sidebarCollapsed" class="flex items-center gap-2.5 min-w-0">
          <img
            src="/ministry-logo.png"
            alt="Ministry of Information Logo"
            class="w-8 h-8 object-contain shrink-0"
          />
          <div class="truncate">
            <div class="text-xs font-bold text-slate-900 leading-tight truncate">
              {{ t('app.ministry') }}
            </div>
            <div class="text-[10px] text-slate-500 font-medium truncate">
              {{ t('app.portalName') }}
            </div>
          </div>
        </div>

        <!-- Collapsed State: Logo Only -->
        <div v-show="appStore.sidebarCollapsed" class="flex items-center justify-center">
          <button
            type="button"
            @click="appStore.toggleSidebar"
            class="p-1 text-slate-600 hover:text-blue-900 bg-white hover:bg-slate-100 border border-slate-200 hover:border-slate-300 rounded shadow-none transition-colors"
            :title="t('sidebar.expand') || 'Expand Sidebar'"
          >
            <PanelLeftOpen class="w-4 h-4 text-blue-900" />
          </button>
        </div>

        <!-- Dedicated Sidebar Collapse/Expand Toggle Button (Expanded State) -->
        <button
          v-show="!appStore.sidebarCollapsed"
          type="button"
          @click="appStore.toggleSidebar"
          class="inline-flex items-center justify-center p-1.5 text-slate-600 hover:text-blue-900 bg-white hover:bg-slate-100 border border-slate-200 hover:border-slate-300 rounded shadow-none transition-colors shrink-0"
          :title="t('sidebar.collapse') || 'Collapse Sidebar'"
          :aria-label="t('sidebar.collapse') || 'Collapse Sidebar'"
        >
          <PanelLeftClose class="w-4 h-4" />
        </button>
      </div>

      <!-- Navigation Menu -->
      <nav class="flex-1 py-3 px-2.5 space-y-1 overflow-y-auto">
        <router-link
          v-for="item in menuItems"
          :key="item.name"
          :to="item.path"
          @click="handleNavClick"
          :class="[
            'flex items-center rounded text-xs transition-colors relative',
            appStore.sidebarCollapsed ? 'justify-center p-3 my-0.5' : 'gap-3 px-3 py-2.5',
            isActive(item.path)
              ? 'bg-blue-50 text-blue-900 font-bold border-l-4 border-blue-900'
              : 'text-slate-700 hover:bg-slate-100 hover:text-slate-900 font-medium'
          ]"
          :title="appStore.sidebarCollapsed ? item.label : undefined"
        >
          <component
            :is="item.icon"
            :class="[
              'w-4 h-4 shrink-0',
              isActive(item.path) ? 'text-blue-900' : 'text-slate-500'
            ]"
          />

          <!-- Label when expanded -->
          <span v-show="!appStore.sidebarCollapsed" class="truncate flex-1">
            {{ item.label }}
          </span>

          <!-- Notification Badge when expanded -->
          <span
            v-if="item.badge && item.badge > 0 && !appStore.sidebarCollapsed"
            class="px-1.5 py-0.2 text-[10px] font-bold bg-red-600 text-white rounded-full shrink-0"
          >
            {{ item.badge > 99 ? '99+' : item.badge }}
          </span>

          <!-- Notification Dot when collapsed -->
          <span
            v-if="item.badge && item.badge > 0 && appStore.sidebarCollapsed"
            class="w-2.5 h-2.5 rounded-full bg-red-600 absolute top-2 right-4"
          ></span>
        </router-link>
      </nav>

      <!-- Bottom Interactive Toggle Bar -->
      <div class="border-t border-slate-200 bg-white p-2 shrink-0">
        <button
          type="button"
          @click="appStore.toggleSidebar"
          :class="[
            'w-full flex items-center rounded text-xs font-semibold text-slate-600 hover:text-blue-900 hover:bg-slate-100 border border-transparent hover:border-slate-200 transition-colors py-2',
            appStore.sidebarCollapsed ? 'justify-center' : 'gap-2.5 px-3'
          ]"
          :title="appStore.sidebarCollapsed ? (t('sidebar.expand') || 'Expand') : (t('sidebar.collapse') || 'Collapse')"
        >
          <PanelLeftOpen v-if="appStore.sidebarCollapsed" class="w-4 h-4 text-blue-900" />
          <PanelLeftClose v-else class="w-4 h-4 text-slate-500" />
          <span v-show="!appStore.sidebarCollapsed" class="text-xs">
            {{ t('sidebar.collapse') || 'Collapse Sidebar' }}
          </span>
        </button>
      </div>

      <!-- Sidebar Footer (Kingdom Motto & System Version) -->
      <div class="p-3 border-t border-slate-200 bg-slate-50 text-center shrink-0">
        <div v-show="!appStore.sidebarCollapsed" class="text-[11px] text-slate-500 space-y-0.5 select-none">
          <p class="font-bold text-slate-700">{{ t('app.kingdom') }}</p>
          <p class="text-[10px] text-slate-400">{{ t('app.motto') }}</p>
        </div>
        <div v-show="appStore.sidebarCollapsed" class="flex justify-center">
          <span class="text-[10px] font-mono text-slate-500 bg-slate-200 px-1.5 py-0.5 rounded">
            v1.0
          </span>
        </div>
      </div>
    </aside>
  </div>
</template>
