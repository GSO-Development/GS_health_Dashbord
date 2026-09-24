import React, { useState, useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import Header from './Header';
import { checkDatabaseHealth } from '../../services/api';

const Layout = () => {
  const [theme, setTheme] = useState('light');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [dbHealth, setDbHealth] = useState(null);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    const health = await checkDatabaseHealth();
    setDbHealth(health);
    setTimeout(() => setIsRefreshing(false), 600);
  };

  const toggleSidebar = () => {
    if (window.innerWidth <= 768) {
      setMobileOpen(prev => !prev);
    } else {
      setSidebarCollapsed(prev => !prev);
    }
  };

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', 'light');
    handleRefresh();
  }, []);

  return (
    <div className="app-container">
      {/* Sidebar Navigation */}
      <Sidebar 
        mobileOpen={mobileOpen}
        setMobileOpen={setMobileOpen}
        sidebarCollapsed={sidebarCollapsed}
        setSidebarCollapsed={setSidebarCollapsed}
      />

      {/* Main Content */}
      <div className="main-content">
        {/* Top Header */}
        <Header 
          theme={theme} 
          setTheme={setTheme} 
          onRefresh={handleRefresh} 
          isRefreshing={isRefreshing} 
          setMobileOpen={setMobileOpen}
          toggleSidebar={toggleSidebar}
          sidebarCollapsed={sidebarCollapsed}
        />

        {/* Page Body */}
        <main className="page-body">
          {/* Render Active Route View */}
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default Layout;
