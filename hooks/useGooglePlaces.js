import { useCallback } from 'react';

const GOOGLE_API_KEY = process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY;

/**
 * Custom hook for interacting with Google Places API.
 * Provides autocomplete suggestions, place details, global search, and photo URLs.
 */
export default function useGooglePlaces() {
    /**
     * Check if the Google API key is set and valid.
     * Returns a warning message if not set or invalid, otherwise an empty string.
     * @returns {Promise<string>} - Warning message or empty string.
     */
    const checkApiKey = useCallback(async () => {
        if (!GOOGLE_API_KEY) {
            return "Google Maps API key is not set. Please check your environment variables.";
        }
        // Try a simple fetch to validate the key
        try {
            const url = `https://maps.googleapis.com/maps/api/place/autocomplete/json?input=test&key=${GOOGLE_API_KEY}`;
            const res = await fetch(url);
            const json = await res.json();
            if (json.status === 'REQUEST_DENIED') {
                return json.error_message || "Google Maps API key is invalid or restricted.";
            }
            return "";
        } catch (err) {
            return "Failed to validate Google Maps API key.";
        }
    }, []);

    /**
     * Fetch autocomplete suggestions for a given text input.
     * @param {string} text - The search input.
     * @returns {Promise<Array>} - Array of suggestion objects.
     */
    const fetchSuggestions = useCallback(async (text) => {
        if (!text) return [];
        try {
            const encoded = encodeURIComponent(text);
            const url = `https://maps.googleapis.com/maps/api/place/autocomplete/json?input=${encoded}&key=${GOOGLE_API_KEY}`;
            const res = await fetch(url);
            const json = await res.json();
            return json.status === 'OK' ? json.predictions : [];
        } catch (err) {
            console.error('Autocomplete error:', err);
            return [];
        }
    }, []);

    /**
     * Fetch detailed information for a place by its placeId.
     * @param {string} placeId - The Google Place ID.
     * @returns {Promise<Object|null>} - Place details object or null.
     */
    const fetchPlaceDetails = useCallback(async (placeId) => {
        try {
            const url = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${placeId}&key=${GOOGLE_API_KEY}`;
            const res = await fetch(url);
            const json = await res.json();
            return json.status === 'OK' ? json.result : null;
        } catch (err) {
            console.error('Place details error:', err);
            return null;
        }
    }, []);

    /**
     * Search for places globally using a text query.
     * @param {string} query - The search query.
     * @returns {Promise<Array>} - Array of place result objects.
     */
    const searchPlacesGlobally = useCallback(async (query) => {
        const wildcardQuery = `*${query}*`;
        const url = `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${encodeURIComponent(
            wildcardQuery
        )}&key=${GOOGLE_API_KEY}`;

        try {
            const res = await fetch(url);
            const json = await res.json();
            return json.status === 'OK' ? json.results : [];
        } catch (error) {
            console.error('Search error:', error);
            return [];
        }
    }, []);

    /**
     * Get the photo URL for a given photo reference.
     * @param {string} photoReference - The photo reference string.
     * @param {number} maxwidth - Maximum width of the photo.
     * @returns {string|null} - The photo URL or null if not available.
     */
    const getPhotoUrl = useCallback((photoReference, maxwidth = 400) => {
        if (!photoReference) return null;
        return `https://maps.googleapis.com/maps/api/place/photo?maxwidth=${maxwidth}&photoreference=${photoReference}&key=${GOOGLE_API_KEY}`;
    }, []);

    return {
        fetchSuggestions,
        fetchPlaceDetails,
        searchPlacesGlobally,
        getPhotoUrl,
        checkApiKey,
    };
}