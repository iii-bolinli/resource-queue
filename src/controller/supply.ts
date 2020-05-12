import { Context } from "koa";
import { getManager, Repository } from "typeorm";
import { Supply } from "../entity/Supply";

export default class SupplyController {
  /**
   * create
   */
  public static async init(ctx: Context) {
    const SupplyRepo: Repository<Supply> = getManager().getRepository(Supply);
    const adult = SupplyRepo.create({
      category: "adult"
    });
    const kid = SupplyRepo.create({
      category: "kid"
    });
    const baby = SupplyRepo.create({
      category: "baby"
    });
    SupplyRepo.save([adult, kid, baby]);

    ctx.status = 201;
    ctx.body = { message: "init completed." };
  }

  /**
   * all
   */
  public static async all(ctx: Context) {
    const SupplyRepo: Repository<Supply> = getManager().getRepository(Supply);
    const supplies = await SupplyRepo.find();

    ctx.status = 200;
    ctx.body = supplies;
  }

  /**
   * show
   */
  public static async show(ctx: Context) {
    const data = ctx.request.body;

    ctx.status = 200;
    ctx.body = { code: "" };
  }

  /**
   * update
   */
  public static async update(ctx: Context) {
    const data = ctx.request.body;

    ctx.status = 200;
    ctx.body = { code: "" };
  }

  /**
   * delete
   */
  public static async delete(ctx: Context) {
    const data = ctx.request.body;

    ctx.status = 200;
    ctx.body = { code: "" };
  }
}
