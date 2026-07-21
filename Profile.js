// Profile.js
import React, { useState, useEffect, useRef } from 'react';
import {
    View,
    Text,
    StyleSheet,
    Image,
    TouchableOpacity, // Still needed for options
    ScrollView,
    Alert,
    Animated,
} from 'react-native';
import { AntDesign, Ionicons, FontAwesome } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTranslation } from 'react-i18next';
import i18n from './i18n';
import { useDarkMode } from './DarkModeContext';
import styled from 'styled-components/native';

// --- Define Constants HERE (Smaller Switch) ---
const SWITCH_WIDTH = 62;     // Further reduced width
const THUMB_SIZE = 22;       // Further reduced thumb diameter
const PADDING = 2;           // Padding inside track
const TRACK_ICON_SIZE = 14;  // Smaller icons inside track
// --- End Constants ---


// --- Custom Switch Styles (Adjusted for size) ---
const switchColors = {
  lightBg: '#424242', thumbLight: '#E0E0E0', iconLightColor: '#9E9E9E',
  darkBg: '#BDBDBD', thumbDark: '#424242', iconDarkColor: '#FFEB3B',
  border: 'transparent',
};

const SwitchContainer = styled(TouchableOpacity)`
  position: relative;
  width: ${SWITCH_WIDTH}px;
  height: ${THUMB_SIZE + PADDING * 2 + 2}px; /* Height based on thumb + padding + border */
  border-radius: ${(THUMB_SIZE + PADDING * 2 + 2) / 2}px; /* Dynamic radius */
  border: 1px solid ${({ isActive }) => (isActive ? switchColors.darkBg : switchColors.lightBg)};
  background-color: ${({ isActive }) => (isActive ? switchColors.darkBg : switchColors.lightBg)};
  justify-content: center;
  padding: ${PADDING}px;
  overflow: hidden;
`;

const Thumb = styled(Animated.View)`
  width: ${THUMB_SIZE}px;
  height: ${THUMB_SIZE}px;
  border-radius: ${THUMB_SIZE / 2}px;
  background-color: ${({ isActive }) => (isActive ? switchColors.thumbDark : switchColors.thumbLight)};
  position: absolute;
  elevation: 2;
  shadow-color: #000;
  shadow-offset: 0px 1px;
  shadow-opacity: 0.2;
  shadow-radius: 1px;
`;
// --- End Custom Switch Styles ---


const ProfileScreen = () => {
    const { t, i18n } = useTranslation();
    const navigation = useNavigation();
    const [profileImage, setProfileImage] = useState(null);
    const [defaultImage, setDefaultImage] = useState(require('./assets/profile.png'));
    const [userName, setUserName] = useState('');
    const [userEmail, setUserEmail] = useState('');
    const [userRegion, setUserRegion] = useState('');
    const [userBirthDate, setUserBirthDate] = useState('');
    const { isDarkMode, toggleDarkMode } = useDarkMode();

    // --- Animation Logic (Uses new constants) ---
    const switchAnimatedValue = useRef(new Animated.Value(isDarkMode ? 1 : 0)).current;
    const sunOpacity = useRef(new Animated.Value(isDarkMode ? 1 : 0)).current;
    const moonOpacity = useRef(new Animated.Value(isDarkMode ? 0 : 1)).current;

    useEffect(() => {
        Animated.parallel([
            Animated.timing(switchAnimatedValue, { toValue: isDarkMode ? 1 : 0, duration: 300, useNativeDriver: true }),
            Animated.timing(sunOpacity, { toValue: isDarkMode ? 1 : 0, duration: 300, useNativeDriver: true }),
            Animated.timing(moonOpacity, { toValue: isDarkMode ? 0 : 1, duration: 300, useNativeDriver: true })
        ]).start();
    }, [isDarkMode, switchAnimatedValue, sunOpacity, moonOpacity]);

    const thumbTranslateX = switchAnimatedValue.interpolate({
        inputRange: [0, 1],
        outputRange: [ PADDING, SWITCH_WIDTH - THUMB_SIZE - PADDING ], // Uses new constants
    });
    const animatedThumbPositionStyle = { transform: [{ translateX: thumbTranslateX }], top: PADDING };
    const animatedSunStyle = { opacity: sunOpacity };
    const animatedMoonStyle = { opacity: moonOpacity };
    // --- End Animation Logic ---


    // --- Component Functions (No changes needed here) ---
    const pickImage = async () => { let result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images, allowsEditing: true, aspect: [1, 1], quality: 1 }); if (!result.canceled && result.assets && result.assets[0]) { const newUri = result.assets[0].uri; setProfileImage(newUri); await saveProfileImage(newUri); } };
    const saveProfileImage = async (imageUri) => { if (!imageUri) return; try { await AsyncStorage.setItem('userProfileImage', imageUri); } catch (error) { console.error('Error saving profile image:', error); }};
    const loadProfileData = async () => { try { const storedImage = await AsyncStorage.getItem('userProfileImage'); setProfileImage(storedImage); const loggedInEmail = await AsyncStorage.getItem('loggedInEmail'); if (loggedInEmail) { const storedUserData = await AsyncStorage.getItem(`user:${loggedInEmail}`); if (storedUserData) { const userData = JSON.parse(storedUserData); setUserName(userData.username || ''); setUserEmail(userData.email || loggedInEmail); setUserRegion(userData.region || ''); setUserBirthDate(userData.birthDate || ''); } else { setUserEmail(loggedInEmail); setUserName(''); setUserRegion(''); setUserBirthDate(''); } } else { setUserName(''); setUserEmail(''); setUserRegion(''); setUserBirthDate(''); setProfileImage(null); } } catch (error) { console.error('Error loading profile data:', error); setUserName(''); setUserEmail(''); setUserRegion(''); setUserBirthDate(''); setProfileImage(null); }};
    const clearProfileImage = async () => { try { await AsyncStorage.removeItem('userProfileImage'); setProfileImage(null); } catch (error) { console.error('Error clearing profile image:', error); }};
    useFocusEffect( React.useCallback(() => { loadProfileData(); }, []) );
    useEffect(() => { return () => {}; }, [i18n.language]);
    const handleLogout = async () => { try { const loggedInEmail = await AsyncStorage.getItem('loggedInEmail'); const keysToRemove = [ 'userProfileImage', 'isLoggedIn', 'loggedInEmail', ]; if (loggedInEmail) { keysToRemove.push(`user:${loggedInEmail}`); } await AsyncStorage.multiRemove(keysToRemove); setUserName(''); setUserEmail(''); setUserRegion(''); setUserBirthDate(''); setProfileImage(null); navigation.reset({ index: 0, routes: [{ name: 'FirstPage' }] }); } catch (error) { console.error('Error during logout:', error); }};
    const showImageOptions = () => { Alert.alert( t('Choose an option'), '', [ { text: t('Choose from Library'), onPress: pickImage }, { text: t('Remove Photo'), onPress: clearProfileImage, style: 'destructive' }, { text: t('Cancel'), style: 'cancel' }, ], { cancelable: true } ); }; // This function remains, but won't be called from image press
    const handleToggleDarkMode = async () => { const newValue = !isDarkMode; await toggleDarkMode(); navigation.setOptions({ tabBarStyle: { backgroundColor: newValue ? '#1e1e1e' : '#FFFFFF', paddingBottom: 5, paddingTop: 5, height: 60, elevation: 10, shadowColor: newValue ? 'white' : '#000', shadowOffset: { width: 0, height: -3 }, shadowOpacity: 0.1, shadowRadius: 3, borderTopWidth: 0, }, tabBarActiveTintColor: newValue ? 'white' : '#ffdd00', tabBarInactiveTintColor: newValue ? '#555' : '#8E8E93', }); };
    const handleProfileUpdate = (updatedData) => { setUserName(updatedData.name); setUserEmail(updatedData.email); setUserRegion(updatedData.region); setUserBirthDate(updatedData.birthDate); if (updatedData.profileImage !== profileImage) { setProfileImage(updatedData.profileImage); saveProfileImage(updatedData.profileImage); } };
    // --- End Component Functions ---


    return (
        <ScrollView style={[styles.container, isDarkMode && styles.darkContainer]} contentContainerStyle={styles.scrollContent}>
            {/* Header */}
            <View style={[styles.header, isDarkMode && styles.darkHeader]}>
                 <Text style={[styles.title, isDarkMode && styles.darkTitle]}>{t('My Profile')}</Text>
            </View>

            {/* Profile Info */}
            <View style={[styles.profileInfo, isDarkMode && styles.darkProfileInfo]}>
                {/* Image Container (No longer TouchableOpacity) */}
                <View style={styles.profileImageContainer}>
                    <Image
                        source={(profileImage && { uri: profileImage }) || defaultImage}
                        style={styles.profileImage}
                    />
                </View>
                 <View style={[styles.userInfo, isDarkMode && styles.darkUserInfo]}> <Text style={[styles.name, isDarkMode && styles.darkText]}>{userName || t('Your Name')}</Text> <Text style={[styles.username, isDarkMode && styles.darkText]}> @{userName.replace(/\s+/g, '').toLowerCase() || t('username')} </Text> <Text style={[styles.email, isDarkMode && styles.darkText]}>{userEmail}</Text> </View>
                 <TouchableOpacity style={[styles.editButton, isDarkMode && styles.darkEditButton]} onPress={() => { navigation.navigate('EditProfile', { name: userName, email: userEmail, region: userRegion, birthDate: userBirthDate, profileImage: profileImage, onSave: handleProfileUpdate, language: i18n.language, }); }}> <Text style={[styles.editButtonText, isDarkMode && styles.darkEditButtonText]}>{t('Edit Profile')}</Text> </TouchableOpacity>
            </View>

            {/* Options Section (Lifted by removing marginBottom from profileInfo) */}
            <View style={[styles.options, isDarkMode && styles.darkOptions]}>
                {/* Favourites */}
                 <TouchableOpacity style={[styles.option, styles.optionSeparator, isDarkMode && styles.darkOption, isDarkMode && styles.darkOptionSeparator]} onPress={() => navigation.navigate('MyFavorites')}>
                      <View style={styles.optionContent}> <FontAwesome name="heart-o" size={22} color={isDarkMode ? 'white' : '#ffdd00'} style={styles.optionIcon}/> <Text style={[styles.optionLabel, isDarkMode && styles.darkText]}>{t('Favourites')}</Text> </View>
                      <AntDesign name="right" size={18} color={isDarkMode ? '#aaa' : '#ccc'} />
                 </TouchableOpacity>

                {/* Dark Mode Option */}
                <View style={[styles.option, styles.optionSeparator, { justifyContent: 'space-between' }, isDarkMode && styles.darkOption, isDarkMode && styles.darkOptionSeparator]}>
                    <View style={styles.optionContent}>
                        <AntDesign name="bulb1" size={22} color={isDarkMode ? '#fff' : '#ffdd00'} style={styles.optionIcon}/>
                        <Text style={[styles.optionLabel, isDarkMode && styles.darkText]}>{t('Dark Mode')}</Text>
                    </View>
                    {/* Custom Switch (Smaller) */}
                    <SwitchContainer
                        activeOpacity={0.8} onPress={handleToggleDarkMode} isActive={isDarkMode} accessibilityRole="switch" accessibilityState={{ checked: isDarkMode }} accessibilityLabel={t('Dark Mode')}
                    >
                        <Animated.View style={[styles.iconWrapper, styles.sunIconPosition, animatedSunStyle]}>
                            <Ionicons name="sunny" size={TRACK_ICON_SIZE} color={switchColors.iconDarkColor}/>
                        </Animated.View>
                        <Animated.View style={[styles.iconWrapper, styles.moonIconPosition, animatedMoonStyle]}>
                            <Ionicons name="moon" size={TRACK_ICON_SIZE} color={switchColors.iconLightColor}/>
                        </Animated.View>
                        <Thumb style={animatedThumbPositionStyle} isActive={isDarkMode}/>
                    </SwitchContainer>
                </View>

                {/* Language */}
                 <TouchableOpacity
                    // Remove separator styles from Language option
                    style={[styles.option, isDarkMode && styles.darkOption]}
                    onPress={() => navigation.navigate('ChangeLanguage')}
                 >
                     <View style={styles.optionContent}> <AntDesign name="earth" size={22} color={isDarkMode ? '#fff' : '#ffdd00'} style={styles.optionIcon}/> <Text style={[styles.optionLabel, isDarkMode && styles.darkText]}>{t('Language')}</Text> </View>
                     <AntDesign name="right" size={18} color={isDarkMode ? '#aaa' : '#ccc'} />
                 </TouchableOpacity>

                {/* Logout Option */}
                <TouchableOpacity
                    style={[styles.option, isDarkMode && styles.darkOption]} // No separator below logout
                    onPress={handleLogout}
                >
                    <View style={styles.optionContent}> <AntDesign name="logout" size={22} color={'#FF5757'} style={styles.optionIcon} /> <Text style={[styles.optionLabel, styles.logoutOptionText, isDarkMode && styles.darkLogoutOptionText]}>{t('Log out')}</Text> </View>
                </TouchableOpacity>
            </View>

        </ScrollView>
    );
};

// --- Styles object ---
const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#f8f8f8', },
    darkContainer: { backgroundColor: '#121212', },
    scrollContent: { flexGrow: 1, paddingBottom: 20 },
    header: { paddingTop: 16, paddingBottom: 12, paddingHorizontal: 16, borderBottomWidth: 1, borderBottomColor: '#EFEFEF', backgroundColor: '#fff', },
    darkHeader: { borderBottomColor: '#333', backgroundColor: '#1e1e1e', },
    title: { fontSize: 18, fontWeight: 'bold', textAlign: 'center', color: '#000', },
    darkTitle: { color: '#fff', },
    profileInfo: {
        alignItems: 'center',
        paddingVertical: 20,
        paddingHorizontal: 16,
        backgroundColor: '#fff',
        // marginBottom: 10, // <-- Removed marginBottom to lift options
    },
    darkProfileInfo: { backgroundColor: '#1e1e1e', },
    profileImageContainer: { // Style remains for layout, but View is not touchable
        marginBottom: 16,
        width: 116, height: 116, borderRadius: 58,
        shadowColor: "#000", shadowOffset: { width: 0, height: 1, }, shadowOpacity: 0.15, shadowRadius: 2, elevation: 3,
        backgroundColor: '#e0e0e0'
    },
    profileImage: { width: '100%', height: '100%', borderRadius: 58, },
    userInfo: { alignItems: 'center', marginBottom: 16, },
    darkUserInfo: {},
    name: { fontSize: 18, fontWeight: 'bold', color: '#333', },
    username: { fontSize: 16, color: '#777777', marginTop: 2, },
    email: { fontSize: 14, color: '#777777', marginTop: 4, },
    darkText: { color: '#e0e0e0', },
    editButton: { backgroundColor: '#ffdd00', paddingVertical: 10, paddingHorizontal: 20, borderRadius: 20, elevation: 10, shadowColor: '#ffdd00', shadowOffset: { width: 0, height: 0 }, shadowOpacity: 1, shadowRadius: 10, },
    darkEditButton: { backgroundColor: '#555', elevation: 10, shadowColor: '#FFFFFF', shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.8, shadowRadius: 10, },
    editButtonText: { color: '#333', fontSize: 16, fontWeight: 'bold', },
    darkEditButtonText: { color: '#fff', },
    options: {
        // No margin needed here if profileInfo margin is removed
    },
    darkOptions: {},
    option: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 16, paddingHorizontal: 16, backgroundColor: '#fff', minHeight: 50, },
    darkOption: { backgroundColor: '#1e1e1e', },
    optionSeparator: { // Style is defined but not applied to Language anymore
        borderBottomWidth: 1,
        borderBottomColor: '#f0f0f0',
    },
    darkOptionSeparator: { // Style is defined but not applied to Language anymore
        borderBottomColor: '#333',
    },
    optionContent: { flexDirection: 'row', alignItems: 'center', flex: 1, },
    optionIcon: { width: 24, textAlign: 'center', marginRight: 16, },
    optionLabel: { fontSize: 16, color: '#333', flexShrink: 1, },
    logoutOptionText: { color: '#FF5757', fontWeight: '500', },
    darkLogoutOptionText: { color: '#FF5757', },
    iconWrapper: { position: 'absolute', top: 0, bottom: 0, justifyContent: 'center', alignItems: 'center', width: THUMB_SIZE, }, // Uses constant
    sunIconPosition: { left: PADDING, }, // Uses constant
    moonIconPosition: { right: PADDING, }, // Uses constant
});

export default ProfileScreen;