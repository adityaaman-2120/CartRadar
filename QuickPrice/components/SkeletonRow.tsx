import { useEffect, useRef } from 'react';
import { View, Animated, StyleSheet } from 'react-native';

const productColWidth = 140;
const priceColWidth = 72;

export default function SkeletonRow() {
  const opacity = useRef(new Animated.Value(0.4)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, { toValue: 0.8, duration: 500, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 0.4, duration: 500, useNativeDriver: true }),
      ])
    );
    animation.start();
    return () => animation.stop();
  }, [opacity]);

  return (
    <Animated.View style={[styles.row, { opacity }]}>
      <View style={[styles.nameBlock, { width: productColWidth }]}>
        <View style={styles.nameBar} />
        <View style={styles.brandBar} />
      </View>
      {Array.from({ length: 5 }).map((_, i) => (
        <View key={i} style={{ width: priceColWidth, alignItems: 'center' }}>
          <View style={styles.priceSquare} />
        </View>
      ))}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 12,
    height: 64,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  nameBlock: {
    paddingRight: 8,
    justifyContent: 'center',
  },
  nameBar: {
    width: '90%',
    height: 12,
    backgroundColor: '#E0E0E0',
    borderRadius: 4,
    marginBottom: 6,
  },
  brandBar: {
    width: '55%',
    height: 9,
    backgroundColor: '#E0E0E0',
    borderRadius: 4,
  },
  priceSquare: {
    width: 36,
    height: 36,
    backgroundColor: '#E0E0E0',
    borderRadius: 6,
  },
});
