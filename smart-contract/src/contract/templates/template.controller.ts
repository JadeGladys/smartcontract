import { Controller, Get, Post, Body, Patch, Param, Delete, Query, Request, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { TemplateService } from './template.service';
import { CreateTemplateDto } from './dto/create-template.dto';
import { UpdateTemplateDto } from './dto/update-template.dto';
import { UseTemplateDto } from './dto/use-template.dto';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Roles } from '../../auth/decorators/roles.decorator';
import { UserRole } from '../../user/user.entity';
import { TemplateCategory } from './contract-template.entity';

@ApiTags('Contract Templates')
@Controller('templates')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class TemplateController {
  constructor(private readonly templateService: TemplateService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new contract template' })
  @ApiResponse({ status: 201, description: 'Template created successfully' })
  async create(@Body() createTemplateDto: CreateTemplateDto, @Request() req) {
    return this.templateService.create(createTemplateDto, req.user);
  }

  @Get()
  @ApiOperation({ summary: 'Get all available templates' })
  @ApiResponse({ status: 200, description: 'Templates retrieved successfully' })
  async findAll(@Request() req) {
    return this.templateService.findAll(req.user.id, req.user.role);
  }

  @Get('category/:category')
  @ApiOperation({ summary: 'Get templates by category' })
  @ApiResponse({ status: 200, description: 'Templates by category retrieved successfully' })
  async findByCategory(
    @Param('category') category: TemplateCategory,
    @Request() req,
  ) {
    return this.templateService.findByCategory(category, req.user.id, req.user.role);
  }

  @Get('popular')
  @ApiOperation({ summary: 'Get popular templates' })
  @ApiResponse({ status: 200, description: 'Popular templates retrieved successfully' })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  async getPopularTemplates(@Query('limit') limit = 10) {
    return this.templateService.getPopularTemplates(+limit);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a template by ID' })
  @ApiResponse({ status: 200, description: 'Template retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Template not found' })
  async findOne(@Param('id') id: string, @Request() req) {
    return this.templateService.findOne(id, req.user.id, req.user.role);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a template' })
  @ApiResponse({ status: 200, description: 'Template updated successfully' })
  @ApiResponse({ status: 404, description: 'Template not found' })
  async update(
    @Param('id') id: string,
    @Body() updateTemplateDto: UpdateTemplateDto,
    @Request() req,
  ) {
    return this.templateService.update(id, updateTemplateDto, req.user);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a template' })
  @ApiResponse({ status: 200, description: 'Template deleted successfully' })
  @ApiResponse({ status: 404, description: 'Template not found' })
  async remove(@Param('id') id: string, @Request() req) {
    return this.templateService.remove(id, req.user);
  }

  @Post('use')
  @ApiOperation({ summary: 'Use a template to create a contract' })
  @ApiResponse({ status: 201, description: 'Contract created from template successfully' })
  async useTemplate(@Body() useTemplateDto: UseTemplateDto, @Request() req) {
    return this.templateService.useTemplate(useTemplateDto, req.user);
  }

  @Post(':id/duplicate')
  @ApiOperation({ summary: 'Duplicate a template' })
  @ApiResponse({ status: 201, description: 'Template duplicated successfully' })
  async duplicateTemplate(@Param('id') id: string, @Request() req) {
    return this.templateService.duplicateTemplate(id, req.user);
  }
} 