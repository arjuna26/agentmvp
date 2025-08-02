import { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Button, Card, Avatar, TextInput, Switch } from 'react-native-paper';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import * as Notifications from 'expo-notifications';
import * as Location from 'expo-location';
import { supabase } from '../utils/supabase';
import GlowingText from '../components/GlowingText';

export default function ProfileScreen() {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [displayName, setDisplayName] = useState('');
  const [notifications, setNotifications] = useState(true);
  const [temperatureUnit, setTemperatureUnit] = useState('F');
  const [locationSharing, setLocationSharing] = useState(true);
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    getProfile();
  }, []);

  const getProfile = async () => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      
      if (user) {
        setUser(user);
        
        // Fetch profile data from profiles table
        const { data: profile, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single();

        if (error && error.code !== 'PGRST116') { // PGRST116 = not found
          throw error;
        }

        if (profile) {
          setProfile(profile);
          setDisplayName(profile.display_name || '');
          setTemperatureUnit(profile.temperature_unit || 'F');
          setNotifications(profile.notifications_enabled ?? true);
          setLocationSharing(profile.location_sharing ?? true);
        } else {
          // Fallback to user metadata if profile doesn't exist yet
          setDisplayName(user.user_metadata?.display_name || user.email?.split('@')[0] || '');
        }
      }
    } catch (error) {
      console.error('Error loading profile:', error);
      Alert.alert('Error', 'Failed to load profile');
    } finally {
      setLoading(false);
    }
  };

  const handleTemperatureUnitChange = async (newUnit) => {
    setTemperatureUnit(newUnit);
    
    // Immediately save to database
    try {
      const { error } = await supabase
        .from('profiles')
        .upsert({
          id: user.id,
          email: user.email,
          temperature_unit: newUnit,
          updated_at: new Date().toISOString(),
        });

      if (error) throw error;
    } catch (error) {
      console.error('Error updating temperature unit:', error);
      // Revert the change if save failed
      setTemperatureUnit(temperatureUnit === 'F' ? 'C' : 'F');
      Alert.alert('Error', 'Failed to update temperature unit');
    }
  };

  const handleNotificationChange = async (value) => {
    if (value) {
      // Try to request permission if user wants to enable notifications
      try {
        await Notifications.requestPermissionsAsync();
      } catch (error) {
        console.error('Error requesting notification permission:', error);
      }
    }

    setNotifications(value);
    
    // Save to database
    try {
      const { error } = await supabase
        .from('profiles')
        .upsert({
          id: user.id,
          email: user.email,
          notifications_enabled: value,
          updated_at: new Date().toISOString(),
        });

      if (error) throw error;
    } catch (error) {
      console.error('Error updating notifications:', error);
      setNotifications(!value);
      Alert.alert('Error', 'Failed to update notification setting');
    }
  };

  const handleLocationSharingChange = async (value) => {
    if (value) {
      // Try to request permission if user wants to enable location sharing
      try {
        await Location.requestForegroundPermissionsAsync();
      } catch (error) {
        console.error('Error requesting location permission:', error);
      }
    }

    setLocationSharing(value);
    
    // Save to database
    try {
      const { error } = await supabase
        .from('profiles')
        .upsert({
          id: user.id,
          email: user.email,
          location_sharing: value,
          updated_at: new Date().toISOString(),
        });

      if (error) throw error;
    } catch (error) {
      console.error('Error updating location sharing:', error);
      setLocationSharing(!value);
      Alert.alert('Error', 'Failed to update location sharing setting');
    }
  };

  const updateProfile = async () => {
    try {
      setUpdating(true);
      
      // Update profiles table
      const { error } = await supabase
        .from('profiles')
        .upsert({
          id: user.id,
          email: user.email,
          display_name: displayName,
          temperature_unit: temperatureUnit,
          notifications_enabled: notifications,
          location_sharing: locationSharing,
          updated_at: new Date().toISOString(),
        });

      if (error) throw error;
      
      Alert.alert('Success', 'Profile updated successfully');
      setEditing(false);
      
      // Refresh profile data
      await getProfile();
    } catch (error) {
      console.error('Error updating profile:', error);
      Alert.alert('Error', error.message);
    } finally {
      setUpdating(false);
    }
  };

  const handleSignOut = async () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Sign Out', 
          style: 'destructive',
          onPress: () => supabase.auth.signOut()
        }
      ]
    );
  };

  const handleAbout = () => {
    Alert.alert(
      'About WeatherCast',
      'Version 1.0.0\n\nBuilt with React Native & Supabase\n\nWeather data provided by National Weather Service\n\n© 2025 WeatherCast',
      [
        { text: 'Privacy Policy', onPress: () => Linking.openURL('https://example.com/privacy') },
        { text: 'Terms of Service', onPress: () => Linking.openURL('https://example.com/terms') },
        { text: 'OK', style: 'default' }
      ]
    );
  };

  const handleEditProfile = async () => {
    if (editing) {
      // Save changes
      await updateProfile();
    } else {
      // Start editing
      setEditing(true);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <StatusBar style="light" backgroundColor="transparent" translucent />
        <LinearGradient colors={['#0f172a', '#1e293b', '#334155']} style={styles.gradient}>
          <View style={styles.loadingContainer}>
            <GlowingText style={styles.loadingText}>Loading Profile...</GlowingText>
          </View>
        </LinearGradient>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <StatusBar style="light" backgroundColor="transparent" translucent />
      <LinearGradient colors={['#0f172a', '#1e293b', '#334155']} style={styles.gradient}>
        <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContainer}>
          {/* Header Section */}
          <View style={styles.header}>
            <View style={styles.avatarContainer}>
              <Avatar.Icon 
                size={100} 
                icon="account" 
                style={styles.avatar}
                color="#ffffff"
              />
              <TouchableOpacity style={styles.editAvatarButton}>
                <Ionicons name="camera" size={20} color="#60a5fa" />
              </TouchableOpacity>
            </View>
            
            <GlowingText style={styles.title}>
              {displayName || user?.email?.split('@')[0] || 'User'}
            </GlowingText>
            <Text style={styles.subtitle}>{user?.email}</Text>
            
            <TouchableOpacity 
              style={styles.editButton}
              onPress={handleEditProfile}
            >
              <Ionicons 
                name={editing ? "checkmark" : "pencil"} 
                size={16} 
                color="#60a5fa" 
                style={{ marginRight: 8 }}
              />
              <Text style={styles.editButtonText}>
                {editing ? 'Save' : 'Edit Profile'}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Profile Content */}
          <View style={styles.content}>
            {editing ? (
              <View style={styles.editingContainer}>
                <Card style={styles.editCard}>
                  <Card.Content style={styles.editCardContent}>
                    <TextInput
                      label="Display Name"
                      value={displayName}
                      onChangeText={setDisplayName}
                      style={styles.input}
                      theme={{
                        colors: {
                          primary: "#60a5fa",
                          onSurface: "#f8fafc",
                          surface: "rgba(30,41,59,0.95)",
                          onSurfaceVariant: "#94a3b8",
                          outline: "rgba(59,130,246,0.3)",
                        },
                      }}
                      mode="outlined"
                    />
                  </Card.Content>
                </Card>
              </View>
            ) : null}

            {/* Settings Cards */}
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

            {/* Action Buttons */}
            <View style={styles.buttonContainer}>
              <Button
                mode=""   
                style={styles.button}
                labelStyle={styles.buttonLabel}
                onPress={handleAbout}
                icon={() => <Ionicons name="information-circle" size={16} color="#60a5fa" />}
              >
                About
              </Button>
              
              <Button
                mode=""
                style={[styles.button, styles.signOutButton]}
                labelStyle={[styles.buttonLabel, styles.signOutButtonLabel]}
                onPress={handleSignOut}
                icon={() => <Ionicons name="log-out" size={16} color="#ef4444" />}
              >
                Sign Out
              </Button>
            </View>
          </View>
        </ScrollView>
      </LinearGradient>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  gradient: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContainer: {
    paddingBottom: 100,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 18,
    color: '#f8fafc',
    fontWeight: '500',
  },
  header: {
    alignItems: 'center',
    padding: 32,
    paddingTop: 60,
  },
  avatarContainer: {
    position: 'relative',
    marginBottom: 24,
  },
  avatar: {
    backgroundColor: 'rgba(59,130,246,0.2)',
    borderWidth: 3,
    borderColor: 'rgba(59,130,246,0.3)',
    shadowColor: '#3b82f6',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.8,
    shadowRadius: 25,
    elevation: 15,
  },
  editAvatarButton: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: 'rgba(30,41,59,0.95)',
    borderRadius: 20,
    width: 36,
    height: 36,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'rgba(59,130,246,0.3)',
  },
  title: {
    fontSize: 32,
    color: '#ffffff',
    fontWeight: '700',
    marginBottom: 8,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 16,
    color: '#94a3b8',
    fontWeight: '500',
    marginBottom: 24,
  },
  editButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(59,130,246,0.1)',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(59,130,246,0.3)',
  },
  editButtonText: {
    color: '#60a5fa',
    fontSize: 14,
    fontWeight: '600',
    letterSpacing: 0.3,
  },
  content: {
    paddingHorizontal: 20,
  },
  editingContainer: {
    marginBottom: 24,
  },
  editCard: {
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
  editCardContent: {
    padding: 20,
  },
  input: {
    backgroundColor: 'rgba(30,41,59,0.95)',
    marginBottom: 16,
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
  settingValue: {
    fontSize: 16,
    color: '#94a3b8',
    fontWeight: '500',
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
  buttonContainer: {
    marginTop: 32,
    paddingBottom: 20,
    gap: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    justifyContent: 'center',
  },
  buttonLabel: {
    color: '#60a5fa',
    fontWeight: '600',
    fontSize: 16,
    letterSpacing: 0.2,
  },
  signOutButton: {
    backgroundColor: 'rgba(239,68,68,0.05)',
  },
  signOutButtonLabel: {
    color: '#ef4444',
  },
});
