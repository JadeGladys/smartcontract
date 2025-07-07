import { IsString, IsEnum, IsDateString, IsOptional, IsBoolean, IsNumber, IsArray } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ContractType, ContractStatus, RenewalFrequency } from '../contract.entity';

export class CreateContractDto {
  @ApiProperty({ description: 'Contract title' })
  @IsString()
  title: string;

  @ApiPropertyOptional({ description: 'Contract description' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ 
    enum: ContractType, 
    description: 'Type of contract' 
  })
  @IsEnum(ContractType)
  type: ContractType;

  @ApiProperty({ 
    description: 'Name of the counterparty' 
  })
  @IsString()
  counterpartyName: string;

  @ApiPropertyOptional({ 
    description: 'Counterparty email' 
  })
  @IsOptional()
  @IsString()
  counterpartyEmail?: string;

  @ApiPropertyOptional({ 
    description: 'Counterparty phone' 
  })
  @IsOptional()
  @IsString()
  counterpartyPhone?: string;

  @ApiProperty({ 
    description: 'Contract effective date (YYYY-MM-DD)' 
  })
  @IsDateString()
  effectiveDate: string;

  @ApiProperty({ 
    description: 'Contract expiry date (YYYY-MM-DD)' 
  })
  @IsDateString()
  expiryDate: string;

  @ApiPropertyOptional({ 
    description: 'Auto-renewal setting' 
  })
  @IsOptional()
  @IsBoolean()
  autoRenew?: boolean;

  @ApiPropertyOptional({ 
    enum: RenewalFrequency, 
    description: 'Renewal frequency' 
  })
  @IsOptional()
  @IsEnum(RenewalFrequency)
  renewalFrequency?: RenewalFrequency;

  @ApiPropertyOptional({ 
    description: 'Days notice before renewal' 
  })
  @IsOptional()
  @IsNumber()
  renewalNoticeDays?: number;

  @ApiPropertyOptional({ 
    description: 'Contract value' 
  })
  @IsOptional()
  @IsNumber()
  contractValue?: number;

  @ApiPropertyOptional({ 
    description: 'Currency code' 
  })
  @IsOptional()
  @IsString()
  currency?: string;

  @ApiPropertyOptional({ 
    description: 'Department' 
  })
  @IsOptional()
  @IsString()
  department?: string;

  @ApiPropertyOptional({ 
    description: 'Project name' 
  })
  @IsOptional()
  @IsString()
  project?: string;

  @ApiPropertyOptional({ 
    description: 'Cost center' 
  })
  @IsOptional()
  @IsString()
  costCenter?: string;

  @ApiPropertyOptional({ 
    description: 'Contract notes' 
  })
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiPropertyOptional({ 
    description: 'Custom fields (JSON object)' 
  })
  @IsOptional()
  customFields?: Record<string, any>;

  @ApiPropertyOptional({ 
    description: 'Tags array' 
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];

  @ApiPropertyOptional({ 
    description: 'Stakeholder user ID' 
  })
  @IsOptional()
  @IsString()
  stakeholderId?: string;
} 