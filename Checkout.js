import React, { useRef, useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  Image,
  Animated,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute, useFocusEffect } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import { useDarkMode } from './DarkModeContext';
import * as WebBrowser from 'expo-web-browser';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useStripe } from '@stripe/stripe-react-native';
import { createPayPalPayment, getPayPalPaymentStatus } from './services/paypal';
import { createPaymentIntent } from './services/stripe';
import { createOrder, createLocalOrder } from './services/orders';   // ⬅️ اتعدل
import { DEMO_MODE } from './config';                                 // ⬅️ جديد
import { sendOrderReceipt } from './services/email';
import './i18n';

/* ✅ يمنع كراش: Value for uri cannot be cast from Double to String */
const toImageSource = (img) => {
  if (img === null || img === undefined) return null;
  if (typeof img === 'number') return img;                       // require('./assets/x.png')
  if (typeof img === 'string') return img ? { uri: img } : null; // URL
  if (typeof img === 'object' && typeof img.uri === 'string') return { uri: img.uri };
  return null;
};

const num = (v) => (Number.isFinite(Number(v)) ? Number(v) : 0);

const CheckoutScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { t } = useTranslation();
  const { isDarkMode } = useDarkMode();
  const { initPaymentSheet, presentPaymentSheet } = useStripe();

  const [cartItems, setCartItems] = useState(route.params?.cartItems || []);
  const [savedAddress, setSavedAddress] = useState(route.params?.savedAddress || null);
  const [paymentInfo, setPaymentInfo] = useState(route.params?.paymentInfo || null);
  const [isProcessing, setIsProcessing] = useState(false);

  const SHIPPING_FLAT = num(route.params?.deliveryFee); // بيجي من Cart لو موجود
  const TAX_RATE = 0;

  const proceedGlowAnim = useRef(new Animated.Value(0)).current;

  /* ✅ تحميل السلة + العنوان + طريقة الدفع من التخزين عند كل دخول للشاشة */
  const loadCheckoutData = useCallback(async () => {
    try {
      const [cartRaw, addrRaw, payRaw] = await Promise.all([
        AsyncStorage.getItem('cart'),
        AsyncStorage.getItem('shippingAddress'),
        AsyncStorage.getItem('paymentInfo'),
      ]);

      const paramItems = route.params?.cartItems;
      const storedCart = cartRaw ? JSON.parse(cartRaw) : [];
      setCartItems(Array.isArray(paramItems) && paramItems.length > 0 ? paramItems : storedCart);

      const addr = route.params?.savedAddress || (addrRaw ? JSON.parse(addrRaw) : null);
      setSavedAddress(addr);

      const pay = route.params?.paymentInfo || (payRaw ? JSON.parse(payRaw) : null);
      setPaymentInfo(pay);
    } catch (e) {
      console.warn('Failed to load checkout data:', e?.message);
    }
  }, [route.params?.cartItems, route.params?.savedAddress, route.params?.paymentInfo]);

  useFocusEffect(
    useCallback(() => {
      loadCheckoutData();
    }, [loadCheckoutData])
  );

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(proceedGlowAnim, { toValue: 1, duration: 1500, useNativeDriver: false }),
        Animated.timing(proceedGlowAnim, { toValue: 0, duration: 1500, useNativeDriver: false }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [proceedGlowAnim]);

  const handleBackPress = () => navigation.goBack();

  const total = cartItems.reduce(
    (acc, item) => acc + num(item.price) * (1 - num(item.discount)) * num(item.quantity),
    0
  );

  /* ✅ الاسم الصحيح المسجَّل في App.js هو "Payment" مش "PaymentScreen" */
  const handleEditPayment = () => {
    navigation.navigate('Payment', {
      cartItems,
      savedAddress,
      existingPaymentInfo: paymentInfo,
    });
  };

  const handleEditAddress = () => {
    navigation.navigate('ShippingAddress', {
      cartItems,
      paymentInfo,
      existingAddress: savedAddress,
    });
  };

  const handleProceedToPayment = async () => {
    if (isProcessing) return;

    if (!cartItems || cartItems.length === 0) {
      Alert.alert(t('Error'), t('Your cart is empty.'), [{ text: t('OK') }]);
      return;
    }

    if (!paymentInfo) {
      Alert.alert(t('Payment Required'), t('alert.addPaymentInfo'), [
        { text: t('Add Payment'), onPress: handleEditPayment },
        { text: t('Cancel'), style: 'cancel' },
      ]);
      return;
    }

    if (!savedAddress) {
      Alert.alert(t('Address Required'), t('alert.addShippingAddress'), [
        { text: t('Add Address'), onPress: handleEditAddress },
        { text: t('Cancel'), style: 'cancel' },
      ]);
      return;
    }

    const subtotal = Number(total.toFixed(2));
    const shipping = subtotal > 0 ? SHIPPING_FLAT : 0;
    const tax = Number((subtotal * TAX_RATE).toFixed(2));
    const grandTotal = Number((subtotal + shipping + tax).toFixed(2));

    if (!grandTotal || grandTotal <= 0) {
      Alert.alert(t('Error'), t('Your cart total is invalid.'), [{ text: t('OK') }]);
      return;
    }

    const method = paymentInfo.cardType === 'paypal' ? 'paypal' : 'stripe';
    setIsProcessing(true);

    try {
      let orderResult;

      if (DEMO_MODE) {
        /* ✅ وضع العرض/الديمو: من غير مفاتيح Stripe/PayPal ولا سيرفر شغال.
           بيسجل الأوردر (على Supabase لو المستخدم مسجّل دخول، وإلا على الجهاز)
           عشان الفلو يكمل لحد شاشة Order. المشتري بيقفله بـ
           EXPO_PUBLIC_DEMO_MODE=false بعد ما يحط مفاتيحه. */
        const orderPayload = {
          cartItems,
          shippingAddress: savedAddress,
          paymentMethod: paymentInfo.cardType || 'demo',
          paymentRef: `demo-${Date.now()}`,
          subtotal, shipping, tax, total: grandTotal, currency: 'USD',
        };

        try {
          orderResult = await createOrder(orderPayload);
        } catch (e) {
          console.warn('Demo order fell back to local storage:', e && e.message);
          orderResult = await createLocalOrder(orderPayload);
        }
      } else if (method === 'paypal') {
        const { approvalUrl, paymentId } = await createPayPalPayment(grandTotal, 'USD');
        await WebBrowser.openBrowserAsync(approvalUrl);

        const status = await getPayPalPaymentStatus(paymentId);
        if (!status?.verified) {
          Alert.alert(
            t('Payment Error'),
            t('We could not confirm your PayPal payment. If you were charged, please contact support.'),
            [{ text: t('OK') }]
          );
          return;
        }

        orderResult = await createOrder({
          cartItems,
          shippingAddress: savedAddress,
          paymentMethod: 'paypal',
          paymentRef: paymentId,
          subtotal, shipping, tax, total: grandTotal, currency: 'USD',
        });
      } else {
        const { clientSecret, paymentIntentId } = await createPaymentIntent(grandTotal, 'usd');

        const initResult = await initPaymentSheet({
          merchantDisplayName: 'E-Commerce',
          paymentIntentClientSecret: clientSecret,
          defaultBillingDetails: { name: paymentInfo.cardHolderName || undefined },
          allowsDelayedPaymentMethods: false,
        });
        if (initResult.error) throw new Error(initResult.error.message);

        const { error: sheetError } = await presentPaymentSheet();
        if (sheetError) {
          Alert.alert(t('Payment Error'), sheetError.message, [{ text: t('OK') }]);
          return;
        }

        orderResult = await createOrder({
          cartItems,
          shippingAddress: savedAddress,
          paymentMethod: 'stripe',
          paymentRef: paymentIntentId,
          subtotal, shipping, tax, total: grandTotal, currency: 'USD',
        });
      }

      if (orderResult && orderResult.order) {
        sendOrderReceipt({
          toEmail: orderResult.userEmail,
          order: orderResult.order,
          items: orderResult.items,
        }).catch((e) => console.warn('Receipt email failed:', e && e.message));
      }

      try {
        await AsyncStorage.removeItem('cart');
      } catch (e) {}
      setCartItems([]);

      Alert.alert(t('Success'), t('alert.orderPlacedSuccess'), [
        { text: t('OK'), onPress: () => navigation.navigate('Order') },
      ]);
    } catch (error) {
      console.error('Checkout failed:', error);
      Alert.alert(
        t('Payment Error'),
        error.message || t('Something went wrong. Please try again.'),
        [{ text: t('OK') }]
      );
    } finally {
      setIsProcessing(false);
    }
  };

  /* ---------- عناصر العرض ---------- */
  const renderCartItem = (item, index) => {
    const source = toImageSource(item.image);
    const price = num(item.price);
    const discount = num(item.discount);

    return (
      <View
        style={[styles.cartItemContainer, isDarkMode && styles.cartItemContainerDark]}
        key={`${item.id}-${item.storage ?? 'na'}-${index}`}
      >
        {source ? (
          <Image source={source} style={styles.cartItemImage} />
        ) : (
          <View style={[styles.cartItemImage, styles.imagePlaceholder]}>
            <Ionicons name="image-outline" size={24} color="#999" />
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
        </View>

        <Text style={[styles.quantityText, isDarkMode && styles.quantityTextDark]}>
          x{num(item.quantity)}
        </Text>
      </View>
    );
  };

  const renderAddressSection = () => (
    <View style={[styles.section, { marginTop: 20 }]}>
      <View style={{ flex: 1, paddingRight: 10 }}>
        <Text style={[styles.sectionLabel, isDarkMode && styles.sectionLabelDark]}>
          {t('Shipping address')}
        </Text>
        {savedAddress ? (
          <View style={styles.addressDisplay}>
            <Text style={[styles.addressText, isDarkMode && styles.addressTextDark]}>
              {`${savedAddress.firstName ?? ''} ${savedAddress.lastName ?? ''}`.trim()}
            </Text>
            <Text style={[styles.addressText, isDarkMode && styles.addressTextDark]}>
              {savedAddress.address}
            </Text>
            <Text style={[styles.addressText, isDarkMode && styles.addressTextDark]}>
              {`${savedAddress.city ?? ''}, ${savedAddress.stateRegion ?? ''} ${savedAddress.postalCode ?? ''}`}
            </Text>
            <Text style={[styles.addressText, isDarkMode && styles.addressTextDark]}>
              {savedAddress.country}
            </Text>
            <Text style={[styles.addressText, isDarkMode && styles.addressTextDark]}>
              {savedAddress.phoneNumber}
            </Text>
          </View>
        ) : (
          <Text style={[styles.paymentMethodPlaceholderText, isDarkMode && styles.paymentMethodPlaceholderTextDark]}>
            {t('No address selected')}
          </Text>
        )}
      </View>

      <TouchableOpacity
        style={[styles.editButton, isDarkMode ? styles.darkButton : styles.editButtonLight]}
        onPress={handleEditAddress}
      >
        <Text style={[styles.editButtonText, isDarkMode ? styles.whiteText : styles.darkText]}>
          {t('Edit')}
        </Text>
      </TouchableOpacity>
    </View>
  );

  const renderPaymentSection = () => {
    const last4 =
      typeof paymentInfo?.cardNumber === 'string' && paymentInfo.cardNumber.length >= 4
        ? paymentInfo.cardNumber.slice(-4)
        : null;

    return (
      <View style={[styles.section, { marginTop: 6 }]}>
        <View style={{ flex: 1, paddingRight: 10 }}>
          <Text style={[styles.sectionLabel, isDarkMode && styles.sectionLabelDark]}>
            {t('Payment method')}
          </Text>

          {paymentInfo ? (
            <View style={styles.paymentMethodDisplay}>
              <View style={styles.paymentMethodInfo}>
                {!!paymentInfo.cardType && (
                  <Image
                    source={
                      paymentInfo.cardType === 'visa'
                        ? require('./assets/Visa.png')
                        : paymentInfo.cardType === 'mastercard'
                        ? require('./assets/Mastercard.png')
                        : require('./assets/Paypal.png')
                    }
                    style={styles.paymentMethodIcon}
                    resizeMode="contain"
                  />
                )}
                <View>
                  {!!paymentInfo.cardHolderName && (
                    <Text style={[styles.paymentMethodText, isDarkMode && styles.paymentMethodTextDark]}>
                      {paymentInfo.cardHolderName}
                    </Text>
                  )}
                  <Text style={[styles.paymentMethodText, isDarkMode && styles.paymentMethodTextDark]}>
                    {last4 ? `**** **** **** ${last4}` : String(paymentInfo.cardType || '').toUpperCase()}
                  </Text>
                </View>
              </View>
            </View>
          ) : (
            <View style={styles.paymentMethodPlaceholder}>
              <Text style={[styles.paymentMethodPlaceholderText, isDarkMode && styles.paymentMethodPlaceholderTextDark]}>
                {t('noPaymentMethodSelected')}
              </Text>
            </View>
          )}
        </View>

        <TouchableOpacity
          style={[styles.editButton, isDarkMode ? styles.darkButton : styles.editButtonLight]}
          onPress={handleEditPayment}
        >
          <Text style={[styles.editButtonText, isDarkMode ? styles.whiteText : styles.darkText]}>
            {t('Edit')}
          </Text>
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <SafeAreaView style={[styles.safeArea, isDarkMode && styles.safeAreaDark]}>
      <View style={[styles.container, isDarkMode && styles.containerDark]}>
        <View style={[styles.header, isDarkMode && styles.headerDark]}>
          <TouchableOpacity style={styles.backButton} onPress={handleBackPress}>
            <Ionicons name="arrow-back" size={24} color={isDarkMode ? 'white' : 'black'} />
          </TouchableOpacity>
          <Text style={[styles.title, isDarkMode && styles.titleDark]}>{t('Checkout')}</Text>
          <View style={styles.backButton} />
        </View>

        <ScrollView style={[styles.scrollContainer, isDarkMode && styles.scrollContainerDark]}>
          <View style={styles.contentContainer}>
            {cartItems.length > 0 ? (
              cartItems.map((item, index) => renderCartItem(item, index))
            ) : (
              <Text style={[styles.emptyCartText, isDarkMode && styles.emptyCartTextDark]}>
                {t('Your cart is empty.')}
              </Text>
            )}

            {renderAddressSection()}

            <View style={[styles.separatorContainer, { marginBottom: 15 }]}>
              <View style={[styles.separatorLine, isDarkMode && styles.separatorLineDark]} />
            </View>

            {renderPaymentSection()}
          </View>
        </ScrollView>

        <View style={[styles.footer, isDarkMode && styles.footerDark]}>
          <View style={styles.bottomBar}>
            <View style={[styles.orderTotalContainer, isDarkMode && styles.orderTotalContainerDark]}>
              <Text style={[styles.orderTotalLabel, isDarkMode && styles.orderTotalLabelDark]}>
                {t('Order total')}
              </Text>
              <Text style={[styles.orderTotalAmount, isDarkMode && styles.orderTotalAmountDark]}>
                ${(total + (total > 0 ? SHIPPING_FLAT : 0)).toFixed(2)}
              </Text>
            </View>

            <Animated.View
              style={[
                styles.proceedButton,
                isDarkMode ? styles.proceedButtonDark : styles.proceedButtonLight,
                {
                  backgroundColor: proceedGlowAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: isDarkMode ? ['#555', '#888'] : ['#ffdd00', '#ffeb70'],
                  }),
                },
                isProcessing && { opacity: 0.7 },
              ]}
            >
              <TouchableOpacity
                style={{ flex: 1 }}
                onPress={handleProceedToPayment}
                disabled={isProcessing}
                activeOpacity={0.8}
              >
                <View style={styles.buttonContent}>
                  <Ionicons
                    name="lock-closed"
                    size={18}
                    color={isDarkMode ? 'white' : '#333'}
                    style={styles.lockIcon}
                  />
                  <Text style={[styles.proceedButtonText, isDarkMode ? styles.whiteText : styles.darkText]}>
                    {isProcessing ? t('Processing...') : t('Proceed to payment')}
                  </Text>
                  <Text style={[styles.arrow, isDarkMode ? styles.whiteText : styles.darkText]}>{'>>>'}</Text>
                </View>
              </TouchableOpacity>
            </Animated.View>
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: 'white' },
  safeAreaDark: { backgroundColor: '#121212' },
  container: { flex: 1, backgroundColor: 'white', position: 'relative' },
  containerDark: { backgroundColor: '#121212' },
  contentContainer: { paddingHorizontal: 20, paddingBottom: 140 },
  header: { flexDirection: 'row', alignItems: 'center', marginBottom: 30, paddingHorizontal: 20, paddingTop: 20 },
  headerDark: { backgroundColor: '#121212' },
  backButton: { padding: 10, width: 44, height: 44 },
  title: { fontSize: 24, fontWeight: 'bold', flex: 1, textAlign: 'center', color: 'black' },
  titleDark: { color: 'white' },
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
    justifyContent: 'space-between',
  },
  cartItemContainerDark: { backgroundColor: '#282828', elevation: 0, shadowOpacity: 0 },
  cartItemImage: { width: 80, height: 80, marginRight: 16, resizeMode: 'contain' },
  imagePlaceholder: { alignItems: 'center', justifyContent: 'center', backgroundColor: '#eee', borderRadius: 8 },
  cartItemDetails: { flex: 1 },
  cartItemName: { fontSize: 16, fontWeight: 'bold', marginBottom: 4 },
  cartItemNameDark: { color: 'white' },
  cartItemDescription: { fontSize: 14, color: '#666', marginBottom: 8 },
  cartItemDescriptionDark: { color: '#A9A9A9' },
  priceContainer: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  originalPrice: { fontSize: 14, color: '#999', textDecorationLine: 'line-through', marginRight: 8 },
  originalPriceDark: { color: '#707070' },
  cartItemPrice: { fontSize: 16, fontWeight: 'bold' },
  cartItemPriceDark: { color: 'white' },
  quantityText: { fontSize: 16, fontWeight: 'bold', marginHorizontal: 8, color: 'black', minWidth: 20, textAlign: 'center', marginLeft: 1 },
  quantityTextDark: { color: 'white' },
  section: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 0 },
  sectionLabel: { fontSize: 18, fontWeight: '500', color: 'black', marginBottom: 6 },
  sectionLabelDark: { color: 'white' },
  editButton: { paddingVertical: 8, paddingHorizontal: 15, borderRadius: 20 },
  editButtonText: { fontWeight: 'bold' },
  separatorContainer: { marginVertical: 20, alignItems: 'center', width: '100%' },
  separatorLine: { height: 1, backgroundColor: 'rgba(0, 0, 0, 0.1)', width: '100%' },
  separatorLineDark: { height: 1, backgroundColor: 'rgba(255, 255, 255, 0.2)', width: '100%' },
  scrollContainer: { flex: 1 },
  scrollContainerDark: { backgroundColor: '#121212' },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    width: '100%',
    backgroundColor: 'white',
    borderTopWidth: 1,
    borderTopColor: '#ddd',
  },
  footerDark: { backgroundColor: '#1E1E1E', borderTopColor: '#333' },
  bottomBar: { paddingHorizontal: 20, paddingVertical: 10, width: '100%' },
  orderTotalContainer: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 },
  orderTotalLabel: { fontSize: 16, fontWeight: 'bold', color: 'black' },
  orderTotalLabelDark: { color: 'white' },
  orderTotalAmount: { fontSize: 24, fontWeight: 'bold', color: 'black' },
  orderTotalAmountDark: { color: 'white' },
  proceedButton: { paddingVertical: 13, borderRadius: 25, alignItems: 'center', marginTop: 12, width: '100%' },
  proceedButtonLight: {
    backgroundColor: '#ffdd00', elevation: 10, shadowColor: '#ffdd00',
    shadowOffset: { width: 0, height: 0 }, shadowOpacity: 1, shadowRadius: 10,
  },
  proceedButtonDark: {
    backgroundColor: '#555', elevation: 10, shadowColor: '#FFFFFF',
    shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.8, shadowRadius: 10,
  },
  buttonContent: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center' },
  proceedButtonText: { fontSize: 18, fontWeight: 'bold', marginHorizontal: 8 },
  arrow: { fontSize: 18, fontWeight: 'bold' },
  lockIcon: { marginRight: 5 },
  emptyCartText: { fontSize: 18, color: '#666', textAlign: 'center', marginTop: 20, marginBottom: 30 },
  emptyCartTextDark: { color: '#A9A9A9' },
  editButtonLight: {
    backgroundColor: '#ffdd00', elevation: 10, shadowColor: '#ffdd00',
    shadowOffset: { width: 0, height: 0 }, shadowOpacity: 1, shadowRadius: 10,
  },
  darkButton: {
    backgroundColor: '#555', elevation: 10, shadowColor: '#FFFFFF',
    shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.8, shadowRadius: 10,
  },
  darkText: { color: '#333' },
  whiteText: { color: 'white' },
  addressDisplay: { marginBottom: 10 },
  addressText: { fontSize: 14, color: '#333', marginBottom: 2 },
  addressTextDark: { color: 'white' },
  paymentMethodDisplay: { marginRight: 10 },
  paymentMethodInfo: { flexDirection: 'row', alignItems: 'center' },
  paymentMethodIcon: { width: 40, height: 25, marginRight: 10 },
  paymentMethodText: { fontSize: 14, color: '#333', marginBottom: 2 },
  paymentMethodTextDark: { color: 'white' },
  paymentMethodPlaceholder: { marginRight: 10 },
  paymentMethodPlaceholderText: { fontSize: 14, color: '#999', fontStyle: 'italic' },
  paymentMethodPlaceholderTextDark: { color: '#707070' },
});

export default CheckoutScreen;