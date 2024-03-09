"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const auth_1 = require("../middlewares/auth");
const stats_1 = require("../controllers/stats");
const app = express_1.default.Router();
app.get("/stats", auth_1.adminOnly, stats_1.getDashboardStats);
app.get("/pie", auth_1.adminOnly, stats_1.getPieCharts);
app.get("/bar", auth_1.adminOnly, stats_1.getBarCharts);
app.get("/line", auth_1.adminOnly, stats_1.getLineCharts);
exports.default = app;
