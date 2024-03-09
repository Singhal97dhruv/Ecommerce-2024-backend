"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.singleUpload = void 0;
const multer_1 = __importDefault(require("multer"));
const uuid_1 = require("uuid");
const storage = multer_1.default.diskStorage({
    destination(req, file, callback) {
        callback(null, "uploads");
    },
    filename(req, file, callback) {
        const id = (0, uuid_1.v4)();
        const ext = file.originalname.split(".").pop();
        const fileName = `${id}.${ext}`;
        callback(null, fileName);
    }
});
exports.singleUpload = (0, multer_1.default)({ storage }).single("photo");
