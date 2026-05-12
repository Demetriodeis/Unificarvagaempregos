import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useNavigation, useRoute, RouteProp, useFocusEffect } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList, Idea } from '../types';
import { getIdeaById, updateIdea, deleteIdea, loadSettings } from '../services/storageService';
import { generateInsights } from '../services/aiService';
import { stopAllAlertsForIdea } from '../services/notificationService';

type Nav = NativeStackNavigationProp<RootStackParamList, 'IdeaDetail'>;
type Route = RouteProp<RootStackParamList, 'IdeaDetail'>;

export default function IdeaDetailScreen() {
  const navigation = useNavigation<Nav>();
  const route = useRoute<Route>();
  const { ideaId } = route.params;

  const [idea, setIdea] = useState<Idea | null>(null);
  const [insightsText, setInsightsText] = useState('');
  const [generating, setGenerating] = useState(false);
  const [apiKeyMissing, setApiKeyMissing] = useState(false);

  useFocusEffect(
    useCallback(() => {
      getIdeaById(ideaId).then((i) => {
        if (i) {
          setIdea(i);
          if (i.aiInsights) setInsightsText(i.aiInsights);
        }
      });
    }, [ideaId])
  );

  const generateAI = async () => {
    if (!idea) return;
    const settings = await loadSettings();
    if (!settings.anthropicApiKey) {
      setApiKeyMissing(true);
      return;
    }
    setApiKeyMissing(false);
    setGenerating(true);
    setInsightsText('');

    await generateInsights(idea, settings.anthropicApiKey, (chunk) => {
      setInsightsText((prev) => prev + chunk);
    });

    setGenerating(false);

    const updated: Idea = {
      ...idea,
      aiInsights: insightsText,
      insightsGeneratedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    await updateIdea(updated);
    setIdea(updated);
  };

  const toggleImplemented = async () => {
    if (!idea) return;
    const updated = { ...idea, implemented: !idea.implemented, updatedAt: new Date().toISOString() };
    await updateIdea(updated);
    setIdea(updated);
  };

  const handleDelete = () => {
    Alert.alert('Excluir Ideia', 'Tem certeza que deseja excluir esta ideia?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Excluir',
        style: 'destructive',
        onPress: async () => {
          if (idea) await stopAllAlertsForIdea(idea.id);
          await deleteIdea(ideaId);
          navigation.goBack();
        },
      },
    ]);
  };

  if (!idea) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator color="#6C63FF" size="large" />
      </View>
    );
  }

  const activeAlerts = idea.alerts.filter((a) => a.enabled && !a.stopped).length;

  return (
    <View style={{ flex: 1 }}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.back}>← Voltar</Text>
        </TouchableOpacity>
        <View style={styles.headerActions}>
          <TouchableOpacity onPress={() => navigation.navigate('EditIdea', { ideaId })}>
            <Text style={styles.headerBtn}>✏️</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={handleDelete}>
            <Text style={styles.headerBtn}>🗑️</Text>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView style={styles.container}>
        <View style={styles.titleRow}>
          <Text style={styles.title}>{idea.title}</Text>
          <TouchableOpacity style={styles.implementedBtn} onPress={toggleImplemented}>
            <Text style={styles.implementedText}>
              {idea.implemented ? '✅ Implementada' : '⬜ Pendente'}
            </Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.date}>
          Criada em {new Date(idea.createdAt).toLocaleDateString('pt-BR')}
        </Text>

        {idea.tags.length > 0 && (
          <View style={styles.tagList}>
            {idea.tags.map((t) => (
              <View key={t} style={styles.tag}>
                <Text style={styles.tagText}>#{t}</Text>
              </View>
            ))}
          </View>
        )}

        {idea.description ? (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Descrição</Text>
            <Text style={styles.sectionText}>{idea.description}</Text>
          </View>
        ) : null}

        <TouchableOpacity
          style={styles.alertBtn}
          onPress={() => navigation.navigate('AlertSettings', { ideaId })}
        >
          <Text style={styles.alertBtnText}>
            🔔 Alertas{activeAlerts > 0 ? ` (${activeAlerts} ativo${activeAlerts > 1 ? 's' : ''})` : ''}
          </Text>
        </TouchableOpacity>

        <View style={styles.insightsSection}>
          <View style={styles.insightsHeader}>
            <Text style={styles.sectionTitle}>💡 Insights de IA</Text>
            <TouchableOpacity
              style={[styles.genBtn, generating && styles.genBtnDisabled]}
              onPress={generateAI}
              disabled={generating}
            >
              <Text style={styles.genBtnText}>{generating ? '...' : '✨ Gerar'}</Text>
            </TouchableOpacity>
          </View>

          {apiKeyMissing && (
            <TouchableOpacity onPress={() => navigation.navigate('Settings')}>
              <Text style={styles.apiKeyWarning}>
                ⚠️ Configure sua chave de API nas Configurações para usar a IA.
              </Text>
            </TouchableOpacity>
          )}

          {insightsText ? (
            <Text style={styles.insightsText}>{insightsText}</Text>
          ) : !generating ? (
            <Text style={styles.insightsEmpty}>
              {idea.insightsGeneratedAt
                ? 'Toque em ✨ Gerar para atualizar os insights.'
                : 'Toque em ✨ Gerar para criar insights com IA sobre esta ideia.'}
            </Text>
          ) : null}

          {generating && <ActivityIndicator color="#6C63FF" style={{ marginTop: 12 }} />}

          {idea.insightsGeneratedAt && !generating && (
            <Text style={styles.insightsDate}>
              Gerado em {new Date(idea.insightsGeneratedAt).toLocaleDateString('pt-BR')}
            </Text>
          )}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  loading: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    paddingTop: 48,
    backgroundColor: '#6C63FF',
  },
  back: { color: '#FFF', fontSize: 16 },
  headerActions: { flexDirection: 'row', gap: 12 },
  headerBtn: { fontSize: 22 },
  container: { flex: 1, backgroundColor: '#F5F5F5', padding: 16 },
  titleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 },
  title: { fontSize: 22, fontWeight: 'bold', color: '#222', flex: 1, marginRight: 12 },
  implementedBtn: {
    backgroundColor: '#FFF',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: '#DDD',
  },
  implementedText: { fontSize: 13 },
  date: { fontSize: 12, color: '#999', marginBottom: 10 },
  tagList: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 14 },
  tag: { backgroundColor: '#EEF', borderRadius: 20, paddingHorizontal: 10, paddingVertical: 4 },
  tagText: { color: '#6C63FF', fontSize: 12 },
  section: { backgroundColor: '#FFF', borderRadius: 12, padding: 14, marginBottom: 12 },
  sectionTitle: { fontSize: 15, fontWeight: '700', color: '#444', marginBottom: 8 },
  sectionText: { fontSize: 14, color: '#555', lineHeight: 22 },
  alertBtn: {
    backgroundColor: '#FFF3E0',
    borderRadius: 12,
    padding: 14,
    alignItems: 'center',
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#FFB74D',
  },
  alertBtnText: { fontSize: 15, color: '#E65100', fontWeight: '600' },
  insightsSection: { backgroundColor: '#FFF', borderRadius: 12, padding: 14, marginBottom: 30 },
  insightsHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  genBtn: { backgroundColor: '#6C63FF', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 6 },
  genBtnDisabled: { opacity: 0.5 },
  genBtnText: { color: '#FFF', fontSize: 13, fontWeight: '600' },
  apiKeyWarning: { color: '#E65100', fontSize: 13, marginBottom: 10 },
  insightsText: { fontSize: 14, color: '#333', lineHeight: 22 },
  insightsEmpty: { fontSize: 13, color: '#999', fontStyle: 'italic' },
  insightsDate: { fontSize: 11, color: '#BBB', marginTop: 10 },
});
