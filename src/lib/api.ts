import { apiRequest } from '@/lib/session';
import { getCurrentUser } from '@/lib/session';
import i18n from '@/i18n';

export type ApiMedia = {
  id: string;
  title: string;
  description: string;
  thumbnail: string;
  videoUrl?: string;
  type?: string;
  category?: string;
  createdAt?: string;
  belongsTo?: string;
  author?: string;
  likes?: number;
  views?: number;
  isInWatchlist?: boolean;
  userId?: string;
  username?: string;
  avatarUrl?: string;
  categories?: ApiCategory[];
  duration?: number;
  isLiked?: boolean;
  isFree?: boolean;
  price?: number;
  forYouth?: boolean;
  isAudio?: boolean;
};

export type ApiProduct = {
  id: string;
  name: string;
  description: string;
  image: string;
  price: number;
  currency: string;
  category?: string;
  reductionRate: number;
  reductionStart?: string;
  reductionEnd?: string;
  rating?: number;
};

export type ApiCategory = {
  id: string;
  name: string;
  icon: string;
  color: string;
  type?: string;
};

export type ApiHashtag = {
  id: string;
  name: string;
};

export type ApiPostFile = {
  id: string;
  url: string;
  type: string;
};

export type ApiPost = {
  id: string;
  author: string;
  username: string;
  body: string;
  image?: string;
  files: ApiPostFile[];
  time?: string;
  explicitTime?: string;
  likes?: number;
  comments?: number;
  shares?: number;
  commentType?: string;
  targetType?: 'media' | 'product' | 'comment';
  liked?: boolean;
  mediaId?: string;
  productId?: string;
  avatarUrl?: string;
};

export type ApiMediaStats = {
  views: number;
  plays: number;
  likes: number;
  liked: boolean;
};

export type ApiNotification = {
  id: string;
  type: string;
  text: string;
  strongText?: string;
  image?: string;
  icon?: string;
  iconColor?: string;
  route?: string;
  unread: boolean;
  canMute: boolean;
  fromUserId?: string;
  toUserId?: string;
  time?: string;
};

export type ApiUserProfile = {
  id: string;
  name: string;
  username: string;
  avatarUrl: string;
  coverUrl: string;
  country?: string;
  city?: string;
  category?: string;
  rating?: number;
  reviews?: number;
  description?: string;
};

export type ApiConversation = {
  key: string;
  kind: 'user' | 'group';
  title: string;
  subtitle: string;
  avatarUrl?: string;
  peerUserId?: string;
  groupId?: string;
  unreadCount: number;
  time?: string;
  lastMessage?: ApiMessage;
};

export type ApiMessage = {
  id: string;
  content: string;
  type: string;
  status: 'read' | 'unread';
  userId: string;
  addresseeUserId?: string;
  addresseeGroupId?: string;
  createdAt?: string;
};

export type ApiPayment = {
  id: string;
  title: string;
  amount: number;
  currency: string;
  status: string;
  time?: string;
};

export type PaginatedResult<T> = {
  items: T[];
  lastPage: number;
  count: number;
};

const categoryColors = ['#B026FF', '#2677D7', '#F36A25', '#38A35A', '#F6A128', '#127B8F'];

function pickString(source: Record<string, unknown>, keys: string[], fallback = '') {
  for (const key of keys) {
    const value = source[key];
    if (typeof value === 'string' && value.trim()) {
      return value.trim();
    }
    if (typeof value === 'number') {
      return String(value);
    }
  }

  return fallback;
}

function localizedValue(value: unknown, fallback = ''): string {
  if (typeof value === 'string') {
    const trimmed = value.trim();

    if (!trimmed) {
      return fallback;
    }

    if (trimmed.startsWith('{') && trimmed.endsWith('}')) {
      try {
        return localizedValue(JSON.parse(trimmed), fallback);
      } catch {
        return trimmed;
      }
    }

    return trimmed;
  }

  if (typeof value === 'number') {
    return String(value);
  }

  if (value && typeof value === 'object' && !Array.isArray(value)) {
    const source = value as Record<string, unknown>;
    const language = (i18n.language || 'fr').split('-')[0];
    const candidates = [language, 'fr', 'en', 'ln'];

    for (const key of candidates) {
      const localized = localizedValue(source[key]);
      if (localized) {
        return localized;
      }
    }

    for (const item of Object.values(source)) {
      const localized = localizedValue(item);
      if (localized) {
        return localized;
      }
    }
  }

  return fallback;
}

function pickLocalizedString(source: Record<string, unknown>, keys: string[], fallback = '') {
  for (const key of keys) {
    const value = localizedValue(source[key]);
    if (value) {
      return value;
    }
  }

  return fallback;
}

function pickNumber(source: Record<string, unknown>, keys: string[], fallback = 0) {
  for (const key of keys) {
    const value = source[key];
    if (typeof value === 'number') {
      return value;
    }
    if (typeof value === 'string' && value.trim() && !Number.isNaN(Number(value))) {
      return Number(value);
    }
  }

  return fallback;
}

function pickObject(source: Record<string, unknown>, keys: string[]) {
  for (const key of keys) {
    const value = source[key];
    if (value && typeof value === 'object' && !Array.isArray(value)) {
      return value as Record<string, unknown>;
    }
  }

  return null;
}

function pickImage(source: Record<string, unknown>) {
  const direct = pickString(source, ['thumbnail', 'thumbnail_url', 'image', 'image_url', 'cover', 'cover_url', 'poster', 'poster_url', 'avatar_url', 'file_url']);
  if (direct) {
    return direct;
  }

  const media = source.media ?? source.files ?? source.images ?? source.photos;
  if (Array.isArray(media)) {
    const image = media.find((item) => {
      if (!item || typeof item !== 'object') {
        return false;
      }

      const fileType = pickString(item as Record<string, unknown>, ['file_type', 'type']);
      return !fileType || ['photo', 'image', 'cover', 'poster'].includes(fileType);
    }) as Record<string, unknown> | undefined;

    return image ? pickString(image, ['url', 'path', 'file_url', 'image_url', 'thumbnail']) : '';
  }

  return '';
}

function pickVideo(source: Record<string, unknown>) {
  const direct = pickString(source, ['video_url', 'videoUrl', 'media_url', 'url', 'file_url']);
  if (direct) {
    return direct;
  }

  const files = source.media ?? source.files ?? source.videos;
  if (Array.isArray(files)) {
    const video = files.find((item) => {
      if (!item || typeof item !== 'object') {
        return false;
      }

      const fileType = pickString(item as Record<string, unknown>, ['file_type', 'type']);
      return ['video', 'media'].includes(fileType);
    }) as Record<string, unknown> | undefined;

    return video ? pickString(video, ['url', 'path', 'file_url', 'media_url']) : '';
  }

  return '';
}

function appendFormValue(form: FormData, key: string, value: unknown) {
  if (value === undefined || value === null || value === '') {
    return;
  }

  if (Array.isArray(value)) {
    value.forEach((item) => appendFormValue(form, `${key}[]`, item));
    return;
  }

  form.append(key, String(value));
}

function appendFormFiles(form: FormData, files?: unknown[]) {
  files?.forEach((file) => {
    if (!file || typeof file !== 'object') {
      return;
    }

    form.append('files[]', file as Blob);
  });
}

function pickUserName(source: Record<string, unknown>) {
  const firstname = pickString(source, ['firstname', 'first_name']);
  const lastname = pickString(source, ['lastname', 'surname', 'last_name']);
  const fullName = [firstname, lastname].filter(Boolean).join(' ').trim();

  return fullName || pickString(source, ['name', 'username'], 'TALA+');
}

function normalizeCategories(value: unknown): ApiCategory[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.map(normalizeCategory);
}

function pickBoolean(source: Record<string, unknown>, keys: string[], fallback = false) {
  for (const key of keys) {
    const value = source[key];
    if (typeof value === 'boolean') {
      return value;
    }
    if (typeof value === 'number') {
      return value === 1;
    }
    if (typeof value === 'string' && value.trim()) {
      return ['1', 'true', 'yes'].includes(value.trim().toLowerCase());
    }
  }

  return fallback;
}

function isCurrentUserReaction(item: unknown) {
  const source = (item && typeof item === 'object' ? item : {}) as Record<string, unknown>;
  const user = pickObject(source, ['user']);
  const current = getCurrentUser();
  const userId = pickString(user ?? source, ['user_id', 'userId', 'id']);

  return userId === current.id;
}

function asArray(data: unknown): unknown[] {
  if (Array.isArray(data)) {
    return data;
  }

  if (data && typeof data === 'object') {
    const object = data as Record<string, unknown>;
    if (Array.isArray(object.data)) {
      return object.data;
    }
    if (Array.isArray(object.items)) {
      return object.items;
    }
    if (Array.isArray(object.results)) {
      return object.results;
    }
  }

  return [];
}

function pickArray(source: Record<string, unknown>, keys: string[]) {
  for (const key of keys) {
    const value = source[key];
    if (Array.isArray(value)) {
      return value;
    }
    if (value && typeof value === 'object') {
      const nested = asArray(value);
      if (nested.length) {
        return nested;
      }
    }
  }

  return [];
}

function pageParam(page?: number) {
  return page && page > 1 ? `?page=${page}` : '';
}

function withQuery(path: string, params: Record<string, string | number | undefined>) {
  const query = Object.entries(params)
    .filter(([, value]) => value !== undefined && String(value).trim())
    .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(String(value))}`)
    .join('&');

  return query ? `${path}?${query}` : path;
}

function currentUserParam() {
  return getCurrentUser().id;
}

function withCurrentUser(params: Record<string, string | number | undefined> = {}) {
  return { user_id: currentUserParam(), ...params };
}

export function normalizeMedia(item: unknown): ApiMedia {
  const root = (item && typeof item === 'object' ? item : {}) as Record<string, unknown>;
  const source = pickObject(root, ['media']) ?? root;
  const progress = pickObject(root, ['progress']);
  const user = pickObject(source, ['user', 'author', 'publisher']);
  const categories = normalizeCategories(source.categories ?? source.category_media);

  return {
    id: pickString(source, ['id', 'uuid'], `${Date.now()}`),
    title: pickLocalizedString(source, ['media_title', 'title', 'name'], 'Sans titre'),
    description: pickLocalizedString(source, ['media_description', 'description', 'body', 'content', 'caption']),
    thumbnail: pickImage(source),
    videoUrl: pickVideo(source),
    type: pickString(source, ['type', 'media_type']),
    category: pickLocalizedString(pickObject(source, ['category']) ?? source, ['category_name', 'name']),
    createdAt: pickString(source, ['created_at', 'createdAt']),
    belongsTo: pickString(source, ['belongs_to', 'belongsTo']),
    author: pickString(source, ['author_names', 'author']),
    likes: pickNumber(source, ['likes', 'like_count', 'reactions_count']),
    duration: pickNumber(source, ['media_length', 'duration', 'length']),
    views: pickNumber(progress ?? source, ['views', 'view_count', 'progress_count']),
    isInWatchlist: pickBoolean(progress ?? source, ['is_in_watchlist', 'isInWatchlist', 'in_watchlist']),
    isLiked: pickBoolean(progress ?? source, ['is_liked', 'liked', 'has_liked']),
    userId: pickString(user ?? source, ['user_id', 'id']),
    username: pickString(user ?? source, ['username', 'email']),
    avatarUrl: pickString(user ?? source, ['avatar_url', 'avatar']),
    categories,
    isFree: pickBoolean(source, ['is_free'], true),
    price: pickNumber(source, ['price']),
    forYouth: pickBoolean(source, ['for_youth']),
    isAudio: pickBoolean(source, ['is_audio', 'isAudio']),
  };
}

export function normalizeProduct(item: unknown): ApiProduct {
  const source = (item && typeof item === 'object' ? item : {}) as Record<string, unknown>;
  const category = pickObject(source, ['category']);

  return {
    id: pickString(source, ['id', 'uuid'], `${Date.now()}`),
    name: pickLocalizedString(source, ['product_name', 'name', 'title'], 'Produit'),
    description: pickLocalizedString(source, ['product_description', 'description', 'body', 'content']),
    image: pickImage(source),
    price: pickNumber(source, ['price', 'unit_price', 'amount']),
    currency: pickString(source, ['currency', 'devise'], 'USD'),
    category: pickLocalizedString(category ?? source, ['name', 'category_name']),
    reductionRate: pickNumber(source, ['reduction_rate', 'discount', 'discount_rate']),
    reductionStart: pickString(source, ['price_reduction_start', 'reduction_start']),
    reductionEnd: pickString(source, ['price_reduction_end', 'reduction_end']),
    rating: pickNumber(source, ['rating', 'rate'], 4.5),
  };
}

export function normalizeCategory(item: unknown, index = 0): ApiCategory {
  const source = (item && typeof item === 'object' ? item : {}) as Record<string, unknown>;

  return {
    id: pickString(source, ['id', 'uuid'], `${index}`),
    name: pickLocalizedString(source, ['name', 'title', 'category_name'], 'Cat\u00e9gorie'),
    icon: pickString(source, ['icon', 'icon_name'], 'shapes'),
    color: pickString(source, ['color', 'hex_color'], categoryColors[index % categoryColors.length]),
    type: pickString(source, ['type', 'for_type', 'forType']),
  };
}

export function normalizeHashtag(item: unknown, index = 0): ApiHashtag {
  const source = (item && typeof item === 'object' ? item : {}) as Record<string, unknown>;
  const name = pickString(source, ['keyword', 'hashtag_name', 'name', 'label', 'tag', 'hashtag'], `tag${index + 1}`).replace(/^#/, '');
  return { id: pickString(source, ['id', 'uuid'], name), name };
}

function normalizePostFile(item: unknown, index = 0): ApiPostFile {
  const source = (item && typeof item === 'object' ? item : {}) as Record<string, unknown>;

  return {
    id: pickString(source, ['id', 'uuid'], `${index}`),
    url: pickString(source, ['file_url', 'url', 'path', 'image_url', 'media_url']),
    type: pickString(source, ['file_type', 'type'], 'photo'),
  };
}

function normalizePostFiles(source: Record<string, unknown>) {
  return pickArray(source, ['files', 'file', 'media', 'images', 'photos', 'videos'])
    .map(normalizePostFile)
    .filter((file) => file.url);
}

export function normalizePost(item: unknown): ApiPost {
  const source = (item && typeof item === 'object' ? item : {}) as Record<string, unknown>;
  const user = pickObject(source, ['user', 'author']);
  const mediaId = pickString(source, ['media_id', 'mediaId']);
  const productId = pickString(source, ['product_id', 'productId']);
  const files = normalizePostFiles(source);

  return {
    id: pickString(source, ['id', 'uuid'], `${Date.now()}`),
    author: pickUserName(user ?? source),
    username: pickString(user ?? source, ['username', 'email'], 'tala_officiel'),
    body: pickLocalizedString(source, ['comment_content', 'body', 'comment', 'content', 'description', 'text']),
    image: files.find((file) => ['photo', 'image'].includes(file.type))?.url ?? pickImage(source),
    files,
    time: pickString(source, ['created_at', 'createdAt'], ''),
    explicitTime: pickString(source, ['created_at_explicit', 'createdAtExplicit', 'created_at', 'createdAt'], ''),
    likes: pickNumber(source, ['likes', 'like_count', 'likes_count']),
    comments: pickNumber(source, ['comments', 'comment_count']),
    shares: pickNumber(source, ['shares', 'share_count']),
    commentType: pickString(source, ['type']),
    targetType: mediaId || pickString(source, ['for_entity']) === 'media' ? 'media' : productId || pickString(source, ['for_entity']) === 'product' ? 'product' : 'comment',
    liked: pickBoolean(source, ['liked', 'is_liked', 'has_liked', 'current_user_liked']),
    mediaId,
    productId,
    avatarUrl: pickString(user ?? source, ['avatar_url', 'avatar']),
  };
}

function userFullName(user: Record<string, unknown> | null, fallback = 'TALA+') {
  if (!user) return fallback;
  const name = [pickString(user, ['firstname', 'first_name']), pickString(user, ['lastname', 'surname', 'last_name'])].filter(Boolean).join(' ').trim();
  return name || pickString(user, ['username', 'email'], fallback);
}

function productKind(product: Record<string, unknown> | null) {
  return pickString(product ?? {}, ['type']) === 'service' ? 'service' : 'produit';
}

function localizedProductKind(product: Record<string, unknown> | null, article = false) {
  const kind = productKind(product);
  const language = (i18n.language || 'fr').split('-')[0];

  if (language === 'en') {
    return kind === 'service' ? 'service' : 'product';
  }

  if (language === 'ln') {
    return kind === 'service' ? 'service' : 'biloko';
  }

  if (!article) {
    return kind;
  }

  return kind === 'service' ? 'un service' : 'un produit';
}

function notificationTarget(source: Record<string, unknown>) {
  const media = pickObject(source, ['media']);
  const product = pickObject(source, ['product']);
  const comment = pickObject(source, ['comment']);
  const mediaId = pickString(media ?? source, ['media_id', 'mediaId', 'id']);
  const productId = pickString(product ?? source, ['product_id', 'productId', 'id']);
  const commentId = pickString(comment ?? source, ['comment_id', 'commentId', 'id']);
  const commentType = pickString(comment ?? source, ['type']);
  const answeredFor = pickString(comment ?? source, ['answered_for', 'answeredFor']);

  if (mediaId) {
    return {
      kind: 'media',
      ownedFr: 'vidéo',
      reportFr: 'une vidéo',
      mentionFr: 'sa vidéo',
      route: `/mediaDetails/${mediaId}`,
    };
  }

  if (productId) {
    const label = localizedProductKind(product);
    const articleLabel = localizedProductKind(product, true);
    return {
      kind: 'product',
      ownedFr: label,
      reportFr: articleLabel,
      mentionFr: productKind(product) === 'service' ? 'son service' : 'son produit',
      route: `/productDetails/${productId}`,
    };
  }

  if (commentId) {
    const isComment = commentType === 'comment';
    const postId = isComment && answeredFor ? answeredFor : commentId;
    return {
      kind: 'comment',
      ownedFr: isComment ? 'commentaire' : 'post',
      reportFr: isComment ? 'un commentaire' : 'un post',
      mentionFr: isComment ? 'son commentaire' : 'son post',
      route: `/posts/${postId}`,
    };
  }

  return {
    kind: 'unknown',
    ownedFr: 'contenu',
    reportFr: 'un contenu',
    mentionFr: 'son contenu',
    route: undefined,
  };
}

function formatNotificationTime(value: string) {
  if (!value) return '';

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;

  const now = new Date();
  const language = (i18n.language || 'fr').split('-')[0];
  const seconds = Math.max(0, Math.floor((now.getTime() - date.getTime()) / 1000));
  const sameDay = date.toDateString() === now.toDateString();
  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  const isYesterday = date.toDateString() === yesterday.toDateString();
  const hhmm = `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
  const ddmmyyyy = `${String(date.getDate()).padStart(2, '0')}/${String(date.getMonth() + 1).padStart(2, '0')}/${date.getFullYear()}`;

  if (sameDay) {
    if (seconds >= 3600) {
      const hours = Math.floor(seconds / 3600);
      if (language === 'en') return `${hours} ${hours > 1 ? 'hours' : 'hour'} ago`;
      if (language === 'ln') return `Eleki ngonga ${hours}`;
      return `Il y a ${hours} heure${hours > 1 ? 's' : ''}`;
    }

    if (seconds >= 60) {
      const minutes = Math.floor(seconds / 60);
      if (language === 'en') return `${minutes} ${minutes > 1 ? 'minutes' : 'minute'} ago`;
      if (language === 'ln') return `Eleki miniti ${minutes}`;
      return `Il y a ${minutes} minute${minutes > 1 ? 's' : ''}`;
    }

    if (language === 'en') return `${seconds} ${seconds > 1 ? 'seconds' : 'second'} ago`;
    if (language === 'ln') return `Eleki segonde ${seconds}`;
    return `Il y a ${seconds} seconde${seconds > 1 ? 's' : ''}`;
  }

  if (isYesterday) {
    if (language === 'en') return `Yesterday at ${hhmm}`;
    if (language === 'ln') return `Lobi na ${hhmm}`;
    return `Hier à ${hhmm}`;
  }

  if (language === 'en') return `On ${ddmmyyyy} at ${hhmm}`;
  if (language === 'ln') return `${ddmmyyyy} na ${hhmm}`;
  return `Le ${ddmmyyyy} à ${hhmm}`;
}

function notificationImage(source: Record<string, unknown>, type: string) {
  const fromUser = pickObject(source, ['from_user', 'fromUser', 'user']);
  const media = pickObject(source, ['media']);
  const product = pickObject(source, ['product']);
  const comment = pickObject(source, ['comment']);

  if (type === 'welcome_new_user') return '';
  if (type === 'media_created') return pickString(fromUser ?? {}, ['avatar_url', 'avatar']);
  if (type.startsWith('media_')) return pickImage(media ?? source);
  if (['post_sent', 'comment_sent', 'like_sent', 'gift_sent', 'new_follower', 'mention'].includes(type)) return pickString(fromUser ?? {}, ['avatar_url', 'avatar']);
  if (type === 'report_sent') return pickImage(media ?? product ?? comment ?? source);
  if (type.startsWith('product_') || type === 'stock_empty') return pickImage(product ?? source);
  return pickImage(source);
}

function notificationRoute(source: Record<string, unknown>, type: string) {
  const media = pickObject(source, ['media']);
  const product = pickObject(source, ['product']);
  const comment = pickObject(source, ['comment']);
  const mediaId = pickString(media ?? source, ['media_id', 'mediaId', 'id']);
  const productId = pickString(product ?? source, ['product_id', 'productId', 'id']);
  const commentId = pickString(comment ?? source, ['comment_id', 'commentId', 'id']);
  const fromUser = pickObject(source, ['from_user', 'fromUser']);

  if (type === 'welcome_new_user') return '/about';
  if (type === 'new_follower') {
    const fromUserId = pickString(fromUser ?? source, ['from_user_id', 'fromUserId', 'user_id', 'id']);
    return fromUserId ? `/user/${fromUserId}` : undefined;
  }
  if (type.startsWith('payment_')) return '/payments';
  if (type.startsWith('product_') || type === 'stock_empty') return productId ? `/productDetails/${productId}` : undefined;
  if (type === 'post_sent' || type === 'comment_sent') return commentId ? `/posts/${commentId}` : undefined;
  if (['like_sent', 'gift_sent', 'report_sent', 'mention'].includes(type)) return notificationTarget(source).route;
  if (type.startsWith('media_')) return mediaId ? `/mediaDetails/${mediaId}` : undefined;
  return undefined;
}

export function normalizeNotification(item: unknown): ApiNotification {
  const source = (item && typeof item === 'object' ? item : {}) as Record<string, unknown>;
  const type = pickString(source, ['type']);
  const fromUser = pickObject(source, ['from_user', 'fromUser']);
  const toUser = pickObject(source, ['to_user', 'toUser']);
  const media = pickObject(source, ['media']);
  const product = pickObject(source, ['product']);
  const comment = pickObject(source, ['comment']);
  const answered = pickObject(source, ['answered_for_comment', 'answeredForComment']);
  const fromName = userFullName(fromUser);
  const toName = userFullName(toUser, userFullName(pickObject(source, ['user'])));
  const mediaTitle = pickLocalizedString(media ?? source, ['media_title', 'title', 'name'], 'vid\u00e9o');
  const productName = pickLocalizedString(product ?? source, ['product_name', 'name', 'title'], productKind(product));
  const kind = productKind(product);
  const answeredKind = pickString(answered ?? {}, ['type']) === 'comment' ? 'commentaire' : 'post';
  const target = notificationTarget(source);
  const language = (i18n.language || 'fr').split('-')[0];
  const productLabel = language === 'en' ? (kind === 'service' ? 'service' : 'product') : language === 'ln' ? (kind === 'service' ? 'service' : 'biloko') : kind;
  const answeredLabel = language === 'en' ? (answeredKind === 'commentaire' ? 'comment' : 'post') : language === 'ln' ? (answeredKind === 'commentaire' ? 'commentaire' : 'post') : answeredKind;
  const targetLabel = language === 'en' ? (target.kind === 'media' ? 'video' : target.kind === 'product' ? productLabel : target.ownedFr === 'commentaire' ? 'comment' : 'post') : language === 'ln' ? target.ownedFr : target.ownedFr;

  const messages: Record<string, { text: string; strongText?: string; canMute?: boolean; icon?: string; iconColor?: string }> = {
    welcome_new_user: { text: language === 'en' ? `Welcome to TALA+ ${toName}` : language === 'ln' ? `Boyei malamu na TALA+ ${toName}` : `Bienvenue sur la plateforme TALA+ ${toName}`, strongText: toName },
    media_created: { text: language === 'en' ? `${fromName} sent a video` : language === 'ln' ? `${fromName} atindi video` : `${fromName} a envoy\u00e9 une vid\u00e9o`, strongText: fromName },
    media_accepted: { text: language === 'en' ? `Your video ${mediaTitle} was accepted` : language === 'ln' ? `Video na yo ${mediaTitle} endimami` : `Votre vid\u00e9o ${mediaTitle} a \u00e9t\u00e9 accept\u00e9e`, strongText: mediaTitle },
    media_rejected: { text: language === 'en' ? `Your video ${mediaTitle} was rejected` : language === 'ln' ? `Video na yo ${mediaTitle} eboyami` : `Votre vid\u00e9o ${mediaTitle} a \u00e9t\u00e9 refus\u00e9e`, strongText: mediaTitle },
    media_published: { text: language === 'en' ? `${fromName} published a new video` : language === 'ln' ? `${fromName} abimisi video ya sika` : `${fromName} a publi\u00e9 une nouvelle vid\u00e9o`, strongText: fromName, canMute: true },
    post_sent: { text: language === 'en' ? `${fromName} sent a new post` : language === 'ln' ? `${fromName} atindi post ya sika` : `${fromName} a envoy\u00e9 un nouveau post`, strongText: fromName, canMute: true },
    comment_sent: { text: language === 'en' ? `${fromName} commented on your ${answeredLabel}` : language === 'ln' ? `${fromName} akomi commentaire na ${answeredLabel} na yo` : `${fromName} a comment\u00e9 votre ${answeredLabel}`, strongText: fromName, canMute: true },
    like_sent: { text: language === 'en' ? `${fromName} liked your ${targetLabel}` : language === 'ln' ? `${fromName} alingi ${targetLabel} na yo` : `${fromName} a aim\u00e9 votre ${targetLabel}`, strongText: fromName, canMute: true },
    gift_sent: { text: language === 'en' ? `${fromName} sent a gift to your ${targetLabel}` : language === 'ln' ? `${fromName} atindeli ${targetLabel} na yo cadeau` : `${fromName} a envoy\u00e9 un cadeau \u00e0 votre ${targetLabel}`, strongText: fromName, canMute: true },
    report_sent: { text: language === 'en' ? `${fromName} reported ${targetLabel}` : language === 'ln' ? `${fromName} asali signalement ya ${targetLabel}` : `${fromName} a signal\u00e9 ${target.reportFr}`, strongText: fromName, canMute: true },
    new_follower: { text: language === 'en' ? `${fromName} followed your account` : language === 'ln' ? `${fromName} alandi compte na yo` : `${fromName} s'est abonn\u00e9 \u00e0 votre compte`, strongText: fromName, canMute: true },
    mention: { text: language === 'en' ? `${fromName} mentioned you in their ${targetLabel}` : language === 'ln' ? `${fromName} atangi yo na ${targetLabel}` : `${fromName} vous a mentionn\u00e9 dans ${target.mentionFr}`, strongText: fromName, canMute: true },
    product_added: { text: language === 'en' ? `${fromName} sent a ${productLabel}` : language === 'ln' ? `${fromName} atindi ${productLabel}` : `${fromName} a envoy\u00e9 un ${productLabel}`, strongText: fromName },
    product_accepted: { text: language === 'en' ? `Your ${productLabel} ${productName} was accepted` : language === 'ln' ? `${productLabel} na yo ${productName} endimami` : `Votre ${productLabel} ${productName} a \u00e9t\u00e9 accept\u00e9`, strongText: productName },
    product_rejected: { text: language === 'en' ? `Your ${productLabel} ${productName} was rejected` : language === 'ln' ? `${productLabel} na yo ${productName} eboyami` : `Votre ${productLabel} ${productName} a \u00e9t\u00e9 refus\u00e9`, strongText: productName },
    product_ordered: { text: language === 'en' ? `${fromName} ordered your ${productLabel}` : language === 'ln' ? `${fromName} asombi ${productLabel} na yo` : `${fromName} a command\u00e9 votre ${productLabel}`, strongText: fromName },
    stock_empty: { text: language === 'en' ? 'Your product stock is almost empty' : language === 'ln' ? 'Stock ya produit na yo elingi kosila' : 'Le stock pour votre produit est bient\u00f4t arriv\u00e9 \u00e0 terme' },
    payment_pending: { text: language === 'en' ? 'Your payment is pending' : language === 'ln' ? 'Lifuti na yo ezali kozela' : 'Votre paiement est en cours', icon: 'dollar-sign', iconColor: '#F6C343' },
    payment_successful: { text: language === 'en' ? 'Your payment succeeded' : language === 'ln' ? 'Lifuti na yo elongi' : 'Votre paiement a r\u00e9ussi', icon: 'dollar-sign', iconColor: '#22C55E' },
    payment_failed: { text: language === 'en' ? 'Your payment failed' : language === 'ln' ? 'Lifuti na yo elongi te' : 'Votre paiement a \u00e9chou\u00e9', icon: 'dollar-sign', iconColor: '#EF4444' },
  };
  const message = messages[type] ?? { text: pickLocalizedString(source, ['message', 'notification_content', 'content'], 'Notification') };

  return {
    id: pickString(source, ['id', 'uuid'], `${Date.now()}`),
    type,
    text: message.text,
    strongText: message.strongText,
    image: notificationImage(source, type),
    icon: message.icon,
    iconColor: message.iconColor,
    route: notificationRoute(source, type),
    unread: !pickBoolean(source, ['read', 'is_read', 'seen']) && !pickString(source, ['read_at', 'seen_at']),
    canMute: Boolean(message.canMute),
    fromUserId: pickString(fromUser ?? source, ['from_user_id', 'fromUserId', 'user_id', 'id']),
    toUserId: pickString(toUser ?? source, ['to_user_id', 'toUserId', 'user_id', 'id']),
    time: formatNotificationTime(pickString(source, ['created_at', 'createdAt', 'created_at_explicit'])),
  };
}

function normalizePayment(item: unknown): ApiPayment {
  const source = (item && typeof item === 'object' ? item : {}) as Record<string, unknown>;
  return {
    id: pickString(source, ['id', 'uuid'], `${Date.now()}`),
    title: pickLocalizedString(source, ['payment_title', 'title', 'description', 'label'], 'Paiement'),
    amount: pickNumber(source, ['amount', 'price', 'total']),
    currency: pickString(source, ['currency', 'devise'], 'USD'),
    status: pickString(source, ['status', 'state'], 'pending'),
    time: pickString(source, ['created_at_explicit', 'created_at', 'createdAt']),
  };
}

function normalizeMessage(item: unknown): ApiMessage {
  const source = (item && typeof item === 'object' ? item : {}) as Record<string, unknown>;

  return {
    id: pickString(source, ['id', 'uuid'], `${Date.now()}`),
    content: pickLocalizedString(source, ['message_content', 'content', 'message', 'body', 'file_description']),
    type: pickString(source, ['type'], 'text'),
    status: pickString(source, ['status'], 'unread') === 'read' ? 'read' : 'unread',
    userId: pickString(source, ['user_id', 'userId']),
    addresseeUserId: pickString(source, ['addressee_user_id', 'addresseeUserId']),
    addresseeGroupId: pickString(source, ['addressee_group_id', 'addresseeGroupId']),
    createdAt: pickString(source, ['created_at_explicit', 'created_at', 'createdAt']),
  };
}

function normalizeConversation(item: unknown): ApiConversation {
  const source = (item && typeof item === 'object' ? item : {}) as Record<string, unknown>;
  const lastMessage = normalizeMessage(pickObject(source, ['last_message', 'lastMessage']) ?? source);
  const key = pickString(source, ['conversation_key', 'conversationKey'], lastMessage.addresseeGroupId ? `group:${lastMessage.addresseeGroupId}` : `user:${lastMessage.addresseeUserId || lastMessage.userId}`);
  const kind = key.startsWith('group:') || lastMessage.addresseeGroupId ? 'group' : 'user';
  const addresseeUser = pickObject(source, ['addressee_user', 'addresseeUser']) ?? pickObject(pickObject(source, ['last_message', 'lastMessage']) ?? {}, ['addressee_user', 'addresseeUser']);
  const user = pickObject(source, ['user']) ?? pickObject(pickObject(source, ['last_message', 'lastMessage']) ?? {}, ['user']);
  const group = pickObject(source, ['addressee_group', 'addresseeGroup']) ?? pickObject(pickObject(source, ['last_message', 'lastMessage']) ?? {}, ['addressee_group', 'addresseeGroup']);
  const peer = kind === 'group' ? group : addresseeUser ?? user;

  return {
    key,
    kind,
    title: kind === 'group' ? pickLocalizedString(peer ?? source, ['name', 'group_name', 'title'], 'Groupe') : userFullName(peer ?? source),
    subtitle: lastMessage.content,
    avatarUrl: pickImage(peer ?? source),
    peerUserId: kind === 'user' ? key.replace('user:', '') : undefined,
    groupId: kind === 'group' ? key.replace('group:', '') : undefined,
    unreadCount: pickNumber(source, ['unread_count', 'unreadCount']),
    time: lastMessage.createdAt,
    lastMessage,
  };
}

function normalizeUserProfile(item: unknown): ApiUserProfile {
  const source = (item && typeof item === 'object' ? item : {}) as Record<string, unknown>;
  const category = pickObject(source, ['category']);

  return {
    id: pickString(source, ['id', 'uuid']),
    name: userFullName(source),
    username: pickString(source, ['username', 'email']),
    avatarUrl: pickString(source, ['avatar_url', 'avatar']),
    coverUrl: pickString(source, ['cover_url', 'cover']),
    country: pickString(source, ['country']),
    city: pickString(source, ['city']),
    category: pickLocalizedString(category ?? source, ['category_name', 'name', 'business_category', 'profession']),
    rating: pickNumber(source, ['rating', 'rate'], 4.5),
    reviews: pickNumber(source, ['reviews', 'reviews_count', 'ratings_count']),
    description: pickLocalizedString(source, ['description', 'bio', 'about']),
  };
}

async function list<T>(path: string, normalize: (item: unknown, index: number) => T, page?: number): Promise<PaginatedResult<T>> {
  const response = await apiRequest<unknown>(`${path}${pageParam(page)}`);
  const items = asArray(response.data).map(normalize);
  return {
    items,
    lastPage: response.lastPage ?? 1,
    count: response.count ?? items.length,
  };
}

export function getPopularMedia(page?: number) {
  return list(withQuery('/v1/media/popular/list', withCurrentUser({ page })), normalizeMedia);
}

export function getRecentMedia(page?: number) {
  return list(withQuery('/v1/media', withCurrentUser({ page })), normalizeMedia);
}

export function getUserMedia(userId: string, page?: number, type?: string) {
  return list(withQuery('/v1/media/filter/list', { user_id: userId, type, page }), normalizeMedia);
}

export function getMediaByType(type: string, page?: number) {
  return list(withQuery('/v1/media/filter/list', withCurrentUser({ type, page })), normalizeMedia);
}

export function getMediaByFlag(flag: 'for_youth' | 'premium', page?: number) {
  return list(withQuery('/v1/media/filter/list', withCurrentUser({
    for_youth: flag === 'for_youth' ? 1 : undefined,
    is_free: flag === 'premium' ? 0 : undefined,
    page,
  })), normalizeMedia).then((result) => ({
    ...result,
    items: result.items.filter((item) => flag === 'for_youth' ? item.forYouth : item.isFree === false),
  }));
}

export function getMediaChildren(mediaId: string, page?: number) {
  return list(withQuery('/v1/media/filter/list', {
    user_id: currentUserParam(),
    belongs_to: mediaId,
    belongsTo: mediaId,
    parent_id: mediaId,
    page,
  }), normalizeMedia).then((result) => ({
    ...result,
    items: result.items.filter((item) => item.belongsTo === mediaId),
  }));
}

export function getRelatedMedia(type: string, excludeBelongsTo?: string, page?: number) {
  return list(withQuery('/v1/media/filter/list', {
    user_id: currentUserParam(),
    type,
    not_belongs_to: excludeBelongsTo,
    except_belongs_to: excludeBelongsTo,
    page,
  }), normalizeMedia).then((result) => ({
    ...result,
    items: result.items.filter((item) => item.type === type && item.id !== excludeBelongsTo && item.belongsTo !== excludeBelongsTo),
  }));
}

export async function getMedia(id: string) {
  const user = getCurrentUser();
  const response = await apiRequest<unknown>(withQuery(`/v1/media/${encodeURIComponent(id)}`, { user_id: user.id }));
  const data = Array.isArray(response.data) ? response.data[0] : response.data;
  return normalizeMedia(data);
}

export function getHashtags(page?: number) {
  return list(withQuery('/v1/hashtag', withCurrentUser({ page })), normalizeHashtag);
}

export async function getHashtagEntities(hashtag: string) {
  const response = await apiRequest<unknown>(withQuery(`/v1/hashtag/${encodeURIComponent(hashtag.replace(/^#/, ''))}/entities`, withCurrentUser()));
  const data = response.data;
  const source = (data && typeof data === 'object' && !Array.isArray(data) ? data : {}) as Record<string, unknown>;
  const media = pickArray(source, ['videos', 'media', 'medias', 'movies']).map(normalizeMedia);
  const posts = pickArray(source, ['comments', 'posts', 'news_feed', 'comment']).map(normalizePost);

  if (!media.length && !posts.length && Array.isArray(data)) {
    const mixed = data as unknown[];
    return {
      media: mixed.filter((item) => pickString((item && typeof item === 'object' ? item : {}) as Record<string, unknown>, ['media_title', 'video_url', 'media_url', 'cover_url'])).map(normalizeMedia),
      posts: mixed.filter((item) => pickString((item && typeof item === 'object' ? item : {}) as Record<string, unknown>, ['comment_content', 'comment', 'body', 'content', 'product_id', 'media_id'])).map(normalizePost),
    };
  }

  return { media, posts };
}

export function getNewsFeed(page?: number) {
  return list(withQuery('/v1/comment/news-feed', withCurrentUser({ page })), normalizePost)
    .catch(() => list(withQuery('/v1/comment', withCurrentUser({ type: 'post', page })), normalizePost))
    .then(async (result) => {
      const posts = result.items.filter((item) => item.commentType === 'post' || !item.commentType);
      const items = await Promise.all(posts.map(enrichPostFiles));

      return { ...result, items };
    });
}

export async function getPost(id: string) {
  const response = await apiRequest<unknown>(withQuery(`/v1/comment/${encodeURIComponent(id)}`, withCurrentUser()));
  return normalizePost(Array.isArray(response.data) ? response.data[0] : response.data);
}

async function enrichPostFiles(post: ApiPost): Promise<ApiPost> {
  if (post.files.length) {
    return post;
  }

  try {
    const result = await list(withQuery('/v1/file', { comment_id: post.id }), normalizePostFile);

    return {
      ...post,
      files: result.items,
      image: result.items.find((file) => ['photo', 'image'].includes(file.type))?.url ?? post.image,
    };
  } catch {
    return post;
  }
}

export function getMediaComments(mediaId: string, page?: number) {
  return list(withQuery('/v1/comment', {
    user_id: currentUserParam(),
    media_id: mediaId,
    for_entity: 'media',
    type: 'comment',
    page,
  }), normalizePost).then((result) => ({
    ...result,
    items: result.items.some((item) => item.mediaId)
      ? result.items.filter((item) => item.mediaId === mediaId && item.commentType === 'comment')
      : result.items.filter((item) => (item.targetType === 'media' || item.targetType === 'comment') && item.commentType === 'comment'),
  }));
}

export function getProductComments(productId: string, page?: number) {
  return list(withQuery('/v1/comment', {
    user_id: currentUserParam(),
    product_id: productId,
    for_entity: 'product',
    type: 'comment',
    page,
  }), normalizePost).then((result) => ({
    ...result,
    items: result.items.some((item) => item.productId)
      ? result.items.filter((item) => item.productId === productId && item.commentType === 'comment')
      : result.items.filter((item) => (item.targetType === 'product' || item.targetType === 'comment') && item.commentType === 'comment'),
  }));
}

export function getCategories(page?: number) {
  return list(withQuery('/v1/category', withCurrentUser({ page })), normalizeCategory);
}

export function getCategoriesForType(forType: string, page?: number) {
  return list(withQuery(`/v1/category/for-type/${encodeURIComponent(forType)}`, { page }), normalizeCategory);
}

export function getPopularProducts(page?: number) {
  return list(withQuery('/v1/product/popular/list', withCurrentUser({ page })), normalizeProduct);
}

export function getPromotedProducts(page?: number) {
  return list(withQuery('/v1/product/promoted/list', withCurrentUser({ page })), normalizeProduct);
}

export function getRecentProducts(page?: number) {
  return list(withQuery('/v1/product', withCurrentUser({ page })), normalizeProduct);
}

export function getProductsByCategory(categoryId: string, page?: number) {
  return list(withQuery('/v1/product/filter/list', {
    user_id: currentUserParam(),
    category_id: categoryId,
    category: categoryId,
    categoryId,
    page,
  }), normalizeProduct);
}

export async function getProduct(id: string) {
  const response = await apiRequest<unknown>(withQuery(`/v1/product/${encodeURIComponent(id)}`, withCurrentUser()));
  const data = Array.isArray(response.data) ? response.data[0] : response.data;
  return normalizeProduct(data);
}

export async function searchApi(kind: 'media' | 'product', query: string) {
  const path = kind === 'product' ? '/v1/product/filter/list' : '/v1/media/filter/list';
  const response = await apiRequest<unknown>(`${path}?word=${encodeURIComponent(query)}&search=${encodeURIComponent(query)}&q=${encodeURIComponent(query)}`);
  const items = asArray(response.data);
  return kind === 'product' ? items.map(normalizeProduct) : items.map(normalizeMedia);
}

export function createMedia(payload: Record<string, unknown> | FormData) {
  return apiRequest('/v1/media', {
    method: 'POST',
    body: payload instanceof FormData ? payload : JSON.stringify(payload),
  });
}

export function createProduct(payload: Record<string, unknown> | FormData) {
  return apiRequest('/v1/product', {
    method: 'POST',
    body: payload instanceof FormData ? payload : JSON.stringify(payload),
  });
}

export function createPost(payload: Record<string, unknown> | FormData) {
  return apiRequest('/v1/comment', {
    method: 'POST',
    body: payload instanceof FormData ? payload : JSON.stringify(payload),
  });
}

export function buildPostForm(payload: Record<string, unknown>, files?: unknown[]) {
  const form = new FormData();
  Object.entries(payload).forEach(([key, value]) => appendFormValue(form, key, value));
  appendFormFiles(form, files);
  return form;
}

export function buildProductForm(payload: Record<string, unknown>, files?: unknown[]) {
  const form = new FormData();
  Object.entries(payload).forEach(([key, value]) => appendFormValue(form, key, value));
  appendFormFiles(form, files);
  return form;
}

export async function sendAiMessage(message: string) {
  const response = await apiRequest<unknown>('/v1/ai/chat', {
    method: 'POST',
    body: JSON.stringify({ message }),
  });
  const data = (response.data && typeof response.data === 'object' ? response.data : {}) as Record<string, unknown>;
  return pickLocalizedString(data, ['answer', 'response', 'message', 'content', 'text'], typeof response.data === 'string' ? response.data : '');
}

export function getConversations(page?: number) {
  return list(withQuery('/v1/message/conversation', withCurrentUser({ page })), normalizeConversation);
}

export async function getConversationMessages(conversation: ApiConversation) {
  const path = conversation.kind === 'group'
    ? withQuery('/v1/message/conversation/group', { user_id: currentUserParam(), group_id: conversation.groupId })
    : withQuery('/v1/message/conversation/users', { user_id: currentUserParam(), addressee_user_id: conversation.peerUserId });
  const response = await apiRequest<unknown>(path);
  const data = response.data;
  const source = data && typeof data === 'object' && !Array.isArray(data) ? data as Record<string, unknown> : null;
  return asArray(source?.messages ?? data).map(normalizeMessage).reverse();
}

export type MessageRecipient = { id: string; kind: 'user' | 'group'; title: string; subtitle?: string; avatarUrl?: string };

export async function getMessageRecipients() {
  const [connections, groups] = await Promise.all([
    getUserConnections().catch(() => ({ items: [] as ApiUserProfile[] })),
    list(withQuery(`/v1/group/user/${encodeURIComponent(currentUserParam())}`, {}), (item) => item as Record<string, unknown>).catch(() => ({ items: [] as Record<string, unknown>[] })),
  ]);
  return [
    ...connections.items.map((user): MessageRecipient => ({ id: user.id, kind: 'user', title: user.name, subtitle: `@${user.username}`, avatarUrl: user.avatarUrl })),
    ...groups.items.map((group): MessageRecipient => ({ id: pickString(group, ['id', 'uuid']), kind: 'group', title: pickLocalizedString(group, ['group_name', 'name', 'title'], 'Groupe'), subtitle: pickLocalizedString(group, ['description', 'group_description']), avatarUrl: pickImage(group) })),
  ];
}

export function sendMessage(payload: { content: string; addresseeUserId?: string; addresseeGroupId?: string }) {
  return apiRequest<unknown>('/v1/message', {
    method: 'POST',
    body: JSON.stringify({
      message_content: payload.content,
      type: 'text',
      status: 'unread',
      user_id: currentUserParam(),
      addressee_user_id: payload.addresseeUserId,
      addressee_group_id: payload.addresseeGroupId,
    }),
  }).then((response) => normalizeMessage(response.data));
}

export function getEntrepreneurs(filters: { categoryIds?: string[]; countries?: string[]; cities?: string[]; page?: number } = {}) {
  const numericCategoryIds = filters.categoryIds?.filter((id) => !Number.isNaN(Number(id))).map(Number);

  return apiRequest<unknown>('/v1/user/entrepreneurs', {
    method: 'POST',
    body: JSON.stringify({
      category_ids: numericCategoryIds?.length ? numericCategoryIds : undefined,
      categories: numericCategoryIds?.length ? numericCategoryIds : undefined,
      countries: filters.countries,
      cities: filters.cities,
      page: filters.page,
    }),
  }).then((response) => {
    const items = asArray(response.data).map(normalizeUserProfile);
    return { items, lastPage: response.lastPage ?? 1, count: response.count ?? items.length };
  });
}

export function likeMedia(mediaId: string, action: 'add' | 'remove' = 'add') {
  const user = getCurrentUser();
  return apiRequest(`/v1/media/${encodeURIComponent(mediaId)}/like`, {
    method: 'POST',
    body: JSON.stringify({ user_id: user.id, action }),
  });
}

export async function getMediaStats(mediaId: string): Promise<ApiMediaStats> {
  const [views, plays, likes] = await Promise.all([
    apiRequest<unknown[]>(withQuery(`/v1/media/${encodeURIComponent(mediaId)}/view`, withCurrentUser())).catch(() => ({ data: [], count: 0 })),
    apiRequest<unknown[]>(withQuery(`/v1/media/${encodeURIComponent(mediaId)}/play`, withCurrentUser())).catch(() => ({ data: [], count: 0 })),
    apiRequest<unknown[]>(withQuery(`/v1/media/${encodeURIComponent(mediaId)}/like`, withCurrentUser())).catch(() => ({ data: [], count: 0 })),
  ]);

  const likeItems = asArray(likes.data);

  return {
    views: views.count ?? asArray(views.data).length,
    plays: plays.count ?? asArray(plays.data).length,
    likes: likes.count ?? likeItems.length,
    liked: likeItems.some(isCurrentUserReaction),
  };
}

export function createMediaComment(mediaId: string, comment: string) {
  const user = getCurrentUser();
  return createPost({
    comment_content: comment,
    type: 'comment',
    for_entity: 'media',
    media_id: mediaId,
    user_id: user.id,
  });
}

export function shareMediaAsPost(media: ApiMedia) {
  const user = getCurrentUser();
  return createPost({
    comment_content: media.description,
    type: 'post',
    for_entity: 'media',
    media_id: media.id,
    user_id: user.id,
  });
}

export function shareMedia(mediaId: string) {
  return apiRequest(`/v1/media/${encodeURIComponent(mediaId)}/share`, {
    method: 'POST',
    body: JSON.stringify({ user_id: currentUserParam() }),
  });
}

export function sharePost(postId: string) {
  return apiRequest(`/v1/comment/${encodeURIComponent(postId)}/share`, {
    method: 'POST',
    body: JSON.stringify({ user_id: currentUserParam() }),
  });
}

export function shareProduct(productId: string) {
  return apiRequest(`/v1/product/${encodeURIComponent(productId)}/share`, {
    method: 'POST',
    body: JSON.stringify({ user_id: currentUserParam() }),
  });
}

export function shareEntity(entity: 'media' | 'post' | 'product', entityId: string) {
  if (entity === 'post') return sharePost(entityId);
  if (entity === 'product') return shareProduct(entityId);
  return shareMedia(entityId);
}

export function likeComment(commentId: string, action: 'add' | 'remove' = 'add') {
  const user = getCurrentUser();
  return apiRequest(`/v1/comment/${encodeURIComponent(commentId)}/like`, {
    method: 'POST',
    body: JSON.stringify({ user_id: user.id, action }),
  });
}

export async function getUserWatchlist(page?: number) {
  const user = getCurrentUser();
  return list(`/v1/user/${encodeURIComponent(user.id)}/watchlist${pageParam(page)}`, normalizeMedia);
}

export function addToWatchlist(mediaId: string) {
  const user = getCurrentUser();
  return apiRequest(`/v1/user/${encodeURIComponent(user.id)}/watchlist/${encodeURIComponent(mediaId)}`, { method: 'POST' });
}

export function removeFromWatchlist(mediaId: string) {
  const user = getCurrentUser();
  return apiRequest(`/v1/user/${encodeURIComponent(user.id)}/watchlist/${encodeURIComponent(mediaId)}`, { method: 'DELETE' });
}

export function toggleSubscription(userId: string, action: 'add' | 'remove' = 'add') {
  return action === 'add' ? followUser(userId) : unfollowUser(userId);
}

export async function isFollowingUser(userId: string) {
  const response = await apiRequest<{ is_follower?: boolean }>(withQuery('/v1/subscription/is-follower', {
    user_id: userId,
    follower_id: currentUserParam(),
  }));

  return Boolean(response.data?.is_follower);
}

export function followUser(userId: string) {
  return apiRequest('/v1/subscription', {
    method: 'POST',
    body: JSON.stringify({
      user_id: userId,
      follower_id: currentUserParam(),
      granted: true,
    }),
  });
}

export function unfollowUser(userId: string) {
  return apiRequest(withQuery('/v1/subscription/unfollow', {
    user_id: userId,
    follower_id: currentUserParam(),
  }), { method: 'DELETE' });
}

export function saveMediaProgress(mediaId: string, percentage: number) {
  const user = getCurrentUser();
  return apiRequest('/v1/media/progress', {
    method: 'POST',
    body: JSON.stringify({
      media_id: mediaId,
      percentage: Math.max(0, Math.min(Math.round(percentage), 100)),
      user_id: user.id,
    }),
  });
}

export function getNotifications(page?: number) {
  const userId = currentUserParam();
  const keepCurrentUserNotifications = (result: PaginatedResult<ApiNotification>) => ({
    ...result,
    items: result.items.filter((item) => !item.toUserId || item.toUserId === userId),
  });

  return list(withQuery(`/v1/notification/user/${encodeURIComponent(userId)}`, { page }), normalizeNotification)
    .catch(() => list(withQuery('/v1/notification/user-notifications', { to_user_id: userId, user_id: userId, page }), normalizeNotification))
    .catch(() => list(withQuery('/v1/notification', { to_user_id: userId, user_id: userId, page }), normalizeNotification))
    .then(keepCurrentUserNotifications);
}

export async function getUnreadNotificationsCount() {
  const userId = currentUserParam();
  const response = await apiRequest<unknown>(withQuery(`/v1/notification/user/${encodeURIComponent(userId)}`, { unread: 1 }))
    .catch(() => apiRequest<unknown>(withQuery('/v1/notification/user-notifications', { to_user_id: userId, user_id: userId, unread: 1 })))
    .catch(() => apiRequest<unknown>(withQuery('/v1/notification', { to_user_id: userId, user_id: userId, unread: 1 })));
  const rawItems = asArray(response.data);
  const unread = asArray(response.data)
    .map(normalizeNotification)
    .filter((item) => (!item.toUserId || item.toUserId === userId) && item.unread);

  return rawItems.length && unread.length !== rawItems.length ? unread.length : response.count ?? unread.length;
}

export function markNotificationAsRead(notificationId: string) {
  const options = {
    method: 'PATCH',
    body: JSON.stringify({ user_id: currentUserParam() }),
  };

  return apiRequest(`/v1/notification/${encodeURIComponent(notificationId)}/read`, options)
    .catch(() => apiRequest(`/v1/notification/${encodeURIComponent(notificationId)}/mark-as-read`, options))
    .catch(() => apiRequest(`/v1/notification/mark-as-read/${encodeURIComponent(notificationId)}`, options));
}

export function muteUser(userId: string) {
  return apiRequest('/v1/report', {
    method: 'POST',
    body: JSON.stringify({
      entity: 'user',
      entity_id: userId,
      muted: 1,
      user_id: currentUserParam(),
    }),
  });
}

export function getUserPayments(page?: number) {
  return list(withQuery('/v1/payment', withCurrentUser({ page })), normalizePayment);
}

export async function getUserProfile(userId: string) {
  const response = await apiRequest<unknown>(`/v1/user/${encodeURIComponent(userId)}`);
  const data = Array.isArray(response.data) ? response.data[0] : response.data;
  return normalizeUserProfile(data);
}

export function getUserConnections(page?: number) {
  return list(withQuery(`/v1/subscription/user/${encodeURIComponent(currentUserParam())}/connections`, { page }), normalizeUserProfile);
}
