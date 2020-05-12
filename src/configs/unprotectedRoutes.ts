import Router from "koa-router";
import * as controller from "../controller";

const unprotectedRouter = new Router();

unprotectedRouter.get("/console", controller.console.index);
unprotectedRouter.get("/privacy", controller.console.privacy);
unprotectedRouter.get("/personal", controller.console.personal);

// 手機
unprotectedRouter.get("/phone/:phone", controller.user.show);
unprotectedRouter.post("/phone", controller.user.create);
unprotectedRouter.post("/verify", controller.user.verify);

// 訂單
unprotectedRouter.get("/db", controller.order.db);
unprotectedRouter.post("/order", controller.order.create);
unprotectedRouter.get("/check", controller.order.identityCheck);
unprotectedRouter.get("/order", controller.order.show);
unprotectedRouter.delete("/order", controller.order.cancel);
unprotectedRouter.patch("/order/notify/:location", controller.order.notify);
unprotectedRouter.patch("/order/pickup", controller.order.pickup);

// 取貨點
unprotectedRouter.post("/location", controller.location.create);
unprotectedRouter.post("/location/import", controller.location.import);
unprotectedRouter.post("/location/login", controller.location.login);

unprotectedRouter.get("/locations/categories", controller.location.categories);
unprotectedRouter.get("/locations/cities", controller.location.cities);
unprotectedRouter.get("/locations/districts", controller.location.districts);
unprotectedRouter.get("/locations", controller.location.all);
unprotectedRouter.get("/location/:id/orders", controller.location.orders);
unprotectedRouter.get("/location/:id/notify", controller.location.notify);

unprotectedRouter.patch("/location/:id", controller.location.update);
unprotectedRouter.patch("/location/:id/restock", controller.location.restock);
unprotectedRouter.delete("/location/:id", controller.location.delete);

// 物資
unprotectedRouter.post("/supply", controller.supply.init);
unprotectedRouter.get("/supplies", controller.supply.all);

// 資訊
unprotectedRouter.post("/info", controller.info.create);
unprotectedRouter.get("/info/:id", controller.info.show);
unprotectedRouter.get("/infos", controller.info.all);
unprotectedRouter.patch("/info/:id", controller.info.update);
unprotectedRouter.delete("/info/:id", controller.info.delete);

// reset
unprotectedRouter.delete("/reset", controller.console.reset);

export { unprotectedRouter };
