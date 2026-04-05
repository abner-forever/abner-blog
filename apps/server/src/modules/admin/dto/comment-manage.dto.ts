import {
  IsString,
  IsOptional,
  IsNumberString,
  IsArray,
  IsNumber,
} from 'class-validator';

export class CommentManageQueryDto {
  @IsOptional()
  @IsNumberString()
  page?: string;

  @IsOptional()
  @IsNumberString()
  size?: string;

  @IsOptional()
  @IsNumberString()
  blogId?: string;

  @IsOptional()
  @IsNumberString()
  topicId?: string;

  @IsOptional()
  @IsString()
  keyword?: string;
}

export class BatchDeleteCommentsDto {
  @IsArray()
  @IsNumber({}, { each: true })
  ids: number[];
}
