import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { colors } from '@/constants/theme';

export default function PublishingOverlay({ visible }: { visible: boolean }) {
  const { t } = useTranslation();
  if (!visible) return null;
  return <View style={styles.overlay}><View style={styles.card}><ActivityIndicator size="large" color={colors.primary}/><Text style={styles.title}>{t('publishing')}</Text><View style={styles.track}><View style={styles.bar}/></View><Text style={styles.hint}>{t('publishingHint')}</Text></View></View>;
}
const styles = StyleSheet.create({ overlay:{...StyleSheet.absoluteFillObject,zIndex:50,alignItems:'center',justifyContent:'center',padding:28,backgroundColor:'rgba(0,0,0,0.68)'},card:{width:'100%',maxWidth:340,padding:24,borderRadius:12,alignItems:'center',backgroundColor:colors.panel},title:{color:colors.text,fontSize:18,fontWeight:'900',marginTop:14},track:{width:'100%',height:8,borderRadius:4,overflow:'hidden',marginTop:20,backgroundColor:colors.panelLight},bar:{width:'68%',height:'100%',borderRadius:4,backgroundColor:colors.primary},hint:{color:colors.muted,textAlign:'center',fontSize:12,marginTop:12} });
