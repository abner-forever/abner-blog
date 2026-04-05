import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserFollow } from '../entities/user-follow.entity';
import { User } from '../entities/user.entity';

@Injectable()
export class FollowsService {
  constructor(
    @InjectRepository(UserFollow)
    private readonly followRepo: Repository<UserFollow>,
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
  ) {}

  async hasFollowEdge(userA: number, userB: number): Promise<boolean> {
    if (userA === userB) return false;
    const row = await this.followRepo.findOne({
      where: [
        { follower: { id: userA }, following: { id: userB } },
        { follower: { id: userB }, following: { id: userA } },
      ],
    });
    return !!row;
  }

  async follow(
    followerId: number,
    followingId: number,
  ): Promise<{ following: boolean }> {
    if (followerId === followingId) {
      throw new BadRequestException('不能关注自己');
    }
    const target = await this.userRepo.findOne({ where: { id: followingId } });
    if (!target) {
      throw new NotFoundException('用户不存在');
    }
    const existing = await this.followRepo.findOne({
      where: {
        follower: { id: followerId },
        following: { id: followingId },
      },
    });
    if (existing) {
      return { following: true };
    }
    const row = this.followRepo.create({
      follower: { id: followerId },
      following: { id: followingId },
    });
    await this.followRepo.save(row);
    return { following: true };
  }

  async unfollow(
    followerId: number,
    followingId: number,
  ): Promise<{ following: boolean }> {
    await this.followRepo.delete({
      follower: { id: followerId },
      following: { id: followingId },
    });
    return { following: false };
  }

  async listFollowers(
    userId: number,
    page = 1,
    pageSize = 20,
  ): Promise<{
    list: Array<{
      id: number;
      username: string;
      nickname: string | null;
      avatar: string | null;
      followedAt: Date;
    }>;
    total: number;
    page: number;
    pageSize: number;
    totalPages: number;
  }> {
    const skip = (page - 1) * pageSize;
    const qb = this.followRepo
      .createQueryBuilder('f')
      .innerJoinAndSelect('f.follower', 'follower')
      .where('f.followingId = :userId', { userId })
      .orderBy('f.createdAt', 'DESC')
      .skip(skip)
      .take(pageSize);
    const [rows, total] = await qb.getManyAndCount();
    return {
      list: rows.map((r) => ({
        id: r.follower.id,
        username: r.follower.username,
        nickname: r.follower.nickname ?? null,
        avatar: r.follower.avatar ?? null,
        followedAt: r.createdAt,
      })),
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize) || 0,
    };
  }

  async listFollowing(
    userId: number,
    page = 1,
    pageSize = 20,
  ): Promise<{
    list: Array<{
      id: number;
      username: string;
      nickname: string | null;
      avatar: string | null;
      followedAt: Date;
    }>;
    total: number;
    page: number;
    pageSize: number;
    totalPages: number;
  }> {
    const skip = (page - 1) * pageSize;
    const qb = this.followRepo
      .createQueryBuilder('f')
      .innerJoinAndSelect('f.following', 'following')
      .where('f.followerId = :userId', { userId })
      .orderBy('f.createdAt', 'DESC')
      .skip(skip)
      .take(pageSize);
    const [rows, total] = await qb.getManyAndCount();
    return {
      list: rows.map((r) => ({
        id: r.following.id,
        username: r.following.username,
        nickname: r.following.nickname ?? null,
        avatar: r.following.avatar ?? null,
        followedAt: r.createdAt,
      })),
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize) || 0,
    };
  }

  async isFollowing(followerId: number, followingId: number): Promise<boolean> {
    const row = await this.followRepo.findOne({
      where: {
        follower: { id: followerId },
        following: { id: followingId },
      },
    });
    return !!row;
  }
}
