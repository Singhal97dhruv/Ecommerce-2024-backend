"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getLineCharts = exports.getBarCharts = exports.getPieCharts = exports.getDashboardStats = void 0;
const app_1 = require("../app");
const error_1 = require("../middlewares/error");
const orders_1 = require("../models/orders");
const product_1 = require("../models/product");
const user_1 = require("../models/user");
const features_1 = require("../utils/features");
exports.getDashboardStats = (0, error_1.TryCatch)(async (req, res, next) => {
    let stats;
    if (app_1.myCache.has("adminStats"))
        stats = JSON.parse(app_1.myCache.get("adminStats"));
    else {
        const today = new Date();
        const sixMonthsAgo = new Date();
        sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
        const thisMonth = {
            start: new Date(today.getFullYear(), today.getMonth(), 1),
            end: new Date(today.getFullYear(), today.getMonth() + 1, 0),
        };
        const lastMonth = {
            start: new Date(today.getFullYear(), today.getMonth() - 1, 1),
            end: new Date(today.getFullYear(), today.getMonth(), 0),
        };
        const thisMonthProductsPromise = product_1.Product.find({
            createdAt: {
                $gte: thisMonth.start,
                $lte: thisMonth.end,
            },
        });
        const lastMonthProductsPromise = product_1.Product.find({
            createdAt: {
                $gte: lastMonth.start,
                $lte: lastMonth.end,
            },
        });
        const thisMonthUsersPromise = user_1.User.find({
            createdAt: {
                $gte: thisMonth.start,
                $lte: thisMonth.end,
            },
        });
        const lastMonthUsersPromise = user_1.User.find({
            createdAt: {
                $gte: lastMonth.start,
                $lte: lastMonth.end,
            },
        });
        const thisMonthOrdersPromise = orders_1.Order.find({
            createdAt: {
                $gte: thisMonth.start,
                $lte: thisMonth.end,
            },
        });
        const lastMonthOrdersPromise = orders_1.Order.find({
            createdAt: {
                $gte: lastMonth.start,
                $lte: lastMonth.end,
            },
        });
        const lastSixMonthsOrdersPromise = orders_1.Order.find({
            createdAt: {
                $gte: sixMonthsAgo,
                $lte: today,
            },
        });
        const latestTxnPromise = orders_1.Order.find({})
            .select(["orderItems", "discount", "total", "status"])
            .limit(4);
        const [thisMonthOrders, thisMonthProducts, thisMonthUsers, lastMonthOrders, lastMonthProducts, lastMonthUsers, productsCount, usersCount, allOrders, lastSixMonthsOrders, categories, femaleUsersCount, latestTxn,] = await Promise.all([
            thisMonthOrdersPromise,
            thisMonthProductsPromise,
            thisMonthUsersPromise,
            lastMonthOrdersPromise,
            lastMonthProductsPromise,
            lastMonthUsersPromise,
            product_1.Product.countDocuments(),
            user_1.User.countDocuments(),
            orders_1.Order.find({}).select("total"),
            lastSixMonthsOrdersPromise,
            product_1.Product.distinct("category"),
            user_1.User.countDocuments({ gender: "female" }),
            latestTxnPromise,
        ]);
        const thisMonthRevenue = thisMonthOrders.reduce((total, order) => total + (order.total || 0), 0);
        const lastMonthRevenue = lastMonthOrders.reduce((total, order) => total + (order.total || 0), 0);
        const revenueChangePercent = (0, features_1.calculatePercentage)(thisMonthRevenue, lastMonthRevenue);
        const productChangePercent = (0, features_1.calculatePercentage)(thisMonthProducts.length, lastMonthProducts.length);
        const userChangePercent = (0, features_1.calculatePercentage)(thisMonthUsers.length, lastMonthUsers.length);
        const orderChangePercent = (0, features_1.calculatePercentage)(thisMonthOrders.length, lastMonthOrders.length);
        const revenue = allOrders.reduce((total, order) => total + (order.total || 0), 0);
        const count = {
            revenue,
            product: productsCount,
            user: usersCount,
            order: allOrders.length,
        };
        const orderMonthCounts = new Array(6).fill(0);
        const orderMonthlyRevenue = new Array(6).fill(0);
        lastSixMonthsOrders.forEach((order) => {
            const creationDate = order.createdAt;
            const monthDiff = (today.getMonth() - creationDate.getMonth() + 12) % 12;
            if (monthDiff < 6) {
                orderMonthCounts[6 - monthDiff - 1] += 1;
                orderMonthlyRevenue[6 - monthDiff - 1] += order.total;
            }
        });
        const categoryCount = await (0, features_1.getInventories)({ categories, productsCount });
        const userRatio = {
            male: usersCount - femaleUsersCount,
            female: femaleUsersCount,
        };
        const modifiedLatestTransation = latestTxn.map((e) => ({
            _id: e._id,
            discount: e.discount,
            amount: e.total,
            quantity: e.orderItems.length,
            status: e.status,
        }));
        stats = {
            userRatio,
            categoryCount,
            count,
            latestTxn: modifiedLatestTransation,
            revenueChangePercent,
            productChangePercent,
            userChangePercent,
            orderChangePercent,
            chart: {
                orderMonthCounts,
                orderMonthlyRevenue,
            },
        };
        app_1.myCache.set("adminStats", JSON.stringify(stats));
    }
    return res.status(200).json({
        success: true,
        stats,
    });
});
exports.getPieCharts = (0, error_1.TryCatch)(async (req, res, next) => {
    let charts;
    if (app_1.myCache.has("adminPieCharts"))
        charts = JSON.parse(app_1.myCache.get("adminPieCharts"));
    else {
        const allOrdersPromise = orders_1.Order.find({}).select(["total", "discount", "subtotal", "tax", "shippingCharges"]);
        const [processingOrder, shippedOrder, deliveredOrder, categories, productsCount, productsOutStock, allOrders, allUsers, adminUsersCount, customerUsers,] = await Promise.all([
            orders_1.Order.countDocuments({ status: "Processing" }),
            orders_1.Order.countDocuments({ status: "Shipped" }),
            orders_1.Order.countDocuments({ status: "Delivered" }),
            product_1.Product.distinct("category"),
            product_1.Product.countDocuments(),
            product_1.Product.countDocuments({ stock: "0" }),
            allOrdersPromise,
            user_1.User.find({}).select(["dob"]),
            user_1.User.countDocuments({ role: "admin" }),
            user_1.User.countDocuments({ role: "user" })
        ]);
        const orderFulfilment = {
            processing: processingOrder,
            shipped: shippedOrder,
            delivered: deliveredOrder,
        };
        const productCategories = await (0, features_1.getInventories)({ categories, productsCount });
        const stockAvailability = {
            inStock: productsCount - productsOutStock,
            outStock: productsOutStock,
        };
        const grossIncome = allOrders.reduce((prev, order) => prev + (order.total || 0), 0);
        const discount = allOrders.reduce((prev, order) => prev + (order.discount || 0), 0);
        const productionCost = allOrders.reduce((prev, order) => prev + (order.shippingCharges || 0), 0);
        const burnt = allOrders.reduce((prev, order) => prev + (order.tax || 0), 0);
        const marketingCost = Math.round(grossIncome * (30 / 100));
        const netMargin = grossIncome - discount - productionCost - burnt - marketingCost;
        const revenueDistribution = {
            netMargin,
            discount,
            productionCost,
            burnt,
            marketingCost,
        };
        const userAgeGroup = {
            teen: allUsers.filter(i => i.age < 20).length,
            adult: allUsers.filter(i => (i.age >= 20 && i.age <= 40)).length,
            old: allUsers.filter(i => i.age > 40).length,
        };
        const adminCustomers = {
            admin: adminUsersCount,
            customer: customerUsers,
        };
        charts = {
            orderFulfilment,
            productCategories,
            stockAvailability,
            revenueDistribution,
            userAgeGroup,
            adminCustomers
        };
        app_1.myCache.set("adminPieCharts", JSON.stringify(charts));
    }
    return res.status(200).json({
        success: true,
        charts,
    });
});
exports.getBarCharts = (0, error_1.TryCatch)(async (req, res, next) => {
    let charts;
    const key = "adminBarChart";
    if (app_1.myCache.has(key))
        charts = JSON.parse(app_1.myCache.get(key));
    else {
        const today = new Date();
        const sixMonthsAgo = new Date();
        sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
        const twelveMonthsAgo = new Date();
        twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 12);
        const sixMonthProductPromise = product_1.Product.find({
            createdAt: {
                $gte: sixMonthsAgo,
                $lte: today,
            },
        }).select("createdAt");
        const sixMonthUsersPromise = user_1.User.find({
            createdAt: {
                $gte: sixMonthsAgo,
                $lte: today,
            },
        }).select("createdAt");
        const twelveMonthOrdersPromise = orders_1.Order.find({
            createdAt: {
                $gte: twelveMonthsAgo,
                $lte: today,
            },
        }).select("createdAt");
        const [products, users, orders] = await Promise.all([
            sixMonthProductPromise,
            sixMonthUsersPromise,
            twelveMonthOrdersPromise,
        ]);
        const productsCounts = new Array(6).fill(0);
        products.forEach((product) => {
            const creationDate = product.createdAt;
            const monthDiff = (today.getMonth() - creationDate.getMonth() + 12) % 12;
            if (monthDiff < 6) {
                productsCounts[6 - monthDiff - 1] += 1;
            }
        });
        const ordersCounts = new Array(12).fill(0);
        orders.forEach((order) => {
            const creationDate = order.createdAt;
            const monthDiff = (today.getMonth() - creationDate.getMonth() + 12) % 12;
            if (monthDiff < 12) {
                ordersCounts[12 - monthDiff - 1] += 1;
            }
        });
        // const productCounts = getChartData({ length: 6, today, docArr: products });
        const usersCounts = (0, features_1.getChartData)({ length: 6, today, docArr: users });
        // const ordersCounts = getChartData({ length: 12, today, docArr: orders });
        charts = {
            users: usersCounts,
            product: productsCounts,
            orders: ordersCounts,
        };
        app_1.myCache.set(key, JSON.stringify(charts));
    }
    return res.status(200).json({
        success: true,
        charts,
    });
});
exports.getLineCharts = (0, error_1.TryCatch)(async (req, res, next) => {
    let charts;
    const key = "adminLineChart";
    if (app_1.myCache.has(key))
        charts = JSON.parse(app_1.myCache.get(key));
    else {
        const today = new Date();
        const twelveMonthsAgo = new Date();
        twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 12);
        const baseQuery = {
            createdAt: {
                $gte: twelveMonthsAgo,
                $lte: today,
            }
        };
        const twelveMonthProductsPromise = product_1.Product.find(baseQuery).select("createdAt");
        const twelveMonthUsersPromise = user_1.User.find(baseQuery).select("createdAt");
        const twelveMonthOrdersPromise = orders_1.Order.find(baseQuery).select("createdAt");
        const [products, users, orders] = await Promise.all([
            product_1.Product.find(baseQuery).select("createdAt"),
            user_1.User.find(baseQuery).select("createdAt"),
            orders_1.Order.find(baseQuery).select(["createdAt", "discount", "total"])
        ]);
        const productsCounts = new Array(12).fill(0);
        products.forEach((product) => {
            const creationDate = product.createdAt;
            const monthDiff = (today.getMonth() - creationDate.getMonth() + 12) % 12;
            if (monthDiff < 12) {
                productsCounts[12 - monthDiff - 1] += 1;
            }
        });
        // const ordersCounts = new Array(12).fill(0);
        // orders.forEach((order) => {
        //   const creationDate = order.createdAt;
        //   const monthDiff = (today.getMonth() - creationDate.getMonth()+12)%12;
        //   if (monthDiff < 12) {
        //     ordersCounts[12 - monthDiff - 1] += 1;
        //   }
        // });
        const discount = new Array(12).fill(0);
        orders.forEach((order) => {
            const creationDate = order.createdAt;
            const monthDiff = (today.getMonth() - creationDate.getMonth() + 12) % 12;
            if (monthDiff < 12) {
                discount[12 - monthDiff - 1] += order.discount;
            }
        });
        const revenue = new Array(12).fill(0);
        orders.forEach((order) => {
            const creationDate = order.createdAt;
            const monthDiff = (today.getMonth() - creationDate.getMonth() + 12) % 12;
            if (monthDiff < 12) {
                revenue[12 - monthDiff - 1] += order.total;
            }
        });
        // const productCounts = getChartData({ length: 6, today, docArr: products });
        const usersCounts = (0, features_1.getChartData)({ length: 12, today, docArr: users });
        // const discount = getChartData({ length: 12, today, docArr: orders,property: "discount"});
        // const revenue = getChartData({ length: 12, today, docArr: orders,property: "total"});
        charts = {
            users: usersCounts,
            product: productsCounts,
            discount,
            revenue
        };
        app_1.myCache.set(key, JSON.stringify(charts));
    }
    return res.status(200).json({
        success: true,
        charts,
    });
});
