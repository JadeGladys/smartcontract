import { Controller, Post, Get, Patch, Delete, Param, Body, Request, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { TaskCommentsService } from './taskcomments.service';
import { CreateTaskCommentDto } from './dto/create-task-comment-dto';
import { UpdateTaskCommentDto } from './dto/update-task-comment-dto';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';

@ApiTags('Task Comments')
@Controller('tasks/:taskId/comments')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class TaskCommentsController {
  constructor(private readonly service: TaskCommentsService) {}

  @Post()
  async create(@Param('taskId') taskId: string, @Body() dto: CreateTaskCommentDto, @Request() req) {
    return this.service.create({ ...dto, taskId }, req.user.id);
  }

  @Get()
  async findAll(@Param('taskId') taskId: string) {
    return this.service.findAllByTask(taskId);
  }

  @Patch(':commentId')
  async update(@Param('commentId') commentId: string, @Body() dto: UpdateTaskCommentDto) {
    return this.service.update(commentId, dto);
  }

  @Delete(':commentId')
  async remove(@Param('commentId') commentId: string) {
    return this.service.remove(commentId);
  }
}