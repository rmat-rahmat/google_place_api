import React, { useEffect, useState, useRef } from 'react';
import {
    View,
    ActivityIndicator,
    StyleSheet,
    Dimensions,
} from 'react-native';
import MapView, { Marker } from 'react-native-maps';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Location from 'expo-location';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, useRoute, useFocusEffect } from '@react-navigation/native';
import RecentHistory from '../components/RecentHistory';
import SearchBar from '../components/SearchBar';
import { usePlace } from '../context/PlaceContext';

// Constants
const { width, height } = Dimensions.get('window');

/**
 * MapViewScreen displays a map, search bar, and recent search history.
 * Handles selecting places, updating the map, and managing search history.
 */
export default function MapViewScreen() {
    // State variables
    const [query, setQuery] = useState('');
    const [region, setRegion] = useState(null);
    const [loading, setLoading] = useState(false);
    const [mapLoading, setMapLoading] = useState(true);

    // Context and navigation
    const {
        selectedPlace,
        setSelectedPlace,
        history,
        setHistory,
        handleSelectPlace,
    } = usePlace();
    const mapRef = useRef(null);
    const markerRef = useRef(null);
    const insets = useSafeAreaInsets();
    const navigation = useNavigation();

    // On mount: get current location if no region or selected place
    useEffect(() => {
        if (region === null && selectedPlace == null) getCurrentLocation();
    }, [navigation]);

    /**
     * When selectedPlace changes, update map, marker, query, and region.
     */
    useFocusEffect(
        React.useCallback(() => {
            if (selectedPlace) {
                setQuery(selectedPlace.name);
                setRegion(selectedPlace.coords);
                setLoading(false);
                mapRef.current?.animateToRegion(selectedPlace.coords, 1000);
                setTimeout(() => markerRef.current?.showCallout(), 1000);
            }
        }, [selectedPlace])
    );

    /**
     * Get user's current location and set as map region.
     */
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

    /**
     * Select a place by placeId and description, triggers context logic.
     */
    const selectPlace = async (placeId, description) => {
        setLoading(true);
        await handleSelectPlace({
            placeId,
            description,
        });
    };

    /**
     * Handle search bar submit: navigate to SearchList screen.
     */
    const handleSearchSubmit = () => {
        if (query) {
            navigation.navigate('SearchList', { query });
        }
    };

    /**
     * Handle pressing a recent history item: update selected place and map.
     */
    const onHistoryItemPress = (item) => {
        setSelectedPlace(item);
        setQuery(item.name);
        setRegion(item.coords);
        mapRef.current?.animateToRegion(item.coords, 1000);
        setTimeout(() => markerRef.current?.showCallout(), 1000);
    };

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
            <SearchBar
                query={query}
                setQuery={setQuery}
                loading={loading}
                insets={insets}
                styles={styles}
                onSubmit={handleSearchSubmit}
                onSelect={(item) => selectPlace(item.place_id, item.description)}
            />

            {/* Recent history section */}
            <RecentHistory
                limit={10}
                history={history}
                navigation={navigation}
                onItemPress={onHistoryItemPress}
                style={[styles.historyPanel, { paddingBottom: insets.bottom || 10 }]}
            />
        </View>
    );
}

const styles = StyleSheet.create({
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
    mapLoadingOverlay: {
        ...StyleSheet.absoluteFillObject,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'white',
        zIndex: 1,
    },
});
