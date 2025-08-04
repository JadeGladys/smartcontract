import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { User } from '../user/user.entity';
import { Contract } from '../contract/contract.entity';
import { Task } from '../task/task.entity';

export enum NotificationType {
  // Contract notifications
  CONTRACT_EXPIRING = 'contract_expiring',
  CONTRACT_EXPIRED = 'contract_expired',
  CONTRACT_APPROVAL_REQUIRED = 'contract_approval_required',
  CONTRACT_APPROVED = 'contract_approved',
  CONTRACT_REJECTED = 'contract_rejected',
  CONTRACT_RENEWAL_DUE = 'contract_renewal_due',
  CONTRACT_STATUS_CHANGED = 'contract_status_changed',
  
  // Task notifications
  TASK_ASSIGNED = 'task_assigned',
  TASK_DUE_SOON = 'task_due_soon',
  TASK_OVERDUE = 'task_overdue',
  TASK_COMPLETED = 'task_completed',
  TASK_STATUS_CHANGED = 'task_status_changed',
  
  // General notifications
  SYSTEM_ALERT = 'system_alert',
  USER_MENTIONED = 'user_mentioned',
}

export enum NotificationPriority {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  URGENT = 'urgent',
}

export enum NotificationStatus {
  UNREAD = 'unread',
  READ = 'read',
  ARCHIVED = 'archived',
}

@Entity('notifications')
export class Notification {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({
    type: 'enum',
    enum: NotificationType,
  })
  type: NotificationType;

  @Column()
  title: string;

  @Column({ type: 'text' })
  message: string;

  @Column({
    type: 'enum',
    enum: NotificationPriority,
    default: NotificationPriority.MEDIUM,
  })
  priority: NotificationPriority;

  @Column({
    type: 'enum',
    enum: NotificationStatus,
    default: NotificationStatus.UNREAD,
  })
  status: NotificationStatus;

  @Column({ type: 'jsonb', nullable: true })
  metadata: Record<string, any>;

  @Column({ type: 'timestamp', nullable: true })
  readAt: Date;

  @Column({ type: 'timestamp', nullable: true })
  scheduledFor: Date;

  @Column({ default: false })
  emailSent: boolean;

  @Column({ type: 'timestamp', nullable: true })
  emailSentAt: Date;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // Relations
  @ManyToOne(() => User, user => user.id)
  @JoinColumn({ name: 'recipientId' })
  recipient: User;

  @Column()
  recipientId: string;

  @ManyToOne(() => User, user => user.id, { nullable: true })
  @JoinColumn({ name: 'senderId' })
  sender: User;

  @Column({ nullable: true })
  senderId: string;

  @ManyToOne(() => Contract, contract => contract.id, { nullable: true })
  @JoinColumn({ name: 'contractId' })
  contract: Contract;

  @Column({ nullable: true })
  contractId: string;

  @ManyToOne(() => Task, task => task.id, { nullable: true })
  @JoinColumn({ name: 'taskId' })
  task: Task;

  @Column({ nullable: true })
  taskId: string;
} 