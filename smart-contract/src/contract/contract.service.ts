import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, FindManyOptions, Like } from 'typeorm';
import { Contract, ContractStatus, ContractType } from './contract.entity';
import { CreateContractDto } from './dto/create-contract.dto';
import { UpdateContractDto } from './dto/update-contract.dto';
import { User } from '../user/user.entity';
import { NotificationService } from '../notifications/notification.service';

export interface ContractFilters {
  type?: ContractType;
  status?: ContractStatus;
  department?: string;
  project?: string;
  search?: string;
  ownerId?: string;
  stakeholderId?: string;
}

@Injectable()
export class ContractService {
  constructor(
    @InjectRepository(Contract)
    private contractRepository: Repository<Contract>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
    private notificationService: NotificationService,
  ) {}

  async create(createContractDto: CreateContractDto, ownerId: string): Promise<Contract> {
    // Validate dates
    const effectiveDate = new Date(createContractDto.effectiveDate);
    const expiryDate = new Date(createContractDto.expiryDate);

    if (effectiveDate >= expiryDate) {
      throw new BadRequestException('Effective date must be before expiry date');
    }

    // Check if stakeholder exists if provided
    if (createContractDto.stakeholderId) {
      const stakeholder = await this.userRepository.findOne({
        where: { id: createContractDto.stakeholderId },
      });
      if (!stakeholder) {
        throw new BadRequestException('Stakeholder not found');
      }
    }

    const contract = this.contractRepository.create({
      ...createContractDto,
      effectiveDate,
      expiryDate,
      ownerId,
      status: ContractStatus.DRAFT,
    });

    const savedContract = await this.contractRepository.save(contract);

    // Notify admins for approval if contract is created as draft
    if (savedContract.status === ContractStatus.DRAFT) {
      await this.notificationService.notifyContractApprovalRequired(savedContract);
    }

    return savedContract;
  }

  async findAll(filters: ContractFilters = {}, page = 1, limit = 10): Promise<{
    contracts: Contract[];
    total: number;
    page: number;
    limit: number;
  }> {
    const options: FindManyOptions<Contract> = {
      relations: ['owner', 'stakeholder'],
      skip: (page - 1) * limit,
      take: limit,
      order: { createdAt: 'DESC' },
    };

    // Build where conditions
    const whereConditions: any = {};

    if (filters.type) {
      whereConditions.type = filters.type;
    }

    if (filters.status) {
      whereConditions.status = filters.status;
    }

    if (filters.department) {
      whereConditions.department = Like(`%${filters.department}%`);
    }

    if (filters.project) {
      whereConditions.project = Like(`%${filters.project}%`);
    }

    if (filters.ownerId) {
      whereConditions.ownerId = filters.ownerId;
    }

    if (filters.stakeholderId) {
      whereConditions.stakeholderId = filters.stakeholderId;
    }

    if (filters.search) {
      options.where = [
        { title: Like(`%${filters.search}%`), ...whereConditions },
        { counterpartyName: Like(`%${filters.search}%`), ...whereConditions },
        { description: Like(`%${filters.search}%`), ...whereConditions },
      ];
    } else {
      options.where = whereConditions;
    }

    const [contracts, total] = await this.contractRepository.findAndCount(options);

    return {
      contracts,
      total,
      page,
      limit,
    };
  }

  async findOne(id: string): Promise<Contract> {
    const contract = await this.contractRepository.findOne({
      where: { id },
      relations: ['owner', 'stakeholder'],
    });

    if (!contract) {
      throw new NotFoundException(`Contract with ID ${id} not found`);
    }

    return contract;
  }

  async update(id: string, updateContractDto: UpdateContractDto): Promise<Contract> {
    const contract = await this.findOne(id);

    // Validate dates if both are provided
    if (updateContractDto.effectiveDate && updateContractDto.expiryDate) {
      const effectiveDate = new Date(updateContractDto.effectiveDate);
      const expiryDate = new Date(updateContractDto.expiryDate);

      if (effectiveDate >= expiryDate) {
        throw new BadRequestException('Effective date must be before expiry date');
      }
    }

    // Check if stakeholder exists if provided
    if (updateContractDto.stakeholderId) {
      const stakeholder = await this.userRepository.findOne({
        where: { id: updateContractDto.stakeholderId },
      });
      if (!stakeholder) {
        throw new BadRequestException('Stakeholder not found');
      }
    }

    Object.assign(contract, updateContractDto);
    return this.contractRepository.save(contract);
  }

  async remove(id: string): Promise<void> {
    const contract = await this.findOne(id);
    await this.contractRepository.remove(contract);
  }

  async updateStatus(id: string, status: ContractStatus, changedBy: User): Promise<Contract> {
    const contract = await this.findOne(id);
    const oldStatus = contract.status;
    contract.status = status;
    
    const updatedContract = await this.contractRepository.save(contract);

    // Notify stakeholders of status change
    await this.notificationService.notifyContractStatusChanged(updatedContract, oldStatus, status, changedBy);

    return updatedContract;
  }

  async rejectContract(id: string, reason: string, rejectedBy: User): Promise<Contract> {
    const contract = await this.findOne(id);
    const oldStatus = contract.status;
    contract.status = ContractStatus.TERMINATED;
    contract.notes = contract.notes 
      ? `${contract.notes}\n\nREJECTED: ${reason}` 
      : `REJECTED: ${reason}`;
    
    const updatedContract = await this.contractRepository.save(contract);

    // Notify stakeholders of rejection
    await this.notificationService.notifyContractStatusChanged(updatedContract, oldStatus, ContractStatus.TERMINATED, rejectedBy);

    return updatedContract;
  }

  async getExpiringContracts(daysThreshold = 30): Promise<Contract[]> {
    const thresholdDate = new Date();
    thresholdDate.setDate(thresholdDate.getDate() + daysThreshold);

    return this.contractRepository.find({
      where: {
        expiryDate: thresholdDate,
        status: ContractStatus.ACTIVE,
      },
      relations: ['owner', 'stakeholder'],
    });
  }

  async getContractsByType(type: ContractType): Promise<Contract[]> {
    return this.contractRepository.find({
      where: { type },
      relations: ['owner', 'stakeholder'],
    });
  }

  async getContractsByStatus(status: ContractStatus): Promise<Contract[]> {
    return this.contractRepository.find({
      where: { status },
      relations: ['owner', 'stakeholder'],
    });
  }
} 