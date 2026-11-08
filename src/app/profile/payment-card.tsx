import { Pressable, StyleSheet, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { WebView } from 'react-native-webview';
import { colors } from '@/constants/theme';
export default function CardPayment() { const { url } = useLocalSearchParams<{ url?: string }>(); return <SafeAreaView style={styles.container}><Pressable style={styles.back} onPress={() => router.replace('/(tabs)/profil')}><Feather name="arrow-left" size={24} color={colors.text}/></Pressable>{typeof url === 'string' && /^https:\/\//.test(url) && <WebView source={{ uri: url }} style={styles.web}/>}</SafeAreaView>; }
const styles = StyleSheet.create({ container: { flex: 1, backgroundColor: colors.background }, back: { padding: 16 }, web: { flex: 1 } });
