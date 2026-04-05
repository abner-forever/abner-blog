import type { UserResumeDtoResumeTimelineItem } from "./userResumeDtoResumeTimelineItem";

export interface UserResumeDto {
  /** 用户 ID */
  id: number;
  /** 用户名 */
  username: string;
  /**
   * 昵称
   * @nullable
   */
  nickname?: string | null;
  /**
   * 头像 URL
   * @nullable
   */
  avatar?: string | null;
  /**
   * 个人简介
   * @nullable
   */
  bio?: string | null;
  /**
   * 真实姓名
   * @nullable
   */
  resumeName?: string | null;
  /**
   * 职位
   * @nullable
   */
  resumeTitle?: string | null;
  /**
   * 技能栈
   * @nullable
   */
  resumeSkills?: string[] | null;
  /**
   * 经历 timeline
   * @nullable
   */
  resumeTimeline?: UserResumeDtoResumeTimelineItem[] | null;
  /**
   * 所在地
   * @nullable
   */
  resumeLocation?: string | null;
  /**
   * 公司/学校
   * @nullable
   */
  resumeCompany?: string | null;
  /**
   * GitHub
   * @nullable
   */
  resumeGithub?: string | null;
  /**
   * 掘金
   * @nullable
   */
  resumeJuejin?: string | null;
  /**
   * 个人博客
   * @nullable
   */
  resumeBlog?: string | null;
  /**
   * 兴趣爱好
   * @nullable
   */
  resumeHobbies?: string[] | null;
  /** 是否公开简历 */
  isResumePublic: boolean;
  /**
   * 邮箱（仅自己可见）
   * @nullable
   */
  email?: string | null;
  /** 创建时间 */
  createdAt: string;
  /** 更新时间 */
  updatedAt: string;
}
