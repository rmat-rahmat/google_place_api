import React, { useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, Alert, StyleSheet, Image } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { usePlace } from '../context/PlaceContext';
import useGooglePlaces from '../hooks/useGooglePlaces';

/**
 * SearchHistoryScreen displays a list of recently searched places.
 * Allows users to select, multi-select, delete, or clear search history.
 */
export default function SearchHistoryScreen() {
  // State for selection mode and selected items
  const [selectedItems, setSelectedItems] = useState([]);
  const [selectionMode, setSelectionMode] = useState(false);

  // Hooks
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const { handleSelectPlace, clearHistory: contextClearHistory, deleteHistory, history } = usePlace();
  const { getPhotoUrl } = useGooglePlaces();

  /**
   * Show confirmation dialog and clear all history if confirmed.
   */
  const clearHistoryLocal = async () => {
    Alert.alert('Clear All History', 'Are you sure?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Clear', onPress: async () => {
          contextClearHistory();
        }, style: 'destructive'
      }
    ]);
  };

  /**
   * Toggle selection of a place in multi-select mode.
   * @param {string} place_id
   */
  const toggleSelect = (place_id) => {
    if (selectedItems.includes(place_id)) {
      setSelectedItems(selectedItems.filter((id) => id !== place_id));
    } else {
      setSelectedItems([...selectedItems, place_id]);
    }
  };

  /**
   * Delete all selected places from history.
   */
  const deleteSelected = async () => {
    deleteHistory(selectedItems);
    setSelectedItems([]);
    setSelectionMode(false);
  };

  /**
   * Exit multi-select mode and clear selection.
   */
  const exitSelectionMode = () => {
    setSelectionMode(false);
    setSelectedItems([]);
  };

  /**
   * Handle selecting a place from history.
   * @param {Object} item
   */
  const handleSelect = async (item) => {
    await handleSelectPlace({
      placeId: item.place_id,
    });
    navigation.goBack();
  };

  /**
   * Render a single history item row.
   */
  const renderItem = ({ item }) => (
    <TouchableOpacity
      style={[styles.item, selectedItems.includes(item.place_id) && styles.itemSelected]}
      onLongPress={() => setSelectionMode(true)}
      onPress={() => {
        if (selectionMode) {
          toggleSelect(item.place_id);
        } else {
          handleSelect(item);
        }
      }}
    >
      {item.photo_reference ? (
        <Image
          source={{
            uri: getPhotoUrl(item.photo_reference, 100),
          }}
          style={styles.image}
        />
      ) : (
        <View style={[styles.image, { backgroundColor: '#eee', justifyContent: 'center', alignItems: 'center' }]}>
          <Ionicons name="image" size={24} color="#999" />
        </View>
      )}
      <View style={{ flex: 1, marginLeft: 10 }}>
        <Text style={styles.name}>{item.name}</Text>
        <Text style={styles.address}>{item.address}</Text>
      </View>
      {selectionMode ? (
        <Ionicons
          name={selectedItems.includes(item.place_id) ? 'checkbox' : 'square-outline'}
          size={24}
          color="black"
        />
      ) : (
        <TouchableOpacity
          onPress={() => deleteHistory([item.place_id])}
        >
          <Ionicons name="trash" size={20} color="red" />
        </TouchableOpacity>
      )}
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      {/* Selection bar for multi-select actions */}
      {selectionMode && (
        <View style={styles.selectionBar}>
          <TouchableOpacity onPress={deleteSelected} style={styles.selectionButton}>
            <Text style={styles.selectionButtonText}>Delete Selected</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={exitSelectionMode} style={styles.selectionButton}>
            <Text style={styles.selectionButtonText}>Cancel</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* List of history items */}
      <FlatList
        data={history}
        keyExtractor={(item) => item.place_id}
        renderItem={renderItem}
        contentContainerStyle={{ paddingBottom: 80 }}
      />

      {/* Clear all history button */}
      <TouchableOpacity style={[styles.clearButton, { marginBottom: insets.bottom || 10 }]} onPress={clearHistoryLocal}>
        <Text style={styles.clearText}>Clear History</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    padding: 10,
  },
  item: {
    flexDirection: 'row',
    padding: 15,
    borderBottomColor: '#ccc',
    borderBottomWidth: 1,
    borderRadius: 8,
    marginBottom: 10,
    backgroundColor: '#f9f9f9',
    alignItems: 'center',
  },
  itemSelected: {
    backgroundColor: '#d0ebff',
  },
  name: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  address: {
    fontSize: 14,
    color: '#666',
  },
  clearButton: {
    padding: 15,
    backgroundColor: '#eee',
    alignItems: 'center',
    borderRadius: 8,
    marginTop: 10,
  },
  clearText: {
    color: 'red',
    fontWeight: 'bold',
  },
  selectionBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 10,
    backgroundColor: '#eee',
    borderRadius: 8,
    marginBottom: 10,
  },
  selectionButton: {
    padding: 10,
    backgroundColor: '#ddd',
    borderRadius: 6,
  },
  selectionButtonText: {
    fontWeight: 'bold',
  },
  image: {
    width: 60,
    height: 60,
    borderRadius: 8,
  },
});
