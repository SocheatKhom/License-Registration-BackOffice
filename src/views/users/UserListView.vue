<script setup>
import { ref, reactive, watch, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { usersApi } from '@/api/users.api'
import { useAuthStore } from '@/stores/auth.store'
import { formatDate } from '@/utils/formatters'
import { useDebounce } from '@/composables/useDebounce'
import LoadingSpinner from '@/components/common/LoadingSpinner.vue'
import EmptyState from '@/components/common/EmptyState.vue'
import ErrorAlert from '@/components/common/ErrorAlert.vue'
import Pagination from '@/components/common/Pagination.vue'
import ConfirmModal from '@/components/common/ConfirmModal.vue'
import {
  Users,
  UserPlus,
  Search,
  RotateCcw,
  RefreshCw,
  Shield,
  ShieldCheck,
  CheckCircle2,
  XCircle,
  Lock,
  Mail,
  User as UserIcon,
  X,
} from 'lucide-vue-next'

const { t, locale } = useI18n()
const authStore = useAuthStore()

const searchInput = ref('')
const debouncedSearch = useDebounce(searchInput, 400)

const filters = reactive({
  role: '',
  status: '',
  sortBy: 'createdAt',
  sortOrder: 'DESC',
  page: 1,
  limit: 10,
})

const users = ref([])
const totalItems = ref(0)
const totalPages = ref(1)
const loading = ref(false)
const error = ref(null)
const successMessage = ref('')

// Create User Modal state
const createModalOpen = ref(false)
const creatingUser = ref(false)
const createForm = reactive({
  name: '',
  email: '',
  password: '',
  role: 'ADMIN',
})
const createErrors = reactive({
  name: '',
  email: '',
  password: '',
})

// Change Role Modal state
const roleModalOpen = ref(false)
const userToChangeRole = ref(null)
const selectedRole = ref('ADMIN')
const changingRole = ref(false)

// Change Status Modal state
const statusModalOpen = ref(false)
const userToChangeStatus = ref(null)
const changingStatus = ref(false)

async function fetchUsers() {
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
    if (filters.role) {
      params.role = filters.role
    }
    if (filters.status) {
      params.status = filters.status
    }

    const response = await usersApi.list(params)

    users.value = Array.isArray(response?.data)
      ? response.data
      : (response?.data?.users || [])

    totalItems.value = response?.pagination?.totalItems ?? (response?.data?.pagination?.totalItems ?? users.value.length)
    totalPages.value = response?.pagination?.totalPages ?? (response?.data?.pagination?.totalPages ?? 1)
  } catch (err) {
    console.error('Failed to fetch users:', err)
    error.value = err.message || 'Unable to retrieve user management accounts.'
  } finally {
    loading.value = false
  }
}

watch(
  [debouncedSearch, () => filters.role, () => filters.status, () => filters.sortBy, () => filters.sortOrder],
  () => {
    filters.page = 1
    fetchUsers()
  }
)

watch(
  [() => filters.page, () => filters.limit],
  () => {
    fetchUsers()
  }
)

onMounted(() => {
  fetchUsers()
})

function resetFilters() {
  searchInput.value = ''
  filters.role = ''
  filters.status = ''
  filters.sortBy = 'createdAt'
  filters.sortOrder = 'DESC'
  filters.page = 1
}

// 1. Create User
function openCreateModal() {
  createForm.name = ''
  createForm.email = ''
  createForm.password = ''
  createForm.role = 'ADMIN'
  createErrors.name = ''
  createErrors.email = ''
  createErrors.password = ''
  createModalOpen.value = true
}

function validateCreate() {
  let valid = true
  createErrors.name = ''
  createErrors.email = ''
  createErrors.password = ''

  if (!createForm.name.trim()) {
    createErrors.name = 'Full name is required.'
    valid = false
  }

  if (!createForm.email.trim()) {
    createErrors.email = 'Email address is required.'
    valid = false
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(createForm.email.trim())) {
    createErrors.email = 'Please enter a valid email address.'
    valid = false
  }

  if (!createForm.password) {
    createErrors.password = 'Password is required.'
    valid = false
  } else if (createForm.password.length < 8) {
    createErrors.password = 'Password must be at least 8 characters.'
    valid = false
  }

  return valid
}

async function handleCreateUser() {
  if (!validateCreate()) return

  creatingUser.value = true
  error.value = null

  try {
    const newUser = await usersApi.create({
      name: createForm.name.trim(),
      email: createForm.email.trim().toLowerCase(),
      password: createForm.password,
      role: createForm.role,
    })

    createModalOpen.value = false
    successMessage.value = `Officer account ${newUser.name} created successfully.`
    setTimeout(() => { successMessage.value = '' }, 4000)
    await fetchUsers()
  } catch (err) {
    error.value = err.message || 'Failed to create officer account.'
  } finally {
    creatingUser.value = false
  }
}

// 2. Change Role
function openRoleModal(user) {
  userToChangeRole.value = user
  selectedRole.value = user.role
  roleModalOpen.value = true
}

async function handleConfirmRole() {
  if (!userToChangeRole.value) return

  changingRole.value = true
  try {
    await usersApi.changeRole(userToChangeRole.value.id, { role: selectedRole.value })
    roleModalOpen.value = false
    successMessage.value = `Role updated to ${selectedRole.value} for ${userToChangeRole.value.name}.`
    setTimeout(() => { successMessage.value = '' }, 4000)
    await fetchUsers()
  } catch (err) {
    error.value = err.message || 'Failed to update user role.'
  } finally {
    changingRole.value = false
    userToChangeRole.value = null
  }
}

// 3. Change Status
function openStatusModal(user) {
  userToChangeStatus.value = user
  statusModalOpen.value = true
}

async function handleConfirmStatus() {
  if (!userToChangeStatus.value) return

  changingStatus.value = true
  const newStatus = userToChangeStatus.value.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE'

  try {
    await usersApi.changeStatus(userToChangeStatus.value.id, { status: newStatus })
    statusModalOpen.value = false
    successMessage.value = `User ${userToChangeStatus.value.name} is now ${newStatus}.`
    setTimeout(() => { successMessage.value = '' }, 4000)
    await fetchUsers()
  } catch (err) {
    error.value = err.message || 'Failed to update user status.'
  } finally {
    changingStatus.value = false
    userToChangeStatus.value = null
  }
}
</script>

<template>
  <div class="space-y-6">
    <!-- Header -->
    <div class="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
      <div>
        <h1 class="text-xl font-bold text-slate-900 tracking-tight">
          {{ t('navigation.users') }}
        </h1>
        <p class="text-xs text-slate-500 mt-1">
          គ្រប់គ្រងគណនីមន្ត្រី និងការកំណត់សិទ្ធិប្រព័ន្ធ (SUPER_ADMIN Only)
        </p>
      </div>

      <div class="flex items-center gap-2">
        <button
          type="button"
          @click="openCreateModal"
          class="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-blue-900 hover:bg-blue-800 active:bg-blue-950 text-white text-xs font-semibold rounded border border-blue-950 transition-colors"
        >
          <UserPlus class="w-3.5 h-3.5" />
          <span>+ {{ t('common.create') || 'Create User' }}</span>
        </button>

        <button
          type="button"
          @click="fetchUsers"
          :disabled="loading"
          class="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-medium rounded transition-colors disabled:opacity-60"
        >
          <RefreshCw :class="['w-3.5 h-3.5', loading ? 'animate-spin' : '']" />
          <span>{{ t('common.refresh') }}</span>
        </button>
      </div>
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
    <ErrorAlert v-if="error" :message="error" :show-retry="true" @retry="fetchUsers" />

    <!-- Filter & Search Toolbar -->
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
              placeholder="Search by name or email..."
              class="flat-input pl-10 text-xs"
            />
          </div>
        </div>

        <!-- Role Filter -->
        <div>
          <label class="block text-[11px] font-semibold text-slate-700 mb-1">
            Role
          </label>
          <select v-model="filters.role" class="flat-input text-xs">
            <option value="">All Roles</option>
            <option value="SUPER_ADMIN">SUPER_ADMIN</option>
            <option value="ADMIN">ADMIN</option>
          </select>
        </div>

        <!-- Status Filter -->
        <div>
          <label class="block text-[11px] font-semibold text-slate-700 mb-1">
            {{ t('common.status') }}
          </label>
          <select v-model="filters.status" class="flat-input text-xs">
            <option value="">{{ t('common.allStatuses') || 'All Statuses' }}</option>
            <option value="ACTIVE">{{ t('status.active') }}</option>
            <option value="INACTIVE">INACTIVE</option>
          </select>
        </div>

        <!-- Sort Filter & Reset -->
        <div class="flex items-end gap-2">
          <div class="flex-1">
            <label class="block text-[11px] font-semibold text-slate-700 mb-1">
              {{ t('common.sort') || 'Sort By' }}
            </label>
            <select v-model="filters.sortBy" class="flat-input text-xs">
              <option value="createdAt">{{ t('common.dateCreated') || 'Date Created' }}</option>
              <option value="name">Name</option>
              <option value="email">Email</option>
              <option value="role">Role</option>
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

    <!-- Users Table Panel -->
    <div class="flat-card bg-white border border-slate-300 rounded-md overflow-hidden">
      <!-- Loading State -->
      <LoadingSpinner v-if="loading && users.length === 0" />

      <!-- Empty State -->
      <EmptyState
        v-else-if="users.length === 0"
        title="No officer accounts found matching your filter criteria."
      />

      <!-- Table Content -->
      <div v-else class="overflow-x-auto">
        <table class="w-full text-left border-collapse text-xs">
          <thead>
            <tr class="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase text-[10px] tracking-wider">
              <th class="py-3 px-4">Officer Name</th>
              <th class="py-3 px-4">Email</th>
              <th class="py-3 px-4">System Role</th>
              <th class="py-3 px-4">Account Status</th>
              <th class="py-3 px-4">Created Date</th>
              <th class="py-3 px-4 text-right">{{ t('common.actions') }}</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-200">
            <tr
              v-for="user in users"
              :key="user.id"
              class="hover:bg-slate-50 transition-colors"
            >
              <!-- Name with Avatar initial -->
              <td class="py-3 px-4 whitespace-nowrap">
                <div class="flex items-center gap-2.5">
                  <div class="w-7 h-7 rounded-full bg-slate-200 border border-slate-300 flex items-center justify-center font-bold text-slate-700 text-xs shrink-0">
                    {{ (user.name || 'U').charAt(0).toUpperCase() }}
                  </div>
                  <div>
                    <div class="font-bold text-slate-900">{{ user.name }}</div>
                    <div v-if="authStore.currentUser?.id === user.id" class="text-[10px] text-blue-700 font-semibold">
                      (Your Account)
                    </div>
                  </div>
                </div>
              </td>

              <!-- Email -->
              <td class="py-3 px-4 font-mono text-slate-700 whitespace-nowrap">
                {{ user.email }}
              </td>

              <!-- Role Tag -->
              <td class="py-3 px-4 whitespace-nowrap">
                <span
                  :class="[
                    'inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold border tracking-wide uppercase',
                    user.role === 'SUPER_ADMIN'
                      ? 'bg-purple-50 text-purple-900 border-purple-300'
                      : 'bg-blue-50 text-blue-900 border-blue-300'
                  ]"
                >
                  <ShieldCheck class="w-3 h-3 mr-1" />
                  {{ user.role }}
                </span>
              </td>

              <!-- Status -->
              <td class="py-3 px-4 whitespace-nowrap">
                <span
                  :class="[
                    'inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold border tracking-wide uppercase',
                    user.status === 'ACTIVE'
                      ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                      : 'bg-red-50 text-red-800 border-red-300'
                  ]"
                >
                  <span
                    :class="[
                      'w-1.5 h-1.5 rounded-full mr-1.5',
                      user.status === 'ACTIVE' ? 'bg-emerald-600' : 'bg-red-600'
                    ]"
                  ></span>
                  {{ user.status }}
                </span>
              </td>

              <!-- Created Date -->
              <td class="py-3 px-4 text-slate-500 whitespace-nowrap font-mono text-[11px]">
                {{ formatDate(user.createdAt || user.created_at, locale) }}
              </td>

              <!-- Actions (Change Role & Toggle Status) -->
              <td class="py-3 px-4 text-right whitespace-nowrap space-x-1.5">
                <!-- Change Role Button -->
                <button
                  type="button"
                  @click="openRoleModal(user)"
                  class="inline-flex items-center gap-1 px-2.5 py-1 bg-slate-100 hover:bg-slate-200 border border-slate-300 text-slate-700 rounded text-[11px] font-medium transition-colors"
                >
                  <Shield class="w-3 h-3" />
                  <span>Role</span>
                </button>

                <!-- Status Toggle Button (Guarded against self) -->
                <button
                  v-if="authStore.currentUser?.id !== user.id"
                  type="button"
                  @click="openStatusModal(user)"
                  :class="[
                    'inline-flex items-center gap-1 px-2.5 py-1 rounded text-[11px] font-medium border transition-colors',
                    user.status === 'ACTIVE'
                      ? 'bg-red-50 hover:bg-red-100 text-red-700 border-red-200'
                      : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border-emerald-200'
                  ]"
                >
                  <span>{{ user.status === 'ACTIVE' ? 'Deactivate' : 'Activate' }}</span>
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Pagination Component -->
      <Pagination
        v-if="users.length > 0"
        :page="filters.page"
        :limit="filters.limit"
        :total-items="totalItems"
        :total-pages="totalPages"
        @update:page="filters.page = $event"
        @update:limit="filters.limit = $event"
      />
    </div>

    <!-- Create User Modal -->
    <div
      v-if="createModalOpen"
      class="fixed inset-0 z-50 overflow-y-auto bg-slate-900/50 flex items-center justify-center p-4 transition-opacity"
      role="dialog"
      aria-modal="true"
    >
      <div class="flat-card bg-white border border-slate-300 rounded-md max-w-md w-full p-6 space-y-4">
        <div class="flex items-center justify-between border-b border-slate-200 pb-3">
          <div class="flex items-center gap-2">
            <UserPlus class="w-5 h-5 text-blue-900" />
            <h3 class="text-sm font-bold text-slate-900">Create New Officer Account</h3>
          </div>
          <button type="button" @click="createModalOpen = false" class="text-slate-400 hover:text-slate-700">
            <X class="w-4 h-4" />
          </button>
        </div>

        <form @submit.prevent="handleCreateUser" class="space-y-3.5">
          <!-- Name -->
          <div>
            <label class="block text-xs font-semibold text-slate-800 mb-1">
              Officer Full Name <span class="text-red-600">*</span>
            </label>
            <div class="relative">
              <UserIcon class="w-4 h-4 text-slate-400 absolute left-3 top-2.5 pointer-events-none" />
              <input
                v-model="createForm.name"
                type="text"
                placeholder="e.g. Bun Sokha"
                :class="['flat-input pl-9 text-xs', createErrors.name ? 'border-red-500' : '']"
              />
            </div>
            <p v-if="createErrors.name" class="mt-1 text-[11px] text-red-600">{{ createErrors.name }}</p>
          </div>

          <!-- Email -->
          <div>
            <label class="block text-xs font-semibold text-slate-800 mb-1">
              Official Email <span class="text-red-600">*</span>
            </label>
            <div class="relative">
              <Mail class="w-4 h-4 text-slate-400 absolute left-3 top-2.5 pointer-events-none" />
              <input
                v-model="createForm.email"
                type="email"
                placeholder="officer@media.gov.kh"
                :class="['flat-input pl-9 text-xs', createErrors.email ? 'border-red-500' : '']"
              />
            </div>
            <p v-if="createErrors.email" class="mt-1 text-[11px] text-red-600">{{ createErrors.email }}</p>
          </div>

          <!-- Password -->
          <div>
            <label class="block text-xs font-semibold text-slate-800 mb-1">
              Initial Password <span class="text-red-600">*</span>
            </label>
            <div class="relative">
              <Lock class="w-4 h-4 text-slate-400 absolute left-3 top-2.5 pointer-events-none" />
              <input
                v-model="createForm.password"
                type="password"
                placeholder="Minimum 8 characters"
                :class="['flat-input pl-9 text-xs', createErrors.password ? 'border-red-500' : '']"
              />
            </div>
            <p v-if="createErrors.password" class="mt-1 text-[11px] text-red-600">{{ createErrors.password }}</p>
          </div>

          <!-- Role -->
          <div>
            <label class="block text-xs font-semibold text-slate-800 mb-1">
              Assign System Role <span class="text-red-600">*</span>
            </label>
            <select v-model="createForm.role" class="flat-input text-xs">
              <option value="ADMIN">ADMIN (Review and License Issuer)</option>
              <option value="SUPER_ADMIN">SUPER_ADMIN (Full Administrative Control)</option>
            </select>
          </div>

          <!-- Actions -->
          <div class="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-200">
            <button
              type="button"
              @click="createModalOpen = false"
              class="px-3.5 py-1.5 bg-slate-100 hover:bg-slate-200 border border-slate-300 text-slate-700 text-xs font-semibold rounded"
            >
              {{ t('common.cancel') }}
            </button>
            <button
              type="submit"
              :disabled="creatingUser"
              class="px-4 py-1.5 bg-blue-900 hover:bg-blue-800 text-white text-xs font-semibold rounded border border-blue-950 flex items-center gap-1.5 disabled:opacity-50"
            >
              <span v-if="creatingUser" class="animate-spin text-white">⋯</span>
              <span>Create Account</span>
            </button>
          </div>
        </form>
      </div>
    </div>

    <!-- Change Role Modal -->
    <div
      v-if="roleModalOpen"
      class="fixed inset-0 z-50 overflow-y-auto bg-slate-900/50 flex items-center justify-center p-4 transition-opacity"
      role="dialog"
      aria-modal="true"
    >
      <div class="flat-card bg-white border border-slate-300 rounded-md max-w-sm w-full p-6 space-y-4">
        <div class="flex items-center justify-between border-b border-slate-200 pb-2">
          <h3 class="text-sm font-bold text-slate-900">Change Officer Role</h3>
          <button type="button" @click="roleModalOpen = false" class="text-slate-400 hover:text-slate-700">
            <X class="w-4 h-4" />
          </button>
        </div>

        <p class="text-xs text-slate-600">
          Updating permissions for officer: <strong>{{ userToChangeRole?.name }}</strong>
        </p>

        <div class="space-y-1">
          <label class="block text-[11px] font-semibold text-slate-700">Select New Role</label>
          <select v-model="selectedRole" class="flat-input text-xs">
            <option value="ADMIN">ADMIN</option>
            <option value="SUPER_ADMIN">SUPER_ADMIN</option>
          </select>
        </div>

        <div class="flex items-center justify-end gap-2 pt-3 border-t border-slate-200">
          <button
            type="button"
            @click="roleModalOpen = false"
            class="px-3.5 py-1.5 bg-slate-100 border border-slate-300 text-slate-700 text-xs font-semibold rounded"
          >
            {{ t('common.cancel') }}
          </button>
          <button
            type="button"
            @click="handleConfirmRole"
            :disabled="changingRole || selectedRole === userToChangeRole?.role"
            class="px-4 py-1.5 bg-blue-900 hover:bg-blue-800 text-white text-xs font-semibold rounded disabled:opacity-40"
          >
            Update Role
          </button>
        </div>
      </div>
    </div>

    <!-- Confirm Change Status Modal -->
    <ConfirmModal
      :is-open="statusModalOpen"
      :danger="userToChangeStatus?.status === 'ACTIVE'"
      :title="userToChangeStatus?.status === 'ACTIVE' ? 'Deactivate Officer Account' : 'Activate Officer Account'"
      :message="`Are you sure you want to ${userToChangeStatus?.status === 'ACTIVE' ? 'deactivate' : 'activate'} officer account ${userToChangeStatus?.name}? ${userToChangeStatus?.status === 'ACTIVE' ? 'They will immediately lose access to the portal.' : 'They will regain access to administrative tools.'}`"
      :confirm-text="userToChangeStatus?.status === 'ACTIVE' ? 'Deactivate Account' : 'Activate Account'"
      :loading="changingStatus"
      @confirm="handleConfirmStatus"
      @cancel="statusModalOpen = false"
    />
  </div>
</template>
