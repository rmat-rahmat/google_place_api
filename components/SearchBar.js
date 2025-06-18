import React, { useState } from 'react';
import {
    View,
    TextInput,
    FlatList,
    TouchableOpacity,
    Text,
    ActivityIndicator,
    Keyboard,
    Platform,
    StyleSheet
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import useGooglePlaces from '../hooks/useGooglePlaces';

/**
 * SearchBar component for searching places with Google Places autocomplete.
 *
 * Props:
 * - query: Current search text
 * - setQuery: Function to update search text
 * - loading: Boolean for loading state
 * - insets: Safe area insets for positioning
 * - onSubmit: Function to call when search is submitted
 * - onSelect: Function to call when a suggestion is selected
 */
export default function SearchBar({
    query,
    setQuery,
    loading,
    insets,
    onSubmit,
    onSelect,
}) {
    const [suggestions, setSuggestions] = useState([]);
    const { fetchSuggestions } = useGooglePlaces();

    /**
     * Handle text input change: update query and fetch suggestions.
     */
    const handleSearchChange = async (text) => {
        setQuery(text);
        if (!text) {
            setSuggestions([]);
        } else {
            const results = await fetchSuggestions(text);
            setSuggestions(results);
        }
    };

    /**
     * Handle search submit: call onSubmit and clear suggestions.
     */
    const onSearchSubmit = () => {
        onSubmit();
        setSuggestions([]);
    };

    /**
     * Render each autocomplete suggestion.
     */
    const renderSuggestion = ({ item }) => (
        <TouchableOpacity onPress={() => {
            onSelect(item);
            setSuggestions([]);
        }}>
            <Text style={styles.suggestion}>{item.description}</Text>
        </TouchableOpacity>
    );

    return (
        <>
            {/* Search bar input and controls */}
            <View style={[
                styles.searchBar,
                { top: Platform.OS === 'ios' ? insets.top + 20 : insets.top + 10 }
            ]}>
                <TextInput
                    placeholder="Search places..."
                    value={query}
                    onChangeText={handleSearchChange}
                    onSubmitEditing={onSearchSubmit}
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
                <TouchableOpacity onPress={onSearchSubmit} style={styles.searchButton}>
                    <Ionicons name="search" size={20} color="#000" />
                </TouchableOpacity>
                {/* Loading spinner */}
                {loading && <ActivityIndicator size="small" color="#000" style={{ marginLeft: 10 }} />}
            </View>

            {/* Suggestion list dropdown */}
            {suggestions.length > 0 && (
                <FlatList
                    data={suggestions}
                    keyExtractor={(item) => item.place_id}
                    renderItem={renderSuggestion}
                    style={[
                        styles.suggestionList,
                        { top: Platform.OS === 'ios' ? insets.top + 70 : insets.top + 50 }
                    ]}
                />
            )}
        </>
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
});