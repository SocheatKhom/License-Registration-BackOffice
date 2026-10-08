<script setup>
import { useI18n } from 'vue-i18n'
import Sidebar from './Sidebar.vue'
import Header from './Header.vue'
import Breadcrumb from './Breadcrumb.vue'

const { t } = useI18n()
</script>

<template>
  <div class="h-screen flex flex-col overflow-hidden bg-slate-100 antialiased">
    <!-- Full-Width Official Government Header across Top -->
    <Header />

    <!-- Layout Body: Sidebar + Main Content -->
    <div class="flex flex-1 overflow-hidden">
      <!-- Clean Light Government Sidebar stretching full height of viewport -->
      <Sidebar />

      <!-- Main Content Column with Independent Vertical Scroll -->
      <div class="flex-1 flex flex-col min-w-0 overflow-y-auto bg-slate-100">
        <!-- Breadcrumb Bar right above page content -->
        <div class="bg-white border-b border-slate-200 px-4 sm:px-6 py-2.5 shrink-0">
          <Breadcrumb />
        </div>

        <!-- Dynamic Main View -->
        <main class="flex-1 p-4 sm:p-6 lg:p-8">
          <router-view />
        </main>

        <!-- Official Flat Government Footer -->
        <footer class="bg-white border-t border-slate-300 py-3 px-6 text-center text-xs text-slate-500 shrink-0">
          <div class="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
            <span>{{ t('app.title') }} — {{ t('app.ministry') }}</span>
            <span>{{ t('app.copyright') }}</span>
          </div>
        </footer>
      </div>
    </div>
  </div>
</template>
