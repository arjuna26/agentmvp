import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  StyleSheet,
  Dimensions,
  ActivityIndicator,
  Text,
  TouchableOpacity,
  Alert,
} from 'react-native';
import MapView, { Marker } from 'react-native-maps';
import * as Location from 'expo-location';
import { Ionicons } from '@expo/vector-icons';
import SettingsModal from '../components/SettingsModal';
import MatchInfoCard from '../components/MatchInfoCard';
import {
  getUpcomingPLFixtures,
  getMatchPredictions,
  getMatchOdds,
} from '../utils/footballApi';

const { width, height } = Dimensions.get('window');

export default function MapScreen() {
  const [region, setRegion] = useState({
    latitude: 39.8283,
    longitude: -98.5795,
    latitudeDelta: 20,
    longitudeDelta: 20,
  });
  const [fixtures, setFixtures] = useState([]);
  const [selectedMatch, setSelectedMatch] = useState(null);
  const [predictions, setPredictions] = useState(null);
  const [odds, setOdds] = useState(null);
  const [loading, setLoading] = useState(false);
  const [userLocation, setUserLocation] = useState(null);
  const [unit, setUnit] = useState('F');
  const [settingsVisible, setSettingsVisible] = useState(false);
  const mapRef = useRef(null);

  useEffect(() => {
    getCurrentLocation();
    fetchFixtures();
  }, []);

  const fetchFixtures = async () => {
    try {
      const data = await getUpcomingPLFixtures();
      setFixtures(data);
    } catch (error) {
      console.error('Error fetching fixtures:', error);
      Alert.alert('Fixtures Error', 'Unable to fetch upcoming fixtures.');
    }
  };

  const getCurrentLocation = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        console.log('Location permission denied');
        return;
      }

      const location = await Location.getCurrentPositionAsync({});
      const userCoords = {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      };

      setUserLocation(userCoords);
      setRegion({
        ...userCoords,
        latitudeDelta: 0.5,
        longitudeDelta: 0.5,
      });
    } catch (error) {
      console.log('Error getting location:', error);
    }
  };

  const onMatchMarkerPress = async (fixture) => {
    setSelectedMatch(fixture);
    setLoading(true);
    try {
      const [preds, oddsData] = await Promise.all([
        getMatchPredictions(fixture.id),
        getMatchOdds(fixture.id),
      ]);
      setPredictions(preds);
      setOdds(oddsData);
    } catch (error) {
      console.error('Error fetching match data:', error);
      Alert.alert('Match Data Error', 'Unable to fetch predictions or odds.');
      setPredictions(null);
      setOdds(null);
    } finally {
      setLoading(false);
    }
  };

  const goToUserLocation = () => {
    if (userLocation && mapRef.current) {
      mapRef.current.animateToRegion(
        {
          ...userLocation,
          latitudeDelta: 0.5,
          longitudeDelta: 0.5,
        },
        1000
      );
    }
  };

  return (
    <View style={styles.container}>
      <MapView
        ref={mapRef}
        style={styles.map}
        region={region}
        onRegionChangeComplete={setRegion}
        showsUserLocation={true}
        showsMyLocationButton={false}
        mapType="standard"
        showsCompass={true}
        showsScale={true}
        rotateEnabled={true}
        scrollEnabled={true}
        zoomEnabled={true}
        pitchEnabled={true}
      >
        {fixtures.map((fixture) => (
          <Marker
            key={fixture.id}
            coordinate={{
              latitude: fixture.venue.latitude,
              longitude: fixture.venue.longitude,
            }}
            onPress={() => onMatchMarkerPress(fixture)}
          />
        ))}
      </MapView>

      {userLocation && (
        <TouchableOpacity style={styles.locationButton} onPress={goToUserLocation}>
          <Text style={styles.locationButtonText}>📍</Text>
        </TouchableOpacity>
      )}

      {loading && (
        <View style={styles.loadingOverlay}>
          <View style={styles.loadingCard}>
            <ActivityIndicator size="large" color="#0066CC" />
            <Text style={styles.loadingText}>Loading match data...</Text>
          </View>
        </View>
      )}

      {selectedMatch && predictions && odds && !loading && (
        <MatchInfoCard
          match={selectedMatch}
          predictions={predictions}
          odds={odds}
          onClose={() => setSelectedMatch(null)}
        />
      )}

      <TouchableOpacity
        style={styles.settingsButton}
        onPress={() => setSettingsVisible(true)}
      >
        <Ionicons name="settings-outline" size={24} color="#0066CC" />
      </TouchableOpacity>

      <SettingsModal
        visible={settingsVisible}
        onClose={() => setSettingsVisible(false)}
        onTemperatureUnitChange={setUnit}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  map: {
    width: width,
    height: height,
  },
  locationButton: {
    position: 'absolute',
    top: 50,
    right: 20,
    backgroundColor: 'white',
    borderRadius: 25,
    width: 50,
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  locationButtonText: {
    fontSize: 20,
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 15,
    padding: 30,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  loadingText: {
    marginTop: 15,
    fontSize: 16,
    color: '#333',
  },
  settingsButton: {
    position: 'absolute',
    bottom: 30,
    left: 20,
    backgroundColor: 'white',
    borderRadius: 25,
    width: 50,
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
});

