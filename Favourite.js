// MyFavoritesScreen.js
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity, Image, ScrollView } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';

const MyFavoritesScreen = () => {
    const navigation = useNavigation();
    const { t } = useTranslation();
    const [isDarkMode, setIsDarkMode] = useState(false);
    const [favoriteProducts, setFavoriteProducts] = useState([]);
    const screenTitle = t('Favourites');

    const loadFavorites = async () => {
        try {
            const favorites = await AsyncStorage.getItem('favoriteProducts');
            // The key change is here:  We're already parsing the favorites in ProductsScreen.  We just use that parsed data here.
            const parsedFavorites = favorites ? JSON.parse(favorites) : [];
            setFavoriteProducts(parsedFavorites);

        } catch (error) {
            console.error("Error loading favorites:", error);
            setFavoriteProducts([]); // Set to empty array on error
        }
    };

    useEffect(() => {
        const loadDarkMode = async () => {
            try {
                const storedDarkMode = await AsyncStorage.getItem('darkMode');
                setIsDarkMode(storedDarkMode === 'true');
            } catch (error) {
                console.error('Error loading dark mode preference:', error);
            }
        };

        loadDarkMode();
    }, []);

    useFocusEffect(
        React.useCallback(() => {
            loadFavorites();
        }, [])
    );

    const removeFavorite = async (productId) => {
        try {
            const updatedFavorites = favoriteProducts.filter(product => product.id !== productId);
            await AsyncStorage.setItem('favoriteProducts', JSON.stringify(updatedFavorites));
            setFavoriteProducts(updatedFavorites);
        } catch (error) {
            console.error("Error removing favorite:", error);
        }
    };


    const dynamicStyles = StyleSheet.create({
        // ... (your styles, no changes needed here) ...
          safeArea: {
            flex: 1,
            backgroundColor: isDarkMode ? '#121212' : 'white',
        },
        container: {
            flex: 1,
            paddingHorizontal: 20,
            backgroundColor: isDarkMode ? '#1e1e1e' : '#f8f8f8',
            justifyContent: 'space-between', // Distribute space, pushing button down
        },
        header: {
            flexDirection: 'row',
            alignItems: 'center',
            marginTop: 40, // Increased marginTop
            marginBottom: 40,
            justifyContent: 'center',
        },
        title: {
            fontSize: 24,
            fontWeight: 'bold',
            color: isDarkMode ? '#ffffff' : '#404040',
            position: 'absolute',
            //  marginTop: 20, // Removed.  marginTop is handled by the header now
        },
        emptyStateTitle: {
            fontSize: 20,
            fontWeight: 'bold',
            textAlign: 'center',
            marginBottom: 10,
            color: isDarkMode ? '#ffffff' : '#505050',
        },
        emptyStateText: {
            fontSize: 14,
            textAlign: 'center',
            color: isDarkMode ? '#cccccc' : '#808080',
            lineHeight: 20,
        },
        exploreButtonText: {
            color: isDarkMode ? 'white' : 'black',
            fontSize: 18,
            fontWeight: 'bold',
        },
        arrowColor: {
            color: isDarkMode ? 'white' : 'black',
        },
        backButton: {
            marginLeft: 10,
            position: 'absolute',
            left: 0,
            top: '50%', // keep
            transform: [{ translateY: -12 }], //keep
            // marginTop: 20,  // Removed. marginTop is handled by the header now
        },
        backIcon: {
            color: isDarkMode ? 'white' : 'black',
        },
        productCard: {  // Added productCard styles
            flexDirection: 'row',
            backgroundColor: isDarkMode ? '#333' : '#fff',
            borderRadius: 10,
            padding: 10,
            marginBottom: 10,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.1,
            shadowRadius: 4,
            elevation: 3,
        },
        productImage: { // Added productImage styles
            width: 80,
            height: 80,
            marginRight: 10,
            borderRadius: 5,
            resizeMode: 'contain', // Add this to make the image fit nicely
        },
        productInfo: { // Added productInfo styles
            flex: 1,
            justifyContent: 'center',
        },
        productName: { // Added productName styles
            fontSize: 16,
            fontWeight: 'bold',
            color: isDarkMode ? '#fff' : '#333',
        },
        productBrand: { // Added productBrand styles
            fontSize: 14,
            color: isDarkMode ? '#ccc' : '#666',
        },
        price: { // Added price styles
            fontSize: 14,
            fontWeight: 'bold',
            color: isDarkMode ? '#F8D247' : '#000',
        },
        removeButton: {
            position: 'absolute',
            top: 10,
            right: 10,
            padding: 5,
        },
        emptyStateContainer: {
            //flex: 1, //Removed flex:1
            justifyContent: 'center',
            alignItems: 'center',
            paddingHorizontal: 40,
            // marginBottom:20, //add marginBottom

        },
        emptyStateImage: {
            width: 150,
            height: 150,
            marginBottom: 30,
        },
        exploreButton: {
            backgroundColor: '#ffdd00',
            paddingVertical: 15,
            paddingHorizontal: 30,
            borderRadius: 30,
            alignItems: 'center',
            marginBottom: 30,
            marginHorizontal: 15,
             // Glow effect (exactly like proceedButton)
            elevation: 10,
            shadowColor: '#ffdd00',
            shadowOffset: { width: 0, height: 0 },
            shadowOpacity: 1,
            shadowRadius: 10,
        },
         darkExploreButton: { // Add styles for dark mode
           backgroundColor: '#555',
            // Dark mode glow
            elevation: 10,
            shadowColor: '#FFFFFF',  // White glow
            shadowOffset: { width: 0, height: 0 },
            shadowOpacity: 0.8, // Slightly reduced
            shadowRadius: 10,
        }
    });

    return (
        <SafeAreaView style={dynamicStyles.safeArea}>
            <View style={dynamicStyles.container}>
                <View style={dynamicStyles.header}>
                    <TouchableOpacity style={dynamicStyles.backButton} onPress={() => navigation.goBack()}>
                        <MaterialIcons name="arrow-back" size={24} style={dynamicStyles.backIcon} />
                    </TouchableOpacity>
                    <Text style={dynamicStyles.title}>{screenTitle}</Text>
                </View>

                {favoriteProducts.length === 0 ? (
                    <View style={{ flex: 1, justifyContent: 'center' }}>
                        <View style={dynamicStyles.emptyStateContainer}>
                            <Image
                                source={require('./assets/emptybox.png')} // Make sure this path is correct
                                style={dynamicStyles.emptyStateImage}
                                resizeMode="contain"
                            />
                            <Text style={dynamicStyles.emptyStateTitle}>{t('emptyStateTitle')}</Text>
                            <Text style={dynamicStyles.emptyStateText}>{t('emptyStateText')}</Text>
                        </View>
                    </View>
                ) : (
                    <ScrollView>
                        {favoriteProducts.map((product) => (
                            <TouchableOpacity
                                key={product.id}
                                style={dynamicStyles.productCard}
                                onPress={() => navigation.navigate('ProductDetail', { product })} // Navigate to ProductDetail
                            >
                                <Image source={typeof product.image === 'string' ? { uri: product.image } : product.image} style={dynamicStyles.productImage} />
                                <View style={dynamicStyles.productInfo}>
                                    <Text style={dynamicStyles.productName}>{product.name}</Text>
                                    <Text style={dynamicStyles.productBrand}>{product.brand}</Text>
                                    <Text style={dynamicStyles.price}>{product.price}</Text>
                                </View>
                                <TouchableOpacity style={dynamicStyles.removeButton} onPress={() => removeFavorite(product.id)}>
                                    <MaterialIcons name="delete" size={24} color={isDarkMode ? '#F8D247' : "red"} />
                                </TouchableOpacity>
                            </TouchableOpacity>
                        ))}
                    </ScrollView>
                )}

                <TouchableOpacity style={[dynamicStyles.exploreButton, isDarkMode && dynamicStyles.darkExploreButton]} onPress={() => navigation.navigate("Products")}>
                    <Text style={dynamicStyles.exploreButtonText}>{t('exploreButtonText')}</Text>
                </TouchableOpacity>
            </View>
        </SafeAreaView>
    );
};

export default MyFavoritesScreen;