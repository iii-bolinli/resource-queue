import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  OneToMany,
  CreateDateColumn,
  UpdateDateColumn
} from "typeorm";
import { Order } from "./Order";
import { Amount } from "./Amount";

@Entity()
export class Supply {
  @PrimaryGeneratedColumn()
  id: number;

  @OneToMany(
    type => Amount,
    amount => amount.supply
  )
  amounts: Amount[];

  @Column({ comment: "類型" })
  category: string;

  @CreateDateColumn({ type: "timestamptz" })
  createdAt: Date;

  @UpdateDateColumn({ type: "timestamptz" })
  updatedAt: Date;
}
