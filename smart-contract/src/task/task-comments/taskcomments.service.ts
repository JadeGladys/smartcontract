import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TaskComment } from './taskcomments.entity';
import { CreateTaskCommentDto } from './dto/create-task-comment-dto';
import { UpdateTaskCommentDto } from './dto/update-task-comment-dto';

@Injectable()
export class TaskCommentsService {
  constructor(
    @InjectRepository(TaskComment)
    private readonly commentRepo: Repository<TaskComment>,
  ) {}

  async create(dto: CreateTaskCommentDto, userId: string) {
    const comment = this.commentRepo.create({
      content: dto.content,
      task: { id: dto.taskId } as any,
      author: { id: userId } as any,
    });
    return this.commentRepo.save(comment);
  }

  async findAllByTask(taskId: string) {
    return this.commentRepo.find({
      where: { task: { id: taskId } },
      relations: ['author'],
      order: { createdAt: 'ASC' },
    });
  }

  async update(id: string, dto: UpdateTaskCommentDto) {
    await this.commentRepo.update(id, dto);
    return this.commentRepo.findOne({ where: { id } });
  }

  async remove(id: string) {
    return this.commentRepo.delete(id);
  }
}