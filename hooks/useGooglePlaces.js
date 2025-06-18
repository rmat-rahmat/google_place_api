import { useState } from 'react';

const GOOGLE_API_KEY = process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY;

/**
 * Custom hook for interacting with Google Places API.
 * Provides autocomplete suggestions, place details, global search, and photo URLs.
 */
export default function useGooglePlaces() {
    const [loading, setLoading] = useState(false);

    /**
     * Fetch autocomplete suggestions for a given text input.
     * @param {string} text - The search input.
     * @returns {Promise<Array>} - Array of suggestion objects.
     */
    const fetchSuggestions = async (text) => {
        if (!text) return [];
        setLoading(true);
        try {
            const encoded = encodeURIComponent(text);
            const url = `https://maps.googleapis.com/maps/api/place/autocomplete/json?input=${encoded}&key=${GOOGLE_API_KEY}`;
            const res = await fetch(url);
            const json = await res.json();
            return json.status === 'OK' ? json.predictions : [];
        } catch (err) {
            console.error('Autocomplete error:', err);
            return [];
        } finally {
            setLoading(false);
        }
    };

    /**
     * Fetch detailed information for a place by its placeId.
     * @param {string} placeId - The Google Place ID.
     * @returns {Promise<Object|null>} - Place details object or null.
     */
    const fetchPlaceDetails = async (placeId) => {
        setLoading(true);
        try {
            const url = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${placeId}&key=${GOOGLE_API_KEY}`;
            const res = await fetch(url);
            const json = await res.json();
            return json.status === 'OK' ? json.result : null;
        } catch (err) {
            console.error('Place details error:', err);
            return null;
        } finally {
            setLoading(false);
        }
    };

    /**
     * Search for places globally using a text query.
     * @param {string} query - The search query.
     * @returns {Promise<Array>} - Array of place result objects.
     */
    const searchPlacesGlobally = async (query) => {
        setLoading(true);
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
        } finally {
            setLoading(false);
        }
    };

    /**
     * Get the photo URL for a given photo reference.
     * @param {string} photoReference - The photo reference string.
     * @param {number} maxwidth - Maximum width of the photo.
     * @returns {string|null} - The photo URL or null if not available.
     */
    const getPhotoUrl = (photoReference, maxwidth = 400) => {
        if (!photoReference) return null;
        return `https://maps.googleapis.com/maps/api/place/photo?maxwidth=${maxwidth}&photoreference=${photoReference}&key=${GOOGLE_API_KEY}`;
    };

    return {
        fetchSuggestions,
        fetchPlaceDetails,
        searchPlacesGlobally,
        getPhotoUrl,
        loading,
    };
}