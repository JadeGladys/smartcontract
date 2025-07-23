import { TaskType, TaskPriority } from '../task.entity';

export class CreateTaskDto {
  title: string;
  description?: string;
  type: TaskType;
  priority?: TaskPriority;
  dueDate: Date;
  assignedTo?: string; // userId
  metadata?: Record<string, any>;
} 