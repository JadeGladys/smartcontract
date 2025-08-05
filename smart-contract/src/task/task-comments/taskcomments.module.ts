import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TaskComment } from './taskcomments.entity';
import { TaskCommentsService } from './taskcomments.service';
import { TaskCommentsController } from './taskcomments.controller';

@Module({
  imports: [TypeOrmModule.forFeature([TaskComment])],
  providers: [TaskCommentsService],
  controllers: [TaskCommentsController],
  exports: [TaskCommentsService],
})
export class TaskCommentsModule {}