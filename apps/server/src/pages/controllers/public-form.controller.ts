import { Controller, Post, Param, Body } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiParam } from '@nestjs/swagger';
import { FormsService } from '../services/forms.service';
import { SubmitFormDto } from '../dto/submit-form.dto';

@ApiTags('Pages (Public)')
@Controller('public/pages')
export class PublicFormController {
  constructor(private readonly formsService: FormsService) {}

  @ApiOperation({ summary: '提交表单数据（公开）' })
  @ApiParam({ name: 'slug', description: '页面 URL 标识' })
  @Post(':slug/submit')
  async submit(@Param('slug') slug: string, @Body() dto: SubmitFormDto) {
    const submission = await this.formsService.submit(slug, dto.fields);
    return {
      id: submission.id,
      message: '提交成功',
    };
  }
}
