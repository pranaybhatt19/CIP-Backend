import { Column, Entity, JoinColumn, ManyToOne } from "typeorm";
import { BaseEntity } from "./base-entity";
import { User } from "./user";

@Entity({ name: "communications", schema: "cip_schema" })
export class Communications extends BaseEntity {
    @ManyToOne(() => User)
    @JoinColumn({ name: "user_id" })
    user!: User;

    @Column({ type: "timestamp" })
    date!: Date;

    @Column({ type: "varchar", length: 500, nullable: true, default: null })
    link!: string;

    @Column({ type: "varchar", length: 1000, nullable: true, default: null })
    feedback?: string;
}