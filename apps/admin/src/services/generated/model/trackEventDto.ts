import type { TrackEventDtoEventData } from "./trackEventDtoEventData";

export interface TrackEventDto {
  /**
   * 事件名称
   * @maxLength 128
   */
  eventName: string;
  /** 事件数据 */
  eventData?: TrackEventDtoEventData;
}
