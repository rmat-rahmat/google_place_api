import React from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet, Image } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import useGooglePlaces from '../hooks/useGooglePlaces';

/**
 * RecentHistory component displays a horizontal list of recently searched places.
 * Uses Google Places hook for photo URLs.
 *
 * Props:
 * - history: Array of place objects
 * - navigation: React Navigation object
 * - style: Custom style for the container
 * - onItemPress: Function to call when a history item is pressed
 * - limit: Maximum number of items to display
 */
const RecentHistory = ({ history, navigation, style, onItemPress, limit }) => {
    const { getPhotoUrl } = useGooglePlaces();

    // Render a single history item
    const renderHistoryItem = ({ item }) => (
        <TouchableOpacity
            key={item.place_id}
            style={styles.historyGridItem}
            onPress={() => onItemPress(item)}
        >
            {item.photo_reference ? (
                <Image
                    source={{
                        uri: getPhotoUrl(item.photo_reference, 200),
                    }}
                    style={styles.historyImage}
                />
            ) : (
                <View style={[styles.historyImage, styles.imagePlaceholder]}>
                    <Ionicons name="image" size={24} color="#999" />
                </View>
            )}
            <Text style={styles.historyName} numberOfLines={1}>{item.name}</Text>
        </TouchableOpacity>
    );

    // Only render if there is history
    if (!history || history.length === 0) return null;

    return (
        <View style={style}>
            <View style={styles.header}>
                <Text style={styles.historyTitle}>Recent Searches</Text>
                <TouchableOpacity onPress={() => navigation.navigate('SearchHistory')}>
                    <Text style={styles.viewAllText}>View All</Text>
                </TouchableOpacity>
            </View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.scrollView}>
                {history.slice(0, limit).map((item) => renderHistoryItem({ item }))}
            </ScrollView>
        </View>
    );
};

const styles = StyleSheet.create({
    historyPanel: {
        padding: 10,
        backgroundColor: '#fff',
        borderTopColor: '#ccc',
        borderTopWidth: 1,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    historyTitle: {
        fontWeight: 'bold',
        fontSize: 16,
    },
    viewAllText: {
        color: '#007AFF',
    },
    scrollView: {
        marginTop: 10,
    },
    historyGridItem: {
        width: 120,
        marginBottom: 10,
        alignItems: 'center',
    },
    historyImage: {
        width: 100,
        height: 100,
        borderRadius: 6,
    },
    imagePlaceholder: {
        backgroundColor: '#ddd',
        justifyContent: 'center',
        alignItems: 'center',
    },
    historyName: {
        fontSize: 14,
        marginTop: 5,
        textAlign: 'center',
    },
});

export default RecentHistory;