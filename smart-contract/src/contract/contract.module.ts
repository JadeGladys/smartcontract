import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ContractService } from './contract.service';
import { ContractController } from './contract.controller';
import { Contract } from './contract.entity';
import { User } from '../user/user.entity';
import { NotificationModule } from '../notifications/notification.module';
import { TemplateModule } from './templates/template.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Contract, User]),
    NotificationModule,
    TemplateModule,
  ],
  controllers: [ContractController],
  providers: [ContractService],
  exports: [ContractService],
})
export class ContractModule {} 