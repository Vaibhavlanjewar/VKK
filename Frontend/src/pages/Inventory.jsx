import React, { useState, useEffect, useCallback } from 'react';
import API from '../api/api';

const Inventory = () => {
  const [products, setProducts] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(false);

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

  // Agricultural Categories
  const categories = ["Seeds", "Fertilizers", "Pesticides", "Vermicide", "Herbicides", "Tools", "General"];

  const loadData = useCallback(async () => {
    try {
      const res = await API.get("/products");
      const data = res.data ? Object.values(res.data) : [];
      setProducts(data);
    } catch (err) {
      console.error("Error loading products:", err);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const getExpiryStatus = (date) => {
    if (!date) return { color: 'var(--text-dim)', label: 'N/A' };
    const today = new Date();
    const expDate = new Date(date);
    const diffDays = Math.ceil((expDate - today) / (1000 * 60 * 60 * 24));
    if (diffDays < 0) return { color: 'var(--danger)', label: 'Expired' };
    if (diffDays <= 30) return { color: 'var(--warning)', label: 'Expiring Soon' };
    return { color: 'var(--primary-green)', label: 'Good' };
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (editingId) {
        await API.put(`/products/${editingId}`, form);
      } else {
        await API.post("/products", form);
      }
      setForm(initialForm);
      setEditingId(null);
      loadData();
    } catch (err) {
      alert("Action failed. Check backend connection.");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm("Delete this product?")) {
      try {
        await API.delete(`/products/${id}`);
        loadData();
      } catch (err) {
        alert("Delete failed");
      }
    }
  };

  return (
    <div className="container">
      <div className="header-flex">
        <h2>Inventory Management</h2>
        <span className="badge">{products.length} Products</span>
      </div>

      <form className="inventory-form card" onSubmit={handleSubmit}>
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
          <label>Weight / Volume</label>
          <div className="input-group">
            <input type="number" placeholder="Value" value={form.wt} onChange={e => setForm({...form, wt: e.target.value})} required />
            <select value={form.unit} onChange={e => setForm({...form, unit: e.target.value})}>
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
          <label>Stock Qty</label>
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

        <button type="submit" className="btn-add" disabled={loading} style={{ gridColumn: 'span 2' }}>
          {editingId ? "UPDATE PRODUCT" : "SAVE PRODUCT"}
        </button>
      </form>

      <div className="table-container">
        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>Product Details</th>
                <th>Category</th>
                <th>Pack Size</th>
                <th>Stock</th>
                <th>Expiry</th>
                <th>Price</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {products.map(p => {
                const status = getExpiryStatus(p.expiry);
                return (
                  <tr key={p.id || p._id}>
                    <td>
                      <div className="prod-name">{p.product}</div>
                      <small className="sub-text">{p.brand} | B: {p.batch}</small>
                    </td>
                    <td><span className="cat-tag">{p.category}</span></td>
                    <td><span className="unit-tag">{p.wt} {p.unit}</span></td>
                    <td><span style={{fontWeight: 'bold', color: Number(p.stock) < 10 ? 'var(--danger)' : 'white'}}>{p.stock}</span></td>
                    <td>
                      <div style={{ color: status.color, fontWeight: '600' }}>{p.expiry || 'N/A'}</div>
                      <small style={{ color: status.color, fontSize: '10px' }}>{status.label}</small>
                    </td>
                    <td className="price-text">₹{p.selling}</td>
                    <td>
                      <button className="btn-edit" onClick={() => {setEditingId(p.id || p._id); setForm(p);}}>Edit</button>
                      <button className="btn-danger" onClick={() => handleDelete(p.id || p._id)}>Delete</button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Inventory;