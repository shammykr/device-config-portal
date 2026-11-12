import { Navigate, Route, Routes } from 'react-router-dom';
import { AppLayout } from './components/layout/AppLayout';
import { useDeviceStatusSubscription } from './hooks/useDevices';
import { DevicesPage } from './pages/devices/DevicesPage';
import { FirmwarePoliciesPage } from './pages/firmware/FirmwarePoliciesPage';

export function App() {
  // One app-wide subscription keeps device status live on every page.
  useDeviceStatusSubscription();

  return (
    <Routes>
      <Route element={<AppLayout />}>
        <Route index element={<Navigate to="/devices" replace />} />
        <Route path="/devices" element={<DevicesPage />} />
        <Route path="/firmware" element={<FirmwarePoliciesPage />} />
      </Route>
    </Routes>
  );
}
