import { Exclude } from 'class-transformer';
import {
    Column,
    CreateDateColumn,
    Entity,
    Generated,
    PrimaryGeneratedColumn,
    UpdateDateColumn,
} from 'typeorm';
import { Roles } from 'src/common/enums';

@Entity('users')
export class User {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ type: 'uuid', unique: true })
    @Generated('uuid')
    uuid: string;

    @Column({ unique: true })
    email: string;

    @Column({ name: 'password_hash', select: false })
    @Exclude()
    passwordHash: string;

    @Column()
    name: string;

    @Column({ type: 'enum', enum: Roles })
    role: Roles;

    @CreateDateColumn({ name: 'created_at' })
    createdAt: Date;

    @UpdateDateColumn({ name: 'updated_at' })
    updatedAt: Date;
}
