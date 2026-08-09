import i18n from '@/i18n';

export const API_BASE_URL = 'https://admin.talaplus.tv/api';

type ApiResponse<T> = {
  success?: boolean;
  message?: unknown;
  data?: T;
  errors?: Record<string, string[]>;
  lastPage?: number | null;
  count?: number | null;
};

type UserPayload = {
  id?: string | number;
  firstname?: string | null;
  lastname?: string | null;
  surname?: string | null;
  email?: string | null;
  phone?: string | null;
  username?: string | null;
  password?: string | null;
  avatar_url?: string | null;
  avatar?: string | null;
  api_token?: string | null;
  token?: string | null;
  access_token?: string | null;
};

type SignUpResponseData = {
  user?: UserPayload;
  password_reset?: unknown;
};

export type AppUser = {
  id: string;
  firstname: string;
  lastname: string;
  email: string;
  phone: string;
  username: string;
  password?: string;
  avatar_url: string;
  token?: string;
};

export class ApiError extends Error {
  constructor(message: string, public status?: number) {
    super(message);
    this.name = 'ApiError';
  }
}

let currentUser: AppUser | null = null;

const fallbackUser: AppUser = {
  id: 'guest',
  firstname: 'TALA+',
  lastname: 'User',
  email: '',
  phone: '',
  username: 'talaplus',
  avatar_url: '',
};

function formatMessage(message: unknown): string | null {
  if (!message) {
    return null;
  }

  if (typeof message === 'string') {
    return message;
  }

  if (Array.isArray(message)) {
    return message.map(formatMessage).filter(Boolean).join('\n') || null;
  }

  if (typeof message === 'object') {
    return Object.values(message)
      .map(formatMessage)
      .filter(Boolean)
      .join('\n') || null;
  }

  return String(message);
}

function formatErrors(errors?: Record<string, string[]>): string | null {
  if (!errors) {
    return null;
  }

  return Object.values(errors).flat().join('\n') || null;
}

function getErrorMessage(body: ApiResponse<unknown> | null, fallback: string) {
  return formatErrors(body?.errors) ?? formatMessage(body?.message) ?? fallback;
}

function normalizeUser(payload: unknown): AppUser {
  const user = (Array.isArray(payload) ? payload[0] : payload) as UserPayload | undefined;

  if (!user || typeof user !== 'object') {
    throw new ApiError('La r\u00e9ponse du serveur ne contient pas les donn\u00e9es utilisateur.');
  }

  const firstname = user.firstname ?? '';
  const lastname = user.lastname ?? user.surname ?? '';
  const username = user.username ?? user.email ?? user.phone ?? '';

  return {
    id: String(user.id ?? username ?? Date.now()),
    firstname,
    lastname,
    email: user.email ?? '',
    phone: user.phone ?? '',
    username,
    password: user.password ?? undefined,
    avatar_url: user.avatar_url ?? user.avatar ?? '',
    token: user.api_token ?? user.token ?? user.access_token ?? undefined,
  };
}

export async function apiRequest<T>(path: string, init: RequestInit = {}) {
  let response: Response;
  const isFormData = typeof FormData !== 'undefined' && init.body instanceof FormData;
  const headers = {
    Accept: 'application/json',
    ...(!isFormData ? { 'Content-Type': 'application/json' } : {}),
    'X-localization': i18n.language || 'fr',
    ...(currentUser?.token ? { Authorization: `Bearer ${currentUser.token}` } : {}),
    ...init.headers,
  };

  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      credentials: 'include',
      ...init,
      headers,
    });
  } catch {
    throw new ApiError('Impossible de joindre le serveur. Verifie ta connexion internet.');
  }

  const contentType = response.headers.get('content-type') ?? '';
  const body = contentType.includes('application/json')
    ? ((await response.json()) as ApiResponse<T>)
    : null;

  if (!response.ok || body?.success === false) {
    throw new ApiError(getErrorMessage(body, 'La requ\u00eate a \u00e9chou\u00e9.'), response.status);
  }

  if (!body) {
    throw new ApiError('La r\u00e9ponse du serveur est invalide.', response.status);
  }

  return body;
}

export async function signIn(identifier: string, password: string) {
  const body = await apiRequest<UserPayload>('/v1/user/login', {
    method: 'POST',
    body: JSON.stringify({
      username: identifier.trim(),
      password,
    }),
  });

  currentUser = normalizeUser(body.data);
  return currentUser;
}

export async function signInAsVisitor(username: string) {
  const body = await apiRequest<UserPayload>(`/v1/user/username/${encodeURIComponent(username.trim())}`);

  currentUser = normalizeUser(body.data);
  return currentUser;
}

export async function signUp(data: Partial<Pick<AppUser, 'firstname' | 'lastname' | 'email' | 'phone' | 'password'>> & Pick<AppUser, 'username'>) {
  const password = data.password?.trim() ?? '';
  const payload: Record<string, string> = {
    username: data.username.trim().toLowerCase(),
  };

  if (data.firstname?.trim()) {
    payload.firstname = data.firstname.trim();
  }

  if (data.lastname?.trim()) {
    payload.lastname = data.lastname.trim();
  }

  if (data.email?.trim()) {
    payload.email = data.email.trim().toLowerCase();
  }

  if (data.phone?.trim()) {
    payload.phone = data.phone.trim();
  }

  if (password) {
    payload.password = password;
    payload.password_confirmation = password;
    payload.confirm_password = password;
  }

  const body = await apiRequest<SignUpResponseData>('/v1/user', {
    method: 'POST',
    body: JSON.stringify(payload),
  });

  currentUser = normalizeUser(body.data?.user ?? body.data);
  return currentUser;
}

export function signOut() {
  currentUser = null;
}

export function getCurrentUser() {
  return currentUser ?? fallbackUser;
}

/** A session is kept for the whole lifetime of the application.  Routing must
 * use this instead of treating the welcome screen as a logout action. */
export function hasActiveSession() {
  return currentUser !== null;
}
