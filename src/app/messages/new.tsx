import { useEffect, useState } from 'react';
import { FlatList, Image, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { colors } from '@/constants/theme';
import { getMessageRecipients, MessageRecipient } from '@/lib/api';

export default function NewMessageScreen() {
  const { t } = useTranslation(); const [items, setItems] = useState<MessageRecipient[]>([]); const [query, setQuery] = useState('');
  useEffect(() => { getMessageRecipients().then(setItems).catch(() => setItems([])); }, []);
  const filtered = items.filter(item => `${item.title} ${item.subtitle ?? ''}`.toLowerCase().includes(query.toLowerCase()));
  return <SafeAreaView style={styles.container}><View style={styles.header}><Pressable onPress={() => router.back()}><Feather name="arrow-left" size={24} color={colors.text}/></Pressable><Text style={styles.title}>{t('newMessage')}</Text><View style={{width:24}}/></View><TextInput value={query} onChangeText={setQuery} placeholder={t('searchRecipient')} placeholderTextColor={colors.muted} style={styles.search}/><View style={styles.badges}><Text style={styles.badge}>{t('connections')}</Text><Text style={styles.badge}>{t('groups')}</Text></View><FlatList data={filtered} keyExtractor={item => `${item.kind}:${item.id}`} contentContainerStyle={styles.list} renderItem={({item}) => <Pressable style={styles.row} onPress={() => router.replace({ pathname: '/(tabs)/communaute', params: { compose: item.kind, recipientId: item.id, title: item.title } })}>{item.avatarUrl ? <Image source={{uri:item.avatarUrl}} style={styles.avatar}/> : <View style={styles.avatar}><Text style={styles.initial}>{item.title.charAt(0)}</Text></View>}<View><Text style={styles.name}>{item.title}</Text><Text style={styles.subtitle}>{item.kind === 'group' ? t('group') : item.subtitle}</Text></View></Pressable>}/></SafeAreaView>;
}
const styles=StyleSheet.create({container:{flex:1,backgroundColor:colors.background},header:{flexDirection:'row',alignItems:'center',justifyContent:'space-between',padding:16},title:{color:colors.text,fontSize:18,fontWeight:'900'},search:{marginHorizontal:16,color:colors.text,padding:13,borderRadius:8,backgroundColor:colors.panel},badges:{flexDirection:'row',gap:8,padding:16,paddingBottom:8},badge:{color:colors.primary,paddingHorizontal:10,paddingVertical:6,borderRadius:999,backgroundColor:colors.panelLight,fontWeight:'800'},list:{padding:16,paddingTop:0},row:{flexDirection:'row',alignItems:'center',gap:12,paddingVertical:12,borderBottomWidth:1,borderBottomColor:colors.border},avatar:{width:46,height:46,borderRadius:23,alignItems:'center',justifyContent:'center',backgroundColor:colors.panelLight},initial:{color:colors.text,fontWeight:'900'},name:{color:colors.text,fontWeight:'900'},subtitle:{color:colors.muted,fontSize:12,marginTop:3}});
