import React, { useState, useRef, useEffect } from 'react';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    StyleSheet,
    Animated,
    SafeAreaView,
    ScrollView, // تم التأكد من استيراده
    PanResponder,
    Dimensions,
    Platform,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useDarkMode } from './DarkModeContext'; // افترض أن هذا المسار صحيح
import { useTranslation } from 'react-i18next';
import AsyncStorage from '@react-native-async-storage/async-storage';

const screenHeight = Dimensions.get('window').height;

const ShippingAddress = () => {
    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');
    const [country, setCountry] = useState('');
    const [address, setAddress] = useState('');
    const [city, setCity] = useState('');
    const [stateRegion, setStateRegion] = useState('');
    const [postalCode, setPostalCode] = useState('');
    const [phoneNumber, setPhoneNumber] = useState('');
    const [isModalVisible, setIsModalVisible] = useState(false);

    const [firstNameError, setFirstNameError] = useState('');
    const [lastNameError, setLastNameError] = useState('');
    const [countryError, setCountryError] = useState('');
    const [addressError, setAddressError] = useState('');
    const [cityError, setCityError] = useState('');
    const [stateRegionError, setStateRegionError] = useState('');
    const [postalCodeError, setPostalCodeError] = useState('');
    const [phoneNumberError, setPhoneNumberError] = useState('');

    const navigation = useNavigation();
    const route = useRoute();
    const { isDarkMode } = useDarkMode();
    const { t } = useTranslation();

    const slideAnim = useRef(new Animated.Value(screenHeight)).current;
    const overlayOpacity = useRef(new Animated.Value(0)).current;

    const gestureStartY = useRef(0);
    const currentAnimValue = useRef(0);

    // --- PanResponder Setup (النسخة الأصلية) ---
    const panResponder = useRef(
        PanResponder.create({
            onStartShouldSetPanResponder: () => true,
            onMoveShouldSetPanResponder: (evt, gestureState) => {
                 return Math.abs(gestureState.dy) > 5;
            },
            onPanResponderGrant: (evt, gestureState) => {
                gestureStartY.current = slideAnim._value;
            },
            onPanResponderMove: (evt, gestureState) => {
                const newY = gestureStartY.current + gestureState.dy;
                slideAnim.setValue(Math.max(0, newY));
            },
            onPanResponderRelease: (evt, gestureState) => {
                const finalY = gestureStartY.current + gestureState.dy;
                const dismissThreshold = screenHeight * 0.3;
                const velocityThreshold = 0.5;

                if (finalY > dismissThreshold || gestureState.vy > velocityThreshold) {
                    dismissModal();
                } else {
                    Animated.spring(slideAnim, {
                        toValue: 0,
                        useNativeDriver: true,
                    }).start();
                }
            },
        })
    ).current;


    // --- Modal Dismiss Function (تبقى كما هي) ---
    const dismissModal = (callback) => {
        setIsModalVisible(false);
        Animated.parallel([
            Animated.timing(slideAnim, {
                toValue: screenHeight,
                duration: 250,
                useNativeDriver: true,
            }),
            Animated.timing(overlayOpacity, {
                toValue: 0,
                duration: 250,
                useNativeDriver: true,
            }),
        ]).start(() => {
            if (navigation.canGoBack()) {
                 navigation.goBack();
            }
            if (callback) callback();
        });
    };

    // --- Modal Entry Animation (تبقى كما هي) ---
     useEffect(() => {
         Animated.parallel([
             Animated.timing(overlayOpacity, {
                 toValue: 1,
                 duration: 300,
                 useNativeDriver: true,
             }),
             Animated.timing(slideAnim, {
                 toValue: 0,
                 duration: 400,
                 useNativeDriver: true,
             }),
         ]).start(() => {
             setIsModalVisible(true);
             currentAnimValue.current = 0;
         });
     }, [slideAnim, overlayOpacity]);


    // --- تحميل/حفظ العنوان (تبقى كما هي) ---
    const saveAddressToStorage = async (addressData) => {
        try {
            await AsyncStorage.setItem('shippingAddress', JSON.stringify(addressData));
        } catch (error) {
            console.error('Error saving address to storage:', error);
        }
    };
    const loadAddressFromStorage = async () => {
         try {
            const storedAddress = await AsyncStorage.getItem('shippingAddress');
            if (storedAddress !== null) {
                const addressData = JSON.parse(storedAddress);
                setFirstName(addressData.firstName || '');
                setLastName(addressData.lastName || '');
                setCountry(addressData.country || '');
                setAddress(addressData.address || '');
                setCity(addressData.city || '');
                setStateRegion(addressData.stateRegion || '');
                setPostalCode(addressData.postalCode || '');
                setPhoneNumber(addressData.phoneNumber || '');
            }
        } catch (error) {
            console.error('Error loading address from storage:', error);
        }
    };
    useEffect(() => {
        loadAddressFromStorage();
    }, []);

    // --- معالجات الإدخال والتحقق (تبقى كما هي) ---
     const handlePostalCodeChange = (text) => {
         const cleaned = text.replace(/[^0-9]/g, '');
         setPostalCode(cleaned.substring(0, 10));
         setPostalCodeError('');
     };
     const handlePhoneNumberChange = (text) => {
         const cleaned = text.replace(/[^0-9]/g, '');
         setPhoneNumber(cleaned.substring(0, 15));
          setPhoneNumberError('');
     };
     const handleStateRegionChange = (text) => {
         const cleaned = text.replace(/[^a-zA-Z\u0600-\u06FF\s]/g, '');
         setStateRegion(cleaned.substring(0, 50));
         setStateRegionError('');
     };
    useEffect(() => { if (firstName.trim() !== '') setFirstNameError(''); }, [firstName]);
    useEffect(() => { if (lastName.trim() !== '') setLastNameError(''); }, [lastName]);
    useEffect(() => { if (country.trim() !== '') setCountryError(''); }, [country]);
    useEffect(() => { if (address.trim() !== '') setAddressError(''); }, [address]);
    useEffect(() => { if (city.trim() !== '') setCityError(''); }, [city]);
    useEffect(() => { if (stateRegion.trim() !== '') setStateRegionError(''); }, [stateRegion]);
    useEffect(() => { if (postalCode.trim() !== '') setPostalCodeError(''); }, [postalCode]);
    useEffect(() => { if (phoneNumber.trim() !== '') setPhoneNumberError(''); }, [phoneNumber]);


    // --- التعامل مع حفظ العنوان (النسخة الأصلية للتحقق والانتقال) ---
    const handleSaveAddress = () => {
        let hasError = false;
        if (firstName.trim() === '') { setFirstNameError(t('firstNameRequired')); hasError = true; } else { setFirstNameError(''); }
        if (lastName.trim() === '') { setLastNameError(t('lastNameRequired')); hasError = true; } else { setLastNameError(''); }
        if (country.trim() === '') { setCountryError(t('countryRequired')); hasError = true; } else { setCountryError(''); }
        if (address.trim() === '') { setAddressError(t('addressRequired')); hasError = true; } else { setAddressError(''); }
        if (city.trim() === '') { setCityError(t('cityRequired')); hasError = true; } else { setCityError(''); }
        if (stateRegion.trim() === '') { setStateRegionError(t('stateRegionRequired')); hasError = true; } else { setStateRegionError(''); }
        if (postalCode.trim() === '') { setPostalCodeError(t('postalCodeRequired')); hasError = true; } else { setPostalCodeError(''); }
        if (phoneNumber.trim() === '') { setPhoneNumberError(t('phoneNumberRequired')); hasError = true; } else { setPhoneNumberError(''); }

        if (!hasError) {
            const addressData = { firstName, lastName, country, address, city, stateRegion, postalCode, phoneNumber };
            saveAddressToStorage(addressData);
            console.log("Address saved!");
             navigation.navigate({
                 name: 'Checkout',
                 params: { savedAddress: addressData },
                 merge: true,
             });
             // أو استخدم dismissModal للانتقال الأنظف
             // dismissModal();
        }
    };


    // --- Render ---
    return (
        <SafeAreaView style={[styles.safeArea, isDarkMode && styles.safeAreaDark]}>
            <View style={[styles.container, isDarkMode && styles.containerDark]}>
                {/* الهيدر المرئي في الخلفية */}
                <View
                    style={[styles.visualHeader, isDarkMode && styles.visualHeaderDark]}
                >
                    <TouchableOpacity onPress={() => dismissModal()} style={styles.backButton}>
                        <Ionicons name="arrow-back" size={24} color={isDarkMode ? "white" : "black"} />
                    </TouchableOpacity>
                    <Text style={[styles.visualHeaderTitle, isDarkMode && styles.visualHeaderTitleDark]}>{t('Checkout')}</Text>
                    <View style={styles.backButton} />
                </View>

                {/* Overlay */}
                <Animated.View
                     style={[styles.overlay, { opacity: overlayOpacity }]}
                     pointerEvents={isModalVisible ? "auto" : "none"}
                 />

                {/* حاوية الـ Modal */}
                <Animated.View
                    style={[
                        styles.modalContainer,
                        { transform: [{ translateY: slideAnim }] },
                    ]}
                >
                     {/* شريط السحب */}
                     <View
                         style={[styles.separatorContainer, isDarkMode && styles.separatorContainerDark]}
                         {...panResponder.panHandlers}
                     >
                         <View style={[styles.shortSeparatorLine, isDarkMode && styles.shortSeparatorLineDark]} />
                     </View>

                     {/* ============================== */}
                     {/* ===== بداية منطقة التمرير ===== */}
                     {/* ============================== */}
                    <ScrollView
                        // تطبيق ستايل الخلفية على ScrollView
                        style={[styles.contentScrollView, isDarkMode && styles.contentScrollViewDark]}
                        contentContainerStyle={styles.scrollContentContainer}
                        showsVerticalScrollIndicator={false}
                        keyboardShouldPersistTaps="handled"
                    >
                         {/* إزالة لون الخلفية من هذا الـ View الداخلي */}
                         <View style={[styles.contentInnerWrapper]}>
                             <Text style={[styles.subtitle, isDarkMode && styles.subtitleDark]}>{t('shippingAddress')}</Text>

                             {/* --- حقول الإدخال --- */}
                             <View style={[styles.inputGroup, { marginTop: 8 }]}>
                                 <Text style={[styles.inputLabel, { fontSize: 11 }, isDarkMode && styles.inputLabelDark]}>{t('firstName')}</Text>
                                 <View style={[styles.inputContainer, isDarkMode && styles.inputContainerDark]}>
                                     <TextInput style={[styles.input, { fontSize: 14 }, isDarkMode && styles.inputDark]} placeholder={t('firstName')} placeholderTextColor={isDarkMode ? "#999" : "#999"} value={firstName} onChangeText={setFirstName}/>
                                 </View>
                                 {firstNameError ? <Text style={[styles.errorText, isDarkMode && styles.errorTextDark]}>{firstNameError}</Text> : null}
                             </View>

                              <View style={[styles.inputGroup, { marginTop: 4 }]}>
                                 <Text style={[styles.inputLabel, { fontSize: 11 }, isDarkMode && styles.inputLabelDark]}>{t('lastName')}</Text>
                                 <View style={[styles.inputContainer, isDarkMode && styles.inputContainerDark]}>
                                     <TextInput style={[styles.input, { fontSize: 14 }, isDarkMode && styles.inputDark]} placeholder={t('lastName')} placeholderTextColor={isDarkMode ? "#999" : "#999"} value={lastName} onChangeText={setLastName}/>
                                 </View>
                                 {lastNameError ? <Text style={[styles.errorText, isDarkMode && styles.errorTextDark]}>{lastNameError}</Text> : null}
                             </View>

                             <View style={[styles.inputGroup, { marginTop: 4 }]}>
                                 <Text style={[styles.inputLabel, { fontSize: 11 }, isDarkMode && styles.inputLabelDark]}>{t('country')}</Text>
                                 <View style={[styles.inputContainer, isDarkMode && styles.inputContainerDark]}>
                                     <TextInput style={[styles.input, { fontSize: 14 }, isDarkMode && styles.inputDark]} placeholder={t('country')} placeholderTextColor={isDarkMode ? "#999" : "#999"} value={country} onChangeText={setCountry}/>
                                 </View>
                                 {countryError ? <Text style={[styles.errorText, isDarkMode && styles.errorTextDark]}>{countryError}</Text> : null}
                             </View>

                              <View style={[styles.inputGroup, { marginTop: 4 }]}>
                                 <Text style={[styles.inputLabel, { fontSize: 11 }, isDarkMode && styles.inputLabelDark]}>{t('address')}</Text>
                                 <View style={[styles.inputContainer, isDarkMode && styles.inputContainerDark]}>
                                     <TextInput style={[styles.input, { fontSize: 14 }, isDarkMode && styles.inputDark]} placeholder={t('address')} placeholderTextColor={isDarkMode ? "#999" : "#999"} value={address} onChangeText={setAddress}/>
                                 </View>
                                 {addressError ? <Text style={[styles.errorText, isDarkMode && styles.errorTextDark]}>{addressError}</Text> : null}
                             </View>

                              <View style={[styles.inputGroup, { marginTop: 4 }]}>
                                 <Text style={[styles.inputLabel, { fontSize: 11 }, isDarkMode && styles.inputLabelDark]}>{t('city')}</Text>
                                 <View style={[styles.inputContainer, isDarkMode && styles.inputContainerDark]}>
                                     <TextInput style={[styles.input, { fontSize: 14 }, isDarkMode && styles.inputDark]} placeholder={t('city')} placeholderTextColor={isDarkMode ? "#999" : "#999"} value={city} onChangeText={setCity}/>
                                 </View>
                                 {cityError ? <Text style={[styles.errorText, isDarkMode && styles.errorTextDark]}>{cityError}</Text> : null}
                             </View>

                            <View style={[styles.row, { marginTop: 4 }]}>
                                <View style={[styles.inputGroup, styles.rowItem]}>
                                    <Text style={[styles.inputLabel, { fontSize: 11 }, isDarkMode && styles.inputLabelDark]}>{t('stateRegion')}</Text>
                                    <View style={[styles.inputContainer, isDarkMode && styles.inputContainerDark]}>
                                        <TextInput style={[styles.input, { fontSize: 13 }, isDarkMode && styles.inputDark]} placeholder={t('stateRegion')} placeholderTextColor={isDarkMode ? "#999" : "#999"} value={stateRegion} onChangeText={handleStateRegionChange}/>
                                    </View>
                                    {stateRegionError ? <Text style={[styles.errorText, isDarkMode && styles.errorTextDark]}>{stateRegionError}</Text> : null}
                                </View>
                                <View style={[styles.inputGroup, styles.rowItem]}>
                                    <Text style={[styles.inputLabel, { fontSize: 11 }, isDarkMode && styles.inputLabelDark]}>{t('postalCode')}</Text>
                                    <View style={[styles.inputContainer, isDarkMode && styles.inputContainerDark]}>
                                        <TextInput style={[styles.input, { fontSize: 13 }, isDarkMode && styles.inputDark]} placeholder={t('postalCode')} placeholderTextColor={isDarkMode ? "#999" : "#999"} value={postalCode} onChangeText={handlePostalCodeChange} keyboardType="numeric"/>
                                    </View>
                                    {postalCodeError ? <Text style={[styles.errorText, isDarkMode && styles.errorTextDark]}>{postalCodeError}</Text> : null}
                                </View>
                             </View>

                             <View style={[styles.inputGroup, { marginTop: 4 }]}>
                                 <Text style={[styles.inputLabel, { fontSize: 11 }, isDarkMode && styles.inputLabelDark]}>{t('phoneNumber')}</Text>
                                 <View style={[styles.inputContainer, isDarkMode && styles.inputContainerDark]}>
                                     <TextInput style={[styles.input, { fontSize: 14 }, isDarkMode && styles.inputDark]} placeholder={t('phoneNumber')} placeholderTextColor={isDarkMode ? "#999" : "#999"} value={phoneNumber} onChangeText={handlePhoneNumberChange} keyboardType="phone-pad"/>
                                 </View>
                                 {phoneNumberError ? <Text style={[styles.errorText, isDarkMode && styles.errorTextDark]}>{phoneNumberError}</Text> : null}
                             </View>

                             {/* --- زر الحفظ --- */}
                             <TouchableOpacity
                                 style={[
                                     styles.proceedButton,
                                     isDarkMode ? styles.proceedButtonDark : styles.proceedButtonLight,
                                     { paddingVertical: 16, marginHorizontal: 20, marginTop: 20 }
                                 ]}
                                 onPress={handleSaveAddress}
                                 activeOpacity={0.8}
                             >
                                 <Text style={[styles.proceedButtonText, isDarkMode ? styles.whiteText : styles.darkText, { fontSize: 18 }]}>{t('Save')}</Text>
                             </TouchableOpacity>
                         </View>
                    </ScrollView>
                     {/* ============================ */}
                     {/* ===== نهاية منطقة التمرير ===== */}
                     {/* ============================ */}
                </Animated.View>
            </View>
        </SafeAreaView>
    );
};

// --- الأنماط (Styles) - مع تعديل خلفية ScrollView ---
const styles = StyleSheet.create({
    safeArea: { flex: 1, backgroundColor: 'white' },
    safeAreaDark: { backgroundColor: '#121212' },
    container: { flex: 1, backgroundColor: 'transparent', position: 'relative' },
    containerDark: { backgroundColor: '#121212' },
    overlay: {
       position: 'absolute',
       top: 0,
       left: 0,
       right: 0,
       bottom: 0,
       backgroundColor: 'rgba(0, 0, 0, 0.5)',
       zIndex: 1
   },
    visualHeader: {
       flexDirection: 'row',
       alignItems: 'center',
       marginBottom: 30,
       paddingHorizontal: 20,
       paddingTop: Platform.OS === 'ios' ? 10 : 20,
       zIndex: 0
   },
    visualHeaderDark: { backgroundColor: 'transparent' },
    backButton: {
        padding: 10,
        width: 44,
        height: 44,
        justifyContent: 'center',
        alignItems: 'center',
    },
    visualHeaderTitle: {
        fontSize: 24,
        fontWeight: 'bold',
        flex: 1,
        textAlign: 'center',
        color: 'black'
    },
    visualHeaderTitleDark: { color: 'white' },

    modalContainer: {
        position: 'absolute',
        left: 0,
        right: 0,
        bottom: 0,
        top: 95,
        zIndex: 2,
        borderTopLeftRadius: 30,
        borderTopRightRadius: 30,
        overflow: 'hidden', // مهم للحفاظ على الحواف عند التمرير
        backgroundColor: 'transparent',
    },
    separatorContainer: {
        alignItems: 'center',
        paddingTop: 10,
        paddingBottom: 15,
        backgroundColor: 'white', // خلفية الشريط منفصلة
        borderTopLeftRadius: 30,
        borderTopRightRadius: 30,
    },
    separatorContainerDark: {
        backgroundColor: '#1e1e1e', // خلفية الشريط الداكنة منفصلة
    },
    shortSeparatorLine: {
        width: '20%',
        height: 5,
        backgroundColor: '#ddd',
        borderRadius: 2.5,
    },
    shortSeparatorLineDark: {
        backgroundColor: '#555',
    },
    // نمط ScrollView لتطبيق الخلفية
    contentScrollView: {
       flex: 1, // تأكد من أن ScrollView يملأ المساحة
       backgroundColor: 'white', // لون الخلفية الافتراضي
    },
    contentScrollViewDark: {
       backgroundColor: '#1e1e1e', // لون الخلفية الداكن
    },
    // نمط المحتوى داخل ScrollView
    scrollContentContainer: {
        padding: 20,
        paddingTop: 0,
        paddingBottom: 40,
        flexGrow: 1,
    },
    // View داخلي (بدون خلفية الآن)
    contentInnerWrapper: {
       // لا يحتاج خلفية هنا
    },
    // contentInnerWrapperDark: { // لا نحتاج لهذا بعد الآن
    // },
    subtitle: {
        fontSize: 17,
        fontWeight: 'bold',
        marginBottom: 15,
        textAlign: 'center',
        color: 'black',
        marginTop: 10 // إضافة هامش علوي طفيف لتعويض إزالة padding top من scrollContentContainer
    },
    subtitleDark: { color: 'white' },
    inputGroup: { marginBottom: 2 },
    inputLabel: { marginBottom: 2, color: '#666', fontSize: 11 },
    inputLabelDark: { color: '#A9A9A9' },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#f5f5f5',
        borderRadius: 8,
        paddingHorizontal: 12,
        paddingVertical: 3,
        borderWidth: 1,
        borderColor: '#ddd',
        position: 'relative'
    },
    inputContainerDark: { backgroundColor: '#282828', borderColor: '#555' },
    input: {
        flex: 1,
        height: 38,
        paddingVertical: 0,
        color: 'black',
        fontSize: 14
    },
    inputDark: { color: 'white' },
    row: { flexDirection: 'row', justifyContent: 'space-between' },
    rowItem: { width: '48%' },
    proceedButton: { borderRadius: 25, justifyContent: 'center', alignItems: 'center' },
    proceedButtonLight: {
        backgroundColor: '#ffdd00',
        elevation: 10,
        shadowColor: '#ffdd00',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 1,
        shadowRadius: 10
    },
    proceedButtonDark: {
        backgroundColor: '#555',
        elevation: 10,
        shadowColor: '#FFFFFF',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.8,
        shadowRadius: 10
    },
    proceedButtonText: { fontWeight: 'bold' },
    darkText: { color: '#333' },
    whiteText: { color: 'white' },
    errorText: { color: 'red', fontSize: 12, marginTop: 2, marginLeft: 4 },
    errorTextDark: { color: '#FFAAAA' },
});

export default ShippingAddress;