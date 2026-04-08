import type { TrackEventDto } from "./trackEventDto";

export interface TrackEventBatchDto {
  /** 事件列表 */
  events: TrackEventDto[];
}
