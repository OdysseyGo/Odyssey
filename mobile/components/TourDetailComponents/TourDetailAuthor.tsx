import { View, Text, Image } from 'react-native';
import { useMemo } from 'react';
import { useColorTheme } from '@/utils/useColorTheme';
import { TourDetailAuthorProps } from './TourDetailAuthor.config';
import { tourDetailAuthorStyles } from './TourDetailAuthor.styles';
import { useTranslation } from 'react-i18next';

export default function TourDetailAuthor({ authorAvatar, authorName }: TourDetailAuthorProps) {
  const theme = useColorTheme();
  const styles = useMemo(() => tourDetailAuthorStyles(theme), [theme]);
  const { t } = useTranslation();

  return (
    <View style={styles.authorSection}>
      <Image source={{ uri: authorAvatar }} style={styles.authorAvatar} />
      <View>
        <Text style={styles.authorLabel}>{t('tourDetail.createdBy')}</Text>
        <Text style={styles.authorName}>{authorName}</Text>
      </View>
    </View>
  );
}
