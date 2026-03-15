import React from 'react';

const Cart = ({ cart, updateQty, removeItem, onCheckout, invoiceId, downloadPdf, isProcessing, customerName, mobile }) => {
  const subtotal = cart.reduce((acc, item) => acc + (Number(item.selling) * item.qty), 0);
  const gst = subtotal * 0.18;
  const total = subtotal + gst;

  // Handles direct keyboard typing while preserving core updateQty logic
  const handleManualInput = (id, value) => {
    // Treat empty input as 0 to allow the user to backspace and type fresh
    const newQty = value === "" ? 0 : parseInt(value);
    
    if (isNaN(newQty)) return; 

    const currentItem = cart.find(i => (i.id || i._id) === id);
    
    // Core Logic: Delta = New Typed Value - Current Value
    const delta = newQty - currentItem.qty;
    
    updateQty(id, delta);
  };

  return (
    <div className="card billing-summary" style={{ position: 'sticky', top: '20px', minHeight: '600px', display: 'flex', flexDirection: 'column', background: 'var(--card-bg)', border: invoiceId ? '2px solid var(--primary-green)' : '1px solid var(--border)' }}>
      
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
        <h3 style={{ margin: 0, fontSize: '1.2rem' }}>{invoiceId ? "✅ BILL GENERATED" : "🛒 CURRENT CART"}</h3>
        <span style={{ fontSize: '12px', background: 'var(--primary-green)', color: 'white', padding: '4px 10px', borderRadius: '20px', fontWeight: 'bold' }}>{cart.length} ITEMS</span>
      </div>

      {invoiceId && (
        <div style={{ padding: '12px', background: 'rgba(34, 197, 94, 0.1)', borderRadius: '12px', marginBottom: '15px', border: '1px solid rgba(34, 197, 94, 0.3)' }}>
          <div style={{ fontSize: '11px', color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '1px' }}>Customer Details</div>
          <div style={{ fontWeight: 'bold', fontSize: '1.1rem', margin: '4px 0' }}>{customerName}</div>
          <div style={{ fontSize: '13px', color: 'var(--primary-green)' }}>Invoice ID: <strong>{invoiceId}</strong></div>
        </div>
      )}

      {/* Item List - Removed Scroll Containers */}
      <div style={{ flex: 1 }}>
        {cart.map(item => (
          <div key={item.id || item._id} style={{ background: 'rgba(255,255,255,0.03)', borderRadius: '12px', padding: '12px', marginBottom: '10px', border: '1px solid var(--border)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
              <span style={{ fontWeight: '600', fontSize: '14px', flex: 1 }}>{item.product}</span>
              <span style={{ fontWeight: '800', color: 'white' }}>₹{(item.selling * item.qty).toFixed(2)}</span>
            </div>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <small style={{ color: 'var(--text-dim)' }}>Rate: ₹{item.selling}</small>
              
              {!invoiceId && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  {/* Plus/Minus Buttons remain for quick adjustments */}
                  <button onClick={() => updateQty(item.id || item._id, -1)} 
                    style={{ width: '28px', height: '28px', background: '#1e293b', color: '#ef4444', border: '1px solid #334155', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}>−</button>
                  
                  {/* THE KEYBOARD INPUT FIELD */}
                  <input 
                    type="number" 
                    value={item.qty === 0 ? "" : item.qty}
                    onChange={(e) => handleManualInput(item.id || item._id, e.target.value)}
                    onFocus={(e) => e.target.select()} // Highlights the number so you can type "10" immediately
                    placeholder="0"
                    style={{ 
                      width: '55px', 
                      background: '#020617', 
                      border: '1px solid #334155', 
                      borderRadius: '6px',
                      color: 'var(--primary-green)', 
                      textAlign: 'center', 
                      fontWeight: '800', 
                      fontSize: '1rem',
                      outline: 'none',
                      padding: '5px 0'
                    }}
                  />

                  <button onClick={() => updateQty(item.id || item._id, 1)} 
                    style={{ width: '28px', height: '28px', background: '#1e293b', color: 'var(--primary-green)', border: '1px solid #334155', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}>+</button>
                  
                  <button onClick={() => removeItem(item.id || item._id)} 
                    style={{ marginLeft: '5px', background: 'transparent', color: '#ef4444', border: 'none', cursor: 'pointer', fontSize: '14px' }}>✕</button>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Totals Section */}
      <div style={{ borderTop: '2px dashed var(--border)', paddingTop: '20px', marginTop: '10px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
          <span style={{ fontWeight: 'bold', fontSize: '14px', color: 'var(--text-dim)' }}>TOTAL AMOUNT</span>
          <span style={{ fontWeight: '900', fontSize: '2.4rem', color: 'var(--primary-green)', lineHeight: 1 }}>₹{total.toFixed(2)}</span>
        </div>

        {!invoiceId ? (
          <button className="btn-checkout-final" 
            style={{ width: '100%', padding: '16px', marginTop: '20px', background: 'var(--primary-green)', color: '#000', border: 'none', borderRadius: '12px', fontWeight: '800', cursor: 'pointer', fontSize: '1.1rem' }} 
            onClick={onCheckout} disabled={isProcessing || cart.length === 0}>
            {isProcessing ? "GENERATING..." : "CONFIRM & PRINT BILL"}
          </button>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '20px' }}>
            <button className="btn-primary" style={{ width: '100%', padding: '16px', background: '#2563eb', color: 'white', border: 'none', borderRadius: '12px', fontWeight: 'bold' }} onClick={downloadPdf}>
              🖨️ PRINT INVOICE
            </button>
            <button className="btn-outline" style={{ width: '100%', padding: '12px', border: '1px solid #444', background: 'transparent', color: '#94a3b8', borderRadius: '12px' }} 
              onClick={() => window.location.reload()}>
              🔄 NEW SALE
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Cart;