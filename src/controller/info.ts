import { Context } from "koa";
import { getManager, Repository } from "typeorm";
import { Info } from "../entity/Info";

export default class InfoController {
  /**
   * create
   */
  public static async create(ctx: Context) {
    const data = ctx.request.body;
    const InfoRepo: Repository<Info> = getManager().getRepository(Info);

    const newInfo = InfoRepo.create({
      title: data["title"],
      subTitle: data["subTitle"],
      text: data["text"]
    });
    const response = await InfoRepo.save(newInfo);

    ctx.status = 201;
    ctx.body = response;
  }

  /**
   * show
   */
  public static async show(ctx: Context) {
    const infoId = ctx.params.id;
    const InfoRepo: Repository<Info> = getManager().getRepository(Info);
    const info = await InfoRepo.findOne(infoId);
    if (info == undefined) {
      ctx.throw(404, "查無資訊");
    }
    ctx.status = 200;
    ctx.body = info;
  }

  /**
   * all
   */
  public static async all(ctx: Context) {
    const InfoRepo: Repository<Info> = getManager().getRepository(Info);

    ctx.status = 200;
    ctx.body = await InfoRepo.find();
  }

  /**
   * update
   */
  public static async update(ctx: Context) {
    const data = ctx.request.body;
    const infoId = ctx.params.id;
    const InfoRepo: Repository<Info> = getManager().getRepository(Info);

    await InfoRepo.update(infoId, data);
    const info = await InfoRepo.findOne(infoId);
    if (info == undefined) {
      ctx.throw(404, "查無資訊");
    }

    ctx.status = 200;
    ctx.body = info;
  }

  /**
   * delete
   */
  public static async delete(ctx: Context) {
    const infoId = ctx.params.id;
    const InfoRepo: Repository<Info> = getManager().getRepository(Info);

    const info = await InfoRepo.findOne(infoId);
    if (info !== undefined) {
      await InfoRepo.remove(info);
      ctx.status = 200;
      ctx.body = { message: "info deleted" };
    } else {
      ctx.throw(404, "查無資訊");
    }
  }
}
