import { createRouter, createWebHistory } from '@ionic/vue-router';
import type { RouteRecordRaw } from 'vue-router';

import { useAuthStore } from '@/stores/authStore';
import type { UserRole } from '@/types';

declare module 'vue-router' {
  interface RouteMeta {
    requiresAuth?: boolean;
    role?: UserRole;
  }
}

const routes: RouteRecordRaw[] = [
  { path: '/', component: () => import('@/views/RootRedirectPage.vue') },
  { path: '/login', component: () => import('@/views/LoginPage.vue') },
  { path: '/register', component: () => import('@/views/RegisterPage.vue') },
  { path: '/forgot-password', component: () => import('@/views/ForgotPasswordPage.vue') },
  {
    path: '/tabs/',
    component: () => import('@/views/TabsPage.vue'),
    meta: { requiresAuth: true },
    children: [
      { path: '', redirect: '/tabs/home' },
      { path: 'home', component: () => import('@/views/HomePage.vue'), meta: { requiresAuth: true } },
      { path: 'suppliers', component: () => import('@/views/SuppliersPage.vue'), meta: { requiresAuth: true } },
      {
        path: 'favorites',
        component: () => import('@/views/FavoritesPage.vue'),
        meta: { requiresAuth: true, role: 'buyer' },
      },
      { path: 'activity', component: () => import('@/views/ActivityPage.vue'), meta: { requiresAuth: true } },
      { path: 'profile', component: () => import('@/views/ProfilePage.vue'), meta: { requiresAuth: true } },
      {
        path: 'dashboard',
        component: () => import('@/views/SupplierDashboardPage.vue'),
        meta: { requiresAuth: true, role: 'supplier' },
      },
      {
        path: 'reports',
        component: () => import('@/views/SupplierReportsPage.vue'),
        meta: { requiresAuth: true, role: 'supplier' },
      },
      {
        path: 'admin',
        component: () => import('@/views/AdminPage.vue'),
        meta: { requiresAuth: true, role: 'admin' },
      },
    ],
  },
  {
    path: '/suppliers/:supplierId',
    component: () => import('@/views/SupplierDetailPage.vue'),
    meta: { requiresAuth: true },
  },
  {
    path: '/messages/:conversationId',
    component: () => import('@/views/ConversationPage.vue'),
    meta: { requiresAuth: true },
  },
  {
    path: '/supplier/fruits/new',
    component: () => import('@/views/FruitFormPage.vue'),
    meta: { requiresAuth: true, role: 'supplier' },
  },
  {
    path: '/supplier/fruits/:fruitId',
    component: () => import('@/views/FruitFormPage.vue'),
    meta: { requiresAuth: true, role: 'supplier' },
  },
  { path: '/:pathMatch(.*)*', redirect: '/' },
];

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,
});

router.beforeEach(async (to) => {
  const authStore = useAuthStore();
  await authStore.initialize();

  if (to.meta.requiresAuth && !authStore.profile) {
    return { path: '/login', query: { redirect: to.fullPath } };
  }
  if ((to.path === '/login' || to.path === '/register') && authStore.profile) {
    if (authStore.profile.role === 'supplier') return '/tabs/dashboard';
    if (authStore.profile.role === 'admin') return '/tabs/admin';
    return '/tabs/home';
  }
  if (to.meta.role && authStore.profile?.role !== to.meta.role) {
    if (authStore.profile?.role === 'supplier') return '/tabs/dashboard';
    if (authStore.profile?.role === 'admin') return '/tabs/admin';
    return '/tabs/home';
  }
});

export default router;
