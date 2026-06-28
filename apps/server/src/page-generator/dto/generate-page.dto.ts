import { IsString, IsOptional, IsNotEmpty, IsArray } from 'class-validator';

export class GeneratePageDto {
  @IsString()
  @IsNotEmpty()
  prompt: string;

  @IsString()
  @IsOptional()
  style?: string;

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  regions?: string[];

  @IsString()
  @IsOptional()
  sessionId?: string;
}

export class RefinePageDto {
  @IsString()
  @IsNotEmpty()
  sessionId: string;

  @IsString()
  @IsNotEmpty()
  message: string;

  @IsString()
  @IsOptional()
  regionId?: string;
}
