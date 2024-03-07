import express from "express";


// Importing Routes
import userRoutes from "./routes/user.js";
import productRoutes from "./routes/product.js";
import orderRoutes from "./routes/orders.js";
import paymentRoutes from "./routes/payment.js";
import dashboardRoutes from "./routes/stats.js";
import { connectDB } from "./utils/features.js";
import morgan from "morgan";
import { errorMiddleware } from "./middlewares/error.js";
import {config} from "dotenv";
import NodeCache from "node-cache";
import Stripe from "stripe";
import cors from "cors";
const app = express();

app.use(morgan("dev"))
app.use(cors());

app.use(express.json());
config({
  path: "./.env"
})

const DB_URI=process.env.DB_URI|| "";
const stripeKey= process.env.STRIPE_KEY || "";
connectDB(DB_URI);

export const stripe=new Stripe(stripeKey);

export const myCache=new NodeCache();

app.get("/",(req,res)=>{
  res.send("API working with /api/v1")
})

//Using Routes
app.use("/api/v1/user",userRoutes);
app.use("/api/v1/product",productRoutes);
app.use("/api/v1/order",orderRoutes);
app.use("/api/v1/payment",paymentRoutes);
app.use("/api/v1/dashboard",dashboardRoutes);

app.use("/uploads",express.static("uploads"))

const PORT = process.env.PORT || 3000;


app.use(errorMiddleware)

app.listen(PORT, () => {
  console.log(`Express is working on port ${PORT}`);
});
