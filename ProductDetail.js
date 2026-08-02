// ProductDetail.js
import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  ScrollView,
  TouchableOpacity,
  LayoutAnimation,
  Dimensions,
  Alert,
  I18nManager,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTranslation } from 'react-i18next';
import { useDarkMode } from './DarkModeContext';
import { allProducts } from './ProductData';

/* ============ أيقونات مرسومة بـ View ============ */

/* ✅ سهم رجوع — transform فقط، مايتعكسش تلقائيًا في RTL
   flip=false => بيبص شمال ← (الإنجليزي)
   flip=true  => بيبص يمين → (العربي) */
const BackArrow = ({ size = 26, color = '#000', thickness, flip = false }) => {
  const t = thickness || Math.max(3, size * 0.13);
  const shaft = size * 0.72;
  const arm = size * 0.34;
  const tipX = -shaft / 2;                 // طرف السهم
  const armDX = tipX + arm * 0.5 * 0.707;  // مركز الذراع على الخط المايل
  const armDY = arm * 0.5 * 0.707;

  return (
    <View
      style={{
        width: size,
        height: size,
        alignItems: 'center',
        justifyContent: 'center',
        transform: flip ? [{ rotate: '180deg' }] : [],
      }}
      pointerEvents="none"
    >
      {/* الجسم */}
      <View
        style={{
          position: 'absolute',
          width: shaft,
          height: t,
          borderRadius: t / 2,
          backgroundColor: color,
        }}
      />
      {/* الذراع العلوية */}
      <View
        style={{
          position: 'absolute',
          width: arm,
          height: t,
          borderRadius: t / 2,
          backgroundColor: color,
          transform: [{ translateX: armDX }, { translateY: -armDY }, { rotate: '-45deg' }],
        }}
      />
      {/* الذراع السفلية */}
      <View
        style={{
          position: 'absolute',
          width: arm,
          height: t,
          borderRadius: t / 2,
          backgroundColor: color,
          transform: [{ translateX: armDX }, { translateY: armDY }, { rotate: '45deg' }],
        }}
      />
    </View>
  );
};

// شكل القلب المصمت (دائرتين + مربع مايل)
const HeartShape = ({ size, color }) => {
  const a = size * 0.58;
  const off = size * 0.005;
  const piece = { position: 'absolute', width: a, height: a, backgroundColor: color };
  return (
    <View style={{ width: size, height: size }}>
      <View style={[piece, { borderRadius: a / 2, left: off, top: off }]} />
      <View style={[piece, { borderRadius: a / 2, left: size * 0.415, top: off }]} />
      <View style={[piece, { left: size * 0.21, top: size * 0.21, transform: [{ rotate: '45deg' }] }]} />
    </View>
  );
};

// القلب: مفرّغ لو مش مفضلة، أصفر مصمت لو مفضلة
const Heart = ({ size = 22, filled = false, stroke = '#000', bg = '#fff' }) => (
  <View style={{ width: size, height: size }}>
    <HeartShape size={size} color={filled ? '#F8D247' : stroke} />
    {!filled && (
      <View style={{ position: 'absolute', left: 0, top: 0, transform: [{ scale: 0.62 }] }}>
        <HeartShape size={size} color={bg} />
      </View>
    )}
  </View>
);

// + و −
const PlusIcon = ({ size = 20, color = '#fff' }) => {
  const t = Math.max(2.5, size * 0.14);
  return (
    <View style={{ width: size, height: size, justifyContent: 'center', alignItems: 'center' }}>
      <View style={{ position: 'absolute', width: size * 0.75, height: t, backgroundColor: color, borderRadius: t / 2 }} />
      <View style={{ position: 'absolute', width: t, height: size * 0.75, backgroundColor: color, borderRadius: t / 2 }} />
    </View>
  );
};

const MinusIcon = ({ size = 20, color = '#fff' }) => {
  const t = Math.max(2.5, size * 0.14);
  return (
    <View style={{ width: size, height: size, justifyContent: 'center', alignItems: 'center' }}>
      <View style={{ width: size * 0.75, height: t, backgroundColor: color, borderRadius: t / 2 }} />
    </View>
  );
};

/* ============================ الشاشة ============================ */
function ProductDetail() {
  const navigation = useNavigation();
  const route = useRoute();
  const { product: passedProduct, productId } = route.params || {};
  const { isDarkMode } = useDarkMode();
  const { t, i18n } = useTranslation();
  const isRTL = i18n.language === 'ar' || I18nManager.isRTL;

  const lookupId = productId || passedProduct?.id;
  const product = allProducts.find((p) => String(p.id) === String(lookupId)) || passedProduct;

  const [quantity, setQuantity] = useState(1);
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [descriptionExpanded, setDescriptionExpanded] = useState(false);
  const [shouldReadMore, setShouldReadMore] = useState(false);
  const [isFavorite, setIsFavorite] = useState(false);
  const [isAdding, setIsAdding] = useState(false);

  const scrollViewRef = useRef(null);
  const carouselScrollViewRef = useRef(null);
  const screenWidth = Dimensions.get('window').width;

  const storageOptions = product?.storageOptions || [];
  const storagePricing = product?.storagePricing || {};
  const initialStorage = storageOptions.length > 0 ? storageOptions[0] : null;
  const [selectedStorage, setSelectedStorage] = useState(initialStorage);
  const [displayedPrice, setDisplayedPrice] = useState(
    initialStorage ? Number(storagePricing[initialStorage]) || 0 : Number(product?.price) || 0
  );

  useEffect(() => {
    if (selectedStorage) setDisplayedPrice(Number(storagePricing[selectedStorage]) || 0);
  }, [selectedStorage]);

  useEffect(() => {
    if (!product) return;
    (async () => {
      try {
        const favorites = await AsyncStorage.getItem('favoriteProducts');
        const list = favorites ? JSON.parse(favorites) : [];
        setIsFavorite(list.some((fav) => String(fav.id) === String(product.id)));
      } catch (e) {
        console.error('Error loading favorite status:', e);
      }
    })();
  }, [product?.id]);

  if (!product) {
    return (
      <SafeAreaView style={[styles.safeArea, isDarkMode && styles.darkSafeArea]}>
        <View style={[styles.container, isDarkMode && styles.darkContainer, styles.center]}>
          <Text style={[styles.headerTitle, isDarkMode && styles.darkText]}>
            {t('Product Not Found')}
          </Text>
          <TouchableOpacity onPress={() => navigation.goBack()} style={{ marginTop: 20 }}>
            <Text style={[styles.readMore, isDarkMode && styles.darkReadMore]}>{t('Go Back')}</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const { name, category, description, brand, id } = product;

  const isValidSource = (img) => {
    if (img === 0) return true;
    if (!img) return false;
    if (typeof img === 'number') return true;
    if (typeof img === 'string') return img.length > 0;
    if (img.uri) return !img.uri.includes('via.placeholder.com');
    return false;
  };

  const normalize = (img) => (typeof img === 'string' ? { uri: img } : img);

  const rawImages = Array.isArray(product.images) ? product.images.filter(isValidSource) : [];
  const displayImages =
    rawImages.length > 0 ? rawImages : isValidSource(product.image) ? [product.image] : [];

  const toggleDescription = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setDescriptionExpanded((v) => !v);
  };

  const handleScroll = (event) => {
    const index = Math.round(event.nativeEvent.contentOffset.x / screenWidth);
    if (index !== activeImageIndex) setActiveImageIndex(index);
  };

  const scrollToImage = (index) => {
    setActiveImageIndex(index);
    carouselScrollViewRef.current?.scrollTo({ x: index * screenWidth, y: 0, animated: true });
  };

  const toggleFavorite = async () => {
    const next = !isFavorite;
    setIsFavorite(next);
    try {
      const existing = await AsyncStorage.getItem('favoriteProducts');
      let list = existing ? JSON.parse(existing) : [];
      list = list.filter((fav) => String(fav.id) !== String(id));
      if (next) {
        list.push({
          id,
          name,
          brand,
          price: `$${Number(displayedPrice).toFixed(2)}`,
          selectedStorage,
          image: product.image ?? null,
          isFavorite: true,
        });
        Alert.alert(t('Added'), `${name} ${t('added to favorites')}.`);
      } else {
        Alert.alert(t('Removed'), `${name} ${t('removed from favorites')}.`);
      }
      await AsyncStorage.setItem('favoriteProducts', JSON.stringify(list));
    } catch (e) {
      console.error('Error updating favorites:', e);
      Alert.alert(t('Error'), t('There was a problem updating your favorites.'));
      setIsFavorite(!next);
    }
  };

  const handleAddToCart = async () => {
    if (isAdding) return;
    if (storageOptions.length > 0 && !selectedStorage) {
      Alert.alert(t('Select Storage'), t('Please select a storage option.'));
      return;
    }

    const qty = Math.max(1, Number(quantity) || 1);
    const price = Number(displayedPrice) || 0;
    const storage = selectedStorage ?? null;

    const newItem = {
      id,
      name,
      description: description ?? '',
      price,
      discount: Number(product.discount) || 0,
      storage,
      quantity: qty,
      image: product.image ?? (displayImages.length > 0 ? displayImages[0] : null),
    };

    setIsAdding(true);
    try {
      const saved = await AsyncStorage.getItem('cart');
      const list = saved ? JSON.parse(saved) : [];
      const index = list.findIndex(
        (it) => String(it.id) === String(newItem.id) && (it.storage ?? null) === storage
      );
      if (index > -1) {
        list[index] = {
          ...list[index],
          ...newItem,
          quantity: (Number(list[index].quantity) || 0) + qty,
        };
      } else {
        list.push(newItem);
      }
      await AsyncStorage.setItem('cart', JSON.stringify(list));
      navigation.navigate('Cart');
    } catch (e) {
      console.error('Error adding to cart:', e);
      Alert.alert(t('Error'), t('There was a problem adding this item to your cart.'));
    } finally {
      setIsAdding(false);
    }
  };

  const iconColor = isDarkMode ? '#FFFFFF' : '#000000';
  const heartBg = isDarkMode ? '#292929' : '#FFFFFF';

  return (
    <SafeAreaView style={[styles.safeArea, isDarkMode && styles.darkSafeArea]}>
      <ScrollView
        style={[styles.container, isDarkMode && styles.darkContainer]}
        ref={scrollViewRef}
        contentContainerStyle={[styles.contentContainer, isDarkMode && styles.darkContentContainer]}
      >
        <View style={[styles.header, isDarkMode && styles.darkHeader]}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          >
            {/* ✅ العربي: يمين → | الإنجليزي: شمال ← */}
            <BackArrow size={26} color={iconColor} flip={isRTL} />
          </TouchableOpacity>

          <Text style={[styles.headerTitle, isDarkMode && styles.darkText]}>
            {t('Product Details')}
          </Text>

          <View style={styles.menuButton} />
        </View>

        <View style={[styles.imageCarouselContainer, isDarkMode && styles.darkImageCarouselContainer]}>
          {displayImages.length > 0 ? (
            <ScrollView
              horizontal
              pagingEnabled
              showsHorizontalScrollIndicator={false}
              onScroll={handleScroll}
              scrollEventThrottle={16}
              ref={carouselScrollViewRef}
            >
              {displayImages.map((image, index) => (
                <Image
                  key={index}
                  source={normalize(image)}
                  style={[styles.productImage, { width: screenWidth }]}
                  resizeMode="contain"
                />
              ))}
            </ScrollView>
          ) : (
            <View style={[styles.productImage, { width: screenWidth }, styles.center]}>
              <Text style={{ color: '#888' }}>{t('No Image')}</Text>
            </View>
          )}

          {displayImages.length > 1 && (
            <View style={[styles.imageIndicatorContainer, isDarkMode && styles.darkImageIndicatorContainer]}>
              {displayImages.map((_, index) => (
                <TouchableOpacity
                  key={index}
                  onPress={() => scrollToImage(index)}
                  style={[
                    styles.indicatorDot,
                    activeImageIndex === index && styles.activeIndicatorDot,
                    isDarkMode && styles.darkIndicatorDot,
                    activeImageIndex === index && isDarkMode && styles.darkActiveIndicatorDot,
                  ]}
                />
              ))}
            </View>
          )}
        </View>

        <View style={[styles.productInfo, isDarkMode && styles.darkProductInfo]}>
          <View style={[styles.nameAndFavorite, isRTL && { flexDirection: 'row-reverse' }]}>
            <Text style={[styles.productName, isDarkMode && styles.darkText]}>{name}</Text>
            <TouchableOpacity
              onPress={toggleFavorite}
              style={styles.favoriteButton}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              activeOpacity={0.7}
            >
              <View
                style={[
                  styles.favoriteIconContainer,
                  isDarkMode && styles.darkFavoriteIconContainer,
                  isFavorite && styles.favoriteIconContainerActive,
                ]}
              >
                {/* ✅ مفرّغ لو مش مفضلة — أصفر مصمت لما تدوس */}
                <Heart size={20} filled={isFavorite} stroke={iconColor} bg={heartBg} />
              </View>
            </TouchableOpacity>
          </View>

          <Text style={[styles.productCategory, isDarkMode && styles.darkTextSecondary]}>
            {category}
          </Text>

          <View style={[styles.priceContainer, isRTL && { flexDirection: 'row-reverse' }]}>
            <Text style={[styles.currentPrice, isDarkMode && styles.darkText]}>
              ${Number(displayedPrice).toFixed(2)}
            </Text>
          </View>

          {storageOptions.length > 0 && (
            <View style={[styles.storageSelector, isRTL && { flexDirection: 'row-reverse' }]}>
              {storageOptions.map((storage, index) => (
                <TouchableOpacity
                  key={index}
                  style={[
                    styles.storageButton,
                    selectedStorage === storage && styles.selectedStorageButton,
                    isDarkMode && styles.darkStorageButton,
                    selectedStorage === storage && isDarkMode && styles.darkSelectedStorageButton,
                  ]}
                  onPress={() => setSelectedStorage(storage)}
                >
                  <Text style={[styles.storageButtonText, isDarkMode && styles.darkStorageButtonText]}>
                    {storage}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          )}

          <Text
            style={[styles.description, isDarkMode && styles.darkText, isRTL && { textAlign: 'right' }]}
            numberOfLines={descriptionExpanded ? undefined : 3}
            onTextLayout={(e) => {
              if (!descriptionExpanded && e.nativeEvent.lines.length >= 3) setShouldReadMore(true);
            }}
          >
            {description}
          </Text>

          {shouldReadMore && (
            <TouchableOpacity onPress={toggleDescription}>
              <Text style={[styles.readMore, isDarkMode && styles.darkReadMore, isRTL && { textAlign: 'right' }]}>
                {descriptionExpanded ? t('Read less') : t('Read more')}
              </Text>
            </TouchableOpacity>
          )}

          <View style={{ height: 100 }} />
        </View>
      </ScrollView>

      <View style={[styles.bottomBar, isDarkMode && styles.darkBottomBar, isRTL && { flexDirection: 'row-reverse' }]}>
        <View style={[styles.quantityContainer, isDarkMode && styles.darkQuantityContainer]}>
          <TouchableOpacity
            style={[styles.quantityButton, isDarkMode && styles.darkQuantityButton]}
            onPress={() => setQuantity((q) => Math.max(1, q - 1))}
          >
            <MinusIcon size={20} color="#fff" />
          </TouchableOpacity>
          <Text style={[styles.quantityText, isDarkMode && styles.darkQuantityText]}>{quantity}</Text>
          <TouchableOpacity
            style={[styles.quantityButton, isDarkMode && styles.darkQuantityButton]}
            onPress={() => setQuantity((q) => q + 1)}
          >
            <PlusIcon size={20} color="#fff" />
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          style={[
            styles.addToCartButtonLarge,
            isDarkMode && styles.darkAddToCartButtonLarge,
            isAdding && { opacity: 0.6 },
            isRTL ? { marginRight: 16, marginLeft: 0 } : null,
          ]}
          onPress={handleAddToCart}
          disabled={isAdding}
          activeOpacity={0.8}
        >
          <Text style={[styles.addToCartButtonTextLarge, isDarkMode && styles.darkAddToCartButtonTextLarge]}>
            {t('Add to cart')}
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: 'white' },
  container: { flex: 1, backgroundColor: 'white' },
  center: { justifyContent: 'center', alignItems: 'center' },
  contentContainer: { paddingBottom: 80, backgroundColor: 'white' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, backgroundColor: '#e0e0e0' },
  backButton: { padding: 8 },
  headerTitle: { fontSize: 18, fontWeight: 'bold', color: 'black' },
  menuButton: { padding: 8, width: 48 },
  imageCarouselContainer: { backgroundColor: '#e0e0e0' },
  productImage: { height: 350, width: '100%' },
  imageIndicatorContainer: { flexDirection: 'row', justifyContent: 'center', marginTop: 8, marginBottom: 8, backgroundColor: '#e0e0e0' },
  indicatorDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#d3d3d3', marginHorizontal: 4 },
  activeIndicatorDot: { backgroundColor: '#808080' },
  productInfo: { padding: 16, backgroundColor: 'white' },
  nameAndFavorite: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  productName: { fontSize: 24, fontWeight: 'bold', color: 'black' },
  favoriteButton: { padding: 8 },
  favoriteIconContainer: {
    width: 36, height: 36, borderRadius: 18, backgroundColor: '#ffffff',
    borderColor: 'black', borderWidth: 1, justifyContent: 'center', alignItems: 'center',
  },
  favoriteIconContainerActive: { borderColor: '#F8D247' },
  productCategory: { fontSize: 16, color: '#757575', marginBottom: 8 },
  priceContainer: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
  currentPrice: { fontSize: 20, fontWeight: 'bold', marginRight: 8, color: 'black' },
  storageSelector: { flexDirection: 'row', marginBottom: 16, flexWrap: 'wrap' },
  storageButton: {
    paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, backgroundColor: 'white',
    marginRight: 8, marginBottom: 8, borderWidth: 1, borderColor: 'gray',
  },
  selectedStorageButton: { borderColor: '#ffd700', borderWidth: 2 },
  storageButtonText: { fontSize: 16, color: 'black' },
  description: { fontSize: 16, color: '#424242', marginBottom: 8, lineHeight: 24 },
  readMore: { color: 'blue' },
  bottomBar: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16,
    backgroundColor: 'white', borderTopWidth: 1, borderTopColor: '#ddd',
    position: 'absolute', bottom: 0, left: 0, right: 0,
  },
  quantityContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#e0e0e0', borderRadius: 25, paddingHorizontal: 12, paddingVertical: 4 },
  quantityButton: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#424242', justifyContent: 'center', alignItems: 'center' },
  quantityText: { fontSize: 18, marginHorizontal: 12, fontWeight: 'bold', color: 'black' },
  addToCartButtonLarge: {
    backgroundColor: '#ffdd00', paddingVertical: 16, paddingHorizontal: 32, borderRadius: 25, flex: 1, marginLeft: 16,
    elevation: 10, shadowColor: '#ffdd00', shadowOffset: { width: 0, height: 0 }, shadowOpacity: 1, shadowRadius: 10,
  },
  addToCartButtonTextLarge: { color: 'black', fontSize: 18, fontWeight: 'bold', textAlign: 'center' },

  darkSafeArea: { backgroundColor: '#121212' },
  darkContainer: { backgroundColor: '#121212' },
  darkContentContainer: { paddingBottom: 80, backgroundColor: '#121212' },
  darkHeader: { backgroundColor: '#1E1E1E' },
  darkText: { color: 'white' },
  darkTextSecondary: { color: '#BBBBBB' },
  darkImageCarouselContainer: { backgroundColor: '#1E1E1E' },
  darkImageIndicatorContainer: { backgroundColor: '#1E1E1E' },
  darkIndicatorDot: { backgroundColor: '#444444' },
  darkActiveIndicatorDot: { backgroundColor: '#888888' },
  darkProductInfo: { backgroundColor: '#1E1E1E' },
  darkFavoriteIconContainer: { backgroundColor: '#292929', borderColor: '#DDDDDD' },
  darkStorageButton: { backgroundColor: '#292929', borderColor: '#444444' },
  darkSelectedStorageButton: { borderColor: '#ffd700' },
  darkStorageButtonText: { color: 'white' },
  darkReadMore: { color: '#90caf9' },
  darkBottomBar: { backgroundColor: '#1E1E1E', borderTopColor: '#333333' },
  darkQuantityContainer: { backgroundColor: '#292929' },
  darkQuantityButton: { backgroundColor: '#555555' },
  darkQuantityText: { color: 'white' },
  darkAddToCartButtonLarge: {
    backgroundColor: '#555', elevation: 10, shadowColor: '#FFFFFF',
    shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.8, shadowRadius: 10,
  },
  darkAddToCartButtonTextLarge: { color: 'white' },
});

export default ProductDetail;