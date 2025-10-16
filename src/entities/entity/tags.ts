import { Column, Entity, JoinColumn, ManyToOne } from "typeorm";
import { BaseEntity } from "./base-entity";
import { User } from "./user";

@Entity({ name: "tags", schema: "cip_schema"})
export class Tags extends BaseEntity {
    
    @ManyToOne(() => User)
    @JoinColumn({ name: "user_id" })
    user!: User;
    
    @Column({ type: "varchar", length: 200 })
    tag!: string;
}