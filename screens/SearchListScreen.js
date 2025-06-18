import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  Image,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { usePlace } from '../context/PlaceContext';
import useGooglePlaces from '../hooks/useGooglePlaces';

/**
 * SearchListScreen displays a list of places matching the search query.
 * Allows users to select a place from the search results.
 */
export default function SearchListScreen() {
  // Navigation and route hooks
  const navigation = useNavigation();
  const route = useRoute();
  const query = route.params?.query || '';

  // State for search results
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState([]);

  // Context and Google Places hook
  const { handleSelectPlace } = usePlace();
  const {  searchPlacesGlobally, getPhotoUrl } = useGooglePlaces();

  /**
   * Fetch search results when the query changes.
   */
  useEffect(() => {
    if (query) fetchResults();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query]);

  /**
   * Fetch places globally using the Google Places API.
   */
  const fetchResults = async () => {
    setLoading(true);
    const places = await searchPlacesGlobally(query);
    setResults(places);
    setLoading(false);
  };

  /**
   * Handle selecting a place from the search results.
   * @param {Object} item - The selected place object.
   */
  const handleSelect = async (item) => {
    await handleSelectPlace({
      placeId: item.place_id,
    });
    navigation.goBack();
  };

  // Show loading indicator while fetching
  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  // Show message if no results found
  if (!results.length) {
    return (
      <View style={styles.centered}>
        <Text>No results found for "{query}"</Text>
      </View>
    );
  }

  // Render search results list
  return (
    <FlatList
      data={results}
      keyExtractor={(item) => item.place_id}
      renderItem={({ item }) => (
        <TouchableOpacity style={styles.item} onPress={() => handleSelect(item)}>
          {item.photos && item.photos.length > 0 ? (
            <Image
              source={{
                uri: getPhotoUrl(item.photos[0].photo_reference),
              }}
              style={styles.image}
            />
          ) : (
            <View style={[styles.image, styles.placeholder]}>
              <Text>No Image</Text>
            </View>
          )}
          <View style={styles.info}>
            <Text style={styles.name}>{item.name}</Text>
            <Text style={styles.address}>{item.formatted_address}</Text>
          </View>
        </TouchableOpacity>
      )}
    />
  );
}

const styles = StyleSheet.create({
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  item: {
    flexDirection: 'row',
    padding: 10,
    borderBottomColor: '#ddd',
    borderBottomWidth: 1,
  },
  image: {
    width: 80,
    height: 80,
    borderRadius: 5,
    marginRight: 10,
  },
  placeholder: {
    backgroundColor: '#eee',
    justifyContent: 'center',
    alignItems: 'center',
  },
  info: {
    flex: 1,
    justifyContent: 'center',
  },
  name: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  address: {
    fontSize: 14,
    color: '#555',
  },
});
