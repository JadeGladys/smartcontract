import { Controller, Get, Request, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { DashboardService } from './dashboard.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('Dashboard')
@Controller('dashboard')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get('stats')
  @ApiOperation({ summary: 'Get dashboard statistics' })
  @ApiResponse({ status: 200, description: 'Dashboard statistics retrieved successfully' })
  async getDashboardStats(@Request() req) {
    return this.dashboardService.getDashboardStats(req.user.id, req.user.role);
  }

  @Get('analytics/contract-value')
  @ApiOperation({ summary: 'Get contract value analytics' })
  @ApiResponse({ status: 200, description: 'Contract value analytics retrieved successfully' })
  async getContractValueAnalytics(@Request() req) {
    const baseConditions = this.getBaseConditions(req.user.id, req.user.role);
    return this.dashboardService.getContractValueAnalytics(baseConditions);
  }

  private getBaseConditions(userId: string, userRole: string) {
    // Admin, Legal, HR, Finance can see all contracts
    if (['admin', 'legal', 'hr', 'finance'].includes(userRole)) {
      return {};
    }
    
    // Other users can only see their own contracts
    return { ownerId: userId };
  }
} 