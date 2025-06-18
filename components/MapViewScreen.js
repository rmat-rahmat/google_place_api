import React, { useEffect, useState, useRef } from 'react';
import {
  View,
  TextInput,
  FlatList,
  Text,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  Platform,
  Image,
  Keyboard,
  ActivityIndicator,
} from 'react-native';
import MapView, { Marker, Callout } from 'react-native-maps';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Location from 'expo-location';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';

const GOOGLE_API_KEY = 'AIzaSyCKzlA1LQpQre6lS3_EgyRpLr6vg56nUj4';
const { width, height } = Dimensions.get('window');

export default function MapViewScreen() {
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [selectedPlace, setSelectedPlace] = useState(null);
  const [region, setRegion] = useState(null);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [mapLoading, setMapLoading] = useState(true);
  const mapRef = useRef(null);
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const route = useRoute();

  useEffect(() => {
    getCurrentLocation();
    loadHistory().then(() => {
      const selectedPlaceFromSearch = route.params?.selectedPlaceFromSearch;
      if (selectedPlaceFromSearch) {
        console.log('Selected place from search:', selectedPlaceFromSearch);
        selectPlace(selectedPlaceFromSearch.place_id, selectedPlaceFromSearch.description);
      }
    });
  }, []);

  const getCurrentLocation = async () => {
    let { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') {
      console.warn('Permission to access location was denied');
      return;
    }

    const location = await Location.getCurrentPositionAsync({});
    const coords = {
      latitude: location.coords.latitude,
      longitude: location.coords.longitude,
      latitudeDelta: 0.05,
      longitudeDelta: 0.05,
    };
    setRegion(coords);
  };

  const loadHistory = async () => {
    try {
      const saved = await AsyncStorage.getItem('searchHistory');
      if (saved) setHistory(JSON.parse(saved));
    } catch (err) {
      console.warn('Error loading history:', err);
    }
  };

  const saveHistory = async (newHistory) => {
    try {
      await AsyncStorage.setItem('searchHistory', JSON.stringify(newHistory));
    } catch (err) {
      console.warn('Error saving history:', err);
    }
  };

  const handleSearch = async (text) => {
    setQuery(text);
    if (!text) return setSuggestions([]);

    const encoded = encodeURIComponent(text);
    const url = `https://maps.googleapis.com/maps/api/place/autocomplete/json?input=${encoded}&key=${GOOGLE_API_KEY}`;
    try {
      const res = await fetch(url);
      const json = await res.json();
      if (json.status === 'OK') {
        setSuggestions(json.predictions);
      } else {
        setSuggestions([]);
      }
    } catch (err) {
      console.error('Autocomplete error:', err);
    }
  };

  const selectPlace = async (placeId, description) => {
    Keyboard.dismiss();
    setLoading(true);
    setSuggestions([]);
    setQuery(description);

    const url = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${placeId}&key=${GOOGLE_API_KEY}`;
    try {
      const res = await fetch(url);
      const json = await res.json();
      if (json.status === 'OK') {
        const location = json.result.geometry.location;
        const coords = {
          latitude: location.lat,
          longitude: location.lng,
          latitudeDelta: 0.01,
          longitudeDelta: 0.01,
        };

        const newPlace = {
          name: json.result.name,
          address: json.result.formatted_address,
          coords,
          place_id: placeId,
        };

        setSelectedPlace(newPlace);
        setRegion(coords);
        mapRef.current?.animateToRegion(coords, 1000);

        setHistory(prev => {
          const updated = [newPlace, ...prev.filter(h => h.place_id !== placeId)].slice(0, 10);
          saveHistory(updated);
          return updated;
        });
      }
    } catch (err) {
      console.error('Place details error:', err);
    } finally {
      setLoading(false);
    }
  };

  const renderSuggestion = ({ item }) => (
    <TouchableOpacity onPress={() => selectPlace(item.place_id, item.description)}>
      <Text style={styles.suggestion}>{item.description}</Text>
    </TouchableOpacity>
  );

  const renderHistory = ({ item }) => (
    <TouchableOpacity onPress={() => {
      setSelectedPlace(item);
      setRegion(item.coords);
      mapRef.current?.animateToRegion(item.coords, 1000);
    }}>
      <Text style={styles.historyItem}>{item.name}</Text>
    </TouchableOpacity>
  );

  const navigateToSearch = () => {
    if (query) {
      navigation.navigate('SearchList', { query });
    }
  };

  return (
    <View style={{ flex: 1 }}>
      {mapLoading && (
        <View style={styles.mapLoadingOverlay}>
          <ActivityIndicator size="large" color="#000" />
        </View>
      )}

      {region && (
        <MapView
          ref={mapRef}
          style={StyleSheet.absoluteFill}
          region={region}
          showsUserLocation={true}
          onMapReady={() => setMapLoading(false)}
        >
          {selectedPlace && (
            <Marker
              coordinate={selectedPlace.coords}
              title={selectedPlace.name}
              description={selectedPlace.address}
            />
          )}
        </MapView>
      )}

      <View style={[styles.searchBar, { top: Platform.OS === 'ios' ? insets.top + 20 : insets.top + 10 }]}>
        <TextInput
          placeholder="Search places..."
          value={query}
          onChangeText={handleSearch}
          style={styles.input}
        />
        <TouchableOpacity onPress={navigateToSearch} style={styles.searchButton}>
          <Ionicons name="search" size={20} color="#000" />
        </TouchableOpacity>
        {loading && <ActivityIndicator size="small" color="#000" style={{ marginLeft: 10 }} />}
      </View>

      {suggestions.length > 0 && (
        <FlatList
          data={suggestions}
          keyExtractor={(item) => item.place_id}
          renderItem={renderSuggestion}
          style={[styles.suggestionList, { top: Platform.OS === 'ios' ? insets.top + 70 : insets.top + 50 }]}
        />
      )}

      <View style={[styles.historyPanel, { paddingBottom: insets.bottom || 10 }]}>
        <Text style={styles.historyTitle}>Search History</Text>
        <FlatList
          data={history}
          keyExtractor={(item) => item.place_id}
          renderItem={renderHistory}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  searchBar: {
    position: 'absolute',
    left: 10,
    right: 10,
    backgroundColor: '#fff',
    padding: 10,
    borderRadius: 8,
    elevation: 4,
    flexDirection: 'row',
    alignItems: 'center',
  },
  input: {
    flex: 1,
    fontSize: 16,
  },
  suggestionList: {
    position: 'absolute',
    left: 10,
    right: 10,
    backgroundColor: '#fff',
    maxHeight: 200,
    borderRadius: 8,
    elevation: 3,
  },
  suggestion: {
    padding: 12,
    borderBottomColor: '#eee',
    borderBottomWidth: 1,
  },
  historyPanel: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#fff',
    padding: 10,
    borderTopColor: '#ccc',
    borderTopWidth: 1,
    maxHeight: height * 0.25,
  },
  historyTitle: {
    fontWeight: 'bold',
    marginBottom: 8,
  },
  historyItem: {
    paddingVertical: 6,
    borderBottomColor: '#eee',
    borderBottomWidth: 1,
  },
  mapLoadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'white',
    zIndex: 1,
  },
});
