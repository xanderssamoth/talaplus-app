import { useCallback, useState } from 'react';
import { Pressable, ScrollView, Share, StyleSheet, Text, View } from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { colors } from '@/constants/theme';
import { fetchEarningStats, fetchProfile, fetchReferrees, fetchSubscriptions, Profile } from '@/lib/profile-api';
import { getCurrentUser } from '@/lib/session';

type Raw = Record<string, any>;
const daysBetween = (items: Raw[], start: number, end: number) => items.filter(item => { const date = new Date(item.created_at).getTime(); return date >= start && date < end; }).length;
function trend(items: Raw[], startedAt = '') { const now = Date.now(); const recent = daysBetween(items, now - 7 * 86400000, now); const previous = daysBetween(items, now - 14 * 86400000, now - 7 * 86400000); const start = new Date(startedAt).getTime(); if (Number.isFinite(start) && start > now - 14 * 86400000) return '—'; return previous ? `${Math.round((recent - previous) / previous * 100)}%` : recent ? '+100%' : '0%'; }
function latestDays(stats: Raw): Raw[] { const weeks = Array.isArray(stats.referral?.weeks) ? stats.referral.weeks : []; const latest = [...weeks].sort((a, b) => new Date(b.end_date).getTime() - new Date(a.end_date).getTime())[0]; return Array.isArray(latest?.days) ? latest.days : []; }
function allDays(stats: Raw): Raw[] { const weeks = Array.isArray(stats.referral?.weeks) ? stats.referral.weeks : []; return weeks.flatMap((week: Raw) => Array.isArray(week.days) ? week.days : []).sort((a: Raw, b: Raw) => new Date(a.date).getTime() - new Date(b.date).getTime()); }
function earningsTrend(days: Raw[]) { const recent = days.slice(-7).reduce((sum, d) => sum + Number(d.total_usd ?? d.amount_usd ?? 0), 0); const previous = days.slice(-14, -7).reduce((sum, d) => sum + Number(d.total_usd ?? d.amount_usd ?? 0), 0); return previous ? `${Math.round((recent - previous) / previous * 100)}%` : recent ? '+100%' : '0%'; }
export default function PartnerScreen() {
  const { t } = useTranslation();
  const id = getCurrentUser().id;
  const [profile, setProfile] = useState<Profile | null>(null);
  const [referrees, setReferrees] = useState<Raw[]>([]);
  const [subscriptions, setSubscriptions] = useState<Raw[]>([]);
  const [referreeCount, setReferreeCount] = useState(0);
  const [subscriptionCount, setSubscriptionCount] = useState(0);
  const [stats, setStats] = useState<Raw>({});
  const load = useCallback(() => { fetchProfile(id).then(setProfile).catch(() => undefined); fetchReferrees(id).then(r => { setReferrees(r.items); setReferreeCount(r.count); }).catch(() => undefined); fetchSubscriptions(id).then(r => { setSubscriptions(r.items); setSubscriptionCount(r.count); }).catch(() => undefined); fetchEarningStats(id).then(setStats).catch(() => undefined); }, [id]);
  useFocusEffect(useCallback(() => { load(); }, [load]));
  const days = latestDays(stats);
  const amounts = days.map(day => Number(day.total_usd ?? day.amount_usd ?? 0));
  const max = Math.max(...amounts, 1);
  const rows = [[t('signups'), referreeCount, trend(referrees, profile?.promoCodeAt)], [t('subscriptions'), subscriptionCount, trend(subscriptions, profile?.promoCodeAt)], [t('revenue'), `${Number(stats.total_usd ?? 0).toFixed(2)} $`, earningsTrend(allDays(stats))]];
  return <SafeAreaView style={styles.container}><View style={styles.header}><Pressable onPress={() => router.back()}><Feather name="arrow-left" size={24} color={colors.text}/></Pressable><Text style={styles.title}>{t('partner')}</Text><View style={{ width: 24 }}/></View><ScrollView contentContainerStyle={styles.content}>
    {!!profile?.promoCode && <View style={styles.codeCard}><View style={{ flex: 1 }}><Text style={styles.muted}>{t('yourPartnerCode')}</Text><Text style={styles.code}>{profile.promoCode}</Text></View><Pressable style={styles.share} onPress={() => Share.share({ message: `https://talaplus.tv/referral?referral_code=${encodeURIComponent(profile.promoCode)}` })}><Text style={styles.white}>{t('share')}</Text></Pressable></View>}
    <Text style={styles.heading}>{t('statistics')} · {t('sevenDays')}</Text><View style={styles.stats}>{rows.map(([label, value, change]) => <View key={String(label)} style={styles.stat}><Text style={styles.muted}>{label}</Text><Text style={styles.value}>{value}</Text><Text style={styles.change}>{change}</Text></View>)}</View>
    <View style={styles.chart}><Text style={styles.heading}>{t('revenueEvolution')}</Text><View style={styles.chartArea}>{days.map((day, index) => <View key={String(day.date ?? index)} style={styles.barWrap}><View style={[styles.bar, { height: Math.max(2, Number(day.total_usd ?? day.amount_usd ?? 0) / max * 150) }]}/><Text style={styles.day}>{String(day.date ?? '').slice(8, 10)}</Text></View>)}</View></View>
  </ScrollView></SafeAreaView>;
}
const styles = StyleSheet.create({ container: { flex: 1, backgroundColor: colors.background }, header: { padding: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }, title: { color: colors.text, fontSize: 22, fontWeight: '900' }, content: { padding: 16, gap: 18 }, codeCard: { padding: 16, backgroundColor: colors.panel, borderRadius: 8, flexDirection: 'row', alignItems: 'center' }, muted: { color: colors.muted, fontSize: 12 }, code: { color: colors.text, fontSize: 22, fontWeight: '900', marginTop: 6 }, share: { backgroundColor: colors.primary, padding: 12, borderRadius: 8 }, white: { color: colors.text, fontWeight: '900' }, heading: { color: colors.text, fontWeight: '900', fontSize: 17 }, stats: { flexDirection: 'row', gap: 8 }, stat: { flex: 1, backgroundColor: colors.panel, padding: 10, borderRadius: 8 }, value: { color: colors.text, fontSize: 19, fontWeight: '900', marginTop: 6 }, change: { color: colors.success, marginTop: 5 }, chart: { backgroundColor: colors.panel, padding: 15, borderRadius: 8 }, chartArea: { height: 195, flexDirection: 'row', alignItems: 'flex-end', gap: 7 }, barWrap: { flex: 1, alignItems: 'center' }, bar: { width: 12, backgroundColor: colors.primary, borderRadius: 5 }, day: { color: colors.muted, fontSize: 10, marginTop: 5 } });
