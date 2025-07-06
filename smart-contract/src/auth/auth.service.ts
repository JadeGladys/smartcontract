import { Injectable, UnauthorizedException, ConflictException, ForbiddenException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcryptjs';
import { User, UserRole } from '../user/user.entity';

export interface JwtPayload {
  sub: string;
  email: string;
  role: UserRole;
}

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    private jwtService: JwtService,
    private configService: ConfigService,
  ) {}

  async validateUser(email: string, password: string): Promise<any> {
    const user = await this.userRepository.findOne({ where: { email } });
    if (user && await bcrypt.compare(password, user.password)) {
      const { password, ...result } = user;
      return result;
    }
    return null;
  }

  async login(user: User) {
    const payload: JwtPayload = {
      sub: user.id,
      email: user.email,
      role: user.role,
    };

    return {
      access_token: this.jwtService.sign(payload),
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        department: user.department,
      },
    };
  }

  async register(createUserDto: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    role?: UserRole;
    department?: string;
  }) {
    const existingUser = await this.userRepository.findOne({
      where: { email: createUserDto.email },
    });

    if (existingUser) {
      throw new ConflictException('User with this email already exists');
    }

    const hashedPassword = await bcrypt.hash(createUserDto.password, 10);

    const user = this.userRepository.create({
      ...createUserDto,
      password: hashedPassword,
      role: createUserDto.role || UserRole.VIEWER,
    });

    const savedUser = await this.userRepository.save(user);
    const { password, ...result } = savedUser;

    return result;
  }

  async createAdmin(createAdminDto: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    department?: string;
    adminSecret: string;
  }) {
    // Verify admin secret
    const expectedSecret = this.configService.get('ADMIN_SECRET');
    if (createAdminDto.adminSecret !== expectedSecret) {
      throw new ForbiddenException('Invalid admin secret');
    }

    const existingUser = await this.userRepository.findOne({
      where: { email: createAdminDto.email },
    });

    if (existingUser) {
      throw new ConflictException('User with this email already exists');
    }

    const hashedPassword = await bcrypt.hash(createAdminDto.password, 10);

    const user = this.userRepository.create({
      email: createAdminDto.email,
      password: hashedPassword,
      firstName: createAdminDto.firstName,
      lastName: createAdminDto.lastName,
      department: createAdminDto.department,
      role: UserRole.ADMIN,
    });

    const savedUser = await this.userRepository.save(user);
    const { password, ...result } = savedUser;

    return result;
  }

  async setupInitialAdmin(createAdminDto: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    department?: string;
    adminSecret: string;
  }) {
    // Verify admin secret
    const expectedSecret = this.configService.get('ADMIN_SECRET');
    if (createAdminDto.adminSecret !== expectedSecret) {
      throw new ForbiddenException('Invalid admin secret');
    }

    // Check if any admin already exists
    const existingAdmin = await this.userRepository.findOne({
      where: { role: UserRole.ADMIN },
    });

    if (existingAdmin) {
      throw new ConflictException('Admin already exists. Use create-admin endpoint instead.');
    }

    const existingUser = await this.userRepository.findOne({
      where: { email: createAdminDto.email },
    });

    if (existingUser) {
      throw new ConflictException('User with this email already exists');
    }

    const hashedPassword = await bcrypt.hash(createAdminDto.password, 10);

    const user = this.userRepository.create({
      email: createAdminDto.email,
      password: hashedPassword,
      firstName: createAdminDto.firstName,
      lastName: createAdminDto.lastName,
      department: createAdminDto.department,
      role: UserRole.ADMIN,
    });

    const savedUser = await this.userRepository.save(user);
    const { password, ...result } = savedUser;

    return result;
  }

  async findById(id: string): Promise<User | null> {
    return this.userRepository.findOne({ where: { id } });
  }
} 