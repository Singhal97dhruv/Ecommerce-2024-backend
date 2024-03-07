import mongoose from "mongoose";
import validator from "validator";

interface UserDocument extends Document{
    _id: string;
    name: string;
    email: string;
    photo: string;
    role: "admin"|"user";
    gender: "male"|"female";
    dob: Date;
    createdAt: Date;
    updatedAt: Date;
    // Virtual Attribute
    age: number
}

const Schema = new mongoose.Schema<UserDocument>(
  {
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
        validate: validator.default.isEmail, 
      },
    photo: {
      type: String,
      required: [true, "Please insert Photo"],
    },
    role: {
      type: String,
      enum: ["admin","user"],
      default: "user",
    },
    gender: {
      type: String,
      enum: ["male","female"],
      required : [true, "Please enter Gender"],
    },
    dob: {
        type: Date,
        required: [true, "Please enter DOB"],
      },
  },
  {
    timestamps: true,
  }
);

Schema.virtual("age").get(function(this: UserDocument){
    const today=new Date();
    const dob=this.dob;
    let age= today.getFullYear() - dob.getFullYear();

    if(today.getMonth() < dob.getMonth() || today.getMonth() < dob.getMonth() && today.getDate()<dob.getDate()){
        age--;
    }
    return age;

})

export const User = mongoose.model<UserDocument>("User", Schema);

