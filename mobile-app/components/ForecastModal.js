import React from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { Modal, Portal, Button, Text } from 'react-native-paper';
import ForecastCard from './ForecastCard';

export default function ForecastModal({ visible, onClose, periods = [], unit }) {
  return (
    <Portal>
      <Modal visible={visible} onDismiss={onClose} contentContainerStyle={styles.modal}>
        <ScrollView>
          {periods.map((p) => (
            <ForecastCard key={p.number} period={p} unit={unit} />
          ))}
        </ScrollView>
        <Button mode="contained" style={styles.closeButton} onPress={onClose}>
          Close
        </Button>
      </Modal>
    </Portal>
  );
}

const styles = StyleSheet.create({
  modal: {
    backgroundColor: '#1e1e1e',
    borderRadius: 16,
    padding: 20,
    margin: 20,
    maxHeight: '80%',
  },
  closeButton: {
    marginTop: 12,
    alignSelf: 'center',
  },
  closeButtonText: {},
});
