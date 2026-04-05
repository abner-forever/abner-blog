import { ApiProperty } from '@nestjs/swagger';

export class UserResumeDto {
  @ApiProperty({ description: '用户 ID' })
  id: number;

  @ApiProperty({ description: '用户名' })
  username: string;

  @ApiProperty({ required: false, nullable: true, description: '昵称' })
  nickname: string | null;

  @ApiProperty({ required: false, nullable: true, description: '头像 URL' })
  avatar: string | null;

  @ApiProperty({ required: false, nullable: true, description: '个人简介' })
  bio: string | null;

  @ApiProperty({ required: false, nullable: true, description: '真实姓名' })
  resumeName: string | null;

  @ApiProperty({ required: false, nullable: true, description: '职位' })
  resumeTitle: string | null;

  @ApiProperty({
    required: false,
    nullable: true,
    description: '技能栈',
    type: [String],
  })
  resumeSkills: string[] | null;

  @ApiProperty({
    required: false,
    nullable: true,
    description: '经历 timeline',
    type: [Object],
  })
  resumeTimeline: { year: string; event: string }[] | null;

  @ApiProperty({ required: false, nullable: true, description: '所在地' })
  resumeLocation: string | null;

  @ApiProperty({ required: false, nullable: true, description: '公司/学校' })
  resumeCompany: string | null;

  @ApiProperty({ required: false, nullable: true, description: 'GitHub' })
  resumeGithub: string | null;

  @ApiProperty({ required: false, nullable: true, description: '掘金' })
  resumeJuejin: string | null;

  @ApiProperty({ required: false, nullable: true, description: '个人博客' })
  resumeBlog: string | null;

  @ApiProperty({
    required: false,
    nullable: true,
    description: '兴趣爱好',
    type: [String],
  })
  resumeHobbies: string[] | null;

  @ApiProperty({ description: '是否公开简历' })
  isResumePublic: boolean;

  @ApiProperty({
    required: false,
    nullable: true,
    description: '邮箱（仅自己可见）',
  })
  email: string | null;

  @ApiProperty({ description: '创建时间' })
  createdAt: Date;

  @ApiProperty({ description: '更新时间' })
  updatedAt: Date;
}
