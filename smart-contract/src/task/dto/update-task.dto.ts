import { TaskStatus } from '../task.entity';

export class UpdateTaskDto {
  title?: string;
  description?: string;
  dueDate?: Date;
  status?: TaskStatus;
  assignedTo?: string; // userId
} 