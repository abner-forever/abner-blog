import {
  Injectable,
  ConflictException,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../entities/user.entity';
import { UserResume } from '../entities/user-resume.entity';
import * as bcrypt from 'bcrypt';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { UpdateResumeDto } from './dto/update-resume.dto';
import { UserResumeDto } from '../common/dto/responses/user-resume.response.dto';

// 生成随机昵称
function generateRandomNickname(): string {
  const adjectives = [
    '小小',
    '可爱',
    '勇敢',
    '聪明',
    '活泼',
    '酷酷',
    '萌萌',
    '机智',
    '努力',
    '阳光',
  ];
  const nouns = [
    '飞龙',
    '小鱼',
    '小虾',
    '飞鸟',
    '星星',
    '月亮',
    '程序猿',
    '代码侠',
    '星辰',
    '海风',
  ];
  const adj = adjectives[Math.floor(Math.random() * adjectives.length)];
  const noun = nouns[Math.floor(Math.random() * nouns.length)];
  return `${adj}${noun}`;
}

@Injectable()
export class UsersService {
  private readonly MAX_USERNAME_CHANGES = 3; // 每天最多修改3次用户名

  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
    @InjectRepository(UserResume)
    private userResumeRepository: Repository<UserResume>,
  ) {}

  async create(
    username: string,
    password: string,
    email: string,
    nickname?: string,
  ): Promise<User> {
    const existingUser = await this.usersRepository.findOne({
      where: [{ username }, { email }],
    });

    if (existingUser) {
      throw new ConflictException('用户名或邮箱已存在');
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    // 如果没有提供昵称，则随机生成
    const finalNickname = nickname || generateRandomNickname();

    const user = this.usersRepository.create({
      username,
      nickname: finalNickname,
      password: hashedPassword,
      email,
    });

    return this.usersRepository.save(user);
  }

  async findByUsername(username: string): Promise<User> {
    const user = await this.usersRepository.findOne({
      where: { username },
    });

    if (!user) {
      throw new NotFoundException('用户不存在');
    }

    return user;
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.usersRepository.findOne({
      where: { email },
    });
  }

  async findByResetToken(token: string): Promise<User | null> {
    return this.usersRepository.findOne({
      where: { resetPasswordToken: token },
    });
  }

  async findByUsernameOrEmail(
    username: string,
    email: string,
  ): Promise<User | null> {
    const user = await this.usersRepository.findOne({
      where: [{ username }, { email }],
    });

    return user;
  }

  async findById(id: number): Promise<User> {
    const user = await this.usersRepository.findOne({
      where: { id },
    });

    if (!user) {
      throw new NotFoundException('用户不存在');
    }

    return user;
  }

  async validateUser(username: string, password: string): Promise<User> {
    const user = await this.findByUsername(username);
    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      throw new NotFoundException('用户名或密码错误');
    }

    return user;
  }

  async updateUser(user: User): Promise<User> {
    return this.usersRepository.save(user);
  }

  async updateProfile(
    userId: number,
    updateProfileDto: UpdateProfileDto,
  ): Promise<User> {
    const user = await this.usersRepository.findOne({ where: { id: userId } });
    if (!user) throw new NotFoundException('用户不存在');

    // 更新邮箱（如前端不传则保持不变）
    if (
      updateProfileDto.email !== undefined &&
      updateProfileDto.email !== user.email
    ) {
      const existingEmailUser = await this.usersRepository.findOne({
        where: { email: updateProfileDto.email },
      });
      if (existingEmailUser && existingEmailUser.id !== userId) {
        throw new ConflictException('邮箱已被占用');
      }
      user.email = updateProfileDto.email;
    }

    // 如果要修改用户名，检查修改次数
    if (
      updateProfileDto.username &&
      updateProfileDto.username !== user.username
    ) {
      // 检查用户名是否已被占用
      const existingUser = await this.usersRepository.findOne({
        where: { username: updateProfileDto.username },
      });
      if (existingUser && existingUser.id !== userId) {
        throw new ConflictException('用户名已被占用');
      }

      // 每日重置：如果不是同一天，则将计数归零
      const todayKey = new Date().toISOString().slice(0, 10);
      const lastChangeKey = user.usernameChangeDate
        ? user.usernameChangeDate.toISOString().slice(0, 10)
        : null;
      if (!lastChangeKey || lastChangeKey !== todayKey) {
        user.usernameChangeCount = 0;
        user.usernameChangeDate = new Date();
      }

      // 检查是否超过每日修改次数限制
      if (user.usernameChangeCount >= this.MAX_USERNAME_CHANGES) {
        throw new BadRequestException(
          `用户名今日修改次数已达上限（${this.MAX_USERNAME_CHANGES}次）`,
        );
      }

      // 增加修改次数
      user.usernameChangeCount += 1;
      user.usernameChangeDate = new Date();
    }

    // 更新其他字段
    if (updateProfileDto.nickname !== undefined) {
      user.nickname = updateProfileDto.nickname;
    }
    if (updateProfileDto.avatar !== undefined) {
      user.avatar = updateProfileDto.avatar;
    }
    if (updateProfileDto.bio !== undefined) {
      user.bio = updateProfileDto.bio;
    }
    if (updateProfileDto.username) {
      user.username = updateProfileDto.username;
    }

    return this.usersRepository.save(user);
  }

  // 更新用户简历
  async updateResume(
    userId: number,
    updateResumeDto: UpdateResumeDto,
  ): Promise<User> {
    const user = await this.usersRepository.findOne({
      where: { id: userId },
      relations: ['resume'],
    });
    if (!user) throw new NotFoundException('用户不存在');

    const resume =
      user.resume ??
      this.userResumeRepository.create({
        userId,
      });

    if (updateResumeDto.resumeName !== undefined) {
      resume.resumeName = updateResumeDto.resumeName ?? null;
    }
    if (updateResumeDto.resumeTitle !== undefined) {
      resume.resumeTitle = updateResumeDto.resumeTitle ?? null;
    }
    if (updateResumeDto.resumeSkills !== undefined) {
      resume.resumeSkills = updateResumeDto.resumeSkills
        ? JSON.stringify(updateResumeDto.resumeSkills)
        : null;
    }
    if (updateResumeDto.resumeTimeline !== undefined) {
      resume.resumeTimeline = updateResumeDto.resumeTimeline
        ? JSON.stringify(updateResumeDto.resumeTimeline)
        : null;
    }
    if (updateResumeDto.resumeLocation !== undefined) {
      resume.resumeLocation = updateResumeDto.resumeLocation ?? null;
    }
    if (updateResumeDto.resumeCompany !== undefined) {
      resume.resumeCompany = updateResumeDto.resumeCompany ?? null;
    }
    if (updateResumeDto.resumeGithub !== undefined) {
      resume.resumeGithub = updateResumeDto.resumeGithub ?? null;
    }
    if (updateResumeDto.resumeJuejin !== undefined) {
      resume.resumeJuejin = updateResumeDto.resumeJuejin ?? null;
    }
    if (updateResumeDto.resumeBlog !== undefined) {
      resume.resumeBlog = updateResumeDto.resumeBlog ?? null;
    }
    if (updateResumeDto.resumeHobbies !== undefined) {
      resume.resumeHobbies = updateResumeDto.resumeHobbies
        ? JSON.stringify(updateResumeDto.resumeHobbies)
        : null;
    }

    // 是否公开简历
    if (updateResumeDto.isResumePublic !== undefined) {
      resume.isResumePublic = updateResumeDto.isResumePublic;
    }

    const savedResume = await this.userResumeRepository.save(resume);
    user.resume = savedResume;
    return user;
  }

  // 获取用户简历（公开信息）
  async getResume(userId: number): Promise<User> {
    const user = await this.usersRepository.findOne({
      where: { id: userId },
      relations: ['resume'],
    });
    if (!user) throw new NotFoundException('用户不存在');
    return user;
  }

  // 将用户实体转换为简历 DTO
  transformToResumeDto(user: User): UserResumeDto {
    const resume = user.resume;
    return {
      id: user.id,
      username: user.username,
      nickname: user.nickname || null,
      avatar: user.avatar ?? null,
      bio: user.bio ?? null,
      resumeName: resume?.resumeName ?? null,
      resumeTitle: resume?.resumeTitle ?? null,
      resumeSkills: resume?.resumeSkills
        ? (JSON.parse(resume.resumeSkills) as string[])
        : null,
      resumeTimeline: resume?.resumeTimeline
        ? (JSON.parse(resume.resumeTimeline) as {
            year: string;
            event: string;
          }[])
        : null,
      resumeLocation: resume?.resumeLocation ?? null,
      resumeCompany: resume?.resumeCompany ?? null,
      resumeGithub: resume?.resumeGithub ?? null,
      resumeJuejin: resume?.resumeJuejin ?? null,
      resumeBlog: resume?.resumeBlog ?? null,
      resumeHobbies: resume?.resumeHobbies
        ? (JSON.parse(resume.resumeHobbies) as string[])
        : null,
      isResumePublic: resume?.isResumePublic !== false,
      email: user.email || null,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
  }
}
