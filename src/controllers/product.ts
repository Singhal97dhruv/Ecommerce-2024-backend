import { Request } from "express";
import { TryCatch } from "../middlewares/error";
// import { faker } from "@faker-js/faker";
import {
  BaseQuery,
  NewProductRequestBody,
  SearchRequestQuery,
} from "../types/types";
import { Product } from "../models/product";
import ErrorHandler from "../utils/utilityClass";
import { rm } from "fs";
import { myCache } from "../app";
import { invalidatesCache } from "../utils/features";


// Revalidate on New, Update and Delete Product & on new order
export const getLatestProducts = TryCatch(async (req, res, next) => {
  let products;

  if (myCache.has("latestProducts"))
    products = JSON.parse(myCache.get("latestProducts") as string);
  else {
    products = await Product.find({}).sort({ createdAt: -1 }).limit(5);
  }

  myCache.set("latestProducts", JSON.stringify(products));

  return res.status(200).json({
    success: true,
    products,
  });
});

// Revalidate on New, Update and Delete Product & on new order
export const getAllCategories = TryCatch(async (req, res, next) => {
  let categories;
  if (myCache.has("categories"))
    categories = JSON.parse(myCache.get("categories") as string);
  else {
    categories = await Product.distinct("category");
    myCache.set("categories", JSON.stringify(categories));
  }

  return res.status(200).json({
    success: true,
    categories,
  });
});

// Revalidate on New, Update and Delete Product & on new order
export const getAdminProducts = TryCatch(async (req, res, next) => {
  let products;

  if (myCache.has("allProducts")) {
    products = JSON.parse(myCache.get("allProducts") as string);
  } else {
    products = await Product.find({});
    myCache.set("allProducts", JSON.stringify(products));
  }

  return res.status(200).json({
    success: true,
    products,
  });
});

export const getSingleProduct = TryCatch(async (req, res, next) => {
  let product;
  const id = req.params.id;

  if (myCache.has(`product-${id}`)) {
    product = JSON.parse(myCache.get(`product-${id}`) as string);
  } else {
    product = await Product.findById(req.params.id);
    if (!product) return next(new ErrorHandler("Product not found", 404));
    myCache.set(`product-${id}`, JSON.stringify(product));
  }

  return res.status(200).json({
    success: true,
    product,
  });
});


export const newProduct = TryCatch(
  async (req: Request<{}, {}, NewProductRequestBody>, res, next) => {
    const { name, stock, category, price } = req.body;
    const photo = req.file;

    if (!photo) {
      return next(new ErrorHandler("Photo not inserted", 400));
    }

    if (!name || !price || !stock || !category) {
      rm(photo.path, () => {
        console.log("Deleted");
      });

      return next(new ErrorHandler("Please enter all fields", 400));
    }
    await Product.create({
      name,
      price,
      stock,
      category: category.toLowerCase(),
      photo: photo.path,
    });

    invalidatesCache({product: true,admin: true,})

    return res.status(201).json({
      success: true,
      message: "Product created Successfully",
    });
  }
);


export const updateProduct = TryCatch(async (req, res, next) => {
  const { id } = req.params;
  const { name, stock, category, price } = req.body;
  const photo = req.file;
  const product = await Product.findById(id);

  if (!product) return next(new ErrorHandler("Product not found", 404));

  if (photo) {
    rm(product.photo!, () => {
      console.log("Old Photo Deleted");
    });
    product.photo = photo.path;
  }

  if (name) product.name = name;
  if (price) product.price = price;
  if (category) product.category = category;
  if (stock) product.stock = stock;

  await product.save();

  invalidatesCache({product: true,productId: String(product._id),admin: true,})


  return res.status(200).json({
    success: true,
    message: "Product updated Successfully",
  });
});

export const deleteProduct = TryCatch(async (req, res, next) => {
  const product = await Product.findById(req.params.id);
  if (!product) return next(new ErrorHandler("Product not found", 404));

  rm(product.photo!, () => {
    console.log("Product Photo Deleted");
  });

  await product.deleteOne();

  invalidatesCache({product: true,productId: String(product._id)})


  return res.status(200).json({
    success: true,
    message: "Product Deletd Successfully",
  });
});

export const getAllProducts = TryCatch(
  async (req: Request<{}, {}, {}, SearchRequestQuery>, res, next) => {
    const { search, sort, category, price } = req.query;
    const page = Number(req.query.page) || 1;
    const limit = Number(process.env.PRODUCT_PER_PAGE) || 8;
    const skip = limit * (page - 1);

    const baseQuery: BaseQuery = {};

    if (search)
      baseQuery.name = {
        $regex: search,
        $options: "i",
      };
    if (price)
      baseQuery.price = {
        $lte: Number(price),
      };
    if (category) baseQuery.category = category;

    const productsPromise = Product.find(baseQuery)
      .sort(sort && { price: sort === "asc" ? 1 : -1 })
      .limit(limit)
      .skip(skip);

    const [products, fileteredOnlyProduct] = await Promise.all([
      productsPromise,
      Product.find(baseQuery),
    ]);

    // const products = await Product.find(baseQuery)
    // .sort(sort && { price: sort === "asc" ? 1 : -1 })
    // .limit(limit)
    // .skip(skip)

    //   const fileteredOnlyProduct=await Product.find(baseQuery);

    const totalPage = Math.ceil(fileteredOnlyProduct.length / limit);
    return res.status(200).json({
      success: true,
      products,
      totalPage,
    });
  }
);

// const generateRandomProducts = async (count: number = 10) => {
//   const products = [];
//   for (let i = 0; i < count; i++) {
//     const product = {
//       name: faker.commerce.productName(),
//       photo: "uploads\\6471030f-c1c5-4a21-9f11-cfd87ab458d4.jpg",
//       price: faker.commerce.price({ min: 1500, max: 800000, dec: 0 }),
//       stock: faker.commerce.price({ min: 0, max: 100, dec: 0 }),
//       category: faker.commerce.department(),
//       createdAt: new Date(faker.date.past()),
//       updatedAt: new Date(faker.date.recent()),
//       _v: 0,
//     };
//     products.push(product);
//   }
//   await Product.create(products);
//   console.log({sucess: true});
// };
// generateRandomProducts(40);

// const deleteProducts = async (count: number = 10) => {
//   const products = await Product.find({}).skip(2);

//   for (let i = 0; i < products.length; i++) {
//     const product = products[i];
//     await product.deleteOne();
//   }
//   console.log({ success: true });
// };
// deleteProducts(38)
