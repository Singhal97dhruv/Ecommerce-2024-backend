import mongoose from "mongoose";
import { InvalidatesCacheProps, OrderItemType } from "../types/types";
import { Product } from "../models/product";
import { myCache } from "../app";
import { Order } from "../models/orders";

export const connectDB = (uri: string) => {
  mongoose
    .connect(uri, {
      dbName: "Ecommerce-2024",
    })
    .then((c) => console.log(`DB connected to ${c.connection.host}`))
    .catch((e) => console.log(e));
};

export const invalidatesCache =  ({
  product,
  admin,
  order,
  userId,
  orderId,
  productId,
}: InvalidatesCacheProps) => {
  if (product) {
    const productKeys: string[] = [
      "latestProducts",
      "categories",
      "allProducts",
    ];

    if (typeof productId === "string") productKeys.push(`product-${productId}`);
    if (typeof productId === "object") {
      productId.forEach((e) => productKeys.push(`product-${e}`));
    }

    myCache.del(productKeys);
  }
  if (order) {
    const orderKeys: string[] = [
      "all-orders",
      `myOrders-${userId}`,
      `order-${orderId}`,
    ];
    const orders =  Order.find({}).select("_id");

    myCache.del(orderKeys);
  }
  if (admin) {


    myCache.del(["adminStats","adminPieCharts","adminBarChart","adminLineChart"])

  }
};

export const reduceStock = async (orderItems: OrderItemType[]) => {
  for (let i = 0; i < orderItems.length; i++) {
    const product = await Product.findById(orderItems[i].productId);

    if (!product) throw new Error("Product not found");
    product.stock -= orderItems[i].quantity;
    await product.save();
  }
};

export const calculatePercentage = (thisMonth: number, lastMonth: number) => {
  if (lastMonth === 0) return thisMonth * 100;
  const percent = (thisMonth / lastMonth) * 100;
  return Number(percent.toFixed(0));
};

export const getInventories = async ({
  categories,
  productsCount,
}: {
  categories: string[];
  productsCount: number;
}) => {
  const categoriesCountPromise = categories.map((category) =>
    Product.countDocuments({ category })
  );

  const categoriesCount = await Promise.all(categoriesCountPromise);

  const categoryCount: Record<string, number>[] = [];

  categories.forEach((category, i) => {
    categoryCount.push({
      [category]: Math.round((categoriesCount[i] / productsCount) * 100),
    });
  });
  return categoryCount;
};

interface MyDocument extends Document{
  createdAt: Date;
  discount?: number;
  total?: number;
}
type FuncProps = {
  length: number;
  docArr: MyDocument[];
  today: Date;
  property?: "discount" | "total";
};

export const getChartData = ({ length,docArr,today,property }: FuncProps) => {
  const data: number[] = new Array(length).fill(0);

  docArr.forEach((i) => {
    const creationDate = i.createdAt;
    const monthDiff = (today.getMonth() - creationDate.getMonth() + 12) % 12;

    if (monthDiff < length) {
      data[length - monthDiff - 1] += property?i[property]!:1;
    }
  });
  return data;
};
