// Cart.js
import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  SafeAreaView,
  Alert,
} from 'react-native';
import IconIo from 'react-native-vector-icons/Ionicons';
import { useNavigation, useRoute } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useDarkMode } from './DarkModeContext';
import { useTranslation } from 'react-i18next';
import './i18n';

/* ✅ يمنع كراش: Value for uri cannot be cast from Double to String */
const toImageSource = (img) => {
  if (img === null || img === undefined) return null;
  if (typeof img === 'number') return img;                 // require('./assets/x.png')
  if (typeof img === 'string') return img ? { uri: img } : null;
  if (typeof img === 'object' && typeof img.uri === 'string') return { uri: img.uri };
  return null;
};

const sameItem = (a, id, storage) =>
  String(a.id) === String(id) && (a.storage ?? null) === (storage ?? null);

const MyCart = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const [cartItems, setCartItems] = useState([]);
  const [loaded, setLoaded] = useState(false);
  const deliveryFee = 10;
  const { isDarkMode } = useDarkMode();
  const { t } = useTranslation();

  /* ---------- التخزين ---------- */
  const persist = useCallback(async (list) => {
    try {
      if (list.length > 0) {
        await AsyncStorage.setItem('cart', JSON.stringify(list));
      } else {
        await AsyncStorage.removeItem('cart');
      }
    } catch (error) {
      console.error('Failed to save cart:', error);
    }
  }, []);

  /* ---------- التحميل + دمج أي item جاي من route.params (توافق للخلف) ---------- */
  const loadCart = useCallback(async () => {
    try {
      const saved = await AsyncStorage.getItem('cart');
      let list = saved ? JSON.parse(saved) : [];

      const newItem = route.params?.item;
      if (newItem) {
        const idx = list.findIndex((it) => sameItem(it, newItem.id, newItem.storage));
        if (idx > -1) {
          list[idx] = {
            ...list[idx],
            quantity: (Number(list[idx].quantity) || 0) + (Number(newItem.quantity) || 1),
          };
        } else {
          list.push({ ...newItem, quantity: Number(newItem.quantity) || 1 });
        }
        await persist(list);
        navigation.setParams({ item: undefined });
      }

      setCartItems(list);
      setLoaded(true);
    } catch (error) {
      console.error('Failed to load cart:', error);
      setLoaded(true);
    }
  }, [route.params?.item, navigation, persist]);

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', loadCart);
    loadCart();
    return unsubscribe;
  }, [navigation, loadCart]);

  /* ---------- الحسابات ---------- */
  const calculateSubtotal = () =>
    cartItems.reduce((subtotal, item) => {
      const price = Number(item.price) || 0;
      const discounted = price * (1 - (Number(item.discount) || 0));
      return subtotal + discounted * (Number(item.quantity) || 0);
    }, 0);

  const calculateTotalDiscount = () =>
    cartItems.reduce(
      (total, item) =>
        total + (Number(item.price) || 0) * (Number(item.discount) || 0) * (Number(item.quantity) || 0),
      0
    );

  const calculateTotal = () => {
    const subtotal = calculateSubtotal();
    return subtotal > 0 ? subtotal + deliveryFee : 0;
  };

  /* ---------- التعديلات (تحفظ فورًا) ---------- */
  const updateAndPersist = (updater) => {
    setCartItems((prev) => {
      const next = updater(prev);
      persist(next);
      return next;
    });
  };

  const handleQuantityChange = (itemId, itemStorage, newQuantity) => {
    if (newQuantity <= 0) {
      handleDeleteItem(itemId, itemStorage);
      return;
    }
    updateAndPersist((prev) =>
      prev.map((item) => (sameItem(item, itemId, itemStorage) ? { ...item, quantity: newQuantity } : item))
    );
  };

  const handleDeleteItem = (itemId, itemStorage) => {
    updateAndPersist((prev) => prev.filter((item) => !sameItem(item, itemId, itemStorage)));
  };

  /* ---------- التنقل ---------- */
  const handleCheckout = () => {
    if (cartItems.length > 0) {
      navigation.navigate('Checkout', {
        cartItems,
        deliveryFee,
        total: calculateTotal(),
      });
    } else {
      Alert.alert(t('Error'), t('Your cart is empty.'));
    }
  };

  const handleBackPress = () => navigation.goBack();

  /* ---------- العرض ---------- */
  const renderCartItem = ({ item }) => {
    const source = toImageSource(item.image);
    const price = Number(item.price) || 0;
    const discount = Number(item.discount) || 0;

    return (
      <View style={[styles.cartItemContainer, isDarkMode && styles.cartItemContainerDark]}>
        {source ? (
          <Image source={source} style={styles.cartItemImage} />
        ) : (
          <View style={[styles.cartItemImage, styles.imagePlaceholder]}>
            <IconIo name="image-outline" size={24} color="#999" />
          </View>
        )}

        <View style={styles.cartItemDetails}>
          <Text style={[styles.cartItemName, isDarkMode && styles.cartItemNameDark]}>{item.name}</Text>

          {!!item.storage && (
            <Text style={[styles.cartItemDescription, isDarkMode && styles.cartItemDescriptionDark]}>
              {item.storage}
            </Text>
          )}

          {!!item.description && (
            <Text
              numberOfLines={2}
              style={[styles.cartItemDescription, isDarkMode && styles.cartItemDescriptionDark]}
            >
              {item.description}
            </Text>
          )}

          <View style={styles.priceContainer}>
            {discount > 0 && (
              <Text style={[styles.originalPrice, isDarkMode && styles.originalPriceDark]}>
                ${price.toFixed(2)}
              </Text>
            )}
            <Text style={[styles.cartItemPrice, isDarkMode && styles.cartItemPriceDark]}>
              ${(price * (1 - discount)).toFixed(2)}
            </Text>
          </View>

          {discount > 0 && (
            <Text style={[styles.discountText, isDarkMode && styles.discountTextDark]}>
              ({(discount * 100).toFixed(0)}% {t('off')})
            </Text>
          )}

          <View style={[styles.quantityControlContainer, isDarkMode && styles.quantityControlContainerDark]}>
            <TouchableOpacity
              onPress={() => handleQuantityChange(item.id, item.storage, (Number(item.quantity) || 1) - 1)}
              style={[
                styles.quantityButton,
                item.quantity <= 1 && styles.disabledButton,
                { backgroundColor: isDarkMode ? '#404040' : '#424242' },
              ]}
              disabled={item.quantity <= 1}
            >
              <IconIo
                name="remove-outline"
                size={20}
                color={
                  item.quantity <= 1
                    ? isDarkMode
                      ? '#A9A9A9'
                      : '#808080'
                    : isDarkMode
                    ? '#E0E0E0'
                    : 'white'
                }
              />
            </TouchableOpacity>

            <Text style={[styles.quantityText, isDarkMode && styles.quantityTextDark]}>{item.quantity}</Text>

            <TouchableOpacity
              onPress={() => handleQuantityChange(item.id, item.storage, (Number(item.quantity) || 1) + 1)}
              style={[styles.quantityButton, { backgroundColor: isDarkMode ? '#404040' : '#424242' }]}
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
  };

  return (
    <SafeAreaView style={[styles.container, isDarkMode && styles.containerDark]}>
      <View style={[styles.header, isDarkMode && styles.headerDark]}>
        <TouchableOpacity style={styles.backButton} onPress={handleBackPress}>
          <IconIo name="arrow-back" size={24} color={isDarkMode ? '#E0E0E0' : '#333'} />
        </TouchableOpacity>
        <Text style={[styles.title, isDarkMode && styles.titleDark]}>{t('Cart')}</Text>
        <View style={{ width: 40 }} />
      </View>

      <FlatList
        style={[styles.list, isDarkMode && styles.listDark]}
        contentContainerStyle={cartItems.length === 0 ? styles.emptyListContent : styles.listContent}
        data={cartItems}
        renderItem={renderCartItem}
        keyExtractor={(item, index) => `${item.id}-${item.storage ?? 'na'}-${index}`}
        showsVerticalScrollIndicator={false}
        extraData={cartItems}
        ListEmptyComponent={
          loaded ? (
            <Text style={[styles.emptyText, isDarkMode && styles.emptyTextDark]}>
              {t('Your cart is empty.')}
            </Text>
          ) : null
        }
      />

      <View style={[styles.summaryContainer, isDarkMode && styles.summaryContainerDark]}>
        <View style={styles.summaryRow}>
          <Text style={[styles.summaryLabel, isDarkMode && styles.summaryLabelDark]}>{t('Subtotal')}:</Text>
          <Text style={[styles.summaryValue, isDarkMode && styles.summaryValueDark]}>
            ${calculateSubtotal().toFixed(2)}
          </Text>
        </View>

        {calculateSubtotal() > 0 && (
          <View style={styles.summaryRow}>
            <Text style={[styles.summaryLabel, isDarkMode && styles.summaryLabelDark]}>
              {t('Delivery Fee')}:
            </Text>
            <Text style={[styles.summaryValue, isDarkMode && styles.summaryValueDark]}>
              ${deliveryFee.toFixed(2)}
            </Text>
          </View>
        )}

        {calculateTotalDiscount() > 0 && (
          <View style={styles.summaryRow}>
            <Text style={[styles.summaryLabel, isDarkMode && styles.summaryLabelDark]}>{t('Discount')}:</Text>
            <Text style={[styles.summaryValue, isDarkMode && styles.summaryValueDark]}>
              -${calculateTotalDiscount().toFixed(2)}
            </Text>
          </View>
        )}

        <View style={[styles.summaryRow, styles.totalRow]}>
          <Text style={[styles.summaryLabel, styles.totalLabel, isDarkMode && styles.totalLabelDark]}>
            {t('Total')}:
          </Text>
          <Text style={[styles.summaryValue, styles.totalValue, isDarkMode && styles.totalValueDark]}>
            ${calculateTotal().toFixed(2)}
          </Text>
        </View>

        <TouchableOpacity
          style={[
            styles.checkoutButton,
            isDarkMode ? styles.checkoutButtonDark : styles.checkoutButtonLight,
            cartItems.length === 0 && styles.checkoutButtonDisabled,
          ]}
          onPress={handleCheckout}
          disabled={cartItems.length === 0}
        >
          <Text style={[styles.checkoutButtonText, isDarkMode && styles.checkoutButtonTextDark]}>
            {t('Checkout')}
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8f8f8' },
  containerDark: { backgroundColor: '#121212' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
    backgroundColor: 'white',
  },
  headerDark: { backgroundColor: '#1E1E1E', borderBottomColor: '#333' },
  backButton: { paddingHorizontal: 8 },
  title: { fontSize: 20, fontWeight: 'bold', flex: 1, textAlign: 'center' },
  titleDark: { color: '#E0E0E0' },
  list: { flex: 1 },
  listDark: { backgroundColor: '#121212' },
  listContent: { paddingVertical: 8 },
  emptyListContent: { flexGrow: 1, justifyContent: 'center' },
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
  cartItemContainerDark: { backgroundColor: '#282828', elevation: 0, shadowOpacity: 0 },
  cartItemImage: { width: 80, height: 80, marginRight: 16, resizeMode: 'contain' },
  imagePlaceholder: { alignItems: 'center', justifyContent: 'center', backgroundColor: '#eee', borderRadius: 8 },
  cartItemDetails: { flex: 1 },
  cartItemName: { fontSize: 16, fontWeight: 'bold', marginBottom: 4 },
  cartItemNameDark: { color: '#E0E0E0' },
  cartItemDescription: { fontSize: 14, color: '#666', marginBottom: 8 },
  cartItemDescriptionDark: { color: '#A9A9A9' },
  priceContainer: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  originalPrice: { fontSize: 14, color: '#999', textDecorationLine: 'line-through', marginRight: 8 },
  originalPriceDark: { color: '#707070' },
  cartItemPrice: { fontSize: 16, fontWeight: 'bold' },
  cartItemPriceDark: { color: '#E0E0E0' },
  discountText: { fontSize: 14, color: 'green' },
  discountTextDark: { color: '#32CD32' },
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
  quantityControlContainerDark: { backgroundColor: '#303030' },
  quantityButton: { width: 28, height: 28, borderRadius: 14, alignItems: 'center', justifyContent: 'center', marginHorizontal: 0 },
  disabledButton: { backgroundColor: '#ddd' },
  quantityText: { fontSize: 16, fontWeight: 'bold', marginHorizontal: 8, color: 'black', minWidth: 20, textAlign: 'center' },
  quantityTextDark: { color: '#E0E0E0' },
  deleteButton: { padding: 10 },
  summaryContainer: { padding: 16, backgroundColor: 'white', borderTopWidth: 1, borderTopColor: '#ddd' },
  summaryContainerDark: { backgroundColor: '#1E1E1E', borderTopColor: '#333' },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  summaryLabel: { fontSize: 16, color: '#333' },
  summaryLabelDark: { color: '#E0E0E0' },
  summaryValue: { fontSize: 16, fontWeight: 'bold', color: '#333' },
  summaryValueDark: { color: '#E0E0E0' },
  totalRow: { marginTop: 4, borderTopWidth: 1, borderTopColor: '#ddd', paddingTop: 4 },
  totalLabel: { fontWeight: 'bold' },
  totalLabelDark: { color: '#E0E0E0' },
  totalValue: { fontSize: 18, color: '#000' },
  totalValueDark: { color: '#FFF' },
  checkoutButton: { paddingVertical: 13, borderRadius: 4, alignItems: 'center', marginTop: 12 },
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
  checkoutButtonDisabled: { opacity: 0.5 },
  checkoutButtonText: { fontSize: 18, fontWeight: 'bold', color: 'black' },
  checkoutButtonTextDark: { color: 'white' },
  emptyText: { textAlign: 'center', fontSize: 18, color: '#999' },
  emptyTextDark: { color: '#A9A9A9' },
});

export default MyCart;