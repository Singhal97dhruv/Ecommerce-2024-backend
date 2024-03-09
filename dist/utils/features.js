"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getChartData = exports.getInventories = exports.calculatePercentage = exports.reduceStock = exports.invalidatesCache = exports.connectDB = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const product_1 = require("../models/product");
const app_1 = require("../app");
const orders_1 = require("../models/orders");
const connectDB = (uri) => {
    mongoose_1.default
        .connect(uri, {
        dbName: "Ecommerce-2024",
    })
        .then((c) => console.log(`DB connected to ${c.connection.host}`))
        .catch((e) => console.log(e));
};
exports.connectDB = connectDB;
const invalidatesCache = ({ product, admin, order, userId, orderId, productId, }) => {
    if (product) {
        const productKeys = [
            "latestProducts",
            "categories",
            "allProducts",
        ];
        if (typeof productId === "string")
            productKeys.push(`product-${productId}`);
        if (typeof productId === "object") {
            productId.forEach((e) => productKeys.push(`product-${e}`));
        }
        app_1.myCache.del(productKeys);
    }
    if (order) {
        const orderKeys = [
            "all-orders",
            `myOrders-${userId}`,
            `order-${orderId}`,
        ];
        const orders = orders_1.Order.find({}).select("_id");
        app_1.myCache.del(orderKeys);
    }
    if (admin) {
        app_1.myCache.del(["adminStats", "adminPieCharts", "adminBarChart", "adminLineChart"]);
    }
};
exports.invalidatesCache = invalidatesCache;
const reduceStock = async (orderItems) => {
    for (let i = 0; i < orderItems.length; i++) {
        const product = await product_1.Product.findById(orderItems[i].productId);
        if (!product)
            throw new Error("Product not found");
        product.stock -= orderItems[i].quantity;
        await product.save();
    }
};
exports.reduceStock = reduceStock;
const calculatePercentage = (thisMonth, lastMonth) => {
    if (lastMonth === 0)
        return thisMonth * 100;
    const percent = (thisMonth / lastMonth) * 100;
    return Number(percent.toFixed(0));
};
exports.calculatePercentage = calculatePercentage;
const getInventories = async ({ categories, productsCount, }) => {
    const categoriesCountPromise = categories.map((category) => product_1.Product.countDocuments({ category }));
    const categoriesCount = await Promise.all(categoriesCountPromise);
    const categoryCount = [];
    categories.forEach((category, i) => {
        categoryCount.push({
            [category]: Math.round((categoriesCount[i] / productsCount) * 100),
        });
    });
    return categoryCount;
};
exports.getInventories = getInventories;
const getChartData = ({ length, docArr, today, property }) => {
    const data = new Array(length).fill(0);
    docArr.forEach((i) => {
        const creationDate = i.createdAt;
        const monthDiff = (today.getMonth() - creationDate.getMonth() + 12) % 12;
        if (monthDiff < length) {
            data[length - monthDiff - 1] += property ? i[property] : 1;
        }
    });
    return data;
};
exports.getChartData = getChartData;
