import { httpMutator } from "./http";

export interface SystemAnnouncementRow {
  id: number;
  title: string;
  bodyRich: string;
  imageUrls: string[] | null;
  published: boolean;
  publishedAt: string | null;
  recalledAt: string | null;
  notifyRevision: number;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}

export interface SystemAnnouncementListResponse {
  list: SystemAnnouncementRow[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export function listSystemAnnouncements(page: number, pageSize: number) {
  return httpMutator<SystemAnnouncementListResponse>({
    url: "/api/admin/system-announcements",
    method: "GET",
    params: { page, pageSize },
  });
}

export function getSystemAnnouncement(id: number) {
  return httpMutator<SystemAnnouncementRow>({
    url: `/api/admin/system-announcements/${id}`,
    method: "GET",
  });
}

export function createSystemAnnouncement(body: {
  title: string;
  bodyRich: string;
  imageUrls?: string[];
  sortOrder?: number;
}) {
  return httpMutator<SystemAnnouncementRow>({
    url: "/api/admin/system-announcements",
    method: "POST",
    data: body,
    headers: { "Content-Type": "application/json" },
  });
}

export function updateSystemAnnouncement(
  id: number,
  body: {
    title?: string;
    bodyRich?: string;
    imageUrls?: string[];
    sortOrder?: number;
  },
) {
  return httpMutator<SystemAnnouncementRow>({
    url: `/api/admin/system-announcements/${id}`,
    method: "PATCH",
    data: body,
    headers: { "Content-Type": "application/json" },
  });
}

export function deleteSystemAnnouncement(id: number) {
  return httpMutator<void>({
    url: `/api/admin/system-announcements/${id}`,
    method: "DELETE",
  });
}

export function publishSystemAnnouncement(id: number) {
  return httpMutator<{
    announcement: SystemAnnouncementRow;
    notificationsCreated: number;
  }>({
    url: `/api/admin/system-announcements/${id}/publish`,
    method: "POST",
  });
}

export function recallSystemAnnouncement(id: number) {
  return httpMutator<{
    announcement: SystemAnnouncementRow;
    notificationsUpdated: number;
  }>({
    url: `/api/admin/system-announcements/${id}/recall`,
    method: "POST",
  });
}

export function syncSystemAnnouncementNotifications(id: number) {
  return httpMutator<{
    announcement: SystemAnnouncementRow;
    notificationsUpdated: number;
    notificationsCreated: number;
  }>({
    url: `/api/admin/system-announcements/${id}/sync-notifications`,
    method: "POST",
  });
}
