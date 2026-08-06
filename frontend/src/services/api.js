import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Check database and backend server health
export const checkDatabaseHealth = async () => {
  try {
    const response = await api.get('/health');
    return response.data;
  } catch (error) {
    return {
      status: 'error',
      message: 'Backend API connection failed',
      database: 'gsh_dashboard'
    };
  }
};

// Executive Dashboard FY Overview API
export const fetchDashboardFyOverview = async (month = 'july') => {
  try {
    const response = await api.get('/reports/dashboard-fy-overview', {
      params: { month }
    });
    return response.data;
  } catch (error) {
    console.warn('API error fetching dashboard FY overview:', error);
    return null;
  }
};

// 1. Total Budget (from Total Budget.xlsx sheet)
export const fetchTotalBudget = async (page = 1, limit = 10, search = '', month = 'august') => {
  try {
    const response = await api.get('/reports/total-budget', {
      params: { page, limit, search, month }
    });
    return response.data;
  } catch (error) {
    console.warn('API error fetching total budget:', error);
    return null;
  }
};

// 2. Dis Budget (from Dis Budget.xlsx sheet)
export const fetchDisBudget = async (page = 1, limit = 10, search = '', division = '', qtr = '', month_num = 8) => {
  try {
    const response = await api.get('/reports/dis-budget', {
      params: { page, limit, search, division, qtr, month_num }
    });
    return response.data;
  } catch (error) {
    console.warn('API error fetching dis budget:', error);
    return null;
  }
};

// 3. Customer Invoice Lines (108k+ records, paginated)
export const fetchCustomerInvoiceLines = async (page = 1, limit = 50, search = '', company = '') => {
  try {
    const response = await api.get('/reports/customer-invoice-lines', {
      params: { page, limit, search, company }
    });
    return response.data;
  } catch (error) {
    console.warn('API error fetching customer invoice lines:', error);
    return null;
  }
};

// 4. Invoiced Sales (Divasa / GSHD)
export const fetchInvoicedSales = async (search = '') => {
  try {
    const response = await api.get('/reports/invoiced-sales', {
      params: { search }
    });
    return response.data;
  } catch (error) {
    console.warn('API error fetching invoiced sales:', error);
    return null;
  }
};

// 5. Outstanding Orders (Distributor Reserved Sales)
export const fetchOutstandingOrders = async (search = '') => {
  try {
    const response = await api.get('/reports/outstanding-orders', {
      params: { search }
    });
    return response.data;
  } catch (error) {
    console.warn('API error fetching outstanding orders:', error);
    return null;
  }
};

// 6. Reserved Sales Summary (GSH1N GSHD)
export const fetchReservedSalesSummary = async () => {
  try {
    const response = await api.get('/reports/reserved-sales-summary');
    return response.data;
  } catch (error) {
    console.warn('API error fetching reserved sales summary:', error);
    return null;
  }
};

// 7. Invoice Output
export const fetchInvoiceOutput = async (page = 1, limit = 50, search = '') => {
  try {
    const response = await api.get('/reports/invoice-output', {
      params: { page, limit, search }
    });
    return response.data;
  } catch (error) {
    console.warn('API error fetching invoice output:', error);
    return null;
  }
};

// 8. Outstanding Output
export const fetchOutstandingOutput = async (search = '') => {
  try {
    const response = await api.get('/reports/outstanding-output', {
      params: { search }
    });
    return response.data;
  } catch (error) {
    console.warn('API error fetching outstanding output:', error);
    return null;
  }
};

// Reseed DB endpoint
export const reseedDatabase = async () => {
  try {
    const response = await api.post('/seed');
    return response.data;
  } catch (error) {
    return { message: 'Failed to reseed database' };
  }
};

export default api;
