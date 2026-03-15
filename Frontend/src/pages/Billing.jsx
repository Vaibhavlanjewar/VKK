import React, { useState, useEffect, useMemo, useCallback } from 'react';
import API from '../api/api';
import { auth } from '../firebase/firebaseConfig';
import Cart from '../components/Cart';

const Billing = () => {
  const [products, setProducts] = useState([]);
  const [cart, setCart] = useState([]);
  const [invoiceId, setInvoiceId] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [loading, setLoading] = useState(true); // Added loading state
  const [customer, setCustomer] = useState({ name: "", mobile: "" });

  const fetchProducts = useCallback(async () => {
    try {
      const res = await API.get("/products");
      const data = res.data ? Object.values(res.data) : [];
      setProducts(data);
    } catch (err) {
      console.error("Failed to fetch products", err);
    } finally {
      setLoading(false);
    }
  }, []);

  // WAIT FOR AUTH BEFORE FETCHING
  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      if (user) {
        fetchProducts();
      } else {
        // Stop loading after 3 seconds if no user found
        setTimeout(() => setLoading(false), 3000);
      }
    });
    return () => unsubscribe();
  }, [fetchProducts]);

  const filteredProducts = useMemo(() => {
    return products.filter(p => 
      p.product?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.brand?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [products, searchTerm]);

  const addToCart = useCallback((product) => {
    if (invoiceId) return;
    const pId = product.id || product._id;
    if (Number(product.stock) <= 0) { 
      alert("Out of stock!"); 
      return; 
    }

    setCart(prevCart => {
      const existing = prevCart.find(item => (item.id || item._id) === pId);
      if (existing) {
        if (existing.qty >= product.stock) {
          alert("Cannot exceed available stock");
          return prevCart;
        }
        return prevCart.map(item => (item.id || item._id) === pId ? { ...item, qty: item.qty + 1 } : item);
      }
      return [...prevCart, { ...product, qty: 1 }];
    });
  }, [invoiceId]);

  const updateQty = useCallback((id, delta) => {
    setCart(prev => prev.map(item => {
      if ((item.id || item._id) === id) {
        const newQty = item.qty + delta;
        if (newQty > 0 && newQty <= Number(item.stock)) return { ...item, qty: newQty };
      }
      return item;
    }));
  }, []);

  const removeItem = useCallback((id) => {
    setCart(prev => prev.filter(item => (item.id || item._id) !== id));
  }, []);

  const handleCheckout = async () => {
    if (isProcessing || cart.length === 0) return;
    if (!customer.name.trim()) { alert("Enter customer name"); return; }

    setIsProcessing(true);
    try {
      const payload = {
        customerName: customer.name,
        mobile: customer.mobile,
        items: cart.map(i => ({
          id: i.id || i._id, 
          product: i.product,
          quantity: i.qty,
          selling: i.selling,
          wt: i.wt,
          unit: i.unit
        })),
        gstPercent: 18
      };
      
      const res = await API.post("/bills", payload);
      setInvoiceId(res.data.bill.invoiceNumber);
      alert("Bill Generated Successfully!");
      fetchProducts(); // Refresh stock after sale
    } catch (err) {
      alert(err.response?.data?.error || "Checkout Failed");
    } finally {
      setIsProcessing(false);
    }
  };

  const downloadPdf = async () => {
    if (!invoiceId) return;
    try {
      const user = auth.currentUser;
      const token = user ? await user.getIdToken() : "";
      
      // FIXED: Use the Vercel Backend URL instead of localhost
      const backendBaseUrl = import.meta.env.VITE_API_URL || "http://localhost:5000";
      window.open(`${backendBaseUrl}/api/bills/${invoiceId}/pdf?token=${token}`, "_blank");
    } catch (err) { 
      alert("Error downloading PDF"); 
    }
  };

  if (loading) {
    return (
      <div className="container" style={{ textAlign: 'center', marginTop: '100px' }}>
        <h2 className="text-dim">Initialising Billing Engine...</h2>
        <div className="loader" style={{ margin: '20px auto' }}></div>
      </div>
    );
  }

  return (
    <div className="container">
      <div className="billing-container">
        <div className="selection-section">
          <div className="customer-info" style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
            <input type="text" placeholder="👤 Customer Name" value={customer.name} 
              onChange={(e) => setCustomer({...customer, name: e.target.value})} disabled={invoiceId}
              style={{ padding: '12px', borderRadius: '8px', border: '1px solid var(--border)', flex: 1, background: 'var(--card-bg)', color: 'white' }}
            />
            <input type="text" placeholder="📞 Mobile (Optional)" value={customer.mobile} 
              onChange={(e) => setCustomer({...customer, mobile: e.target.value})} disabled={invoiceId}
              style={{ padding: '12px', borderRadius: '8px', border: '1px solid var(--border)', flex: 1, background: 'var(--card-bg)', color: 'white' }}
            />
          </div>

          <div className="search-bar" style={{ marginBottom: '20px' }}>
            <input type="text" placeholder="🔍 Search by Product or Brand..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
              style={{ width: '100%', padding: '15px', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--card-bg)', color: 'white' }}
            />
          </div>

          <div className="dashboard-grid">
            {filteredProducts.map(p => (
              <div key={p.id || p._id} className="card product-card" 
                onClick={() => (!invoiceId && Number(p.stock) > 0) && addToCart(p)}
                style={{ 
                  opacity: (Number(p.stock) <= 0 || invoiceId) ? 0.6 : 1,
                  cursor: (Number(p.stock) <= 0 || invoiceId) ? 'not-allowed' : 'pointer',
                  border: '1px solid var(--border)' 
                }}>
                <h4 style={{ margin: '0 0 10px 0' }}>{p.product}</h4>
                <p style={{ color: 'var(--text-dim)', fontSize: '0.9rem' }}>{p.brand}</p>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '10px' }}>
                   <span style={{ fontWeight: 'bold', color: 'var(--primary-green)' }}>₹{p.selling}</span>
                   <span style={{ fontSize: '0.8rem', color: Number(p.stock) < 5 ? 'var(--danger)' : 'var(--text-dim)' }}>
                     Stock: {p.stock}
                   </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="cart-sticky-wrapper">
          <Cart 
            cart={cart} 
            updateQty={updateQty} 
            removeItem={removeItem} 
            onCheckout={handleCheckout} 
            invoiceId={invoiceId}
            downloadPdf={downloadPdf} 
            isProcessing={isProcessing}
            customerName={customer.name} 
            mobile={customer.mobile}
            resetBilling={() => { // Helper to start a new bill
                setCart([]);
                setInvoiceId(null);
                setCustomer({ name: "", mobile: "" });
            }}
          />
        </div>
      </div>
    </div>
  );
};

export default Billing;
