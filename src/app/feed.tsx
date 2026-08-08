import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';

import { FeedList } from '@/components/feed/FeedList';
import { fetchFeedPage } from '@/data/feedRepository';
import { colors } from '@/theme';
import { Curiosity } from '@/types/domain';

export default function FeedRoute() {
  const [items, setItems] = useState<Curiosity[]>([]);
  const [cursor, setCursor] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    fetchFeedPage().then((page) => {
      if (cancelled) return;
      setItems(page.items);
      setCursor(page.nextCursor);
      setLoading(false);
    });

    return () => {
      cancelled = true;
    };
  }, []);

  const loadMore = useCallback(async () => {
    if (!cursor) return;
    const page = await fetchFeedPage(cursor);
    setItems((current) => [...current, ...page.items]);
    setCursor(page.nextCursor);
  }, [cursor]);

  if (loading) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator color={colors.amber} />
      </View>
    );
  }

  return <FeedList items={items} onEndReached={loadMore} />;
}

const styles = StyleSheet.create({
  loading: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.background,
  },
});
