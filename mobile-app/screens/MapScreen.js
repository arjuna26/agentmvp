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
import ForecastCard from '../components/ForecastCard';

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
    // Always show coordinates if we have them
    if (selectedCoordinate) {
      return (
        <View style={styles.weatherContainer}>
          {weatherData && (
            <ForecastCard 
              period={getCurrentConditions()} 
              unit="F" 
              viewMode={getViewMode()}
              compact={true}
            />
          )}
          <Text style={styles.coordinates}>
            {selectedCoordinate?.latitude.toFixed(4)}, {selectedCoordinate?.longitude.toFixed(4)}
          </Text>
          {!weatherData && (
            <Text style={styles.coordinates}>
              Tap map to get weather data
            </Text>
          )}
        </View>
      );
    }
    return null;
  };

  const getCurrentConditions = () => {
    if (!weatherData) return null;

    const hourlyData = weatherData.hourly?.properties?.periods;
    const dailyData = weatherData.daily?.properties?.periods;
    
    if (!dailyData && !hourlyData) return null;
    
    let currentConditions = null;
    
    if (hourlyData && hourlyData.length > 0) {
      // Try to find current hour within 30 minutes
      const now = new Date();
      currentConditions = hourlyData.find((hour) => {
        const hourTime = new Date(hour.startTime);
        const timeDiff = Math.abs(now - hourTime);
        return timeDiff <= 30 * 60 * 1000; // Within 30 minutes
      });
      
      // If no close match, use first hourly entry
      if (!currentConditions) {
        currentConditions = hourlyData[0];
      }
    } else if (dailyData && dailyData.length > 0) {
      // Fall back to daily data
      currentConditions = dailyData[0];
    }

    return currentConditions;
  };

  const getViewMode = () => {
    const hourlyData = weatherData?.hourly?.properties?.periods;
    return hourlyData && hourlyData.length > 0 ? "hourly" : "daily";
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
          <View style={styles.loadingCard}>
            <ActivityIndicator size="large" color="#0066CC" />
            <Text style={styles.loadingText}>Loading weather data...</Text>
          </View>
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
  weatherContainer: {
    position: 'absolute',
    bottom: 20,
    left: 20,
    right: 20,
  },
  coordinates: {
    fontSize: 12,
    color: '#999',
    fontFamily: 'monospace',
    textAlign: 'center',
    marginTop: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
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
});
