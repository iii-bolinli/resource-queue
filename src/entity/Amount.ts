import { Entity, PrimaryGeneratedColumn, Column, ManyToOne } from "typeorm";
import { Order } from "./Order";
import { Identity } from "./Identity";
import { Supply } from "./Supply";

@Entity()
export class Amount {
  @PrimaryGeneratedColumn()
  id: number;

  @Column("decimal", { precision: 1, comment: "數量" })
  value: number;

  @ManyToOne(
    type => Order,
    order => order.amounts
  )
  order: Order;

  @ManyToOne(
    type => Identity,
    identity => identity.amounts
  )
  identity: Identity;

  @ManyToOne(
    type => Supply,
    supply => supply.amounts
  )
  supply: Supply;
}
