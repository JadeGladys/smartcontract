import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { User } from '../../user/user.entity';
import { ContractType, RenewalFrequency } from '../contract.entity';

export enum TemplateCategory {
  SUPPLIER = 'supplier',
  SERVICE = 'service',
  EMPLOYMENT = 'employment',
  PARTNERSHIP = 'partnership',
  LICENSE = 'license',
  NDA = 'nda',
  CUSTOM = 'custom',
}

@Entity('contract_templates')
export class ContractTemplate {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column({ type: 'text' })
  description: string;

  @Column({
    type: 'enum',
    enum: ContractType,
  })
  contractType: ContractType;

  @Column({
    type: 'enum',
    enum: TemplateCategory,
  })
  category: TemplateCategory;

  @Column({ type: 'text' })
  content: string; // Template content with placeholders

  @Column({ type: 'jsonb', nullable: true })
  defaultValues: Record<string, any>; // Default values for template fields

  @Column({ type: 'jsonb', nullable: true })
  requiredFields: string[]; // Required fields for this template

  @Column({ type: 'jsonb', nullable: true })
  optionalFields: string[]; // Optional fields for this template

  @Column({ default: true })
  isActive: boolean;

  @Column({ default: false })
  isPublic: boolean; // Whether template is available to all users

  @Column({ default: 0 })
  usageCount: number; // How many times this template has been used

  @Column({ type: 'jsonb', nullable: true })
  metadata: Record<string, any>;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // Relations
  @ManyToOne(() => User, user => user.id)
  @JoinColumn({ name: 'createdById' })
  createdBy: User;

  @Column()
  createdById: string;
} 