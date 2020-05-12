import { Context } from "koa";
import { getManager, Repository } from "typeorm";
import { Order } from "../entity/Order";
import { Location } from "../entity/Location";
import { User } from "../entity/User";
import { Amount } from "../entity/Amount";
import moment from "moment-timezone";

export default class ConsoleController {
  /**
   * index
   */
  public static async index(ctx: Context) {
    const OrderRepo: Repository<Order> = getManager().getRepository(Order);
    const currentWaiting = await OrderRepo.count({ active: true });
    const orders = await OrderRepo.find({
      order: {
        createdAt: "ASC"
      },
      relations: [
        "user",
        "location",
        "amounts",
        "amounts.identity",
        "amounts.supply"
      ]
    });

    const ordersCount = await OrderRepo.createQueryBuilder("order")
      .select(["order.location_id", "COUNT(order.location_id) AS count"])
      .groupBy("order.location_id")
      .getRawMany();

    moment.locale("zh-tw");
    moment.tz.setDefault("Asia/Taipei");
    await ctx.render("index", {
      moment,
      orders,
      currentWaiting
    });
  }

  /**
   * privacy
   */
  public static async privacy(ctx: Context) {
    await ctx.render("privacy");
  }

  /**
   * personal
   */
  public static async personal(ctx: Context) {
    await ctx.render("personal");
  }

  /**
   * reset
   */
  public static async reset(ctx: Context) {
    const OrderRepo: Repository<Order> = getManager().getRepository(Order);
    const UserRepo: Repository<User> = getManager().getRepository(User);
    const AmountRepo: Repository<Amount> = getManager().getRepository(Amount);
    const LocationRepo: Repository<Location> = getManager().getRepository(
      Location
    );

    // reset location stocks
    let locations = await LocationRepo.find();
    locations = locations.map(location => {
      return Object.assign(location, { adultStock: 0, kidStock: 0 });
    });
    await LocationRepo.save(locations);

    // reset amounts
    let amounts = await AmountRepo.find();
    await AmountRepo.remove(amounts);

    // reset orders
    let orders = await OrderRepo.find();
    await OrderRepo.remove(orders);

    // reset orders
    let users = await UserRepo.find();
    await UserRepo.remove(users);

    ctx.status = 200;
    ctx.body = "reset";
  }
}
