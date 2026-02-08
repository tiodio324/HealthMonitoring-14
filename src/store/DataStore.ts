import { makeAutoObservable, runInAction } from 'mobx';
import { v4 as uuidv4 } from 'uuid';
import { Patient, PatientFormData, Measurement, MeasurementFormData, FilterParams, getMeasurementUnit } from '@/types';
import FirebaseService from '@/firebase';
import { authStore } from './AuthStore';

export class DataStore {
  patients: Patient[] = []; measurements: Measurement[] = [];
  patientsLoading = false; measurementsLoading = false;
  error: string | null = null; filters: FilterParams = {};

  constructor() { makeAutoObservable(this, {}, { autoBind: true }); }

  get activePatients(): Patient[] { return this.patients.filter(p => p.isActive).sort((a, b) => a.lastName.localeCompare(b.lastName, 'ru')); }
  get activeMeasurements(): Measurement[] { return this.measurements.filter(m => m.isActive).sort((a, b) => new Date(b.measuredAt).getTime() - new Date(a.measuredAt).getTime()); }
  
  get filteredMeasurements(): Measurement[] {
    let r = this.activeMeasurements;
    if (this.filters.patientId) r = r.filter(m => m.patientId === this.filters.patientId);
    if (this.filters.type) r = r.filter(m => m.type === this.filters.type);
    if (this.filters.dateFrom) r = r.filter(m => m.measuredAt >= this.filters.dateFrom!);
    if (this.filters.dateTo) r = r.filter(m => m.measuredAt <= this.filters.dateTo!);
    return r;
  }

  get todayMeasurementsCount(): number { const today = new Date().toISOString().split('T')[0]; return this.activeMeasurements.filter(m => m.measuredAt.startsWith(today)).length; }
  get criticalMeasurementsCount(): number { return this.activeMeasurements.filter(m => this.isCritical(m)).length; }

  getPatientById = (id: string): Patient | undefined => this.patients.find(p => p.id === id);
  getPatientFullName = (id: string): string => { const p = this.getPatientById(id); return p ? `${p.lastName} ${p.firstName}` : 'Неизвестный'; };

  isCritical = (m: Measurement): boolean => {
    if (m.type === 'blood_pressure' && m.systolic && (m.systolic > 140 || m.systolic < 90)) return true;
    if (m.type === 'heart_rate' && (m.value > 100 || m.value < 60)) return true;
    if (m.type === 'temperature' && (m.value > 37.5 || m.value < 35.5)) return true;
    if (m.type === 'blood_sugar' && (m.value > 7 || m.value < 3.5)) return true;
    if (m.type === 'oxygen' && m.value < 95) return true;
    return false;
  };

  loadAllData = async (): Promise<void> => { await Promise.all([this.loadPatients(), this.loadMeasurements()]); };

  loadPatients = async (): Promise<void> => { this.patientsLoading = true; try { const d = await FirebaseService.getData<Record<string, Patient>>('patients'); runInAction(() => { this.patients = d ? Object.values(d) : []; this.patientsLoading = false; }); } catch { runInAction(() => { this.error = 'Ошибка загрузки пациентов'; this.patientsLoading = false; }); } };
  loadMeasurements = async (): Promise<void> => { this.measurementsLoading = true; try { const d = await FirebaseService.getData<Record<string, Measurement>>('measurements'); runInAction(() => { this.measurements = d ? Object.values(d) : []; this.measurementsLoading = false; }); } catch { runInAction(() => { this.error = 'Ошибка загрузки показателей'; this.measurementsLoading = false; }); } };

  createPatient = async (data: PatientFormData): Promise<Patient | null> => { if (!authStore.canManagePatients()) return null; const now = new Date().toISOString(); const p: Patient = { id: uuidv4(), ...data, middleName: data.middleName || '', phone: data.phone || '', email: data.email || '', address: data.address || '', diagnosis: data.diagnosis || '', isActive: true, createdAt: now, updatedAt: now }; try { await FirebaseService.setData(`patients/${p.id}`, p); runInAction(() => { this.patients.push(p); }); return p; } catch { return null; } };
  updatePatient = async (id: string, data: Partial<PatientFormData>): Promise<boolean> => { if (!authStore.canManagePatients()) return false; const i = this.patients.findIndex(p => p.id === id); if (i === -1) return false; const u = { ...this.patients[i], ...data, updatedAt: new Date().toISOString() }; try { await FirebaseService.setData(`patients/${id}`, u); runInAction(() => { this.patients[i] = u; }); return true; } catch { return false; } };
  deletePatient = async (id: string): Promise<boolean> => { if (!authStore.canManagePatients()) return false; const i = this.patients.findIndex(p => p.id === id); if (i === -1) return false; try { await FirebaseService.updateData(`patients/${id}`, { isActive: false }); runInAction(() => { this.patients[i].isActive = false; }); return true; } catch { return false; } };

  createMeasurement = async (data: MeasurementFormData): Promise<Measurement | null> => {
    if (!authStore.canManageMeasurements()) return null;
    const now = new Date().toISOString();
    const m: Measurement = {
      id: uuidv4(), patientId: data.patientId, type: data.type, value: data.value,
      ...(data.systolic !== undefined ? { systolic: data.systolic } : {}),
      ...(data.diastolic !== undefined ? { diastolic: data.diastolic } : {}),
      notes: data.notes || '', unit: getMeasurementUnit(data.type),
      measuredAt: data.measuredAt, isActive: true, createdAt: now,
    };
    try { await FirebaseService.setData(`measurements/${m.id}`, m); runInAction(() => { this.measurements.push(m); }); return m; }
    catch (error) { console.error('Error creating measurement:', error); return null; }
  };
  deleteMeasurement = async (id: string): Promise<boolean> => { if (!authStore.canManageMeasurements()) return false; const i = this.measurements.findIndex(m => m.id === id); if (i === -1) return false; try { await FirebaseService.updateData(`measurements/${id}`, { isActive: false }); runInAction(() => { this.measurements[i].isActive = false; }); return true; } catch { return false; } };

  setFilter = (key: keyof FilterParams, value: string | undefined): void => { this.filters = { ...this.filters, [key]: value }; };
  clearFilters = (): void => { this.filters = {}; };
  clearError = (): void => { this.error = null; };
}

export const dataStore = new DataStore();
