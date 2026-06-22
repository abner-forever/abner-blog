import { IsObject, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class SubmitFormDto {
  @ApiProperty({
    description: '表单字段键值对',
    example: { name: '张三', email: 'zhangsan@example.com', message: '你好' },
  })
  @IsObject()
  @IsNotEmpty()
  fields: Record<string, string>;
}
