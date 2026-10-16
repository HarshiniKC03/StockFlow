import React, { createContext, useContext, useState, useEffect } from 'react';
import { authApi, warehouseApi } from '../api/client';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [token, setToken] = useState(() => localStorage.getItem('stockflow_token'));
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('stockflow_user');
    return saved ? JSON.parse(saved) : null;
  });
  const [warehouses, setWarehouses] = useState([]);
  const [selectedWarehouse, setSelectedWarehouse] = useState(null);
  const [theme, setTheme] = useState(() => localStorage.getItem('stockflow_theme') || 'dark');

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('stockflow_theme', theme);
  }, [theme]);

  useEffect(() => {
    if (token) {
      loadWarehouses();
    }
  }, [token]);

  const loadWarehouses = async () => {
    try {
      const res = await warehouseApi.getAll(true);
      setWarehouses(res.data);
      if (res.data.length > 0 && !selectedWarehouse) {
        setSelectedWarehouse(res.data[0]);
      }
    } catch (err) {
      console.error('Failed to load warehouses', err);
    }
  };

  const login = async (username, password) => {
    const res = await authApi.login({ username, password });
    const authData = res.data;
    setToken(authData.accessToken);
    setUser(authData);
    localStorage.setItem('stockflow_token', authData.accessToken);
    localStorage.setItem('stockflow_user', JSON.stringify(authData));
    await loadWarehouses();
    return authData;
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem('stockflow_token');
    localStorage.removeItem('stockflow_user');
  };

  const toggleTheme = () => {
    setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'));
  };

  const roles = user?.roles || [];
  const isAdmin = roles.includes('ROLE_ADMIN');
  const isManager = roles.includes('ROLE_INVENTORY_MANAGER') || isAdmin;
  const isSales = roles.includes('ROLE_SALES_EMPLOYEE') || isManager || isAdmin;

  return (
    <AuthContext.Provider
      value={{
        token,
        user,
        roles,
        isAdmin,
        isManager,
        isSales,
        warehouses,
        selectedWarehouse,
        setSelectedWarehouse,
        theme,
        toggleTheme,
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
