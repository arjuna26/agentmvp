import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Modal,
  ScrollView,
} from 'react-native';
import { Button } from 'react-native-paper';
import { Ionicons } from '@expo/vector-icons';
import locations from '../utils/locations';

export default function LocationSearch({
  selectedLocation,
  setSelectedLocation,
  useCurrentLocation,
  unit,
  setUnit,
}) {
  const [searchVisible, setSearchVisible] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);

  const searchLocation = useCallback(async () => {
    const query = searchQuery.trim();
    if (!query) return;
    
    setIsSearching(true);
    try {
      const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(
        query
      )}&format=json&limit=5`;
      const resp = await fetch(url, {
        headers: {
          'User-Agent': 'ParkCastMobile/1.0 (https://github.com/arjuna26/agentmvp)',
        },
      });
      const data = await resp.json();
      const results = data.map((item) => ({
        id: `search-${item.lat}-${item.lon}`,
        name: item.display_name,
        lat: parseFloat(item.lat),
        lon: parseFloat(item.lon),
      }));
      setSearchResults(results);
    } catch (err) {
      console.error('Search error', err);
    } finally {
      setIsSearching(false);
    }
  }, [searchQuery]);

  const handleLocationSelect = (location) => {
    setSelectedLocation(location);
    setSearchVisible(false);
    setSearchQuery('');
    setSearchResults([]);
  };

  const clearSearch = () => {
    setSearchQuery('');
    setSearchResults([]);
  };

  return (
    <>
      <View style={styles.container}>
        <TouchableOpacity
          style={styles.searchTrigger}
          onPress={() => setSearchVisible(true)}
        >
          <Text style={styles.searchIcon}>🔍</Text>
          <Text style={styles.searchPlaceholder}>Search locations...</Text>
        </TouchableOpacity>

        <View style={styles.controls}>
          <TouchableOpacity
            style={styles.currentLocationButton}
            onPress={useCurrentLocation}
          >
            <Text style={styles.currentLocationIcon}>📍</Text>
          </TouchableOpacity>

          <View style={styles.unitToggle}>
            {['F', 'C'].map((u) => (
              <TouchableOpacity
                key={u}
                style={[
                  styles.unitButton,
                  unit === u && styles.unitButtonActive,
                ]}
                onPress={() => setUnit(u)}
              >
                <Text
                  style={[
                    styles.unitText,
                    unit === u && styles.unitTextActive,
                  ]}
                >
                  °{u}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </View>

      <Modal
        visible={searchVisible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setSearchVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => setSearchVisible(false)}
            >
              <Text style={styles.closeButtonText}>Cancel</Text>
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Search Locations</Text>
            <View style={styles.placeholder} />
          </View>

          <View style={styles.searchContainer}>
            <View style={styles.searchInputContainer}>
              <Text style={styles.searchInputIcon}>🔍</Text>
              <TextInput
                style={styles.searchInput}
                placeholder="Enter city, state, or address..."
                placeholderTextColor="#8E8E93"
                value={searchQuery}
                onChangeText={setSearchQuery}
                onSubmitEditing={searchLocation}
                returnKeyType="search"
                autoFocus
              />
              {searchQuery !== '' && (
                <TouchableOpacity style={styles.clearButton} onPress={clearSearch}>
                  <Text style={styles.clearIcon}>✕</Text>
                </TouchableOpacity>
              )}
            </View>
            <Button
              mode="contained"
              style={styles.searchButton}
              onPress={searchLocation}
              loading={isSearching}
              disabled={!searchQuery.trim()}
            >
              Search
            </Button>
          </View>

          <ScrollView style={styles.resultsContainer}>
            {/* Preset locations */}
            <Text style={styles.sectionTitle}>Popular Locations</Text>
            {locations.slice(0, 5).map((location) => (
              <TouchableOpacity
                key={location.id}
                style={[
                  styles.locationItem,
                  selectedLocation.id === location.id && styles.selectedLocation,
                ]}
                onPress={() => handleLocationSelect(location)}
              >
                <Text style={styles.locationName}>{location.name}</Text>
                {selectedLocation.id === location.id && (
                  <Text style={styles.checkmark}>✓</Text>
                )}
              </TouchableOpacity>
            ))}

            {/* Search results */}
            {searchResults.length > 0 && (
              <>
                <Text style={styles.sectionTitle}>Search Results</Text>
                {searchResults.map((result) => (
                  <TouchableOpacity
                    key={result.id}
                    style={styles.locationItem}
                    onPress={() => handleLocationSelect(result)}
                  >
                    <Text style={styles.locationName} numberOfLines={2}>
                      {result.name}
                    </Text>
                  </TouchableOpacity>
                ))}
              </>
            )}
          </ScrollView>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    margin: 16,
    marginBottom: 8,
  },
  searchTrigger: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(30,41,59,0.8)',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(59,130,246,0.3)',
  },
  searchIcon: {
    fontSize: 18,
    marginRight: 12,
    color: '#60a5fa',
  },
  searchPlaceholder: {
    color: '#94a3b8',
    fontSize: 16,
    fontWeight: '500',
  },
  controls: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  currentLocationButton: {
    backgroundColor: 'rgba(59,130,246,0.2)',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: 'rgba(59,130,246,0.3)',
  },
  currentLocationIcon: {
    fontSize: 20,
    color: '#60a5fa',
  },
  unitToggle: {
    flexDirection: 'row',
    backgroundColor: 'rgba(30,41,59,0.8)',
    borderRadius: 12,
    padding: 2,
    borderWidth: 1,
    borderColor: 'rgba(59,130,246,0.2)',
  },
  unitButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 10,
  },
  unitButtonActive: {
    backgroundColor: 'rgba(59,130,246,0.8)',
  },
  unitText: {
    color: '#94a3b8',
    fontWeight: '600',
    fontSize: 14,
  },
  unitTextActive: {
    color: '#f8fafc',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#0f172a',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    paddingTop: 48,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(59,130,246,0.2)',
    backgroundColor: '#1e293b',
  },
  closeButton: {
    padding: 8,
  },
  closeButtonText: {
    color: '#60a5fa',
    fontSize: 16,
    fontWeight: '600',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#f8fafc',
  },
  placeholder: {
    width: 60,
  },
  searchContainer: {
    padding: 16,
    backgroundColor: '#1e293b',
  },
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#334155',
    borderRadius: 12,
    paddingHorizontal: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(59,130,246,0.3)',
  },
  searchInputIcon: {
    fontSize: 16,
    marginRight: 8,
    color: '#60a5fa',
  },
  searchInput: {
    flex: 1,
    paddingVertical: 16,
    fontSize: 16,
    color: '#f8fafc',
  },
  clearButton: {
    padding: 4,
  },
  clearIcon: {
    fontSize: 16,
    color: '#94a3b8',
  },
  searchButton: {
    borderRadius: 12,
    backgroundColor: '#3b82f6',
  },
  resultsContainer: {
    flex: 1,
    paddingHorizontal: 16,
    backgroundColor: '#0f172a',
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#f8fafc',
    marginTop: 16,
    marginBottom: 12,
  },
  locationItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#1e293b',
    borderRadius: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: 'rgba(59,130,246,0.2)',
  },
  selectedLocation: {
    backgroundColor: '#1e40af',
    borderColor: '#3b82f6',
  },
  locationName: {
    fontSize: 16,
    color: '#f8fafc',
    fontWeight: '500',
    flex: 1,
    marginRight: 8,
  },
  checkmark: {
    fontSize: 18,
    color: '#60a5fa',
    fontWeight: 'bold',
  },
});
