import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, CreateDateColumn } from 'typeorm';
import { Task } from '../task.entity';
import { User } from 'src/user/user.entity';

@Entity('task_comments')
export class TaskComment {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('text')
  content: string;

  @ManyToOne(() => Task, task => task.id)
  task: Task;

  @ManyToOne(() => User, user => user.id)
  author: User;

  @CreateDateColumn()
  createdAt: Date;
}