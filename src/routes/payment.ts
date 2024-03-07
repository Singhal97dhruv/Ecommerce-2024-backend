import express from "express"
import { adminOnly } from "../middlewares/auth";
import { allCoupons, applyDiscount, createPaymentIntent, deleteCoupon, newCoupon } from "../controllers/payment";

const app=express.Router();

app.post("/create",createPaymentIntent);


//route /api/v1/payment/coupon/new
app.post("/coupon/new",adminOnly,newCoupon)


app.get("/discount", applyDiscount);

app.get("/coupon/all",adminOnly, allCoupons);

app.delete("/coupon/:id",adminOnly,deleteCoupon);

export default app;