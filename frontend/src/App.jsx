import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Sidebar } from './components/Sidebar';
import { Navbar } from './components/Navbar';
import { Login } from './pages/Login';
import { Dashboard } from './pages/Dashboard';
import { Products } from './pages/Products';
import { Inventory } from './pages/Inventory';
import { Orders } from './pages/Orders';
import { SuppliersCategories } from './pages/SuppliersCategories';
import { Users } from './pages/Users';
import { Reports } from './pages/Reports';
import { AuditLogs } from './pages/AuditLogs';

function MainApp() {
  const { token, user } = useAuth();
  const [activePage, setActivePage] = useState('dashboard');

  if (!token || !user) {
    return <Login />;
  }

  return (
    <div className="app-container">
      <Sidebar activePage={activePage} setActivePage={setActivePage} />
      <div className="main-content">
        <Navbar />
        <main style={{ minHeight: 'calc(100vh - 70px)' }}>
          {activePage === 'dashboard' && <Dashboard setActivePage={setActivePage} />}
          {activePage === 'products' && <Products />}
          {activePage === 'inventory' && <Inventory />}
          {activePage === 'orders' && <Orders />}
          {activePage === 'suppliers-categories' && <SuppliersCategories />}
          {activePage === 'users' && <Users />}
          {activePage === 'reports' && <Reports />}
          {activePage === 'audit-logs' && <AuditLogs />}
        </main>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <MainApp />
    </AuthProvider>
  );
}
