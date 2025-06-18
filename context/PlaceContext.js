import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import useGooglePlaces from '../hooks/useGooglePlaces';

const PlaceContext = createContext();

/**
 * PlaceProvider manages selected place and search history state.
 * Provides functions for selecting places, managing history, and syncing with storage.
 */
export function PlaceProvider({ children }) {
    const [selectedPlace, setSelectedPlace] = useState(null);
    const [history, setHistory] = useState([]);

    const { fetchPlaceDetails } = useGooglePlaces();

    /**
     * Save search history to local storage.
     * @param {Array} newHistory - Updated history array.
     */
    const saveHistory = async (newHistory) => {
        try {
            await AsyncStorage.setItem('searchHistory', JSON.stringify(newHistory));
        } catch (err) {
            console.warn('Error saving history:', err);
        }
    };

    /**
     * Load search history from local storage.
     */
    const loadHistory = async () => {
        try {
            const stored = await AsyncStorage.getItem('searchHistory');
            if (stored) {
                setHistory(JSON.parse(stored));
            }
        } catch (err) {
            console.warn('Error loading history:', err);
        }
    };

    // Load history once on initialization
    useEffect(() => {
        loadHistory();
    }, []);

    /**
     * Fetch place details, set as selected, and update history.
     * @param {Object} param0 - { placeId, description }
     */
    const handleSelectPlace = async ({
        placeId,
        description,
    }) => {
        try {
            const details = await fetchPlaceDetails(placeId);
            if (!details) throw new Error('No place details found');

            const { geometry, name, formatted_address, photos } = details;
            if (!geometry?.location) throw new Error('No geometry location found');

            const { lat, lng } = geometry.location;
            const coords = {
                latitude: lat,
                longitude: lng,
                latitudeDelta: 0.01,
                longitudeDelta: 0.01,
            };

            const newPlace = {
                name,
                address: formatted_address,
                coords,
                place_id: placeId,
                photo_reference: photos?.[0]?.photo_reference || null,
            };

            setSelectedPlace(newPlace);

            setHistory(prev => {
                const updated = [newPlace, ...prev.filter(h => h.place_id !== placeId)].slice(0, 10);
                saveHistory(updated);
                return updated;
            });
        } catch (err) {
            console.error('Place details error:', err);
        }
    };

    /**
     * Add a single place to history.
     * @param {Object} place - Place object to add.
     */
    const addHistory = async (place) => {
        setHistory(prev => {
            const updated = [place, ...prev.filter(h => h.place_id !== place.place_id)].slice(0, 10);
            saveHistory(updated);
            return updated;
        });
    };

    /**
     * Delete selected places from history.
     * @param {Array} selectedItems - Array of place_id to delete.
     */
    const deleteHistory = async (selectedItems) => {
        const updated = history.filter((item) => !selectedItems.includes(item.place_id));
        setHistory(updated);
        saveHistory(updated);
    };

    /**
     * Clear all search history.
     */
    const clearHistory = async () => {
        setHistory([]);
        try {
            await AsyncStorage.removeItem('searchHistory');
        } catch (err) {
            console.warn('Error clearing history:', err);
        }
    };

    return (
        <PlaceContext.Provider value={{
            selectedPlace,
            setSelectedPlace,
            history,
            handleSelectPlace,
            addHistory,
            deleteHistory,
            clearHistory,
            loadHistory,
        }}>
            {children}
        </PlaceContext.Provider>
    );
}

/**
 * Custom hook to access PlaceContext.
 */
export function usePlace() {
    return useContext(PlaceContext);
}