const db = require("../firebase/firebaseConfig");
const crypto = require("crypto"); // Standard Node module - fixes ERR_REQUIRE_ESM

// ADD PRODUCT
exports.addProduct = async (req, res) => {
  try {
    // Generate a secure unique ID (UUID v4) natively
    const productId = crypto.randomUUID(); 

    const product = {
      id: productId,
      ...req.body
    };

    await db.ref("products/" + productId).set(product);

    res.json({
      message: "Product added successfully",
      product
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// GET ALL PRODUCTS
exports.getProducts = async (req, res) => {
  try {
    const snapshot = await db.ref("products").once("value");
    const products = snapshot.val() || {};
    res.json(products);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// GET SINGLE PRODUCT
exports.getProductById = async (req, res) => {
  try {
    const id = req.params.id;
    const snapshot = await db.ref("products/" + id).once("value");
    const product = snapshot.val();

    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    res.json(product);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// UPDATE PRODUCT
exports.updateProduct = async (req, res) => {
  try {
    const id = req.params.id;
    await db.ref("products/" + id).update(req.body);
    res.json({ message: "Product updated successfully" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// DELETE PRODUCT
exports.deleteProduct = async (req, res) => {
  try {
    const id = req.params.id;
    await db.ref("products/" + id).remove();
    res.json({ message: "Product deleted successfully" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// LOW STOCK PRODUCTS
exports.getLowStockProducts = async (req, res) => {
  try {
    const snapshot = await db.ref("products").once("value");
    const products = snapshot.val() || {};
    const lowStock = Object.values(products).filter(p => p.stock <= 10);
    res.json(lowStock);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// EXPIRING PRODUCTS
exports.getExpiringProducts = async (req, res) => {
  try {
    const snapshot = await db.ref("products").once("value");
    const products = snapshot.val() || {};

    const today = new Date();
    const threshold = new Date();
    threshold.setDate(today.getDate() + 30);

    const expiring = Object.values(products).filter(p => {
      if (!p.expiry) return false;
      const expiryDate = new Date(p.expiry);
      return expiryDate <= threshold;
    });

    res.json(expiring);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};