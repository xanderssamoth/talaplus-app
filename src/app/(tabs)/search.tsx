import { View, Text } from "react-native";
import { useTranslation } from 'react-i18next';

export default function MyTala() {
  const { t } = useTranslation();

  return (
    <View>
      <Text style={{ color: 'white' }}>{t('chatPlaceholder')}</Text>
    </View>
  );
}
