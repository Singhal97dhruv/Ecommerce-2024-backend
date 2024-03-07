import { myCache } from "../app";
import { TryCatch } from "../middlewares/error";
import { Order } from "../models/orders";
import { Product } from "../models/product";
import { User } from "../models/user";
import { calculatePercentage, getChartData, getInventories } from "../utils/features";

export const getDashboardStats = TryCatch(async (req, res, next) => {
  let stats;

  if (myCache.has("adminStats"))
    stats = JSON.parse(myCache.get("adminStats") as string);
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

    const thisMonthProductsPromise = Product.find({
      createdAt: {
        $gte: thisMonth.start,
        $lte: thisMonth.end,
      },
    });
    const lastMonthProductsPromise = Product.find({
      createdAt: {
        $gte: lastMonth.start,
        $lte: lastMonth.end,
      },
    });

    const thisMonthUsersPromise = User.find({
      createdAt: {
        $gte: thisMonth.start,
        $lte: thisMonth.end,
      },
    });
    const lastMonthUsersPromise = User.find({
      createdAt: {
        $gte: lastMonth.start,
        $lte: lastMonth.end,
      },
    });

    const thisMonthOrdersPromise = Order.find({
      createdAt: {
        $gte: thisMonth.start,
        $lte: thisMonth.end,
      },
    });
    const lastMonthOrdersPromise = Order.find({
      createdAt: {
        $gte: lastMonth.start,
        $lte: lastMonth.end,
      },
    });

    const lastSixMonthsOrdersPromise = Order.find({
      createdAt: {
        $gte: sixMonthsAgo,
        $lte: today,
      },
    });

    const latestTxnPromise = Order.find({})
      .select(["orderItems", "discount", "total", "status"])
      .limit(4);

    const [
      thisMonthOrders,
      thisMonthProducts,
      thisMonthUsers,
      lastMonthOrders,
      lastMonthProducts,
      lastMonthUsers,
      productsCount,
      usersCount,
      allOrders,
      lastSixMonthsOrders,
      categories,
      femaleUsersCount,
      latestTxn,
    ] = await Promise.all([
      thisMonthOrdersPromise,
      thisMonthProductsPromise,
      thisMonthUsersPromise,
      lastMonthOrdersPromise,
      lastMonthProductsPromise,
      lastMonthUsersPromise,
      Product.countDocuments(),
      User.countDocuments(),
      Order.find({}).select("total"),
      lastSixMonthsOrdersPromise,
      Product.distinct("category"),
      User.countDocuments({ gender: "female" }),
      latestTxnPromise,
    ]);

    const thisMonthRevenue = thisMonthOrders.reduce(
      (total, order) => total + (order.total || 0),
      0
    );
    const lastMonthRevenue = lastMonthOrders.reduce(
      (total, order) => total + (order.total || 0),
      0
    );

    const revenueChangePercent = calculatePercentage(
      thisMonthRevenue,
      lastMonthRevenue
    );
    const productChangePercent = calculatePercentage(
      thisMonthProducts.length,
      lastMonthProducts.length
    );

    const userChangePercent = calculatePercentage(
      thisMonthUsers.length,
      lastMonthUsers.length
    );

    const orderChangePercent = calculatePercentage(
      thisMonthOrders.length,
      lastMonthOrders.length
    );

    const revenue = allOrders.reduce(
      (total, order) => total + (order.total || 0),
      0
    );

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
      const monthDiff = (today.getMonth() - creationDate.getMonth()+12)%12;

      if (monthDiff < 6) {
        orderMonthCounts[6 - monthDiff - 1] += 1;
        orderMonthlyRevenue[6 - monthDiff - 1] += order.total;
      }
    });

    const categoryCount = await getInventories({ categories, productsCount });

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

    myCache.set("adminStats", JSON.stringify(stats));
  }

  return res.status(200).json({
    success: true,
    stats,
  });
});






export const getPieCharts = TryCatch(async (req, res, next) => {
  let charts;
  if (myCache.has("adminPieCharts"))
    charts = JSON.parse(myCache.get("adminPieCharts") as string);
  else {


    const allOrdersPromise= Order.find({}).select(["total","discount","subtotal","tax","shippingCharges"]);


    const [
      processingOrder,
      shippedOrder,
      deliveredOrder,
      categories,
      productsCount,
      productsOutStock,
      allOrders,
      allUsers,
      adminUsersCount,
      customerUsers,
    ] = await Promise.all([
      Order.countDocuments({ status: "Processing" }),
      Order.countDocuments({ status: "Shipped" }),
      Order.countDocuments({ status: "Delivered" }),
      Product.distinct("category"),
      Product.countDocuments(),
      Product.countDocuments({stock:"0"}),
      allOrdersPromise,
      User.find({}).select(["dob"]),
      User.countDocuments({role: "admin"}),
      User.countDocuments({role:"user"})
    ]);

    const orderFulfilment = {
      processing: processingOrder,
      shipped: shippedOrder,
      delivered: deliveredOrder,
    };

    const productCategories = await getInventories({ categories, productsCount });

    const stockAvailability={
      inStock: productsCount-productsOutStock,
      outStock: productsOutStock,
    }

    const grossIncome=allOrders.reduce((prev,order)=>prev+(order.total ||0),0);
    const discount=allOrders.reduce((prev,order)=>prev+(order.discount ||0),0);
    const productionCost=allOrders.reduce((prev,order)=>prev+(order.shippingCharges ||0),0);
    const burnt=allOrders.reduce((prev,order)=>prev+(order.tax ||0),0);
    const marketingCost=Math.round(grossIncome*(30/100));
    const netMargin=grossIncome-discount-productionCost-burnt-marketingCost;

    const revenueDistribution={
      netMargin,
      discount,
      productionCost,
      burnt,
      marketingCost,
      
    }

    const userAgeGroup={
      teen: allUsers.filter(i=>i.age<20).length,
      adult: allUsers.filter(i=>(i.age>=20 && i.age<=40)).length,
      old: allUsers.filter(i=>i.age>40).length,
    }

    const adminCustomers={
      admin:adminUsersCount,
      customer: customerUsers,
    }

    charts = {
      orderFulfilment,
      productCategories,
      stockAvailability,
      revenueDistribution,
      userAgeGroup,
      adminCustomers
    };

    myCache.set("adminPieCharts", JSON.stringify(charts));
  }
  return res.status(200).json({
    success: true,
    charts,
  });
});
export const getBarCharts = TryCatch(async (req,res,next) => {

  let charts;
  const key="adminBarChart";

  if(myCache.has(key))charts=JSON.parse(myCache.get(key) as string);
  else{

    
    const today = new Date();

    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    const twelveMonthsAgo = new Date();
    twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 12);

    const sixMonthProductPromise = Product.find({
      createdAt: {
        $gte: sixMonthsAgo,
        $lte: today,
      },
    }).select("createdAt");

    const sixMonthUsersPromise = User.find({
      createdAt: {
        $gte: sixMonthsAgo,
        $lte: today,
      },
    }).select("createdAt");

    const twelveMonthOrdersPromise = Order.find({
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
      const monthDiff = (today.getMonth() - creationDate.getMonth()+12)%12;

      if (monthDiff < 6) {
        productsCounts[6 - monthDiff - 1] += 1;
      }
    });

    
    const ordersCounts = new Array(12).fill(0);

    orders.forEach((order) => {
      const creationDate = order.createdAt;
      const monthDiff = (today.getMonth() - creationDate.getMonth()+12)%12;

      if (monthDiff < 12) {
        ordersCounts[12 - monthDiff - 1] += 1;
      }
    });




    // const productCounts = getChartData({ length: 6, today, docArr: products });
    const usersCounts = getChartData({ length: 6, today, docArr: users });
    // const ordersCounts = getChartData({ length: 12, today, docArr: orders });
    charts={
      users: usersCounts,
      product:productsCounts,
      orders: ordersCounts,
    }

    myCache.set(key,JSON.stringify(charts));

  }
  return res.status(200).json({
    success: true,
    charts,
  });

});
export const getLineCharts = TryCatch(async (req,res,next) => {


  
  let charts;
  const key="adminLineChart";

  if(myCache.has(key))charts=JSON.parse(myCache.get(key) as string);
  else{

    
    const today = new Date();


    const twelveMonthsAgo = new Date();
    twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 12);

    const baseQuery={
      createdAt: {
        $gte: twelveMonthsAgo,
        $lte: today,
      }}
    

    const twelveMonthProductsPromise = Product.find(baseQuery).select("createdAt");
    const twelveMonthUsersPromise = User.find(baseQuery).select("createdAt");
    const twelveMonthOrdersPromise = Order.find(baseQuery).select("createdAt");

    const [products, users, orders] = await Promise.all([
      Product.find(baseQuery).select("createdAt"),
      User.find(baseQuery).select("createdAt"),
      Order.find(baseQuery).select(["createdAt","discount","total"])
    ]);
    


    const productsCounts = new Array(12).fill(0);

    products.forEach((product) => {
      const creationDate = product.createdAt;
      const monthDiff = (today.getMonth() - creationDate.getMonth()+12)%12;

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

    const discount=new Array(12).fill(0);

    orders.forEach((order)=>{
      const creationDate=order.createdAt;
      const monthDiff= (today.getMonth() - creationDate.getMonth()+12)%12;

      if(monthDiff<12){
        discount[12-monthDiff-1]+=order.discount;
      }
    })

    const revenue=new Array(12).fill(0);

    orders.forEach((order)=>{
      const creationDate=order.createdAt;
      const monthDiff= (today.getMonth() - creationDate.getMonth()+12)%12;

      if(monthDiff<12){
        revenue[12-monthDiff-1]+=order.total;
      }
    })



    // const productCounts = getChartData({ length: 6, today, docArr: products });
    const usersCounts = getChartData({ length: 12, today, docArr: users });
    // const discount = getChartData({ length: 12, today, docArr: orders,property: "discount"});
      
    // const revenue = getChartData({ length: 12, today, docArr: orders,property: "total"});


    charts={
      users: usersCounts,
      product:productsCounts,
      discount,
      revenue
    }

    myCache.set(key,JSON.stringify(charts));

  }
  return res.status(200).json({
    success: true,
    charts,
  });

});
