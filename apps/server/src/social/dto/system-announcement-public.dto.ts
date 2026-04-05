import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

/** 登录用户查看的已发布系统公告（不含草稿） */
export class SystemAnnouncementPublicDto {
  @ApiProperty({ description: '公告 ID' })
  id: number;

  @ApiProperty({ description: '标题' })
  title: string;

  @ApiPropertyOptional({
    description: '是否已被管理端撤回（为 true 时不展示正文）',
  })
  recalled?: boolean;

  @ApiPropertyOptional({ description: '推送版本号（>1 表示曾重新推送）' })
  notifyRevision?: number;

  @ApiProperty({ description: '正文 HTML（已消毒）；撤回时为空字符串' })
  bodyRich: string;

  @ApiProperty({ description: '配图 URL 列表' })
  imageUrls: string[];

  @ApiProperty({ description: '发布时间', nullable: true, type: String })
  publishedAt: Date | null;

  @ApiProperty({ description: '创建时间' })
  createdAt: Date;
}
