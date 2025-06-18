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
    ScrollView,
} from 'react-native';
import MapView, { Marker } from 'react-native-maps';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Location from 'expo-location';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, useRoute, useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';

// Constants
const GOOGLE_API_KEY = 'AIzaSyCKzlA1LQpQre6lS3_EgyRpLr6vg56nUj4';
const { width, height } = Dimensions.get('window');

export default function MapViewScreen() {
    // State variables
    const [query, setQuery] = useState('');
    const [suggestions, setSuggestions] = useState([]);
    const [selectedPlace, setSelectedPlace] = useState(null);
    const [region, setRegion] = useState(null);
    const [history, setHistory] = useState([]);
    const [loading, setLoading] = useState(false);
    const [mapLoading, setMapLoading] = useState(true);

    // Refs and hooks
    const mapRef = useRef(null);
    const markerRef = useRef(null);
    const insets = useSafeAreaInsets();
    const navigation = useNavigation();
    const route = useRoute();

    // On component mount: get current location and handle incoming place from SearchList
    useEffect(() => {
        if (region === null && selectedPlace==null) getCurrentLocation();
         loadHistory().then(() => {
            const selectedPlaceFromSearch = route.params?.selectedPlaceFromSearch;
            if (selectedPlaceFromSearch) {
                selectPlace(selectedPlaceFromSearch.place_id, selectedPlaceFromSearch.name);
            }
        });
    }, [navigation]);

    // On screen focus: reload recent history
    useFocusEffect(
        React.useCallback(() => {
            loadHistory();
        }, [])
    );

    // Get user's current location
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

    // Load search history from local storage
    const loadHistory = async () => {
        try {
            const saved = await AsyncStorage.getItem('searchHistory');
            if (saved) setHistory(JSON.parse(saved));
        } catch (err) {
            console.warn('Error loading history:', err);
        }
    };

    // Save search history to local storage
    const saveHistory = async (newHistory) => {
        try {
            await AsyncStorage.setItem('searchHistory', JSON.stringify(newHistory));
        } catch (err) {
            console.warn('Error saving history:', err);
        }
    };

    // Fetch autocomplete suggestions from Google API
    const fetchSuggestions = async (text) => {
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

    // Triggered when user types in search bar
    const handleSearchChange = (text) => {
        setQuery(text);
        if (!text) {
            setSuggestions([]);
        } else {
            fetchSuggestions(text);
        }
    };

    // Search by place ID and update UI with map and marker
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
                    photo_reference: json.result.photos ? json.result.photos[0].photo_reference : null,
                };

                setSelectedPlace(newPlace);
                setRegion(coords);
                mapRef.current?.animateToRegion(coords, 1000);
                setTimeout(() => markerRef.current?.showCallout(), 1000);

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

    // Called when user presses Enter/Search key
    const handleSearchSubmit = () => {
      
        if (query) {
            navigation.navigate('SearchList', { query });
        }
    };

    // Render each autocomplete suggestion
    const renderSuggestion = ({ item }) => (
        <TouchableOpacity onPress={() => selectPlace(item.place_id, item.description)}>
            <Text style={styles.suggestion}>{item.description}</Text>
        </TouchableOpacity>
    );

    // Render a single history item
    const renderHistoryItem = ({ item }) => (
        <TouchableOpacity
            key={item.place_id}
            style={styles.historyGridItem}
            onPress={() => {
                setSelectedPlace(item);
                setRegion(item.coords);
                mapRef.current?.animateToRegion(item.coords, 1000);
                setTimeout(() => markerRef.current?.showCallout(), 1000);
            }}
        >
            {item.photo_reference ? (
                <Image
                    source={{
                        uri: `https://maps.googleapis.com/maps/api/place/photo?maxwidth=200&photoreference=${item.photo_reference}&key=${GOOGLE_API_KEY}`,
                    }}
                    style={styles.historyImage}
                />
            ) : (
                <View style={[styles.historyImage, styles.imagePlaceholder]}>
                    <Ionicons name="image" size={24} color="#999" />
                </View>
            )}
            <Text style={styles.historyName} numberOfLines={1}>{item.name}</Text>
        </TouchableOpacity>
    );

    return (
        <View style={{ flex: 1 }}>
            {/* Show overlay while loading map */}
            {mapLoading && (
                <View style={styles.mapLoadingOverlay}>
                    <ActivityIndicator size="large" color="#000" />
                </View>
            )}

            {/* Render map with selected marker */}
            {region && (
                <MapView
                    ref={mapRef}
                    style={StyleSheet.absoluteFill}
                    region={region}
                    showsUserLocation
                    onMapReady={() => setMapLoading(false)}
                >
                    {selectedPlace && (
                        <Marker
                            ref={markerRef}
                            coordinate={selectedPlace.coords}
                            title={selectedPlace.name}
                            description={selectedPlace.address}
                        />
                    )}
                </MapView>
            )}

            {/* Search bar */}
            <View style={[styles.searchBar, { top: Platform.OS === 'ios' ? insets.top + 20 : insets.top + 10 }]}>
                <TextInput
                    placeholder="Search places..."
                    value={query}
                    onChangeText={handleSearchChange}
                    onSubmitEditing={handleSearchSubmit}
                    style={styles.input}
                    returnKeyType="search"
                />
                {/* Clear button */}
                {query.length > 0 && (
                    <TouchableOpacity onPress={() => {
                        setQuery('');
                        setSuggestions([]);
                        Keyboard.dismiss();
                    }}>
                        <Ionicons name="close-circle" size={20} color="#aaa" />
                    </TouchableOpacity>
                )}
                {/* Search button */}
                <TouchableOpacity onPress={handleSearchSubmit} style={styles.searchButton}>
                    <Ionicons name="search" size={20} color="#000" />
                </TouchableOpacity>
                {/* Loading spinner */}
                {loading && <ActivityIndicator size="small" color="#000" style={{ marginLeft: 10 }} />}
            </View>

            {/* Suggestion list */}
            {suggestions.length > 0 && (
                <FlatList
                    data={suggestions}
                    keyExtractor={(item) => item.place_id}
                    renderItem={renderSuggestion}
                    style={[styles.suggestionList, { top: Platform.OS === 'ios' ? insets.top + 70 : insets.top + 50 }]}
                />
            )}

            {/* Recent history section */}
            {history.length > 0 && (
                <View style={[styles.historyPanel, { paddingBottom: insets.bottom || 10 }]}>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Text style={styles.historyTitle}>Recent Searches</Text>
                        <TouchableOpacity onPress={() => navigation.navigate('SearchHistory')}>
                            <Text style={{ color: '#007AFF' }}>View All</Text>
                        </TouchableOpacity>
                    </View>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: 10 }}>
                        {history.slice(0, 5).map((item) => renderHistoryItem({ item }))}
                    </ScrollView>
                </View>
            )}
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
    searchButton: {
        marginLeft: 10,
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
        maxHeight: height * 0.3,
    },
    historyTitle: {
        fontWeight: 'bold',
        fontSize: 16,
    },
    historyGridItem: {
        width: 120,
        marginBottom: 10,
        alignItems: 'center',
    },
    historyImage: {
        width: 100,
        height: 100,
        borderRadius: 6,
    },
    imagePlaceholder: {
        backgroundColor: '#ddd',
        justifyContent: 'center',
        alignItems: 'center',
    },
    historyName: {
        fontSize: 14,
        marginTop: 5,
        textAlign: 'center',
    },
    mapLoadingOverlay: {
        ...StyleSheet.absoluteFillObject,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'white',
        zIndex: 1,
    },
});
