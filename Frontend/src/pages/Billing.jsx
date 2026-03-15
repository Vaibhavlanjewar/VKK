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
  const [loading, setLoading] = useState(true);
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

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      if (user) {
        fetchProducts();
      } else {
        const timer = setTimeout(() => setLoading(false), 3000);
        return () => clearTimeout(timer);
      }
    });
    return () => unsubscribe();
  }, [fetchProducts]);

  const filteredProducts = useMemo(() => {
    const term = searchTerm.toLowerCase();
    return products.filter(p => 
      p.product?.toLowerCase().includes(term) ||
      p.brand?.toLowerCase().includes(term)
    );
  }, [products, searchTerm]);

  const addToCart = useCallback((product) => {
    if (invoiceId) return;
    const pId = product.id || product._id;
    
    if (Number(product.stock) <= 0) { 
      alert("⚠️ Out of stock!"); 
      return; 
    }

    setCart(prevCart => {
      const existing = prevCart.find(item => (item.id || item._id) === pId);
      if (existing) {
        if (existing.qty >= Number(product.stock)) {
          alert("⚠️ Insufficient stock available.");
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
        // Verify against stock
        if (newQty > 0 && newQty <= Number(item.stock)) {
          return { ...item, qty: newQty };
        } else if (newQty > Number(item.stock)) {
          alert("Maximum stock reached");
        }
      }
      return item;
    }));
  }, []);

  const removeItem = useCallback((id) => {
    setCart(prev => prev.filter(item => (item.id || item._id) !== id));
  }, []);

  const handleCheckout = async () => {
    if (isProcessing || cart.length === 0) return;
    if (!customer.name.trim()) { alert("Please enter Customer Name"); return; }

    setIsProcessing(true);
    try {
      const payload = {
        customerName: customer.name,
        mobile: customer.mobile,
        items: cart.map(i => ({
          id: i.id || i._id, 
          product: i.product,
          quantity: i.qty,
          selling: Number(i.selling),
          wt: i.wt,
          unit: i.unit
        })),
        gstPercent: 18
      };
      
      const res = await API.post("/bills", payload);
      setInvoiceId(res.data.bill.invoiceNumber);
      alert("✅ Bill Generated: " + res.data.bill.invoiceNumber);
      
      // Refresh stock immediately
      await fetchProducts(); 
    } catch (err) {
      alert(err.response?.data?.error || "Checkout Failed. Check stock availability.");
    } finally {
      setIsProcessing(false);
    }
  };

  const downloadPdf = async () => {
    if (!invoiceId) return;
    try {
      const user = auth.currentUser;
      const token = user ? await user.getIdToken() : "";
      
      // Handle trailing slashes in Vercel URLs
      const baseUrl = (import.meta.env.VITE_API_URL?.replace(/\/$/, '') || "http://localhost:5000");
      
      // Open PDF in new tab
      const pdfUrl = `${baseUrl}/api/bills/${invoiceId}/pdf?token=${token}`;
      window.open(pdfUrl, "_blank");
    } catch (err) { 
      alert("Error generating PDF preview."); 
    }
  };

  const resetBilling = () => {
    setCart([]);
    setInvoiceId(null);
    setCustomer({ name: "", mobile: "" });
    setSearchTerm("");
  };

  if (loading) {
    return (
      <div className="container" style={{ textAlign: 'center', marginTop: '100px' }}>
        <h2 className="text-dim">Initializing Billing Engine...</h2>
        <div className="loader" style={{ margin: '20px auto' }}></div>
      </div>
    );
  }

  return (
    <div className="container">
      <div className="billing-container" style={{ display: 'flex', gap: '20px', flexWrap: 'wrap' }}>
        
        <div className="selection-section" style={{ flex: 2, minWidth: '350px' }}>
          {/* Customer Inputs */}
          <div className="customer-info" style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
            <input type="text" placeholder="👤 Customer Name" value={customer.name} 
              onChange={(e) => setCustomer({...customer, name: e.target.value})} disabled={invoiceId}
              style={{ padding: '12px', borderRadius: '8px', border: '1px solid #333', flex: 1, background: '#1a1a1a', color: 'white' }}
            />
            <input type="text" placeholder="📞 Mobile" value={customer.mobile} 
              onChange={(e) => setCustomer({...customer, mobile: e.target.value})} disabled={invoiceId}
              style={{ padding: '12px', borderRadius: '8px', border: '1px solid #333', flex: 1, background: '#1a1a1a', color: 'white' }}
            />
          </div>

          {/* Search Bar */}
          <div className="search-bar" style={{ marginBottom: '20px' }}>
            <input type="text" placeholder="🔍 Search Products..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
              style={{ width: '100%', padding: '15px', borderRadius: '8px', border: '1px solid #333', background: '#1a1a1a', color: 'white' }}
            />
          </div>

          {/* Product Grid */}
          <div className="dashboard-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '15px' }}>
            {filteredProducts.map(p => {
              const outOfStock = Number(p.stock) <= 0;
              return (
                <div key={p.id || p._id} className="card product-card" 
                  onClick={() => (!invoiceId && !outOfStock) && addToCart(p)}
                  style={{ 
                    opacity: (outOfStock || invoiceId) ? 0.5 : 1,
                    cursor: (outOfStock || invoiceId) ? 'not-allowed' : 'pointer',
                    border: outOfStock ? '1px solid #e74c3c' : '1px solid #333',
                    transition: '0.2s'
                  }}>
                  <h4 style={{ margin: '0 0 5px 0' }}>{p.product}</h4>
                  <small style={{ color: '#888' }}>{p.brand}</small>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '12px' }}>
                     <span style={{ fontWeight: 'bold', color: '#2ecc71' }}>₹{p.selling}</span>
                     <span style={{ fontSize: '0.75rem', color: outOfStock ? '#e74c3c' : '#888' }}>
                       {outOfStock ? 'OUT OF STOCK' : `Stock: ${p.stock}`}
                     </span>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Cart Section */}
        <div className="cart-sticky-wrapper" style={{ flex: 1, minWidth: '300px' }}>
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
            resetBilling={resetBilling}
          />
        </div>
      </div>
    </div>
  );
};

export default Billing;