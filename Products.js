import React, { useState, useRef, useEffect } from 'react';
import { View, Text, ScrollView, Image, TouchableOpacity, StyleSheet, SafeAreaView, Dimensions, Modal, Animated, TextInput } from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTranslation } from 'react-i18next';
import { useFocusEffect } from '@react-navigation/native';
import { allProducts } from './ProductData'; // Make sure this path is correct
import i18n from './i18n'; // And this path

const CARD_WIDTH = 170;
const CARD_MARGIN = 10;

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
    const [currentProducts, setCurrentProducts] = useState([]); // Products currently displayed (after filtering)
    const [newArrivals, setNewArrivals] = useState([]);
    const [officialStoreProducts, setOfficialStoreProducts] = useState([]);
    const [popularProducts, setPopularProducts] = useState([]);
    const [specialOfferProducts, setSpecialOfferProducts] = useState([]);
    const [isDarkMode, setIsDarkMode] = useState(false);

    // Load dark mode preference
    const loadPreferences = async () => {
        try {
            const savedDarkMode = await AsyncStorage.getItem('darkMode');
            if (savedDarkMode !== null) {
                setIsDarkMode(savedDarkMode === 'true');
            }
        } catch (error) {
            console.error("Error loading preferences:", error);
        }
    };

     // Load initial product data and favorites
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

        // Helper function to update favorite status and price for a product list
        const updateFavoritesAndPrice = (products) => products.map(p => {
            let price = t('Price N/A'); // Use translation

            // Find the corresponding product in allProducts to get the correct price
            const productDetail = allProducts.find(product => product.id === p.id);
            if (productDetail && productDetail.storagePricing) {
                const storageOptions = Object.keys(productDetail.storagePricing);

                // Check if this product is already a favorite, and get selected storage
                const favoriteProduct = favoriteProducts.find(fav => fav.id === p.id);
                const selectedStorage = favoriteProduct ? favoriteProduct.selectedStorage : null;
                if(selectedStorage){
                    price = `$${productDetail.storagePricing[selectedStorage].toFixed(2)}`;
                }
                else if (storageOptions.length > 0) {
                    //If there's no storage, find lowest.
                    let lowestPrice = null;
                    for (const storage in productDetail.storagePricing){
                        if(lowestPrice === null || productDetail.storagePricing[storage] < lowestPrice){
                            lowestPrice = productDetail.storagePricing[storage]
                        }
                    }
                    price = `$${lowestPrice.toFixed(2)}`; // Format as currency
                }
            }

            return {
                ...p,
                price: price,
                selectedStorage: favoriteProducts.find(fav => fav.id === p.id)?.selectedStorage, // Keep selected storage if exists
                isFavorite: favoriteProducts.some(fav => fav.id === p.id), // Check if it's a favorite
            };
        });

        // Update all product lists
        const updatedPopularProducts = updateFavoritesAndPrice(allProducts.filter(p => p.productType === 'Popular Products'));
        const updatedNewArrivals = updateFavoritesAndPrice(allProducts.filter(p => p.productType === 'New Arrivals'));
        const updatedOfficialStoreProducts = updateFavoritesAndPrice(allProducts.filter(p => p.productType === 'Official Store'));
        const updatedSpecialOfferProducts = updateFavoritesAndPrice(allProducts.filter(p => p.productType === 'Special Offer'));
        const updatedAllProducts = updateFavoritesAndPrice(allProducts); // Update the main allProducts list

        setNewArrivals(updatedNewArrivals);
        setOfficialStoreProducts(updatedOfficialStoreProducts);
        setPopularProducts(updatedPopularProducts);
        setSpecialOfferProducts(updatedSpecialOfferProducts);
        setCurrentProducts(updatedAllProducts); // Initially, currentProducts is allProducts
    };

    // Load filter state (useEffect for initial load)
    useEffect(() => {
        const loadFilterState = async () => {
            try {
                const savedFilter = await AsyncStorage.getItem('activeModalFilter');
                if (savedFilter !== null) {
                    setActiveModalFilter(savedFilter);
                    if (!searchQuery) { // Only apply filter if not searching
                        applyFilters(savedFilter);
                    }
                }
            } catch (error) {
                console.error("Error loading filter state:", error);
            }
        };

        loadFilterState();
    }, []);

    // useFocusEffect to refresh data when the screen comes into focus
    useFocusEffect(
        React.useCallback(() => {
            loadPreferences();
            loadInitialData();

            const loadFilter = async () => {
                try {
                    const savedFilter = await AsyncStorage.getItem('activeModalFilter');
                    if (savedFilter) {
                        if (!searchQuery) { // Only apply filter if not searching
                            applyFilters(savedFilter);
                        }
                    } else {
                        if (!searchQuery) {
                            applyFilters('All'); // Default to 'All' if no saved filter
                        }
                    }
                } catch (error) {
                    console.error("Error loading initial filter state:", error);
                }
            };

            loadFilter();
            return () => { }; // Cleanup function (optional)
        }, [searchQuery]) // Depend on searchQuery to re-run if search changes
    );

    // Apply search filtering (useEffect)
    useEffect(() => {
        const applySearch = () => {
            if (!currentProducts) return;

            let filtered = currentProducts.filter(product =>
                product.name.toLowerCase().includes(searchQuery.toLowerCase())
            );
            setFilteredProducts(filtered);

            setShowPopularProducts(false);
            setShowNewArrivals(false);
            setShowSpecialOffers(false);

            if (searchQuery.trim() === "") {
                applyFilters(activeInlineFilter); // Re-apply filters if search is cleared
            }
        };
        applySearch();
    }, [searchQuery, currentProducts, activeInlineFilter, t]);

    const openFilterModal = () => {
        setShowFilterModal(true);
        Animated.timing(slideAnim, { toValue: 1, duration: 300, useNativeDriver: true }).start();
    };

    const closeFilterModal = () => {
        Animated.timing(slideAnim, { toValue: 0, duration: 300, useNativeDriver: true }).start(() => setShowFilterModal(false));
    };

    // FIXED: Updated handleSearchIconPress to properly reset view when closing search
    const handleSearchIconPress = () => {
        const newSearchVisibility = !isSearchVisible;
        setIsSearchVisible(newSearchVisibility);

        if (!newSearchVisibility) { // If we're closing the search
            setSearchQuery(''); // Clear search text

            // Reset view to show normal product sections based on current filter
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
            } else { // 'All'
                setShowPopularProducts(true);
                setShowNewArrivals(true);
                setShowSpecialOffers(true);
                setIsOfficialStoreActive(false);
                setCurrentProducts(allProducts);
                setFilteredProducts(allProducts);
            }

            // Return focus to the main screen content
            if (scrollViewRef.current) {
                scrollViewRef.current.scrollTo({ y: 0, animated: true });
            }
        }
    };

    const handleSearchInputChange = (text) => setSearchQuery(text);

    // Apply filters (Official Store, Nearest, All)
    const applyFilters = async (filter) => {
        setActiveInlineFilter(filter);
        setActiveModalFilter(filter); // Update the modal filter state

        try {
            await AsyncStorage.setItem('activeModalFilter', filter);
        } catch (error) {
            console.error("Error saving filter state:", error);
        }

        if (filter === 'Official Store') {
            setShowPopularProducts(true);
            setShowNewArrivals(false);
            setShowSpecialOffers(false);
            setIsOfficialStoreActive(true);
            setCurrentProducts(officialStoreProducts);
            setFilteredProducts(officialStoreProducts); // Also update filteredProducts
            closeFilterModal();
        } else if (filter === 'Nearest') {
            setShowPopularProducts(false);
            setShowNewArrivals(false);
            setShowSpecialOffers(true);
            setIsOfficialStoreActive(false);
            setCurrentProducts(specialOfferProducts);
            setFilteredProducts(specialOfferProducts); // Also update filteredProducts
            closeFilterModal();
        } else {
            // 'All'
            setShowPopularProducts(true);
            setShowNewArrivals(true);
            setShowSpecialOffers(true);
            setIsOfficialStoreActive(false);
            setCurrentProducts(allProducts); // Show all products
            setFilteredProducts(allProducts); // Also update filteredProducts
            closeFilterModal();
            scrollToSection("All");
        }
    };


    const handleFilterChange = (filter) => {
        applyFilters(filter);
    };


    const scrollToSection = (section) => {
        if (section === "All") {
            scrollViewRef.current?.scrollTo({ y: 0, animated: true });
            return;
        }
        const ref = section === "Official Store" ? popularProductsRef : specialOffersRef;
        ref?.current?.measure((x, y, width, height, pageX, pageY) => {
            scrollViewRef.current?.scrollTo({ y: pageY, animated: true });
        });
    };

   // Toggle favorite status of a product (and update AsyncStorage)
   const toggleFavorite = async (event, productId) => {
    event.stopPropagation(); // Prevent other touch events

    // 1. Find the *current* product (before any updates).  This is important!
    const currentProduct = allProducts.find(p => p.id === productId);
    if (!currentProduct) {
        console.error("Product not found:", productId);
        return; // Exit if product isn't found (shouldn't happen, but good practice)
    }

    // 2.  Update the isFavorite status in *all* product lists.
    const updateProducts = (products) =>
        products.map((product) =>
            product.id === productId ? { ...product, isFavorite: !product.isFavorite } : product
        );

    const updatedAllProducts = updateProducts(allProducts); // Update main list *first*
    setOfficialStoreProducts(updateProducts(officialStoreProducts));
    setPopularProducts(updateProducts(popularProducts));
    setSpecialOfferProducts(updateProducts(specialOfferProducts));
    setNewArrivals(updateProducts(newArrivals));

    // 3. Find the *updated* product (after toggling isFavorite).
    const updatedProduct = updatedAllProducts.find(p => p.id === productId);
     if (!updatedProduct) {
        console.error("Updated product not found:", productId);
        return;
    }
    // 4. Determine which list to update for *display* purposes.
    let updatedCurrentProducts;
    if (activeInlineFilter === 'Official Store') {
        updatedCurrentProducts = updateProducts(officialStoreProducts);
    } else if (activeInlineFilter === 'Nearest') {
        updatedCurrentProducts = updateProducts(specialOfferProducts);
    } else {
        updatedCurrentProducts = updatedAllProducts;
    }
    setCurrentProducts(updatedCurrentProducts);

    // 5.  Apply search filtering (if a search is active).
    if (searchQuery.trim() !== "") {
        const searchedProducts = updatedCurrentProducts.filter(p =>
            p.name.toLowerCase().includes(searchQuery.toLowerCase())
        );
        setFilteredProducts(searchedProducts);
    } else {
        setFilteredProducts(updatedCurrentProducts); // No search, use updated list
    }

    // 6. Update AsyncStorage (the favorites list).
    const currentFavorites = await AsyncStorage.getItem('favoriteProducts');
    const currentFavoritesArray = currentFavorites ? JSON.parse(currentFavorites) : [];

    let newFavorites = [];

    if (updatedProduct.isFavorite) {
        // ADD to favorites.  The key part is here:
        let priceToSave = updatedProduct.price;  // Start with the *displayed* price


          const productDetail = allProducts.find(product => product.id === productId);
            if (productDetail && productDetail.storagePricing) {
                const storageOptions = Object.keys(productDetail.storagePricing);

                // Check if this product is already a favorite, and get selected storage
                const favoriteProduct = currentFavoritesArray.find(fav => fav.id === productId);
                const selectedStorage = favoriteProduct ? favoriteProduct.selectedStorage : null; //get selected storage
                if(selectedStorage){
                    priceToSave = `$${productDetail.storagePricing[selectedStorage].toFixed(2)}`;
                }
                else if (storageOptions.length > 0) {
                    //If there's no storage, find lowest.
                    let lowestPrice = null;
                    for (const storage in productDetail.storagePricing){
                        if(lowestPrice === null || productDetail.storagePricing[storage] < lowestPrice){
                            lowestPrice = productDetail.storagePricing[storage]
                        }
                    }
                    priceToSave = `$${lowestPrice.toFixed(2)}`; // Format as currency
                }
            }


        newFavorites = [
            ...currentFavoritesArray,
            {
                ...updatedProduct, // Copy all updated product data
                price: priceToSave,     // Use the calculated price!
                selectedStorage: updatedProduct.selectedStorage, // Keep track of storage
            }
        ];


    } else {
        // REMOVE from favorites.
        newFavorites = currentFavoritesArray.filter(p => p.id !== productId);
    }

    try {
        await AsyncStorage.setItem('favoriteProducts', JSON.stringify(newFavorites));
    } catch (error) {
        console.error('Error saving favorites:', error);
    }
};
// ... (the rest of your ProductsScreen code) ...


    // Render a single product item in search results
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

    // Render the main content (either search results or product sections)
    const renderContent = () => {
        if (searchQuery.trim() !== "") {
            // Search results
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
        } else {
            // Product sections (Special Offers, Popular Products, New Arrivals)
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
        }
    };

    return (
        <SafeAreaView style={[styles.safeArea, isDarkMode && styles.darkSafeArea]}>
            {/* Search Input Overlay */}
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
                            placeholderTextColor={isDarkMode ? "#999" : "#999"}
                        />
                        <TouchableOpacity onPress={handleSearchIconPress} style={styles.closeIcon}>
                            <FontAwesome name="times" size={24} color={isDarkMode ? "white" : "black"} />
                        </TouchableOpacity>
                    </View>
                </>
            )}

            {/* Main ScrollView */}
            <ScrollView style={[styles.container, isDarkMode && styles.darkContainer]} ref={scrollViewRef}>
                {!isSearchVisible && (
                    <Header
                        handleSearchIconPress={handleSearchIconPress}
                        t={t}
                        isDarkMode={isDarkMode}
                        newArrivals={newArrivals}
                        handleNotificationsPress={() => navigation.navigate('Notifications', { newArrivals: newArrivals })}
                    />
                )}
                <HorizontalFilters
                    openFilterModal={openFilterModal}
                    activeInlineFilter={activeInlineFilter}
                    handleFilterChange={handleFilterChange}
                    t={t}
                    isDarkMode={isDarkMode}
                />
                {renderContent()}
            </ScrollView>

            {/* Filter Modal */}
            <Modal visible={showFilterModal} transparent={true} animationType="none" onRequestClose={closeFilterModal}>
                <TouchableOpacity
                    style={[styles.modalOverlay, isDarkMode && styles.darkModalOverlay]}
                    activeOpacity={1}
                    onPress={closeFilterModal}
                >
                    <Animated.View
                        style={[
                            styles.filterModal,
                            isDarkMode && styles.darkFilterModal,
                            { transform: [{ translateX: slideAnim.interpolate({ inputRange: [0, 1], outputRange: [-Dimensions.get('window').width, 0] }) }] },
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
        // NOTE: The Bottom Tab Navigator is NOT part of this component.
        // It is typically defined in a parent navigator component (like Dashboard.js)
        // which then renders ProductsScreen as one of its tabs.
    );
};

// Header Component
const Header = ({ handleSearchIconPress, t, isDarkMode, newArrivals, handleNotificationsPress }) => (
    <View style={[styles.header, isDarkMode && styles.darkHeader]}>
        <Text style={[styles.brandName, isDarkMode && styles.darkBrandName]}>{t('Store')}</Text>
        <View style={styles.headerIcons}>
            <TouchableOpacity onPress={handleSearchIconPress}>
                <FontAwesome name={"search"} size={24} color={isDarkMode ? "white" : "black"} />
            </TouchableOpacity>
            <TouchableOpacity onPress={handleNotificationsPress}>
                <View>
                    <FontAwesome name="bell-o" size={24} color={isDarkMode ? "white" : "black"} />
                    {newArrivals && newArrivals.length > 0 && (
                        <View style={styles.notificationBadge}>
                            <Text style={styles.notificationBadgeText}>{newArrivals.length}</Text>
                        </View>
                    )}
                </View>
            </TouchableOpacity>
        </View>
    </View>
);

// Horizontal Filters Component
const HorizontalFilters = ({ handleFilterChange, openFilterModal, activeInlineFilter, t, isDarkMode }) => {
    const filters = [
        { id: '1', label: t('filter'), icon: 'filter', value: 'filter' },
        { id: '2', label: t('all'), value: 'All' },
        { id: '3', label: t('officialStore'), value: 'Official Store' },
        { id: '4', label: t('nearest'), value: 'Nearest' },
    ];

    return (
        <View style={[styles.filtersContainer, isDarkMode && styles.darkFiltersContainer]}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                {filters.map(item =>
                    item.value === 'filter' ? (
                        <TouchableOpacity
                            key={item.id}
                            style={[styles.filterButton, { paddingHorizontal: 14 }, isDarkMode && styles.darkFilterButton]}
                            onPress={openFilterModal}
                        >
                            <FontAwesome name={item.icon} size={18} color={isDarkMode ? "white" : "#666"} style={{ marginRight: 4 }} />
                            <Text style={[styles.filterText, { fontSize: 16 }, isDarkMode && styles.darkFilterText]}>{item.label}</Text>
                        </TouchableOpacity>
                    ) : (
                        <TouchableOpacity
                            key={item.id}
                            style={[
                                styles.filterButton,
                                activeInlineFilter === item.value && styles.activeFilter,
                                { paddingHorizontal: item.label === t('all') ? 24 : 14 },
                                isDarkMode && styles.darkFilterButton,
                            ]}
                            onPress={() => handleFilterChange(item.value)}
                        >
                            {item.icon && (
                                <FontAwesome
                                    name={item.icon}
                                    size={18}
                                    color={activeInlineFilter === item.value ? 'white' : isDarkMode ? 'white' : '#666'}
                                    style={{ marginRight: 4 }}
                                />
                            )}
                            <Text
                                style={[
                                    styles.filterText,
                                    activeInlineFilter === item.value && styles.activeFilterText,
                                    { fontSize: 16 },
                                    isDarkMode && styles.darkFilterText,
                                ]}
                            >
                                {item.label}
                            </Text>
                        </TouchableOpacity>
                    )
                )}
            </ScrollView>
        </View>
    );
};

// Reusable Yellow Checkbox Component
const YellowCheckbox = ({ isSelected }) => (
    <View style={[styles.checkboxBase, isSelected && styles.checkboxYellow]}>
        {isSelected && <FontAwesome name="check" size={18} color="white" />}
    </View>
);

// Filter Modal Content Component
const FilterModalContent = ({ closeModal, activeModalFilter, handleFilterChange, t, isDarkMode }) => {
    const { i18n } = useTranslation();
    const isRTL = i18n.language === 'ar';


    return (
        <View style={[styles.modalContent, isDarkMode && styles.darkModalContent]}>
            {/* All Option */}
            <View style={[styles.modalOption, isDarkMode && styles.darkModalOption, isRTL && { flexDirection: 'row-reverse' }]}>
                <TouchableOpacity
                    onPress={() => handleFilterChange('All')}
                    style={[styles.modalOptionTouchable, isRTL ? { marginRight: 8 } : { marginLeft: 8 }]}
                >
                    <Text style={[styles.modalOptionText, isDarkMode && styles.darkModalOptionText]}>{t('all')}</Text>
                </TouchableOpacity>
                <YellowCheckbox isSelected={activeModalFilter === 'All'} />
            </View>

            {/* Official Store Option */}
            <View style={[styles.modalOption, isDarkMode && styles.darkModalOption, isRTL && { flexDirection: 'row-reverse' }]}>
                <TouchableOpacity
                    onPress={() => handleFilterChange('Official Store')}
                    style={[styles.modalOptionTouchable, isRTL ? { marginRight: 8 } : { marginLeft: 8 }]}
                >
                    <Text style={[styles.modalOptionText, isDarkMode && styles.darkModalOptionText]}>{t('officialStore')}</Text>
                </TouchableOpacity>
                <YellowCheckbox isSelected={activeModalFilter === 'Official Store'} />
            </View>

            {/* Nearest Option */}
            <View style={[styles.modalOption, isDarkMode && styles.darkModalOption, isRTL && { flexDirection: 'row-reverse' }]}>
                <TouchableOpacity
                    onPress={() => handleFilterChange('Nearest')}
                    style={[styles.modalOptionTouchable, isRTL ? { marginRight: 8 } : { marginLeft: 8 }]}
                >
                    <Text style={[styles.modalOptionText, isDarkMode && styles.darkModalOptionText]}>{t('nearest')}</Text>
                </TouchableOpacity>
                <YellowCheckbox isSelected={activeModalFilter === 'Nearest'} />
            </View>
        </View>
    );
};

// Special Offers Component
const SpecialOffers = React.forwardRef(({ products, toggleFavorite, t, isDarkMode }, ref) => {
    const navigation = useNavigation();

    if (products.length === 0) return null;

    const navigateToProductDetail = product => navigation.navigate('ProductDetail', { product });

    const navigateToSpecialOffers = () => {
        navigation.navigate('SpecialOffersScreen', { products: products });
    };

    return (
        <View style={[styles.section, isDarkMode && styles.darkSection]} ref={ref}>
            <View style={[styles.sectionHeader, isDarkMode && styles.darkSectionHeader]}>
                <Text style={[styles.sectionTitle, isDarkMode && styles.darkSectionTitle]}>{t('specialOffer')}</Text>
                <TouchableOpacity onPress={navigateToSpecialOffers}>
                    <Text style={[styles.viewMore, isDarkMode && styles.darkViewMore]}>{t('viewMore')}</Text>
                </TouchableOpacity>
            </View>
            <TouchableOpacity onPress={() => navigateToProductDetail(products[0])}>
                <View style={[styles.productCard, isDarkMode && styles.darkProductCard]}>
                    <Image source={products[0].image} style={styles.productImage} resizeMode="contain" />
                    <View style={[styles.productInfo, isDarkMode && styles.darkProductInfo]}>
                        <Text style={[styles.productName, isDarkMode && styles.darkProductName]}>{products[0].name}</Text>
                        <Text style={[styles.productDescription, isDarkMode && styles.darkProductDescription]}>
                            {products[0].description}
                        </Text>
                        <View style={[styles.priceContainer, isDarkMode && styles.darkPriceContainer]}>
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

// Products Section Component (for Popular Products and Official Store)
const ProductsSection = React.forwardRef(({ title, products, isOfficialStoreActive, toggleFavorite, t, isDarkMode }, ref) => {
    const navigation = useNavigation();

    const navigateToProductDetail = (product) => {
        navigation.navigate('ProductDetail', { product });
    };

    const productScrollViewRef = useRef(null);
    const [showLeftArrow, setShowLeftArrow] = useState(false);
    const [showRightArrow, setShowRightArrow] = useState(true);
    const [currentOffset, setCurrentOffset] = useState(0);

    const scrollToNextProduct = () => {
        if (productScrollViewRef.current) {
            const nextOffset = currentOffset + CARD_WIDTH + CARD_MARGIN;
            productScrollViewRef.current.scrollTo({ x: nextOffset, animated: true });
        }
    };

    const scrollToPreviousProduct = () => {
        if (productScrollViewRef.current) {
            const prevOffset = currentOffset - (CARD_WIDTH + CARD_MARGIN);
            productScrollViewRef.current.scrollTo({ x: prevOffset, animated: true });
        }
    };

    const handleScroll = (event) => {
        const offsetX = event.nativeEvent.contentOffset.x;
        setCurrentOffset(offsetX);
        setShowLeftArrow(offsetX > 0);

        const contentWidth = event.nativeEvent.contentSize.width;
        const viewWidth = event.nativeEvent.layoutMeasurement.width;
        setShowRightArrow(offsetX + viewWidth < contentWidth - (CARD_WIDTH + CARD_MARGIN));
    };

    const navigateToPopularProducts = () => {
        navigation.navigate('PopularProductsScreen', { products: products });
    };

    return (
        <View style={[styles.section, isDarkMode && styles.darkSection]} ref={ref}>
            <View style={[styles.sectionHeader, isDarkMode && styles.darkSectionHeader]}>
                <Text style={[styles.sectionTitle, isDarkMode && styles.darkSectionTitle]}>{title}</Text>
                <TouchableOpacity onPress={navigateToPopularProducts}>
                    <Text style={[styles.viewMore, isDarkMode && styles.darkViewMore]}>{t('viewMore')}</Text>
                </TouchableOpacity>
            </View>
            {isOfficialStoreActive ? (
                // Grid layout for Official Store
                <View style={[styles.productsGrid, isDarkMode && styles.darkProductsGrid]}>
                    {products.map((product) => (
                        <TouchableOpacity
                            key={product.id}
                            onPress={() => navigateToProductDetail(product)}
                            style={{ width: '50%', paddingHorizontal: 5 }}
                        >
                            <View style={[styles.productCardSmall, isDarkMode && styles.darkProductCardSmall]}>
                                <Image source={product.image} style={styles.productImageSmall} resizeMode="contain" />
                                <View style={styles.productTextContainer}>
                                    <Text style={[styles.productNameSmall, isDarkMode && styles.darkProductNameSmall]}>{product.name}</Text>
                                    <Text style={[styles.productBrand, isDarkMode && styles.darkProductBrand]}>{product.brand}</Text>
                                    <Text style={[styles.priceSmall, isDarkMode && styles.darkPriceSmall]}>{product.price}</Text>
                                </View>
                                <TouchableOpacity style={styles.favoriteIcon} onPress={event => toggleFavorite(event, product.id)}>
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
                // Horizontal ScrollView for Popular Products
                <View style={[styles.productRow, isDarkMode && styles.darkProductRow]}>
                    {showLeftArrow && (
                        <TouchableOpacity
                            style={[styles.scrollArrowContainer, styles.leftArrow, isDarkMode && styles.darkScrollArrowContainer]}
                            onPress={scrollToPreviousProduct}
                        >
                            <FontAwesome name="chevron-left" size={24} color={isDarkMode ? 'white' : styles.arrowColor.color} />
                        </TouchableOpacity>
                    )}
                    <ScrollView
                        ref={productScrollViewRef}
                        horizontal
                        showsHorizontalScrollIndicator={false}
                        contentContainerStyle={[styles.scrollViewContent, { paddingRight: showRightArrow ? 50 : 16 }]}
                        onScroll={handleScroll}
                        scrollEventThrottle={16}
                    >
                        {products.map(product => (
                            <TouchableOpacity key={product.id} onPress={() => navigateToProductDetail(product)}>
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
                                    <TouchableOpacity style={styles.favoriteIcon} onPress={event => toggleFavorite(event, product.id)}>
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
                    {showRightArrow && (
                        <TouchableOpacity
                            style={[styles.scrollArrowContainer, styles.rightArrow, isDarkMode && styles.darkScrollArrowContainer]}
                            onPress={scrollToNextProduct}
                        >
                            <FontAwesome name="chevron-right" size={24} color={isDarkMode ? 'white' : styles.arrowColor.color} />
                        </TouchableOpacity>
                    )}
                </View>
            )}
        </View>
    );
});

// New Arrivals Component
const NewArrivals = React.forwardRef(({ products, title, toggleFavorite, t, isDarkMode }, ref) => {
    const navigation = useNavigation();
    const newArrivalsScrollViewRef = useRef(null);
    const [showLeftArrow, setShowLeftArrow] = useState(false);
    const [showRightArrow, setShowRightArrow] = useState(true);
    const [currentOffset, setCurrentOffset] = useState(0);

    const navigateToNewArrivals = () => {
        navigation.navigate('NewArrivalsScreen', { products: products });
    };

    const navigateToProductDetail = (product) => navigation.navigate('ProductDetail', { product });

    const scrollToNextArrival = () =>
        newArrivalsScrollViewRef.current?.scrollTo({ x: currentOffset + CARD_WIDTH + CARD_MARGIN, animated: true });
    const scrollToPreviousArrival = () =>
        newArrivalsScrollViewRef.current?.scrollTo({ x: currentOffset - (CARD_WIDTH + CARD_MARGIN), animated: true });

    const handleScroll = (event) => {
        const offsetX = event.nativeEvent.contentOffset.x;
        setCurrentOffset(offsetX);
        setShowLeftArrow(offsetX > 0);

        const contentWidth = event.nativeEvent.contentSize.width; // Get content width
        const viewWidth = event.nativeEvent.layoutMeasurement.width;
        setShowRightArrow(offsetX + viewWidth < contentWidth - (CARD_WIDTH + CARD_MARGIN));
    };

    const renderProduct = (product) => (
        <TouchableOpacity key={product.id} onPress={() => navigateToProductDetail(product)}>
            <View
                style={[
                    styles.productCardSmall,
                    { width: CARD_WIDTH, marginHorizontal: CARD_MARGIN / 2 },
                    isDarkMode && styles.darkProductCardSmall,
                ]}
            >
                <View style={[styles.newArrivalBadge, isDarkMode && styles.darkNewArrivalBadge]}>
                    <Text style={[styles.newArrivalBadgeText, isDarkMode && styles.darkNewArrivalBadgeText]}>{t('new')}</Text>
                </View>
                <Image source={product.image} style={styles.productImageSmall} resizeMode="contain" />
                <View style={styles.productTextContainer}>
                    <Text style={[styles.productNameSmall, isDarkMode && styles.darkProductNameSmall]}>{product.name}</Text>
                    <Text style={[styles.productBrand, isDarkMode && styles.darkProductBrand]}>{product.brand}</Text>
                    <Text style={[styles.priceSmall, isDarkMode && styles.darkPriceSmall]}>{product.price}</Text>
                </View>
                <TouchableOpacity style={styles.favoriteIcon} onPress={event => toggleFavorite(event, product.id)}>
                    <FontAwesome
                        name={product.isFavorite ? 'heart' : 'heart-o'}
                        size={24}
                        color={product.isFavorite ? '#F8D247' : isDarkMode ? 'white' : 'black'}
                    />
                </TouchableOpacity>
            </View>
        </TouchableOpacity>
    );

    return (
        <View style={[styles.section, isDarkMode && styles.darkSection]} ref={ref}>
            <View style={[styles.sectionHeader, isDarkMode && styles.darkSectionHeader]}>
                <Text style={[styles.sectionTitle, isDarkMode && styles.darkSectionTitle]}>{title}</Text>
                <TouchableOpacity onPress={navigateToNewArrivals}>
                    <Text style={[styles.viewMore, isDarkMode && styles.darkViewMore]}>{t('viewMore')}</Text>
                </TouchableOpacity>
            </View>
            <View style={[styles.productRow, isDarkMode && styles.darkProductRow]}>
                {showLeftArrow && (
                    <TouchableOpacity
                        style={[styles.scrollArrowContainer, styles.leftArrow, isDarkMode && styles.darkScrollArrowContainer]}
                        onPress={scrollToPreviousArrival}
                    >
                        <FontAwesome name="chevron-left" size={24} color={isDarkMode ? 'white' : styles.arrowColor.color} />
                    </TouchableOpacity>
                )}
                <ScrollView
                    ref={newArrivalsScrollViewRef}
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={[styles.scrollViewContent, { paddingRight: showRightArrow ? 50 : 16 }]}
                    onScroll={handleScroll}
                    scrollEventThrottle={16}
                >
                    {products.map(product => renderProduct(product))}
                </ScrollView>
                {showRightArrow && (
                    <TouchableOpacity
                        style={[styles.scrollArrowContainer, styles.rightArrow, isDarkMode && styles.darkScrollArrowContainer]}
                        onPress={scrollToNextArrival}
                    >
                        <FontAwesome name="chevron-right" size={24} color={isDarkMode ? 'white' : styles.arrowColor.color} />
                    </TouchableOpacity>
                )}
            </View>
        </View>
    );
});

// Styles for ProductsScreen
const styles = StyleSheet.create({
    safeArea: { flex: 1, backgroundColor: '#fff' },
    container: { flex: 1 },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, zIndex: 3 },
    brandName: { fontSize: 24, fontWeight: 'bold', color: 'black' },
    headerIcons: { flexDirection: 'row', gap: 24 },
    searchInputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 10,
        zIndex: 3,
    },
    searchInput: {
        flex: 1,
        height: 40,
        borderColor: 'gray',
        borderWidth: 1,
        borderRadius: 20,
        paddingHorizontal: 16,
        backgroundColor: "#f8f8f8",
    },
    closeIcon: { marginLeft: -40, padding: 10 },
    filtersContainer: { marginBottom: 20, paddingHorizontal: 16 },
    filterButton: {
        paddingVertical: 8,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: '#ddd',
        marginRight: 8,
        alignItems: 'center',
        flexDirection: 'row',
        justifyContent: 'center',
    },
    activeFilter: { backgroundColor: '#F8D247', borderColor: '#F8D247' },
    activeFilterText: { color: 'white' },
    filterText: { color: 'black' },
    section: { marginBottom: 20 },
    sectionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 10,
        paddingHorizontal: 16,
    },
    sectionTitle: { fontSize: 20, fontWeight: 'bold', color: 'black' },
    viewMore: { color: '#F8D247', fontSize: 15 },
    productCard: {
        flexDirection: 'row',
        backgroundColor: '#f8f8f8',
        borderRadius: 10,
        padding: 10,
        marginBottom: 10,
        marginHorizontal: 16,
        position: 'relative',
    },
    productImage: { width: 80, height: 80, marginRight: 10 },
    productInfo: { flex: 1, justifyContent: 'center' },
    productName: { fontSize: 16, fontWeight: 'bold', color: 'black' },
    productDescription: { fontSize: 14, color: '#666', marginBottom: 5 },
    priceContainer: { flexDirection: 'row', alignItems: 'center' },
    oldPrice: { textDecorationLine: 'line-through', color: '#999', marginRight: 5 },
    currentPrice: { fontSize: 16, fontWeight: 'bold', color: '#F8D247' },
    productRow: { flexDirection: 'row', alignItems: 'center', position: 'relative' },
    scrollViewContent: { paddingVertical: 10, paddingLeft: 16, flexDirection: 'row' },
    productCardSmall: {
        backgroundColor: '#f8f8f8',
        borderRadius: 10,
        padding: 10,
        marginBottom: 10,
        position: 'relative',
    },
    productImageSmall: { width: '100%', height: 120, marginBottom: 5 },
    productTextContainer: {
        flex: 1,
    },
    productNameSmall: { fontSize: 14, fontWeight: 'bold', color: 'black' },
    productBrand: { fontSize: 12, color: '#666', marginBottom: 5 },
    priceSmall: { fontSize: 14, fontWeight: 'bold', color: '#F8D247' },
    favoriteIcon: { position: 'absolute', top: 10, right: 10 },
    newArrivalBadge: {
        position: 'absolute',
        top: 10,
        left: 10,
        backgroundColor: 'red',
        borderRadius: 5,
        paddingHorizontal: 6,
        paddingVertical: 2,
        zIndex: 1,
    },
    newArrivalBadgeText: { color: 'white', fontSize: 12, fontWeight: 'bold' },
    scrollArrowContainer: {
        position: 'absolute',
        top: '50%',
        transform: [{ translateY: -20 }],
        backgroundColor: 'rgba(255, 255, 255, 0.8)',
        borderRadius: 20,
        padding: 5,
        zIndex: 1,
    },
    leftArrow: { left: 10 },
    rightArrow: { right: 10 },
    arrowColor: { color: '#F8D247' },
    modalOverlay: { flex: 1, justifyContent: 'flex-start', backgroundColor: 'rgba(0, 0, 0, 0.5)' },
    searchOverlay: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        zIndex: 2,
    },
    filterModal: { width: '70%', height: '100%', backgroundColor: 'white', paddingTop: 50, paddingHorizontal: 20 },
    modalContent: { flex: 1 },
    modalOption: {
        paddingVertical: 15,
        borderBottomWidth: 1,
        borderBottomColor: '#ddd',
        flexDirection: 'row-reverse',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 7,

    },
    modalOptionText: { fontSize: 18, color: 'black' },
    modalOptionTouchable: { flex: 1 },
    noProductsText: { fontSize: 16, color: '#666', textAlign: 'center', marginTop: 20 },
    productsGrid: { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 11 },
    searchResultsContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
    },
    searchItemContainer: { width: '48%', marginBottom: 10 },
    loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
    loadingText: { fontSize: 16, color: '#666' },
    notificationBadge: {
        position: 'absolute',
        top: -5,
        right: -5,
        backgroundColor: 'red',
        borderRadius: 10,
        width: 20,
        height: 20,
        justifyContent: 'center',
        alignItems: 'center',
    },
    notificationBadgeText: {
        color: 'white',
        fontSize: 12,
        fontWeight: 'bold',
    },

    darkSafeArea: { backgroundColor: '#121212' },
    darkContainer: { backgroundColor: '#121212' },
    darkHeader: { backgroundColor: '#1e1e1e' },
    darkBrandName: { color: 'white' },
    darkSearchInputContainer: { backgroundColor: '#1e1e1e' },
    darkSearchInput: { backgroundColor: '#333', borderColor: '#555', color: 'white' },
    darkFiltersContainer: { backgroundColor: '#1e1e1e' },
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
    darkPriceContainer: {},
    darkOldPrice: { textDecorationLine: 'line-through', color: '#aaa' },
    darkCurrentPrice: { color: '#F8D247' },
    darkProductRow: {},
    darkProductCardSmall: {
        backgroundColor: '#1e1e1e',
    },
    darkProductNameSmall: { color: 'white' },
    darkProductBrand: { color: '#aaa', marginBottom: 5 },
    darkPriceSmall: { color: '#F8D247' },
    darkNewArrivalBadge: { backgroundColor: '#555' },
    darkNewArrivalBadgeText: { color: 'white' },
    darkScrollArrowContainer: { backgroundColor: 'rgba(0, 0, 0, 0.5)' },
    darkModalOverlay: { backgroundColor: 'rgba(0, 0, 0, 0.7)' },
    darkSearchOverlay: { backgroundColor: 'rgba(0, 0, 0, 0.7)' },
    darkFilterModal: { backgroundColor: '#1e1e1e' },
    darkModalContent: {},
    darkModalOption: { borderBottomColor: '#555' },
    darkModalOptionText: { color: 'white' },
    noProductsText: { color: '#aaa' },
    darkProductsGrid: {},
    darkSearchResultsContainer: {},
    darkSearchItemContainer: {},
    darkLoadingContainer: { backgroundColor: '#1e1e1e' },
    darkLoadingText: { color: '#aaa' },

    // Checkbox Styles
    checkboxBase: {
        width: 24,
        height: 24,
        justifyContent: 'center',
        alignItems: 'center',
        borderRadius: 4,
        borderWidth: 2,
        borderColor: 'black', // Default border color
        backgroundColor: 'transparent',
    },
    checkboxChecked: {
        backgroundColor: '#F8D247', // Yellow when checked
        borderColor: '#F8D247',     // Yellow border when checked
    },
    checkboxYellow: {
        backgroundColor: '#F8D247',
        borderColor: '#F8D247',
    },
    checkboxInner: {
        width: 18,
        height: 18,
        borderRadius: 2,
        backgroundColor: 'white', // Checkmark color
    },
});

export default ProductsScreen;