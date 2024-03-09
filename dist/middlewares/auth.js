"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.adminOnly = void 0;
const user_1 = require("../models/user");
const utilityClass_1 = __importDefault(require("../utils/utilityClass"));
const error_1 = require("./error");
//Middleware to make sure only admin is allowed
exports.adminOnly = (0, error_1.TryCatch)(async (req, res, next) => {
    const { id } = req.query;
    if (!id)
        return next(new utilityClass_1.default("Do login first!!", 401));
    const user = await user_1.User.findById(id);
    if (!user)
        return next(new utilityClass_1.default("Id not exists!!", 401));
    if (user.role !== "admin")
        return next(new utilityClass_1.default("You are not admin", 401));
    next();
});
