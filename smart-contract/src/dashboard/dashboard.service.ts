import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import { Contract, ContractStatus, ContractType } from '../contract/contract.entity';
import { Task, TaskStatus } from '../task/task.entity';
import { Notification, NotificationStatus } from '../notifications/notification.entity';
import { User } from '../user/user.entity';

@Injectable()
export class DashboardService {
  constructor(
    @InjectRepository(Contract)
    private contractRepository: Repository<Contract>,
    @InjectRepository(Task)
    private taskRepository: Repository<Task>,
    @InjectRepository(Notification)
    private notificationRepository: Repository<Notification>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
  ) {}

  async getDashboardStats(userId: string, userRole: string) {
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    // Base query conditions based on user role
    const baseConditions = this.getBaseConditions(userId, userRole);

    // Contract statistics
    const contractStats = await this.getContractStats(baseConditions);
    
    // Task statistics
    const taskStats = await this.getTaskStats(baseConditions);
    
    // Notification statistics
    const notificationStats = await this.getNotificationStats(userId);
    
    // Recent activity
    const recentActivity = await this.getRecentActivity(baseConditions);
    
    // Expiring contracts
    const expiringContracts = await this.getExpiringContracts(baseConditions);
    
    // Overdue tasks
    const overdueTasks = await this.getOverdueTasks(baseConditions);

    return {
      contractStats,
      taskStats,
      notificationStats,
      recentActivity,
      expiringContracts,
      overdueTasks,
    };
  }

  private getBaseConditions(userId: string, userRole: string) {
    // Admin, Legal, HR, Finance can see all contracts
    if (['admin', 'legal', 'hr', 'finance'].includes(userRole)) {
      return {};
    }
    
    // Other users can only see their own contracts
    return { ownerId: userId };
  }

  private async getContractStats(baseConditions: any) {
    const [
      totalContracts,
      activeContracts,
      draftContracts,
      expiredContracts,
      contractsThisMonth,
    ] = await Promise.all([
      this.contractRepository.count({ where: baseConditions }),
      this.contractRepository.count({ where: { ...baseConditions, status: ContractStatus.ACTIVE } }),
      this.contractRepository.count({ where: { ...baseConditions, status: ContractStatus.DRAFT } }),
      this.contractRepository.count({ where: { ...baseConditions, status: ContractStatus.TERMINATED } }),
      this.contractRepository.count({
        where: {
          ...baseConditions,
          createdAt: Between(new Date(new Date().getFullYear(), new Date().getMonth(), 1), new Date()),
        },
      }),
    ]);

    // Contract type distribution
    const typeDistribution = await this.contractRepository
      .createQueryBuilder('contract')
      .select('contract.type', 'type')
      .addSelect('COUNT(*)', 'count')
      .where(baseConditions)
      .groupBy('contract.type')
      .getRawMany();

    return {
      total: totalContracts,
      active: activeContracts,
      draft: draftContracts,
      expired: expiredContracts,
      thisMonth: contractsThisMonth,
      typeDistribution,
    };
  }

  private async getTaskStats(baseConditions: any) {
    const [
      totalTasks,
      pendingTasks,
      completedTasks,
      overdueTasks,
      tasksThisMonth,
    ] = await Promise.all([
      this.taskRepository.count({ where: { contract: baseConditions } }),
      this.taskRepository.count({ where: { contract: baseConditions, status: TaskStatus.PENDING } }),
      this.taskRepository.count({ where: { contract: baseConditions, status: TaskStatus.COMPLETED } }),
      this.taskRepository.count({ 
        where: { 
          contract: baseConditions, 
          status: TaskStatus.PENDING,
          dueDate: Between(new Date(0), new Date()),
        } 
      }),
      this.taskRepository.count({
        where: {
          contract: baseConditions,
          createdAt: Between(new Date(new Date().getFullYear(), new Date().getMonth(), 1), new Date()),
        },
      }),
    ]);

    return {
      total: totalTasks,
      pending: pendingTasks,
      completed: completedTasks,
      overdue: overdueTasks,
      thisMonth: tasksThisMonth,
    };
  }

  private async getNotificationStats(userId: string) {
    const [
      totalNotifications,
      unreadNotifications,
      notificationsThisWeek,
    ] = await Promise.all([
      this.notificationRepository.count({ where: { recipientId: userId } }),
      this.notificationRepository.count({ where: { recipientId: userId, status: NotificationStatus.UNREAD } }),
      this.notificationRepository.count({
        where: {
          recipientId: userId,
          createdAt: Between(new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), new Date()),
        },
      }),
    ]);

    return {
      total: totalNotifications,
      unread: unreadNotifications,
      thisWeek: notificationsThisWeek,
    };
  }

  private async getRecentActivity(baseConditions: any) {
    // Recent contracts
    const recentContracts = await this.contractRepository.find({
      where: baseConditions,
      order: { updatedAt: 'DESC' },
      take: 5,
      relations: ['owner'],
    });

    // Recent tasks
    const recentTasks = await this.taskRepository.find({
      where: { contract: baseConditions },
      order: { updatedAt: 'DESC' },
      take: 5,
      relations: ['assignedTo', 'contract'],
    });

    return {
      contracts: recentContracts,
      tasks: recentTasks,
    };
  }

  private async getExpiringContracts(baseConditions: any) {
    const thirtyDaysFromNow = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
    
    return this.contractRepository.find({
      where: {
        ...baseConditions,
        status: ContractStatus.ACTIVE,
        expiryDate: Between(new Date(), thirtyDaysFromNow),
      },
      order: { expiryDate: 'ASC' },
      take: 10,
      relations: ['owner'],
    });
  }

  private async getOverdueTasks(baseConditions: any) {
    return this.taskRepository.find({
      where: {
        contract: baseConditions,
        status: TaskStatus.PENDING,
        dueDate: Between(new Date(0), new Date()),
      },
      order: { dueDate: 'ASC' },
      take: 10,
      relations: ['assignedTo', 'contract'],
    });
  }

  async getContractValueAnalytics(baseConditions: any) {
    const contracts = await this.contractRepository.find({
      where: { ...baseConditions, status: ContractStatus.ACTIVE },
      select: ['contractValue', 'currency', 'type', 'createdAt'],
    });

    const totalValue = contracts.reduce((sum, contract) => {
      const value = parseFloat(String(contract.contractValue || '0'));
      return sum + value;
    }, 0);

    const valueByType = contracts.reduce((acc, contract) => {
      const type = contract.type;
      const value = parseFloat(String(contract.contractValue || '0'));
      acc[type] = (acc[type] || 0) + value;
      return acc;
    }, {} as Record<string, number>);

    return {
      totalValue,
      valueByType,
      contractCount: contracts.length,
    };
  }
} 