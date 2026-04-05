import {
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { User, UserStatus, UserRole } from '../../../entities/user.entity';
import { AdminLoginDto } from '../dto/login.dto';

@Injectable()
export class AdminAuthService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly jwtService: JwtService,
  ) {}

  async initAdmin() {
    const adminUsername = 'admin';
    const adminPassword = 'admin123';
    let admin = await this.userRepository.findOne({
      where: { username: adminUsername },
    });

    const hashedPassword = await bcrypt.hash(adminPassword, 10);

    if (!admin) {
      admin = this.userRepository.create({
        username: adminUsername,
        password: hashedPassword,
        email: 'admin@blog.com',
        role: UserRole.ADMIN,
        status: UserStatus.ACTIVE,
      });
      await this.userRepository.save(admin);
      return {
        created: true,
        username: adminUsername,
        password: adminPassword,
      };
    }

    admin.password = hashedPassword;
    admin.role = UserRole.ADMIN;
    admin.status = UserStatus.ACTIVE;
    await this.userRepository.save(admin);

    return { reset: true, username: adminUsername, password: adminPassword };
  }

  async login(loginDto: AdminLoginDto) {
    const user = await this.userRepository.findOne({
      where: { username: loginDto.username },
    });

    if (!user) {
      throw new UnauthorizedException('用户名或密码错误');
    }

    if (user.status !== UserStatus.ACTIVE) {
      throw new UnauthorizedException('账号已被禁用');
    }

    const isPasswordValid = await bcrypt.compare(
      loginDto.password,
      user.password,
    );
    if (!isPasswordValid) {
      throw new UnauthorizedException('用户名或密码错误');
    }

    const payload = { sub: user.id, username: user.username, role: user.role };
    const token = this.jwtService.sign(payload);

    return {
      token,
      user: {
        userId: user.id,
        username: user.username,
        nickname: user.nickname,
        role: user.role,
        email: user.email,
      },
    };
  }

  async getProfile(userId: number) {
    const user = await this.userRepository.findOne({
      where: { id: userId },
    });
    if (!user) {
      throw new NotFoundException('用户不存在');
    }
    return {
      userId: user.id,
      username: user.username,
      nickname: user.nickname,
      role: user.role,
      email: user.email,
    };
  }
}
