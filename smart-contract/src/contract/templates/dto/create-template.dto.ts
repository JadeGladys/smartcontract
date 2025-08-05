import { IsString, IsEnum, IsOptional, IsBoolean, IsArray, IsObject } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { ContractType } from '../../contract.entity';
import { TemplateCategory } from '../contract-template.entity';

export class CreateTemplateDto {
  @ApiProperty({ description: 'Template name' })
  @IsString()
  name: string;

  @ApiProperty({ description: 'Template description' })
  @IsString()
  description: string;

  @ApiProperty({ enum: ContractType, description: 'Contract type' })
  @IsEnum(ContractType)
  contractType: ContractType;

  @ApiProperty({ enum: TemplateCategory, description: 'Template category' })
  @IsEnum(TemplateCategory)
  category: TemplateCategory;

  @ApiProperty({ description: 'Template content with placeholders' })
  @IsString()
  content: string;

  @ApiProperty({ description: 'Default values for template fields', required: false })
  @IsOptional()
  @IsObject()
  defaultValues?: Record<string, any>;

  @ApiProperty({ description: 'Required fields for this template', required: false })
  @IsOptional()
  @IsArray()
  requiredFields?: string[];

  @ApiProperty({ description: 'Optional fields for this template', required: false })
  @IsOptional()
  @IsArray()
  optionalFields?: string[];

  @ApiProperty({ description: 'Whether template is public', required: false })
  @IsOptional()
  @IsBoolean()
  isPublic?: boolean;

  @ApiProperty({ description: 'Additional metadata', required: false })
  @IsOptional()
  @IsObject()
  metadata?: Record<string, any>;
} 