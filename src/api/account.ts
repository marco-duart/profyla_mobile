import { api } from "./client";
import type { Account, EmailPreferences, Legal, NotificationList, UpdateAccount, UpdatePassword } from "./dto";
import { buildFileForm, MULTIPART, type PickedFile } from "./files";

export const getAccount = () => api.get<Account.Response>("/api/account");

export const updateAccount = (params: UpdateAccount.Params) => api.patch<UpdateAccount.Response>("/api/account", params);

export const updatePassword = (params: UpdatePassword.Params) => api.patch<UpdatePassword.Response>("/api/account/password", params);

export async function uploadPhoto(file: PickedFile): Promise<Account.Response> {
  return api.put<Account.Response>("/api/account/photo", await buildFileForm("photo", file), MULTIPART);
}

export const deletePhoto = () => api.delete<Account.Response>("/api/account/photo");

/** LGPD: tudo que o Profyla guarda sobre a pessoa, em JSON. */
export const exportAccountData = () => api.get<unknown>("/api/account/export");

export const deleteAccount = (password: string) => api.delete<{ message: string }>("/api/account", { data: { password } });

export const getEmailPreferences = () => api.get<EmailPreferences.Response>("/api/account/email_preferences");

export const updateEmailPreferences = (preferences: Partial<EmailPreferences.Preferences>) =>
  api.patch<EmailPreferences.Response>("/api/account/email_preferences", preferences);

// Legal e consentimentos
export const getLegalDocument = (kind: Legal.Kind) => api.get<Legal.Document>(`/api/legal/${kind}`);
export const getConsents = () => api.get<Legal.Consents>("/api/account/consents");
export const acceptConsents = (kinds?: Legal.Kind[]) => api.post<Legal.Consents>("/api/account/consents", { kinds });
export const revokeConsent = (kind: Legal.Kind) => api.delete<Legal.Consents>(`/api/account/consents/${kind}`);

// Notificações
export const listNotifications = (limit = 30) => api.get<NotificationList.Response>("/api/account/notifications", { limit });
export const markNotificationRead = (id: number) => api.patch<{ unread_count: number }>(`/api/account/notifications/${id}/read`);
export const markAllNotificationsRead = () => api.post<{ unread_count: number }>("/api/account/notifications/read_all");
