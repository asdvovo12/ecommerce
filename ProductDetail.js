// ProductDetail.js
import React, { useState, useRef, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    Image,
    ScrollView,
    TouchableOpacity,
    SafeAreaView,
    LayoutAnimation,
    Platform,
    UIManager,
    Dimensions,
    Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useDarkMode } from './DarkModeContext'; // Make sure the path is correct
import { useTranslation } from 'react-i18next'; // Import useTranslation
import { allProducts } from './ProductData'; // Import allProducts

if (
    Platform.OS === 'android' &&
    UIManager.setLayoutAnimationEnabledExperimental
) {
    UIManager.setLayoutAnimationEnabledExperimental(true);
}

const ProductDetail = () => {
    const navigation = useNavigation();
    const route = useRoute();
    const { product: passedProduct } = route.params || {};  // Get passed product, default to empty object.
    const { isDarkMode } = useDarkMode();
    const { t } = useTranslation();


    // Find the full product details using the ID from the passed product.
    const product = allProducts.find(p => p.id === passedProduct.id);

    // If the product isn't found (e.g., invalid ID), show a message and allow going back.
    if (!product) {
        return (
            <SafeAreaView style={[styles.safeArea, isDarkMode && styles.darkSafeArea]}>
                <View style={[styles.container, isDarkMode && styles.darkContainer, { justifyContent: 'center', alignItems: 'center' }]}>
                    <Text style={[styles.headerTitle, isDarkMode && styles.darkText]}>{t('Product Not Found')}</Text>
                    <TouchableOpacity onPress={() => navigation.goBack()} style={{ marginTop: 20 }}>
                        <Text style={[styles.readMore, isDarkMode && styles.darkReadMore]}>{t('Go Back')}</Text>
                    </TouchableOpacity>
                </View>
            </SafeAreaView>
        );
    }


    const {
        name = "Default Product Name",
        category = "Default Category",
        description = "Default description.",
        storageOptions = [],
        storagePricing = {},
        images = [{ uri: 'https://via.placeholder.com/400?text=Image1' }],
        brand = "Default Brand",
        id = 'default-id',
    } = product;


    const [quantity, setQuantity] = useState(1);
    const [activeImageIndex, setActiveImageIndex] = useState(0);
    const [descriptionExpanded, setDescriptionExpanded] = useState(false);
    const descriptionTextRef = useRef(null);
    const [shouldReadMore, setShouldReadMore] = useState(false);
    const scrollViewRef = useRef(null);
    const screenWidth = Dimensions.get('window').width;
    const [isFavorite, setIsFavorite] = useState(false);
    const carouselScrollViewRef = useRef(null);

    const placeholderImage = { uri: 'https://via.placeholder.com/400?text=No+Image' };
      let displayImages = [...(images || [])];
    while (displayImages.length < 3) {
        displayImages.push(placeholderImage);
    }
    displayImages = displayImages.slice(0, 3);


    const initialSelectedStorage = product.storageOptions && product.storageOptions.length > 0 ? product.storageOptions[0] : null;
    const initialDisplayedPrice = initialSelectedStorage && product.storagePricing ? (product.storagePricing[initialSelectedStorage] || 0) : 0;

    const [selectedStorage, setSelectedStorage] = useState(initialSelectedStorage);
    const [displayedPrice, setDisplayedPrice] = useState(initialDisplayedPrice);

    useEffect(() => {
        if (selectedStorage && storagePricing) {
            setDisplayedPrice(storagePricing[selectedStorage] || 0);
        }
    }, [selectedStorage, storagePricing]);

    const handleStorageSelect = (storage) => {
        setSelectedStorage(storage);
    };

    const toggleDescription = () => {
        LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
        setDescriptionExpanded(!descriptionExpanded);

        if (!descriptionExpanded && descriptionTextRef.current) {
            setTimeout(() => {
                descriptionTextRef.current.measureInWindow((x, y, width, height) => {
                    scrollViewRef.current?.scrollTo({ y: y - 100, animated: true });
                });
            }, 0);
        }
    };

    useEffect(() => {
        if (descriptionTextRef.current) {
            descriptionTextRef.current.measure((x, y, width, height) => {
                if (height > 72) {
                    setShouldReadMore(true);
                }
            });
        }
    }, [description]);

    const handleScroll = (event) => {
        const offsetX = event.nativeEvent.contentOffset.x;
        const index = Math.round(offsetX / screenWidth);
        if (index !== activeImageIndex) {
            setActiveImageIndex(index);
        }
    };

    const handleGoBack = () => {
        navigation.goBack();
    };

    const loadFavoriteStatus = async () => {
        try {
            const favorites = await AsyncStorage.getItem('favoriteProducts');
            if (favorites !== null) {
                const favoriteProducts = JSON.parse(favorites);
                setIsFavorite(favoriteProducts.some(favProduct => favProduct.id === id));
            }
        } catch (error) {
            console.error("Error loading favorite status:", error);
        }
    };

    useEffect(() => {
        loadFavoriteStatus();
    }, [id]);

    const toggleFavorite = async () => {
        const newIsFavorite = !isFavorite;
        setIsFavorite(newIsFavorite);

        try {
            let favoriteProducts = [];
            const existingFavorites = await AsyncStorage.getItem('favoriteProducts');
            if (existingFavorites !== null) {
                favoriteProducts = JSON.parse(existingFavorites);
            }

            if (newIsFavorite) {
                const productToAdd = {
                    id,
                    name,
                    brand,
                     price: `$${displayedPrice.toFixed(2)}`, // Use displayedPrice
                    image: displayImages.length > 0 ? displayImages[0] : placeholderImage,
                };
                favoriteProducts.push(productToAdd);
                Alert.alert(t("Added"), `${name} ${t("added to favorites")}.`);
            } else {
                favoriteProducts = favoriteProducts.filter(favProduct => favProduct.id !== id);
                Alert.alert(t("Removed"), `${name} ${t("removed from favorites")}.`);
            }

            await AsyncStorage.setItem('favoriteProducts', JSON.stringify(favoriteProducts));
        } catch (error) {
            console.error("Error updating favorites:", error);
            Alert.alert(t("Error"), t("There was a problem updating your favorites."));
            setIsFavorite(!newIsFavorite); // Revert state on error
        }
    };

    const scrollToImage = (index) => {
        setActiveImageIndex(index);
        if (carouselScrollViewRef.current) {
            carouselScrollViewRef.current.scrollTo({
                x: index * screenWidth,
                y: 0,
                animated: true,
            });
        }
    };

    const handleAddToCart = () => {
        if (storageOptions.length > 0 && !selectedStorage) {
            Alert.alert(t("Select Storage"), t("Please select a storage option."));
            return;
        }

        const itemToAdd = {
            id: product.id || 'default-id', // Fallback to default ID
            name,
            price: displayedPrice, // Use displayedPrice, not product.price
            storage: selectedStorage,
            quantity: quantity,
            image: displayImages.length > 0 ? displayImages[0].uri : null,
        };

        navigation.navigate('Cart', { item: itemToAdd });
    };

    return (
        <SafeAreaView style={[styles.safeArea, isDarkMode && styles.darkSafeArea]}>
            <ScrollView
                style={[styles.container, isDarkMode && styles.darkContainer]}
                ref={scrollViewRef}
                contentContainerStyle={[styles.contentContainer, isDarkMode && styles.darkContentContainer]}
            >
                <View style={[styles.header, isDarkMode && styles.darkHeader]}>
                    <TouchableOpacity style={styles.backButton} onPress={handleGoBack}>
                        <Ionicons name="arrow-back" size={24} color={isDarkMode ? "white" : "black"} />
                    </TouchableOpacity>
                    <Text style={[styles.headerTitle, isDarkMode && styles.darkText]}>{t('Product Details')}</Text>
                    <View style={styles.menuButton}></View>
                </View>

                <View style={[styles.imageCarouselContainer, isDarkMode && styles.darkImageCarouselContainer]}>
                    <ScrollView
                        horizontal
                        pagingEnabled
                        showsHorizontalScrollIndicator={false}
                        onScroll={handleScroll}
                        scrollEventThrottle={16}
                        style={styles.carouselScrollView}
                        ref={carouselScrollViewRef}
                    >
                         {displayImages.map((image, index) => (
                            <Image key={index} source={typeof image === 'string' ? {uri:image} : image} style={[styles.productImage, { width: screenWidth }]} resizeMode="contain" />
                        ))}
                    </ScrollView>

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
                </View>

                <View style={[styles.productInfo, isDarkMode && styles.darkProductInfo]}>
                    <View style={styles.nameAndFavorite}>
                        <Text style={[styles.productName, isDarkMode && styles.darkText]}>{name}</Text>
                        <TouchableOpacity onPress={toggleFavorite} style={styles.favoriteButton}>
                            <View style={[styles.favoriteIconContainer, isDarkMode && styles.darkFavoriteIconContainer]}>
                                <Ionicons
                                    name={isFavorite ? 'heart' : 'heart-outline'}
                                    size={24}
                                    color={isFavorite ? 'gold' : (isDarkMode ? 'white' : 'black')}
                                />
                            </View>
                        </TouchableOpacity>
                    </View>
                    <Text style={[styles.productCategory, isDarkMode && styles.darkTextSecondary]}>{category}</Text>

                    <View style={styles.priceContainer}>
                        <Text style={[styles.currentPrice, isDarkMode && styles.darkText]}>${displayedPrice.toFixed(2)}</Text>
                    </View>

                    {storageOptions.length > 0 && (
                        <View style={styles.storageSelector}>
                            {storageOptions.map((storage, index) => (
                                <TouchableOpacity
                                    key={index}
                                    style={[
                                        styles.storageButton,
                                        selectedStorage === storage && styles.selectedStorageButton,
                                        isDarkMode && styles.darkStorageButton,
                                        selectedStorage === storage && isDarkMode && styles.darkSelectedStorageButton,
                                    ]}
                                    onPress={() => handleStorageSelect(storage)}
                                >
                                    <Text style={[styles.storageButtonText, isDarkMode && styles.darkStorageButtonText]}>{storage}</Text>
                                </TouchableOpacity>
                            ))}
                        </View>
                    )}

                    <Text
                        ref={descriptionTextRef}
                        style={[
                            styles.description,
                            !descriptionExpanded && styles.collapsedDescription,
                            isDarkMode && styles.darkText,
                        ]}
                        numberOfLines={descriptionExpanded ? undefined : 3}
                    >
                        {description}
                    </Text>
                    {shouldReadMore && (
                        <TouchableOpacity onPress={toggleDescription}>
                            <Text style={[styles.readMore, isDarkMode && styles.darkReadMore]}>{descriptionExpanded ? t('Read less') : t('Read more')}</Text>
                        </TouchableOpacity>
                    )}
                    <View style={{ height: 100 }} />
                </View>
            </ScrollView>

            <View style={[styles.bottomBar, isDarkMode && styles.darkBottomBar]}>
                <View style={[styles.quantityContainer, isDarkMode && styles.darkQuantityContainer]}>
                    <TouchableOpacity
                        style={[styles.quantityButton, isDarkMode && styles.darkQuantityButton]}
                        onPress={() => setQuantity(Math.max(1, quantity - 1))}
                    >
                        <Ionicons name="remove" size={20} color={isDarkMode? "white": "black"} />
                    </TouchableOpacity>
                    <Text style={[styles.quantityText, isDarkMode && styles.darkQuantityText]}>{quantity}</Text>
                    <TouchableOpacity
                        style={[styles.quantityButton, isDarkMode && styles.darkQuantityButton]}
                        onPress={() => setQuantity(quantity + 1)}
                    >
                        <Ionicons name="add" size={20} color={isDarkMode? "white" : "black"} />
                    </TouchableOpacity>
                </View>
                <TouchableOpacity style={[styles.addToCartButtonLarge, isDarkMode && styles.darkAddToCartButtonLarge]} onPress={handleAddToCart}>
                    <Text style={[styles.addToCartButtonTextLarge, isDarkMode && styles.darkAddToCartButtonTextLarge]}>{t('Add to cart')}</Text>
                </TouchableOpacity>
            </View>
        </SafeAreaView>
    );
};
const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: 'white',
    },
    container: {
        flex: 1,
        backgroundColor: 'white',
    },
    contentContainer: {
        paddingBottom: 80,
        backgroundColor: 'white',
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 16,
        backgroundColor: '#e0e0e0',
    },
    backButton: {
        padding: 8,
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: 'black',
    },
    menuButton: {
        padding: 8,
        width: 48,
    },
    imageCarouselContainer: {
        backgroundColor: '#e0e0e0',
    },
    carouselScrollView: {},
    productImage: {
        height: 350,
        width: '100%',
        resizeMode: 'contain',
    },
    imageIndicatorContainer: {
        flexDirection: 'row',
        justifyContent: 'center',
        marginTop: 8,
        marginBottom: 8,
        backgroundColor: '#e0e0e0',
    },
    indicatorDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: '#d3d3d3',
        marginHorizontal: 4,
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 1,
        },
        shadowOpacity: 0.22,
        shadowRadius: 2.22,
        elevation: 3,
    },
    activeIndicatorDot: {
        backgroundColor: '#808080',
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 1,
        },
        shadowOpacity: 0.22,
        shadowRadius: 2.22,
        elevation: 3,
    },
    productInfo: {
        padding: 16,
        backgroundColor: 'white',
    },
    nameAndFavorite: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 4,
    },
    productName: {
        fontSize: 24,
        fontWeight: 'bold',
        color: 'black',
    },
    favoriteButton: {
        padding: 8,
    },
    favoriteIconContainer: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: 'white',
        borderColor: 'black',
        borderWidth: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    productCategory: {
        fontSize: 16,
        color: '#757575',
        marginBottom: 8,
    },
    priceContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 16,
    },
    currentPrice: {
        fontSize: 20,
        fontWeight: 'bold',
        marginRight: 8,
        color: 'black',
    },
    originalPrice: { // This style is no longer used, but I'm keeping it in case you need it later
        fontSize: 16,
        color: '#757575',
        textDecorationLine: 'line-through',
    },
    storageSelector: {
        flexDirection: 'row',
        marginBottom: 16,
        flexWrap: 'wrap',
        justifyContent: 'flex-start',
    },
    storageButton: {
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 20,
        backgroundColor: 'white',
        marginRight: 8,
        marginBottom: 8,
        borderWidth: 1,
        borderColor: 'gray',
    },
    selectedStorageButton: {
        borderColor: '#ffd700',
        borderWidth: 2,
    },
    storageButtonText: {
        fontSize: 16,
        color: 'black',
    },
    description: {
        fontSize: 16,
        color: '#424242',
        marginBottom: 8,
        lineHeight: 24,
    },
    collapsedDescription: {
        overflow: 'hidden',
    },
    readMore: {
        color: 'blue',
    },
    bottomBar: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 16,
        backgroundColor: 'white',
        borderTopWidth: 1,
        borderTopColor: '#ddd',
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
    },
    quantityContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#e0e0e0',
        borderRadius: 25,
        paddingHorizontal: 12,
        paddingVertical: 4,
    },
    quantityButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#424242',
        justifyContent: 'center',
        alignItems: 'center',
    },
    quantityText: {
        fontSize: 18,
        marginHorizontal: 12,
        fontWeight: 'bold',
        color: 'black',
    },
     // Updated addToCartButtonLarge styles (with glow)
    addToCartButtonLarge: {
        backgroundColor: '#ffdd00',
        paddingVertical: 16,
        paddingHorizontal: 32,
        borderRadius: 25,
        flex: 1,
        marginLeft: 16,
        // Glow effect
        elevation: 10,
        shadowColor: '#ffdd00',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 1,
        shadowRadius: 10,
    },
    addToCartButtonTextLarge: {
        color: 'black',
        fontSize: 18,
        fontWeight: 'bold',
        textAlign: 'center',
    },

    // Dark mode styles
    darkSafeArea: {
        backgroundColor: '#121212',
    },
    darkContainer: {
        backgroundColor: '#121212',
    },
    darkContentContainer: {
        paddingBottom: 80,
        backgroundColor: '#121212',
    },
    darkHeader: {
        backgroundColor: '#1E1E1E',
    },
    darkText: {
        color: 'white',
    },
    darkTextSecondary: {
        color: '#BBBBBB',
    },
    darkImageCarouselContainer: {
        backgroundColor: '#1E1E1E',
    },
      darkImageIndicatorContainer: {
        backgroundColor: '#1E1E1E',
    },
    darkIndicatorDot: {
        backgroundColor: '#444444',
    },
    darkActiveIndicatorDot: {
        backgroundColor: '#888888',
    },
    darkProductInfo: {
        backgroundColor: '#1E1E1E',
    },
    darkFavoriteIconContainer:{
        backgroundColor: '#292929',
        borderColor: '#DDDDDD'
    },
    darkStorageButton: {
        backgroundColor: '#292929',
        borderColor: '#444444',
    },
    darkSelectedStorageButton:{
        borderColor: '#ffd700',
    },
    darkStorageButtonText: {
        color: 'white',
    },
      darkReadMore:{
        color: '#90caf9'
    },
    darkBottomBar: {
        backgroundColor: '#1E1E1E',
        borderTopColor: '#333333',
    },
    darkQuantityContainer: {
        backgroundColor: '#292929',
    },
    darkQuantityButton: {
        backgroundColor: '#555555',
    },
    darkQuantityText: {
        color: 'white',
    },
    // Updated darkAddToCartButtonLarge (with glow)
    darkAddToCartButtonLarge: {
        backgroundColor: '#555',  // Darker background
        // Dark mode glow
        elevation: 10,
        shadowColor: '#FFFFFF',  // White glow
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.8, // Slightly reduced
        shadowRadius: 10,
    },
    darkAddToCartButtonTextLarge: {
        color: 'white', //Text color changed to white.
    },
});

export default ProductDetail;