import { ApiProperty } from '@nestjs/swagger';

export class HotSearchItemDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  title: string;

  @ApiProperty()
  hot: number;

  @ApiProperty()
  url: string;

  @ApiProperty()
  platform: string;

  @ApiProperty()
  icon: string;
}

export class HotSearchResponseDto {
  @ApiProperty({ type: [HotSearchItemDto] })
  weibo: HotSearchItemDto[];

  @ApiProperty({ type: [HotSearchItemDto] })
  bilibili: HotSearchItemDto[];

  @ApiProperty({ type: [HotSearchItemDto] })
  github: HotSearchItemDto[];

  @ApiProperty({ type: [HotSearchItemDto] })
  toutiao: HotSearchItemDto[];

  @ApiProperty({ type: [HotSearchItemDto] })
  douyin: HotSearchItemDto[];
}
