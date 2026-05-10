import { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import PlatformBadge from '../components/PlatformBadge';
import { PLATFORMS } from '../constants/platforms';

const RECENT_SEARCHES = ['Mixer Grinder', 'Basmati Rice 5kg', 'Amul Butter 500g'];

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const [searchText, setSearchText] = useState('');
  const [pincode, setPincode] = useState('');

  const isDisabled = searchText.trim().length === 0 || pincode.length !== 6;

  const handleSearch = () => {
    if (isDisabled) return;
    router.push({ pathname: '/results', params: { query: searchText.trim(), pincode } });
  };

  return (
    <ScrollView
      style={[styles.container, { paddingTop: insets.top + 16 }]}
      contentContainerStyle={styles.content}
    >
      <View style={styles.header}>
        <Text style={styles.title}>QuickPrice</Text>
        <Text style={styles.subtitle}>Compare prices across quick commerce apps</Text>
      </View>

      <View style={styles.searchCard}>
        <TextInput
          style={styles.input}
          placeholder="Search product... e.g. Mixer Grinder"
          placeholderTextColor="#999"
          value={searchText}
          onChangeText={setSearchText}
        />
        <TextInput
          style={[styles.input, styles.pincodeInput]}
          placeholder="Enter pincode"
          placeholderTextColor="#999"
          keyboardType="numeric"
          maxLength={6}
          value={pincode}
          onChangeText={setPincode}
        />
        <TouchableOpacity
          style={[styles.button, isDisabled && styles.buttonDisabled]}
          onPress={handleSearch}
          disabled={isDisabled}
          activeOpacity={0.8}
        >
          <Text style={[styles.buttonText, isDisabled && styles.buttonTextDisabled]}>
            Search Prices →
          </Text>
        </TouchableOpacity>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionLabel}>Recent searches</Text>
        <View style={styles.chipsRow}>
          {RECENT_SEARCHES.map((item) => (
            <TouchableOpacity
              key={item}
              style={styles.chip}
              onPress={() => setSearchText(item)}
            >
              <Text style={styles.chipText}>{item}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionLabel}>Available on</Text>
        <View style={styles.platformsRow}>
          {PLATFORMS.map((p) => (
            <PlatformBadge
              key={p.id}
              id={p.id}
              name={p.name}
              shortName={p.shortName}
              color={p.color}
              bg={p.bg}
              size="large"
            />
          ))}
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  content: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  header: {
    marginBottom: 24,
  },
  title: {
    fontSize: 32,
    fontWeight: '800',
    color: '#FC8019',
  },
  subtitle: {
    fontSize: 14,
    color: '#888',
    marginTop: 4,
  },
  searchCard: {
    backgroundColor: '#f5f5f5',
    borderRadius: 16,
    padding: 16,
    marginBottom: 28,
  },
  input: {
    backgroundColor: '#fff',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: '#222',
  },
  pincodeInput: {
    marginTop: 10,
  },
  button: {
    backgroundColor: '#FC8019',
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 14,
  },
  buttonDisabled: {
    backgroundColor: '#ccc',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  buttonTextDisabled: {
    color: '#999',
  },
  section: {
    marginBottom: 24,
  },
  sectionLabel: {
    fontSize: 12,
    color: '#999',
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 10,
  },
  chipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    backgroundColor: '#f0f0f0',
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  chipText: {
    fontSize: 13,
    color: '#444',
  },
  platformsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
});
