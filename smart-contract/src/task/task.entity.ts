import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { User } from '../user/user.entity';
import { Contract } from '../contract/contract.entity';

export enum TaskType {
  APPROVAL = 'approval',
  SIGNATURE = 'signature',
  REVIEW = 'review',
  NEGOTIATION = 'negotiation',
  RENEWAL = 'renewal',
  TERMINATION = 'termination',
  CUSTOM = 'custom',
}

export enum TaskStatus {
  PENDING = 'pending',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  OVERDUE = 'overdue',
  CANCELLED = 'cancelled',
}

export enum TaskPriority {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  URGENT = 'urgent',
}

@Entity('contract_tasks')
export class ContractTask {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  title: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({
    type: 'enum',
    enum: TaskType,
  })
  type: TaskType;

  @Column({
    type: 'enum',
    enum: TaskStatus,
    default: TaskStatus.PENDING,
  })
  status: TaskStatus;

  @Column({
    type: 'enum',
    enum: TaskPriority,
    default: TaskPriority.MEDIUM,
  })
  priority: TaskPriority;

  @Column({ type: 'date' })
  dueDate: Date;

  @Column({ type: 'date', nullable: true })
  completedDate: Date;

  @Column({ type: 'jsonb', nullable: true })
  metadata: Record<string, any>;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // Relations
  @ManyToOne(() => Contract, contract => contract.id)
  @JoinColumn({ name: 'contractId' })
  contract: Contract;

  @Column()
  contractId: string;

  @ManyToOne(() => User, user => user.id)
  @JoinColumn({ name: 'assignedToId' })
  assignedTo: User;

  @Column()
  assignedToId: string;

  @ManyToOne(() => User, user => user.id)
  @JoinColumn({ name: 'createdById' })
  createdBy: User;

  @Column()
  createdById: string;
} 