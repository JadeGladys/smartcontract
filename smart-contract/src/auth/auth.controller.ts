import { Controller, Post, Body, HttpCode, HttpStatus, ValidationPipe, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { User, UserRole } from '../user/user.entity';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { RolesGuard } from './guards/roles.guard';
import { Roles } from './decorators/roles.decorator';

export class LoginDto {
  email: string;
  password: string;
}

export class RegisterDto {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  role?: UserRole;
  department?: string;
}

export class CreateAdminDto {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  department?: string;
  adminSecret: string; // Special secret for admin creation
}

@ApiTags('Authentication')
@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'User login' })
  @ApiResponse({ status: 200, description: 'Login successful' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async login(@Body() loginDto: LoginDto) {
    const user = await this.authService.validateUser(
      loginDto.email,
      loginDto.password,
    );
    
    if (!user) {
      throw new Error('Invalid credentials');
    }
    
    return this.authService.login(user);
  }

  @Post('register')
  @ApiOperation({ summary: 'User registration (non-admin roles only)' })
  @ApiResponse({ status: 201, description: 'User created successfully' })
  @ApiResponse({ status: 409, description: 'User already exists' })
  @ApiResponse({ status: 403, description: 'Admin role not allowed in public registration' })
  async register(@Body() registerDto: RegisterDto) {
    // Prevent admin role creation through public registration
    if (registerDto.role === UserRole.ADMIN) {
      throw new Error('Admin role cannot be created through public registration');
    }
    
    return this.authService.register(registerDto);
  }

  @Post('create-admin')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create admin user (admin only)' })
  @ApiResponse({ status: 201, description: 'Admin created successfully' })
  @ApiResponse({ status: 403, description: 'Only admins can create other admins' })
  async createAdmin(@Body() createAdminDto: CreateAdminDto) {
    return this.authService.createAdmin(createAdminDto);
  }

  @Post('setup-initial-admin')
  @ApiOperation({ summary: 'Setup initial admin (first time only)' })
  @ApiResponse({ status: 201, description: 'Initial admin created successfully' })
  @ApiResponse({ status: 409, description: 'Admin already exists' })
  async setupInitialAdmin(@Body() createAdminDto: CreateAdminDto) {
    return this.authService.setupInitialAdmin(createAdminDto);
  }
} 