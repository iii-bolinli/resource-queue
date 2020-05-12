import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToMany,
  CreateDateColumn,
  UpdateDateColumn
} from "typeorm";

import { Order } from "./Order";

@Entity()
export class User {
  @PrimaryGeneratedColumn()
  id: number;

  @OneToMany(
    type => Order,
    order => order.user
  )
  orders: Order[];

  @Column({ comment: "電話" })
  phone: string;

  @Column({ nullable: true, comment: "驗證碼" })
  code: string;

  @Column({ default: false, comment: "驗證狀態" })
  verified: boolean;

  @CreateDateColumn({ type: "timestamptz" })
  createdAt: Date;

  @UpdateDateColumn({ type: "timestamptz" })
  updatedAt: Date;
}
