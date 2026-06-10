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
  return list('/v1/media/popular/list', normalizeMedia, page);
}

export function getRecentMedia(page?: number) {
  return list('/v1/media', normalizeMedia, page);
}

export function getUserMedia(userId: string, page?: number) {
  return list(withQuery('/v1/media/filter/list', { user_id: userId, page }), normalizeMedia);
}

export function getMediaByType(type: string, page?: number) {
  return list(withQuery('/v1/media/filter/list', { type, page }), normalizeMedia);
}

export function getMediaChildren(mediaId: string, page?: number) {
  return list(withQuery('/v1/media/filter/list', {
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
  return list('/v1/hashtag', normalizeHashtag, page);
}

export async function getHashtagEntities(hashtag: string) {
  const response = await apiRequest<unknown>(`/v1/hashtag/${encodeURIComponent(hashtag.replace(/^#/, ''))}/entities`);
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
  return list('/v1/comment/news-feed', normalizePost, page)
    .catch(() => list(withQuery('/v1/comment', { type: 'post', page }), normalizePost))
    .then(async (result) => {
      const posts = result.items.filter((item) => item.commentType === 'post' || !item.commentType);
      const items = await Promise.all(posts.map(enrichPostFiles));

      return { ...result, items };
    });
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
  return list('/v1/category', normalizeCategory, page);
}

export function getCategoriesForType(forType: string) {
  return list(`/v1/category/for-type/${encodeURIComponent(forType)}`, normalizeCategory);
}

export function getPopularProducts(page?: number) {
  return list('/v1/product/popular/list', normalizeProduct, page);
}

export function getPromotedProducts(page?: number) {
  return list('/v1/product/promoted/list', normalizeProduct, page);
}

export function getRecentProducts(page?: number) {
  return list('/v1/product', normalizeProduct, page);
}

export function getProductsByCategory(categoryId: string, page?: number) {
  return list(withQuery('/v1/product/filter/list', {
    category_id: categoryId,
    category: categoryId,
    categoryId,
    page,
  }), normalizeProduct);
}

export async function getProduct(id: string) {
  const response = await apiRequest<unknown>(`/v1/product/${encodeURIComponent(id)}`);
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

export function createProduct(payload: Record<string, unknown>) {
  return apiRequest('/v1/product', { method: 'POST', body: JSON.stringify(payload) });
}

export function createPost(payload: Record<string, unknown>) {
  return apiRequest('/v1/comment', { method: 'POST', body: JSON.stringify(payload) });
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
    apiRequest<unknown[]>(`/v1/media/${encodeURIComponent(mediaId)}/view`).catch(() => ({ data: [], count: 0 })),
    apiRequest<unknown[]>(`/v1/media/${encodeURIComponent(mediaId)}/play`).catch(() => ({ data: [], count: 0 })),
    apiRequest<unknown[]>(`/v1/media/${encodeURIComponent(mediaId)}/like`).catch(() => ({ data: [], count: 0 })),
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
  const user = getCurrentUser();
  return apiRequest(`/v1/user/${encodeURIComponent(user.id)}/subscription/${encodeURIComponent(userId)}`, {
    method: action === 'add' ? 'POST' : 'DELETE',
  });
}
