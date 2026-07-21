// Dashboard.js
import React, { useState, useEffect } from 'react';
import { Text, Image, View, StyleSheet, Animated } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useIsFocused } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import './i18n';
import { useDarkMode } from './DarkModeContext';
import AsyncStorage from '@react-native-async-storage/async-storage';

// --- Importing Screens ---
import ProductsScreen from './Products';
import CartScreen from './Cart';
import ProfileScreen from './Profile';
import OrderScreen from './Order';

// --- Tab Navigation and Icons ---

const TabIcon = ({ size, imagePath, focused }) => {
    const [scale] = useState(new Animated.Value(1));

    useEffect(() => {
        Animated.spring(scale, {
            toValue: focused ? 1.2 : 1,
            friction: 3,
            useNativeDriver: false,
        }).start();
    }, [focused]);

    return (
        <Animated.View style={{ transform: [{ scale: scale }] }}>
            <Image
                source={imagePath}
                style={[styles.icon, { width: size, height: size }]}
            />
        </Animated.View>
    );
};


const ProfileIcon = ({ focused, size, isDarkMode, borderImagePath }) => {
    const [profileImage, setProfileImage] = useState(null);
    const [scale] = useState(new Animated.Value(1));
    const borderSize = size + 8; // Border size relative to the *passed* size

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

        loadProfileImage();
    }, []);

    useEffect(() => {
      Animated.spring(scale, {
          toValue: focused ? 1.2 : 1,
          friction: 3,
          useNativeDriver: false,
      }).start();
    }, [focused]);

    const displayImage = profileImage || require('./assets/profile.png');

    return (
        <Animated.View style={{ width: borderSize, height: borderSize, alignItems: 'center', justifyContent: 'center', transform: [{scale: scale}] }}>
            {/* Profile Image - Centered */}
            <Image
                source={displayImage}
                style={[
                    styles.profileIcon,
                    {
                        width: size,  // Use the passed size
                        height: size, // Use the passed size
                        borderRadius: size / 2,
                    },
                ]}
            />

            {/* Conditionally render the border */}
            {borderImagePath ? (
                <Image
                    source={borderImagePath}
                    style={{
                        position: 'absolute',
                        width: borderSize,
                        height: borderSize,
                        borderRadius: borderSize / 2,
                    }}
                />
            ) : (
                focused && isDarkMode && (
                    <View
                        style={{
                            position: 'absolute',
                            width: borderSize,
                            height: borderSize,
                            borderRadius: borderSize / 2,
                            borderColor: 'white',
                            borderWidth: 2,
                        }}
                    />
                )
            )}
        </Animated.View>
    );
};

const Tab = createBottomTabNavigator();

const Dashboard = () => {
    const { t } = useTranslation();
    const { isDarkMode } = useDarkMode();
    const iconSize = 32;          // Standard icon size
    const profileIconSize = 24;   // Smaller size for the profile icon  <-- REDUCED SIZE HERE

    const getScreenOptions = () => ({
        tabBarStyle: [
            styles.tabBar,
            {
                backgroundColor: isDarkMode ? '#1e1e1e' : '#FFFFFF',
            },
        ],
        tabBarShowLabel: true,
        headerShown: false,
    });

    return (
        <Tab.Navigator screenOptions={getScreenOptions}>
            <Tab.Screen
                name="Products"
                component={ProductsScreen}
                options={({ route }) => {
                    const isFocused = useIsFocused() && route.name === "Products";
                    return {
                        tabBarLabel: ({ focused }) => (
                            <Animated.Text style={[
                                styles.tabBarLabel,
                                {
                                    color: focused ? (isDarkMode ? 'white' : '#000') : (isDarkMode ? '#555' : 'gray'),
                                }
                            ]}>
                                {t('Products')}
                            </Animated.Text>
                        ),
                        tabBarIcon: ({ focused }) => (
                            <TabIcon focused={focused} size={iconSize} imagePath={require('./assets/products.png')} />
                        ),
                    }
                }}
            />
            <Tab.Screen
                name="Cart"
                component={CartScreen}
                options={({ route }) => {
                    const isFocused = useIsFocused() && route.name === "Cart";
                    return {
                        tabBarLabel: ({ focused }) => (
                            <Animated.Text style={[styles.tabBarLabel, { color: focused ? (isDarkMode ? 'white' : '#000') : (isDarkMode ? '#555' : 'gray') }]}>
                                {t('Cart')}
                            </Animated.Text>
                        ),
                        tabBarIcon: ({ focused }) => (
                            <TabIcon focused={focused} size={iconSize} imagePath={require('./assets/cart.png')} />
                        ),
                    };
                }}
            />
            <Tab.Screen
                name="Order"
                component={OrderScreen}
                options={({ route }) => {
                  const isFocused = useIsFocused() && route.name === "Order";
                    return {
                        tabBarLabel: ({ focused }) => (
                            <Animated.Text style={[styles.tabBarLabel, { color: focused ? (isDarkMode ? 'white' : '#000') : (isDarkMode ? '#555' : 'gray') }]}>
                                {t('Orders')}
                            </Animated.Text>
                        ),
                        tabBarIcon: ({ focused }) => (
                            <TabIcon focused={focused} size={iconSize} imagePath={require('./assets/order.png')} />
                        ),
                    };
                }}
            />
            <Tab.Screen
                name="Profile"
                component={ProfileScreen}
                options={({ route }) => {
                  const isFocused = useIsFocused() && route.name === "Profile";
                    return {
                        tabBarLabel: ({ focused }) => (
                            <Animated.Text style={[styles.tabBarLabel, { color: focused ? (isDarkMode ? 'white' : '#000') : (isDarkMode ? '#555' : 'gray') }]}>
                                {t('Profile')}
                            </Animated.Text>
                        ),
                        tabBarIcon: ({ focused }) => (
                            <ProfileIcon
                                focused={focused}
                                size={profileIconSize}  // Using the reduced size
                                isDarkMode={isDarkMode}
                                borderImagePath={require('./assets/circle.png')}
                            />
                        ),
                    };
                }}
            />
        </Tab.Navigator>
    );
};

const styles = StyleSheet.create({
    icon: {
        // Common icon styles
    },
    profileIcon: {
        // Profile-specific styles
    },
    tabBar: {
        paddingBottom: 5,
        paddingTop: 5,
        height: 60,
        elevation: 10,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -3 },
        shadowOpacity: 0.1,
        shadowRadius: 3,
        borderTopWidth: 0,
    },
    tabBarLabel: {
        fontSize: 12,
    },
});

export default Dashboard;