"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const user_1 = require("../controllers/user");
const auth_1 = require("../middlewares/auth");
const app = express_1.default.Router();
//route /api/v1/user/new
app.post("/new", user_1.newUser);
//route /api/v1/user/all
app.get("/all", auth_1.adminOnly, user_1.getAllUsers);
//route /api/v1/user/dynamicID 
app.route("/:id").get(user_1.getUser).delete(auth_1.adminOnly, user_1.deleteUser);
exports.default = app;
