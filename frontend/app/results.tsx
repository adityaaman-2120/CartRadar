import { useState, useMemo, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
} from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import PlatformBadge from '../components/PlatformBadge';
import SkeletonRow from '../components/SkeletonRow';
import { PLATFORMS, PlatformId, Product } from '../constants/platforms';
import { searchProducts } from '../services/searchService';

type SortKey = 'price' | 'alpha' | 'discount';
type ScreenState = 'loading' | 'success' | 'error' | 'empty';

const platformIds: PlatformId[] = ['zepto', 'blinkit', 'bigbasket', 'amazon', 'flipkart'];

function getLowestPrice(prices: Product['prices']): number | null {
  let min: number | null = null;
  for (const id of platformIds) {
    const p = prices[id];
    if (p && (min === null || p.price < min)) {
      min = p.price;
    }
  }
  return min;
}

function getBestDiscount(prices: Product['prices']): number {
  let best = 0;
  for (const id of platformIds) {
    const p = prices[id];
    if (p && p.mrp > p.price) {
      const disc = Math.round(((p.mrp - p.price) / p.mrp) * 100);
      if (disc > best) best = disc;
    }
  }
  return best;
}

export default function ResultsScreen() {
  const { query, pincode } = useLocalSearchParams<{ query: string; pincode: string }>();
  const insets = useSafeAreaInsets();
  const [sort, setSort] = useState<SortKey>('price');
  const [screenState, setScreenState] = useState<ScreenState>('loading');
  const [products, setProducts] = useState<Product[]>([]);
  const [timeTaken, setTimeTaken] = useState(0);
  const [retryCount, setRetryCount] = useState(0);

  useEffect(() => {
    async function load() {
      try {
        setScreenState('loading');
        const result = await searchProducts(query, pincode);
        if (result.products.length === 0) {
          setScreenState('empty');
        } else {
          setProducts(result.products);
          setTimeTaken(result.timeTaken);
          setScreenState('success');
        }
      } catch (error: any) {
        console.error('Search error:', error.message);
        setScreenState('error');
      }
    }
    load();
  }, [retryCount]);

  const handleRetry = () => {
    setRetryCount((c) => c + 1);
  };

  const sortedData = useMemo(() => {
    const data = [...products];
    switch (sort) {
      case 'price':
        data.sort((a, b) => {
          const la = getLowestPrice(a.prices) ?? Infinity;
          const lb = getLowestPrice(b.prices) ?? Infinity;
          return la - lb;
        });
        break;
      case 'alpha':
        data.sort((a, b) => a.name.localeCompare(b.name));
        break;
      case 'discount':
        data.sort((a, b) => getBestDiscount(b.prices) - getBestDiscount(a.prices));
        break;
    }
    return data;
  }, [sort, products]);

  const productColWidth = 140;
  const priceColWidth = 72;

  const renderTableBody = () => {
    switch (screenState) {
      case 'loading':
        return (
          <View>
            <Text style={styles.searchingText}>Searching 5 platforms...</Text>
            {Array.from({ length: 4 }).map((_, i) => (
              <SkeletonRow key={i} />
            ))}
          </View>
        );
      case 'error':
        return (
          <View style={styles.centeredState}>
            <Text style={styles.stateEmoji}>⚠️</Text>
            <Text style={styles.stateTitle}>Could not fetch prices</Text>
            <Text style={styles.stateSubtitle}>Check your internet and try again</Text>
            <TouchableOpacity style={styles.stateButton} onPress={handleRetry}>
              <Text style={styles.stateButtonText}>Try Again</Text>
            </TouchableOpacity>
          </View>
        );
      case 'empty':
        return (
          <View style={styles.centeredState}>
            <Text style={styles.stateEmoji}>🔍</Text>
            <Text style={styles.stateTitle}>No results for "{query}"</Text>
            <Text style={styles.stateSubtitle}>Try a more general search term</Text>
            <TouchableOpacity style={styles.stateButton} onPress={() => router.back()}>
              <Text style={styles.stateButtonText}>Search Again</Text>
            </TouchableOpacity>
          </View>
        );
      case 'success':
        return (
          <>
            {sortedData.map((product, idx) => {
              const lowest = getLowestPrice(product.prices);
              return (
                <View
                  key={idx}
                  style={[styles.productRow, idx % 2 === 1 && styles.productRowAlt]}
                >
                  <View style={{ width: productColWidth, paddingRight: 8 }}>
                    <Text style={styles.productName} numberOfLines={2}>
                      {product.name}
                    </Text>
                    <Text style={styles.productBrand}>{product.brand}</Text>
                  </View>
                  {platformIds.map((id) => {
                    const p = product.prices[id];
                    const isLowest = p && lowest !== null && p.price === lowest;
                    return (
                      <View key={id} style={{ width: priceColWidth, alignItems: 'center' }}>
                        {p ? (
                          <View style={styles.priceCell}>
                            <Text style={[styles.price, isLowest && styles.priceLowest]}>
                              ₹{p.price}
                            </Text>
                            <Text style={styles.mrp}>₹{p.mrp}</Text>
                            <Text style={styles.discount}>
                              {Math.round(((p.mrp - p.price) / p.mrp) * 100)}% off
                            </Text>
                            {isLowest && <Text style={styles.bestTag}>Best</Text>}
                          </View>
                        ) : (
                          <Text style={styles.na}>—</Text>
                        )}
                      </View>
                    );
                  })}
                </View>
              );
            })}
            <Text style={styles.timingText}>
              Results fetched in {(timeTaken / 1000).toFixed(1)}s across 5 platforms
            </Text>
          </>
        );
    }
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.headerBar}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Text style={styles.backText}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={1}>
          {query}
        </Text>
        <View style={styles.pincodeBadge}>
          <Text style={styles.pincodeText}>{pincode}</Text>
        </View>
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <View>
          <View style={styles.platformHeader}>
            <View style={{ width: productColWidth }} />
            {platformIds.map((id) => {
              const pf = PLATFORMS.find((p) => p.id === id)!;
              return (
                <View key={id} style={{ width: priceColWidth, alignItems: 'center' }}>
                  <PlatformBadge
                    id={pf.id}
                    name={pf.name}
                    shortName={pf.shortName}
                    color={pf.color}
                    bg={pf.bg}
                    size="small"
                  />
                </View>
              );
            })}
          </View>

          <View style={styles.sortBar}>
            {(['price', 'alpha', 'discount'] as SortKey[]).map((key) => (
              <TouchableOpacity key={key} onPress={() => setSort(key)} style={styles.sortOption}>
                <Text style={[styles.sortText, sort === key && styles.sortTextActive]}>
                  {key === 'price' ? 'Lowest Price' : key === 'alpha' ? 'A to Z' : 'Best Discount'}
                </Text>
                {sort === key && <View style={styles.sortUnderline} />}
              </TouchableOpacity>
            ))}
          </View>

          <ScrollView style={styles.tableBody} showsVerticalScrollIndicator={false}>
            {renderTableBody()}
          </ScrollView>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  headerBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  backBtn: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backText: {
    fontSize: 22,
    color: '#222',
  },
  headerTitle: {
    flex: 1,
    fontSize: 16,
    fontWeight: '700',
    color: '#222',
    marginHorizontal: 8,
  },
  pincodeBadge: {
    backgroundColor: '#FFF3E8',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  pincodeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FC8019',
  },
  platformHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 12,
    backgroundColor: '#fafafa',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  sortBar: {
    flexDirection: 'row',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    gap: 16,
  },
  sortOption: {
    alignItems: 'center',
  },
  sortText: {
    fontSize: 12,
    color: '#888',
    fontWeight: '600',
  },
  sortTextActive: {
    color: '#FC8019',
  },
  sortUnderline: {
    height: 2,
    width: '100%',
    backgroundColor: '#FC8019',
    borderRadius: 1,
    marginTop: 4,
  },
  tableBody: {
    maxHeight: '100%',
  },
  productRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  productRowAlt: {
    backgroundColor: '#fafafa',
  },
  productName: {
    fontSize: 13,
    fontWeight: '700',
    color: '#222',
  },
  productBrand: {
    fontSize: 11,
    color: '#888',
    marginTop: 2,
  },
  priceCell: {
    alignItems: 'center',
  },
  price: {
    fontSize: 13,
    fontWeight: '700',
    color: '#222',
  },
  priceLowest: {
    color: '#FC8019',
  },
  mrp: {
    fontSize: 10,
    color: '#aaa',
    textDecorationLine: 'line-through',
    marginTop: 1,
  },
  discount: {
    fontSize: 10,
    color: '#4CAF50',
    marginTop: 1,
  },
  bestTag: {
    fontSize: 9,
    color: '#FC8019',
    fontWeight: '700',
    marginTop: 1,
  },
  searchingText: {
    fontSize: 13,
    color: '#888',
    textAlign: 'center',
    paddingVertical: 16,
  },
  na: {
    fontSize: 13,
    color: '#ccc',
  },
  centeredState: {
    alignItems: 'center',
    marginTop: 60,
    paddingHorizontal: 32,
  },
  stateEmoji: {
    fontSize: 48,
    marginBottom: 16,
  },
  stateTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#222',
    textAlign: 'center',
    marginBottom: 8,
  },
  stateSubtitle: {
    fontSize: 14,
    color: '#888',
    textAlign: 'center',
    marginBottom: 24,
  },
  stateButton: {
    backgroundColor: '#FC8019',
    borderRadius: 10,
    paddingHorizontal: 32,
    paddingVertical: 12,
  },
  stateButtonText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '700',
  },
  timingText: {
    fontSize: 11,
    color: '#aaa',
    textAlign: 'center',
    paddingVertical: 12,
  },
});
