import { Controller, Post, Get, Patch, Delete, Param, Body, Request, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { CommentService } from './comment.service';
import { CreateCommentDto } from './dto/create-comment.dto';
import { UpdateCommentDto } from './dto/update-comment.dto';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';

@ApiTags('Comments')
@Controller()
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class CommentController {
  constructor(private readonly commentService: CommentService) {}

  @Post('/contracts/:contractId/comments')
  @ApiOperation({ summary: 'Add a comment to a contract' })
  @ApiResponse({ status: 201, description: 'Comment created successfully' })
  async create(@Param('contractId') contractId: string, @Body() dto: CreateCommentDto, @Request() req) {
    return this.commentService.create(contractId, dto, req.user);
  }

  @Get('/contracts/:contractId/comments')
  @ApiOperation({ summary: 'Get all comments for a contract' })
  @ApiResponse({ status: 200, description: 'Comments retrieved successfully' })
  async findAllByContract(@Param('contractId') contractId: string) {
    return this.commentService.findAllByContract(contractId);
  }

  @Patch('/comments/:commentId')
  @ApiOperation({ summary: 'Update a comment' })
  @ApiResponse({ status: 200, description: 'Comment updated successfully' })
  async update(@Param('commentId') commentId: string, @Body() dto: UpdateCommentDto, @Request() req) {
    return this.commentService.update(commentId, dto, req.user);
  }

  @Delete('/comments/:commentId')
  @ApiOperation({ summary: 'Delete a comment' })
  @ApiResponse({ status: 200, description: 'Comment deleted successfully' })
  async remove(@Param('commentId') commentId: string, @Request() req) {
    return this.commentService.remove(commentId, req.user);
  }
} 