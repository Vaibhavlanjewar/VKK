import React, { useState, useEffect, useCallback } from 'react';
import API from '../api/api';

const Dashboard = () => {
  const [loading, setLoading] = useState(true);
  const [income, setIncome] = useState({ daily: 0, weekly: 0, monthly: 0, yearly: 0 });
  const [inventory, setInventory] = useState({
    totalCount: 0,
    lowStockList: [],
    expiringList: []
  });

  const loadDashboardData = useCallback(async () => {
    try {
      setLoading(true);
      // Fetching all data from your specific backend routes
      const [allProdRes, billsRes, lowRes, expRes] = await Promise.all([
        API.get("/products"),
        API.get("/bills"),
        API.get("/products-low-stock"),
        API.get("/products-expiring")
      ]);

      // 1. Process Products & Stats
      const products = allProdRes.data ? Object.values(allProdRes.data) : [];
      const lowStock = lowRes.data ? Object.values(lowRes.data) : [];
      const expiring = expRes.data ? Object.values(expRes.data) : [];
      
      setInventory({
        totalCount: products.length,
        lowStockList: lowStock,
        expiringList: expiring
      });

      // 2. Process Bills & Financials
      const bills = billsRes.data ? Object.values(billsRes.data) : [];
      calculateFinancials(bills);

    } catch (err) {
      console.error("Dashboard Fetch Error:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  const calculateFinancials = (bills) => {
    const now = new Date();
    let d = 0, w = 0, m = 0, y = 0;

    bills.forEach(bill => {
      const billDate = new Date(bill.date);
      const amount = Number(bill.total) || 0;
      if (isNaN(billDate.getTime())) return;

      // Daily
      if (billDate.toDateString() === now.toDateString()) d += amount;
      // Monthly
      if (billDate.getMonth() === now.getMonth() && billDate.getFullYear() === now.getFullYear()) m += amount;
      // Yearly
      if (billDate.getFullYear() === now.getFullYear()) y += amount;
      // Weekly (Last 7 days)
      const diffDays = (now - billDate) / (1000 * 60 * 60 * 24);
      if (diffDays >= 0 && diffDays <= 7) w += amount;
    });

    setIncome({ daily: d, weekly: w, monthly: m, yearly: y });
  };

  useEffect(() => {
    loadDashboardData();
  }, [loadDashboardData]);

  if (loading) return <div className="container"><h2 className="text-dim">Syncing Data...</h2></div>;

  return (
    <div className="container">
      <div className="header-flex" style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '25px' }}>
        <h2 style={{ fontWeight: '800' }}>Executive Overview</h2>
        <button className="btn-edit" onClick={loadDashboardData} style={{ width: 'auto' }}>↻ Refresh Metrics</button>
      </div>

      {/* Financial Grid */}
      <div className="dashboard-grid">
        <div className="card income-card">
          <label>Today's Sales</label>
          <h1 className="price-text">₹{income.daily.toLocaleString('en-IN')}</h1>
        </div>
        <div className="card income-card">
          <label>Weekly Sales</label>
          <h1>₹{income.weekly.toLocaleString('en-IN')}</h1>
        </div>
        <div className="card income-card">
          <label>Monthly Revenue</label>
          <h1>₹{income.monthly.toLocaleString('en-IN')}</h1>
        </div>
        <div className="card income-card">
          <label>Yearly Total</label>
          <h1>₹{income.yearly.toLocaleString('en-IN')}</h1>
        </div>
      </div>

      {/* Inventory Stats */}
      <h2 style={{ marginTop: '40px', marginBottom: '20px' }}>Inventory Intelligence</h2>
      <div className="dashboard-grid">
        <div className="card">
          <label>Total Catalog</label>
          <h1>{inventory.totalCount} <small style={{fontSize: '0.8rem', color: 'var(--text-dim)'}}>Items</small></h1>
        </div>
        <div className="card" style={{ borderLeft: '5px solid var(--warning)' }}>
          <label style={{ color: 'var(--warning)' }}>Critically Low</label>
          <h1 className="text-warning">{inventory.lowStockList.length}</h1>
        </div>
        <div className="card" style={{ borderLeft: '5px solid var(--danger)' }}>
          <label style={{ color: 'var(--danger)' }}>Expiring (30 Days)</label>
          <h1 className="text-danger">{inventory.expiringList.length}</h1>
        </div>
      </div>

      {/* Detailed Lists Section */}
      <div className="inventory-details-grid">
        {/* Low Stock Table */}
        <div className="card list-card">
          <div className="list-header">
            <h3>Stock Alerts</h3>
            <span className="badge-warning">{inventory.lowStockList.length} Items</span>
          </div>
          <div className="scroll-area">
            <table className="mini-table">
              <thead><tr><th>Product Name</th><th>Stock Left</th></tr></thead>
              <tbody>
                {inventory.lowStockList.map(item => (
                  <tr key={item.id}>
                    <td>{item.product || item.name}</td>
                    <td className="text-danger">{item.stock} {item.unit}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Expiring Table */}
        <div className="card list-card">
          <div className="list-header">
            <h3>Expiry Alerts</h3>
            <span className="badge-danger">{inventory.expiringList.length} Items</span>
          </div>
          <div className="scroll-area">
            <table className="mini-table">
              <thead><tr><th>Product Name</th><th>Expiry Date</th></tr></thead>
              <tbody>
                {inventory.expiringList.map(item => (
                  <tr key={item.id}>
                    <td>{item.product || item.name}</td>
                    <td className="text-warning">{new Date(item.expiry).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;