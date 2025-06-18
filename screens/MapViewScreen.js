import React, { useEffect, useState, useRef } from 'react';
import {
    View,
    ActivityIndicator,
    StyleSheet,
    Dimensions,
    Alert,
    Text,
} from 'react-native';
import MapView, { Marker } from 'react-native-maps';
import * as Location from 'expo-location';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import RecentHistory from '../components/RecentHistory';
import SearchBar from '../components/SearchBar';
import { usePlace } from '../context/PlaceContext';
import useGooglePlaces from '../hooks/useGooglePlaces';

// Constants
const { height } = Dimensions.get('window');

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
    const [warning, setWarning] = useState('');

    // Context and navigation
    const {
        selectedPlace,
        setSelectedPlace,
        history,
        handleSelectPlace,
    } = usePlace();
    const mapRef = useRef(null);
    const markerRef = useRef(null);
    const insets = useSafeAreaInsets();
    const navigation = useNavigation();

    // Google Places hook
    const { checkApiKey } = useGooglePlaces();

    // On app init, check API key validity and show warning if needed
    useEffect(() => {
        (async () => {
            const warningMsg = await checkApiKey();
            if (warningMsg) {
                setWarning(warningMsg);
                Alert.alert(
                    "Google Maps API Key Error",
                    warningMsg,
                    [{ text: "OK" }],
                    { cancelable: false }
                );
            } else {
                setWarning('');
            }
        })();
    }, []);

    // On mount: get current location if no region or selected place and no warning
    useEffect(() => {
        if (!warning && region === null && selectedPlace == null) getCurrentLocation();
    }, [navigation, warning]);

    /**
     * When selectedPlace changes, update map, marker, query, and region.
     */
    useFocusEffect(
        React.useCallback(() => {
            if (!warning && selectedPlace) {
                setQuery(selectedPlace.name);
                setRegion(selectedPlace.coords);
                setLoading(false);
                mapRef.current?.animateToRegion(selectedPlace.coords, 1000);
                setTimeout(() => markerRef.current?.showCallout(), 1000);
            }
        }, [selectedPlace, warning])
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
                    scrollEnabled={!warning} // <-- Disable map scroll if warning exists
                    zoomEnabled={!warning}   // <-- Optionally disable zoom as well
                    pitchEnabled={!warning}  // <-- Optionally disable pitch
                    rotateEnabled={!warning} // <-- Optionally disable rotate
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

            {/* Show warning message and disable search/history if warning exists */}
            {warning ? (
                <View style={[styles.warningPanel, { top: insets.top + 40 }]}>
                    <Text style={styles.warningText}>{warning}</Text>
                </View>
            ) : (
                <>
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
                </>
            )}
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
    warningPanel: {
        position: 'absolute',
        left: 20,
        right: 20,
        backgroundColor: '#fff3cd',
        borderColor: '#ffeeba',
        borderWidth: 1,
        borderRadius: 8,
        padding: 16,
        alignItems: 'center',
        zIndex: 10,
        elevation: 5,
    },
    warningText: {
        color: '#856404',
        fontWeight: 'bold',
        textAlign: 'center',
    },
});
