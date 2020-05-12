import { Entity, PrimaryGeneratedColumn, Column } from "typeorm";

@Entity()
export class Shop {
  @PrimaryGeneratedColumn()
  id: number;
}
