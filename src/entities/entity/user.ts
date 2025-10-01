import { Column, Entity, JoinColumn, ManyToOne, OneToMany } from "typeorm";
import { BaseEntity } from "./base-entity";
import { Designation } from "./designation";

@Entity({ name: "users", schema: "cip_schema" })
export class User extends BaseEntity {
  @Column({ type: "varchar", length: 100 })
  fullname!: string;

  @Column({ type: "varchar", length: 50 })
  first_name!: string;

  @Column({ type: "varchar", length: 50 })
  middle_name!: string;

  @Column({ type: "varchar", length: 50 })
  last_name!: string;

  @Column({ type: "float", nullable: true })
  experience!: number | null;

  @Column({ type: "varchar", unique: true, length: 100 })
  email!: string;

  @Column({ type: "varchar", length: 255 })
  password!: string;

  @Column({ type: "boolean", default: true })
  is_active!: boolean;

  @ManyToOne(() => User)
  @JoinColumn({ name: "reporting_person_id" })
  reporting_person!: User;

  @ManyToOne(() => Designation)
  @JoinColumn({ name: "designation_id" })
  designation!: Designation;

  @Column({ type: "boolean", default: false })
  is_reset_token_used!: boolean;

  @Column({ type: "varchar", length: 255, nullable: true })
  password_set_token!: string | null;

  @Column({ type: "timestamptz", nullable: true })
  password_set_expires_at!: Date | null;

  @Column({ type: "varchar", length: 10, nullable: true })
  otp!: string | null;

  @Column({ type: "timestamptz", nullable: true })
  otp_expiration_time!: Date | null;
}
