import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList, Idea } from '../types';
import { getIdeaById, updateIdea } from '../services/storageService';

type Nav = NativeStackNavigationProp<RootStackParamList, 'EditIdea'>;
type Route = RouteProp<RootStackParamList, 'EditIdea'>;

export default function EditIdeaScreen() {
  const navigation = useNavigation<Nav>();
  const route = useRoute<Route>();
  const { ideaId } = route.params;

  const [idea, setIdea] = useState<Idea | null>(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [tagInput, setTagInput] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [implemented, setImplemented] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    getIdeaById(ideaId).then((i) => {
      if (i) {
        setIdea(i);
        setTitle(i.title);
        setDescription(i.description);
        setTags(i.tags);
        setImplemented(i.implemented);
      }
    });
  }, [ideaId]);

  const addTag = () => {
    const tag = tagInput.trim().toLowerCase().replace(/\s+/g, '-');
    if (tag && !tags.includes(tag)) {
      setTags([...tags, tag]);
    }
    setTagInput('');
  };

  const removeTag = (tag: string) => setTags(tags.filter((t) => t !== tag));

  const save = async () => {
    if (!title.trim()) {
      Alert.alert('Campo obrigatório', 'Por favor, insira um título para a ideia.');
      return;
    }
    if (!idea) return;
    setSaving(true);
    const updated: Idea = {
      ...idea,
      title: title.trim(),
      description: description.trim(),
      tags,
      implemented,
      updatedAt: new Date().toISOString(),
    };
    await updateIdea(updated);
    setSaving(false);
    navigation.goBack();
  };

  if (!idea) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator color="#6C63FF" size="large" />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.back}>← Voltar</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Editar Ideia</Text>
        <View style={{ width: 60 }} />
      </View>

      <ScrollView style={styles.container} keyboardShouldPersistTaps="handled">
        <Text style={styles.label}>Título *</Text>
        <TextInput
          style={styles.input}
          placeholder="Nome da sua ideia..."
          placeholderTextColor="#999"
          value={title}
          onChangeText={setTitle}
          maxLength={100}
        />

        <Text style={styles.label}>Descrição</Text>
        <TextInput
          style={[styles.input, styles.textArea]}
          placeholder="Descreva sua ideia em detalhes..."
          placeholderTextColor="#999"
          value={description}
          onChangeText={setDescription}
          multiline
          numberOfLines={5}
          textAlignVertical="top"
        />

        <Text style={styles.label}>Tags</Text>
        <View style={styles.tagRow}>
          <TextInput
            style={[styles.input, { flex: 1, marginBottom: 0 }]}
            placeholder="Adicionar tag..."
            placeholderTextColor="#999"
            value={tagInput}
            onChangeText={setTagInput}
            onSubmitEditing={addTag}
            returnKeyType="done"
          />
          <TouchableOpacity style={styles.addTagBtn} onPress={addTag}>
            <Text style={styles.addTagText}>+</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.tagList}>
          {tags.map((t) => (
            <TouchableOpacity key={t} style={styles.tag} onPress={() => removeTag(t)}>
              <Text style={styles.tagText}>#{t} ×</Text>
            </TouchableOpacity>
          ))}
        </View>

        <TouchableOpacity
          style={[styles.toggleBtn, implemented && styles.toggleBtnActive]}
          onPress={() => setImplemented(!implemented)}
        >
          <Text style={[styles.toggleText, implemented && styles.toggleTextActive]}>
            {implemented ? '✅ Implementada' : '⬜ Marcar como implementada'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.saveBtn, saving && styles.saveBtnDisabled]}
          onPress={save}
          disabled={saving}
        >
          <Text style={styles.saveBtnText}>{saving ? 'Salvando...' : 'Salvar Alterações'}</Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  loading: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    paddingTop: 48,
    backgroundColor: '#6C63FF',
  },
  back: { color: '#FFF', fontSize: 16 },
  headerTitle: { color: '#FFF', fontSize: 18, fontWeight: 'bold' },
  container: { flex: 1, backgroundColor: '#F5F5F5', padding: 16 },
  label: { fontSize: 14, fontWeight: '600', color: '#444', marginBottom: 6, marginTop: 14 },
  input: {
    backgroundColor: '#FFF',
    borderRadius: 10,
    padding: 12,
    fontSize: 15,
    color: '#222',
    marginBottom: 4,
    elevation: 1,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 3,
  },
  textArea: { height: 120, textAlignVertical: 'top' },
  tagRow: { flexDirection: 'row', gap: 8, alignItems: 'center' },
  addTagBtn: {
    backgroundColor: '#6C63FF',
    width: 44,
    height: 44,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  addTagText: { color: '#FFF', fontSize: 24, lineHeight: 28 },
  tagList: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 10 },
  tag: {
    backgroundColor: '#EEF',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: '#6C63FF33',
  },
  tagText: { color: '#6C63FF', fontSize: 13 },
  toggleBtn: {
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 14,
    alignItems: 'center',
    marginTop: 20,
    borderWidth: 1,
    borderColor: '#DDD',
  },
  toggleBtnActive: { backgroundColor: '#E8F5E9', borderColor: '#4CAF50' },
  toggleText: { fontSize: 15, color: '#666' },
  toggleTextActive: { color: '#388E3C', fontWeight: '600' },
  saveBtn: {
    backgroundColor: '#6C63FF',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginTop: 16,
    marginBottom: 40,
  },
  saveBtnDisabled: { opacity: 0.6 },
  saveBtnText: { color: '#FFF', fontSize: 16, fontWeight: 'bold' },
});
