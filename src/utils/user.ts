import { AppUser } from '@/lib/session';

export function getAvatarSource(user: AppUser) {
  if (user.avatar_url?.startsWith('http')) {
    return { uri: user.avatar_url };
  }

  return undefined;
}
