import { IsString, IsNotEmpty, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class SubmitReviewDto {
  @ApiProperty({ required: false, description: '提交审核备注' })
  @IsString()
  @IsOptional()
  comment?: string;
}

export class ReviewActionDto {
  @ApiProperty({ description: '审批意见' })
  @IsString()
  @IsNotEmpty()
  comment: string;
}
