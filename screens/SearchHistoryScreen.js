import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, Alert, StyleSheet,Image } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation,CommonActions } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const GOOGLE_API_KEY = 'AIzaSyCKzlA1LQpQre6lS3_EgyRpLr6vg56nUj4';

export default function SearchHistoryScreen() {
  const [history, setHistory] = useState([]);
  const [selectedItems, setSelectedItems] = useState([]);
  const [selectionMode, setSelectionMode] = useState(false);
  const navigation = useNavigation();
    const insets = useSafeAreaInsets();

  useEffect(() => {
    loadHistory();
  }, []);

  const loadHistory = async () => {
    try {
      const saved = await AsyncStorage.getItem('searchHistory');
      if (saved) setHistory(JSON.parse(saved));
    } catch (err) {
      console.warn('Error loading history:', err);
    }
  };

  const deleteItem = async (place_id) => {
    const updated = history.filter((item) => item.place_id !== place_id);
    setHistory(updated);
    await AsyncStorage.setItem('searchHistory', JSON.stringify(updated));
  };

  const clearHistory = async () => {
    Alert.alert('Clear All History', 'Are you sure?', [
      { text: 'Cancel', style: 'cancel'},
      {
        text: 'Clear', onPress: async () => {
          await AsyncStorage.removeItem('searchHistory');
          setHistory([]);
        }, style: 'destructive'
      }
    ]);
  };

  const toggleSelect = (place_id) => {
    if (selectedItems.includes(place_id)) {
      setSelectedItems(selectedItems.filter((id) => id !== place_id));
    } else {
      setSelectedItems([...selectedItems, place_id]);
    }
  };

  const deleteSelected = async () => {
    const filtered = history.filter((item) => !selectedItems.includes(item.place_id));
    setHistory(filtered);
    await AsyncStorage.setItem('searchHistory', JSON.stringify(filtered));
    setSelectedItems([]);
    setSelectionMode(false);
  };
  const exitSelectionMode = () => {
    setSelectionMode(false);
    setSelectedItems([]);
  };

  
   const handleSelect = (item) => {
    
    const selectedPlaceFromSearch = {
      name: item.name,
      address: item.formatted_address,
      coords:item.coords,
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
            uri: `https://maps.googleapis.com/maps/api/place/photo?maxwidth=100&photoreference=${item.photo_reference}&key=${GOOGLE_API_KEY}`,
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
          onPress={() => deleteItem(item.place_id)}
        >
          <Ionicons name="trash" size={20} color="red" />
        </TouchableOpacity>
      )}
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
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

      <FlatList
        data={history}
        keyExtractor={(item) => item.place_id}
        renderItem={renderItem}
        contentContainerStyle={{ paddingBottom: 80 }}
      />

      <TouchableOpacity style={[styles.clearButton,{ marginBottom: insets.bottom || 10 }]} onPress={clearHistory}>
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
