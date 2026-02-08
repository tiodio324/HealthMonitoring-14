export type PageId = 'home' | 'patients' | 'measurements' | 'admin' | 'admin-patients' | 'admin-measurements';
export interface PageConfig { id: PageId; title: string; icon: string; requiresAuth: boolean; requiredRole?: 'doctor' | 'admin'; showInNav: boolean; parentId?: PageId; }
export const PAGES_CONFIG: Record<PageId, PageConfig> = {
  home: { id: 'home', title: 'Главная', icon: 'home', requiresAuth: false, showInNav: true },
  patients: { id: 'patients', title: 'Пациенты', icon: 'users', requiresAuth: false, showInNav: true },
  measurements: { id: 'measurements', title: 'Показатели', icon: 'activity', requiresAuth: true, requiredRole: 'doctor', showInNav: true },
  admin: { id: 'admin', title: 'Администрирование', icon: 'settings', requiresAuth: true, requiredRole: 'admin', showInNav: true },
  'admin-patients': { id: 'admin-patients', title: 'Пациенты', icon: 'users', requiresAuth: true, requiredRole: 'admin', showInNav: false, parentId: 'admin' },
  'admin-measurements': { id: 'admin-measurements', title: 'Показатели', icon: 'clipboard', requiresAuth: true, requiredRole: 'admin', showInNav: false, parentId: 'admin' },
};
