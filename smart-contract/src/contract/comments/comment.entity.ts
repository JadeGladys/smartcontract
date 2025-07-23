import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { Contract } from '../contract.entity';
import { User } from '../../user/user.entity';

@Entity()
export class Comment {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('text')
  content: string;

  @ManyToOne(() => Contract, contract => contract.comments, { onDelete: 'CASCADE' })
  contract: Contract;

  @ManyToOne(() => User, user => user.comments, { onDelete: 'SET NULL', nullable: true })
  author: User;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
} 