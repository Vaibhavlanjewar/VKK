const express = require("express");
const router = express.Router();

const {
  addProduct,
  getProducts,
  getProductById,
  updateProduct,
  deleteProduct,
  getLowStockProducts,
  getExpiringProducts
} = require("../controllers/productController");

const verifyFirebaseToken = require("../middleware/verifyFirebaseToken");

router.post("/products", verifyFirebaseToken, addProduct);
router.get("/products", verifyFirebaseToken, getProducts);
router.get("/products/:id", verifyFirebaseToken, getProductById);
router.put("/products/:id", verifyFirebaseToken, updateProduct);
router.delete("/products/:id", verifyFirebaseToken, deleteProduct);
router.get("/products-low-stock", verifyFirebaseToken, getLowStockProducts);
router.get("/products-expiring", verifyFirebaseToken, getExpiringProducts);

//--- Only for testing , Testing is done on postman with token in header, 

// router.post("/products", addProduct);
// router.get("/products", getProducts);
// router.get("/products/:id", getProductById);
// router.put("/products/:id", updateProduct);
// router.delete("/products/:id", deleteProduct);
// router.get("/products-low-stock", getLowStockProducts);
// router.get("/products-expiring",getExpiringProducts);
module.exports = router;