import express from "express"
import { adminOnly } from "../middlewares/auth"
import { deleteProduct, getAdminProducts, getAllCategories, getAllProducts, getLatestProducts, getSingleProduct, newProduct, updateProduct } from "../controllers/product";
import { singleUpload } from "../middlewares/multer";

const app=express.Router();

// Create new Product  /api/v1/product/new 
app.post("/new",adminOnly,singleUpload,newProduct);

// To get al Products with filters - /api/v1/product/all 
app.get("/all",getAllProducts);

// To get Latest 5 Products  /api/v1/product/latest 
app.get("/latest",getLatestProducts);

// To get all unique categories /api/v1/product/categories
app.get("/categories",getAllCategories);

// To get all Products  /api/v1/product/admin-products
app.get("/admin-products",adminOnly,getAdminProducts);

// To get updated,deleted,updated the query
app.route("/:id").get(getSingleProduct).put(adminOnly,singleUpload, updateProduct).delete(adminOnly,deleteProduct)

export default app;