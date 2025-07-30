import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  Switch,
} from 'react-native';

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
        <TouchableOpacity
          style={[styles.item, isSelected && styles.selectedItem]}
          onPress={() => {
            onSelect(item);
            setVisible(false);
          }}
        >
          <Text style={[styles.itemText, isSelected && styles.selectedItemText]}>
            {item.name}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.starButton}
          onPress={() => onToggleFavorite(item.id)}
        >
          <Text style={isFav ? styles.favStar : styles.star}>
            {isFav ? '★' : '☆'}
          </Text>
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.selector} onPress={() => setVisible(true)}>
        <Text style={styles.selectorText}>{selectedLocation.name}</Text>
      </TouchableOpacity>
      <Modal visible={visible} transparent animationType="slide">
        <View style={styles.overlay}>
          <View style={styles.modal}>
            <View style={styles.filterRow}>
              <Text style={styles.filterLabel}>Favorites only</Text>
              <Switch value={showFavs} onValueChange={setShowFavs} />
            </View>
            <FlatList
              data={data}
              keyExtractor={(item) => item.id}
              renderItem={renderItem}
            />
            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => setVisible(false)}
            >
              <Text style={styles.closeButtonText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 20,
  },
  selector: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
  },
  selectorText: {
    fontWeight: '600',
    color: '#1C1C1E',
  },
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
  filterRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  filterLabel: {
    fontWeight: 'bold',
    color: '#333',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  item: {
    flex: 1,
    paddingVertical: 6,
    paddingHorizontal: 8,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 4,
    backgroundColor: '#f9f9f9',
  },
  selectedItem: {
    backgroundColor: '#4A90E2',
    borderColor: '#4A90E2',
  },
  itemText: {
    color: '#1C1C1E',
  },
  selectedItemText: {
    color: '#FFFFFF',
  },
  starButton: {
    marginLeft: 8,
    padding: 4,
  },
  star: {
    fontSize: 18,
    color: '#bbb',
  },
  favStar: {
    fontSize: 18,
    color: '#E2A72E',
  },
  closeButton: {
    marginTop: 12,
    paddingVertical: 12,
    alignSelf: 'center',
    paddingHorizontal: 24,
    backgroundColor: '#4A90E2',
    borderRadius: 12,
  },
  closeButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
});
