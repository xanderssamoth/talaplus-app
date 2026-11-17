import { apiRequest, getCurrentUser, updateCurrentUser } from '@/lib/session';
import { ApiMedia, ApiPost, ApiProduct, normalizeMedia, normalizePost, normalizeProduct } from '@/lib/api';

type Raw = Record<string, any>;
const object = (value: unknown): Raw => value && typeof value === 'object' && !Array.isArray(value) ? value as Raw : {};
const array = (value: unknown): Raw[] => Array.isArray(value) ? value.map(object) : Array.isArray(object(value).data) ? object(value).data.map(object) : Array.isArray(object(value).items) ? object(value).items.map(object) : [];
const string = (value: unknown) => value == null ? '' : String(value);
const userPath = (id: string) => `/v1/user/${encodeURIComponent(id)}`;

export type Profile = {
  id: string; firstname: string; lastname: string; surname: string; name: string; username: string;
  avatarUrl: string; coverUrl: string; type: 'certified' | 'certifying' | 'uncertified';
  createdAt: string; views: number; plays: number; promoCode: string; promoCodeAt: string;
  christianPreference: boolean; childLockCode: string; [key: string]: any;
};
export function normalizeProfile(value: unknown): Profile {
  const source = object(value);
  const firstname = string(source.firstname ?? source.first_name);
  const lastname = string(source.lastname ?? source.last_name);
  return {
    ...source, id: string(source.id ?? ''), firstname, lastname, surname: string(source.surname),
    name: [firstname, lastname].filter(Boolean).join(' ') || string(source.name ?? source.username),
    username: string(source.username), avatarUrl: string(source.avatar_url ?? source.avatar),
    coverUrl: string(source.cover_url), type: ['certified', 'certifying'].includes(source.type) ? source.type : 'uncertified',
    createdAt: string(source.created_at), views: Number(source.media_views_count || 0),
    plays: Number(source.media_plays_count || 0), promoCode: string(source.promo_code),
    promoCodeAt: string(source.promo_code_at), christianPreference: source.christian_preference === true || source.christian_preference === 1 || source.christian_preference === '1',
    childLockCode: string(source.child_lock_code ?? source.childLockCode),
  };
}
export async function fetchProfile(id = getCurrentUser().id) {
  const response = await apiRequest<unknown>(userPath(id));
  const profile = normalizeProfile(Array.isArray(response.data) ? response.data[0] : response.data);
  if (id === getCurrentUser().id) await updateCurrentUser({ firstname: profile.firstname, lastname: profile.lastname, username: profile.username, avatar_url: profile.avatarUrl });
  return profile;
}
async function fetchList(path: string) {
  const response = await apiRequest<unknown>(path);
  return { items: array(response.data), count: response.count ?? array(response.data).length, lastPage: response.lastPage ?? 1 };
}
export const fetchSubscriptions = (id: string) => fetchList(`/v1/subscription/user/${encodeURIComponent(id)}/subscriptions`);
export const fetchFollowers = (id: string) => fetchList(`/v1/subscription/user/${encodeURIComponent(id)}/followers`);
export const fetchReferrees = (id: string) => fetchList(`${userPath(id)}/referrees`);
export const fetchCart = (id: string) => fetchList(`${userPath(id)}/cart`);
export const fetchUserProducts = async (id: string): Promise<ApiProduct[]> => (await fetchList(`${userPath(id)}/products`)).items.map(normalizeProduct);
export const fetchUserMedias = async (id: string): Promise<ApiMedia[]> => (await fetchList(`${userPath(id)}/medias`)).items.map(normalizeMedia);
export const fetchUserMediaCount = async (id: string) => (await fetchList(`${userPath(id)}/medias`)).count;
export async function fetchUserPosts(id: string, page = 1): Promise<{ items: ApiPost[]; count: number; lastPage: number }> {
  const result = await fetchList(`${userPath(id)}/posts?page=${page}`);
  return { ...result, items: result.items.map(normalizePost).filter(post => !post.userId || post.userId === id) };
}
export const fetchWatchlist = async (id: string): Promise<ApiMedia[]> => (await fetchList(`${userPath(id)}/watchlist`)).items.map(normalizeMedia);
export const fetchWatchlistCount = async (id: string) => (await fetchList(`${userPath(id)}/watchlist`)).count;
export const fetchPayments = (id: string) => fetchList(`${userPath(id)}/payments`);
export const fetchEarningStats = async (id: string) => object((await apiRequest<unknown>(`${userPath(id)}/earning-stats`)).data);
export const fetchPremiumPricing = async () => (await fetchList('/v1/user/premium/pricing')).items;
export const fetchIdCard = async () => (await apiRequest<unknown>('/v1/user/me/id-card')).data;

export type ChildInvitation = { id: string; status: string; parent: Profile };
function childInvitation(value: unknown): ChildInvitation {
  const source = object(value);
  return { id: string(source.id), status: string(source.status), parent: normalizeProfile(source.parent_user ?? source.parentUser ?? source.parent) };
}
export async function fetchChildInvitations(id: string) {
  const response = await apiRequest<unknown>(`${userPath(id)}/children/invitations`);
  const data = object(response.data);
  const items = array(data.invitations ?? response.data).map(childInvitation);
  return { hasPendingInvitations: Boolean(data.has_pending_invitations), invitations: items };
}
export const acceptChildInvitation = (invitationId: string) => apiRequest(`/v1/user/children/invitations/${encodeURIComponent(invitationId)}/accept`, { method: 'POST' });
export async function searchUsersForChildren(userId: string, word: string) {
  const response = await apiRequest<unknown>(`/v1/user/search/by-word?user_id=${encodeURIComponent(userId)}&word=${encodeURIComponent(word)}`);
  return array(response.data).map(normalizeProfile).filter(user => user.id && user.id !== userId);
}
export const inviteChildren = (childIds: string[]) => apiRequest('/v1/user/children/invitations', { method: 'POST', body: JSON.stringify({ child_ids: childIds }) });
export const toggleChildLock = (id: string) => apiRequest(`${userPath(id)}/child-lock-code`, { method: 'PATCH' });

export async function uploadAvatar(id: string, avatarBase64: string) {
  await apiRequest<unknown>(`${userPath(id)}/avatar`, { method: 'PATCH', body: JSON.stringify({ avatar_base64: avatarBase64 }) });
  return fetchProfile(id);
}
export function uploadIdCard(id: string, file: { uri: string; name: string; mimeType: string }) {
  const form = new FormData();
  form.append('file_type', 'id_card');
  form.append('file_description', "Carte d'identité pour la vérification du compte TALA+");
  form.append('files[]', { uri: file.uri, name: file.name, type: file.mimeType } as unknown as Blob);
  return apiRequest(`${userPath(id)}/file`, { method: 'POST', body: form });
}
export async function activatePremium(id: string, months: number, type: 1 | 2, channel: string, phone?: string) {
  const response = await apiRequest<unknown>(`${userPath(id)}/premium/activate`, { method: 'POST', body: JSON.stringify({ months, type, channel, ...(type === 1 ? { phone: phone?.trim() } : {}) }) });
  const data = object(response.data);
  return { url: string(data.url || object(data.data).url || object(response).url) };
}
export const updateProfile = (id: string, body: Raw) => apiRequest<unknown>(userPath(id), { method: 'PUT', body: JSON.stringify(body) });
export const updatePassword = (id: string, body: Raw) => apiRequest(`${userPath(id)}/password`, { method: 'PATCH', body: JSON.stringify(body) });
export const updateStatus = (id: string, status: 'disabled' | 'deleted') => apiRequest(`${userPath(id)}/status`, { method: 'PATCH', body: JSON.stringify({ status }) });
export const becomeReferrer = (id: string) => apiRequest(`${userPath(id)}/become-referrer`, { method: 'POST' });
