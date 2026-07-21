// MyCart.js (Fully Refactored)

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  SafeAreaView,
  ScrollView,
  Alert,
} from 'react-native';
import IconIo from 'react-native-vector-icons/Ionicons';
import { useNavigation, useRoute } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useDarkMode } from './DarkModeContext'; // Make sure this path is correct
import { useTranslation } from 'react-i18next';
import './i18n'; // Make sure this path is correct

const MyCart = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const [cartItems, setCartItems] = useState([]);
  const deliveryFee = 10;
  const { isDarkMode } = useDarkMode();
  const { t } = useTranslation();

  // --- Data Loading and Saving ---

  // useCallback for loading cart (optimized for re-renders)
  const loadCart = useCallback(async () => {
    try {
      const savedCart = await AsyncStorage.getItem('cart');
      if (savedCart) {
        setCartItems(JSON.parse(savedCart));
      }
    } catch (error) {
      console.error('Failed to load cart:', error);
    }
  }, []);

  useEffect(() => {
    loadCart(); // Initial load

    // Reload cart when the screen comes into focus (important!)
    const unsubscribe = navigation.addListener('focus', loadCart);
    return unsubscribe;
  }, [navigation, loadCart]); // Include loadCart in dependencies

  useEffect(() => {
    const saveCart = async () => {
      try {
        if (cartItems.length > 0) {
          await AsyncStorage.setItem('cart', JSON.stringify(cartItems));
        } else {
          await AsyncStorage.removeItem('cart');
        }
      } catch (error) {
        console.error('Failed to save cart:', error);
      }
    };

    saveCart();
  }, [cartItems]);

  // --- Handling New Items from route.params ---
  useEffect(() => {
    if (route.params?.item) {
      const newItem = route.params.item;
      const existingItemIndex = cartItems.findIndex(
        (item) => item.id === newItem.id && item.storage === newItem.storage
      );

      if (existingItemIndex > -1) {
        // Item exists, update quantity
        const updatedCartItems = [...cartItems];
        updatedCartItems[existingItemIndex].quantity += newItem.quantity;
        setCartItems(updatedCartItems);
      } else {
        // New item, add to cart
        setCartItems((prevItems) => [...prevItems, newItem]);
      }

      // Clear the item from route.params *after* processing
      navigation.setParams({ item: undefined });
    }
  }, [route.params, cartItems, navigation]); // Correct dependencies

  // --- Calculation Functions ---

  const calculateSubtotal = () => {
    return cartItems.reduce((subtotal, item) => {
      const discountedPrice = item.price * (1 - (item.discount || 0));
      return subtotal + discountedPrice * item.quantity;
    }, 0);
  };

  const calculateTotalDiscount = () => {
    return cartItems.reduce((totalDiscount, item) => {
      return totalDiscount + item.price * (item.discount || 0) * item.quantity;
    }, 0);
  };

  const calculateTotal = () => {
    const subtotal = calculateSubtotal();
    const totalDiscount = calculateTotalDiscount();
    return subtotal > 0 ? subtotal + deliveryFee - totalDiscount : 0;
  };

  // --- Item Interaction Handlers ---

  const handleQuantityChange = (itemId, itemStorage, newQuantity) => {
    if (newQuantity <= 0) {
      handleDeleteItem(itemId, itemStorage); // Remove if quantity becomes 0
      return;
    }

    setCartItems((prevItems) =>
      prevItems.map((item) =>
        item.id === itemId && item.storage === itemStorage
          ? { ...item, quantity: newQuantity }
          : item
      )
    );
  };

  const handleDeleteItem = (itemId, itemStorage) => {
    setCartItems((prevItems) =>
      prevItems.filter((item) => !(item.id === itemId && item.storage === itemStorage))
    );
  };

  // --- Navigation ---

  const handleCheckout = () => {
    if (cartItems.length > 0) {
      navigation.navigate('Checkout', { cartItems, deliveryFee, total: calculateTotal() }); // Pass total too
    } else {
      Alert.alert(t('Error'), t('Your cart is empty.'));
    }
  };

  const handleBackPress = () => {
    navigation.goBack();
  };

  // --- Rendering ---

  const renderCartItem = ({ item }) => (
    <View style={[styles.cartItemContainer, isDarkMode && styles.cartItemContainerDark]}>
      <Image source={{ uri: item.image }} style={styles.cartItemImage} />
      <View style={styles.cartItemDetails}>
        <Text style={[styles.cartItemName, isDarkMode && styles.cartItemNameDark]}>{item.name}</Text>
        <Text style={[styles.cartItemDescription, isDarkMode && styles.cartItemDescriptionDark]}>{item.description}</Text>
        <View style={styles.priceContainer}>
          {item.discount > 0 && (
            <Text style={[styles.originalPrice, isDarkMode && styles.originalPriceDark]}>${item.price.toFixed(2)}</Text>
          )}
          <Text style={[styles.cartItemPrice, isDarkMode && styles.cartItemPriceDark]}>
            ${(item.price * (1 - (item.discount || 0))).toFixed(2)}
          </Text>
        </View>
        {item.discount > 0 && (
          <Text style={[styles.discountText, isDarkMode && styles.discountTextDark]}>
            ({(item.discount * 100).toFixed(0)}% {t('off')})
          </Text>
        )}
        <View style={[styles.quantityControlContainer, isDarkMode && styles.quantityControlContainerDark]}>
          <TouchableOpacity
            onPress={() => handleQuantityChange(item.id, item.storage, item.quantity - 1)}
            style={[
              styles.quantityButton,
              item.quantity <= 1 && styles.disabledButton, // Keep disabled style
              { backgroundColor: isDarkMode ? '#404040' : '#424242' },
            ]}
            disabled={item.quantity <= 1} // Correctly disable
          >
            <IconIo name="remove-outline" size={20} color={item.quantity <= 1 ? (isDarkMode ? '#A9A9A9' : '#808080') : (isDarkMode ? '#E0E0E0' : 'white')} />
          </TouchableOpacity>
          <Text style={[styles.quantityText, isDarkMode && styles.quantityTextDark]}>{item.quantity}</Text>
          <TouchableOpacity
            onPress={() => handleQuantityChange(item.id, item.storage, item.quantity + 1)}
            style={[
              styles.quantityButton,
              { backgroundColor: isDarkMode ? '#404040' : '#424242' },
            ]}
          >
            <IconIo name="add-outline" size={20} color={isDarkMode ? '#E0E0E0' : 'white'} />
          </TouchableOpacity>
        </View>
      </View>
      <TouchableOpacity
        onPress={() => handleDeleteItem(item.id, item.storage)}
        style={styles.deleteButton}
      >
        <IconIo name="trash" size={20} color="red" />
      </TouchableOpacity>
    </View>
  );

  return (
    <SafeAreaView style={[styles.container, isDarkMode && styles.containerDark]}>
      <View style={[styles.header, isDarkMode && styles.headerDark]}>
        <TouchableOpacity style={styles.backButton} onPress={handleBackPress}>
          <IconIo name="arrow-back" size={24} color={isDarkMode ? '#E0E0E0' : '#333'} />
        </TouchableOpacity>
        <Text style={[styles.title, isDarkMode && styles.titleDark]}>{t('Cart')}</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={[styles.scrollContainer, isDarkMode && styles.scrollContainerDark]}>
        <FlatList
          data={cartItems}
          renderItem={renderCartItem}
          keyExtractor={(item) => `${item.id}-${item.storage}`}
          ListEmptyComponent={
            <Text style={[styles.emptyText, isDarkMode && styles.emptyTextDark]}>{t('Your cart is empty.')}</Text>
          }
        />
      </ScrollView>

      <View style={[styles.summaryContainer, isDarkMode && styles.summaryContainerDark]}>
        <View style={styles.summaryRow}>
          <Text style={[styles.summaryLabel, isDarkMode && styles.summaryLabelDark]}>{t('Subtotal')}:</Text>
          <Text style={[styles.summaryValue, isDarkMode && styles.summaryValueDark]}>
            ${calculateSubtotal().toFixed(2)}
          </Text>
        </View>

        {calculateSubtotal() > 0 && (
          <View style={styles.summaryRow}>
            <Text style={[styles.summaryLabel, isDarkMode && styles.summaryLabelDark]}>{t('Delivery Fee')}:</Text>
            <Text style={[styles.summaryValue, isDarkMode && styles.summaryValueDark]}>${deliveryFee.toFixed(2)}</Text>
          </View>
        )}

        {calculateTotalDiscount() > 0 && (
          <View style={styles.summaryRow}>
            <Text style={[styles.summaryLabel, isDarkMode && styles.summaryLabelDark]}>{t('Discount')}:</Text>
            <Text style={[styles.summaryValue, isDarkMode && styles.summaryValueDark]}>
              {(calculateTotalDiscount() / (calculateSubtotal() + calculateTotalDiscount()) * 100).toFixed(0)}%
            </Text>
          </View>
        )}

        <View style={[styles.summaryRow, styles.totalRow]}>
          <Text style={[styles.summaryLabel, styles.totalLabel, isDarkMode && styles.totalLabelDark]}>{t('Total')}:</Text>
          <Text style={[styles.summaryValue, styles.totalValue, isDarkMode && styles.totalValueDark]}>
            ${calculateTotal().toFixed(2)}
          </Text>
        </View>

        {/* Checkout Button with Glow Effect - Square */}
        <TouchableOpacity
          style={[
            styles.checkoutButton,
            isDarkMode ? styles.checkoutButtonDark : styles.checkoutButtonLight, // Conditional styling
          ]}
          onPress={handleCheckout}
        >
          <Text style={[styles.checkoutButtonText, isDarkMode && styles.checkoutButtonTextDark]}>{t('Checkout')}</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f8f8',
  },
  containerDark: {
    backgroundColor: '#121212',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
    backgroundColor: 'white',
  },
  headerDark: {
    backgroundColor: '#1E1E1E',
    borderBottomColor: '#333',
  },
  backButton: {
    paddingHorizontal: 8,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    flex: 1,
    textAlign: 'center',
  },
  titleDark: {
    color: '#E0E0E0',
  },
  scrollContainer: {
    flex: 1,
  },
  scrollContainerDark: {
    backgroundColor: '#121212',
  },
  cartItemContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: 'white',
    marginBottom: 8,
    borderRadius: 8,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    marginHorizontal: 8,
  },
  cartItemContainerDark: {
    backgroundColor: '#282828',
    elevation: 0,
    shadowOpacity: 0,
  },
  cartItemImage: {
    width: 80,
    height: 80,
    marginRight: 16,
    resizeMode: 'contain',
  },
  cartItemDetails: {
    flex: 1,
  },
  cartItemName: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  cartItemNameDark: {
    color: '#E0E0E0',
  },
  cartItemDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  cartItemDescriptionDark: {
    color: '#A9A9A9',
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  originalPrice: {
    fontSize: 14,
    color: '#999',
    textDecorationLine: 'line-through',
    marginRight: 8,
  },
  originalPriceDark: {
    color: '#707070',
  },
  cartItemPrice: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  cartItemPriceDark: {
    color: '#E0E0E0',
  },
  discountText: {
    fontSize: 14,
    color: 'green',
  },
  discountTextDark: {
    color: '#32CD32'
  },
  quantityControlContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#dcdcdc',
    borderRadius: 20,
    paddingHorizontal: 4,
    paddingVertical: 0,
    justifyContent: 'flex-start',
    alignSelf: 'flex-start',
  },
  quantityControlContainerDark: {
    backgroundColor: '#303030',
  },
  quantityButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 0,
  },
  disabledButton: {
    backgroundColor: '#ddd',
  },
  quantityText: {
    fontSize: 16,
    fontWeight: 'bold',
    marginHorizontal: 8,
    color: 'black',
    minWidth: 20,
    textAlign: 'center',
  },
  quantityTextDark: {
    color: '#E0E0E0',
  },
  deleteButton: {
    padding: 10,
  },
  summaryContainer: {
    padding: 16,
    backgroundColor: 'white',
    borderTopWidth: 1,
    borderTopColor: '#ddd',
  },
  summaryContainerDark: {
    backgroundColor: '#1E1E1E',
    borderTopColor: '#333',
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  summaryLabel: {
    fontSize: 16,
    color: '#333',
  },
  summaryLabelDark: {
    color: '#E0E0E0',
  },
  summaryValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  summaryValueDark: {
    color: '#E0E0E0',
  },
  totalRow: {
    marginTop: 4,
    borderTopWidth: 1,
    borderTopColor: '#ddd',
    paddingTop: 4,
  },
  totalLabel: {
    fontWeight: 'bold',
  },
  totalLabelDark: {
    color: '#E0E0E0',
  },
  totalValue: {
    fontSize: 18,
    color: '#000',
  },
  totalValueDark: {
    color: '#FFF',
  },
  checkoutButton: {
    paddingVertical: 13,
    borderRadius: 4, // Changed to 4 for a square button
    alignItems: 'center',
    marginTop: 12,
  },
  checkoutButtonLight: {
    backgroundColor: '#ffdd00',
    elevation: 10,
    shadowColor: '#ffdd00',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 10,
  },
  checkoutButtonDark: {
    backgroundColor: '#555',
    elevation: 10,
    shadowColor: '#FFFFFF',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 10,
  },
  checkoutButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: 'black',
  },
  checkoutButtonTextDark: {
    color: 'white',
  },
  emptyText: {
    textAlign: 'center',
    marginTop: 50,
    fontSize: 18,
    color: '#999',
  },
  emptyTextDark: {
    color: '#A9A9A9',
  },
});

export default MyCart;