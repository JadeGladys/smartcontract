import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, OneToMany } from 'typeorm';
import { Contract } from '../contract/contract.entity';
import { Task } from '../task/task.entity';

export enum UserRole {
  ADMIN = 'admin',
  LEGAL = 'legal',
  HR = 'hr',
  FINANCE = 'finance',
  MANAGER = 'manager',
  VIEWER = 'viewer',
}

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  email: string;

  @Column()
  password: string;

  @Column()
  firstName: string;

  @Column()
  lastName: string;

  @Column({
    type: 'enum',
    enum: UserRole,
    default: UserRole.VIEWER,
  })
  role: UserRole;

  @Column({ nullable: true })
  department: string;

  @Column({ default: true })
  isActive: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // Relations
  @OneToMany(() => Contract, contract => contract.owner)
  ownedContracts: Contract[];

  @OneToMany(() => Contract, contract => contract.stakeholder)
  stakeholderContracts: Contract[];

  @OneToMany(() => Task, task => task.assignedTo)
  tasks: Task[];
} 