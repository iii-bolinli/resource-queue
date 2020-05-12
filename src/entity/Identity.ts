import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToMany,
  OneToMany,
  CreateDateColumn,
  UpdateDateColumn
} from "typeorm";
import { Order } from "./Order";
import { Amount } from "./Amount";

@Entity()
export class Identity {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToMany(
    type => Order,
    order => order.identities
  )
  orders: Order[];

  @OneToMany(
    type => Amount,
    amount => amount.identity
  )
  amounts: Amount[];

  @Column({ comment: "身份證號" })
  serial: string;

  @Column({
    type: "timestamptz",
    nullable: true,
    comment: "上次取貨時間"
  })
  lastPickupAt: Date;

  @CreateDateColumn({ type: "timestamptz" })
  createdAt: Date;

  @UpdateDateColumn({ type: "timestamptz" })
  updatedAt: Date;
}
