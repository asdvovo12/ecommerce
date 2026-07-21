// MainApp.js (or App.js)
import React, { useState, useEffect, createContext, useContext } from 'react'; // Added useContext
import { NavigationContainer, useIsFocused, useNavigation } from '@react-navigation/native'; // Added useNavigation
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { View, Image, Text, TouchableOpacity, StyleSheet, ScrollView, Animated, TouchableWithoutFeedback } from 'react-native';
// import { FontAwesome } from '@expo/vector-icons'; // Not used, commented out
import AsyncStorage from '@react-native-async-storage/async-storage';
import { StripeProvider } from '@stripe/stripe-react-native'; // <-- 1. تم استدعاء StripeProvider
import { STRIPE_PUBLISHABLE_KEY } from './config';

// Screens
import SignUp from './signup';
import SignInScreen from './SignIn';
import SplashScreen from './SplashScreen';
import ForgotPasswordScreen from './ForgotPassword';
import VerifyEmailScreen from './VerifyEmail';
import ResetPasswordScreen from './ResetPassword';
import ProductsScreen from './Products';
import CartScreen from './Cart';
import ProfileScreen from './Profile';
import OrderScreen from './Order';
import EditProfileScreen from './editprofile';
import PaymentScreen from './Payment';
import CheckoutScreen from './Checkout';
import ShippingAddressScreen from './ShippingAddress';
// import Products from './Products'; // Removed duplicate import. You already have ProductsScreen
import sales from './assets/sales.png';
import salesImage from './assets/sign.png';
import ChangeLanguageScreen from './language';
import MyFavoritesScreen from './Favourite';
import SpecialOffersScreen from './SpecialOffer';
import PopularProductsScreen from './PopularProducts';
import NewArrivalsScreen from './NewArrivals';
import NotificationsScreen from './Notifications';
import Icon from 'react-native-vector-icons/MaterialIcons';
import './i18n';
import { useTranslation } from 'react-i18next';

// Dummy components for missing screens to avoid errors
const Products = () => <View><Text>Products Screen Placeholder</Text></View>;
const Report = () => <View><Text>Report Screen Placeholder</Text></View>;
const Profile = () => <View><Text>Profile Screen Placeholder</Text></View>;


const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

// --- Context for Dark Mode ---
export const ThemeContext = createContext();

// --- First Page (Intro Screens) ---
const FirstPage = ({ navigation }) => {
    const [showFirstPage, setShowFirstPage] = useState(true);

    const handleNextPage = () => {
        setShowFirstPage(false);
    };

    return (
        <View style={styles.wrapper}>
            {showFirstPage ? (
                <ScrollView style={styles.scrollView}>
                    <View style={styles.app}>
                        <View style={styles.content}>
                            <Image source={sales} alt="Illustration" style={styles.illustration1} />

                            <View style={styles.bottomContent}>
                                <View style={styles.textContainer1}>
                                    <Text style={styles.title}>Effortless Sales Management</Text>
                                    <Text style={styles.description}>
                                        Track your sales in real-time and get actionable insights to boost your
                                        business.
                                    </Text>
                                </View>

                                <View style={styles.pagination}>
                                    <View style={[styles.paginationSpan, styles.activePaginationSpan]} />
                                    <View style={styles.paginationSpan} />
                                </View>
                            </View>

                            <View style={styles.footer}>
                                <TouchableOpacity onPress={handleNextPage} style={styles.nextButton}>
                                    <Text style={styles.buttonText1}>Next</Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    </View>
                </ScrollView>
            ) : (
                <View style={styles.appWrapper2}>
                    <View style={styles.container2}>
                        <View style={styles.imageContainer}>
                            <Image source={salesImage} style={styles.illustration2} />
                        </View>

                        <View style={styles.textWrapper}>
                            <View style={[styles.textContainer2, { marginTop: 40 }]}>
                                <Text style={styles.h2}>
                                    Join us and unlock the power of effortless sales management.
                                </Text>
                                <Text style={styles.p}>Gain real-time sales insights.</Text>
                            </View>

                            <View style={styles.dotsWrapper}>
                                <View style={styles.dotsContainer}>
                                    <View style={styles.dots}>
                                        <View style={styles.dot} />
                                        <View style={[styles.dot, styles.activeDot]} />
                                    </View>
                                </View>
                            </View>
                        </View>

                        <View style={styles.buttonContainer}>
                            <TouchableOpacity
                                onPress={() => navigation.navigate('SignIn')}
                                style={styles.authButton}
                            >
                                <Text style={styles.buttonText2}>Sign In</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                onPress={() => navigation.navigate('SignUp')}
                                style={styles.authButton}
                            >
                                <Text style={styles.buttonText2}>Sign Up</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            )}
        </View>
    );
};

// --- Bottom Tab Navigator ---
const TabIcon = ({ focused, color, size, name, focusedIconName, isDarkMode }) => {
    const animatedValue = React.useRef(new Animated.Value(1)).current;

    const handlePressIn = () => {
        Animated.sequence([
            Animated.timing(animatedValue, { toValue: 0.95, duration: 50, useNativeDriver: true }),
            Animated.timing(animatedValue, { toValue: 1, duration: 50, useNativeDriver: true }),
        ]).start();
    };

    const handlePressOut = () => {
        Animated.timing(animatedValue, { toValue: 1, duration: 200, useNativeDriver: true }).start();
    };

    return (
        <TouchableWithoutFeedback onPressIn={handlePressIn} onPressOut={handlePressOut}>
            <Animated.View style={{ transform: [{ scale: animatedValue }] }}>
                <Icon name={focused ? focusedIconName : name} size={size} color={focused ? (isDarkMode ? 'white' : '#ffdd00') : (isDarkMode ? '#555' : '#8E8E93')} />
            </Animated.View>
        </TouchableWithoutFeedback>
    );
};

const ProfileIcon = ({ focused, size, isDarkMode }) => {
    const animatedValue = React.useRef(new Animated.Value(1)).current;
    const [profileImage, setProfileImage] = useState(null);
    const isFocused = useIsFocused();

    useEffect(() => {
        const loadProfileImage = async () => {
            try {
                const imageUri = await AsyncStorage.getItem('userProfileImage');
                if (imageUri) {
                    setProfileImage({ uri: imageUri });
                } else {
                    setProfileImage(require('./assets/profile.png'));
                }
            } catch (error) {
                console.error('Error loading profile image:', error);
                setProfileImage(require('./assets/profile.png'));
            }
        };

        if (isFocused) {
            loadProfileImage();
        }
        // Added default image load on initial mount as well
        else if (!profileImage) {
             loadProfileImage();
        }
    }, [isFocused, profileImage]); // Added profileImage dependency

    const handlePressIn = () => {
        Animated.sequence([
            Animated.timing(animatedValue, { toValue: 0.95, duration: 50, useNativeDriver: true }),
            Animated.timing(animatedValue, { toValue: 1, duration: 50, useNativeDriver: true }),
        ]).start();
    };

    const handlePressOut = () => {
        Animated.timing(animatedValue, { toValue: 1, duration: 200, useNativeDriver: true }).start();
    };

    // Handle potential loading state or errors
    if (!profileImage) {
        // You might want a placeholder or loading indicator here
        return <View style={{ width: size, height: size, borderRadius: size / 2, backgroundColor: '#ccc' }} />;
    }


    return (
        <TouchableWithoutFeedback onPressIn={handlePressIn} onPressOut={handlePressOut}>
            <Animated.View style={{ transform: [{ scale: animatedValue }] }}>
                <Image
                    source={profileImage}
                    style={{
                        width: size,
                        height: size,
                        borderRadius: size / 2,
                        borderColor: focused ? (isDarkMode ? 'white' : '#ffdd00') : 'transparent',
                        borderWidth: 2,
                    }}
                />
            </Animated.View>
        </TouchableWithoutFeedback>
    );
};

const Dashboard = () => {
    const { t } = useTranslation();
    const { isDarkMode } = useContext(ThemeContext); // Get dark mode from context
    const navigation = useNavigation(); // Get the navigation object

    // No need for useEffect to listen to tabPress here anymore.

    return (
        <Tab.Navigator
            screenOptions={{
                tabBarActiveTintColor: isDarkMode ? 'white' : '#ffdd00',
                tabBarInactiveTintColor: isDarkMode ? '#555' : '#8E8E93',
                tabBarStyle: {
                    backgroundColor: isDarkMode ? '#1e1e1e' : '#FFFFFF',
                    paddingBottom: 5,
                    paddingTop: 5,
                    height: 60,
                    elevation: 10,
                    shadowColor: isDarkMode ? 'white' : '#000',
                    shadowOffset: { width: 0, height: -3 },
                    shadowOpacity: 0.1,
                    shadowRadius: 3,
                    borderTopWidth: 0,
                },
                tabBarShowLabel: true,
                tabBarLabelStyle: {
                    fontSize: 12,
                },
                headerShown: false,
            }}
        >
            <Tab.Screen
                name="ProductsTab" // Changed name to avoid conflict with Stack Screen
                component={ProductsScreen}
                options={{
                    tabBarLabel: ({ focused }) => (
                        <Text style={{ color: focused ? (isDarkMode ? 'white' : '#ffdd00') : (isDarkMode ? '#555' : '#8E8E93'), fontSize: 12 }}>
                            {t('Products')}
                        </Text>
                    ),
                    tabBarIcon: ({ focused, color }) => (
                        <TabIcon focused={focused} color={color} size={24} name="shopping-bag" focusedIconName="shopping-bag" isDarkMode={isDarkMode} />
                    ),
                }}
            />
            <Tab.Screen
                name="CartTab" // Changed name to avoid conflict with Stack Screen
                component={CartScreen}
                options={{
                    tabBarLabel: ({ focused }) => (
                        <Text style={{ color: focused ? (isDarkMode ? 'white' : '#ffdd00') : (isDarkMode ? '#555' : '#8E8E93'), fontSize: 12 }}>
                            {t('Cart')}
                        </Text>
                    ),
                    tabBarIcon: ({ focused, color }) => (
                        <TabIcon focused={focused} color={color} size={24} name="shopping-cart" focusedIconName="shopping-cart" isDarkMode={isDarkMode} />
                    ),
                }}
            />
            <Tab.Screen
                name="OrderTab" // Changed name to avoid conflict with Stack Screen
                component={OrderScreen}
                options={{
                    tabBarLabel: ({ focused }) => (
                        <Text style={{ color: focused ? (isDarkMode ? 'white' : '#ffdd00') : (isDarkMode ? '#555' : '#8E8E93'), fontSize: 12 }}>
                            {t('Orders')}
                        </Text>
                    ),
                    tabBarIcon: ({ focused, color }) => (
                        <TabIcon focused={focused} color={color} size={24} name="assignment" focusedIconName="assignment" isDarkMode={isDarkMode} />
                    ),
                }}
            />
            <Tab.Screen
                name="ProfileTab" // Changed name to avoid conflict with Stack Screen
                component={ProfileScreen}
                options={{
                    tabBarLabel: ({ focused }) => (
                        <Text style={{ color: focused ? (isDarkMode ? 'white' : '#ffdd00') : (isDarkMode ? '#555' : '#8E8E93'), fontSize: 12 }}>
                            {t('Profile')}
                        </Text>
                    ),
                    tabBarIcon: ({ focused }) => (
                        <ProfileIcon focused={focused} size={24} isDarkMode={isDarkMode} />
                    ),
                }}
            />
        </Tab.Navigator>
    );
};



// --- Main App Component ---
const MainApp = () => {
    const [showSplash, setShowSplash] = useState(true);
    const [isDarkMode, setIsDarkMode] = useState(false); // Dark mode state, initially false

    // Load dark mode preference ONCE when the app starts.
    useEffect(() => {
        const loadDarkMode = async () => {
            try {
                const darkModeValue = await AsyncStorage.getItem('darkMode');
                // Only set isDarkMode if a value exists in AsyncStorage.
                if (darkModeValue !== null) {
                    setIsDarkMode(darkModeValue === 'true');
                }
            } catch (error) {
                console.error('Error loading dark mode preference:', error);
            }
        };
        loadDarkMode();
    }, []); // Empty dependency array: runs ONCE on mount.

    useEffect(() => {
        const timer = setTimeout(() => {
            setShowSplash(false);
        }, 3000);

        return () => clearTimeout(timer);
    }, []);

    return (
        // Provide the isDarkMode state and its setter to the entire app.
        <ThemeContext.Provider value={{ isDarkMode, setIsDarkMode }}>
          {/* // <-- 2. تم تغليف NavigationContainer بـ StripeProvider --> */}
          <StripeProvider
            publishableKey={STRIPE_PUBLISHABLE_KEY} // <-- comes from EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY (.env)
            // merchantIdentifier="merchant.com.your_app_name" // <-- لو بتستخدم Apple Pay، شيل الكومنت وحط الـ ID بتاعك
          >
            <NavigationContainer>
                {/* <-- مهم: غيرت أسماء الشاشات المكررة عشان متبقاش زي أسماء مكونات التاب --> */}
                <Stack.Navigator initialRouteName={showSplash ? "Splash" : "FirstPage"}>
                    {showSplash ? (
                        <Stack.Screen name="Splash" component={SplashScreen} options={{ headerShown: false }} />
                    ) : (
                        <Stack.Screen name="FirstPage" component={FirstPage} options={{ headerShown: false }} />
                    )}
                    <Stack.Screen name="SignUp" component={SignUp} options={{ headerShown: false }} />
                    <Stack.Screen name="SignIn" component={SignInScreen} options={{ headerShown: false }} />
                    <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} options={{ headerShown: false }} />
                    <Stack.Screen name="VerifyEmail" component={VerifyEmailScreen} options={{ headerShown: false }} />
                    <Stack.Screen name="ResetPassword" component={ResetPasswordScreen} options={{ headerShown: false }} />
                    <Stack.Screen name="Dashboard" component={Dashboard} options={{ headerShown: false }} />
                    {/* Removed duplicate/conflicting screen names */}
                    {/* <Stack.Screen name="Products" component={ProductsScreen} options={{ headerShown: false }} /> */}
                    <Stack.Screen name="ReportScreen" component={Report} options={{ title: 'Report' }} />
                    <Stack.Screen name="EditProfile" component={EditProfileScreen} options={{ headerShown: false }} />
                    {/* <Stack.Screen name="Profile" component={ProfileScreen} options={{ title: 'Profile' }} /> */}
                    <Stack.Screen
                        name="MyFavorites"
                        component={MyFavoritesScreen}
                        options={{ headerShown: false }}
                    />
                    <Stack.Screen
                        name="SpecialOffersScreen"
                        component={SpecialOffersScreen}
                        options={{ headerShown: false }}
                    />
                    <Stack.Screen
                        name="PopularProductsScreen"
                        component={PopularProductsScreen}
                        options={{ headerShown: false }}
                    />
                    <Stack.Screen
                        name="NewArrivalsScreen"
                        component={NewArrivalsScreen}
                        options={{ headerShown: false }}
                    />
                    {/* <Stack.Screen
                        name="Cart"
                        component={CartScreen}
                        options={{ headerShown: false }}
                    /> */}
                     {/* Real Payment and Checkout screens (wired to Payment.js / Checkout.js) */}
                    <Stack.Screen name="Payment" component={PaymentScreen} options={{ headerShown: false }} />
                    <Stack.Screen name="PaymentScreen" component={PaymentScreen} options={{ headerShown: false }} />
                    <Stack.Screen name="Checkout" component={CheckoutScreen} options={{ headerShown: false }} />
                    <Stack.Screen name="CheckoutScreen" component={CheckoutScreen} options={{ headerShown: false }} />
                    <Stack.Screen name="ShippingAddress" component={ShippingAddressScreen} options={{ headerShown: false }} />
                     {/* Order tracking screen (both route names point to the real Order screen) */}
                    <Stack.Screen name="OrderTracking" component={OrderScreen} options={{ headerShown: false }}/>
                    <Stack.Screen name="Order" component={OrderScreen} options={{ headerShown: false }}/>

                    <Stack.Screen
                        name="ChangeLanguage"
                        component={ChangeLanguageScreen}
                        options={{ headerShown: false }}
                    />
                    <Stack.Screen
                        name="Notifications"
                        component={NotificationsScreen}
                        options={{ headerShown: false }}
                    />
                </Stack.Navigator>
            </NavigationContainer>
          </StripeProvider>
        </ThemeContext.Provider>
    );
};

// Dummy Payment/Checkout placeholders removed — the app now uses the real
// PaymentScreen (Payment.js) and CheckoutScreen (Checkout.js) imported above.
// Make sure OrderScreen is defined if not imported correctly
// const OrderScreen = ({navigation, route}) => (
//      <View style={{flex: 1, justifyContent: 'center', alignItems: 'center'}}>
//         <Text>Order Tracking Placeholder</Text>
//         <Text>Order ID: {route.params?.orderId}</Text>
//      </View>
// );


const styles = StyleSheet.create({
    wrapper: {
      flex: 1,
      backgroundColor: '#fff', // Assuming default light mode background
    },
    scrollView: {
      flex: 1,
      backgroundColor: '#fff',
    },
    app: {
      flex: 1,
      // height: '100vh', // Avoid 'vh' in React Native, use flex or Dimensions API
      justifyContent: 'space-between',
    },
    content: {
      flexGrow: 1,
      // display: 'flex', // Flex is default in React Native View
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: 20,
    },
    illustration1: {
       // Avoid percentage width like '400%', set a reasonable width or use Dimensions
      width: 300, // Example width
      height: 300, // Example height
      maxWidth: '90%', // Ensure it doesn't exceed screen width
      resizeMode: 'contain',
      marginBottom: 20, // Added margin
    },
    textContainer1: {
      width: '90%', // Adjusted width
      marginBottom: 10,
    },
    title: {
      fontSize: 24,
      fontWeight: 'bold',
      marginBottom: 5,
      textAlign: 'center',
    },
    description: {
      textAlign: 'center',
      marginBottom: 10,
      color: '#555', // Added color for better visibility
      paddingHorizontal: 10, // Added padding
    },
    pagination: {
      // display: 'flex', // Flex is default
      flexDirection: 'row',
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: 20,
      marginTop: 20, // Added margin top
    },
    paginationSpan: {
      width: 10,
      height: 10,
      borderRadius: 5,
      backgroundColor: '#ddd',
      marginHorizontal: 5,
    },
    activePaginationSpan: {
      backgroundColor: '#ffd700', // Ensure contrast
    },
    footer: {
      padding: 20,
      width: '100%', // Ensure footer takes full width
       marginTop: 30, // Added margin top
      // Removed absolute positioning for better flow in ScrollView
    },
    nextButton: {
      width: '100%',
      paddingVertical: 15, // Added vertical padding
      paddingHorizontal: 15,
      backgroundColor: '#ffdd00', // Ensure contrast
      // color: 'black', // Text color is set in Text component
      borderWidth: 0,
      borderRadius: 25, // Make it rounded
      alignItems: 'center', // Center text
    },
    buttonText1: {
      color: '#000',
      fontSize: 18,
      fontWeight: 'bold',
      textAlign: 'center',
    },
    bottomContent: {
      // Removed absolute positioning
      alignItems: 'center',
      paddingHorizontal: 20, // Use horizontal padding
      width: '100%', // Ensure full width
    },
    // Styles for the second intro page
    appWrapper2: {
      flex: 1,
      justifyContent: 'space-around', // Adjusted distribution
      alignItems: 'center',
      backgroundColor: '#fff',
      padding: 20, // Added padding to wrapper
    },
    container2: {
      flex: 1, // Allow container to take available space
      width: '100%',
      justifyContent: 'center', // Center content vertically
      alignItems: 'center',
    },
    imageContainer: {
      marginBottom: 30, // Increased margin
      alignItems: 'center', // Center image
    },
    illustration2: {
      width: 250, // Adjusted size
      height: 250,
      resizeMode: 'contain',
    },
    textWrapper: {
      width: '100%',
      alignItems: 'center',
      // marginTop: 10, // Removed fixed margin top
      marginBottom: 30, // Added margin bottom
    },
    textContainer2: {
      width: '90%', // Adjusted width
      marginBottom: 20, // Adjusted margin
      // marginTop: 40 // Removed fixed margin top
    },
    h2: {
      fontSize: 22, // Slightly smaller
      fontWeight: 'bold',
      color: '#222',
      textAlign: 'center',
      marginBottom: 10,
    },
    p: {
      fontSize: 16,
      color: '#555',
      textAlign: 'center',
    },
    dotsWrapper: {
      marginTop: 30, // Adjusted margin
      marginBottom: 30, // Added margin
    },
    dotsContainer: {
      // marginBottom: 15, // Removed margin
    },
    dots: {
      flexDirection: 'row',
      justifyContent: 'center',
    },
    dot: {
      width: 10,
      height: 10,
      borderRadius: 5,
      backgroundColor: '#ddd',
      marginHorizontal: 5,
    },
    activeDot: {
      backgroundColor: '#ffd700', // Ensure contrast
    },
    buttonContainer: {
      width: '90%', // Adjusted width
      alignItems: 'center',
      marginTop: 20, // Added margin top
    },
    authButton: {
      backgroundColor: '#ffd700', // Ensure contrast
      paddingVertical: 15, // Use vertical padding
      paddingHorizontal: 15,
      width: '100%', // Make buttons take full width of container
      marginBottom: 15,
      alignItems: 'center',
      borderRadius: 25, // Make it rounded
    },
    buttonText2: {
      color: '#000', // Ensure contrast
      fontSize: 18,
      fontWeight: 'bold',
      textAlign: 'center',
    },
    // Removed unused placeholder styles
  });
export default MainApp;

// --- Add Dummy Screens if not imported properly ---
import { Button } from 'react-native'; // Import Button if not already

// Make sure these exist if not imported
// const PaymentScreen = ({ navigation }) => <View><Text>Payment</Text><Button title="Go Checkout" onPress={() => navigation.navigate('Checkout')} /></View>;
// const CheckoutScreen = ({ navigation }) => <View><Text>Checkout</Text><Button title="Go Track" onPress={() => navigation.navigate('OrderTracking')} /></View>;
// const OrderScreen = () => <View><Text>Order Tracking</Text></View>;