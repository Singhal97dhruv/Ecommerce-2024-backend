import { User } from "../models/user";
import ErrorHandler from "../utils/utilityClass";
import { TryCatch } from "./error";

//Middleware to make sure only admin is allowed
export const adminOnly=TryCatch(async(req,res,next)=>{
    const {id}=req.query;
    if(!id)return next(new ErrorHandler("Do login first!!",401));

    const user=await User.findById(id);
    if(!user)return next(new ErrorHandler("Id not exists!!",401));

    if(user.role!=="admin")
    return next(new ErrorHandler("You are not admin",401));

    next();

})