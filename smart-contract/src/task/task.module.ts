import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Task } from './task.entity';
import { Contract } from '../contract/contract.entity';
import { User } from '../user/user.entity';
import { TaskService } from './task.service';
import { TaskController } from './task.controller';
import { NotificationModule } from '../notifications/notification.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Task, Contract, User]),
    NotificationModule,
  ],
  providers: [TaskService],
  controllers: [TaskController],
  exports: [TaskService],
})
export class TaskModule {} 