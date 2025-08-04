import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { getDatabaseConfig } from './config/database.config';
import { User } from './user/user.entity';
import { Contract } from './contract/contract.entity';
import { Task } from './task/task.entity';
import { AuthModule } from './auth/auth.module';
import { ContractModule } from './contract/contract.module';
import { TaskModule } from './task/task.module';
import { CommentModule } from './contract/comments/comment.module';
import { NotificationModule } from './notifications/notification.module';
import { DashboardModule } from './dashboard/dashboard.module';
import { Notification } from './notifications/notification.entity';
import { AuditLog } from './notifications/audit.entity';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => getDatabaseConfig(configService),
      inject: [ConfigService],
    }),
    TypeOrmModule.forFeature([User, Contract, Task, Notification, AuditLog]),
    AuthModule,
    ContractModule,
    TaskModule,
    CommentModule,
    NotificationModule,
    DashboardModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
