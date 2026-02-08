import { useState } from 'react';
import { observer } from 'mobx-react-lite';
import { dataStore, uiStore, authStore } from '@/store';
import { Card, Button, Table, Modal, Input, Select } from '@/components/UI';
import type { TableColumn } from '@/components/UI';
import type { Patient, PatientFormData } from '@/types';
import styles from './PatientsPage.module.scss';

export const PatientsPage = observer(() => {
  const { activePatients, patientsLoading, createPatient, updatePatient, deletePatient } = dataStore;
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
    if (!form.firstName || !form.lastName || !form.birthDate) { uiStore.showError('Заполните обязательные поля'); return; }
    try {
      if (modalMode === 'create') await createPatient(form); else if (editingId) await updatePatient(editingId, form);
      uiStore.showSuccess(modalMode === 'create' ? 'Пациент добавлен' : 'Данные обновлены');
      setModalOpen(false); resetForm();
    } catch { uiStore.showError('Ошибка сохранения'); }
  };

  const handleDelete = (id: string) => { uiStore.showConfirm('Удаление', 'Удалить пациента?', async () => { await deletePatient(id); uiStore.showSuccess('Пациент удалён'); }); };

  const canManage = authStore.canManagePatients();

  const baseColumns: TableColumn<Patient>[] = [
    { key: 'lastName', title: 'Фамилия' },
    { key: 'firstName', title: 'Имя' },
    { key: 'birthDate', title: 'Дата рождения', width: '120px', render: (v: unknown) => new Date(v as string).toLocaleDateString('ru-RU') },
    { key: 'gender', title: 'Пол', width: '80px', render: (v: unknown) => (v === 'male' ? 'М' : 'Ж') },
    { key: 'diagnosis', title: 'Диагноз', render: (v: unknown) => (v as string)?.substring(0, 30) || '—' },
  ];

  const actionsColumn: TableColumn<Patient> = {
    key: 'actions', title: '', width: '100px', render: (_: unknown, row: Patient) => (
      <div className={styles.actions}>
        <Button size="sm" variant="ghost" onClick={() => openEditModal(row)}><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" /><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" /></svg></Button>
        <Button size="sm" variant="ghost" onClick={() => handleDelete(row.id)}><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16"><polyline points="3 6 5 6 21 6" /><path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" /></svg></Button>
      </div>
    ),
  };

  const columns: TableColumn<Patient>[] = canManage ? [...baseColumns, actionsColumn] : baseColumns;

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div><h1 className={styles.title}>Пациенты</h1><p className={styles.subtitle}>{canManage ? 'Управление карточками пациентов' : 'Просмотр списка пациентов'}</p></div>
        {canManage && <Button variant="primary" onClick={openCreateModal}>Добавить пациента</Button>}
      </div>

      <Card padding="none">
        <Table columns={columns} data={activePatients} keyField="id" loading={patientsLoading} emptyText="Нет пациентов" />
      </Card>

      {canManage && (
        <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={modalMode === 'create' ? 'Новый пациент' : 'Редактировать'}
          footer={<div className={styles.modalFooter}><Button variant="ghost" onClick={() => setModalOpen(false)}>Отмена</Button><Button variant="primary" onClick={handleSave}>Сохранить</Button></div>}>
          <div className={styles.form}>
            <Input label="Фамилия *" value={form.lastName} onChange={e => setForm({ ...form, lastName: e.target.value })} />
            <Input label="Имя *" value={form.firstName} onChange={e => setForm({ ...form, firstName: e.target.value })} />
            <Input label="Отчество" value={form.middleName || ''} onChange={e => setForm({ ...form, middleName: e.target.value })} />
            <div className={styles.row}>
              <Input label="Дата рождения *" type="date" value={form.birthDate} onChange={e => setForm({ ...form, birthDate: e.target.value })} />
              <Select label="Пол" options={[{ value: 'male', label: 'Мужской' }, { value: 'female', label: 'Женский' }]} value={form.gender} onChange={e => setForm({ ...form, gender: e.target.value as 'male' | 'female' })} />
            </div>
            <div className={styles.row}>
              <Input label="Телефон" value={form.phone || ''} onChange={e => setForm({ ...form, phone: e.target.value })} />
              <Input label="Email" type="email" value={form.email || ''} onChange={e => setForm({ ...form, email: e.target.value })} />
            </div>
            <Input label="Диагноз" value={form.diagnosis || ''} onChange={e => setForm({ ...form, diagnosis: e.target.value })} />
          </div>
        </Modal>
      )}
    </div>
  );
});
