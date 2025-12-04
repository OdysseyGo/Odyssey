import { View, Text } from '@/components/Themed';
import { TourListItemProps } from './TourListComp.config';
import getStyles from './TourListComp.styles';
import { useColorTheme } from '@/utils/useColorTheme';
import { STAR } from '@/constants/Symbols';
import { useMemo } from 'react';

export default function TourListItem({ title, author, rating }: TourListItemProps) {
  const theme = useColorTheme();
  const styles = useMemo(() => getStyles(theme), [theme]);

  return (
    <View style={styles.card}>
      <View style={styles.row}>
        <View style={styles.left}>
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.author}>by {author}</Text>
        </View>

        <View style={styles.right}>
          <Text style={styles.rating}>
            {STAR}
            {rating}/5
          </Text>
        </View>
      </View>
    </View>
  );
}
