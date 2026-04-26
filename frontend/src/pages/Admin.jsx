import React from 'react';
import { Routes, Route } from 'react-router-dom';
import AdminLayout from '../components/Admin/AdminLayout';
import Dashboard from '../components/Admin/Dashboard';
import AirlinesPage from '../components/Admin/AirlinesPage';
import AirportsPage from '../components/Admin/AirportsPage';
import FlightsPage from '../components/Admin/FlightsPage';
import SchedulesPage from '../components/Admin/SchedulesPage';
import BookingsPage from '../components/Admin/BookingsPage';
import PaymentsPage from '../components/Admin/PaymentsPage';
import UsersPage from '../components/Admin/UsersPage';
import LogsPage from '../components/Admin/LogsPage';

const Admin = () => {
  return (
    <Routes>
      <Route element={<AdminLayout />}>
        <Route index element={<Dashboard />} />
        <Route path="airlines" element={<AirlinesPage />} />
        <Route path="airports" element={<AirportsPage />} />
        <Route path="flights" element={<FlightsPage />} />
        <Route path="schedules" element={<SchedulesPage />} />
        <Route path="users" element={<UsersPage />} />
        <Route path="bookings" element={<BookingsPage />} />
        <Route path="payments" element={<PaymentsPage />} />
        <Route path="logs" element={<LogsPage />} />
      </Route>
    </Routes>
  );
};

export default Admin;
