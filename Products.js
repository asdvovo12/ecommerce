import React, { useState, useRef, useEffect } from 'react';
import {
  View, Text, ScrollView, Image, TouchableOpacity, StyleSheet,
  Dimensions, Modal, Animated, TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { FontAwesome } from '@expo/vector-icons';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTranslation } from 'react-i18next';
import { allProducts } from './ProductData';
import i18n from './i18n';

const CARD_WIDTH = 170;
const CARD_MARGIN = 10;

/* ============ جرس مرسوم بـ Views (مايعتمدش على أي فونت) ============ */
const BellIcon = ({ size = 24, color = '#000' }) => {
  const bodyW = size * 0.72;
  const bodyH = size * 0.6;
  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      {/* المقبض الصغير فوق */}
      <View
        style={{
          width: size * 0.14,
          height: size * 0.14,
          borderRadius: size * 0.07,
          backgroundColor: color,
          marginBottom: -size * 0.03,
        }}
      />
      {/* جسم الجرس */}
      <View
        style={{
          width: bodyW,
          height: bodyH,
          borderWidth: size * 0.09,
          borderColor: color,
          borderTopLeftRadius: bodyW / 2,
          borderTopRightRadius: bodyW / 2,
          borderBottomWidth: 0,
        }}
      />
      {/* القاعدة */}
      <View
        style={{
          width: size * 0.9,
          height: size * 0.09,
          backgroundColor: color,
          borderRadius: size * 0.05,
        }}
      />
      {/* اللسان */}
      <View
        style={{
          width: size * 0.2,
          height: size * 0.1,
          backgroundColor: color,
          borderBottomLeftRadius: size * 0.1,
          borderBottomRightRadius: size * 0.1,
          marginTop: size * 0.02,
        }}
      />
    </View>
  );
};

/* ============ عدسة بحث مرسومة بـ Views ============ */
const SearchIcon = ({ size = 24, color = '#000' }) => (
  <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
    <View
      style={{
        width: size * 0.62,
        height: size * 0.62,
        borderRadius: size * 0.31,
        borderWidth: size * 0.09,
        borderColor: color,
        marginTop: -size * 0.08,
        marginLeft: -size * 0.08,
      }}
    />
    <View
      style={{
        position: 'absolute',
        width: size * 0.09,
        height: size * 0.3,
        backgroundColor: color,
        borderRadius: size * 0.05,
        bottom: size * 0.05,
        right: size * 0.14,
        transform: [{ rotate: '-45deg' }],
      }}
    />
  </View>
);

const ProductsScreen = () => {
  const navigation = useNavigation();
  const { t } = useTranslation();
  const [showPopularProducts, setShowPopularProducts] = useState(true);
  const [showNewArrivals, setShowNewArrivals] = useState(true);
  const [showSpecialOffers, setShowSpecialOffers] = useState(true);
  const [isOfficialStoreActive, setIsOfficialStoreActive] = useState(false);
  const [showFilterModal, setShowFilterModal] = useState(false);
  const slideAnim = useRef(new Animated.Value(0)).current;
  const [activeModalFilter, setActiveModalFilter] = useState('All');
  const [activeInlineFilter, setActiveInlineFilter] = useState('All');
  const specialOffersRef = useRef(null);
  const popularProductsRef = useRef(null);
  const newArrivalsRef = useRef(null);
  const scrollViewRef = useRef(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchVisible, setIsSearchVisible] = useState(false);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [currentProducts, setCurrentProducts] = useState([]);
  const [newArrivals, setNewArrivals] = useState([]);
  const [officialStoreProducts, setOfficialStoreProducts] = useState([]);
  const [popularProducts, setPopularProducts] = useState([]);
  const [specialOfferProducts, setSpecialOfferProducts] = useState([]);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [notificationsCount, setNotificationsCount] = useState(0);

  const loadPreferences = async () => {
    try {
      const savedDarkMode = await AsyncStorage.getItem('darkMode');
      if (savedDarkMode !== null) setIsDarkMode(savedDarkMode === 'true');
    } catch (error) {
      console.error('Error loading preferences:', error);
    }
  };

  const loadInitialData = async () => {
    const loadFavorites = async () => {
      try {
        const favorites = await AsyncStorage.getItem('favoriteProducts');
        return favorites !== null ? JSON.parse(favorites) : [];
      } catch (error) {
        console.error('Error loading favorites:', error);
        return [];
      }
    };

    const favoriteProducts = await loadFavorites();

    const updateFavoritesAndPrice = (products) =>
      products.map((p) => {
        let price = t('Price N/A');
        const productDetail = allProducts.find((product) => product.id === p.id);
        if (productDetail && productDetail.storagePricing) {
          const storageOptions = Object.keys(productDetail.storagePricing);
          const favoriteProduct = favoriteProducts.find((fav) => fav.id === p.id);
          const selectedStorage = favoriteProduct ? favoriteProduct.selectedStorage : null;
          if (selectedStorage) {
            price = `$${productDetail.storagePricing[selectedStorage].toFixed(2)}`;
          } else if (storageOptions.length > 0) {
            let lowestPrice = null;
            for (const storage in productDetail.storagePricing) {
              if (lowestPrice === null || productDetail.storagePricing[storage] < lowestPrice) {
                lowestPrice = productDetail.storagePricing[storage];
              }
            }
            price = `$${lowestPrice.toFixed(2)}`;
          }
        }
        return {
          ...p,
          price,
          selectedStorage: favoriteProducts.find((fav) => fav.id === p.id)?.selectedStorage,
          isFavorite: favoriteProducts.some((fav) => fav.id === p.id),
        };
      });

    const updatedPopularProducts = updateFavoritesAndPrice(allProducts.filter((p) => p.productType === 'Popular Products'));
    const updatedNewArrivals = updateFavoritesAndPrice(allProducts.filter((p) => p.productType === 'New Arrivals'));
    const updatedOfficialStoreProducts = updateFavoritesAndPrice(allProducts.filter((p) => p.productType === 'Official Store'));
    const updatedSpecialOfferProducts = updateFavoritesAndPrice(allProducts.filter((p) => p.productType === 'Special Offer'));
    const updatedAllProducts = updateFavoritesAndPrice(allProducts);

    setNewArrivals(updatedNewArrivals);
    setOfficialStoreProducts(updatedOfficialStoreProducts);
    setPopularProducts(updatedPopularProducts);
    setSpecialOfferProducts(updatedSpecialOfferProducts);
    setCurrentProducts(updatedAllProducts);

    try {
      const readIds = JSON.parse((await AsyncStorage.getItem('readNotifications')) || '[]');
      const unread = updatedNewArrivals.filter((p) => !readIds.includes(p.id));
      setNotificationsCount(unread.length);
    } catch (e) {
      setNotificationsCount(updatedNewArrivals.length);
    }
  };

  useEffect(() => {
    const loadFilterState = async () => {
      try {
        const savedFilter = await AsyncStorage.getItem('activeModalFilter');
        if (savedFilter !== null) {
          setActiveModalFilter(savedFilter);
          if (!searchQuery) applyFilters(savedFilter);
        }
      } catch (error) {
        console.error('Error loading filter state:', error);
      }
    };
    loadFilterState();
  }, []);

  useFocusEffect(
    React.useCallback(() => {
      loadPreferences();
      loadInitialData();
      const loadFilter = async () => {
        try {
          const savedFilter = await AsyncStorage.getItem('activeModalFilter');
          if (savedFilter) {
            if (!searchQuery) applyFilters(savedFilter);
          } else if (!searchQuery) {
            applyFilters('All');
          }
        } catch (error) {
          console.error('Error loading initial filter state:', error);
        }
      };
      loadFilter();
      return () => {};
    }, [searchQuery])
  );

  useEffect(() => {
    const applySearch = () => {
      if (!currentProducts) return;
      const filtered = currentProducts.filter((product) =>
        product.name.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setFilteredProducts(filtered);
      setShowPopularProducts(false);
      setShowNewArrivals(false);
      setShowSpecialOffers(false);
      if (searchQuery.trim() === '') applyFilters(activeInlineFilter);
    };
    applySearch();
  }, [searchQuery, currentProducts, activeInlineFilter, t]);

  const openFilterModal = () => {
    setShowFilterModal(true);
    Animated.timing(slideAnim, { toValue: 1, duration: 300, useNativeDriver: true }).start();
  };

  const closeFilterModal = () => {
    Animated.timing(slideAnim, { toValue: 0, duration: 300, useNativeDriver: true }).start(() =>
      setShowFilterModal(false)
    );
  };

  const handleSearchIconPress = () => {
    const newSearchVisibility = !isSearchVisible;
    setIsSearchVisible(newSearchVisibility);
    if (!newSearchVisibility) {
      setSearchQuery('');
      if (activeInlineFilter === 'Official Store') {
        setShowPopularProducts(true);
        setShowNewArrivals(false);
        setShowSpecialOffers(false);
        setIsOfficialStoreActive(true);
        setCurrentProducts(officialStoreProducts);
        setFilteredProducts(officialStoreProducts);
      } else if (activeInlineFilter === 'Nearest') {
        setShowPopularProducts(false);
        setShowNewArrivals(false);
        setShowSpecialOffers(true);
        setIsOfficialStoreActive(false);
        setCurrentProducts(specialOfferProducts);
        setFilteredProducts(specialOfferProducts);
      } else {
        setShowPopularProducts(true);
        setShowNewArrivals(true);
        setShowSpecialOffers(true);
        setIsOfficialStoreActive(false);
        setCurrentProducts(allProducts);
        setFilteredProducts(allProducts);
      }
      scrollViewRef.current?.scrollTo({ y: 0, animated: true });
    }
  };

  const handleSearchInputChange = (text) => setSearchQuery(text);

  const applyFilters = async (filter) => {
    setActiveInlineFilter(filter);
    setActiveModalFilter(filter);
    try {
      await AsyncStorage.setItem('activeModalFilter', filter);
    } catch (error) {
      console.error('Error saving filter state:', error);
    }

    if (filter === 'Official Store') {
      setShowPopularProducts(true);
      setShowNewArrivals(false);
      setShowSpecialOffers(false);
      setIsOfficialStoreActive(true);
      setCurrentProducts(officialStoreProducts);
      setFilteredProducts(officialStoreProducts);
      closeFilterModal();
    } else if (filter === 'Nearest') {
      setShowPopularProducts(false);
      setShowNewArrivals(false);
      setShowSpecialOffers(true);
      setIsOfficialStoreActive(false);
      setCurrentProducts(specialOfferProducts);
      setFilteredProducts(specialOfferProducts);
      closeFilterModal();
    } else {
      setShowPopularProducts(true);
      setShowNewArrivals(true);
      setShowSpecialOffers(true);
      setIsOfficialStoreActive(false);
      setCurrentProducts(allProducts);
      setFilteredProducts(allProducts);
      closeFilterModal();
      scrollToSection('All');
    }
  };

  const handleFilterChange = (filter) => applyFilters(filter);

  const scrollToSection = (section) => {
    if (section === 'All') {
      scrollViewRef.current?.scrollTo({ y: 0, animated: true });
      return;
    }
    const ref = section === 'Official Store' ? popularProductsRef : specialOffersRef;
    ref?.current?.measure((x, y, width, height, pageX, pageY) => {
      scrollViewRef.current?.scrollTo({ y: pageY, animated: true });
    });
  };

  const toggleFavorite = async (event, productId) => {
    event.stopPropagation();
    const currentProduct = allProducts.find((p) => p.id === productId);
    if (!currentProduct) return;

    const updateProducts = (products) =>
      products.map((product) =>
        product.id === productId ? { ...product, isFavorite: !product.isFavorite } : product
      );

    const updatedAllProducts = updateProducts(allProducts);
    setOfficialStoreProducts(updateProducts(officialStoreProducts));
    setPopularProducts(updateProducts(popularProducts));
    setSpecialOfferProducts(updateProducts(specialOfferProducts));
    setNewArrivals(updateProducts(newArrivals));

    const updatedProduct = updatedAllProducts.find((p) => p.id === productId);
    if (!updatedProduct) return;

    let updatedCurrentProducts;
    if (activeInlineFilter === 'Official Store') updatedCurrentProducts = updateProducts(officialStoreProducts);
    else if (activeInlineFilter === 'Nearest') updatedCurrentProducts = updateProducts(specialOfferProducts);
    else updatedCurrentProducts = updatedAllProducts;

    setCurrentProducts(updatedCurrentProducts);

    if (searchQuery.trim() !== '') {
      setFilteredProducts(
        updatedCurrentProducts.filter((p) => p.name.toLowerCase().includes(searchQuery.toLowerCase()))
      );
    } else {
      setFilteredProducts(updatedCurrentProducts);
    }

    const currentFavorites = await AsyncStorage.getItem('favoriteProducts');
    const currentFavoritesArray = currentFavorites ? JSON.parse(currentFavorites) : [];
    let newFavorites = [];

    if (updatedProduct.isFavorite) {
      let priceToSave = updatedProduct.price;
      const productDetail = allProducts.find((product) => product.id === productId);
      if (productDetail && productDetail.storagePricing) {
        const storageOptions = Object.keys(productDetail.storagePricing);
        const favoriteProduct = currentFavoritesArray.find((fav) => fav.id === productId);
        const selectedStorage = favoriteProduct ? favoriteProduct.selectedStorage : null;
        if (selectedStorage) {
          priceToSave = `$${productDetail.storagePricing[selectedStorage].toFixed(2)}`;
        } else if (storageOptions.length > 0) {
          let lowestPrice = null;
          for (const storage in productDetail.storagePricing) {
            if (lowestPrice === null || productDetail.storagePricing[storage] < lowestPrice) {
              lowestPrice = productDetail.storagePricing[storage];
            }
          }
          priceToSave = `$${lowestPrice.toFixed(2)}`;
        }
      }
      newFavorites = [
        ...currentFavoritesArray,
        { ...updatedProduct, price: priceToSave, selectedStorage: updatedProduct.selectedStorage },
      ];
    } else {
      newFavorites = currentFavoritesArray.filter((p) => p.id !== productId);
    }

    try {
      await AsyncStorage.setItem('favoriteProducts', JSON.stringify(newFavorites));
    } catch (error) {
      console.error('Error saving favorites:', error);
    }
  };

  const handleNotificationsPress = async () => {
    try {
      await AsyncStorage.setItem('readNotifications', JSON.stringify(newArrivals.map((p) => p.id)));
    } catch (e) {
      console.error('Error saving read notifications:', e);
    }
    setNotificationsCount(0);
    navigation.navigate('Notifications', { newArrivals });
  };

  function renderSearchProductItem(product) {
    return (
      <TouchableOpacity
        key={product.id}
        onPress={() => navigation.navigate('ProductDetail', { product })}
        style={[styles.searchItemContainer, isDarkMode && styles.darkSearchItemContainer]}
      >
        <View style={[styles.productCardSmall, isDarkMode && styles.darkProductCardSmall]}>
          <Image source={product.image} style={styles.productImageSmall} resizeMode="contain" />
          <View style={styles.productTextContainer}>
            <Text style={[styles.productNameSmall, isDarkMode && styles.darkProductNameSmall]}>{product.name}</Text>
            <Text style={[styles.productBrand, isDarkMode && styles.darkProductBrand]}>{product.brand}</Text>
            <Text style={[styles.priceSmall, isDarkMode && styles.darkPriceSmall]}>{product.price}</Text>
          </View>
          <TouchableOpacity style={styles.favoriteIcon} onPress={(event) => toggleFavorite(event, product.id)}>
            <FontAwesome
              name={product.isFavorite ? 'heart' : 'heart-o'}
              size={24}
              color={product.isFavorite ? '#F8D247' : isDarkMode ? 'white' : 'black'}
            />
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    );
  }

  const renderContent = () => {
    if (searchQuery.trim() !== '') {
      return (
        <View style={[styles.section, isDarkMode && styles.darkSection]}>
          <View style={[styles.sectionHeader, isDarkMode && styles.darkSectionHeader]}>
            <Text style={[styles.sectionTitle, isDarkMode && styles.darkSectionTitle]}>{t('searchResults')}</Text>
          </View>
          <View style={[styles.searchResultsContainer, isDarkMode && styles.darkSearchResultsContainer]}>
            {filteredProducts.length > 0 ? (
              filteredProducts.map(renderSearchProductItem)
            ) : (
              <Text style={[styles.noProductsText, isDarkMode && styles.darkNoProductsText]}>{t('noProducts')}</Text>
            )}
          </View>
        </View>
      );
    }

    return (
      <>
        {showSpecialOffers && (
          <SpecialOffers
            products={specialOfferProducts}
            toggleFavorite={toggleFavorite}
            t={t}
            isDarkMode={isDarkMode}
            ref={specialOffersRef}
          />
        )}
        {showPopularProducts && (
          <ProductsSection
            title={t('popularProducts')}
            ref={popularProductsRef}
            products={activeInlineFilter === 'Official Store' ? officialStoreProducts : popularProducts}
            toggleFavorite={toggleFavorite}
            isOfficialStoreActive={isOfficialStoreActive}
            t={t}
            isDarkMode={isDarkMode}
          />
        )}
        {showNewArrivals && (
          <NewArrivals
            products={newArrivals}
            ref={newArrivalsRef}
            title={t('newArrivals')}
            toggleFavorite={toggleFavorite}
            t={t}
            isDarkMode={isDarkMode}
          />
        )}
      </>
    );
  };

  return (
    <SafeAreaView style={[styles.safeArea, isDarkMode && styles.darkSafeArea]} edges={['top']}>
      {isSearchVisible && (
        <>
          <View style={[styles.searchOverlay, isDarkMode && styles.darkSearchOverlay]} />
          <View style={[styles.searchInputContainer, isDarkMode && styles.darkSearchInputContainer]}>
            <TextInput
              style={[styles.searchInput, isDarkMode && styles.darkSearchInput]}
              placeholder={t('searchPlaceholder')}
              value={searchQuery}
              onChangeText={handleSearchInputChange}
              autoFocus
              placeholderTextColor="#999"
            />
            <TouchableOpacity onPress={handleSearchIconPress} style={styles.closeIcon}>
              <Text style={{ fontSize: 24, color: isDarkMode ? 'white' : 'black' }}>✕</Text>
            </TouchableOpacity>
          </View>
        </>
      )}

      {!isSearchVisible && (
        <Header
          handleSearchIconPress={handleSearchIconPress}
          t={t}
          isDarkMode={isDarkMode}
          notificationsCount={notificationsCount}
          handleNotificationsPress={handleNotificationsPress}
        />
      )}

      <ScrollView style={[styles.container, isDarkMode && styles.darkContainer]} ref={scrollViewRef}>
        <HorizontalFilters
          openFilterModal={openFilterModal}
          activeInlineFilter={activeInlineFilter}
          handleFilterChange={handleFilterChange}
          t={t}
          isDarkMode={isDarkMode}
        />
        {renderContent()}
      </ScrollView>

      <Modal visible={showFilterModal} transparent animationType="none" onRequestClose={closeFilterModal}>
        <TouchableOpacity
          style={[styles.modalOverlay, isDarkMode && styles.darkModalOverlay]}
          activeOpacity={1}
          onPress={closeFilterModal}
        >
          <Animated.View
            style={[
              styles.filterModal,
              isDarkMode && styles.darkFilterModal,
              {
                transform: [
                  {
                    translateX: slideAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [-Dimensions.get('window').width, 0],
                    }),
                  },
                ],
              },
            ]}
          >
            <FilterModalContent
              closeModal={closeFilterModal}
              activeModalFilter={activeModalFilter}
              handleFilterChange={handleFilterChange}
              t={t}
              isDarkMode={isDarkMode}
            />
          </Animated.View>
        </TouchableOpacity>
      </Modal>
    </SafeAreaView>
  );
};

/* ===================== Header ===================== */
const Header = ({ handleSearchIconPress, t, isDarkMode, notificationsCount, handleNotificationsPress }) => (
  <View style={[styles.header, isDarkMode && styles.darkHeader]}>
    <Text style={[styles.brandName, isDarkMode && styles.darkBrandName]}>{t('Store')}</Text>
    <View style={styles.headerIcons}>
      <TouchableOpacity onPress={handleSearchIconPress} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
        <SearchIcon size={24} color={isDarkMode ? 'white' : 'black'} />
      </TouchableOpacity>

      <TouchableOpacity
        onPress={handleNotificationsPress}
        activeOpacity={0.7}
        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        style={styles.bellTouchable}
      >
        <View style={styles.bellWrapper}>
          <BellIcon size={24} color={isDarkMode ? 'white' : 'black'} />
          {notificationsCount > 0 && (
            <View style={[styles.notificationBadge, isDarkMode && styles.darkNotificationBadge]}>
              <Text style={styles.notificationBadgeText} numberOfLines={1}>
                {notificationsCount > 99 ? '99+' : notificationsCount}
              </Text>
            </View>
          )}
        </View>
      </TouchableOpacity>
    </View>
  </View>
);

/* ===================== Filters ===================== */
const HorizontalFilters = ({ handleFilterChange, openFilterModal, activeInlineFilter, t, isDarkMode }) => {
  const filters = [
    { id: '1', label: t('filter'), value: 'filter' },
    { id: '2', label: t('all'), value: 'All' },
    { id: '3', label: t('officialStore'), value: 'Official Store' },
    { id: '4', label: t('nearest'), value: 'Nearest' },
  ];

  return (
    <View style={[styles.filtersContainer, isDarkMode && styles.darkFiltersContainer]}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        {filters.map((item) => (
          <TouchableOpacity
            key={item.id}
            style={[
              styles.filterButton,
              item.value !== 'filter' && activeInlineFilter === item.value && styles.activeFilter,
              { paddingHorizontal: item.label === t('all') ? 24 : 14 },
              isDarkMode && styles.darkFilterButton,
            ]}
            onPress={() => (item.value === 'filter' ? openFilterModal() : handleFilterChange(item.value))}
          >
            <Text
              style={[
                styles.filterText,
                item.value !== 'filter' && activeInlineFilter === item.value && styles.activeFilterText,
                { fontSize: 16 },
                isDarkMode && styles.darkFilterText,
              ]}
            >
              {item.label}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
};

/* ============ ✅ الصح مرسوم بـ Views — نفس الشكل بالظبط في العربي والإنجليزي ============ */
const CheckMark = ({ color = '#fff' }) => (
  <View style={styles.checkMarkWrapper} pointerEvents="none">
    {/* الذراع القصيرة */}
    <View
      style={[
        styles.checkArm,
        {
          height: 7,
          backgroundColor: color,
          transform: [{ translateX: -4 }, { translateY: 2 }, { rotate: '-45deg' }],
        },
      ]}
    />
    {/* الذراع الطويلة */}
    <View
      style={[
        styles.checkArm,
        {
          height: 13,
          backgroundColor: color,
          transform: [{ translateX: 2 }, { translateY: -1 }, { rotate: '45deg' }],
        },
      ]}
    />
  </View>
);

const YellowCheckbox = ({ isSelected, isDarkMode }) => (
  <View
    style={[
      styles.checkboxBase,
      isDarkMode && styles.checkboxBaseDark,
      isSelected && styles.checkboxYellow,
    ]}
  >
    {isSelected && <CheckMark color="#fff" />}
  </View>
);

const FilterModalContent = ({ activeModalFilter, handleFilterChange, t, isDarkMode }) => {
  const Option = ({ value, label }) => (
    <View style={[styles.modalOption, isDarkMode && styles.darkModalOption]}>
      <TouchableOpacity onPress={() => handleFilterChange(value)} style={styles.modalOptionTouchable}>
        <Text style={[styles.modalOptionText, isDarkMode && styles.darkModalOptionText]}>{label}</Text>
      </TouchableOpacity>
      <YellowCheckbox isSelected={activeModalFilter === value} isDarkMode={isDarkMode} />
    </View>
  );

  return (
    <View style={[styles.modalContent, isDarkMode && styles.darkModalContent]}>
      <Option value="All" label={t('all')} />
      <Option value="Official Store" label={t('officialStore')} />
      <Option value="Nearest" label={t('nearest')} />
    </View>
  );
};

/* ===================== Sections ===================== */
const SpecialOffers = React.forwardRef(({ products, toggleFavorite, t, isDarkMode }, ref) => {
  const navigation = useNavigation();
  if (products.length === 0) return null;
  return (
    <View style={[styles.section, isDarkMode && styles.darkSection]} ref={ref}>
      <View style={[styles.sectionHeader, isDarkMode && styles.darkSectionHeader]}>
        <Text style={[styles.sectionTitle, isDarkMode && styles.darkSectionTitle]}>{t('specialOffer')}</Text>
        <TouchableOpacity onPress={() => navigation.navigate('SpecialOffersScreen', { products })}>
          <Text style={[styles.viewMore, isDarkMode && styles.darkViewMore]}>{t('viewMore')}</Text>
        </TouchableOpacity>
      </View>
      <TouchableOpacity onPress={() => navigation.navigate('ProductDetail', { product: products[0] })}>
        <View style={[styles.productCard, isDarkMode && styles.darkProductCard]}>
          <Image source={products[0].image} style={styles.productImage} resizeMode="contain" />
          <View style={[styles.productInfo, isDarkMode && styles.darkProductInfo]}>
            <Text style={[styles.productName, isDarkMode && styles.darkProductName]}>{products[0].name}</Text>
            <Text style={[styles.productDescription, isDarkMode && styles.darkProductDescription]}>
              {products[0].description}
            </Text>
            <View style={styles.priceContainer}>
              <Text style={[styles.oldPrice, isDarkMode && styles.darkOldPrice]}>$1299.00</Text>
              <Text style={[styles.currentPrice, isDarkMode && styles.darkCurrentPrice]}>{products[0].price}</Text>
            </View>
          </View>
          <TouchableOpacity style={styles.favoriteIcon} onPress={(event) => toggleFavorite(event, products[0].id)}>
            <FontAwesome
              name={products[0].isFavorite ? 'heart' : 'heart-o'}
              size={24}
              color={products[0].isFavorite ? '#F8D247' : isDarkMode ? 'white' : 'black'}
            />
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    </View>
  );
});

const ProductsSection = React.forwardRef(
  ({ title, products, isOfficialStoreActive, toggleFavorite, t, isDarkMode }, ref) => {
    const navigation = useNavigation();
    const productScrollViewRef = useRef(null);
    const [currentOffset, setCurrentOffset] = useState(0);
    const handleScroll = (event) => setCurrentOffset(event.nativeEvent.contentOffset.x);

    return (
      <View style={[styles.section, isDarkMode && styles.darkSection]} ref={ref}>
        <View style={[styles.sectionHeader, isDarkMode && styles.darkSectionHeader]}>
          <Text style={[styles.sectionTitle, isDarkMode && styles.darkSectionTitle]}>{title}</Text>
          <TouchableOpacity onPress={() => navigation.navigate('PopularProductsScreen', { products })}>
            <Text style={[styles.viewMore, isDarkMode && styles.darkViewMore]}>{t('viewMore')}</Text>
          </TouchableOpacity>
        </View>

        {isOfficialStoreActive ? (
          <View style={styles.productsGrid}>
            {products.map((product) => (
              <TouchableOpacity
                key={product.id}
                onPress={() => navigation.navigate('ProductDetail', { product })}
                style={{ width: '50%', paddingHorizontal: 5 }}
              >
                <View style={[styles.productCardSmall, isDarkMode && styles.darkProductCardSmall]}>
                  <Image source={product.image} style={styles.productImageSmall} resizeMode="contain" />
                  <View style={styles.productTextContainer}>
                    <Text style={[styles.productNameSmall, isDarkMode && styles.darkProductNameSmall]}>{product.name}</Text>
                    <Text style={[styles.productBrand, isDarkMode && styles.darkProductBrand]}>{product.brand}</Text>
                    <Text style={[styles.priceSmall, isDarkMode && styles.darkPriceSmall]}>{product.price}</Text>
                  </View>
                  <TouchableOpacity style={styles.favoriteIcon} onPress={(event) => toggleFavorite(event, product.id)}>
                    <FontAwesome
                      name={product.isFavorite ? 'heart' : 'heart-o'}
                      size={24}
                      color={product.isFavorite ? '#F8D247' : isDarkMode ? 'white' : 'black'}
                    />
                  </TouchableOpacity>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        ) : (
          <View style={styles.productRow}>
            <ScrollView
              ref={productScrollViewRef}
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.scrollViewContent}
              onScroll={handleScroll}
              scrollEventThrottle={16}
            >
              {products.map((product) => (
                <TouchableOpacity key={product.id} onPress={() => navigation.navigate('ProductDetail', { product })}>
                  <View
                    style={[
                      styles.productCardSmall,
                      { width: CARD_WIDTH, marginHorizontal: CARD_MARGIN / 2 },
                      isDarkMode && styles.darkProductCardSmall,
                    ]}
                  >
                    <Image source={product.image} style={styles.productImageSmall} resizeMode="contain" />
                    <View style={styles.productTextContainer}>
                      <Text style={[styles.productNameSmall, isDarkMode && styles.darkProductNameSmall]}>{product.name}</Text>
                      <Text style={[styles.productBrand, isDarkMode && styles.darkProductBrand]}>{product.brand}</Text>
                      <Text style={[styles.priceSmall, isDarkMode && styles.darkPriceSmall]}>{product.price}</Text>
                    </View>
                    <TouchableOpacity style={styles.favoriteIcon} onPress={(event) => toggleFavorite(event, product.id)}>
                      <FontAwesome
                        name={product.isFavorite ? 'heart' : 'heart-o'}
                        size={24}
                        color={product.isFavorite ? '#F8D247' : isDarkMode ? 'white' : 'black'}
                      />
                    </TouchableOpacity>
                  </View>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}
      </View>
    );
  });

const NewArrivals = React.forwardRef(({ products, title, toggleFavorite, t, isDarkMode }, ref) => {
  const navigation = useNavigation();
  const scrollRef = useRef(null);
  return (
    <View style={[styles.section, isDarkMode && styles.darkSection]} ref={ref}>
      <View style={[styles.sectionHeader, isDarkMode && styles.darkSectionHeader]}>
        <Text style={[styles.sectionTitle, isDarkMode && styles.darkSectionTitle]}>{title}</Text>
        <TouchableOpacity onPress={() => navigation.navigate('NewArrivalsScreen', { products })}>
          <Text style={[styles.viewMore, isDarkMode && styles.darkViewMore]}>{t('viewMore')}</Text>
        </TouchableOpacity>
      </View>
      <View style={styles.productRow}>
        <ScrollView ref={scrollRef} horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.scrollViewContent}>
          {products.map((product) => (
            <TouchableOpacity key={product.id} onPress={() => navigation.navigate('ProductDetail', { product })}>
              <View
                style={[
                  styles.productCardSmall,
                  { width: CARD_WIDTH, marginHorizontal: CARD_MARGIN / 2 },
                  isDarkMode && styles.darkProductCardSmall,
                ]}
              >
                <View style={[styles.newArrivalBadge, isDarkMode && styles.darkNewArrivalBadge]}>
                  <Text style={styles.newArrivalBadgeText}>{t('new')}</Text>
                </View>
                <Image source={product.image} style={styles.productImageSmall} resizeMode="contain" />
                <View style={styles.productTextContainer}>
                  <Text style={[styles.productNameSmall, isDarkMode && styles.darkProductNameSmall]}>{product.name}</Text>
                  <Text style={[styles.productBrand, isDarkMode && styles.darkProductBrand]}>{product.brand}</Text>
                  <Text style={[styles.priceSmall, isDarkMode && styles.darkPriceSmall]}>{product.price}</Text>
                </View>
                <TouchableOpacity style={styles.favoriteIcon} onPress={(event) => toggleFavorite(event, product.id)}>
                  <FontAwesome
                    name={product.isFavorite ? 'heart' : 'heart-o'}
                    size={24}
                    color={product.isFavorite ? '#F8D247' : isDarkMode ? 'white' : 'black'}
                  />
                </TouchableOpacity>
              </View>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>
    </View>
  );
});

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#fff' },
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 12,
    backgroundColor: '#fff',
    overflow: 'visible',
    zIndex: 100,
  },
  brandName: { fontSize: 24, fontWeight: 'bold', color: 'black' },
  headerIcons: { flexDirection: 'row', alignItems: 'center', gap: 24, overflow: 'visible' },
  bellTouchable: { overflow: 'visible', paddingTop: 6, paddingRight: 6 },
  bellWrapper: { width: 28, height: 26, alignItems: 'center', justifyContent: 'center', overflow: 'visible' },
  notificationBadge: {
    position: 'absolute',
    top: -8,
    right: -10,
    minWidth: 18,
    height: 18,
    paddingHorizontal: 4,
    borderRadius: 9,
    backgroundColor: '#FF3B30',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#fff',
    zIndex: 999,
  },
  darkNotificationBadge: { borderColor: '#121212' },
  notificationBadgeText: {
    color: 'white',
    fontSize: 11,
    fontWeight: 'bold',
    lineHeight: 13,
    textAlign: 'center',
    includeFontPadding: false,
  },
  searchInputContainer: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 10, zIndex: 3 },
  searchInput: {
    flex: 1, height: 40, borderColor: 'gray', borderWidth: 1, borderRadius: 20,
    paddingHorizontal: 16, backgroundColor: '#f8f8f8',
  },
  closeIcon: { marginLeft: -40, padding: 10 },
  filtersContainer: { marginBottom: 20, paddingHorizontal: 16, paddingTop: 4 },
  filterButton: {
    paddingVertical: 8, borderRadius: 20, borderWidth: 1, borderColor: '#ddd',
    marginRight: 8, alignItems: 'center', flexDirection: 'row', justifyContent: 'center',
  },
  activeFilter: { backgroundColor: '#F8D247', borderColor: '#F8D247' },
  activeFilterText: { color: 'white' },
  filterText: { color: 'black' },
  section: { marginBottom: 20 },
  sectionHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    marginBottom: 10, paddingHorizontal: 16,
  },
  sectionTitle: { fontSize: 20, fontWeight: 'bold', color: 'black' },
  viewMore: { color: '#F8D247', fontSize: 15 },
  productCard: {
    flexDirection: 'row', backgroundColor: '#f8f8f8', borderRadius: 10, padding: 10,
    marginBottom: 10, marginHorizontal: 16, position: 'relative',
  },
  productImage: { width: 80, height: 80, marginRight: 10 },
  productInfo: { flex: 1, justifyContent: 'center' },
  productName: { fontSize: 16, fontWeight: 'bold', color: 'black' },
  productDescription: { fontSize: 14, color: '#666', marginBottom: 5 },
  priceContainer: { flexDirection: 'row', alignItems: 'center' },
  oldPrice: { textDecorationLine: 'line-through', color: '#999', marginRight: 5 },
  currentPrice: { fontSize: 16, fontWeight: 'bold', color: '#F8D247' },
  productRow: { flexDirection: 'row', alignItems: 'center', position: 'relative' },
  scrollViewContent: { paddingVertical: 10, paddingLeft: 16, paddingRight: 16, flexDirection: 'row' },
  productCardSmall: { backgroundColor: '#f8f8f8', borderRadius: 10, padding: 10, marginBottom: 10, position: 'relative' },
  productImageSmall: { width: '100%', height: 120, marginBottom: 5 },
  productTextContainer: { flex: 1 },
  productNameSmall: { fontSize: 14, fontWeight: 'bold', color: 'black' },
  productBrand: { fontSize: 12, color: '#666', marginBottom: 5 },
  priceSmall: { fontSize: 14, fontWeight: 'bold', color: '#F8D247' },
  favoriteIcon: { position: 'absolute', top: 10, right: 10 },
  newArrivalBadge: {
    position: 'absolute', top: 10, left: 10, backgroundColor: 'red',
    borderRadius: 5, paddingHorizontal: 6, paddingVertical: 2, zIndex: 1,
  },
  newArrivalBadgeText: { color: 'white', fontSize: 12, fontWeight: 'bold' },
  modalOverlay: { flex: 1, justifyContent: 'flex-start', backgroundColor: 'rgba(0,0,0,0.5)' },
  searchOverlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 2 },
  filterModal: { width: '70%', height: '100%', backgroundColor: 'white', paddingTop: 50, paddingHorizontal: 20 },
  modalContent: { flex: 1 },
  modalOption: {
    paddingVertical: 15, borderBottomWidth: 1, borderBottomColor: '#ddd',
    flexDirection: 'row-reverse', alignItems: 'center', justifyContent: 'space-between', gap: 7,
  },
  modalOptionText: { fontSize: 18, color: 'black' },
  modalOptionTouchable: { flex: 1, marginRight: 8 },
  noProductsText: { fontSize: 16, color: '#666', textAlign: 'center', marginTop: 20 },
  productsGrid: { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 11 },
  searchResultsContainer: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', paddingHorizontal: 16 },
  searchItemContainer: { width: '48%', marginBottom: 10 },
  darkSafeArea: { backgroundColor: '#121212' },
  darkContainer: { backgroundColor: '#121212' },
  darkHeader: { backgroundColor: '#121212' },
  darkBrandName: { color: 'white' },
  darkSearchInputContainer: { backgroundColor: '#1e1e1e' },
  darkSearchInput: { backgroundColor: '#333', borderColor: '#555', color: 'white' },
  darkFiltersContainer: { backgroundColor: '#121212' },
  darkFilterButton: { borderColor: '#555' },
  darkFilterText: { color: 'white' },
  darkSection: {},
  darkSectionHeader: {},
  darkSectionTitle: { color: 'white' },
  darkViewMore: { color: '#F8D247' },
  darkProductCard: { backgroundColor: '#1e1e1e' },
  darkProductInfo: {},
  darkProductName: { color: 'white' },
  darkProductDescription: { color: '#aaa' },
  darkOldPrice: { textDecorationLine: 'line-through', color: '#aaa' },
  darkCurrentPrice: { color: '#F8D247' },
  darkProductCardSmall: { backgroundColor: '#1e1e1e' },
  darkProductNameSmall: { color: 'white' },
  darkProductBrand: { color: '#aaa', marginBottom: 5 },
  darkPriceSmall: { color: '#F8D247' },
  darkNewArrivalBadge: { backgroundColor: '#555' },
  darkModalOverlay: { backgroundColor: 'rgba(0,0,0,0.7)' },
  darkSearchOverlay: { backgroundColor: 'rgba(0,0,0,0.7)' },
  darkFilterModal: { backgroundColor: '#1e1e1e' },
  darkModalContent: {},
  darkModalOption: { borderBottomColor: '#555' },
  darkModalOptionText: { color: 'white' },
  darkNoProductsText: { color: '#aaa' },
  darkSearchResultsContainer: {},
  darkSearchItemContainer: {},

  /* ============ ✅ ستايلات الـ Checkbox ============ */
  checkboxBase: {
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 4,
    borderWidth: 2,
    borderColor: '#000',
    backgroundColor: 'transparent',
    overflow: 'hidden',
  },
  checkboxBaseDark: { borderColor: '#fff' },
  checkboxYellow: { backgroundColor: '#F8D247', borderColor: '#F8D247' },
  checkMarkWrapper: {
    width: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkArm: {
    position: 'absolute',
    width: 2.5,
    borderRadius: 2,
  },
});

export default ProductsScreen;