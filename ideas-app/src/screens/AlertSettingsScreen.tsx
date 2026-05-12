import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  Platform,
} from 'react-native';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { useNavigation, useRoute, RouteProp, useFocusEffect } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { v4 as uuidv4 } from 'uuid';
import { RootStackParamList, Alert as IdeaAlert, Idea } from '../types';
import { getIdeaById, updateIdea } from '../services/storageService';
import {
  requestPermissions,
  scheduleAlert,
  stopAlert,
  stopAllAlertsForIdea,
} from '../services/notificationService';

type Nav = NativeStackNavigationProp<RootStackParamList, 'AlertSettings'>;
type Route = RouteProp<RootStackParamList, 'AlertSettings'>;

export default function AlertSettingsScreen() {
  const navigation = useNavigation<Nav>();
  const route = useRoute<Route>();
  const { ideaId } = route.params;

  const [idea, setIdea] = useState<Idea | null>(null);
  const [pickerDate, setPickerDate] = useState(new Date());
  const [showPicker, setShowPicker] = useState(false);
  const [saving, setSaving] = useState(false);

  useFocusEffect(
    useCallback(() => {
      getIdeaById(ideaId).then((i) => {
        if (i) setIdea(i);
      });
    }, [ideaId])
  );

  const addAlert = async () => {
    if (!idea) return;
    if (pickerDate <= new Date()) {
      Alert.alert('Data inválida', 'Escolha uma data futura para o alerta.');
      return;
    }

    const granted = await requestPermissions();
    if (!granted) {
      Alert.alert(
        'Permissão necessária',
        'Por favor, permita notificações nas configurações do dispositivo.'
      );
      return;
    }

    setSaving(true);
    const newAlert: IdeaAlert = {
      id: uuidv4(),
      enabled: true,
      scheduledDate: pickerDate.toISOString(),
      message: '',
      stopped: false,
    };

    const updatedIdea = { ...idea, alerts: [...idea.alerts, newAlert] };
    await updateIdea(updatedIdea);
    await scheduleAlert(updatedIdea, newAlert);
    setIdea(updatedIdea);
    setSaving(false);
  };

  const handleStop = async (alertId: string) => {
    if (!idea) return;
    Alert.alert('Parar alerta', 'Deseja parar este alerta?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Parar',
        style: 'destructive',
        onPress: async () => {
          await stopAlert(idea.id, alertId);
          const updated = await getIdeaById(idea.id);
          if (updated) setIdea(updated);
        },
      },
    ]);
  };

  const handleStopAll = async () => {
    if (!idea) return;
    Alert.alert('Parar todos os alertas', 'Deseja parar todos os alertas desta ideia?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Parar todos',
        style: 'destructive',
        onPress: async () => {
          await stopAllAlertsForIdea(idea.id);
          const updated = await getIdeaById(idea.id);
          if (updated) setIdea(updated);
        },
      },
    ]);
  };

  const handleDelete = async (alertId: string) => {
    if (!idea) return;
    await stopAlert(idea.id, alertId);
    const withoutAlert = {
      ...idea,
      alerts: idea.alerts.filter((a) => a.id !== alertId),
      updatedAt: new Date().toISOString(),
    };
    await updateIdea(withoutAlert);
    setIdea(withoutAlert);
  };

  const onDateChange = (_event: DateTimePickerEvent, selectedDate?: Date) => {
    if (Platform.OS === 'android') setShowPicker(false);
    if (selectedDate) setPickerDate(selectedDate);
  };

  if (!idea) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator color="#6C63FF" size="large" />
      </View>
    );
  }

  const activeAlerts = idea.alerts.filter((a) => !a.stopped);
  const stoppedAlerts = idea.alerts.filter((a) => a.stopped);

  return (
    <View style={{ flex: 1 }}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.back}>← Voltar</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Alertas</Text>
        <View style={{ width: 60 }} />
      </View>

      <ScrollView style={styles.container}>
        <Text style={styles.ideaTitle}>{idea.title}</Text>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Novo Alerta</Text>
          <TouchableOpacity
            style={styles.datePicker}
            onPress={() => setShowPicker(true)}
          >
            <Text style={styles.datePickerText}>
              📅 {pickerDate.toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' })}
            </Text>
          </TouchableOpacity>

          {showPicker && (
            <DateTimePicker
              value={pickerDate}
              mode="datetime"
              minimumDate={new Date()}
              onChange={onDateChange}
              display={Platform.OS === 'ios' ? 'spinner' : 'default'}
            />
          )}

          <TouchableOpacity
            style={[styles.addBtn, saving && styles.addBtnDisabled]}
            onPress={addAlert}
            disabled={saving}
          >
            <Text style={styles.addBtnText}>{saving ? 'Agendando...' : '+ Agendar Alerta'}</Text>
          </TouchableOpacity>
        </View>

        {activeAlerts.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Alertas Ativos ({activeAlerts.length})</Text>
              {activeAlerts.length > 1 && (
                <TouchableOpacity onPress={handleStopAll}>
                  <Text style={styles.stopAllText}>Parar todos</Text>
                </TouchableOpacity>
              )}
            </View>
            {activeAlerts.map((a) => (
              <View key={a.id} style={styles.alertCard}>
                <View style={styles.alertInfo}>
                  <Text style={styles.alertIcon}>🔔</Text>
                  <View>
                    <Text style={styles.alertDate}>
                      {new Date(a.scheduledDate).toLocaleString('pt-BR', {
                        dateStyle: 'medium',
                        timeStyle: 'short',
                      })}
                    </Text>
                    <Text style={styles.alertStatus}>
                      {new Date(a.scheduledDate) > new Date() ? 'Aguardando' : 'Expirado'}
                    </Text>
                  </View>
                </View>
                <View style={styles.alertActions}>
                  <TouchableOpacity onPress={() => handleStop(a.id)} style={styles.stopBtn}>
                    <Text style={styles.stopBtnText}>Parar</Text>
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => handleDelete(a.id)} style={styles.deleteBtn}>
                    <Text style={styles.deleteBtnText}>🗑️</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))}
          </View>
        )}

        {stoppedAlerts.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Alertas Parados ({stoppedAlerts.length})</Text>
            {stoppedAlerts.map((a) => (
              <View key={a.id} style={[styles.alertCard, styles.alertCardStopped]}>
                <View style={styles.alertInfo}>
                  <Text style={styles.alertIcon}>🔕</Text>
                  <View>
                    <Text style={[styles.alertDate, styles.alertDateStopped]}>
                      {new Date(a.scheduledDate).toLocaleString('pt-BR', {
                        dateStyle: 'medium',
                        timeStyle: 'short',
                      })}
                    </Text>
                    <Text style={styles.alertStatus}>Parado</Text>
                  </View>
                </View>
                <TouchableOpacity onPress={() => handleDelete(a.id)} style={styles.deleteBtn}>
                  <Text style={styles.deleteBtnText}>🗑️</Text>
                </TouchableOpacity>
              </View>
            ))}
          </View>
        )}

        {idea.alerts.length === 0 && (
          <Text style={styles.empty}>
            Nenhum alerta ainda. Adicione um acima para ser lembrado desta ideia!
          </Text>
        )}
      </ScrollView>
    </View>
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
  ideaTitle: { fontSize: 17, fontWeight: '700', color: '#333', marginBottom: 16 },
  section: {
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 14,
    marginBottom: 14,
    elevation: 1,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 3,
  },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  sectionTitle: { fontSize: 15, fontWeight: '700', color: '#444', marginBottom: 12 },
  stopAllText: { color: '#E53935', fontSize: 13, fontWeight: '600' },
  datePicker: {
    backgroundColor: '#F0F0FF',
    borderRadius: 10,
    padding: 12,
    alignItems: 'center',
    marginBottom: 12,
  },
  datePickerText: { fontSize: 15, color: '#6C63FF', fontWeight: '600' },
  addBtn: {
    backgroundColor: '#6C63FF',
    borderRadius: 10,
    padding: 14,
    alignItems: 'center',
  },
  addBtnDisabled: { opacity: 0.6 },
  addBtnText: { color: '#FFF', fontSize: 15, fontWeight: '600' },
  alertCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#FFF9E6',
    borderRadius: 10,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#FFE082',
  },
  alertCardStopped: { backgroundColor: '#F5F5F5', borderColor: '#DDD' },
  alertInfo: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  alertIcon: { fontSize: 20 },
  alertDate: { fontSize: 14, fontWeight: '600', color: '#333' },
  alertDateStopped: { color: '#999' },
  alertStatus: { fontSize: 11, color: '#888', marginTop: 2 },
  alertActions: { flexDirection: 'row', gap: 8, alignItems: 'center' },
  stopBtn: {
    backgroundColor: '#FFE0B2',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  stopBtnText: { color: '#E65100', fontSize: 12, fontWeight: '600' },
  deleteBtn: { padding: 4 },
  deleteBtnText: { fontSize: 18 },
  empty: { textAlign: 'center', color: '#999', fontSize: 14, marginTop: 20, lineHeight: 22 },
});
