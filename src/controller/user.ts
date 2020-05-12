import { Context } from "koa";
import { getManager, Repository } from "typeorm";
import { User } from "../entity/User";

export default class UserController {
  /**
   * create
   */
  public static async create(ctx: Context) {
    const data = ctx.request.body;
    const UserRepo: Repository<User> = getManager().getRepository(User);

    ctx.check("phone", "not valid phone number format").isMobilePhone("zh-TW");
    const errors = await ctx.validationErrors();

    if (errors) {
      ctx.body = errors;
      ctx.status = 400;
    } else {
      let user: User = await UserRepo.findOne({
        where: { phone: data["phone"] },
      });

      let unverified = true;

      if (user !== undefined) {
        // 使用者已存在
        if (user.verified) {
          // 已驗證
          unverified = false;
        }
      } else {
        // 建立新使用者
        user = await UserRepo.create({
          phone: data["phone"],
        });
      }
      if (user.phone === "0913388899") {
        if (user.code === undefined) {
          user.code = String(Math.floor(100000 + Math.random() * 900000));
        }
      } else {
        user.code = String(Math.floor(100000 + Math.random() * 900000));
      }

      await UserRepo.save(user);

      const notifyMsg = `您的物資預約APP驗證碼 ${user.code} 請在APP中輸入驗證碼`;

      // 實作通知方法

      ctx.status = 200;
      ctx.body = { code: user.code };
    }
  }

  /**
   * show
   */
  public static async show(ctx: Context) {
    const UserRepo: Repository<User> = getManager().getRepository(User);
    const user = await UserRepo.findOne({
      where: { phone: ctx.params.phone },
    });

    if (user !== undefined) {
      ctx.status = 200;
      ctx.body = {
        phone: user.phone,
        verified: user.verified,
      };
    } else {
      ctx.status = 404;
      ctx.body = { message: "電話號碼有誤" };
    }
  }

  /**
   * verify
   */
  public static async verify(ctx: Context) {
    const data = ctx.request.body;
    const UserRepo: Repository<User> = getManager().getRepository(User);
    const user = await UserRepo.findOne({
      where: { phone: data["phone"] },
    });

    if (user !== undefined) {
      if (user.code === data["code"]) {
        // 驗證碼符合，更新驗證狀態
        ctx.status = 200;
        user.verified = true;
        await UserRepo.save(user);
        ctx.body = { success: true };
      } else {
        ctx.status = 400;
        ctx.body = { success: false };
      }
    } else {
      ctx.status = 404;
      ctx.body = { message: "電話號碼格式錯誤" };
    }
  }
}
