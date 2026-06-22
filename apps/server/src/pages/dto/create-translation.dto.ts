import { IsString, IsNotEmpty, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateTranslationDto {
  @ApiProperty({ description: '目标语言代码' })
  @IsString()
  @IsNotEmpty()
  locale: string;

  @ApiProperty({ description: '翻译页面标题' })
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiProperty({ description: '翻译页面 URL 标识' })
  @IsString()
  @IsNotEmpty()
  slug: string;

  @ApiProperty({ required: false, description: '翻译页面描述' })
  @IsString()
  @IsOptional()
  description?: string;
}
