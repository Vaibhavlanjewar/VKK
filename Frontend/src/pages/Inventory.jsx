import React, { useState, useEffect, useCallback } from 'react';
import { auth } from '../firebase/firebaseConfig'; 
import API from '../api/api';

const Inventory = () => {
  const [products, setProducts] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  const initialForm = {
    product: "", 
    brand: "", 
    category: "Seeds", 
    wt: "", 
    unit: "kg", 
    wholesale: "", 
    selling: "", 
    discount: "0", 
    batch: "", 
    expiry: "", 
    stock: ""
  };
  const [form, setForm] = useState(initialForm);

  const categories = ["Seeds", "Fertilizers", "Pesticides", "Vermicide", "Herbicides", "Tools", "General"];

  const loadData = useCallback(async () => {
    try {
      const res = await API.get("/products");
      // Standardize data format from API
      const data = res.data ? (Array.isArray(res.data) ? res.data : Object.values(res.data)) : [];
      setProducts(data);
    } catch (err) {
      console.error("Error loading products:", err);
      if (err.response?.status === 403) {
        alert("Unauthorized: Only Admin emails can view inventory.");
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      if (user) {
        loadData();
      } else {
        // If no session after 3s, stop loading to show empty/login state
        const timer = setTimeout(() => setLoading(false), 3000);
        return () => clearTimeout(timer);
      }
    });
    return () => unsubscribe();
  }, [loadData]);

  const getExpiryStatus = (date) => {
    if (!date) return { color: '#888', label: 'N/A' };
    const today = new Date();
    const expDate = new Date(date);
    if (isNaN(expDate.getTime())) return { color: '#888', label: 'N/A' };

    const diffDays = Math.ceil((expDate - today) / (1000 * 60 * 60 * 24));
    if (diffDays < 0) return { color: '#e74c3c', label: 'Expired' };
    if (diffDays <= 30) return { color: '#f1c40f', label: 'Expiring Soon' };
    return { color: '#2ecc71', label: 'Good' };
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setActionLoading(true);
    
    // Clean data: Ensure numbers are numbers
    const cleanForm = {
      ...form,
      selling: Number(form.selling),
      stock: Number(form.stock),
      wt: Number(form.wt)
    };

    try {
      if (editingId) {
        await API.put(`/products/${editingId}`, cleanForm);
      } else {
        await API.post("/products", cleanForm);
      }
      setForm(initialForm);
      setEditingId(null);
      await loadData(); // Refresh list
    } catch (err) {
      console.error("Submit error:", err);
      alert(err.response?.data?.message || "Action failed. Check admin permissions.");
    } finally {
      setActionLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm("Delete this product permanently?")) {
      try {
        await API.delete(`/products/${id}`);
        setProducts(prev => prev.filter(p => (p._id || p.id) !== id));
      } catch (err) {
        alert("Delete failed. You may not have permission.");
      }
    }
  };

  if (loading) {
    return (
      <div className="container" style={{ textAlign: 'center', marginTop: '100px' }}>
        <h2 className="text-dim">Verifying Inventory Access...</h2>
        <div className="loader" style={{ margin: '20px auto' }}></div>
      </div>
    );
  }

  return (
    <div className="container">
      <div className="header-flex" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h2 style={{ fontWeight: '800' }}>Inventory Management</h2>
        <span className="badge" style={{ background: '#2ecc71', padding: '5px 15px', borderRadius: '20px' }}>
          {products.length} Products in Stock
        </span>
      </div>

      <form className="inventory-form card" onSubmit={handleSubmit} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '15px', padding: '20px', marginBottom: '30px', background: '#1a1a1a', borderRadius: '10px' }}>
        <div className="form-group">
          <label>Product Name</label>
          <input placeholder="e.g. Nitro" value={form.product} onChange={e => setForm({...form, product: e.target.value})} required />
        </div>

        <div className="form-group">
          <label>Category</label>
          <select value={form.category} onChange={e => setForm({...form, category: e.target.value})}>
            {categories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
          </select>
        </div>

        <div className="form-group">
          <label>Brand</label>
          <input placeholder="IFFCO / Bayer" value={form.brand} onChange={e => setForm({...form, brand: e.target.value})} />
        </div>

        <div className="form-group">
          <label>Pack Size</label>
          <div className="input-group" style={{ display: 'flex' }}>
            <input type="number" placeholder="Value" value={form.wt} onChange={e => setForm({...form, wt: e.target.value})} required style={{ flex: 1 }} />
            <select value={form.unit} onChange={e => setForm({...form, unit: e.target.value})} style={{ width: '80px' }}>
              <option value="kg">kg</option>
              <option value="gm">gm</option>
              <option value="Lit">Lit</option>
              <option value="ml">ml</option>
              <option value="pkt">pkt</option>
            </select>
          </div>
        </div>

        <div className="form-group">
          <label>Selling Price (₹)</label>
          <input type="number" placeholder="0" value={form.selling} onChange={e => setForm({...form, selling: e.target.value})} required />
        </div>

        <div className="form-group">
          <label>Current Stock</label>
          <input type="number" placeholder="0" value={form.stock} onChange={e => setForm({...form, stock: e.target.value})} required />
        </div>

        <div className="form-group">
          <label>Batch No</label>
          <input placeholder="BATCH123" value={form.batch} onChange={e => setForm({...form, batch: e.target.value})} />
        </div>

        <div className="form-group">
          <label>Expiry Date</label>
          <input type="date" value={form.expiry} onChange={e => setForm({...form, expiry: e.target.value})} />
        </div>

        <button type="submit" className="btn-add" disabled={actionLoading} style={{ gridColumn: '1 / -1', marginTop: '10px', padding: '12px', cursor: 'pointer', background: editingId ? '#f39c12' : '#2ecc71', color: 'white', border: 'none', borderRadius: '5px', fontWeight: 'bold' }}>
          {actionLoading ? "PROCESSING..." : editingId ? "⚡ UPDATE PRODUCT DETAILS" : "➕ ADD TO INVENTORY"}
        </button>
        {editingId && (
          <button type="button" onClick={() => {setEditingId(null); setForm(initialForm);}} style={{ gridColumn: '1 / -1', background: 'transparent', color: '#888', border: 'none', cursor: 'pointer' }}>
            Cancel Edit
          </button>
        )}
      </form>

      <div className="table-container" style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', background: '#1a1a1a', borderRadius: '10px' }}>
          <thead>
            <tr style={{ textAlign: 'left', borderBottom: '2px solid #333', color: '#888' }}>
              <th style={{ padding: '15px' }}>Product Details</th>
              <th>Category</th>
              <th>Pack Size</th>
              <th>Stock</th>
              <th>Expiry</th>
              <th>Price</th>
              <th style={{ padding: '15px' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {products.length > 0 ? products.map(p => {
              const status = getExpiryStatus(p.expiry);
              const pId = p._id || p.id;
              return (
                <tr key={pId} style={{ borderBottom: '1px solid #333' }}>
                  <td style={{ padding: '15px' }}>
                    <div style={{ fontWeight: 'bold', fontSize: '1.1rem' }}>{p.product}</div>
                    <small style={{ color: '#888' }}>{p.brand} | Batch: {p.batch || 'N/A'}</small>
                  </td>
                  <td><span style={{ background: '#333', padding: '3px 8px', borderRadius: '4px', fontSize: '0.85rem' }}>{p.category}</span></td>
                  <td>{p.wt} {p.unit}</td>
                  <td>
                    <span style={{ fontWeight: 'bold', color: Number(p.stock) < 10 ? '#e74c3c' : '#2ecc71' }}>
                      {p.stock}
                    </span>
                  </td>
                  <td>
                    <div style={{ color: status.color, fontWeight: '600' }}>{p.expiry || 'N/A'}</div>
                    <small style={{ color: status.color, fontSize: '10px', textTransform: 'uppercase' }}>{status.label}</small>
                  </td>
                  <td style={{ fontWeight: 'bold', color: '#2ecc71' }}>₹{p.selling}</td>
                  <td style={{ padding: '15px' }}>
                    <button className="btn-edit" onClick={() => {setEditingId(pId); setForm(p); window.scrollTo({top: 0, behavior: 'smooth'});}} style={{ marginRight: '10px', padding: '5px 10px', cursor: 'pointer' }}>Edit</button>
                    <button className="btn-danger" onClick={() => handleDelete(pId)} style={{ padding: '5px 10px', cursor: 'pointer', background: '#e74c3c', color: 'white', border: 'none', borderRadius: '3px' }}>Delete</button>
                  </td>
                </tr>
              );
            }) : (
              <tr>
                <td colSpan="7" style={{ textAlign: 'center', padding: '40px', color: '#888' }}>No products found in inventory.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Inventory;