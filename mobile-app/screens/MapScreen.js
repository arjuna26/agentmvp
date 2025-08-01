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
import MapView, { Marker, Circle } from 'react-native-maps';
import * as Location from 'expo-location';
import { getForecasts } from '../utils/weatherApi';

const { width, height } = Dimensions.get('window');

export default function MapScreen() {
  const [region, setRegion] = useState({
    latitude: 39.8283, // Center of US
    longitude: -98.5795,
    latitudeDelta: 20,
    longitudeDelta: 20,
  });
  const [weatherData, setWeatherData] = useState(null);
  const [selectedCoordinate, setSelectedCoordinate] = useState(null);
  const [loading, setLoading] = useState(false);
  const [userLocation, setUserLocation] = useState(null);
  const mapRef = useRef(null);

  useEffect(() => {
    getCurrentLocation();
  }, []);

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

  const handleMapPress = async (event) => {
    const coordinate = event.nativeEvent.coordinate;
    setSelectedCoordinate(coordinate);
    setLoading(true);

    try {
      const data = await getForecasts(coordinate.latitude, coordinate.longitude);
      setWeatherData(data);
    } catch (error) {
      console.error('Error fetching weather data:', error);
      Alert.alert(
        'Weather Data Error',
        'Unable to fetch weather data for this location. This may be outside the US coverage area.'
      );
      setWeatherData(null);
    } finally {
      setLoading(false);
    }
  };

  const goToUserLocation = () => {
    if (userLocation && mapRef.current) {
      mapRef.current.animateToRegion({
        ...userLocation,
        latitudeDelta: 0.5,
        longitudeDelta: 0.5,
      }, 1000);
    }
  };

  const renderWeatherInfo = () => {
    if (!weatherData || !weatherData.daily || !weatherData.daily.periods) return null;

    // TODO: Replace with ForecastCard component (smaller version), show the conditions at the coordinates that have been selected on the map
    // for now, we will just display the first period's data
    const currentPeriod = weatherData.daily.periods[0];
    return (
      <View style={styles.weatherInfo}>
        <Text style={styles.weatherTitle}>Weather at Selected Location</Text>
        <Text style={styles.weatherTemp}>{currentPeriod.temperature}°{currentPeriod.temperatureUnit}</Text>
        <Text style={styles.weatherDesc}>{currentPeriod.shortForecast}</Text>
        <Text style={styles.weatherWind}>Wind: {currentPeriod.windSpeed} {currentPeriod.windDirection}</Text>
        <Text style={styles.coordinates}>
          {selectedCoordinate?.latitude.toFixed(4)}, {selectedCoordinate?.longitude.toFixed(4)}
        </Text>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <MapView
        ref={mapRef}
        style={styles.map}
        region={region}
        onRegionChangeComplete={setRegion}
        onPress={handleMapPress}
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
        {selectedCoordinate && (
          <Marker
            coordinate={selectedCoordinate}
            title="Selected Location"
            description="Tap to see weather data"
            pinColor="#0066CC"
          />
        )}
        
        {selectedCoordinate && (
          <Circle
            center={selectedCoordinate}
            radius={5000} // 5km radius
            strokeColor="rgba(0, 102, 204, 0.5)"
            fillColor="rgba(0, 102, 204, 0.1)"
            strokeWidth={2}
          />
        )}
      </MapView>

      {/* User Location Button */}
      {userLocation && (
        <TouchableOpacity style={styles.locationButton} onPress={goToUserLocation}>
          <Text style={styles.locationButtonText}>📍</Text>
        </TouchableOpacity>
      )}

      {/* Loading Indicator */}
      {loading && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color="#0066CC" />
          <Text style={styles.loadingText}>Loading weather data...</Text>
        </View>
      )}

      {/* Weather Information */}
      {renderWeatherInfo()}
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
  weatherInfo: {
    position: 'absolute',
    bottom: 20,
    left: 20,
    right: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 15,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  weatherTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  weatherTemp: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#0066CC',
    marginBottom: 4,
  },
  weatherDesc: {
    fontSize: 16,
    color: '#666',
    marginBottom: 4,
  },
  weatherWind: {
    fontSize: 14,
    color: '#888',
    marginBottom: 4,
  },
  coordinates: {
    fontSize: 12,
    color: '#999',
    fontFamily: 'monospace',
  },
  loadingOverlay: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: [{ translateX: -50 }, { translateY: -50 }],
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 10,
    padding: 20,
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
    marginTop: 10,
    fontSize: 16,
    color: '#333',
  },
});
