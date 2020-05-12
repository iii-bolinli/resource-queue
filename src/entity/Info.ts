import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn
} from "typeorm";

@Entity()
export class Info {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ comment: "標題" })
  title: string;

  @Column({ comment: "副標題" })
  subTitle: string;

  @Column({ comment: "內容" })
  text: string;

  @Column({ default: false, comment: "顯示中" })
  active: boolean;

  @CreateDateColumn({ type: "timestamptz" })
  createdAt: Date;

  @UpdateDateColumn({ type: "timestamptz" })
  updatedAt: Date;
}
