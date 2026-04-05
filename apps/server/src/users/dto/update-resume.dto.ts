import {
  IsString,
  IsOptional,
  IsArray,
  MaxLength,
  IsBoolean,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateResumeDto {
  @ApiProperty({ required: false, description: '真实姓名' })
  @IsString()
  @IsOptional()
  @MaxLength(50)
  resumeName?: string;

  @ApiProperty({ required: false, description: '职位' })
  @IsString()
  @IsOptional()
  @MaxLength(100)
  resumeTitle?: string;

  @ApiProperty({ required: false, description: '技能栈数组', type: [String] })
  @IsArray()
  @IsOptional()
  resumeSkills?: string[];

  @ApiProperty({
    required: false,
    description: '经历数组 [{year, event}]',
    type: [Object],
  })
  @IsArray()
  @IsOptional()
  resumeTimeline?: { year: string; event: string }[];

  @ApiProperty({ required: false, description: '所在地' })
  @IsString()
  @IsOptional()
  @MaxLength(50)
  resumeLocation?: string;

  @ApiProperty({ required: false, description: '公司/学校' })
  @IsString()
  @IsOptional()
  @MaxLength(100)
  resumeCompany?: string;

  @ApiProperty({ required: false, description: 'GitHub 地址' })
  @IsString()
  @IsOptional()
  resumeGithub?: string;

  @ApiProperty({ required: false, description: '掘金主页' })
  @IsString()
  @IsOptional()
  resumeJuejin?: string;

  @ApiProperty({ required: false, description: '个人博客' })
  @IsString()
  @IsOptional()
  resumeBlog?: string;

  @ApiProperty({ required: false, description: '兴趣爱好数组', type: [String] })
  @IsArray()
  @IsOptional()
  resumeHobbies?: string[];

  @ApiProperty({ required: false, description: '是否公开简历' })
  @IsBoolean()
  @IsOptional()
  isResumePublic?: boolean;
}
