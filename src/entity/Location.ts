import {
  Entity,
  Unique,
  PrimaryGeneratedColumn,
  OneToMany,
  OneToOne,
  Column,
  JoinColumn
} from "typeorm";
import { Order } from "./Order";
import { Shop } from "./Shop";

@Entity()
@Unique(["serial"])
export class Location {
  @PrimaryGeneratedColumn()
  id: number;

  @OneToOne(type => Shop)
  @JoinColumn()
  shop: Shop;

  @OneToMany(
    type => Order,
    order => order.location
  )
  orders: Order[];

  @Column({ name: "serial", comment: "店號" })
  serial: string;

  @Column({ nullable: true, comment: "員工編號" })
  staffCode: string;

  @Column({ comment: "名稱" })
  name: string;

  @Column({ nullable: true, comment: "類別" })
  category: string;

  @Column({ nullable: true, comment: "縣市" })
  city: string;

  @Column({ nullable: true, comment: "區" })
  district: string;

  @Column({ comment: "地址" })
  address: string;

  @Column({ default: 0, comment: "成人庫存" })
  adultStock: number;

  @Column({ default: 0, comment: "兒童庫存" })
  kidStock: number;
}
