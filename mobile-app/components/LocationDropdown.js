import React, { useState } from 'react';
import { View, StyleSheet, FlatList } from 'react-native';
import { Modal, Portal, Button, Switch, Text, Card } from 'react-native-paper';

export default function LocationDropdown({
  locations,
  selectedLocation,
  onSelect,
  favorites,
  onToggleFavorite,
}) {
  const [visible, setVisible] = useState(false);
  const [showFavs, setShowFavs] = useState(false);

  const data = locations
    .filter((l) => !showFavs || favorites.includes(l.id))
    .sort((a, b) => {
      const aFav = favorites.includes(a.id) ? 0 : 1;
      const bFav = favorites.includes(b.id) ? 0 : 1;
      return aFav - bFav;
    });

  const renderItem = ({ item }) => {
    const isSelected = selectedLocation.id === item.id;
    const isFav = favorites.includes(item.id);
    return (
      <View style={styles.row}>
        <Button
          mode={isSelected ? 'contained' : 'outlined'}
          style={styles.item}
          onPress={() => {
            onSelect(item);
            setVisible(false);
          }}
        >
          {item.name}
        </Button>
        <Button
          mode="text"
          compact
          onPress={() => onToggleFavorite(item.id)}
          textColor={isFav ? '#E2A72E' : undefined}
        >
          {isFav ? '★' : '☆'}
        </Button>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <Button mode="outlined" onPress={() => setVisible(true)}>
        {selectedLocation.name}
      </Button>
      <Portal>
        <Modal visible={visible} onDismiss={() => setVisible(false)} contentContainerStyle={styles.modal}>
          <View style={styles.filterRow}>
            <Text style={styles.filterLabel}>Favorites only</Text>
            <Switch value={showFavs} onValueChange={setShowFavs} />
          </View>
          <FlatList
            data={data}
            keyExtractor={(item) => item.id}
            renderItem={renderItem}
          />
          <Button mode="contained" style={styles.closeButton} onPress={() => setVisible(false)}>
            Close
          </Button>
        </Modal>
      </Portal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 20,
  },
  modal: {
    backgroundColor: '#1e1e1e',
    borderRadius: 16,
    padding: 20,
    margin: 20,
    maxHeight: '80%',
  },
  filterRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  filterLabel: {
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  item: {
    flex: 1,
    marginVertical: 4,
    marginRight: 8,
  },
  closeButton: {
    marginTop: 12,
    alignSelf: 'center',
  },
});
