import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, OneToMany, JoinColumn } from 'typeorm';
import { User } from '../user/user.entity';
import { Task } from '../task/task.entity';

export enum ContractType {
  SUPPLIER = 'supplier',
  SERVICE = 'service',
  EMPLOYEE = 'employee',
}

export enum ContractStatus {
  DRAFT = 'draft',
  ACTIVE = 'active',
  EXPIRING_SOON = 'expiring_soon',
  EXPIRED = 'expired',
  RENEWED = 'renewed',
  TERMINATED = 'terminated',
}

export enum RenewalFrequency {
  MONTHLY = 'monthly',
  QUARTERLY = 'quarterly',
  BIANNUAL = 'biannual',
  ANNUAL = 'annual',
  BIENNIAL = 'biennial',
  CUSTOM = 'custom',
}

@Entity('contracts')
export class Contract {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  title: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({
    type: 'enum',
    enum: ContractType,
  })
  type: ContractType;

  @Column({
    type: 'enum',
    enum: ContractStatus,
    default: ContractStatus.DRAFT,
  })
  status: ContractStatus;

  // Contract Parties
  @Column()
  counterpartyName: string;

  @Column({ nullable: true })
  counterpartyEmail: string;

  @Column({ nullable: true })
  counterpartyPhone: string;

  // Dates
  @Column({ type: 'date' })
  effectiveDate: Date;

  @Column({ type: 'date' })
  expiryDate: Date;

  @Column({ type: 'date', nullable: true })
  renewalDate: Date;

  // Renewal Settings
  @Column({ default: false })
  autoRenew: boolean;

  @Column({
    type: 'enum',
    enum: RenewalFrequency,
    nullable: true,
  })
  renewalFrequency: RenewalFrequency;

  @Column({ nullable: true })
  renewalNoticeDays: number;

  // Financial Information
  @Column({ type: 'decimal', precision: 15, scale: 2, nullable: true })
  contractValue: number;

  @Column({ nullable: true })
  currency: string;

  // Organization
  @Column({ nullable: true })
  department: string;

  @Column({ nullable: true })
  project: string;

  @Column({ nullable: true })
  costCenter: string;

  // Files
  @Column({ nullable: true })
  documentUrl: string;

  @Column({ nullable: true })
  documentType: string;

  // Metadata
  @Column({ type: 'jsonb', nullable: true })
  customFields: Record<string, any>;

  @Column({ type: 'jsonb', nullable: true })
  tags: string[];

  @Column({ type: 'text', nullable: true })
  notes: string;

  // Timestamps
  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // Relations
  @ManyToOne(() => User, user => user.ownedContracts)
  @JoinColumn({ name: 'ownerId' })
  owner: User;

  @Column()
  ownerId: string;

  @ManyToOne(() => User, user => user.stakeholderContracts, { nullable: true })
  @JoinColumn({ name: 'stakeholderId' })
  stakeholder: User;

  @Column({ nullable: true })
  stakeholderId: string;

  @OneToMany(() => Task, task => task.contract)
  tasks: Task[];
} 