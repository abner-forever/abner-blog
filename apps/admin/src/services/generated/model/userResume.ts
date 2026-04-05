import type { User } from "./user";

export interface UserResume {
  id: number;
  userId: number;
  user: User;
  /** @nullable */
  resumeName: string | null;
  /** @nullable */
  resumeTitle: string | null;
  /** @nullable */
  resumeSkills: string | null;
  /** @nullable */
  resumeTimeline: string | null;
  /** @nullable */
  resumeLocation: string | null;
  /** @nullable */
  resumeCompany: string | null;
  /** @nullable */
  resumeGithub: string | null;
  /** @nullable */
  resumeJuejin: string | null;
  /** @nullable */
  resumeBlog: string | null;
  /** @nullable */
  resumeHobbies: string | null;
  isResumePublic: boolean;
}
