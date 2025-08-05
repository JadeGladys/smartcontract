import { IsString, IsOptional, IsObject, IsDateString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UseTemplateDto {
  @ApiProperty({ description: 'Template ID to use' })
  @IsString()
  templateId: string;

  @ApiProperty({ description: 'Values to replace template placeholders', required: false })
  @IsOptional()
  @IsObject()
  values?: Record<string, any>;

  @ApiProperty({ description: 'Contract title', required: false })
  @IsOptional()
  @IsString()
  title?: string;

  @ApiProperty({ description: 'Contract description', required: false })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ description: 'Effective date', required: false })
  @IsOptional()
  @IsDateString()
  effectiveDate?: string;

  @ApiProperty({ description: 'Expiry date', required: false })
  @IsOptional()
  @IsDateString()
  expiryDate?: string;

  @ApiProperty({ description: 'Additional contract data', required: false })
  @IsOptional()
  @IsObject()
  contractData?: Record<string, any>;
} 