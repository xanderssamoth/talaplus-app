import { useCallback, useState } from 'react';
import { useFocusEffect } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { fetchProfile } from '@/lib/profile-api';

type CacheEntry = { type: string; at: number; request?: Promise<string> };
const cache = new Map<string, CacheEntry>();
async function latestType(userId: string) {
  const existing = cache.get(userId);
  if (existing?.request) return existing.request;
  if (existing && Date.now() - existing.at < 10000) return existing.type;
  const request = fetchProfile(userId).then(profile => profile.type);
  cache.set(userId, { type: existing?.type ?? '', at: existing?.at ?? 0, request });
  try { const type = await request; cache.set(userId, { type, at: Date.now() }); return type; }
  catch { cache.delete(userId); throw new Error('Profile unavailable'); }
}
export default function LiveVerifiedMark({ userId, initialType, size = 18 }: { userId?: string; initialType?: string; size?: number }) {
  const [type, setType] = useState(initialType ?? '');
  useFocusEffect(useCallback(() => {
    if (!userId) return;
    let active = true;
    const refresh = () => latestType(userId).then(value => { if (active) setType(value); }).catch(() => undefined);
    refresh();
    const timer = setInterval(refresh, 30000);
    return () => { active = false; clearInterval(timer); };
  }, [userId]));
  return type === 'certified' ? <MaterialCommunityIcons name="check-decagram" size={size} color="#53B4FF"/> : null;
}
