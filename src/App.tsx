import { useEffect } from 'react';
import { observer } from 'mobx-react-lite';
import { navigationStore, dataStore } from '@/store';
import { MainLayout, LoginModal, ConfirmModal, Toast } from '@/components';
import { HomePage, PatientsPage, MeasurementsPage, AdminPage } from '@/pages';

const PageRouter = observer(() => {
  const { currentPage } = navigationStore;
  switch (currentPage) {
    case 'home': return <HomePage />;
    case 'patients': return <PatientsPage />;
    case 'measurements': return <MeasurementsPage />;
    case 'admin': case 'admin-patients': case 'admin-measurements': return <AdminPage />;
    default: return <HomePage />;
  }
});

const App = observer(() => { useEffect(() => { dataStore.loadAllData(); }, []); return (<><MainLayout><PageRouter /></MainLayout><LoginModal /><ConfirmModal /><Toast /></>); });
export default App;
