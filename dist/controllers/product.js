"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAllProducts = exports.deleteProduct = exports.updateProduct = exports.newProduct = exports.getSingleProduct = exports.getAdminProducts = exports.getAllCategories = exports.getLatestProducts = void 0;
const error_1 = require("../middlewares/error");
const product_1 = require("../models/product");
const utilityClass_1 = __importDefault(require("../utils/utilityClass"));
const fs_1 = require("fs");
const app_1 = require("../app");
const features_1 = require("../utils/features");
// Revalidate on New, Update and Delete Product & on new order
exports.getLatestProducts = (0, error_1.TryCatch)(async (req, res, next) => {
    let products;
    if (app_1.myCache.has("latestProducts"))
        products = JSON.parse(app_1.myCache.get("latestProducts"));
    else {
        products = await product_1.Product.find({}).sort({ createdAt: -1 }).limit(5);
    }
    app_1.myCache.set("latestProducts", JSON.stringify(products));
    return res.status(200).json({
        success: true,
        products,
    });
});
// Revalidate on New, Update and Delete Product & on new order
exports.getAllCategories = (0, error_1.TryCatch)(async (req, res, next) => {
    let categories;
    if (app_1.myCache.has("categories"))
        categories = JSON.parse(app_1.myCache.get("categories"));
    else {
        categories = await product_1.Product.distinct("category");
        app_1.myCache.set("categories", JSON.stringify(categories));
    }
    return res.status(200).json({
        success: true,
        categories,
    });
});
// Revalidate on New, Update and Delete Product & on new order
exports.getAdminProducts = (0, error_1.TryCatch)(async (req, res, next) => {
    let products;
    if (app_1.myCache.has("allProducts")) {
        products = JSON.parse(app_1.myCache.get("allProducts"));
    }
    else {
        products = await product_1.Product.find({});
        app_1.myCache.set("allProducts", JSON.stringify(products));
    }
    return res.status(200).json({
        success: true,
        products,
    });
});
exports.getSingleProduct = (0, error_1.TryCatch)(async (req, res, next) => {
    let product;
    const id = req.params.id;
    if (app_1.myCache.has(`product-${id}`)) {
        product = JSON.parse(app_1.myCache.get(`product-${id}`));
    }
    else {
        product = await product_1.Product.findById(req.params.id);
        if (!product)
            return next(new utilityClass_1.default("Product not found", 404));
        app_1.myCache.set(`product-${id}`, JSON.stringify(product));
    }
    return res.status(200).json({
        success: true,
        product,
    });
});
exports.newProduct = (0, error_1.TryCatch)(async (req, res, next) => {
    const { name, stock, category, price } = req.body;
    const photo = req.file;
    if (!photo) {
        return next(new utilityClass_1.default("Photo not inserted", 400));
    }
    if (!name || !price || !stock || !category) {
        (0, fs_1.rm)(photo.path, () => {
            console.log("Deleted");
        });
        return next(new utilityClass_1.default("Please enter all fields", 400));
    }
    await product_1.Product.create({
        name,
        price,
        stock,
        category: category.toLowerCase(),
        photo: photo.path,
    });
    (0, features_1.invalidatesCache)({ product: true, admin: true, });
    return res.status(201).json({
        success: true,
        message: "Product created Successfully",
    });
});
exports.updateProduct = (0, error_1.TryCatch)(async (req, res, next) => {
    const { id } = req.params;
    const { name, stock, category, price } = req.body;
    const photo = req.file;
    const product = await product_1.Product.findById(id);
    if (!product)
        return next(new utilityClass_1.default("Product not found", 404));
    if (photo) {
        (0, fs_1.rm)(product.photo, () => {
            console.log("Old Photo Deleted");
        });
        product.photo = photo.path;
    }
    if (name)
        product.name = name;
    if (price)
        product.price = price;
    if (category)
        product.category = category;
    if (stock)
        product.stock = stock;
    await product.save();
    (0, features_1.invalidatesCache)({ product: true, productId: String(product._id), admin: true, });
    return res.status(200).json({
        success: true,
        message: "Product updated Successfully",
    });
});
exports.deleteProduct = (0, error_1.TryCatch)(async (req, res, next) => {
    const product = await product_1.Product.findById(req.params.id);
    if (!product)
        return next(new utilityClass_1.default("Product not found", 404));
    (0, fs_1.rm)(product.photo, () => {
        console.log("Product Photo Deleted");
    });
    await product.deleteOne();
    (0, features_1.invalidatesCache)({ product: true, productId: String(product._id) });
    return res.status(200).json({
        success: true,
        message: "Product Deletd Successfully",
    });
});
exports.getAllProducts = (0, error_1.TryCatch)(async (req, res, next) => {
    const { search, sort, category, price } = req.query;
    const page = Number(req.query.page) || 1;
    const limit = Number(process.env.PRODUCT_PER_PAGE) || 8;
    const skip = limit * (page - 1);
    const baseQuery = {};
    if (search)
        baseQuery.name = {
            $regex: search,
            $options: "i",
        };
    if (price)
        baseQuery.price = {
            $lte: Number(price),
        };
    if (category)
        baseQuery.category = category;
    const productsPromise = product_1.Product.find(baseQuery)
        .sort(sort && { price: sort === "asc" ? 1 : -1 })
        .limit(limit)
        .skip(skip);
    const [products, fileteredOnlyProduct] = await Promise.all([
        productsPromise,
        product_1.Product.find(baseQuery),
    ]);
    // const products = await Product.find(baseQuery)
    // .sort(sort && { price: sort === "asc" ? 1 : -1 })
    // .limit(limit)
    // .skip(skip)
    //   const fileteredOnlyProduct=await Product.find(baseQuery);
    const totalPage = Math.ceil(fileteredOnlyProduct.length / limit);
    return res.status(200).json({
        success: true,
        products,
        totalPage,
    });
});
// const generateRandomProducts = async (count: number = 10) => {
//   const products = [];
//   for (let i = 0; i < count; i++) {
//     const product = {
//       name: faker.commerce.productName(),
//       photo: "uploads\\6471030f-c1c5-4a21-9f11-cfd87ab458d4.jpg",
//       price: faker.commerce.price({ min: 1500, max: 800000, dec: 0 }),
//       stock: faker.commerce.price({ min: 0, max: 100, dec: 0 }),
//       category: faker.commerce.department(),
//       createdAt: new Date(faker.date.past()),
//       updatedAt: new Date(faker.date.recent()),
//       _v: 0,
//     };
//     products.push(product);
//   }
//   await Product.create(products);
//   console.log({sucess: true});
// };
// generateRandomProducts(40);
// const deleteProducts = async (count: number = 10) => {
//   const products = await Product.find({}).skip(2);
//   for (let i = 0; i < products.length; i++) {
//     const product = products[i];
//     await product.deleteOne();
//   }
//   console.log({ success: true });
// };
// deleteProducts(38)
