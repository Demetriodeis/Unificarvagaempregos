import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Idea, RootStackParamList } from '../types';
import { loadIdeas, searchIdeas, loadSettings } from '../services/storageService';
import { generateQuickSummary } from '../services/aiService';

type Nav = NativeStackNavigationProp<RootStackParamList, 'Home'>;

export default function HomeScreen() {
  const navigation = useNavigation<Nav>();
  const [ideas, setIdeas] = useState<Idea[]>([]);
  const [query, setQuery] = useState('');
  const [filtered, setFiltered] = useState<Idea[]>([]);
  const [summary, setSummary] = useState('');
  const [summaryLoading, setSummaryLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const fetchIdeas = useCallback(async () => {
    const all = await loadIdeas();
    setIdeas(all);
    setFiltered(all);
    return all;
  }, []);

  const fetchSummary = useCallback(async (all: Idea[]) => {
    const settings = await loadSettings();
    if (!settings.anthropicApiKey || all.length === 0) return;
    setSummaryLoading(true);
    try {
      const text = await generateQuickSummary(all, settings.anthropicApiKey);
      setSummary(text);
    } catch {
      setSummary('');
    } finally {
      setSummaryLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      fetchIdeas().then(fetchSummary);
    }, [fetchIdeas, fetchSummary])
  );

  useEffect(() => {
    if (!query.trim()) {
      setFiltered(ideas);
      return;
    }
    const timer = setTimeout(async () => {
      const result = await searchIdeas(query);
      setFiltered(result);
    }, 300);
    return () => clearTimeout(timer);
  }, [query, ideas]);

  const onRefresh = async () => {
    setRefreshing(true);
    const all = await fetchIdeas();
    await fetchSummary(all);
    setRefreshing(false);
  };

  const renderIdea = ({ item }: { item: Idea }) => {
    const activeAlerts = item.alerts.filter((a) => a.enabled && !a.stopped).length;
    return (
      <TouchableOpacity
        style={styles.card}
        onPress={() => navigation.navigate('IdeaDetail', { ideaId: item.id })}
      >
        <View style={styles.cardHeader}>
          <Text style={styles.cardTitle} numberOfLines={1}>
            {item.title}
          </Text>
          {item.implemented && (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>✓</Text>
            </View>
          )}
        </View>
        <Text style={styles.cardDesc} numberOfLines={2}>
          {item.description}
        </Text>
        <View style={styles.cardFooter}>
          <Text style={styles.cardDate}>
            {new Date(item.createdAt).toLocaleDateString('pt-BR')}
          </Text>
          {activeAlerts > 0 && (
            <Text style={styles.alertBadge}>🔔 {activeAlerts}</Text>
          )}
          {item.tags.length > 0 && (
            <Text style={styles.tags} numberOfLines={1}>
              {item.tags.map((t) => `#${t}`).join(' ')}
            </Text>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>💡 Minhas Ideias</Text>
        <TouchableOpacity onPress={() => navigation.navigate('Settings')}>
          <Text style={styles.settingsBtn}>⚙️</Text>
        </TouchableOpacity>
      </View>

      {(summary || summaryLoading) && (
        <View style={styles.summaryBox}>
          {summaryLoading ? (
            <ActivityIndicator color="#6C63FF" />
          ) : (
            <Text style={styles.summaryText}>{summary}</Text>
          )}
        </View>
      )}

      <TextInput
        style={styles.search}
        placeholder="Pesquisar ideias..."
        placeholderTextColor="#999"
        value={query}
        onChangeText={setQuery}
      />

      <FlatList
        data={filtered}
        keyExtractor={(item) => item.id}
        renderItem={renderIdea}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        ListEmptyComponent={
          <Text style={styles.empty}>
            {query ? 'Nenhuma ideia encontrada.' : 'Nenhuma ideia ainda. Adicione a primeira!'}
          </Text>
        }
        contentContainerStyle={filtered.length === 0 ? styles.emptyContainer : undefined}
      />

      <TouchableOpacity
        style={styles.fab}
        onPress={() => navigation.navigate('AddIdea')}
      >
        <Text style={styles.fabText}>+</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F5F5' },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    paddingTop: 48,
    backgroundColor: '#6C63FF',
  },
  title: { fontSize: 22, fontWeight: 'bold', color: '#FFF' },
  settingsBtn: { fontSize: 24 },
  summaryBox: {
    margin: 12,
    padding: 12,
    backgroundColor: '#EEF',
    borderRadius: 10,
    borderLeftWidth: 4,
    borderLeftColor: '#6C63FF',
  },
  summaryText: { fontSize: 13, color: '#333', lineHeight: 20 },
  search: {
    margin: 12,
    padding: 10,
    backgroundColor: '#FFF',
    borderRadius: 10,
    fontSize: 15,
    color: '#333',
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 4,
  },
  card: {
    backgroundColor: '#FFF',
    marginHorizontal: 12,
    marginBottom: 10,
    padding: 14,
    borderRadius: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.07,
    shadowRadius: 4,
  },
  cardHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 4 },
  cardTitle: { fontSize: 16, fontWeight: '600', color: '#222', flex: 1 },
  badge: {
    backgroundColor: '#4CAF50',
    borderRadius: 10,
    width: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  badgeText: { color: '#FFF', fontSize: 11, fontWeight: 'bold' },
  cardDesc: { fontSize: 13, color: '#666', marginBottom: 8 },
  cardFooter: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  cardDate: { fontSize: 11, color: '#999' },
  alertBadge: { fontSize: 11, color: '#FF7043' },
  tags: { fontSize: 11, color: '#6C63FF', flex: 1 },
  empty: { textAlign: 'center', color: '#999', fontSize: 15 },
  emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  fab: {
    position: 'absolute',
    bottom: 24,
    right: 24,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#6C63FF',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 6,
    shadowColor: '#6C63FF',
    shadowOpacity: 0.4,
    shadowRadius: 8,
  },
  fabText: { color: '#FFF', fontSize: 30, lineHeight: 34 },
});
