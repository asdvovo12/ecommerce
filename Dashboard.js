// Dashboard.js
import React, { useState, useEffect, useRef } from 'react';
import { Image, View, StyleSheet, Animated } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useTranslation } from 'react-i18next';
import './i18n';
import { useDarkMode } from './DarkModeContext';
import AsyncStorage from '@react-native-async-storage/async-storage';

// --- Screens ---
import ProductsScreen from './Products';
import CartScreen from './Cart';
import ProfileScreen from './Profile';
import OrderScreen from './Order';

const Tab = createBottomTabNavigator();

// لون الايقونة/النص حسب الثيم والحالة
const getTabColor = (focused, isDarkMode) =>
  focused ? (isDarkMode ? '#ffffff' : '#ffdd00') : (isDarkMode ? '#555' : '#8E8E93');

// --- Tab Icon (من assets) ---
const TabIcon = ({ size, imagePath, focused, isDarkMode }) => {
  const scale = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.spring(scale, {
      toValue: focused ? 1.2 : 1,
      friction: 3,
      useNativeDriver: true,
    }).start();
  }, [focused]);

  return (
    <Animated.View style={{ transform: [{ scale }] }}>
      <Image
        source={imagePath}
        resizeMode="contain"
        style={{
          width: size,
          height: size,
          // ✅ ده اللي بيخلي الايقونة تبان وتتلون. لو صورك ملوّنة أصلاً (مش لون واحد) امسح السطر ده
          tintColor: getTabColor(focused, isDarkMode),
        }}
      />
    </Animated.View>
  );
};

// --- Profile Icon (صورة البروفايل) ---
const ProfileIcon = ({ focused, size, isDarkMode, borderImagePath }) => {
  const [profileImage, setProfileImage] = useState(null);
  const scale = useRef(new Animated.Value(1)).current;
  const borderSize = size + 8;

  useEffect(() => {
    const loadProfileImage = async () => {
      try {
        const imageUri = await AsyncStorage.getItem('userProfileImage');
        setProfileImage(imageUri ? { uri: imageUri } : require('./assets/profile.png'));
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
      useNativeDriver: true,
    }).start();
  }, [focused]);

  const displayImage = profileImage || require('./assets/profile.png');

  return (
    <Animated.View
      style={{
        width: borderSize,
        height: borderSize,
        alignItems: 'center',
        justifyContent: 'center',
        transform: [{ scale }],
      }}
    >
      <Image
        source={displayImage}
        resizeMode="cover"
        style={{ width: size, height: size, borderRadius: size / 2 }}
      />
      {borderImagePath ? (
        <Image
          source={borderImagePath}
          resizeMode="contain"
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

const Dashboard = () => {
  const { t } = useTranslation();
  const { isDarkMode } = useDarkMode();

  const iconSize = 28;
  const profileIconSize = 24;

  const screenOptions = {
    tabBarStyle: [styles.tabBar, { backgroundColor: isDarkMode ? '#1e1e1e' : '#FFFFFF' }],
    tabBarShowLabel: true,
    headerShown: false,
  };

  return (
    <Tab.Navigator screenOptions={screenOptions}>
      <Tab.Screen
        name="Products"
        component={ProductsScreen}
        options={{
          tabBarLabel: ({ focused }) => (
            <Animated.Text style={[styles.tabBarLabel, { color: getTabColor(focused, isDarkMode) }]}>
              {t('Products')}
            </Animated.Text>
          ),
          tabBarIcon: ({ focused }) => (
            <TabIcon focused={focused} size={iconSize} isDarkMode={isDarkMode} imagePath={require('./assets/products.png')} />
          ),
        }}
      />
      <Tab.Screen
        name="Cart"
        component={CartScreen}
        options={{
          tabBarLabel: ({ focused }) => (
            <Animated.Text style={[styles.tabBarLabel, { color: getTabColor(focused, isDarkMode) }]}>
              {t('Cart')}
            </Animated.Text>
          ),
          tabBarIcon: ({ focused }) => (
            <TabIcon focused={focused} size={iconSize} isDarkMode={isDarkMode} imagePath={require('./assets/cart.png')} />
          ),
        }}
      />
      <Tab.Screen
        name="Order"
        component={OrderScreen}
        options={{
          tabBarLabel: ({ focused }) => (
            <Animated.Text style={[styles.tabBarLabel, { color: getTabColor(focused, isDarkMode) }]}>
              {t('Orders')}
            </Animated.Text>
          ),
          tabBarIcon: ({ focused }) => (
            <TabIcon focused={focused} size={iconSize} isDarkMode={isDarkMode} imagePath={require('./assets/order.png')} />
          ),
        }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{
          tabBarLabel: ({ focused }) => (
            <Animated.Text style={[styles.tabBarLabel, { color: getTabColor(focused, isDarkMode) }]}>
              {t('Profile')}
            </Animated.Text>
          ),
          tabBarIcon: ({ focused }) => (
            <ProfileIcon
              focused={focused}
              size={profileIconSize}
              isDarkMode={isDarkMode}
              borderImagePath={require('./assets/circle.png')}
            />
          ),
        }}
      />
    </Tab.Navigator>
  );
};

const styles = StyleSheet.create({
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