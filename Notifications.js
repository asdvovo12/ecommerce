// Notifications.js (Corrected with Dark Mode, i18n, consistent styling, and favorite icons, positioned top-right)
import React, {useState, useEffect} from 'react';
import { View, Text, FlatList, Image, StyleSheet, TouchableOpacity, SafeAreaView } from 'react-native';
import { MaterialIcons, FontAwesome } from '@expo/vector-icons'; // Import FontAwesome
import { useNavigation } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import AsyncStorage from '@react-native-async-storage/async-storage';


const NotificationsScreen = ({ route }) => {
  const navigation = useNavigation();
  const { t } = useTranslation();
  const newArrivals = route.params?.newArrivals || [];
  const newArrivalsCount = newArrivals.length;
  const [isDarkMode, setIsDarkMode] = useState(false);
    const [favorites, setFavorites] = useState({}); // State to track favorites


  useEffect(() => {
    const loadDarkMode = async () => {
      try {
        const storedDarkMode = await AsyncStorage.getItem('darkMode');
        if (storedDarkMode !== null) {
          setIsDarkMode(storedDarkMode === 'true');
        }
      } catch (error) {
        console.error("Error loading dark mode preference:", error);
      }
    };
       const loadFavorites = async () => {
        try {
            const favoritesString = await AsyncStorage.getItem('favoriteProducts');
            if (favoritesString) {
                const favoriteProducts = JSON.parse(favoritesString);
                // Create a map of favorite product IDs for efficient lookup
                const favoriteIds = {};
                favoriteProducts.forEach(product => {
                  favoriteIds[product.id] = true;
              });
                setFavorites(favoriteIds);
            }
        } catch (error) {
             console.error("Error loading favorites:", error);
        }
    };


    loadDarkMode();
    loadFavorites();
  }, []);

    const toggleFavorite = async (productId) => {
     const newFavorites = { ...favorites };
        if (newFavorites[productId]) {
            delete newFavorites[productId]; // Remove if already favorite
        } else {
            newFavorites[productId] = true; // Add as favorite
        }
        setFavorites(newFavorites);

      try {
        // Update AsyncStorage
        const allProductsString = await AsyncStorage.getItem('favoriteProducts');
        let allProducts = allProductsString ? JSON.parse(allProductsString) : [];

           if (newFavorites[productId]) {
              //Add to favorites
              const productToAdd = newArrivals.find(p => p.id === productId);
              if (productToAdd && !allProducts.some(p => p.id === productId)) { //check if exist
                  allProducts.push(productToAdd);
              }
          } else {
             // Remove from favorites
                allProducts = allProducts.filter(p => p.id !== productId);

          }

        await AsyncStorage.setItem('favoriteProducts', JSON.stringify(allProducts));
    } catch (error) {
        console.error("Error updating favorites in AsyncStorage:", error);
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
    countText: {
      fontSize: 18,
      color: isDarkMode ? '#ffffff' : '#505050',
      marginBottom: 16,
    },
    countNumber: {
      color: isDarkMode ? '#F8D247' : 'red',
      fontWeight: 'bold',
    },
    list: {
      flex: 1,
    },
    productContainer: {
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
      position: 'relative', // Add this for absolute positioning of the icon
    },
    productImage: {
      width: 80,
      height: 80,
      marginRight: 10,
      borderRadius: 5,
    },
    productInfo: {
      flex: 1, // Allow product info to take available space
      justifyContent: 'center',
    },
    productName: {
      fontSize: 16,
      fontWeight: 'bold',
      color: isDarkMode ? '#fff' : '#333',
    },
    productBrand: {
      fontSize: 14,
      color: isDarkMode ? '#ccc' : '#666',
    },
    productPrice: {
      fontSize: 14,
      fontWeight: 'bold',
      color: isDarkMode ? '#F8D247' : '#000',
    },
    favoriteIcon: {
      position: 'absolute', // Position absolutely
      top: 10,          // 10px from the top
      right: 10,        // 10px from the right
    },
  });



    // Corrected: Renders with favorite icon
    const renderItem = ({ item }) => (
      <TouchableOpacity
        style={dynamicStyles.productContainer}
        onPress={() => navigation.navigate(item.screen, { product: item })} // Navigate to ProductDetail
      >
          <Image source={item.image} style={dynamicStyles.productImage} resizeMode="contain" />
        <View style={dynamicStyles.productInfo}>
          <Text style={dynamicStyles.productName}>{item.name}</Text>
          <Text style={dynamicStyles.productBrand}>{item.brand}</Text>
          <Text style={dynamicStyles.productPrice}>{item.price}</Text>
        </View>
           <TouchableOpacity style={dynamicStyles.favoriteIcon} onPress={(event) =>{ event.stopPropagation(); toggleFavorite(item.id);}}>
              <FontAwesome
                name={favorites[item.id] ? 'heart' : 'heart-o'}
                size={24}
                color={favorites[item.id] ? '#F8D247' : (isDarkMode ? 'white' : 'black')}
              />
            </TouchableOpacity>
      </TouchableOpacity>
    );

  return (
    <SafeAreaView style={dynamicStyles.safeArea}>
      <View style={dynamicStyles.container}>
           <View style={dynamicStyles.header}>
             <TouchableOpacity style={dynamicStyles.backButton} onPress={() => navigation.goBack()}>
                <MaterialIcons name="arrow-back" size={24} style={dynamicStyles.backIcon} />
              </TouchableOpacity>
            <Text style={dynamicStyles.title}>{t('Notifications')}</Text>

          </View>

        <Text style={dynamicStyles.countText}>
          {t('You have')} <Text style={dynamicStyles.countNumber}>{newArrivalsCount}</Text> {t('new arrivals!')}
        </Text>
        <FlatList
          data={newArrivals}
          renderItem={renderItem}
          keyExtractor={(item) => item.id}
          style={dynamicStyles.list}
        />
      </View>
    </SafeAreaView>
  );
};



export default NotificationsScreen;