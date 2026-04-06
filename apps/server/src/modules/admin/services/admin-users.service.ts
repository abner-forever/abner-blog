import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { User } from '../../../entities/user.entity';
import {
  UserManageQueryDto,
  CreateUserDto,
  UpdateUserDto,
  UpdateUserStatusDto,
} from '../dto/user-manage.dto';

@Injectable()
export class AdminUsersService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  async getUsers(query: UserManageQueryDto) {
    const pageNum = query.page ? parseInt(query.page, 10) : 1;
    const sizeNum = query.size ? parseInt(query.size, 10) : 10;
    const { keyword, status } = query;
    const qb = this.userRepository.createQueryBuilder('user');

    if (keyword) {
      qb.where('user.username LIKE :keyword OR user.email LIKE :keyword', {
        keyword: `%${keyword}%`,
      });
    }
    if (status) {
      qb.andWhere('user.status = :status', { status });
    }

    const [list, total] = await qb
      .orderBy('user.createdAt', 'DESC')
      .skip((pageNum - 1) * sizeNum)
      .take(sizeNum)
      .getManyAndCount();

    return { list, total };
  }

  async getUserById(id: number) {
    const user = await this.userRepository.findOne({ where: { id } });
    if (!user) {
      throw new NotFoundException('用户不存在');
    }
    return user;
  }

  async createUser(dto: CreateUserDto) {
    const hashedPassword = await bcrypt.hash(dto.password, 10);
    const user = this.userRepository.create({
      ...dto,
      password: hashedPassword,
    });
    return this.userRepository.save(user);
  }

  async updateUser(id: number, dto: UpdateUserDto) {
    const user = await this.getUserById(id);
    if (dto.password) {
      dto.password = await bcrypt.hash(dto.password, 10);
    }
    Object.assign(user, dto);
    return this.userRepository.save(user);
  }

  async deleteUser(id: number) {
    const user = await this.getUserById(id);
    // 级联删除会自动处理：用户博客 → 博客的点赞/评论/收藏
    await this.userRepository.remove(user);
  }

  async updateUserStatus(id: number, dto: UpdateUserStatusDto) {
    const user = await this.getUserById(id);
    user.status = dto.status;
    return this.userRepository.save(user);
  }
}
