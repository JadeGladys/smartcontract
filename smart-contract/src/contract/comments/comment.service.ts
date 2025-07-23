import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Comment } from './comment.entity';
import { Contract } from '../contract.entity';
import { User, UserRole } from '../../user/user.entity';
import { CreateCommentDto } from './dto/create-comment.dto';
import { UpdateCommentDto } from './dto/update-comment.dto';

@Injectable()
export class CommentService {
  constructor(
    @InjectRepository(Comment)
    private commentRepository: Repository<Comment>,
    @InjectRepository(Contract)
    private contractRepository: Repository<Contract>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
  ) {}

  async create(contractId: string, dto: CreateCommentDto, author: User): Promise<Comment> {
    const contract = await this.contractRepository.findOne({ where: { id: contractId } });
    if (!contract) throw new NotFoundException('Contract not found');
    const comment = this.commentRepository.create({
      content: dto.content,
      contract,
      author,
    });
    return this.commentRepository.save(comment);
  }

  async findAllByContract(contractId: string): Promise<Comment[]> {
    return this.commentRepository.find({
      where: { contract: { id: contractId } },
      relations: ['author'],
      order: { createdAt: 'ASC' },
    });
  }

  async update(commentId: string, dto: UpdateCommentDto, user: User): Promise<Comment> {
    const comment = await this.commentRepository.findOne({ where: { id: commentId }, relations: ['author'] });
    if (!comment) throw new NotFoundException('Comment not found');
    if (comment.author?.id !== user.id && user.role !== UserRole.ADMIN) {
      throw new ForbiddenException('You can only edit your own comments');
    }
    Object.assign(comment, dto);
    return this.commentRepository.save(comment);
  }

  async remove(commentId: string, user: User): Promise<void> {
    const comment = await this.commentRepository.findOne({ where: { id: commentId }, relations: ['author'] });
    if (!comment) throw new NotFoundException('Comment not found');
    if (comment.author?.id !== user.id && user.role !== UserRole.ADMIN) {
      throw new ForbiddenException('You can only delete your own comments');
    }
    await this.commentRepository.remove(comment);
  }
} 