import { View, Text, StyleSheet, StatusBar } from "react-native";
import FontAwesome6 from '@expo/vector-icons/FontAwesome6';
import Feather from '@expo/vector-icons/Feather';
import { useTranslation } from 'react-i18next';
import { SafeAreaView } from "react-native-safe-area-context";
import BrandLogo from '@/components/BrandLogo';

export default function HomeSceen() {
  const { t } = useTranslation();

  return (
    <>
      <StatusBar
        translucent
        backgroundColor="transparent"
        barStyle="light-content"
      />
      <SafeAreaView style={{ flex: 1 }}>
        {/* 🔝 HEADER FIXE */}
        <View style={styles.headerContainer}>
          <View style={styles.headerTitleContainer}>
            <View style={styles.logoWrapper}>
              <FontAwesome6 name="bars-staggered" size={22} color="white" />
              <BrandLogo size="sm" />
            </View>
            <Feather name="bell" size={22} color="white" style={styles.topIcon} />
          </View>
        </View>

        <View>
          <Text style={{ color: 'white' }}>{t('discussions')}</Text>
        </View>
      </SafeAreaView>
    </>
  );
}

const styles = StyleSheet.create({
  headerContainer: {
    marginHorizontal: 10
  },
  headerTitleContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  logoWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 7,
    gap: 5
  },
  topIcon: {
    marginTop: 8
  }
});
