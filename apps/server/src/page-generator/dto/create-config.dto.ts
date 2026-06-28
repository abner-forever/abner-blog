import { IsString, IsOptional, IsIn, IsNotEmpty } from 'class-validator';

export class CreateConfigDto {
  @IsString()
  @IsNotEmpty()
  @IsIn(['deepseek', 'openai', 'anthropic'])
  provider: string;

  @IsString()
  @IsNotEmpty()
  apiKey: string;

  @IsString()
  @IsOptional()
  baseUrl?: string;

  @IsString()
  @IsOptional()
  model?: string;
}

export class ConfigResponseDto {
  id: number;
  provider: string;
  baseUrl: string;
  model: string;
  hasApiKey: boolean;
  createdAt: Date;
  updatedAt: Date;
}
