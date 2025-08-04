import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ScheduleModule } from '@nestjs/schedule';
import { Notification } from './notification.entity';
import { AuditLog } from './audit.entity';
import { NotificationService } from './notification.service';
import { NotificationController } from './notification.controller';
import { EmailService } from './email.service';
import { User } from '../user/user.entity';
import { Contract } from '../contract/contract.entity';
import { Task } from '../task/task.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Notification, AuditLog, User, Contract, Task]),
    ScheduleModule.forRoot(),
  ],
  providers: [NotificationService, EmailService],
  controllers: [NotificationController],
  exports: [NotificationService, EmailService],
})
export class NotificationModule {} 