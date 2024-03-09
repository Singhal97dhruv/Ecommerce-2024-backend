"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const auth_1 = require("../middlewares/auth");
const orders_1 = require("../controllers/orders");
const app = express_1.default.Router();
//route /api/v1/order/new
app.post("/new", orders_1.newOrder);
//route /api/v1/order/my
app.get("/my", orders_1.myOrders);
//route /api/v1/order/all
app.get("/all", auth_1.adminOnly, orders_1.allOrders);
app.route("/:id").get(orders_1.getSingleOrder).put(auth_1.adminOnly, orders_1.processOrder).delete(auth_1.adminOnly, orders_1.deleteOrder);
exports.default = app;
