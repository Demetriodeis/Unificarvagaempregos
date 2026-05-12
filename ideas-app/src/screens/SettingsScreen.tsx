import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Switch,
  Alert,
  Platform,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types';
import { loadSettings, saveSettings, AppSettings } from '../services/storageService';
import { requestPermissions, rescheduleAllAlerts } from '../services/notificationService';
import { loadIdeas } from '../services/storageService';

type Nav = NativeStackNavigationProp<RootStackParamList, 'Settings'>;

export default function SettingsScreen() {
  const navigation = useNavigation<Nav>();
  const [settings, setSettings] = useState<AppSettings>({
    anthropicApiKey: '',
    notificationsEnabled: true,
  });
  const [apiKeyVisible, setApiKeyVisible] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadSettings().then(setSettings);
  }, []);

  const save = async () => {
    setSaving(true);
    await saveSettings(settings);

    if (settings.notificationsEnabled) {
      const granted = await requestPermissions();
      if (!granted) {
        Alert.alert(
          'Permissão negada',
          'Ative as notificações nas configurações do dispositivo para receber alertas.'
        );
      } else {
        const ideas = await loadIdeas();
        await rescheduleAllAlerts(ideas);
      }
    }

    setSaving(false);
    Alert.alert('Configurações salvas', 'Suas configurações foram salvas com sucesso.');
  };

  return (
    <View style={{ flex: 1 }}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.back}>← Voltar</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Configurações</Text>
        <View style={{ width: 60 }} />
      </View>

      <ScrollView style={styles.container}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>🤖 Integração com IA</Text>
          <Text style={styles.sectionDesc}>
            Insira sua chave de API da Anthropic para habilitar a geração de insights com Claude.
          </Text>

          <Text style={styles.label}>Chave de API</Text>
          <View style={styles.apiKeyRow}>
            <TextInput
              style={[styles.input, { flex: 1 }]}
              placeholder="sk-ant-..."
              placeholderTextColor="#999"
              value={settings.anthropicApiKey}
              onChangeText={(v) => setSettings({ ...settings, anthropicApiKey: v })}
              secureTextEntry={!apiKeyVisible}
              autoCapitalize="none"
              autoCorrect={false}
            />
            <TouchableOpacity
              style={styles.eyeBtn}
              onPress={() => setApiKeyVisible(!apiKeyVisible)}
            >
              <Text style={styles.eyeIcon}>{apiKeyVisible ? '🙈' : '👁️'}</Text>
            </TouchableOpacity>
          </View>

          <Text style={styles.hint}>
            Obtenha sua chave em console.anthropic.com. A chave é armazenada apenas localmente no dispositivo.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>🔔 Notificações</Text>
          <View style={styles.switchRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.switchLabel}>Ativar notificações</Text>
              <Text style={styles.switchDesc}>
                Receba lembretes sobre suas ideias nos horários agendados.
              </Text>
            </View>
            <Switch
              value={settings.notificationsEnabled}
              onValueChange={(v) => setSettings({ ...settings, notificationsEnabled: v })}
              trackColor={{ false: '#DDD', true: '#B39DDB' }}
              thumbColor={settings.notificationsEnabled ? '#6C63FF' : '#999'}
            />
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>ℹ️ Sobre</Text>
          <Text style={styles.aboutText}>
            Minhas Ideias — capture, organize e desenvolva suas ideias com ajuda da inteligência artificial.
          </Text>
          <Text style={styles.aboutVersion}>Versão 1.0.0</Text>
        </View>

        <TouchableOpacity
          style={[styles.saveBtn, saving && styles.saveBtnDisabled]}
          onPress={save}
          disabled={saving}
        >
          <Text style={styles.saveBtnText}>{saving ? 'Salvando...' : 'Salvar Configurações'}</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
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
  section: {
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 14,
    elevation: 1,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 3,
  },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: '#333', marginBottom: 8 },
  sectionDesc: { fontSize: 13, color: '#666', marginBottom: 14, lineHeight: 20 },
  label: { fontSize: 13, fontWeight: '600', color: '#555', marginBottom: 6 },
  apiKeyRow: { flexDirection: 'row', gap: 8, alignItems: 'center' },
  input: {
    backgroundColor: '#F8F8F8',
    borderRadius: 10,
    padding: 12,
    fontSize: 14,
    color: '#222',
    borderWidth: 1,
    borderColor: '#EEE',
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  eyeBtn: { padding: 8 },
  eyeIcon: { fontSize: 20 },
  hint: { fontSize: 12, color: '#999', marginTop: 8, lineHeight: 18 },
  switchRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  switchLabel: { fontSize: 15, fontWeight: '600', color: '#333', marginBottom: 4 },
  switchDesc: { fontSize: 13, color: '#666' },
  aboutText: { fontSize: 14, color: '#555', lineHeight: 22 },
  aboutVersion: { fontSize: 12, color: '#BBB', marginTop: 8 },
  saveBtn: {
    backgroundColor: '#6C63FF',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginBottom: 40,
  },
  saveBtnDisabled: { opacity: 0.6 },
  saveBtnText: { color: '#FFF', fontSize: 16, fontWeight: 'bold' },
});

