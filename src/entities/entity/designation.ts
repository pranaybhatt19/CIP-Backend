import { Column, Entity } from "typeorm";
import { BaseEntity } from "./base-entity";

@Entity({ name: "designations", schema: "cip_schema" })
export class Designation extends BaseEntity {
  @Column({ type: "varchar", length: 100 })
  name!: string;
}
