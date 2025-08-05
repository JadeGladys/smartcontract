import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TemplateService } from './template.service';
import { TemplateController } from './template.controller';
import { ContractTemplate } from './contract-template.entity';
import { User } from '../../user/user.entity';
import { ContractModule } from '../contract.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([ContractTemplate, User]),
    ContractModule,
  ],
  providers: [TemplateService],
  controllers: [TemplateController],
  exports: [TemplateService],
})
export class TemplateModule {} 