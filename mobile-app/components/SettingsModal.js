import { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Card, Switch } from 'react-native-paper';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../utils/supabase';

export default function SettingsModal({ visible, onClose, onTemperatureUnitChange }) {
  const insets = useSafeAreaInsets();
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [temperatureUnit, setTemperatureUnit] = useState('F');
  const [notifications, setNotifications] = useState(true);
  const [locationSharing, setLocationSharing] = useState(true);

  useEffect(() => {
    if (visible) {
      loadProfile();
    }
  }, [visible]);

  const loadProfile = async () => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      
      if (user) {
        setUser(user);
        
        const { data: profile, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single();

        if (error && error.code !== 'PGRST116') {
          throw error;
        }

        if (profile) {
          setProfile(profile);
          setTemperatureUnit(profile.temperature_unit || 'F');
          setNotifications(profile.notifications_enabled ?? true);
          setLocationSharing(profile.location_sharing ?? true);
        }
      }
    } catch (error) {
      console.error('Error loading profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateSetting = async (updates) => {
    try {
      if (!user) return;

      const { error } = await supabase
        .from('profiles')
        .upsert({
          id: user.id,
          email: user.email,
          ...updates,
          updated_at: new Date().toISOString(),
        });

      if (error) throw error;
    } catch (error) {
      console.error('Error updating setting:', error);
      Alert.alert('Error', 'Failed to update setting');
    }
  };

  const handleTemperatureUnitChange = async (unit) => {
    setTemperatureUnit(unit);
    await updateSetting({ temperature_unit: unit });
    if (onTemperatureUnitChange) {
      onTemperatureUnitChange(unit);
    }
  };

  const handleNotificationChange = async (value) => {
    setNotifications(value);
    await updateSetting({ notifications_enabled: value });
  };

  const handleLocationSharingChange = async (value) => {
    setLocationSharing(value);
    await updateSetting({ location_sharing: value });
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={[styles.container, { paddingBottom: insets.bottom }]}>
        <LinearGradient colors={['#0f172a', '#1e293b', '#334155']} style={styles.gradient}>
          <View style={[styles.header, { paddingTop: Math.max(insets.top, 40) }]}>
            <Text style={styles.title}>Quick Settings</Text>
            <TouchableOpacity style={styles.closeButton} onPress={onClose}>
              <Ionicons name="close" size={24} color="#60a5fa" />
            </TouchableOpacity>
          </View>

          <View style={styles.content}>
            {/* Temperature Unit */}
            <Card style={styles.card}>
              <Card.Content style={styles.cardContent}>
                <View style={styles.settingRow}>
                  <View style={styles.settingInfo}>
                    <Ionicons name="thermometer" size={20} color="#60a5fa" style={styles.settingIcon} />
                    <Text style={styles.settingLabel}>Temperature Unit</Text>
                  </View>
                  <TouchableOpacity 
                    style={styles.unitToggle}
                    onPress={() => handleTemperatureUnitChange(temperatureUnit === 'F' ? 'C' : 'F')}
                  >
                    <Text style={[
                      styles.unitText, 
                      temperatureUnit === 'F' && styles.unitTextActive
                    ]}>°F</Text>
                    <Text style={styles.unitDivider}>|</Text>
                    <Text style={[
                      styles.unitText, 
                      temperatureUnit === 'C' && styles.unitTextActive
                    ]}>°C</Text>
                  </TouchableOpacity>
                </View>
              </Card.Content>
            </Card>

            {/* Notifications */}
            <Card style={styles.card}>
              <Card.Content style={styles.cardContent}>
                <View style={styles.settingRow}>
                  <View style={styles.settingInfo}>
                    <Ionicons name="notifications" size={20} color="#60a5fa" style={styles.settingIcon} />
                    <Text style={styles.settingLabel}>Notifications</Text>
                  </View>
                  <Switch
                    value={notifications}
                    onValueChange={handleNotificationChange}
                    thumbColor={notifications ? "#60a5fa" : "#94a3b8"}
                    trackColor={{ false: "rgba(148,163,184,0.3)", true: "rgba(96,165,250,0.3)" }}
                  />
                </View>
              </Card.Content>
            </Card>

            {/* Location Sharing */}
            <Card style={styles.card}>
              <Card.Content style={styles.cardContent}>
                <View style={styles.settingRow}>
                  <View style={styles.settingInfo}>
                    <Ionicons name="location" size={20} color="#60a5fa" style={styles.settingIcon} />
                    <Text style={styles.settingLabel}>Location Sharing</Text>
                  </View>
                  <Switch
                    value={locationSharing}
                    onValueChange={handleLocationSharingChange}
                    thumbColor={locationSharing ? "#60a5fa" : "#94a3b8"}
                    trackColor={{ false: "rgba(148,163,184,0.3)", true: "rgba(96,165,250,0.3)" }}
                  />
                </View>
              </Card.Content>
            </Card>
          </View>
        </LinearGradient>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f172a',
  },
  gradient: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(59,130,246,0.2)',
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#f8fafc',
  },
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(59,130,246,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(59,130,246,0.3)',
  },
  content: {
    padding: 20,
    flex: 1,
  },
  card: {
    marginBottom: 16,
    backgroundColor: 'rgba(30,41,59,0.95)',
    borderRadius: 20,
    borderWidth: 2,
    borderColor: 'rgba(59,130,246,0.25)',
    elevation: 15,
    shadowColor: '#3b82f6',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 15,
  },
  cardContent: {
    padding: 20,
  },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  settingInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  settingIcon: {
    marginRight: 12,
  },
  settingLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#f8fafc',
    letterSpacing: 0.2,
  },
  unitToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(59,130,246,0.1)',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: 'rgba(59,130,246,0.3)',
  },
  unitText: {
    fontSize: 14,
    color: '#94a3b8',
    fontWeight: '600',
    paddingHorizontal: 8,
  },
  unitTextActive: {
    color: '#60a5fa',
  },
  unitDivider: {
    fontSize: 14,
    color: '#475569',
    marginHorizontal: 4,
  },
});
