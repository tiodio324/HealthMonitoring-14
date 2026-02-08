import { useState } from 'react';
import { observer } from 'mobx-react-lite';
import { dataStore, uiStore } from '@/store';
import { Card, Button, Table, Modal, Input, Select } from '@/components/UI';
import type { TableColumn } from '@/components/UI';
import type { Patient, Measurement, PatientFormData, MeasurementType } from '@/types';
import { getMeasurementTypeLabel } from '@/types';
import styles from './AdminPage.module.scss';

type AdminTab = 'patients' | 'measurements';

export const AdminPage = observer(() => {
  const { patients, measurements, patientsLoading, measurementsLoading, getPatientFullName, createPatient, updatePatient, deletePatient, deleteMeasurement } = dataStore;
  const [activeTab, setActiveTab] = useState<AdminTab>('patients');
  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<PatientFormData>({ firstName: '', lastName: '', middleName: '', birthDate: '', gender: 'male', phone: '', email: '', diagnosis: '' });

  const resetForm = () => { setForm({ firstName: '', lastName: '', middleName: '', birthDate: '', gender: 'male', phone: '', email: '', diagnosis: '' }); setEditingId(null); };
  const openCreateModal = () => { resetForm(); setModalMode('create'); setModalOpen(true); };
  const openEditModal = (p: Patient) => {
    setModalMode('edit'); setEditingId(p.id);
    setForm({ firstName: p.firstName, lastName: p.lastName, middleName: p.middleName || '', birthDate: p.birthDate, gender: p.gender, phone: p.phone || '', email: p.email || '', diagnosis: p.diagnosis || '' });
    setModalOpen(true);
  };

  const handleSave = async () => {
    if (!form.firstName || !form.lastName) { uiStore.showError('Заполните обязательные поля'); return; }
    try {
      if (modalMode === 'create') await createPatient(form); else if (editingId) await updatePatient(editingId, form);
      uiStore.showSuccess('Сохранено'); setModalOpen(false); resetForm();
    } catch { uiStore.showError('Ошибка'); }
  };

  const handleDelete = (id: string) => { uiStore.showConfirm('Удаление', 'Удалить?', async () => {
    if (activeTab === 'patients') await deletePatient(id); else await deleteMeasurement(id);
    uiStore.showSuccess('Удалено');
  }); };

  const patientColumns: TableColumn<Patient>[] = [
    { key: 'lastName', title: 'Фамилия' }, { key: 'firstName', title: 'Имя' },
    { key: 'birthDate', title: 'Дата рождения', width: '120px', render: (v: unknown) => new Date(v as string).toLocaleDateString('ru-RU') },
    { key: 'actions', title: '', width: '100px', render: (_: unknown, r: Patient) => (
      <div className={styles.actions}>
        <Button size="sm" variant="ghost" onClick={() => openEditModal(r)}><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" /><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" /></svg></Button>
        <Button size="sm" variant="ghost" onClick={() => handleDelete(r.id)}><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16"><polyline points="3 6 5 6 21 6" /><path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" /></svg></Button>
      </div>
    )},
  ];

  const measurementColumns: TableColumn<Measurement>[] = [
    { key: 'measuredAt', title: 'Дата', width: '120px', render: (v: unknown) => new Date(v as string).toLocaleString('ru-RU') },
    { key: 'patientId', title: 'Пациент', render: (v: unknown) => getPatientFullName(v as string) },
    { key: 'type', title: 'Тип', render: (v: unknown) => getMeasurementTypeLabel(v as MeasurementType) },
    { key: 'value', title: 'Значение', width: '100px' },
    { key: 'actions', title: '', width: '60px', render: (_: unknown, r: Measurement) => <Button size="sm" variant="ghost" onClick={() => handleDelete(r.id)}><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16"><polyline points="3 6 5 6 21 6" /><path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" /></svg></Button> },
  ];

  return (
    <div className={styles.page}>
      <div className={styles.header}><h1 className={styles.title}>Администрирование</h1></div>
      <div className={styles.tabs}>
        <button className={`${styles.tab} ${activeTab === 'patients' ? styles.active : ''}`} onClick={() => setActiveTab('patients')}>Пациенты</button>
        <button className={`${styles.tab} ${activeTab === 'measurements' ? styles.active : ''}`} onClick={() => setActiveTab('measurements')}>Измерения</button>
      </div>
      {activeTab === 'patients' && <Card className={styles.toolbar}><Button variant="primary" onClick={openCreateModal}>Добавить пациента</Button></Card>}
      <Card padding="none">
        {activeTab === 'patients' && <Table columns={patientColumns} data={patients.filter(p => p.isActive)} keyField="id" loading={patientsLoading} emptyText="Нет пациентов" />}
        {activeTab === 'measurements' && <Table columns={measurementColumns} data={measurements.filter(m => m.isActive)} keyField="id" loading={measurementsLoading} emptyText="Нет измерений" />}
      </Card>
      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={modalMode === 'create' ? 'Новый пациент' : 'Редактировать'}
        footer={<div className={styles.modalFooter}><Button variant="ghost" onClick={() => setModalOpen(false)}>Отмена</Button><Button variant="primary" onClick={handleSave}>Сохранить</Button></div>}>
        <div className={styles.form}>
          <Input label="Фамилия *" value={form.lastName} onChange={e => setForm({ ...form, lastName: e.target.value })} />
          <Input label="Имя *" value={form.firstName} onChange={e => setForm({ ...form, firstName: e.target.value })} />
          <Input label="Дата рождения" type="date" value={form.birthDate} onChange={e => setForm({ ...form, birthDate: e.target.value })} />
          <Select label="Пол" options={[{ value: 'male', label: 'Мужской' }, { value: 'female', label: 'Женский' }]} value={form.gender} onChange={e => setForm({ ...form, gender: e.target.value as 'male' | 'female' })} />
          <Input label="Диагноз" value={form.diagnosis || ''} onChange={e => setForm({ ...form, diagnosis: e.target.value })} />
        </div>
      </Modal>
    </div>
  );
});
