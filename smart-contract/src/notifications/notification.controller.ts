import { Controller, Get, Post, Patch, Param, Query, Request, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { NotificationService } from './notification.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { NotificationStatus } from './notification.entity';

@ApiTags('Notifications')
@Controller('notifications')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class NotificationController {
  constructor(private readonly notificationService: NotificationService) {}

  @Get()
  @ApiOperation({ summary: 'Get user notifications' })
  @ApiResponse({ status: 200, description: 'Notifications retrieved successfully' })
  @ApiQuery({ name: 'status', enum: NotificationStatus, required: false })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  async getUserNotifications(
    @Request() req,
    @Query('status') status?: NotificationStatus,
    @Query('limit') limit = 50,
  ) {
    return this.notificationService.getUserNotifications(req.user.id, status, +limit);
  }

  @Get('unread-count')
  @ApiOperation({ summary: 'Get unread notification count' })
  @ApiResponse({ status: 200, description: 'Unread count retrieved successfully' })
  async getUnreadCount(@Request() req) {
    const count = await this.notificationService.getUnreadCount(req.user.id);
    return { unreadCount: count };
  }

  @Patch(':id/read')
  @ApiOperation({ summary: 'Mark notification as read' })
  @ApiResponse({ status: 200, description: 'Notification marked as read' })
  async markAsRead(@Param('id') id: string, @Request() req) {
    return this.notificationService.markAsRead(id, req.user.id);
  }

  @Patch('mark-all-read')
  @ApiOperation({ summary: 'Mark all notifications as read' })
  @ApiResponse({ status: 200, description: 'All notifications marked as read' })
  async markAllAsRead(@Request() req) {
    await this.notificationService.markAllAsRead(req.user.id);
    return { message: 'All notifications marked as read' };
  }
} 