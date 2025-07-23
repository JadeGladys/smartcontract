import { Controller, Post, Get, Patch, Delete, Param, Body, Request, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { TaskService } from './task.service';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('Tasks')
@Controller()
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class TaskController {
  constructor(private readonly taskService: TaskService) {}

  @Post('/contracts/:contractId/tasks')
  @ApiOperation({ summary: 'Create a task for a contract' })
  @ApiResponse({ status: 201, description: 'Task created successfully' })
  async create(@Param('contractId') contractId: string, @Body() dto: CreateTaskDto, @Request() req) {
    return this.taskService.create(contractId, dto, req.user);
  }

  @Get('/contracts/:contractId/tasks')
  @ApiOperation({ summary: 'Get all tasks for a contract' })
  @ApiResponse({ status: 200, description: 'Tasks retrieved successfully' })
  async findAllByContract(@Param('contractId') contractId: string) {
    return this.taskService.findAllByContract(contractId);
  }

  @Get('/tasks/my')
  @ApiOperation({ summary: 'Get all tasks assigned to current user' })
  @ApiResponse({ status: 200, description: 'Tasks retrieved successfully' })
  async findAllByUser(@Request() req) {
    return this.taskService.findAllByUser(req.user.id);
  }

  @Patch('/tasks/:taskId')
  @ApiOperation({ summary: 'Update a task' })
  @ApiResponse({ status: 200, description: 'Task updated successfully' })
  async update(@Param('taskId') taskId: string, @Body() dto: UpdateTaskDto, @Request() req) {
    return this.taskService.update(taskId, dto, req.user);
  }

  @Delete('/tasks/:taskId')
  @ApiOperation({ summary: 'Delete a task' })
  @ApiResponse({ status: 200, description: 'Task deleted successfully' })
  async remove(@Param('taskId') taskId: string, @Request() req) {
    return this.taskService.remove(taskId, req.user);
  }
} 