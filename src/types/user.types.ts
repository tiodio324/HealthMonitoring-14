export type UserRole = 'viewer' | 'doctor' | 'admin';
export interface User { role: UserRole; }
export interface RolePermissions { canViewPatients: boolean; canViewMeasurements: boolean; canManagePatients: boolean; canManageMeasurements: boolean; canAccessAdmin: boolean; }
export const ROLE_PERMISSIONS: Record<UserRole, RolePermissions> = {
  viewer: { canViewPatients: true, canViewMeasurements: false, canManagePatients: false, canManageMeasurements: false, canAccessAdmin: false },
  doctor: { canViewPatients: true, canViewMeasurements: true, canManagePatients: true, canManageMeasurements: true, canAccessAdmin: false },
  admin: { canViewPatients: true, canViewMeasurements: true, canManagePatients: true, canManageMeasurements: true, canAccessAdmin: true },
};
