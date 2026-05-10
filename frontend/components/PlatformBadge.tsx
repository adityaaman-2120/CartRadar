import { View, Text, StyleSheet } from 'react-native';

type Props = {
  id: string;
  name: string;
  shortName: string;
  color: string;
  bg: string;
  size?: 'small' | 'large';
};

export default function PlatformBadge({ shortName, name, color, bg, size = 'large' }: Props) {
  const isLarge = size === 'large';
  return (
    <View style={styles.container}>
      <View
        style={[
          styles.circle,
          {
            width: isLarge ? 44 : 30,
            height: isLarge ? 44 : 30,
            backgroundColor: bg,
          },
        ]}
      >
        <Text
          style={[
            styles.shortName,
            { color, fontSize: isLarge ? 13 : 10 },
          ]}
        >
          {shortName}
        </Text>
      </View>
      {isLarge && (
        <Text style={styles.name} numberOfLines={1}>
          {name}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
  },
  circle: {
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
  },
  shortName: {
    fontWeight: '700',
  },
  name: {
    color: '#666',
    fontSize: 10,
    marginTop: 4,
    maxWidth: 50,
    textAlign: 'center',
  },
});
