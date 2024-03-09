"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteCoupon = exports.allCoupons = exports.applyDiscount = exports.newCoupon = exports.createPaymentIntent = void 0;
const app_1 = require("../app");
const error_1 = require("../middlewares/error");
const coupon_1 = require("../models/coupon");
const utilityClass_1 = __importDefault(require("../utils/utilityClass"));
exports.createPaymentIntent = (0, error_1.TryCatch)(async (req, res, next) => {
    const { amount } = req.body;
    if (!amount)
        return next(new utilityClass_1.default("Please enter amount", 400));
    const paymentIntent = await app_1.stripe.paymentIntents.create({ amount: Number(amount) * 100, currency: "inr", });
    return res.status(201).json({
        success: true,
        clientSecret: paymentIntent.client_secret,
    });
});
exports.newCoupon = (0, error_1.TryCatch)(async (req, res, next) => {
    const { coupon, amount } = req.body;
    if (!coupon || !amount)
        return next(new utilityClass_1.default("Please enter both coupon and amount", 400));
    await coupon_1.Coupon.create({ code: coupon, amount });
    return res.status(201).json({
        success: true,
        message: `Coupon ${coupon} created successfully!!!`,
    });
});
exports.applyDiscount = (0, error_1.TryCatch)(async (req, res, next) => {
    const { couponCode } = req.query;
    const discount = await coupon_1.Coupon.findOne({ code: couponCode });
    if (!discount) {
        return next(new utilityClass_1.default("Coupon not exists", 400));
    }
    return res.status(201).json({
        success: true,
        discount: discount.amount,
    });
});
exports.allCoupons = (0, error_1.TryCatch)(async (req, res, next) => {
    const coupons = await coupon_1.Coupon.find({});
    return res.status(200).json({
        success: true,
        coupons,
    });
});
exports.deleteCoupon = (0, error_1.TryCatch)(async (req, res, next) => {
    const { id } = req.params;
    const coupon = await coupon_1.Coupon.findByIdAndDelete(id);
    if (!coupon)
        return next(new utilityClass_1.default("Coupon not exists", 400));
    return res.status(200).json({
        success: true,
        message: `Coupon ${coupon?.code} deleted successfully`,
    });
});
