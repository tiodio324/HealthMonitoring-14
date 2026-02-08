export type MeasurementType = 'blood_pressure' | 'heart_rate' | 'temperature' | 'blood_sugar' | 'weight' | 'oxygen';
export interface Measurement { id: string; patientId: string; type: MeasurementType; value: number; unit: string; systolic?: number; diastolic?: number; notes?: string; measuredAt: string; isActive: boolean; createdAt: string; }
export interface MeasurementFormData { patientId: string; type: MeasurementType; value: number; systolic?: number; diastolic?: number; notes?: string; measuredAt: string; }
export const getMeasurementTypeLabel = (t: MeasurementType): string => ({ blood_pressure: 'Давление', heart_rate: 'Пульс', temperature: 'Температура', blood_sugar: 'Сахар крови', weight: 'Вес', oxygen: 'Кислород' }[t]);
export const getMeasurementUnit = (t: MeasurementType): string => ({ blood_pressure: 'мм рт.ст.', heart_rate: 'уд/мин', temperature: '°C', blood_sugar: 'ммоль/л', weight: 'кг', oxygen: '%' }[t]);
