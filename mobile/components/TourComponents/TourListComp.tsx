import { View, Text } from '@/components/Themed';
import { TourListItemProps } from './TourListComp.config';
import { tourListCompStyles } from './TourListComp.styles';
import { useColorTheme } from '@/utils/useColorTheme';
import { STAR } from '@/constants/Symbols';
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';

export default function TourListItem({ title, author, rating }: TourListItemProps) {
  const theme = useColorTheme();
  const styles = useMemo(() => tourListCompStyles(theme), [theme]);
  const { t } = useTranslation();

  return (
    <View style={styles.card}>
      <View style={styles.row}>
        <View style={styles.left}>
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.author}>{t('tour.by')} {author}</Text>
        </View>

        <View style={styles.right}>
          <Text style={styles.rating}>
            {STAR}
            {rating}{t('tour.ratingOf')}
          </Text>
        </View>
      </View>
    </View>
  );
}
