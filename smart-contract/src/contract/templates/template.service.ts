import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ContractTemplate, TemplateCategory } from './contract-template.entity';
import { CreateTemplateDto } from './dto/create-template.dto';
import { UpdateTemplateDto } from './dto/update-template.dto';
import { UseTemplateDto } from './dto/use-template.dto';
import { User } from '../../user/user.entity';
import { ContractService } from '../contract.service';
import { CreateContractDto } from '../dto/create-contract.dto';

@Injectable()
export class TemplateService {
  constructor(
    @InjectRepository(ContractTemplate)
    private templateRepository: Repository<ContractTemplate>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
    private contractService: ContractService,
  ) {}

  async create(createTemplateDto: CreateTemplateDto, creator: User): Promise<ContractTemplate> {
    const template = this.templateRepository.create({
      ...createTemplateDto,
      createdBy: creator,
    });

    return this.templateRepository.save(template);
  }

  async findAll(userId: string, userRole: string): Promise<ContractTemplate[]> {
    const query = this.templateRepository.createQueryBuilder('template')
      .leftJoinAndSelect('template.createdBy', 'createdBy')
      .where('template.isActive = :isActive', { isActive: true });

    // If user is not admin, only show public templates or templates created by the user
    if (userRole !== 'admin') {
      query.andWhere('(template.isPublic = :isPublic OR template.createdById = :userId)', {
        isPublic: true,
        userId,
      });
    }

    return query.orderBy('template.usageCount', 'DESC').getMany();
  }

  async findByCategory(category: TemplateCategory, userId: string, userRole: string): Promise<ContractTemplate[]> {
    const query = this.templateRepository.createQueryBuilder('template')
      .leftJoinAndSelect('template.createdBy', 'createdBy')
      .where('template.category = :category', { category })
      .andWhere('template.isActive = :isActive', { isActive: true });

    if (userRole !== 'admin') {
      query.andWhere('(template.isPublic = :isPublic OR template.createdById = :userId)', {
        isPublic: true,
        userId,
      });
    }

    return query.orderBy('template.usageCount', 'DESC').getMany();
  }

  async findOne(id: string, userId: string, userRole: string): Promise<ContractTemplate> {
    const query = this.templateRepository.createQueryBuilder('template')
      .leftJoinAndSelect('template.createdBy', 'createdBy')
      .where('template.id = :id', { id })
      .andWhere('template.isActive = :isActive', { isActive: true });

    if (userRole !== 'admin') {
      query.andWhere('(template.isPublic = :isPublic OR template.createdById = :userId)', {
        isPublic: true,
        userId,
      });
    }

    const template = await query.getOne();

    if (!template) {
      throw new NotFoundException('Template not found');
    }

    return template;
  }

  async update(id: string, updateTemplateDto: UpdateTemplateDto, updater: User): Promise<ContractTemplate> {
    const template = await this.findOne(id, updater.id, updater.role);

    // Only creator or admin can update
    if (template.createdById !== updater.id && updater.role !== 'admin') {
      throw new BadRequestException('You can only update your own templates');
    }

    Object.assign(template, updateTemplateDto);
    return this.templateRepository.save(template);
  }

  async remove(id: string, remover: User): Promise<void> {
    const template = await this.findOne(id, remover.id, remover.role);

    // Only creator or admin can delete
    if (template.createdById !== remover.id && remover.role !== 'admin') {
      throw new BadRequestException('You can only delete your own templates');
    }

    // Soft delete by setting isActive to false
    template.isActive = false;
    await this.templateRepository.save(template);
  }

  async useTemplate(useTemplateDto: UseTemplateDto, user: User): Promise<any> {
    const template = await this.findOne(useTemplateDto.templateId, user.id, user.role);

    // Increment usage count
    template.usageCount += 1;
    await this.templateRepository.save(template);

    // Process template content
    let processedContent = template.content;
    if (useTemplateDto.values) {
      processedContent = this.processTemplateContent(template.content, useTemplateDto.values);
    }

    // Create contract from template
    const contractData: CreateContractDto = {
      title: useTemplateDto.title || `Contract from ${template.name}`,
      description: useTemplateDto.description || template.description,
      type: template.contractType,
      counterpartyName: useTemplateDto.values?.counterpartyName || 'To be specified',
      counterpartyEmail: useTemplateDto.values?.counterpartyEmail,
      effectiveDate: useTemplateDto.effectiveDate || new Date().toISOString().split('T')[0],
      expiryDate: useTemplateDto.expiryDate || new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      contractValue: useTemplateDto.values?.contractValue,
      currency: useTemplateDto.values?.currency || 'USD',
      department: useTemplateDto.values?.department,
      project: useTemplateDto.values?.project,
      autoRenew: useTemplateDto.values?.autoRenew || false,
      renewalFrequency: useTemplateDto.values?.renewalFrequency || 'annual',
      ...useTemplateDto.contractData,
    };

    const contract = await this.contractService.create(contractData, user.id);

    return {
      contract,
      template,
      processedContent,
    };
  }

  private processTemplateContent(content: string, values: Record<string, any>): string {
    let processedContent = content;

    // Replace placeholders like {{fieldName}} with actual values
    for (const [key, value] of Object.entries(values)) {
      const placeholder = new RegExp(`{{${key}}}`, 'g');
      processedContent = processedContent.replace(placeholder, String(value));
    }

    return processedContent;
  }

  async getPopularTemplates(limit = 10): Promise<ContractTemplate[]> {
    return this.templateRepository.find({
      where: { isActive: true, isPublic: true },
      order: { usageCount: 'DESC' },
      take: limit,
      relations: ['createdBy'],
    });
  }

  async duplicateTemplate(id: string, user: User): Promise<ContractTemplate> {
    const originalTemplate = await this.findOne(id, user.id, user.role);

    const newTemplate = this.templateRepository.create({
      name: `${originalTemplate.name} (Copy)`,
      description: originalTemplate.description,
      contractType: originalTemplate.contractType,
      category: originalTemplate.category,
      content: originalTemplate.content,
      defaultValues: originalTemplate.defaultValues,
      requiredFields: originalTemplate.requiredFields,
      optionalFields: originalTemplate.optionalFields,
      isPublic: false, // Duplicated templates are private by default
      createdBy: user,
    });

    return this.templateRepository.save(newTemplate);
  }
} 