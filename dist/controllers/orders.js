"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteOrder = exports.processOrder = exports.newOrder = exports.getSingleOrder = exports.allOrders = exports.myOrders = void 0;
const error_1 = require("../middlewares/error");
const orders_1 = require("../models/orders");
const features_1 = require("../utils/features");
const utilityClass_1 = __importDefault(require("../utils/utilityClass"));
const app_1 = require("../app");
exports.myOrders = (0, error_1.TryCatch)(async (req, res, next) => {
    const { id: user } = req.query;
    let orders = [];
    const key = `myOrders-${user}`;
    if (app_1.myCache.has(key)) {
        orders = JSON.parse(app_1.myCache.get(key));
    }
    else {
        orders = await orders_1.Order.find({ user });
        app_1.myCache.set(key, JSON.stringify(orders));
    }
    return res.status(200).json({
        success: true,
        orders,
    });
});
exports.allOrders = (0, error_1.TryCatch)(async (req, res, next) => {
    let orders = [];
    const key = `all-orders`;
    if (app_1.myCache.has(key)) {
        orders = JSON.parse(app_1.myCache.get(key));
    }
    else {
        orders = await orders_1.Order.find({}).populate("user", "name");
        app_1.myCache.set(key, JSON.stringify(orders));
    }
    return res.status(200).json({
        success: true,
        orders,
    });
});
exports.getSingleOrder = (0, error_1.TryCatch)(async (req, res, next) => {
    const { id } = req.params;
    let order;
    const key = `order-${id}`;
    if (app_1.myCache.has(key)) {
        order = JSON.parse(app_1.myCache.get(key));
    }
    else {
        order = await orders_1.Order.findById(id).populate("user", "name");
        if (!order)
            return next(new utilityClass_1.default("Order not exists!!", 404));
        app_1.myCache.set(key, JSON.stringify(order));
    }
    return res.status(200).json({
        success: true,
        order,
    });
});
exports.newOrder = (0, error_1.TryCatch)(async (req, res, next) => {
    const { shippingInfo, orderItems, user, subtotal, tax, shippingCharges, discount, total, } = req.body;
    if (!shippingInfo || !orderItems || !user || !subtotal || !tax || !total)
        return next(new utilityClass_1.default("Please Enter all fields", 400));
    const order = await orders_1.Order.create({
        shippingInfo,
        orderItems,
        user,
        subtotal,
        tax,
        shippingCharges,
        discount,
        total,
    });
    await (0, features_1.reduceStock)(orderItems);
    (0, features_1.invalidatesCache)({
        product: true,
        order: true,
        admin: true,
        userId: user,
        productId: order.orderItems.map(i => String(i.productId))
    });
    return res.status(201).json({
        success: true,
        message: "Order placed successfully!!!!",
    });
});
exports.processOrder = (0, error_1.TryCatch)(async (req, res, next) => {
    const { id } = req.params;
    const order = await orders_1.Order.findById(id);
    if (!order)
        return next(new utilityClass_1.default("Order not found", 404));
    switch (order.status) {
        case "Processing":
            order.status = "Shipped";
            break;
        case "Shipped":
            order.status = "Delivered";
            break;
        default:
            order.status = "Delivered";
            break;
    }
    await order.save();
    (0, features_1.invalidatesCache)({
        product: false,
        order: true,
        admin: true,
        userId: order.user,
        orderId: String(order._id),
    });
    return res.status(200).json({
        success: true,
        message: "Order status updated!!!!",
    });
});
exports.deleteOrder = (0, error_1.TryCatch)(async (req, res, next) => {
    const { id } = req.params;
    const order = await orders_1.Order.findById(id);
    if (!order)
        return next(new utilityClass_1.default("Order not found", 404));
    await order.deleteOne();
    (0, features_1.invalidatesCache)({
        product: false,
        order: true,
        admin: true,
        userId: order.user,
        orderId: String(order._id),
    });
    return res.status(200).json({
        success: true,
        message: "Order deleted successfully!!!!",
    });
});
