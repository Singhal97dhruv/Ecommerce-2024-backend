"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.User = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const validator_1 = __importDefault(require("validator"));
const Schema = new mongoose_1.default.Schema({
    _id: {
        type: String,
        required: [true, "Please enter ID"],
    },
    name: {
        type: String,
        required: [true, "Please enter Name"],
    },
    email: {
        type: String,
        // unique: [true,"Email already exists"],
        unique: true,
        required: [true, "Please enter Email"],
        validate: validator_1.default.default.isEmail,
    },
    photo: {
        type: String,
        required: [true, "Please insert Photo"],
    },
    role: {
        type: String,
        enum: ["admin", "user"],
        default: "user",
    },
    gender: {
        type: String,
        enum: ["male", "female"],
        required: [true, "Please enter Gender"],
    },
    dob: {
        type: Date,
        required: [true, "Please enter DOB"],
    },
}, {
    timestamps: true,
});
Schema.virtual("age").get(function () {
    const today = new Date();
    const dob = this.dob;
    let age = today.getFullYear() - dob.getFullYear();
    if (today.getMonth() < dob.getMonth() || today.getMonth() < dob.getMonth() && today.getDate() < dob.getDate()) {
        age--;
    }
    return age;
});
exports.User = mongoose_1.default.model("User", Schema);
