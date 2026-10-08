<script setup>
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { ChevronRight, Home } from 'lucide-vue-next'

const route = useRoute()
const { t } = useI18n()

// Exclude dashboard itself from sub-crumbs so we don't duplicate "Dashboard > Dashboard"
const subCrumbs = computed(() => {
  if (route.path === '/dashboard' || route.path === '/') {
    return []
  }
  const matched = route.matched.filter(item => item.meta && item.meta.title && item.path !== '/dashboard' && item.path !== '')
  return matched.map(item => ({
    name: item.name,
    path: item.path,
    title: t(item.meta.title || ''),
  }))
})
</script>

<template>
  <nav aria-label="Breadcrumb" class="flex items-center text-xs text-slate-500">
    <ol class="inline-flex items-center space-x-1 sm:space-x-2">
      <!-- Root: Dashboard -->
      <li class="inline-flex items-center">
        <router-link
          to="/dashboard"
          :class="[
            'inline-flex items-center gap-1.5 transition-colors',
            route.path === '/dashboard' ? 'font-semibold text-slate-900' : 'text-slate-600 hover:text-blue-900'
          ]"
        >
          <Home class="w-3.5 h-3.5 text-slate-500" />
          <span>{{ t('navigation.dashboard') }}</span>
        </router-link>
      </li>

      <!-- Sub-pages if not on /dashboard -->
      <li v-for="(crumb, index) in subCrumbs" :key="crumb.path" class="inline-flex items-center">
        <ChevronRight class="w-3.5 h-3.5 text-slate-400 mx-1 shrink-0" />
        <span
          v-if="index === subCrumbs.length - 1"
          class="font-semibold text-slate-900"
          aria-current="page"
        >
          {{ crumb.title }}
        </span>
        <router-link
          v-else
          :to="crumb.path"
          class="text-slate-600 hover:text-blue-900 transition-colors"
        >
          {{ crumb.title }}
        </router-link>
      </li>
    </ol>
  </nav>
</template>
