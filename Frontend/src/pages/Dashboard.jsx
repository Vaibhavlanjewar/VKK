import React, { useState, useEffect, useCallback } from 'react';
import { auth } from '../firebase/firebaseConfig';
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
      // Don't wrap the whole thing in setLoading(true) if we are already loading
      const [allProdRes, billsRes, lowRes, expRes] = await Promise.all([
        API.get("/products"),
        API.get("/bills"),
        API.get("/products-low-stock"),
        API.get("/products-expiring")
      ]);

      const products = allProdRes.data ? Object.values(allProdRes.data) : [];
      const lowStock = lowRes.data ? Object.values(lowRes.data) : [];
      const expiring = expRes.data ? Object.values(expRes.data) : [];
      
      setInventory({
        totalCount: products.length,
        lowStockList: lowStock,
        expiringList: expiring
      });

      const bills = billsRes.data ? Object.values(billsRes.data) : [];
      calculateFinancials(bills);

    } catch (err) {
      console.error("Dashboard Fetch Error:", err);
      // If we get a 403 or 401, we should probably show the user they aren't an admin
      if (err.response?.status === 403) {
        alert("Access Denied: You are not authorized as an Admin.");
      }
    } finally {
      setLoading(false); // ALWAYS stop loading regardless of success or failure
    }
  }, []);

  const calculateFinancials = (bills) => {
    const now = new Date();
    let d = 0, w = 0, m = 0, y = 0;

    bills.forEach(bill => {
      const billDate = new Date(bill.date);
      const amount = Number(bill.total) || 0;
      if (isNaN(billDate.getTime())) return;

      if (billDate.toDateString() === now.toDateString()) d += amount;
      if (billDate.getMonth() === now.getMonth() && billDate.getFullYear() === now.getFullYear()) m += amount;
      if (billDate.getFullYear() === now.getFullYear()) y += amount;
      
      const diffDays = (now - billDate) / (1000 * 60 * 60 * 24);
      if (diffDays >= 0 && diffDays <= 7) w += amount;
    });

    setIncome({ daily: d, weekly: w, monthly: m, yearly: y });
  };

  useEffect(() => {
    // onAuthStateChanged is the best way to handle refreshes
    const unsubscribe = auth.onAuthStateChanged(async (user) => {
      if (user) {
        console.log("Logged in as:", user.email);
        await loadDashboardData();
      } else {
        // If no user is found after 3 seconds, stop the spinner so 
        // they can see the empty dashboard or login prompt
        setTimeout(() => setLoading(false), 3000);
      }
    });

    return () => unsubscribe();
  }, [loadDashboardData]);

  if (loading) {
    return (
      <div className="container" style={{ textAlign: 'center', marginTop: '100px' }}>
        <h2 className="text-dim">Syncing Vaibhav Krishi Kendra...</h2>
        <p>Verifying Admin Credentials</p>
        <div className="loader" style={{ margin: '20px auto' }}></div> 
      </div>
    );
  }

  return (
    <div className="container">
      <div className="header-flex" style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '25px', alignItems: 'center' }}>
        <h2 style={{ fontWeight: '800' }}>Executive Overview</h2>
        <button className="btn-edit" onClick={() => { setLoading(true); loadDashboardData(); }} style={{ width: 'auto', padding: '10px 20px' }}>
          ↻ Refresh Metrics
        </button>
      </div>

      {/* Financial Grid */}
      <div className="dashboard-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px' }}>
        <div className="card income-card">
          <label>Today's Sales</label>
          <h1 className="price-text" style={{ color: '#2ecc71' }}>₹{income.daily.toLocaleString('en-IN')}</h1>
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
      <div className="dashboard-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px' }}>
        <div className="card">
          <label>Total Catalog</label>
          <h1>{inventory.totalCount} <small style={{fontSize: '0.8rem', color: 'gray'}}>Items</small></h1>
        </div>
        <div className="card" style={{ borderLeft: '5px solid #f1c40f' }}>
          <label style={{ color: '#f1c40f' }}>Critically Low</label>
          <h1 style={{ color: '#f1c40f' }}>{inventory.lowStockList.length}</h1>
        </div>
        <div className="card" style={{ borderLeft: '5px solid #e74c3c' }}>
          <label style={{ color: '#e74c3c' }}>Expiring (30 Days)</label>
          <h1 style={{ color: '#e74c3c' }}>{inventory.expiringList.length}</h1>
        </div>
      </div>

      {/* Detailed Lists Section */}
      <div className="inventory-details-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px', marginTop: '30px' }}>
        <div className="card list-card">
          <div className="list-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3>Stock Alerts</h3>
            <span style={{ backgroundColor: '#f1c40f', color: '#000', padding: '2px 8px', borderRadius: '5px', fontSize: '0.8rem' }}>
              {inventory.lowStockList.length} Items
            </span>
          </div>
          <div className="scroll-area" style={{ maxHeight: '300px', overflowY: 'auto' }}>
            <table className="mini-table" style={{ width: '100%', marginTop: '10px' }}>
              <thead><tr><th align="left">Product</th><th align="right">Stock</th></tr></thead>
              <tbody>
                {inventory.lowStockList.length > 0 ? inventory.lowStockList.map((item, idx) => (
                  <tr key={idx}>
                    <td>{item.product || item.name}</td>
                    <td align="right" style={{ color: '#e74c3c', fontWeight: 'bold' }}>{item.stock} {item.unit}</td>
                  </tr>
                )) : <tr><td colSpan="2" style={{textAlign: 'center', padding: '20px'}}>All stock levels healthy</td></tr>}
              </tbody>
            </table>
          </div>
        </div>

        <div className="card list-card">
          <div className="list-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3>Expiry Alerts</h3>
            <span style={{ backgroundColor: '#e74c3c', color: '#fff', padding: '2px 8px', borderRadius: '5px', fontSize: '0.8rem' }}>
              {inventory.expiringList.length} Items
            </span>
          </div>
          <div className="scroll-area" style={{ maxHeight: '300px', overflowY: 'auto' }}>
            <table className="mini-table" style={{ width: '100%', marginTop: '10px' }}>
              <thead><tr><th align="left">Product</th><th align="right">Expiry</th></tr></thead>
              <tbody>
                {inventory.expiringList.length > 0 ? inventory.expiringList.map((item, idx) => (
                  <tr key={idx}>
                    <td>{item.product || item.name}</td>
                    <td align="right" style={{ color: '#f39c12' }}>{new Date(item.expiry).toLocaleDateString()}</td>
                  </tr>
                )) : <tr><td colSpan="2" style={{textAlign: 'center', padding: '20px'}}>No upcoming expiries</td></tr>}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
