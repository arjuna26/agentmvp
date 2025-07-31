import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Button } from 'react-native-paper';

export default function WeatherAlerts({ alerts, notifyAlerts }) {
  if (!alerts || !alerts.features || alerts.features.length === 0) {
    return null;
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.alertIcon}>⚠️</Text>
        <Text style={styles.title}>Weather Alerts</Text>
      </View>
      
      {alerts.features.map((alert, index) => (
        <View key={index} style={styles.alertCard}>
          <Text style={styles.alertTitle}>{alert.properties.event}</Text>
          <Text style={styles.alertDescription} numberOfLines={3}>
            {alert.properties.headline || alert.properties.description}
          </Text>
        </View>
      ))}
      
      <Button
        mode="contained"
        style={styles.notifyButton}
        onPress={notifyAlerts}
        labelStyle={styles.notifyButtonLabel}
        icon="bell"
      >
        Get Notifications
      </Button>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    margin: 16,
    backgroundColor: 'rgba(30,41,59,0.8)',
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(239,68,68,0.4)',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  alertIcon: {
    fontSize: 24,
    marginRight: 12,
  },
  title: {
    fontSize: 20,
    color: '#f8fafc',
    fontWeight: '700',
  },
  alertCard: {
    backgroundColor: 'rgba(15,23,42,0.8)',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(239,68,68,0.3)',
  },
  alertTitle: {
    fontSize: 16,
    color: '#f8fafc',
    fontWeight: '600',
    marginBottom: 8,
  },
  alertDescription: {
    fontSize: 14,
    color: '#94a3b8',
    lineHeight: 20,
  },
  notifyButton: {
    backgroundColor: 'rgba(239,68,68,0.8)',
    borderRadius: 12,
    marginTop: 8,
  },
  notifyButtonLabel: {
    color: '#ffffff',
    fontWeight: '600',
  },
});
