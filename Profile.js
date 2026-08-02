// Profile.js
import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  ScrollView,
  Alert,
  Animated,
  I18nManager,
} from 'react-native';
import { AntDesign, Ionicons, FontAwesome } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTranslation } from 'react-i18next';
import './i18n';
import { useDarkMode } from './DarkModeContext';

/* ============================================================
   ✅ إعداد السويتش لكل لغة على حدة — عدّل هنا براحتك
   start  : الدايرة تقف فين وهي مقفولة  → 'left' أو 'right'
   moveTo : تروح فين لما تفتح            → 'left' أو 'right'
   ⚠️ لازم يكونوا مختلفين وإلا الدايرة مش هتتحرك
   ============================================================ */
const SWITCH_CONFIG = {
  en: { start: 'left',  moveTo: 'right' },   // 👈 الإنجليزي
  ar: { start: 'right', moveTo: 'left'  },   // 👈 العربي
};

// --- Switch Constants ---
const SWITCH_WIDTH = 62;
const THUMB_SIZE = 22;
const PADDING = 2;
const BORDER = 1;
const TRACK_HEIGHT = THUMB_SIZE + PADDING * 2 + 2;
const TRACK_ICON_SIZE = 14;
const TRAVEL = SWITCH_WIDTH - BORDER * 2 - PADDING * 2 - THUMB_SIZE; // = 34

const switchColors = {
  lightBg: '#424242',
  thumbLight: '#E0E0E0',
  iconLightColor: '#9E9E9E',
  darkBg: '#BDBDBD',
  thumbDark: '#424242',
  iconDarkColor: '#FFEB3B',
};

const ProfileScreen = () => {
  const { t, i18n } = useTranslation();
  const navigation = useNavigation();
  const [profileImage, setProfileImage] = useState(null);
  const [defaultImage] = useState(require('./assets/profile.png'));
  const [userName, setUserName] = useState('');
  const [userEmail, setUserEmail] = useState('');
  const [userRegion, setUserRegion] = useState('');
  const [userBirthDate, setUserBirthDate] = useState('');
  const { isDarkMode, toggleDarkMode } = useDarkMode();

  const isRTL = i18n.language === 'ar' || I18nManager.isRTL;

  /* ---------- منطق السويتش ---------- */
  // اختار الإعداد حسب اللغة الحالية
  const cfg = SWITCH_CONFIG[i18n.language === 'ar' ? 'ar' : 'en'] || SWITCH_CONFIG.en;

  // نقطة البداية كموضع فيزيائي حقيقي (مش متأثرة بقلب RTL)
  const startRow =
    cfg.start === 'left'
      ? (I18nManager.isRTL ? 'row-reverse' : 'row')
      : (I18nManager.isRTL ? 'row-reverse' : 'row');

  // اتجاه الحركة: +1 يمين ، -1 شمال
  const direction = cfg.moveTo === 'right' ? 1 : -1;

  // --- Animation ---
  const switchAnimatedValue = useRef(new Animated.Value(isDarkMode ? 1 : 0)).current;
  const sunOpacity = useRef(new Animated.Value(isDarkMode ? 1 : 0)).current;
  const moonOpacity = useRef(new Animated.Value(isDarkMode ? 0 : 1)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(switchAnimatedValue, {
        toValue: isDarkMode ? 1 : 0,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(sunOpacity, {
        toValue: isDarkMode ? 1 : 0,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(moonOpacity, {
        toValue: isDarkMode ? 0 : 1,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start();
  }, [isDarkMode, switchAnimatedValue, sunOpacity, moonOpacity]);

  const thumbTranslateX = switchAnimatedValue.interpolate({
    inputRange: [0, 1],
    outputRange: [0, TRAVEL * direction],
  });

  // --- Functions ---
  const saveProfileImage = async (imageUri) => {
    if (!imageUri) return;
    try {
      await AsyncStorage.setItem('userProfileImage', imageUri);
    } catch (error) {
      console.error('Error saving profile image:', error);
    }
  };

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 1,
    });

    if (!result.canceled && result.assets && result.assets[0]) {
      const newUri = result.assets[0].uri;
      setProfileImage(newUri);
      await saveProfileImage(newUri);
    }
  };

  const loadProfileData = async () => {
    try {
      const storedImage = await AsyncStorage.getItem('userProfileImage');
      setProfileImage(storedImage);

      const loggedInEmail = await AsyncStorage.getItem('loggedInEmail');
      if (loggedInEmail) {
        const storedUserData = await AsyncStorage.getItem(`user:${loggedInEmail}`);
        if (storedUserData) {
          const userData = JSON.parse(storedUserData);
          setUserName(userData.username || '');
          setUserEmail(userData.email || loggedInEmail);
          setUserRegion(userData.region || '');
          setUserBirthDate(userData.birthDate || '');
        } else {
          setUserEmail(loggedInEmail);
          setUserName('');
          setUserRegion('');
          setUserBirthDate('');
        }
      } else {
        setUserName('');
        setUserEmail('');
        setUserRegion('');
        setUserBirthDate('');
        setProfileImage(null);
      }
    } catch (error) {
      console.error('Error loading profile data:', error);
      setUserName('');
      setUserEmail('');
      setUserRegion('');
      setUserBirthDate('');
      setProfileImage(null);
    }
  };

  const clearProfileImage = async () => {
    try {
      await AsyncStorage.removeItem('userProfileImage');
      setProfileImage(null);
    } catch (error) {
      console.error('Error clearing profile image:', error);
    }
  };

  useFocusEffect(
    React.useCallback(() => {
      loadProfileData();
    }, [])
  );

  const handleLogout = async () => {
    try {
      const loggedInEmail = await AsyncStorage.getItem('loggedInEmail');
      const keysToRemove = ['userProfileImage', 'isLoggedIn', 'loggedInEmail'];
      if (loggedInEmail) keysToRemove.push(`user:${loggedInEmail}`);
      await AsyncStorage.multiRemove(keysToRemove);

      setUserName('');
      setUserEmail('');
      setUserRegion('');
      setUserBirthDate('');
      setProfileImage(null);

      navigation.reset({ index: 0, routes: [{ name: 'FirstPage' }] });
    } catch (error) {
      console.error('Error during logout:', error);
    }
  };

  const showImageOptions = () => {
    Alert.alert(
      t('Choose an option'),
      '',
      [
        { text: t('Choose from Library'), onPress: pickImage },
        { text: t('Remove Photo'), onPress: clearProfileImage, style: 'destructive' },
        { text: t('Cancel'), style: 'cancel' },
      ],
      { cancelable: true }
    );
  };

  const handleToggleDarkMode = async () => {
    const newValue = !isDarkMode;
    await toggleDarkMode();

    navigation.setOptions({
      tabBarStyle: {
        backgroundColor: newValue ? '#1e1e1e' : '#FFFFFF',
        paddingBottom: 5,
        paddingTop: 5,
        height: 60,
        elevation: 10,
        shadowColor: newValue ? 'white' : '#000',
        shadowOffset: { width: 0, height: -3 },
        shadowOpacity: 0.1,
        shadowRadius: 3,
        borderTopWidth: 0,
      },
      tabBarActiveTintColor: newValue ? 'white' : '#ffdd00',
      tabBarInactiveTintColor: newValue ? '#555' : '#8E8E93',
    });
  };

  const handleProfileUpdate = (updatedData) => {
    setUserName(updatedData.name);
    setUserEmail(updatedData.email);
    setUserRegion(updatedData.region);
    setUserBirthDate(updatedData.birthDate);
    if (updatedData.profileImage !== profileImage) {
      setProfileImage(updatedData.profileImage);
      saveProfileImage(updatedData.profileImage);
    }
  };

  const usernameHandle = userName
    ? `@${userName.replace(/\s+/g, '').toLowerCase()}`
    : `@${t('username')}`;

  return (
    <ScrollView
      style={[styles.container, isDarkMode && styles.darkContainer]}
      contentContainerStyle={styles.scrollContent}
    >
      {/* Header */}
      <View style={[styles.header, isDarkMode && styles.darkHeader]}>
        <Text style={[styles.title, isDarkMode && styles.darkTitle]}>{t('My Profile')}</Text>
      </View>

      {/* Profile Info */}
      <View style={[styles.profileInfo, isDarkMode && styles.darkProfileInfo]}>
        <TouchableOpacity style={styles.profileImageContainer} onPress={showImageOptions}>
          <Image
            source={(profileImage && { uri: profileImage }) || defaultImage}
            style={styles.profileImage}
          />
        </TouchableOpacity>

        <View style={styles.userInfo}>
          <Text style={[styles.name, isDarkMode && styles.darkText]}>
            {userName || t('Your Name')}
          </Text>
          <Text style={[styles.username, isDarkMode && styles.darkText]}>{usernameHandle}</Text>
          <Text style={[styles.email, isDarkMode && styles.darkText]}>{userEmail}</Text>
        </View>

        <TouchableOpacity
          style={[styles.editButton, isDarkMode && styles.darkEditButton]}
          onPress={() => {
            navigation.navigate('EditProfile', {
              name: userName,
              email: userEmail,
              region: userRegion,
              birthDate: userBirthDate,
              profileImage: profileImage,
              onSave: handleProfileUpdate,
              language: i18n.language,
            });
          }}
        >
          <Text style={[styles.editButtonText, isDarkMode && styles.darkEditButtonText]}>
            {t('Edit Profile')}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Options */}
      <View style={styles.options}>
        {/* Favourites */}
        <TouchableOpacity
          style={[
            styles.option,
            styles.optionSeparator,
            isDarkMode && styles.darkOption,
            isDarkMode && styles.darkOptionSeparator,
          ]}
          onPress={() => navigation.navigate('MyFavorites')}
        >
          <View style={styles.optionContent}>
            <FontAwesome
              name="heart-o"
              size={22}
              color={isDarkMode ? 'white' : '#ffdd00'}
              style={styles.optionIcon}
            />
            <Text style={[styles.optionLabel, isDarkMode && styles.darkText]}>
              {t('Favourites')}
            </Text>
          </View>
          <AntDesign
            name={isRTL ? 'left' : 'right'}
            size={18}
            color={isDarkMode ? '#aaa' : '#ccc'}
          />
        </TouchableOpacity>

        {/* Dark Mode */}
        <View
          style={[
            styles.option,
            styles.optionSeparator,
            isDarkMode && styles.darkOption,
            isDarkMode && styles.darkOptionSeparator,
          ]}
        >
          <View style={styles.optionContent}>
            <Ionicons
              name="bulb-outline"
              size={22}
              color={isDarkMode ? '#fff' : '#ffdd00'}
              style={styles.optionIcon}
            />
            <Text style={[styles.optionLabel, isDarkMode && styles.darkText]}>
              {t('Dark Mode')}
            </Text>
          </View>

          {/* ✅ السويتش */}
          <TouchableOpacity
            activeOpacity={0.85}
            onPress={handleToggleDarkMode}
            accessibilityRole="switch"
            accessibilityState={{ checked: isDarkMode }}
            accessibilityLabel={t('Dark Mode')}
            style={[
              styles.switchTrack,
              {
                flexDirection: startRow,
                backgroundColor: isDarkMode ? switchColors.darkBg : switchColors.lightBg,
                borderColor: isDarkMode ? switchColors.darkBg : switchColors.lightBg,
              },
            ]}
          >
            {/* أيقونات الخلفية */}
            <View style={[styles.iconsOverlay, { flexDirection: startRow }]} pointerEvents="none">
              <Animated.View style={[styles.iconSlot, { opacity: sunOpacity }]}>
                <Ionicons name="sunny" size={TRACK_ICON_SIZE} color={switchColors.iconDarkColor} />
              </Animated.View>
              <Animated.View style={[styles.iconSlot, { opacity: moonOpacity }]}>
                <Ionicons name="moon" size={TRACK_ICON_SIZE} color={switchColors.iconLightColor} />
              </Animated.View>
            </View>

            {/* الدايرة */}
            <Animated.View
              style={[
                styles.thumb,
                {
                  backgroundColor: isDarkMode ? switchColors.thumbDark : switchColors.thumbLight,
                  transform: [{ translateX: thumbTranslateX }],
                },
              ]}
            />
          </TouchableOpacity>
        </View>

        {/* Language */}
        <TouchableOpacity
          style={[styles.option, isDarkMode && styles.darkOption]}
          onPress={() => navigation.navigate('ChangeLanguage')}
        >
          <View style={styles.optionContent}>
            <Ionicons
              name="globe-outline"
              size={22}
              color={isDarkMode ? '#fff' : '#ffdd00'}
              style={styles.optionIcon}
            />
            <Text style={[styles.optionLabel, isDarkMode && styles.darkText]}>{t('Language')}</Text>
          </View>
          <AntDesign
            name={isRTL ? 'left' : 'right'}
            size={18}
            color={isDarkMode ? '#aaa' : '#ccc'}
          />
        </TouchableOpacity>

        {/* Logout */}
        <TouchableOpacity
          style={[styles.option, isDarkMode && styles.darkOption]}
          onPress={handleLogout}
        >
          <View style={styles.optionContent}>
            <Ionicons name="log-out-outline" size={22} color="#FF5757" style={styles.optionIcon} />
            <Text style={[styles.optionLabel, styles.logoutOptionText]}>{t('Log out')}</Text>
          </View>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8f8f8' },
  darkContainer: { backgroundColor: '#121212' },
  scrollContent: { flexGrow: 1, paddingBottom: 20 },

  header: {
    paddingTop: 16,
    paddingBottom: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#EFEFEF',
    backgroundColor: '#fff',
  },
  darkHeader: { borderBottomColor: '#333', backgroundColor: '#1e1e1e' },
  title: { fontSize: 18, fontWeight: 'bold', textAlign: 'center', color: '#000' },
  darkTitle: { color: '#fff' },

  profileInfo: {
    alignItems: 'center',
    paddingVertical: 20,
    paddingHorizontal: 16,
    backgroundColor: '#fff',
  },
  darkProfileInfo: { backgroundColor: '#1e1e1e' },
  profileImageContainer: {
    marginBottom: 16,
    width: 116,
    height: 116,
    borderRadius: 58,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.15,
    shadowRadius: 2,
    elevation: 3,
    backgroundColor: '#e0e0e0',
  },
  profileImage: { width: '100%', height: '100%', borderRadius: 58 },
  userInfo: { alignItems: 'center', marginBottom: 16 },
  name: { fontSize: 18, fontWeight: 'bold', color: '#333' },
  username: { fontSize: 16, color: '#777777', marginTop: 2 },
  email: { fontSize: 14, color: '#777777', marginTop: 4 },
  darkText: { color: '#e0e0e0' },

  editButton: {
    backgroundColor: '#ffdd00',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 20,
    elevation: 10,
    shadowColor: '#ffdd00',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 10,
  },
  darkEditButton: {
    backgroundColor: '#555',
    elevation: 10,
    shadowColor: '#FFFFFF',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 10,
  },
  editButtonText: { color: '#333', fontSize: 16, fontWeight: 'bold' },
  darkEditButtonText: { color: '#fff' },

  options: {},
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    paddingHorizontal: 16,
    backgroundColor: '#fff',
    minHeight: 50,
  },
  darkOption: { backgroundColor: '#1e1e1e' },
  optionSeparator: { borderBottomWidth: 1, borderBottomColor: '#f0f0f0' },
  darkOptionSeparator: { borderBottomColor: '#333' },
  optionContent: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  optionIcon: { width: 24, textAlign: 'center', marginHorizontal: 8 },
  optionLabel: { fontSize: 16, color: '#333', flexShrink: 1 },
  logoutOptionText: { color: '#FF5757', fontWeight: '500' },

  /* ---- Switch ---- */
  switchTrack: {
    width: SWITCH_WIDTH,
    height: TRACK_HEIGHT,
    borderRadius: TRACK_HEIGHT / 2,
    borderWidth: BORDER,
    padding: PADDING,
    alignItems: 'center',
    overflow: 'hidden',
    flexGrow: 0,
    flexShrink: 0,
  },
  iconsOverlay: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: PADDING + 3,
  },
  iconSlot: { alignItems: 'center', justifyContent: 'center' },
  thumb: {
    width: THUMB_SIZE,
    height: THUMB_SIZE,
    borderRadius: THUMB_SIZE / 2,
    elevation: 4,
    zIndex: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 1,
  },
});

export default ProfileScreen;