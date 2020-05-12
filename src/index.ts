import Koa from "koa";
import koaBody from "koa-body";
import helmet from "koa-helmet";
import serve from "koa-static";
import bodyClean from "koa-body-clean";
import koaValidator from "koa-async-validator";
import views from "koa-views";
import winston from "winston";

import "reflect-metadata";
import { createConnection } from "typeorm";

import { logger } from "./configs/logging";
import { config } from "./configs/config";
import { unprotectedRouter } from "./configs/unprotectedRoutes";

createConnection()
  .then(async connection => {
    const app = new Koa();
    app.use(helmet());

    app.use(logger(winston));

    app.use(serve("src/uploads"));

    // Enable koaBody with default options
    app.use(
      koaBody({
        multipart: true,
        formLimit: 15,
        formidable: {
          uploadDir: __dirname + "/uploads"
        }
      })
    );

    app.use(
      koaValidator({
        errorFormatter: (param, msg, value) => {
          const namespace = param.split(".");
          const root = namespace.shift();
          let formParam = root;

          while (namespace.length) {
            formParam = `${formParam}[${namespace.shift}]`;
          }

          return {
            param: formParam,
            msg: msg,
            value: value
          };
        }
      })
    );

    app.use(bodyClean());

    app.use(async (ctx, next) => {
      try {
        await next();
      } catch (err) {
        ctx.status = err.statusCode || err.status || 500;
        ctx.body = {
          message: err.message
        };
      }
    });

    app.use(
      views(__dirname + "/views", {
        extension: "ejs"
      })
    );

    app.use(unprotectedRouter.routes()).use(unprotectedRouter.allowedMethods());

    app.listen(config.port);

    console.log(`Server running on port ${config.port}`);
  })
  .catch(error => console.log("TypeORM connection error: ", error));
