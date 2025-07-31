import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Button, Card, Avatar } from 'react-native-paper';

export default function ProfileScreen() {
  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <LinearGradient colors={['#ff7e5f', '#feb47b']} style={styles.gradient}>
        <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContainer}>
          <View style={styles.header}>
            <Avatar.Icon 
              size={80} 
              icon="account" 
              style={styles.avatar}
              color="#ffffff"
            />
            <Text style={styles.title}>Profile</Text>
            <Text style={styles.subtitle}>Manage your preferences</Text>
          </View>

          <View style={styles.content}>
            <Card style={styles.card}>
              <Card.Content style={styles.cardContent}>
                <View style={styles.settingRow}>
                  <Text style={styles.settingLabel}>Temperature Unit</Text>
                  <Text style={styles.settingValue}>Fahrenheit</Text>
                </View>
              </Card.Content>
            </Card>

            <Card style={styles.card}>
              <Card.Content style={styles.cardContent}>
                <View style={styles.settingRow}>
                  <Text style={styles.settingLabel}>Notifications</Text>
                  <Text style={styles.settingValue}>Enabled</Text>
                </View>
              </Card.Content>
            </Card>

            <Card style={styles.card}>
              <Card.Content style={styles.cardContent}>
                <View style={styles.settingRow}>
                  <Text style={styles.settingLabel}>Location Services</Text>
                  <Text style={styles.settingValue}>Always</Text>
                </View>
              </Card.Content>
            </Card>

            <View style={styles.buttonContainer}>
              <Button 
                mode="outlined" 
                style={styles.button}
                labelStyle={styles.buttonLabel}
              >
                Settings
              </Button>
              <Button 
                mode="outlined" 
                style={styles.button}
                labelStyle={styles.buttonLabel}
              >
                About
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
  header: {
    alignItems: 'center',
    padding: 24,
    paddingTop: 40,
  },
  avatar: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    marginBottom: 16,
  },
  title: {
    fontSize: 32,
    fontWeight: '800',
    color: '#ffffff',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.8)',
    fontWeight: '500',
  },
  content: {
    paddingHorizontal: 16,
  },
  card: {
    marginBottom: 12,
    backgroundColor: 'rgba(255,255,255,0.9)',
    borderRadius: 16,
  },
  cardContent: {
    paddingVertical: 16,
  },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  settingLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333333',
  },
  settingValue: {
    fontSize: 16,
    color: '#666666',
  },
  buttonContainer: {
    marginTop: 24,
  },
  button: {
    marginBottom: 12,
    borderColor: 'rgba(255,255,255,0.7)',
    borderRadius: 12,
  },
  buttonLabel: {
    color: '#ffffff',
    fontWeight: '600',
    fontSize: 16,
  },
});
