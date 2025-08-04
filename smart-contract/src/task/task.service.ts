import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Task, TaskStatus, TaskPriority } from './task.entity';
import { Contract } from '../contract/contract.entity';
import { User, UserRole } from '../user/user.entity';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';
import { NotificationService } from '../notifications/notification.service';

@Injectable()
export class TaskService {
  constructor(
    @InjectRepository(Task)
    private taskRepository: Repository<Task>,
    @InjectRepository(Contract)
    private contractRepository: Repository<Contract>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
    private notificationService: NotificationService,
  ) {}

  async create(contractId: string, dto: CreateTaskDto, creator: User): Promise<Task> {
    const contract = await this.contractRepository.findOne({ where: { id: contractId } });
    if (!contract) throw new NotFoundException('Contract not found');

    let assignedTo: User | null = null;
    if (dto.assignedTo) {
      assignedTo = await this.userRepository.findOne({ where: { id: dto.assignedTo } });
      if (!assignedTo) throw new BadRequestException('Assigned user not found');
      // Example: Only legal can be assigned legal review
      if (dto.title.toLowerCase().includes('legal') && assignedTo.role !== UserRole.LEGAL) {
        throw new ForbiddenException('Only legal can be assigned legal review tasks');
      }
      if (dto.title.toLowerCase().includes('finance') && assignedTo.role !== UserRole.FINANCE) {
        throw new ForbiddenException('Only finance can be assigned finance review tasks');
      }
      if (dto.title.toLowerCase().includes('hr') && assignedTo.role !== UserRole.HR) {
        throw new ForbiddenException('Only HR can be assigned HR review tasks');
      }
    }

    const task = new Task();
    task.title = dto.title;
    task.description = dto.description || null;
    task.type = dto.type;
    task.priority = dto.priority || TaskPriority.MEDIUM;
    task.dueDate = dto.dueDate;
    task.metadata = dto.metadata || null;
    task.contract = contract;
    task.createdBy = creator;
    task.status = TaskStatus.PENDING;
    
    if (assignedTo) {
      task.assignedTo = assignedTo;
    }

    const savedTask = await this.taskRepository.save(task);

    // Notify assigned user if task is assigned
    if (assignedTo) {
      await this.notificationService.notifyTaskAssigned(savedTask, creator);
    }

    return savedTask;
  }

  async findAllByContract(contractId: string): Promise<Task[]> {
    return this.taskRepository.find({ where: { contract: { id: contractId } }, relations: ['assignedTo'] });
  }

  async findAllByUser(userId: string): Promise<Task[]> {
    return this.taskRepository.find({ where: { assignedTo: { id: userId } }, relations: ['contract'] });
  }

  async update(taskId: string, dto: UpdateTaskDto, updater: User): Promise<Task> {
    const task = await this.taskRepository.findOne({ 
      where: { id: taskId }, 
      relations: ['assignedTo', 'contract', 'createdBy'] 
    });
    if (!task) throw new NotFoundException('Task not found');
    
    // Only assigned user or admin/legal can update
    if (task.assignedTo && task.assignedTo.id !== updater.id && ![UserRole.ADMIN, UserRole.LEGAL].includes(updater.role)) {
      throw new ForbiddenException('You do not have permission to update this task');
    }
    
    const oldStatus = task.status;
    const oldAssignedTo = task.assignedTo;
    
    if (dto.assignedTo) {
      const user = await this.userRepository.findOne({ where: { id: dto.assignedTo } });
      if (!user) throw new BadRequestException('Assigned user not found');
      task.assignedTo = user;
    }
    
    Object.assign(task, dto);
    const updatedTask = await this.taskRepository.save(task);

    // Notify if task is completed
    if (dto.status === TaskStatus.COMPLETED && oldStatus !== TaskStatus.COMPLETED) {
      await this.notificationService.notifyTaskCompleted(updatedTask, updater);
    }

    // Notify if task is reassigned
    if (dto.assignedTo && oldAssignedTo && oldAssignedTo.id !== dto.assignedTo) {
      await this.notificationService.notifyTaskAssigned(updatedTask, updater);
    }

    return updatedTask;
  }

  async remove(taskId: string, remover: User): Promise<void> {
    const task = await this.taskRepository.findOne({ where: { id: taskId }, relations: ['assignedTo'] });
    if (!task) throw new NotFoundException('Task not found');
    // Only assigned user or admin/legal can delete
    if (task.assignedTo && task.assignedTo.id !== remover.id && ![UserRole.ADMIN, UserRole.LEGAL].includes(remover.role)) {
      throw new ForbiddenException('You do not have permission to delete this task');
    }
    await this.taskRepository.remove(task);
  }
} 