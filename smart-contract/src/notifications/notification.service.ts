import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThan, MoreThan } from 'typeorm';
import { Cron, CronExpression } from '@nestjs/schedule';
import { Notification, NotificationType, NotificationPriority, NotificationStatus } from './notification.entity';
import { AuditLog, AuditAction, AuditEntityType } from './audit.entity';
import { User, UserRole } from '../user/user.entity';
import { Contract } from '../contract/contract.entity';
import { Task } from '../task/task.entity';
import { ContractStatus } from '../contract/contract.entity';
import { TaskStatus } from '../task/task.entity';

@Injectable()
export class NotificationService {
  private readonly logger = new Logger(NotificationService.name);

  constructor(
    @InjectRepository(Notification)
    private notificationRepository: Repository<Notification>,
    @InjectRepository(AuditLog)
    private auditLogRepository: Repository<AuditLog>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(Contract)
    private contractRepository: Repository<Contract>,
    @InjectRepository(Task)
    private taskRepository: Repository<Task>,
  ) {}

  // Create notification
  async createNotification(data: {
    type: NotificationType;
    title: string;
    message: string;
    recipientId: string;
    senderId?: string;
    contractId?: string;
    taskId?: string;
    priority?: NotificationPriority;
    metadata?: Record<string, any>;
    scheduledFor?: Date;
  }): Promise<Notification> {
    const notification = this.notificationRepository.create({
      ...data,
      priority: data.priority || NotificationPriority.MEDIUM,
    });

    const savedNotification = await this.notificationRepository.save(notification);
    
    // Log audit
    await this.createAuditLog({
      action: AuditAction.CREATE,
      entityType: AuditEntityType.NOTIFICATION,
      entityId: savedNotification.id,
      userId: data.senderId || data.recipientId,
      description: `Notification created: ${data.type}`,
      metadata: { notificationId: savedNotification.id },
    });

    this.logger.log(`Notification created: ${data.type} for user ${data.recipientId}`);
    return savedNotification;
  }

  // Contract notifications
  async notifyContractExpiring(contract: Contract, daysUntilExpiry: number): Promise<void> {
    const recipients = await this.getContractStakeholders(contract);
    
    for (const recipient of recipients) {
      await this.createNotification({
        type: NotificationType.CONTRACT_EXPIRING,
        title: `Contract Expiring Soon: ${contract.title}`,
        message: `Contract "${contract.title}" expires in ${daysUntilExpiry} days on ${contract.expiryDate}. Please review and take necessary action.`,
        recipientId: recipient.id,
        contractId: contract.id,
        priority: daysUntilExpiry <= 7 ? NotificationPriority.HIGH : NotificationPriority.MEDIUM,
        metadata: { daysUntilExpiry, expiryDate: contract.expiryDate },
      });
    }
  }

  async notifyContractExpired(contract: Contract): Promise<void> {
    const recipients = await this.getContractStakeholders(contract);
    
    for (const recipient of recipients) {
      await this.createNotification({
        type: NotificationType.CONTRACT_EXPIRED,
        title: `Contract Expired: ${contract.title}`,
        message: `Contract "${contract.title}" has expired on ${contract.expiryDate}. Immediate action required.`,
        recipientId: recipient.id,
        contractId: contract.id,
        priority: NotificationPriority.URGENT,
        metadata: { expiryDate: contract.expiryDate },
      });
    }
  }

  async notifyContractApprovalRequired(contract: Contract): Promise<void> {
    const admins = await this.userRepository.find({
      where: { role: UserRole.ADMIN, isActive: true }
    });

    for (const admin of admins) {
      await this.createNotification({
        type: NotificationType.CONTRACT_APPROVAL_REQUIRED,
        title: `Contract Approval Required: ${contract.title}`,
        message: `Contract "${contract.title}" requires your approval. Please review and approve or reject.`,
        recipientId: admin.id,
        senderId: contract.ownerId,
        contractId: contract.id,
        priority: NotificationPriority.HIGH,
      });
    }
  }

  async notifyContractStatusChanged(contract: Contract, oldStatus: ContractStatus, newStatus: ContractStatus, changedBy: User): Promise<void> {
    const recipients = await this.getContractStakeholders(contract);
    
    for (const recipient of recipients) {
      if (recipient.id !== changedBy.id) {
        await this.createNotification({
          type: NotificationType.CONTRACT_STATUS_CHANGED,
          title: `Contract Status Updated: ${contract.title}`,
          message: `Contract "${contract.title}" status changed from ${oldStatus} to ${newStatus} by ${changedBy.firstName} ${changedBy.lastName}.`,
          recipientId: recipient.id,
          senderId: changedBy.id,
          contractId: contract.id,
          priority: NotificationPriority.MEDIUM,
          metadata: { oldStatus, newStatus },
        });
      }
    }
  }

  // Task notifications
  async notifyTaskAssigned(task: Task, assignedBy: User): Promise<void> {
    if (task.assignedTo) {
      await this.createNotification({
        type: NotificationType.TASK_ASSIGNED,
        title: `New Task Assigned: ${task.title}`,
        message: `You have been assigned a new task: "${task.title}" for contract "${task.contract.title}". Due date: ${task.dueDate}.`,
        recipientId: task.assignedTo.id,
        senderId: assignedBy.id,
        taskId: task.id,
        contractId: task.contractId,
        priority: task.priority === 'urgent' ? NotificationPriority.HIGH : NotificationPriority.MEDIUM,
        metadata: { dueDate: task.dueDate, priority: task.priority },
      });
    }
  }

  async notifyTaskDueSoon(task: Task, daysUntilDue: number): Promise<void> {
    if (task.assignedTo) {
      await this.createNotification({
        type: NotificationType.TASK_DUE_SOON,
        title: `Task Due Soon: ${task.title}`,
        message: `Task "${task.title}" is due in ${daysUntilDue} days on ${task.dueDate}. Please complete it on time.`,
        recipientId: task.assignedTo.id,
        taskId: task.id,
        contractId: task.contractId,
        priority: daysUntilDue <= 3 ? NotificationPriority.HIGH : NotificationPriority.MEDIUM,
        metadata: { daysUntilDue, dueDate: task.dueDate },
      });
    }
  }

  async notifyTaskOverdue(task: Task): Promise<void> {
    if (task.assignedTo) {
      await this.createNotification({
        type: NotificationType.TASK_OVERDUE,
        title: `Task Overdue: ${task.title}`,
        message: `Task "${task.title}" is overdue. It was due on ${task.dueDate}. Please complete it immediately.`,
        recipientId: task.assignedTo.id,
        taskId: task.id,
        contractId: task.contractId,
        priority: NotificationPriority.URGENT,
        metadata: { dueDate: task.dueDate },
      });
    }
  }

  async notifyTaskCompleted(task: Task, completedBy: User): Promise<void> {
    // Notify task creator
    if (task.createdBy && task.createdBy.id !== completedBy.id) {
      await this.createNotification({
        type: NotificationType.TASK_COMPLETED,
        title: `Task Completed: ${task.title}`,
        message: `Task "${task.title}" has been completed by ${completedBy.firstName} ${completedBy.lastName}.`,
        recipientId: task.createdBy.id,
        senderId: completedBy.id,
        taskId: task.id,
        contractId: task.contractId,
        priority: NotificationPriority.LOW,
      });
    }

    // Notify contract owner
    if (task.contract.owner && task.contract.owner.id !== completedBy.id) {
      await this.createNotification({
        type: NotificationType.TASK_COMPLETED,
        title: `Task Completed: ${task.title}`,
        message: `Task "${task.title}" for contract "${task.contract.title}" has been completed by ${completedBy.firstName} ${completedBy.lastName}.`,
        recipientId: task.contract.owner.id,
        senderId: completedBy.id,
        taskId: task.id,
        contractId: task.contractId,
        priority: NotificationPriority.LOW,
      });
    }
  }

  // Get notifications for user
  async getUserNotifications(userId: string, status?: NotificationStatus, limit = 50): Promise<Notification[]> {
    const query = this.notificationRepository.createQueryBuilder('notification')
      .leftJoinAndSelect('notification.sender', 'sender')
      .leftJoinAndSelect('notification.contract', 'contract')
      .leftJoinAndSelect('notification.task', 'task')
      .where('notification.recipientId = :userId', { userId })
      .orderBy('notification.createdAt', 'DESC')
      .limit(limit);

    if (status) {
      query.andWhere('notification.status = :status', { status });
    }

    return query.getMany();
  }

  // Mark notification as read
  async markAsRead(notificationId: string, userId: string): Promise<Notification> {
    const notification = await this.notificationRepository.findOne({
      where: { id: notificationId, recipientId: userId }
    });

    if (!notification) {
      throw new Error('Notification not found');
    }

    notification.status = NotificationStatus.READ;
    notification.readAt = new Date();

    return this.notificationRepository.save(notification);
  }

  // Mark all notifications as read
  async markAllAsRead(userId: string): Promise<void> {
    await this.notificationRepository.update(
      { recipientId: userId, status: NotificationStatus.UNREAD },
      { status: NotificationStatus.READ, readAt: new Date() }
    );
  }

  // Get unread count
  async getUnreadCount(userId: string): Promise<number> {
    return this.notificationRepository.count({
      where: { recipientId: userId, status: NotificationStatus.UNREAD }
    });
  }

  // Scheduled jobs for checking expirations and due dates
  @Cron(CronExpression.EVERY_DAY_AT_9AM)
  async checkContractExpirations(): Promise<void> {
    this.logger.log('Checking contract expirations...');
    
    const today = new Date();
    const contracts = await this.contractRepository.find({
      where: { status: ContractStatus.ACTIVE },
      relations: ['owner', 'stakeholder']
    });

    for (const contract of contracts) {
      if (contract.expiryDate) {
        const daysUntilExpiry = Math.ceil((contract.expiryDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
        
        if (daysUntilExpiry === 30 || daysUntilExpiry === 7 || daysUntilExpiry === 1) {
          await this.notifyContractExpiring(contract, daysUntilExpiry);
        }
        
        if (daysUntilExpiry < 0) {
          await this.notifyContractExpired(contract);
        }
      }
    }
  }

  @Cron(CronExpression.EVERY_DAY_AT_9AM)
  async checkTaskDueDates(): Promise<void> {
    this.logger.log('Checking task due dates...');
    
    const today = new Date();
    const tasks = await this.taskRepository.find({
      where: { status: TaskStatus.PENDING },
      relations: ['assignedTo', 'contract', 'createdBy']
    });

    for (const task of tasks) {
      if (task.dueDate) {
        const daysUntilDue = Math.ceil((task.dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
        
        if (daysUntilDue === 7 || daysUntilDue === 3 || daysUntilDue === 1) {
          await this.notifyTaskDueSoon(task, daysUntilDue);
        }
        
        if (daysUntilDue < 0) {
          await this.notifyTaskOverdue(task);
        }
      }
    }
  }

  // Helper methods
  private async getContractStakeholders(contract: Contract): Promise<User[]> {
    const stakeholders: User[] = [];
    
    if (contract.owner) {
      stakeholders.push(contract.owner);
    }
    
    if (contract.stakeholder) {
      stakeholders.push(contract.stakeholder);
    }

    return stakeholders;
  }

  private async createAuditLog(data: {
    action: AuditAction;
    entityType: AuditEntityType;
    entityId: string;
    userId: string;
    description: string;
    oldValues?: Record<string, any>;
    newValues?: Record<string, any>;
    metadata?: Record<string, any>;
  }): Promise<AuditLog> {
    const auditLog = this.auditLogRepository.create(data);
    return this.auditLogRepository.save(auditLog);
  }
} 