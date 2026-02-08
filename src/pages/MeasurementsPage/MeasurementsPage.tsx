import { useState } from 'react';
import { observer } from 'mobx-react-lite';
import { dataStore, uiStore } from '@/store';
import { Card, Button, Table, Modal, Input, Select, Badge } from '@/components/UI';
import type { TableColumn } from '@/components/UI';
import type { Measurement, MeasurementFormData, MeasurementType } from '@/types';
import { getMeasurementTypeLabel, getMeasurementUnit } from '@/types';
import styles from './MeasurementsPage.module.scss';

const measurementTypeOptions = [
  { value: 'blood_pressure', label: 'Давление' }, { value: 'heart_rate', label: 'Пульс' },
  { value: 'temperature', label: 'Температура' }, { value: 'blood_sugar', label: 'Сахар крови' },
  { value: 'weight', label: 'Вес' }, { value: 'oxygen', label: 'Кислород' },
];

export const MeasurementsPage = observer(() => {
  const { filteredMeasurements, activePatients, measurementsLoading, getPatientFullName, createMeasurement, deleteMeasurement, isCritical, setFilter, filters } = dataStore;
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState<MeasurementFormData>({ patientId: '', type: 'blood_pressure', value: 0, systolic: undefined, diastolic: undefined, measuredAt: new Date().toISOString().slice(0, 16), notes: '' });

  const resetForm = () => { setForm({ patientId: '', type: 'blood_pressure', value: 0, systolic: undefined, diastolic: undefined, measuredAt: new Date().toISOString().slice(0, 16), notes: '' }); };

  const handleSave = async () => {
    if (!form.patientId) { uiStore.showError('Выберите пациента'); return; }
    try { 
      const result = await createMeasurement(form); 
      if (result) {
        uiStore.showSuccess('Измерение добавлено'); 
        setModalOpen(false); 
        resetForm();
      } else {
        uiStore.showError('Ошибка сохранения: недостаточно прав или ошибка API');
      }
    }
    catch (error) { 
      console.error('Error creating measurement:', error);
      uiStore.showError('Ошибка сохранения'); 
    }
  };

  const handleDelete = (id: string) => { uiStore.showConfirm('Удаление', 'Удалить измерение?', async () => { await deleteMeasurement(id); uiStore.showSuccess('Удалено'); }); };

  const formatValue = (m: Measurement): string => {
    if (m.type === 'blood_pressure' && m.systolic && m.diastolic) return `${m.systolic}/${m.diastolic} ${m.unit}`;
    return `${m.value} ${m.unit}`;
  };

  const columns: TableColumn<Measurement>[] = [
    { key: 'measuredAt', title: 'Дата/время', width: '150px', render: (v: unknown) => new Date(v as string).toLocaleString('ru-RU') },
    { key: 'patientId', title: 'Пациент', render: (v: unknown) => getPatientFullName(v as string) },
    { key: 'type', title: 'Тип', width: '120px', render: (v: unknown) => getMeasurementTypeLabel(v as MeasurementType) },
    { key: 'value', title: 'Значение', width: '130px', render: (_: unknown, row: Measurement) => (
      <span className={isCritical(row) ? styles.critical : ''}>{formatValue(row)}</span>
    )},
    { key: 'status', title: '', width: '100px', render: (_: unknown, row: Measurement) => isCritical(row) ? <Badge variant="warning">Критично</Badge> : null },
    { key: 'actions', title: '', width: '60px', render: (_: unknown, row: Measurement) => (
      <Button size="sm" variant="ghost" onClick={() => handleDelete(row.id)}><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16"><polyline points="3 6 5 6 21 6" /><path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" /></svg></Button>
    )},
  ];

  const patientOptions = [{ value: '', label: 'Все пациенты' }, ...activePatients.map(p => ({ value: p.id, label: `${p.lastName} ${p.firstName}` }))];

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div><h1 className={styles.title}>Показатели здоровья</h1><p className={styles.subtitle}>Мониторинг измерений пациентов</p></div>
        <Button variant="primary" onClick={() => { resetForm(); setModalOpen(true); }}>Добавить измерение</Button>
      </div>

      <Card className={styles.filters}>
        <Select options={patientOptions} value={filters.patientId || ''} onChange={e => setFilter('patientId', e.target.value || undefined)} />
        <Select options={[{ value: '', label: 'Все типы' }, ...measurementTypeOptions]} value={filters.type || ''} onChange={e => setFilter('type', e.target.value || undefined)} />
      </Card>

      <Card padding="none">
        <Table columns={columns} data={filteredMeasurements} keyField="id" loading={measurementsLoading} emptyText="Нет измерений" />
      </Card>

      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title="Новое измерение"
        footer={<div className={styles.modalFooter}><Button variant="ghost" onClick={() => setModalOpen(false)}>Отмена</Button><Button variant="primary" onClick={handleSave}>Сохранить</Button></div>}>
        <div className={styles.form}>
          <Select label="Пациент *" options={activePatients.map(p => ({ value: p.id, label: `${p.lastName} ${p.firstName}` }))} value={form.patientId} onChange={e => setForm({ ...form, patientId: e.target.value })} />
          <Select label="Тип измерения" options={measurementTypeOptions} value={form.type} onChange={e => setForm({ ...form, type: e.target.value as MeasurementType })} />
          {form.type === 'blood_pressure' ? (
            <div className={styles.row}>
              <Input label="Систолическое" type="number" value={form.systolic || ''} onChange={e => setForm({ ...form, systolic: parseInt(e.target.value) || undefined })} />
              <Input label="Диастолическое" type="number" value={form.diastolic || ''} onChange={e => setForm({ ...form, diastolic: parseInt(e.target.value) || undefined })} />
            </div>
          ) : (
            <Input label={`Значение (${getMeasurementUnit(form.type)})`} type="number" step="0.1" value={form.value} onChange={e => setForm({ ...form, value: parseFloat(e.target.value) || 0 })} />
          )}
          <Input label="Дата и время" type="datetime-local" value={form.measuredAt} onChange={e => setForm({ ...form, measuredAt: e.target.value })} />
          <Input label="Примечания" value={form.notes || ''} onChange={e => setForm({ ...form, notes: e.target.value })} />
        </div>
      </Modal>
    </div>
  );
});
