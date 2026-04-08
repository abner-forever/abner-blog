import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { QueryFailedError, Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { User } from '../../../entities/user.entity';
import {
  UserManageQueryDto,
  CreateUserDto,
  UpdateUserDto,
  UpdateUserStatusDto,
} from '../dto/user-manage.dto';
import { UserListResponse } from '../../../common/dto/responses/user.response.dto';

@Injectable()
export class AdminUsersService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  private isDuplicateEntryError(error: unknown): boolean {
    if (!(error instanceof QueryFailedError)) {
      return false;
    }

    const driverError = error.driverError as { code?: string } | undefined;
    return driverError?.code === 'ER_DUP_ENTRY';
  }

  async getUsers(query: UserManageQueryDto): Promise<UserListResponse> {
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

    return {
      list,
      total,
      page: pageNum,
      pageSize: sizeNum,
      totalPages: Math.ceil(total / sizeNum),
      hasNextPage: pageNum < Math.ceil(total / sizeNum),
      hasPrevPage: pageNum > 1,
    };
  }

  async getUserById(id: number) {
    const user = await this.userRepository.findOne({ where: { id } });
    if (!user) {
      throw new NotFoundException('用户不存在');
    }
    return user;
  }

  async createUser(dto: CreateUserDto) {
    const duplicatedUser = await this.userRepository.findOne({
      where: [{ username: dto.username }, { email: dto.email }],
    });
    if (duplicatedUser) {
      if (duplicatedUser.username === dto.username) {
        throw new ConflictException('用户名已存在');
      }
      throw new ConflictException('邮箱已存在');
    }

    const hashedPassword = await bcrypt.hash(dto.password, 10);
    const user = this.userRepository.create({
      ...dto,
      password: hashedPassword,
    });
    try {
      return await this.userRepository.save(user);
    } catch (error) {
      if (this.isDuplicateEntryError(error)) {
        throw new ConflictException('用户名或邮箱已存在');
      }
      throw error;
    }
  }

  async updateUser(id: number, dto: UpdateUserDto) {
    const user = await this.getUserById(id);

    if (dto.email !== undefined && dto.email !== user.email) {
      const existedEmailUser = await this.userRepository.findOne({
        where: { email: dto.email },
      });
      if (existedEmailUser && existedEmailUser.id !== id) {
        throw new ConflictException('邮箱已存在');
      }
    }

    if (dto.password) {
      dto.password = await bcrypt.hash(dto.password, 10);
    }
    Object.assign(user, dto);
    try {
      return await this.userRepository.save(user);
    } catch (error) {
      if (this.isDuplicateEntryError(error)) {
        throw new ConflictException('用户名或邮箱已存在');
      }
      throw error;
    }
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
