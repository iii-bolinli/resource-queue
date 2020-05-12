import { Context } from "koa";
import koaBody from "koa-body";
import { getManager, Repository } from "typeorm";
import { Location } from "../entity/Location";
import { Supply } from "../entity/Supply";
import { Order } from "../entity/Order";
import moment from "moment-timezone";
import fs from "fs";
import csv from "csv-parser";
import encoding from "encoding";

export default class LocationController {
  /**
   * create
   */
  public static async create(ctx: Context) {
    const data = ctx.request.body;
    const LocationRepo: Repository<Location> = getManager().getRepository(
      Location
    );

    const location: Location = await LocationRepo.findOne({
      where: { serial: data["serial"] },
    });

    if (location !== undefined) {
      ctx.status = 400;
      ctx.body = { message: "店號已存在", location };
    } else {
      // 建立新取貨點
      const newLocation = LocationRepo.create(data);
      await LocationRepo.save(newLocation);
      ctx.status = 201;
      ctx.body = newLocation;
    }
  }

  /**
   * import
   */
  public static async import(ctx: Context) {
    const file = ctx.request.files["csv"];
    const LocationRepo: Repository<Location> = getManager().getRepository(
      Location
    );
    let locations = [];
    fs.createReadStream(file.path)
      .pipe(csv())
      .on("data", (row) => {
        locations.push(
          LocationRepo.create({
            serial: row["店號"],
            staffCode: row["員工編號"],
            name: row["店名"],
            category: row["分類"],
            city: row["縣市"],
            district: row["地區"],
            address: row["地址"],
          })
        );
      })
      .on("end", async () => {
        try {
          const newRecord = await LocationRepo.save(locations);
          ctx.status = 200;
          ctx.body = { message: `inserted: ${newRecord.length}` };
        } catch (error) {
          ctx.status = 500;
          ctx.body = { message: "error" };
        }
      });
  }

  /**
   * categories
   */
  public static async categories(ctx: Context) {
    const LocationRepo: Repository<Location> = getManager().getRepository(
      Location
    );

    const categories: Location[] = await LocationRepo.query(
      `SELECT distinct(category) FROM location`
    );

    ctx.status = 200;
    ctx.body = categories.map((c) => c.category).filter(Boolean);
  }

  /**
   * cities
   */
  public static async cities(ctx: Context) {
    const category = ctx.query.category;
    const LocationRepo: Repository<Location> = getManager().getRepository(
      Location
    );

    const cities: Location[] = await LocationRepo.find({
      select: ["city"],
      where: { category },
    });

    ctx.status = 200;
    ctx.body = [...new Set(cities.map((c) => c.city).filter(Boolean))];
  }

  /**
   * districts
   */
  public static async districts(ctx: Context) {
    const city = ctx.query.city;
    const LocationRepo: Repository<Location> = getManager().getRepository(
      Location
    );

    const districts: Location[] = await LocationRepo.find({
      select: ["district"],
      where: { city },
    });

    ctx.status = 200;
    ctx.body = [...new Set(districts.map((d) => d.district).filter(Boolean))];
  }

  /**
   * login
   */
  public static async login(ctx: Context) {
    const data = ctx.request.body;
    const LocationRepo: Repository<Location> = getManager().getRepository(
      Location
    );
    const location: Location = await LocationRepo.findOne({
      where: {
        serial: data["serial"],
        staffCode: data["staffCode"],
      },
    });
    if (location !== undefined) {
      ctx.status = 200;
      ctx.body = location;
    } else {
      ctx.throw(404, "取貨地點無法查詢");
    }
  }

  /**
   * show
   */
  public static async all(ctx: Context) {
    const data = ctx.request.body;
    const LocationRepo: Repository<Location> = getManager().getRepository(
      Location
    );
    const OrderRepo: Repository<Order> = getManager().getRepository(Order);
    let condition = {};
    if (ctx.query.category !== undefined) {
      condition["category"] = ctx.query.category;
    }
    if (ctx.query.city !== undefined) {
      condition["city"] = ctx.query.city;
    }
    if (ctx.query.district !== undefined) {
      condition["district"] = ctx.query.district;
    }
    let locations: Location[] = await LocationRepo.find(condition);
    const ordersCount = await OrderRepo.createQueryBuilder("order")
      .select(["order.location_id", "COUNT(order.location_id) AS count"])
      .groupBy("order.location_id")
      .getRawMany();
    const response = locations.map((location) => {
      let target = ordersCount.find((l) => {
        return location.id == l.locationId;
      });
      let counts = 0;
      if (target !== undefined) {
        counts = Number(target.count);
      }
      return Object.assign(location, { orderCounts: counts });
    });
    ctx.status = 200;
    ctx.body = response;
  }

  /**
   * update
   */
  public static async update(ctx: Context) {
    const data = ctx.request.body;
    const locationId = ctx.params.id;
    const LocationRepo: Repository<Location> = getManager().getRepository(
      Location
    );
    await LocationRepo.update(locationId, data);
    const location = await LocationRepo.findOne({
      id: locationId,
    });
    ctx.status = 200;
    ctx.body = location;
  }

  /**
   * restock
   */
  public static async restock(ctx: Context) {
    const locationId = ctx.params.id;
    const data = ctx.request.body;
    const LocationRepo: Repository<Location> = getManager().getRepository(
      Location
    );

    const location = await LocationRepo.findOne({
      where: { id: locationId },
    });
    location.adultStock += data["adultStock"];
    location.kidStock += data["kidStock"];

    await LocationRepo.save(location);

    ctx.status = 200;
    ctx.body = await LocationRepo.save(location);
  }

  /**
   * orders
   */
  public static async orders(ctx: Context) {
    const locationId = ctx.params.id;
    const LocationRepo: Repository<Location> = getManager().getRepository(
      Location
    );

    const location = await LocationRepo.findOne({
      where: { id: locationId, orders: { active: true } },
      relations: ["orders", "orders.amounts", "orders.amounts.supply"],
    });

    let hasOrders = 0;
    let adultTotal = location.adultStock,
      kidTotal = location.kidStock;

    // TODO: 搜尋 active 訂單

    location.orders.forEach((order) => {
      if (order.active) {
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
        if (adultTotal >= adultAmount && kidTotal >= kidAmount) {
          adultTotal--;
          kidTotal--;
          hasOrders++;
        }
      }
    });

    ctx.status = 200;
    ctx.body = { hasOrders };
  }

  /**
   * notify
   */
  public static async notify(ctx: Context) {
    const locationId = ctx.params.id;
    const LocationRepo: Repository<Location> = getManager().getRepository(
      Location
    );

    const location = await LocationRepo.findOne({
      where: { id: locationId },
      relations: [
        "orders",
        "orders.user",
        "orders.amounts",
        "orders.amounts.supply",
      ],
    });

    if (location.adultStock > 0 || location.kidStock > 0) {
      // 總通知量 = 庫存
      let adultCount = location.adultStock;
      let kidCount = location.kidStock;
      // 店舖所有有效訂單
      const activeOrders = location.orders.filter((order) => order.active);
      // 依建立日期排序
      const sortedOrders = activeOrders.sort(
        (a, b) => a.createdAt.getTime() - b.createdAt.getTime()
      );
      // 確認物資類型
      const SupplyRepo: Repository<Supply> = getManager().getRepository(Supply);
      const supplies = await SupplyRepo.find();
      const adult = supplies.find((supply) => supply.category === "adult");
      const kid = supplies.find((supply) => supply.category === "kid");
      // 7 天後
      const deadline = moment()
        .tz("Asia/Taipei")
        .add(7, "days")
        .format("MM/DD");
      for (let index = 0; index < activeOrders.length; index++) {
        const order = activeOrders[index];
        // 計算領取總數
        const adultAmount = order.amounts.filter(
          (amount) => amount.supply.id == adult.id
        );
        const kidAmount = order.amounts.filter(
          (amount) => amount.supply.id == kid.id
        );

        let adultTotal,
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

        if (adultCount >= adultTotal && kidCount >= kidTotal) {
          // 通知量還夠
          adultCount -= adultTotal;
          kidCount -= kidTotal;
          // 更新訂單
          const OrderRepo: Repository<Order> = getManager().getRepository(
            Order
          );
          order.delivered = true;
          order.deliveredAt = new Date();
          await OrderRepo.save(order);

          const notifyMsg = `您預定的口罩已送達${location.name}，請攜帶身份證明文件前往取貨，
            請於7日內(${deadline}前)完成取貨，否則此筆預約將失效，必須重新預約`;

          // 實作通知方法

        } else if (adultCount > 0 || kidCount > 0) {
          // 還有剩餘數量，跳到下一張訂單
          continue;
        } else {
          break;
        }
      }

      ctx.status = 200;
      ctx.body = { message: "notified." };
    } else {
      ctx.status = 400;
      ctx.body = { message: "取貨點沒有庫存" };
    }
  }

  /**
   * delete
   */
  public static async delete(ctx: Context) {
    const locationId = ctx.params.id;
    const LocationRepo: Repository<Location> = getManager().getRepository(
      Location
    );
    const location = await LocationRepo.delete(locationId);

    ctx.status = 200;
    ctx.body = location;
  }
}
