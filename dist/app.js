"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.myCache = exports.stripe = void 0;
const express_1 = __importDefault(require("express"));
// Importing Routes
const user_js_1 = __importDefault(require("./routes/user.js"));
const product_js_1 = __importDefault(require("./routes/product.js"));
const orders_js_1 = __importDefault(require("./routes/orders.js"));
const payment_js_1 = __importDefault(require("./routes/payment.js"));
const stats_js_1 = __importDefault(require("./routes/stats.js"));
const features_js_1 = require("./utils/features.js");
const morgan_1 = __importDefault(require("morgan"));
const error_js_1 = require("./middlewares/error.js");
const dotenv_1 = require("dotenv");
const node_cache_1 = __importDefault(require("node-cache"));
const stripe_1 = __importDefault(require("stripe"));
const cors_1 = __importDefault(require("cors"));
const app = (0, express_1.default)();
app.use((0, morgan_1.default)("dev"));
app.use((0, cors_1.default)());
app.use(express_1.default.json());
(0, dotenv_1.config)({
    path: "./.env"
});
const DB_URI = process.env.DB_URI || "";
const stripeKey = process.env.STRIPE_KEY || "";
(0, features_js_1.connectDB)(DB_URI);
exports.stripe = new stripe_1.default(stripeKey);
exports.myCache = new node_cache_1.default();
app.get("/", (req, res) => {
    res.send("API working with /api/v1");
});
//Using Routes
app.use("/api/v1/user", user_js_1.default);
app.use("/api/v1/product", product_js_1.default);
app.use("/api/v1/order", orders_js_1.default);
app.use("/api/v1/payment", payment_js_1.default);
app.use("/api/v1/dashboard", stats_js_1.default);
app.use("/uploads", express_1.default.static("uploads"));
const PORT = process.env.PORT || 3000;
app.use(error_js_1.errorMiddleware);
app.listen(PORT, () => {
    console.log(`Express is working on port ${PORT}`);
});
