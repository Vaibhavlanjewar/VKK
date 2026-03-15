import React from 'react';

const ProductTable = ({ products, onAction, mode = "inventory" }) => {
  return (
    <div className="table-container">
      <table>
        <thead>
          <tr>
            <th>Product</th>
            <th>Brand</th>
            <th>Unit</th>
            <th>Price</th>
            <th>Stock</th>
            <th>Action</th>
          </tr>
        </thead>
        <tbody>
          {products.length > 0 ? (
            products.map((p) => (
              <tr key={p.id || p._id}>
                <td>{p.product}</td>
                <td>{p.brand}</td>
                <td>{p.unit}</td>
                <td>₹{p.selling}</td>
                <td style={{ color: p.stock < 10 ? 'var(--danger)' : 'inherit' }}>
                  {p.stock}
                </td>
                <td>
                  {mode === "inventory" ? (
                    <>
                      <button onClick={() => onAction.edit(p)} style={{ marginRight: '5px' }}>Edit</button>
                      <button onClick={() => onAction.delete(p.id || p._id)} className="btn-danger">Delete</button>
                    </>
                  ) : (
                    <button 
                      className="btn-add" 
                      onClick={() => onAction.addToCart(p)}
                      disabled={p.stock <= 0}
                    >
                      {p.stock <= 0 ? "Out of Stock" : "Add to Cart"}
                    </button>
                  )}
                </td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan="6" style={{ textAlign: 'center', padding: '20px' }}>No products found.</td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
};

export default ProductTable;