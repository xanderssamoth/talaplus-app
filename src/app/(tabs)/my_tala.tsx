import { View, Text } from "react-native";
import { useTranslation } from 'react-i18next';

export default function MyTala() {
  const { t } = useTranslation();

  return (
    <View>
      <Text>{t('myTala')}</Text>
    </View>
  );
}
