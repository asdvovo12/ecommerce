// NewArrivalsScreen.js (Create this new file)
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity, Image, ScrollView } from 'react-native';
import { MaterialIcons, FontAwesome } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';

const NewArrivalsScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { t } = useTranslation();
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [products, setProducts] = useState([]);
  const screenTitle = t('newArrivals'); // Use translation

  const loadPreferences = async () => {
    try {
      const savedDarkMode = await AsyncStorage.getItem('darkMode');
      if (savedDarkMode !== null) {
        setIsDarkMode(savedDarkMode === 'true');
      }
    } catch (error) {
      console.error('Error loading preferences:', error);
    }
  };

  const loadFavorites = async () => {
    try {
      const favoritesString = await AsyncStorage.getItem('favoriteProducts');
      if (favoritesString !== null) {
        return JSON.parse(favoritesString);
      }
      return [];
    } catch (error) {
      console.error("Error loading favorites:", error);
      return [];
    }
  };

  const updateProductFavorites = async (initialProducts) => {
    const favorites = await loadFavorites();
    return initialProducts.map((product) => ({
      ...product,
      isFavorite: favorites.some((fav) => fav.id === product.id),
    }));
  };

  useFocusEffect(
    React.useCallback(() => {
      loadPreferences();
      if (route.params?.products) {
          const initialProducts = route.params.products;
          updateProductFavorites(initialProducts).then(updatedProducts => {
              setProducts(updatedProducts);
          })

      }
    }, [route.params?.products])
  );

  const toggleFavorite = async (productId) => {
    const updatedProducts = products.map((product) =>
      product.id === productId ? { ...product, isFavorite: !product.isFavorite } : product
    );
    setProducts(updatedProducts);

    // Update favorites in AsyncStorage (important for persistence)
    try {
      const favorites = updatedProducts.filter((p) => p.isFavorite);
      await AsyncStorage.setItem('favoriteProducts', JSON.stringify(favorites));
    } catch (e) {
      console.error("Failed to save favorites", e);
    }
  };

  const dynamicStyles = StyleSheet.create({
    safeArea: {
      flex: 1,
      backgroundColor: isDarkMode ? '#121212' : 'white',
    },
    container: {
      flex: 1,
      paddingHorizontal: 20,
      backgroundColor: isDarkMode ? '#1e1e1e' : '#f8f8f8',
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      marginTop: 40,
      marginBottom: 40,
      justifyContent: 'center',
    },
    title: {
      fontSize: 24,
      fontWeight: 'bold',
      color: isDarkMode ? '#ffffff' : '#404040',
      position: 'absolute',
    },
    backButton: {
      marginLeft: 10,
      position: 'absolute',
      left: 0,
      top: '50%',
      transform: [{ translateY: -12 }],
    },
    backIcon: {
      color: isDarkMode ? 'white' : 'black',
    },
     productCard: {  // Consistent styling with other screens
            flexDirection: 'row',
            backgroundColor: isDarkMode ? '#333' : '#fff',
            borderRadius: 10,
            padding: 10,
            marginBottom: 10,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.1,
            shadowRadius: 4,
            elevation: 3, // Add shadow for Android
        },
        productImage: {
            width: 80,
            height: 80,
            marginRight: 10,
            borderRadius: 5,
        },
        productInfo: {
            flex: 1,
            justifyContent: 'center',
        },
        productName: {
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
        favoriteIcon: { // Added favoriteIcon styles
            position: 'absolute',
            top: 10,
            right: 10,
        }
  });

  return (
    <SafeAreaView style={dynamicStyles.safeArea}>
      <View style={dynamicStyles.container}>
        <View style={dynamicStyles.header}>
          <TouchableOpacity
            style={dynamicStyles.backButton}
            onPress={() => navigation.goBack()}
          >
            <MaterialIcons name="arrow-back" size={24} style={dynamicStyles.backIcon} />
          </TouchableOpacity>
          <Text style={dynamicStyles.title}>{screenTitle}</Text>
        </View>

        <ScrollView>
          {products.map((product) => (
            <TouchableOpacity
              key={product.id}
              onPress={() => navigation.navigate('ProductDetail', { product })}
              style={dynamicStyles.productCard}
            >
              <Image source={product.image} style={dynamicStyles.productImage} resizeMode="contain" />
              <View style={dynamicStyles.productInfo}>
                <Text style={dynamicStyles.productName}>{product.name}</Text>
                <Text style={dynamicStyles.productBrand}>{product.brand}</Text>
                <Text style={dynamicStyles.price}>{product.price}</Text>
              </View>
                <TouchableOpacity
                    style={dynamicStyles.favoriteIcon}
                    onPress={(event) => {
                        event.stopPropagation(); // Prevent navigation
                        toggleFavorite(product.id);
                    }}
                >
                    <FontAwesome
                        name={product.isFavorite ? 'heart' : 'heart-o'}
                        size={24}
                        color={product.isFavorite ? '#F8D247' : (isDarkMode ? 'white' : 'black')}
                    />
                </TouchableOpacity>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>
    </SafeAreaView>
  );
};

export default NewArrivalsScreen;