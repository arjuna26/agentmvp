import React from 'react';
import { Modal, View, TouchableOpacity, Text, StyleSheet, ScrollView } from 'react-native';
import ForecastCard from './ForecastCard';

export default function ForecastModal({ visible, onClose, periods = [], unit }) {
  return (
    <Modal visible={visible} transparent animationType="slide">
      <View style={styles.overlay}>
        <View style={styles.modal}>
          <ScrollView>
            {periods.map((p) => (
              <ForecastCard key={p.number} period={p} unit={unit} />
            ))}
          </ScrollView>
          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <Text style={styles.closeButtonText}>Close</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.3)',
    justifyContent: 'center',
    padding: 20,
  },
  modal: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    maxHeight: '80%',
  },
  closeButton: {
    marginTop: 12,
    alignSelf: 'center',
    paddingVertical: 12,
    paddingHorizontal: 24,
    backgroundColor: '#4A90E2',
    borderRadius: 12,
  },
  closeButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
});
