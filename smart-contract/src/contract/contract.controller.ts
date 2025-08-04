import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseGuards,
  Request,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { ContractService } from './contract.service';
import { CreateContractDto } from './dto/create-contract.dto';
import { UpdateContractDto } from './dto/update-contract.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../user/user.entity';
import { ContractStatus, ContractType } from './contract.entity';

@ApiTags('Contracts')
@Controller('contracts')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class ContractController {
  constructor(private readonly contractService: ContractService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new contract (draft status)' })
  @ApiResponse({ status: 201, description: 'Contract created successfully in draft status' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  async create(@Body() createContractDto: CreateContractDto, @Request() req) {
    return this.contractService.create(createContractDto, req.user.id);
  }

  @Post(':id/approve')
  @Roles(UserRole.ADMIN, UserRole.LEGAL)
  @ApiOperation({ summary: 'Approve a contract (Admin/Legal only)' })
  @ApiResponse({ status: 200, description: 'Contract approved successfully' })
  @ApiResponse({ status: 404, description: 'Contract not found' })
  @ApiResponse({ status: 403, description: 'Forbidden - Insufficient permissions' })
  async approveContract(@Param('id') id: string, @Request() req) {
    return this.contractService.updateStatus(id, ContractStatus.ACTIVE, req.user);
  }

  @Post(':id/reject')
  @Roles(UserRole.ADMIN, UserRole.LEGAL)
  @ApiOperation({ summary: 'Reject a contract (Admin/Legal only)' })
  @ApiResponse({ status: 200, description: 'Contract rejected successfully' })
  @ApiResponse({ status: 404, description: 'Contract not found' })
  @ApiResponse({ status: 403, description: 'Forbidden - Insufficient permissions' })
  async rejectContract(@Param('id') id: string, @Body('reason') reason: string, @Request() req) {
    return this.contractService.rejectContract(id, reason, req.user);
  }

  @Get()
  @ApiOperation({ summary: 'Get all contracts with filters' })
  @ApiResponse({ status: 200, description: 'Contracts retrieved successfully' })
  @ApiQuery({ name: 'type', enum: ContractType, required: false })
  @ApiQuery({ name: 'status', enum: ContractStatus, required: false })
  @ApiQuery({ name: 'department', required: false })
  @ApiQuery({ name: 'project', required: false })
  @ApiQuery({ name: 'search', required: false })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  async findAll(
    @Request() req,
    @Query('type') type?: ContractType,
    @Query('status') status?: ContractStatus,
    @Query('department') department?: string,
    @Query('project') project?: string,
    @Query('search') search?: string,
    @Query('page') page = 1,
    @Query('limit') limit = 10,
  ) {
    const filters = {
      type,
      status,
      department,
      project,
      search,
      ownerId: [UserRole.ADMIN, UserRole.LEGAL, UserRole.HR, UserRole.FINANCE].includes(req.user.role) 
        ? undefined 
        : req.user.id,
    };

    return this.contractService.findAll(filters, +page, +limit);
  }

  @Get('expiring')
  @ApiOperation({ summary: 'Get contracts expiring soon' })
  @ApiResponse({ status: 200, description: 'Expiring contracts retrieved successfully' })
  @ApiQuery({ name: 'days', required: false, type: Number })
  async getExpiringContracts(@Query('days') days = 30) {
    return this.contractService.getExpiringContracts(+days);
  }

  @Get('type/:type')
  @ApiOperation({ summary: 'Get contracts by type' })
  @ApiResponse({ status: 200, description: 'Contracts by type retrieved successfully' })
  async getContractsByType(@Param('type') type: ContractType) {
    return this.contractService.getContractsByType(type);
  }

  @Get('status/:status')
  @ApiOperation({ summary: 'Get contracts by status' })
  @ApiResponse({ status: 200, description: 'Contracts by status retrieved successfully' })
  async getContractsByStatus(@Param('status') status: ContractStatus) {
    return this.contractService.getContractsByStatus(status);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a contract by ID' })
  @ApiResponse({ status: 200, description: 'Contract retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Contract not found' })
  async findOne(@Param('id') id: string) {
    return this.contractService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a contract' })
  @ApiResponse({ status: 200, description: 'Contract updated successfully' })
  @ApiResponse({ status: 404, description: 'Contract not found' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  async update(@Param('id') id: string, @Body() updateContractDto: UpdateContractDto) {
    return this.contractService.update(id, updateContractDto);
  }

  @Patch(':id/status')
  @ApiOperation({ summary: 'Update contract status' })
  @ApiResponse({ status: 200, description: 'Contract status updated successfully' })
  @ApiResponse({ status: 404, description: 'Contract not found' })
  async updateStatus(
    @Param('id') id: string,
    @Body('status') status: ContractStatus,
    @Request() req,
  ) {
    return this.contractService.updateStatus(id, status, req.user);
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN, UserRole.LEGAL)
  @ApiOperation({ summary: 'Delete a contract (Admin/Legal only)' })
  @ApiResponse({ status: 200, description: 'Contract deleted successfully' })
  @ApiResponse({ status: 404, description: 'Contract not found' })
  @ApiResponse({ status: 403, description: 'Forbidden - Insufficient permissions' })
  async remove(@Param('id') id: string) {
    return this.contractService.remove(id);
  }
} 