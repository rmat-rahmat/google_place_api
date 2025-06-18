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
import { useNavigation, useRoute, CommonActions } from '@react-navigation/native';

const GOOGLE_API_KEY = 'AIzaSyCKzlA1LQpQre6lS3_EgyRpLr6vg56nUj4';

export default function SearchListScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const query = route.params?.query || '';
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (query) searchPlacesGlobally();
  }, [query]);

  const searchPlacesGlobally = async () => {
    setLoading(true);
    const wildcardQuery = `${query}*`;
    const url = `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${encodeURIComponent(
      wildcardQuery
    )}&key=${GOOGLE_API_KEY}`;

    try {
      const res = await fetch(url);
      const json = await res.json();
      if (json.status === 'OK') {
        setResults(json.results);
      } else {
        setResults([]);
      }
    } catch (error) {
      console.error('Search error:', error);
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSelect = (item) => {
    const coords = {
      latitude: item.geometry.location.lat,
      longitude: item.geometry.location.lng,
      latitudeDelta: 0.01,
      longitudeDelta: 0.01,
    };

    const selectedPlaceFromSearch = {
      name: item.name,
      address: item.formatted_address,
      coords,
      place_id: item.place_id,
    };

    navigation.dispatch(
      CommonActions.reset({
        index: 0,
        routes: [
          {
            name: 'Home',
            params: { selectedPlaceFromSearch },
          },
        ],
      })
    );
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  if (!results.length) {
    return (
      <View style={styles.centered}>
        <Text>No results found for "{query}"</Text>
      </View>
    );
  }

  return (
    <FlatList
      data={results}
      keyExtractor={(item) => item.place_id}
      renderItem={({ item }) => (
        <TouchableOpacity style={styles.item} onPress={() => handleSelect(item)}>
          {item.photos && item.photos.length > 0 ? (
            <Image
              source={{
                uri: `https://maps.googleapis.com/maps/api/place/photo?maxwidth=400&photoreference=${item.photos[0].photo_reference}&key=${GOOGLE_API_KEY}`,
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
