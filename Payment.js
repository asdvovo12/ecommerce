// PaymentScreen.js
import React, { useState, useRef, useEffect } from 'react';
import {
    View, Text, TextInput, TouchableOpacity, StyleSheet, Image, Animated, PanResponder, Dimensions, ScrollView, Alert
} from 'react-native';
import Icon from 'react-native-vector-icons/FontAwesome';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useDarkMode } from './DarkModeContext'; // Make sure this path is correct
import { useTranslation } from 'react-i18next';
import './i18n';  // Ensure i18n is initialized.  VERY IMPORTANT.

const PaymentScreen = () => {
    // --- State variables ---
    const [visaActive, setVisaActive] = useState(false);
    const [mastercardActive, setMastercardActive] = useState(false);
    const [paypalActive, setPaypalActive] = useState(false);
    const [cardNumber, setCardNumber] = useState('');
    const [cvv, setCvv] = useState('');
    const [expiryDate, setExpiryDate] = useState('');
    const [cardHolderName, setCardHolderName] = useState('');
    const [isCardHolderNameValid, setIsCardHolderNameValid] = useState(false);
    const [isCardNumberValid, setIsCardNumberValid] = useState(false);
    const [isExpiryDateValid, setIsExpiryDateValid] = useState(false);
    const [isCvvValid, setIsCvvValid] = useState(false);
    const [inlineCardIconType, setInlineCardIconType] = useState(null); // 'visa', 'mastercard', or null

    // --- Hooks ---
    const navigation = useNavigation();
    const route = useRoute();
    const { isDarkMode } = useDarkMode();
    const { t } = useTranslation();

    // --- Animation Setup ---
    const screenHeight = Dimensions.get('window').height;
    const slideAnim = useRef(new Animated.Value(500)).current;

    // --- PanResponder ---
    const panResponder = useRef(
        PanResponder.create({
            onMoveShouldSetPanResponder: (_, gestureState) => {
                return gestureState.dy > 5 && Math.abs(gestureState.dy) > Math.abs(gestureState.dx);
            },
            onPanResponderGrant: () => {
                slideAnim.extractOffset();
            },
            onPanResponderMove: (_, gestureState) => {
                slideAnim.setValue(Math.max(0, gestureState.dy));
            },
            onPanResponderRelease: (_, gestureState) => {
                slideAnim.flattenOffset();
                const dismissThreshold = screenHeight * 0.25;
                const flickVelocityThreshold = 0.5;
                if (gestureState.dy > dismissThreshold || gestureState.vy > flickVelocityThreshold) {
                    Animated.timing(slideAnim, {
                        toValue: screenHeight,
                        duration: 250,
                        useNativeDriver: true,
                    }).start(() => { navigation.goBack(); });
                } else {
                    Animated.spring(slideAnim, {
                        toValue: 0,
                        bounciness: 5,
                        speed: 12,
                        useNativeDriver: true,
                    }).start();
                }
            },
        })
    ).current;

    // --- استرجاع معلومات الدفع المحفوظة إن وجدت (للحفاظ على التجربة السلسة عند العودة للتعديل) ---
    useEffect(() => {
        if (route.params?.existingPaymentInfo) {
            const savedPayment = route.params.existingPaymentInfo;
            
            // استعادة القيم
            setCardHolderName(savedPayment.cardHolderName || '');
            setCardNumber(savedPayment.cardNumber || '');
            setExpiryDate(savedPayment.expiryDate || '');
            setCvv(savedPayment.cvv || '');
            
            // استعادة حالة البطاقة النشطة
            if (savedPayment.cardType === 'visa') {
                setVisaActive(true);
                setMastercardActive(false);
                setPaypalActive(false);
                setInlineCardIconType('visa');
            } else if (savedPayment.cardType === 'mastercard') {
                setVisaActive(false);
                setMastercardActive(true);
                setPaypalActive(false);
                setInlineCardIconType('mastercard');
            } else if (savedPayment.cardType === 'paypal') {
                setVisaActive(false);
                setMastercardActive(false);
                setPaypalActive(true);
                setInlineCardIconType(null);
            }
            
            // تحديث حالة التحقق
            setIsCardHolderNameValid(!!savedPayment.cardHolderName);
            setIsCardNumberValid(!!savedPayment.cardNumber);
            setIsExpiryDateValid(!!savedPayment.expiryDate);
            setIsCvvValid(!!savedPayment.cvv);
        }
    }, [route.params?.existingPaymentInfo]);

    // --- Initial Animation Effect ---
    useEffect(() => {
        Animated.timing(
            slideAnim,
            { toValue: 0, duration: 500, useNativeDriver: true }
        ).start();
    }, []);

    // --- Event Handlers ---
    const handleCardNumberChange = (text) => {
        let cleaned = text.replace(/[^0-9]/g, '');
        let maxLength = 16;
        // Keep logic for large icons (Visa/Mastercard selection)
        if (cleaned.startsWith('4')) {
            maxLength = 16;
            setVisaActive(true);
            setMastercardActive(false);
            setPaypalActive(false);
        } else if (cleaned.startsWith('5')) {
            maxLength = 16;
            setMastercardActive(true);
            setVisaActive(false);
            setPaypalActive(false);
        } else {
            // Deselect large icons if prefix doesn't match
            setVisaActive(false);
            setMastercardActive(false);
            // Paypal is handled separately by its own button press
        }

        cleaned = cleaned.substring(0, maxLength);

        // --- Logic for inline icon ---
        if (cleaned.startsWith('4')) {
            setInlineCardIconType('visa');
        } else if (cleaned.startsWith('5')) {
            setInlineCardIconType('mastercard');
        } else {
            setInlineCardIconType(null); // Hide icon if not starting with 4 or 5
        }

        let formatted = cleaned.replace(/(\d{4})/g, '$1 ').trim();
        setCardNumber(formatted);
        setIsCardNumberValid(cleaned.length === maxLength);
    };

    const handleExpiryDateChange = (text) => {
        let cleaned = text.replace(/[^0-9]/g, '');
        cleaned = cleaned.substring(0, 4);
        if (cleaned.length > 2) {
            cleaned = cleaned.substring(0, 2) + '/' + cleaned.substring(2);
        } else if (text.length === 3 && cleaned.length === 2 && text.endsWith("/")) {
            cleaned = cleaned.substring(0, 2);
        }
        setExpiryDate(cleaned);
        setIsExpiryDateValid(cleaned.length === 5);
    };
    
    const handleCvvChange = (text) => {
        let cleaned = text.replace(/[^0-9]/g, '');
        cleaned = cleaned.substring(0, 3);
        setCvv(cleaned);
        setIsCvvValid(cleaned.length === 3);
    };
    
    const handleCardHolderNameChange = (text) => {
        const cleaned = text.trim().substring(0, 50);
        setCardHolderName(cleaned);
        setIsCardHolderNameValid(cleaned.length > 0);
    };

    const handleGoBack = () => {
        Animated.timing(slideAnim, {
            toValue: screenHeight,
            duration: 300,
            useNativeDriver: true,
        }).start(() => {
            navigation.goBack();
        });
    };

    // --- تعديل دالة متابعة الدفع للانتقال إلى صفحة التحقق ---
    const handleProceedToPayment = () => {
        console.log("Button pressed. Validating payment info...");
        console.log("Validation state:", { 
            isCardHolderNameValid, 
            isCardNumberValid, 
            isExpiryDateValid, 
            isCvvValid 
        });
        console.log("Input values:", {
            cardHolderName,
            cardNumber,
            expiryDate,
            cvv,
            visaActive,
            mastercardActive,
            paypalActive
        });
        
        if (isCardHolderNameValid && isCardNumberValid && isExpiryDateValid && isCvvValid) {
            console.log("Payment info valid. Creating payment object...");
            
            // إنشاء كائن يحتوي على معلومات الدفع
            const paymentInfo = {
                cardHolderName,
                cardNumber,
                expiryDate,
                cvv,
                cardType: visaActive ? 'visa' : mastercardActive ? 'mastercard' : paypalActive ? 'paypal' : ''
            };
            
            // استخراج البيانات الموجودة من الـ route params
            const existingParams = route.params || {};
            
            console.log("Navigating to Checkout...");
            
            try {
                // جرب أولاً باستخدام 'Checkout' (الاسم قد يكون بدون "Screen" في النهاية)
                navigation.navigate('Checkout', { 
                    ...existingParams,
                    paymentInfo: paymentInfo
                });
                
                console.log("Navigation called successfully with 'Checkout'");
            } catch (error) {
                console.error("Error during navigation with 'Checkout':", error);
                
                // محاولة ثانية باستخدام الاسم الكامل 'CheckoutScreen'
                try {
                    navigation.navigate('CheckoutScreen', { 
                        ...existingParams,
                        paymentInfo: paymentInfo
                    });
                    console.log("Navigation called successfully with 'CheckoutScreen'");
                } catch (error2) {
                    console.error("Error during navigation with 'CheckoutScreen':", error2);
                    
                    // محاولة باستخدام reset إذا كانت navigate لا تعمل
                    try {
                        navigation.reset({
                            index: 0,
                            routes: [{ 
                                name: 'Checkout', 
                                params: {
                                    ...existingParams,
                                    paymentInfo: paymentInfo
                                }
                            }],
                        });
                        console.log("Navigation reset called successfully");
                    } catch (error3) {
                        console.error("All navigation attempts failed:", error3);
                        Alert.alert(
                            t('Navigation Error'),
                            t('Could not navigate to checkout. Please try again.'),
                            [{ text: t('OK') }]
                        );
                    }
                }
            }
        } else {
            console.log("Payment info validation failed");
            Alert.alert(
                t('Validation Error'),
                t('Please fill in all card details correctly.'),
                [{ text: t('OK') }]
            );
        }
    };

    // --- JSX Structure ---
    return (
        <View style={[styles.container, isDarkMode && styles.containerDark]}>
            <View style={[styles.overlay, isDarkMode && styles.overlayDark]} />

            <View style={[styles.visualHeader, isDarkMode && styles.visualHeaderDark]} pointerEvents="none">
                 <TouchableOpacity onPress={handleGoBack} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color={isDarkMode ? "white" : "black"} />
                </TouchableOpacity>
                <Text style={[styles.visualHeaderTitle, isDarkMode && styles.visualHeaderTitleDark]}>{t('Checkout')}</Text>
                <View style={styles.backButton} />
            </View>

            <Animated.View
                style={[ styles.modalContainer, { transform: [{ translateY: slideAnim }] } ]}
            >
                <View style={[styles.contentContainer, isDarkMode && styles.contentContainerDark]}>
                    <View
                        style={[styles.separatorContainer, isDarkMode && styles.separatorContainerDark]}
                        {...panResponder.panHandlers}
                    >
                        <View style={[styles.shortSeparatorLine, isDarkMode && styles.shortSeparatorLineDark]} />
                    </View>

                    {/* Using View as scrolling is unlikely needed here */}
                    <View style={[styles.content, isDarkMode && styles.contentDark]}>
                        <Text style={[styles.subtitle, isDarkMode && styles.subtitleDark]}>{t('Choose your payment method:')}</Text>

                        {/* Payment Options (Large Icons) */}
                        <View style={[styles.paymentOptions, { marginTop: -10 }]}>
                             <View style={styles.iconRow}>
                                <TouchableOpacity
                                    style={styles.paymentIconContainer}
                                    onPress={() => {
                                        setVisaActive(!visaActive);
                                        setMastercardActive(false);
                                        setPaypalActive(false);
                                        if (!visaActive) { setCardNumber(''); setInlineCardIconType(null); setIsCardNumberValid(false); } // Clear input if activating
                                        else { setCardNumber(''); setInlineCardIconType(null); setIsCardNumberValid(false);} // Clear input if deactivating
                                    }}
                                >
                                    <Image source={require('./assets/Visa.png')} style={[ styles.paymentIcon, visaActive ? {} : styles.inactivePaymentIcon, ]} resizeMode="contain" />
                                </TouchableOpacity>
                                <TouchableOpacity
                                    style={styles.paymentIconContainer}
                                     onPress={() => {
                                        setMastercardActive(!mastercardActive);
                                        setVisaActive(false);
                                        setPaypalActive(false);
                                         if (!mastercardActive) { setCardNumber(''); setInlineCardIconType(null); setIsCardNumberValid(false); } // Clear input if activating
                                        else { setCardNumber(''); setInlineCardIconType(null); setIsCardNumberValid(false);} // Clear input if deactivating
                                    }}
                                >
                                    <Image source={require('./assets/Mastercard.png')} style={[ styles.paymentIcon, mastercardActive ? {} : styles.inactivePaymentIcon, { width: 95, height: 50 }, ]} resizeMode="contain" />
                                </TouchableOpacity>
                                <TouchableOpacity
                                    style={styles.paymentIconContainer}
                                    onPress={() => {
                                        setPaypalActive(!paypalActive);
                                        setVisaActive(false);
                                        setMastercardActive(false);
                                    }}
                                >
                                    <Image source={require('./assets/Paypal.png')} style={[ styles.paymentIcon, paypalActive ? {} : styles.inactivePaymentIcon, { width: 85, height: 80 }, ]} resizeMode="contain" />
                                </TouchableOpacity>
                            </View>
                        </View>

                        {/* Scan Card Button */}
                        <TouchableOpacity style={[styles.scanCardButton, isDarkMode && styles.scanCardButtonDark]}>
                            <Icon name="camera" size={22} color={isDarkMode ? "white" : "#333"} style={styles.scanIcon} />
                            <Text style={[styles.scanCardText, isDarkMode && styles.scanCardTextDark]}>{t('Scan card')}</Text>
                        </TouchableOpacity>

                        {/* Card Details Group */}
                        <View style={styles.cardDetailsGroup}>
                            <Text style={[styles.cardDetailsTitle, isDarkMode && styles.cardDetailsTitleDark]}>{t('Card details')}</Text>
                            {/* Card Holder Name Input */}
                            <View style={styles.inputGroup}>
                                <Text style={[styles.inputLabel, isDarkMode && styles.inputLabelDark, { fontSize: 12 }]}>{t('Card holder name')}</Text>
                                <View style={[styles.inputContainer, isDarkMode && styles.inputContainerDark]}>
                                    <TextInput 
                                        style={[styles.input, isDarkMode && styles.inputDark]} 
                                        placeholder={t("Card holder name")} 
                                        placeholderTextColor={isDarkMode ? "#999" : "#999"} 
                                        value={cardHolderName} 
                                        onChangeText={handleCardHolderNameChange} 
                                    />
                                    {isCardHolderNameValid && (
                                        <View style={[styles.checkmarkCircle, isDarkMode && styles.checkmarkCircleDark]}>
                                            <Icon name="check" size={18} color={isDarkMode ? 'black' : 'white'} />
                                        </View>
                                    )}
                                </View>
                            </View>
                            {/* Card Number Input */}
                            <View style={styles.inputGroup}>
                                <Text style={[styles.inputLabel, isDarkMode && styles.inputLabelDark, { fontSize: 12 }]}>{t('Card number')}</Text>
                                <View style={[styles.inputContainer, isDarkMode && styles.inputContainerDark]}>
                                    <TextInput 
                                        style={[styles.input, isDarkMode && styles.inputDark]} 
                                        placeholder={t("Card number")} 
                                        keyboardType="numeric" 
                                        placeholderTextColor={isDarkMode ? "#999" : "#999"} 
                                        value={cardNumber} 
                                        onChangeText={handleCardNumberChange} 
                                        maxLength={19} 
                                    />
                                    {inlineCardIconType === 'visa' ? (
                                        <Image source={require('./assets/Visa.png')} style={styles.inlineCardIcon} resizeMode="contain" />
                                    ) : inlineCardIconType === 'mastercard' ? (
                                        <Image source={require('./assets/Mastercard.png')} style={styles.inlineCardIcon} resizeMode="contain" />
                                    ) : null}
                                    {isCardNumberValid && (
                                        <View style={[styles.checkmarkCircle, isDarkMode && styles.checkmarkCircleDark]}>
                                            <Icon name="check" size={18} color={isDarkMode ? 'black' : 'white'} />
                                        </View>
                                    )}
                                </View>
                            </View>
                            {/* Expiry and CVV Inputs */}
                             <View style={styles.row}>
                                <View style={[styles.inputGroup, styles.rowItem]}>
                                    <Text style={[styles.inputLabel, isDarkMode && styles.inputLabelDark, { fontSize: 12 }]}>{t('Expiration date')}</Text>
                                    <View style={[styles.inputContainer, isDarkMode && styles.inputContainerDark]}>
                                        <TextInput 
                                            style={[styles.input, isDarkMode && styles.inputDark]} 
                                            placeholder={t("MM/YY")} 
                                            placeholderTextColor={isDarkMode ? "#999" : "#999"} 
                                            keyboardType="numeric" 
                                            value={expiryDate} 
                                            onChangeText={handleExpiryDateChange} 
                                            maxLength={5}
                                        />
                                        {isExpiryDateValid && (
                                            <View style={[styles.checkmarkCircle, isDarkMode && styles.checkmarkCircleDark]}>
                                                <Icon name="check" size={18} color={isDarkMode ? 'black' : 'white'} />
                                            </View>
                                        )}
                                    </View>
                                </View>
                                <View style={[styles.inputGroup, styles.rowItem]}>
                                    <Text style={[styles.inputLabel, isDarkMode && styles.inputLabelDark, { fontSize: 12 }]}>{t('CVV')}</Text>
                                    <View style={[styles.inputContainer, isDarkMode && styles.inputContainerDark]}>
                                        <TextInput 
                                            style={[styles.input, isDarkMode && styles.inputDark]} 
                                            placeholder={t("CVV")} 
                                            secureTextEntry={true} 
                                            keyboardType="numeric" 
                                            placeholderTextColor={isDarkMode ? "#999" : "#999"} 
                                            value={cvv} 
                                            onChangeText={handleCvvChange} 
                                            maxLength={3}
                                        />
                                        {isCvvValid && (
                                            <View style={[styles.checkmarkCircle, isDarkMode && styles.checkmarkCircleDark]}>
                                                <Icon name="check" size={18} color={isDarkMode ? 'black' : 'white'} />
                                            </View>
                                        )}
                                    </View>
                                </View>
                            </View>
                        </View>
                    </View>

                    {/* Proceed Button Container */}
                    <View style={[styles.proceedButtonContainer, isDarkMode && styles.proceedButtonContainerDark]}>
                        <TouchableOpacity 
                            style={[styles.proceedButton, isDarkMode ? styles.proceedButtonDark : styles.proceedButtonLight]} 
                            onPress={handleProceedToPayment}
                        >
                            <Icon name="lock" size={18} color={isDarkMode ? "white" : "#333"} style={styles.lockIcon} />
                            <Text style={[styles.proceedButtonText, isDarkMode ? styles.proceedButtonTextDark : {}]}>{t('Proceed to payment')}</Text>
                            <Text style={[styles.arrowIcon, isDarkMode ? styles.arrowIconDark : {}]}>❯❯❯</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Animated.View>
        </View>
    );
};

// --- Styles ---
const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#E8E8E8', position: 'relative', },
    containerDark: { backgroundColor: '#121212', },
    overlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0, 0, 0, 0.5)', zIndex: 1, },
    overlayDark: { backgroundColor: 'rgba(0, 0, 0, 0.7)', },
    visualHeader: { position: 'absolute', top: 0, left: 0, right: 0, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingTop: 20, zIndex: 2, backgroundColor: 'transparent', },
    visualHeaderDark: { backgroundColor: 'transparent', },
    backButton: { padding: 10, width: 44, height: 44, justifyContent: 'center', alignItems: 'center', },
    visualHeaderTitle: { fontSize: 24, fontWeight: 'bold', flex: 1, textAlign: 'center', color: 'black', },
    visualHeaderTitleDark: { color: 'white', },
    modalContainer: {
        flex: 1,
        zIndex: 3,
        marginTop: 150,
    },
    contentContainer: { flex: 1, backgroundColor: 'white', borderTopLeftRadius: 30, borderTopRightRadius: 30, paddingTop: 10, overflow: 'hidden', flexDirection: 'column', },
    contentContainerDark: { backgroundColor: '#1e1e1e', },
    content: { paddingHorizontal: 20, paddingBottom: 20, },
    contentDark: { backgroundColor: '#1e1e1e', },
    separatorContainer: { alignItems: 'center', paddingVertical: 10, marginBottom: 4, marginTop: -9, },
    separatorContainerDark: { backgroundColor: '#1e1e1e', },
    shortSeparatorLine: { width: '20%', height: 5, backgroundColor: '#ddd', borderRadius: 2.5, },
    shortSeparatorLineDark: { backgroundColor: '#555', },
    subtitle: { fontSize: 17, fontWeight: 'bold', marginBottom: 25, textAlign: 'center', },
    subtitleDark: { color: 'white' },
    paymentOptions: { marginBottom: 10, alignItems: 'center', marginTop: -10, },
    iconRow: { flexDirection: 'row', justifyContent: 'space-around', width: '100%', },
    paymentIconContainer: { borderRadius: 8, justifyContent: 'center', alignItems: 'center', },
    paymentIcon: { width: 85, height: 40, },
    inactivePaymentIcon: { tintColor: 'rgba(0, 0, 0, 0.2)', },
    scanCardButton: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#ffdd00', paddingVertical: 11, paddingHorizontal: 18, borderRadius: 22, marginBottom: 15, justifyContent: 'center', elevation: 10, shadowColor: '#ffdd00', shadowOffset: { width: 0, height: 0 }, shadowOpacity: 1, shadowRadius: 10, },
    scanCardButtonDark: { backgroundColor: '#555', elevation: 10, shadowColor: '#FFFFFF', shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.8, shadowRadius: 10, },
    scanIcon: { marginRight: 9, },
    scanCardText: { color: '#333', fontSize: 17, fontWeight: 'bold', },
    scanCardTextDark: { color: 'white', },
    cardDetailsGroup: { marginBottom: 5, },
    cardDetailsTitle: { fontSize: 16, fontWeight: 'bold', marginBottom: 12, },
    cardDetailsTitleDark: { color: 'white' },
    inputGroup: { marginBottom: 8, },
    inputLabel: { marginBottom: 5, color: '#666', },
    inputLabelDark: { color: '#A9A9A9' },
    inputContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#f5f5f5', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 4, borderWidth: 1, borderColor: '#ddd', position: 'relative', },
    inputContainerDark: { backgroundColor: '#282828', borderColor: '#555' },
    input: { flex: 1, fontSize: 16, height: 40, paddingVertical: 0, color: 'black' },
    inputDark: { color: 'white' },
    row: { flexDirection: 'row', justifyContent: 'space-between', },
    rowItem: { width: '48%', },
    proceedButtonContainer: {
        paddingHorizontal: 20,
        paddingBottom: 20,
        paddingTop: 20,
        backgroundColor: 'white',
        borderTopWidth: 1,
        borderTopColor: '#eee',
    },
    proceedButtonContainerDark: {
        backgroundColor: '#1e1e1e',
        borderTopColor: '#333',
    },
    proceedButton: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 14,
        borderRadius: 25,
        justifyContent: 'center',
    },
    proceedButtonLight: {
        backgroundColor: '#ffdd00',
        elevation: 10,
        shadowColor: '#ffdd00',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 1,
        shadowRadius: 10,
    },
    proceedButtonDark: {
        backgroundColor: '#555',
        elevation: 10,
        shadowColor: '#FFFFFF',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.8,
        shadowRadius: 10,
    },
    proceedButtonText: {
        color: '#333',
        fontSize: 17,
        fontWeight: 'bold',
        marginRight: 9,
    },
    proceedButtonTextDark: { color: 'white' },
    arrowIcon: {
        color: '#333',
        fontSize: 17,
        fontWeight: 'bold',
    },
    arrowIconDark: { color: 'white', },
    lockIcon: { marginRight: 9, },
    inlineCardIcon: {
        width: 30,
        height: 20,
        position: 'absolute',
        right: 45,
        top: '50%',
        transform: [{ translateY: -10 }],
    },
    checkmarkCircle: {
        width: 24,
        height: 24,
        borderRadius: 12,
        backgroundColor: 'black',
        justifyContent: 'center',
        alignItems: 'center',
        position: 'absolute',
        right: 10,
        top: '50%',
        transform: [{ translateY: -12 }],
    },
    checkmarkCircleDark: { backgroundColor: 'white', }
});

export default PaymentScreen;