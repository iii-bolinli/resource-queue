import {
  Entity,
  PrimaryGeneratedColumn,
  ManyToOne,
  Column,
  OneToMany,
  ManyToMany,
  JoinTable,
  CreateDateColumn,
  UpdateDateColumn
} from "typeorm";
import { Location } from "./Location";
import { User } from "./User";
import { Identity } from "./Identity";
import { Amount } from "./Amount";

@Entity()
export class Order {
  // @PrimaryGeneratedColumn("increment", { type: "bigint" })
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(
    type => Location,
    location => location.orders
  )
  location: Location;

  @ManyToOne(
    type => User,
    user => user.orders
  )
  user: User;

  @ManyToMany(
    type => Identity,
    identity => identity.orders
  )
  @JoinTable()
  identities: Identity[];

  @OneToMany(
    type => Amount,
    amount => amount.order
  )
  amounts: Amount[];

  @Column({ comment: "訂單序號 (YYMMDD + 流水號)" })
  serial: string;

  @Column({ default: false, comment: "到貨狀態" })
  delivered: boolean;

  @Column({
    type: "timestamptz",
    nullable: true,
    comment: "到貨時間"
  })
  deliveredAt: Date;

  @Column({ default: false, comment: "取貨狀態" })
  pickup: boolean;

  @Column({
    type: "timestamptz",
    nullable: true,
    comment: "取貨時間"
  })
  pickupAt: Date;

  @Column({ default: true, comment: "有效性" })
  active: boolean;

  @CreateDateColumn({ type: "timestamptz" })
  createdAt: Date;

  @UpdateDateColumn({ type: "timestamptz" })
  updatedAt: Date;
}
