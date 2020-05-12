import { Context } from "koa";
import { getManager, Repository, In, Between, LessThan } from "typeorm";
import { Order } from "../entity/Order";
import { User } from "../entity/User";
import { Location } from "../entity/Location";
import { Identity } from "../entity/Identity";
import { Amount } from "../entity/Amount";
import { Supply } from "../entity/Supply";

import moment from "moment-timezone";

export default class OrderController {
  /**
   * db
   */
  public static async db(ctx: Context) {
    const OrderRepo: Repository<Order> = getManager().getRepository(Order);

    ctx.status = 200;
    ctx.body = await OrderRepo.find();
  }
  /**
   * create
   */
  public static async create(ctx: Context) {
    const data = ctx.request.body;

    // 查詢電話
    const UserRepo: Repository<User> = getManager().getRepository(User);
    const user: User = await UserRepo.findOne({
      where: { phone: data["phone"] },
      relations: ["orders"],
    });
    if (user === undefined) {
      ctx.throw(404, "電話號碼有誤");
    }

    // 檢查目前是否已有訂單
    const activeOrder = user.orders.find((order) => {
      return order.active;
    });
    if (activeOrder !== undefined) {
      ctx.throw(400, "此電話號碼已有排隊中訂單，每個號碼同時僅能預約一筆訂單");
    }

    // 查詢取貨點
    const LocationRepo: Repository<Location> = getManager().getRepository(
      Location
    );
    const location: Location = await LocationRepo.findOne({
      where: { id: data["location"] },
    });
    if (location === undefined) {
      ctx.throw(404, "取貨地點無法查詢");
    }

    // 確認身分證都能下訂
    const IdentityRepo: Repository<Identity> = getManager().getRepository(
      Identity
    );
    // 取得所有證號
    const allIds = data.orders.map((order) => {
      return order.id;
    });

    const identities: Identity[] = await IdentityRepo.find({
      where: { serial: In(allIds) },
      relations: ["orders"],
    });
    for (let index = 0; index < identities.length; index++) {
      const id = identities[index];
      const activeOrders = id.orders.find((order) => {
        return order.active;
      });
      if (activeOrders !== undefined) {
        ctx.throw(400, "此證號已有排隊中訂單，每個證號同時僅能預約一筆訂單");
      }
    }

    // 建立訂單
    const OrderRepo: Repository<Order> = getManager().getRepository(Order);
    const AmountRepo: Repository<Amount> = getManager().getRepository(Amount);
    const SupplyRepo: Repository<Supply> = getManager().getRepository(Supply);

    const newOrder: Order = new Order();
    newOrder.location = location;
    newOrder.user = user;
    newOrder.amounts = [];
    newOrder.identities = [];
    // 產生訂單序號
    var start = new Date();
    start.setHours(0, 0, 0, 0);

    var end = new Date(start.getTime());
    end.setHours(23, 59, 59, 999);
    let todayCounts = await OrderRepo.count({
      createdAt: Between(start, end),
    });
    if (todayCounts === undefined) {
      todayCounts = 0;
    }
    newOrder.serial = orderSerial(todayCounts + 1);
    // 初始化訂單
    await OrderRepo.save(newOrder);

    // 準備物資列表
    const supplies = await SupplyRepo.find();

    for (let index = 0; index < data.orders.length; index++) {
      const orderInfo = data.orders[index];
      // 取得身分證資訊 ========================================
      let identity: Identity = await IdentityRepo.findOne({
        where: { serial: orderInfo.id },
      });
      if (identity === undefined) {
        identity = IdentityRepo.create({
          serial: orderInfo.id,
        });
        identity = await IdentityRepo.save(identity);
      }
      // 關聯身分證和訂單
      newOrder.identities.push(identity);

      // 取得數量資訊 ========================================
      const supplyType = supplies.find((obj) => {
        return obj.category == orderInfo.type;
      });
      const amount = AmountRepo.create({
        value: orderInfo.amount * 2,
        order: newOrder,
        supply: supplyType,
        identity,
      });
      await AmountRepo.save(amount);
      // 關聯數量和訂單
      newOrder.amounts.push(amount);
    }

    const response = await OrderRepo.save(newOrder);

    ctx.status = 201;
    ctx.body = orderResponse(response);
  }

  /**
   * identityCheck
   */
  public static async identityCheck(ctx: Context) {
    const idNumber = ctx.query.id;
    const IdentityRepo: Repository<Identity> = getManager().getRepository(
      Identity
    );
    const identity: Identity = await IdentityRepo.findOne({
      where: { serial: idNumber },
      relations: ["orders"],
    });
    let isAvailable = true;
    if (identity !== undefined) {
      const activeOrders = identity.orders.find((order) => {
        return order.active;
      });
      if (activeOrders !== undefined) {
        isAvailable = false;
      }
    }

    if (isAvailable) {
      ctx.status = 200;
      ctx.body = { available: true };
    } else {
      ctx.status = 400;
      ctx.body = { available: false };
    }
  }

  /**
   * show
   */
  public static async show(ctx: Context) {
    const phone = ctx.query.phone;
    const serial = ctx.query.serial;
    const locationId = ctx.query.location;
    const OrderRepo: Repository<Order> = getManager().getRepository(Order);
    let query = {};
    if (phone !== undefined) {
      const UserRepo: Repository<User> = getManager().getRepository(User);
      const user = await UserRepo.findOne({
        where: { phone },
      });
      query = { user };
    } else if (serial !== undefined) {
      query = { serial };
    } else {
      ctx.throw(400, "請至少輸入電話或是訂單序號");
    }

    const condition = Object.assign({ active: true }, query);
    const order = await OrderRepo.findOne({
      where: condition,
      relations: ["location", "amounts", "amounts.identity", "amounts.supply"],
    });

    if (order !== undefined) {
      if (locationId !== undefined && order.location.id != locationId) {
        ctx.throw(400, "非本店取貨訂單，請確認訂單內容");
      } else {
        let currentWaiting = await OrderRepo.count({
          id: LessThan(order.id),
          active: true,
        });
        ctx.status = 200;
        ctx.body = Object.assign(orderResponse(order), {
          currentWaiting: currentWaiting + 1,
        });
      }
    } else {
      ctx.throw(404, "查不到訂單");
    }
  }

  /**
   * notify
   */
  public static async notify(ctx: Context) {
    const locationId = ctx.params.location;
    const amount = ctx.query.amount;
    const LocationRepo: Repository<Location> = getManager().getRepository(
      Location
    );
    const location = await LocationRepo.findOne(locationId);

    if (location !== undefined) {
      const OrderRepo: Repository<Order> = getManager().getRepository(Order);
      const orders = await OrderRepo.find({
        order: {
          createdAt: "ASC",
        },
        where: {
          active: true,
          location: { id: location.id },
        },
        relations: ["user", "amounts", "amounts.supply"],
        take: amount,
      });
      let adultTotal = location.adultStock,
        kidTotal = location.kidStock,
        notifyCount = 0;
      // 7 天後
      const deadline = moment()
        .tz("Asia/Taipei")
        .add(7, "days")
        .format("MM/DD");
      for (let index = 0; index < orders.length; index++) {
        const order = orders[index];
        if (adultTotal > 0 || kidTotal > 0) {
          // 計算此訂單數量
          let adultAmount = 0,
            kidAmount = 0;
          order.amounts.forEach((amount) => {
            if (amount.supply.category === "adult") {
              adultAmount += Number(amount.value);
            } else if (amount.supply.category === "kid") {
              kidAmount += Number(amount.value);
            }
          });
          // 判斷庫存是否足夠供應此訂單數量
          if (adultTotal >= adultAmount && kidTotal >= kidAmount) {
            // 通知量還夠
            adultTotal -= adultAmount;
            kidTotal -= kidAmount;
            // 更新訂單
            order.delivered = true;
            order.deliveredAt = new Date();
            await OrderRepo.save(order);

            const notifyMsg = `您預定的口罩已送達${location.name}，請攜帶身份證明文件前往取貨，請於7日內(${deadline}前)完成取貨，否則此筆預約將失效。`;

            // 實作通知方法

            notifyCount++;
          }
        } else {
          // 都通知完了，庫存都空
          break;
        }
      }

      ctx.status = 200;
      ctx.body = { success: true, message: `notified ${notifyCount} orders.` };
    } else {
      ctx.status = 404;
      ctx.body = { success: false, message: "取貨地點無法查詢" };
    }
  }

  /**
   * cancel
   */
  public static async cancel(ctx: Context) {
    const phone = ctx.query.phone;
    const UserRepo: Repository<User> = getManager().getRepository(User);
    const user = await UserRepo.findOne({
      where: { phone },
    });
    const OrderRepo: Repository<Order> = getManager().getRepository(Order);
    const order = await OrderRepo.findOne({
      where: { user, active: true },
    });

    if (order !== undefined) {
      order.active = false;
      await OrderRepo.save(order);

      ctx.status = 200;
      ctx.body = { message: "order canceled." };
    } else {
      ctx.throw(404, "查不到訂單");
    }
  }

  /**
   * pickup
   */
  public static async pickup(ctx: Context) {
    const serial = ctx.query.serial;
    const OrderRepo: Repository<Order> = getManager().getRepository(Order);
    const order = await OrderRepo.findOne({
      where: { serial, active: true },
      relations: ["location", "amounts", "amounts.supply"],
    });

    if (order !== undefined) {
      if (order.delivered) {
        // 取得庫存資訊
        // 確認物資類型
        const SupplyRepo: Repository<Supply> = getManager().getRepository(
          Supply
        );
        const supplies = await SupplyRepo.find();
        const adult = supplies.find((supply) => supply.category === "adult");
        const kid = supplies.find((supply) => supply.category === "kid");
        // 計算領取總數
        const adultAmount = order.amounts.filter(
          (amount) => amount.supply.id == adult.id
        );
        const kidAmount = order.amounts.filter(
          (amount) => amount.supply.id == kid.id
        );
        let adultTotal = 0,
          kidTotal = 0;
        const adultValues = adultAmount.map((amount) => Number(amount.value));
        if (adultValues.length > 0) {
          adultTotal = adultValues.reduce((total, amount) => {
            return total + amount;
          }, 0);
        }
        const kidValues = kidAmount.map((amount) => Number(amount.value));
        if (kidValues.length > 0) {
          kidTotal = kidValues.reduce((total, amount) => {
            return total + amount;
          }, 0);
        }

        const LocationRepo: Repository<Location> = getManager().getRepository(
          Location
        );
        let newAdultTotal = order.location.adultStock - adultTotal;
        let newKidTotal = order.location.kidStock - kidTotal;
        newAdultTotal = newAdultTotal < 0 ? 0 : newAdultTotal;
        newKidTotal = newKidTotal < 0 ? 0 : newKidTotal;
        await LocationRepo.update(order.location.id, {
          adultStock: newAdultTotal,
          kidStock: newKidTotal,
        });

        // 更改訂單狀態
        order.pickup = true;
        order.pickupAt = new Date();
        order.active = false;
        await OrderRepo.save(order);

        ctx.status = 200;
        ctx.body = { message: "order pickup." };
      } else {
        ctx.status = 400;
        ctx.body = { message: "此訂單尚未被通知可領取" };
      }
    } else {
      ctx.throw(404, "查不到訂單");
    }
  }
}

function orderSerial(orderCount) {
  const currentDate = new Date();
  const year = currentDate.getFullYear().toString().slice(-2);
  const month = pad(currentDate.getMonth() + 1, 2);
  const date = pad(currentDate.getDate(), 2);

  const serial = pad(orderCount, 10);
  return `${year}${month}${date}${serial}`;
}

function pad(num, size) {
  return ("000000000" + num).substr(-size);
}

function orderResponse(order) {
  for (let index = 0; index < order.amounts.length; index++) {
    const amount = order.amounts[index];
  }
  const orders = order.amounts.map((amount) => {
    return {
      id: amount.identity.serial,
      type: amount.supply.category,
      amount: amount.value,
    };
  });
  return {
    id: order.id,
    serial: order.serial,
    orders,
    city: order.location.city,
    district: order.location.district,
    category: order.location.category,
    location: order.location.name,
    address: order.location.address,
  };
}
