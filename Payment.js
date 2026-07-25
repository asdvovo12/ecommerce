// PaymentScreen.js
import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Image,
  Animated,
  PanResponder,
  Dimensions,
  ScrollView,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import Icon from 'react-native-vector-icons/FontAwesome';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useDarkMode } from './DarkModeContext';
import { useTranslation } from 'react-i18next';
import './i18n';

const PaymentScreen = () => {
  // --- State ---
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
  const [inlineCardIconType, setInlineCardIconType] = useState(null);
  const [isSaving, setIsSaving] = useState(false);

  // --- Hooks ---
  const navigation = useNavigation();
  const route = useRoute();
  const { isDarkMode } = useDarkMode();
  const { t } = useTranslation();

  const screenHeight = Dimensions.get('window').height;
  const slideAnim = useRef(new Animated.Value(500)).current;

  // --- PanResponder (السحب لأسفل للإغلاق) ---
  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, gestureState) =>
        gestureState.dy > 5 && Math.abs(gestureState.dy) > Math.abs(gestureState.dx),
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
          }).start(() => navigation.goBack());
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

  /* ✅ استرجاع البيانات المحفوظة: من الـ params أو من AsyncStorage */
  useEffect(() => {
    const hydrate = async () => {
      let saved = route.params?.existingPaymentInfo;
      if (!saved) {
        try {
          const raw = await AsyncStorage.getItem('paymentInfo');
          saved = raw ? JSON.parse(raw) : null;
        } catch (e) {
          console.warn('Failed to read paymentInfo:', e?.message);
        }
      }
      if (!saved) return;

      setCardHolderName(saved.cardHolderName || '');
      setCardNumber(saved.cardNumber || '');
      setExpiryDate(saved.expiryDate || '');
      setCvv(saved.cvv || '');

      if (saved.cardType === 'visa') {
        setVisaActive(true); setMastercardActive(false); setPaypalActive(false);
        setInlineCardIconType('visa');
      } else if (saved.cardType === 'mastercard') {
        setVisaActive(false); setMastercardActive(true); setPaypalActive(false);
        setInlineCardIconType('mastercard');
      } else if (saved.cardType === 'paypal') {
        setVisaActive(false); setMastercardActive(false); setPaypalActive(true);
        setInlineCardIconType(null);
      }

      setIsCardHolderNameValid(!!saved.cardHolderName);
      setIsCardNumberValid(String(saved.cardNumber || '').replace(/\s/g, '').length === 16);
      setIsExpiryDateValid(String(saved.expiryDate || '').length === 5);
      setIsCvvValid(String(saved.cvv || '').length === 3);
    };
    hydrate();
  }, [route.params?.existingPaymentInfo]);

  useEffect(() => {
    Animated.timing(slideAnim, { toValue: 0, duration: 500, useNativeDriver: true }).start();
  }, []);

  // --- Handlers ---
  const handleCardNumberChange = (text) => {
    let cleaned = text.replace(/[^0-9]/g, '').substring(0, 16);

    if (cleaned.startsWith('4')) {
      setVisaActive(true); setMastercardActive(false); setPaypalActive(false);
      setInlineCardIconType('visa');
    } else if (cleaned.startsWith('5')) {
      setMastercardActive(true); setVisaActive(false); setPaypalActive(false);
      setInlineCardIconType('mastercard');
    } else {
      setVisaActive(false); setMastercardActive(false);
      setInlineCardIconType(null);
    }

    const formatted = cleaned.replace(/(\d{4})/g, '$1 ').trim();
    setCardNumber(formatted);
    setIsCardNumberValid(cleaned.length === 16);
  };

  const handleExpiryDateChange = (text) => {
    let cleaned = text.replace(/[^0-9]/g, '').substring(0, 4);

    // تصحيح الشهر تلقائيًا
    if (cleaned.length >= 2) {
      const mm = parseInt(cleaned.substring(0, 2), 10);
      if (mm === 0) cleaned = '01' + cleaned.substring(2);
      else if (mm > 12) cleaned = '12' + cleaned.substring(2);
    }

    let value = cleaned;
    if (cleaned.length > 2) value = cleaned.substring(0, 2) + '/' + cleaned.substring(2);

    setExpiryDate(value);

    // صالح فقط لو MM/YY كاملة والكارت مش منتهي
    if (value.length === 5) {
      const mm = parseInt(value.substring(0, 2), 10);
      const yy = parseInt(value.substring(3, 5), 10);
      const now = new Date();
      const currentYY = now.getFullYear() % 100;
      const currentMM = now.getMonth() + 1;
      const notExpired = yy > currentYY || (yy === currentYY && mm >= currentMM);
      setIsExpiryDateValid(mm >= 1 && mm <= 12 && notExpired);
    } else {
      setIsExpiryDateValid(false);
    }
  };

  const handleCvvChange = (text) => {
    const cleaned = text.replace(/[^0-9]/g, '').substring(0, 3);
    setCvv(cleaned);
    setIsCvvValid(cleaned.length === 3);
  };

  /* ✅ من غير trim() كل حرف عشان تقدر تكتب مسافات */
  const handleCardHolderNameChange = (text) => {
    const value = text.replace(/^\s+/, '').substring(0, 50);
    setCardHolderName(value);
    setIsCardHolderNameValid(value.trim().length > 1);
  };

  const clearCardFields = () => {
    setCardNumber('');
    setInlineCardIconType(null);
    setIsCardNumberValid(false);
  };

  const handleGoBack = () => {
    Animated.timing(slideAnim, {
      toValue: screenHeight,
      duration: 300,
      useNativeDriver: true,
    }).start(() => navigation.goBack());
  };

  /* ✅ حفظ + رجوع لـ Checkout مع الحفاظ على الـ params القديمة */
  const handleProceedToPayment = async () => {
    if (isSaving) return;

    const isPaypal = paypalActive;

    // بايبال ما بيحتاجش بيانات كارت
    if (!isPaypal) {
      if (!visaActive && !mastercardActive) {
        Alert.alert(t('Validation Error'), t('Please choose a payment method.'), [{ text: t('OK') }]);
        return;
      }
      if (!(isCardHolderNameValid && isCardNumberValid && isExpiryDateValid && isCvvValid)) {
        Alert.alert(t('Validation Error'), t('Please fill in all card details correctly.'), [
          { text: t('OK') },
        ]);
        return;
      }
    }

    const paymentInfo = isPaypal
      ? { cardType: 'paypal', cardHolderName: cardHolderName.trim() || 'PayPal' }
      : {
          cardHolderName: cardHolderName.trim(),
          cardNumber,
          expiryDate,
          cvv,
          cardType: visaActive ? 'visa' : 'mastercard',
        };

    setIsSaving(true);
    try {
      // ملاحظة أمان: لا تخزّن CVV دائمًا — بنخزّن نسخة بدون CVV
      const { cvv: _omit, ...safeInfo } = paymentInfo;
      await AsyncStorage.setItem('paymentInfo', JSON.stringify(safeInfo));

      navigation.navigate({
        name: 'Checkout',
        params: { ...(route.params || {}), paymentInfo },
        merge: true, // ✅ يحافظ على cartItems / savedAddress الموجودة
      });
    } catch (error) {
      console.error('Failed to save payment info:', error);
      Alert.alert(t('Error'), t('Something went wrong. Please try again.'), [{ text: t('OK') }]);
    } finally {
      setIsSaving(false);
    }
  };

  const paypalOnly = paypalActive;

  // --- JSX ---
  return (
    <View style={[styles.container, isDarkMode && styles.containerDark]}>
      <View style={[styles.overlay, isDarkMode && styles.overlayDark]} pointerEvents="none" />

      {/* ✅ شيلنا pointerEvents="none" عشان زرار الرجوع يشتغل */}
      <View style={[styles.visualHeader, isDarkMode && styles.visualHeaderDark]}>
        <TouchableOpacity
          onPress={handleGoBack}
          style={styles.backButton}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Ionicons name="arrow-back" size={24} color={isDarkMode ? 'white' : 'black'} />
        </TouchableOpacity>
        <Text style={[styles.visualHeaderTitle, isDarkMode && styles.visualHeaderTitleDark]}>
          {t('Checkout')}
        </Text>
        <View style={styles.backButton} />
      </View>

      <Animated.View style={[styles.modalContainer, { transform: [{ translateY: slideAnim }] }]}>
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <View style={[styles.contentContainer, isDarkMode && styles.contentContainerDark]}>
            <View
              style={[styles.separatorContainer, isDarkMode && styles.separatorContainerDark]}
              {...panResponder.panHandlers}
            >
              <View style={[styles.shortSeparatorLine, isDarkMode && styles.shortSeparatorLineDark]} />
            </View>

            <ScrollView
              style={{ flex: 1 }}
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
            >
              <View style={[styles.content, isDarkMode && styles.contentDark]}>
                <Text style={[styles.subtitle, isDarkMode && styles.subtitleDark]}>
                  {t('Choose your payment method:')}
                </Text>

                <View style={[styles.paymentOptions, { marginTop: -10 }]}>
                  <View style={styles.iconRow}>
                    <TouchableOpacity
                      style={styles.paymentIconContainer}
                      onPress={() => {
                        setVisaActive(!visaActive);
                        setMastercardActive(false);
                        setPaypalActive(false);
                        clearCardFields();
                      }}
                    >
                      <Image
                        source={require('./assets/Visa.png')}
                        style={[styles.paymentIcon, visaActive ? {} : styles.inactivePaymentIcon]}
                        resizeMode="contain"
                      />
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={styles.paymentIconContainer}
                      onPress={() => {
                        setMastercardActive(!mastercardActive);
                        setVisaActive(false);
                        setPaypalActive(false);
                        clearCardFields();
                      }}
                    >
                      <Image
                        source={require('./assets/Mastercard.png')}
                        style={[
                          styles.paymentIcon,
                          mastercardActive ? {} : styles.inactivePaymentIcon,
                          { width: 95, height: 50 },
                        ]}
                        resizeMode="contain"
                      />
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={styles.paymentIconContainer}
                      onPress={() => {
                        const next = !paypalActive;
                        setPaypalActive(next);
                        setVisaActive(false);
                        setMastercardActive(false);
                        if (next) clearCardFields();
                      }}
                    >
                      <Image
                        source={require('./assets/Paypal.png')}
                        style={[
                          styles.paymentIcon,
                          paypalActive ? {} : styles.inactivePaymentIcon,
                          { width: 85, height: 80 },
                        ]}
                        resizeMode="contain"
                      />
                    </TouchableOpacity>
                  </View>
                </View>

                {paypalOnly ? (
                  <View style={styles.paypalNote}>
                    <Text style={[styles.paypalNoteText, isDarkMode && styles.paypalNoteTextDark]}>
                      {t('You will be redirected to PayPal to complete the payment.')}
                    </Text>
                  </View>
                ) : (
                  <>
                    <TouchableOpacity style={[styles.scanCardButton, isDarkMode && styles.scanCardButtonDark]}>
                      <Icon name="camera" size={22} color={isDarkMode ? 'white' : '#333'} style={styles.scanIcon} />
                      <Text style={[styles.scanCardText, isDarkMode && styles.scanCardTextDark]}>
                        {t('Scan card')}
                      </Text>
                    </TouchableOpacity>

                    <View style={styles.cardDetailsGroup}>
                      <Text style={[styles.cardDetailsTitle, isDarkMode && styles.cardDetailsTitleDark]}>
                        {t('Card details')}
                      </Text>

                      <View style={styles.inputGroup}>
                        <Text style={[styles.inputLabel, isDarkMode && styles.inputLabelDark, { fontSize: 12 }]}>
                          {t('Card holder name')}
                        </Text>
                        <View style={[styles.inputContainer, isDarkMode && styles.inputContainerDark]}>
                          <TextInput
                            style={[styles.input, isDarkMode && styles.inputDark]}
                            placeholder={t('Card holder name')}
                            placeholderTextColor="#999"
                            value={cardHolderName}
                            onChangeText={handleCardHolderNameChange}
                            autoCapitalize="words"
                          />
                          {isCardHolderNameValid && (
                            <View style={[styles.checkmarkCircle, isDarkMode && styles.checkmarkCircleDark]}>
                              <Icon name="check" size={18} color={isDarkMode ? 'black' : 'white'} />
                            </View>
                          )}
                        </View>
                      </View>

                      <View style={styles.inputGroup}>
                        <Text style={[styles.inputLabel, isDarkMode && styles.inputLabelDark, { fontSize: 12 }]}>
                          {t('Card number')}
                        </Text>
                        <View style={[styles.inputContainer, isDarkMode && styles.inputContainerDark]}>
                          <TextInput
                            style={[styles.input, isDarkMode && styles.inputDark]}
                            placeholder={t('Card number')}
                            keyboardType="number-pad"
                            placeholderTextColor="#999"
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

                      <View style={styles.row}>
                        <View style={[styles.inputGroup, styles.rowItem]}>
                          <Text style={[styles.inputLabel, isDarkMode && styles.inputLabelDark, { fontSize: 12 }]}>
                            {t('Expiration date')}
                          </Text>
                          <View style={[styles.inputContainer, isDarkMode && styles.inputContainerDark]}>
                            <TextInput
                              style={[styles.input, isDarkMode && styles.inputDark]}
                              placeholder={t('MM/YY')}
                              placeholderTextColor="#999"
                              keyboardType="number-pad"
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
                          <Text style={[styles.inputLabel, isDarkMode && styles.inputLabelDark, { fontSize: 12 }]}>
                            {t('CVV')}
                          </Text>
                          <View style={[styles.inputContainer, isDarkMode && styles.inputContainerDark]}>
                            <TextInput
                              style={[styles.input, isDarkMode && styles.inputDark]}
                              placeholder={t('CVV')}
                              secureTextEntry
                              keyboardType="number-pad"
                              placeholderTextColor="#999"
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
                  </>
                )}
              </View>
            </ScrollView>

            <View style={[styles.proceedButtonContainer, isDarkMode && styles.proceedButtonContainerDark]}>
              <TouchableOpacity
                style={[
                  styles.proceedButton,
                  isDarkMode ? styles.proceedButtonDark : styles.proceedButtonLight,
                  isSaving && { opacity: 0.7 },
                ]}
                onPress={handleProceedToPayment}
                disabled={isSaving}
                activeOpacity={0.8}
              >
                <Icon name="lock" size={18} color={isDarkMode ? 'white' : '#333'} style={styles.lockIcon} />
                <Text style={[styles.proceedButtonText, isDarkMode ? styles.proceedButtonTextDark : {}]}>
                  {isSaving ? t('Processing...') : t('Proceed to payment')}
                </Text>
                <Text style={[styles.arrowIcon, isDarkMode ? styles.arrowIconDark : {}]}>❯❯❯</Text>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#E8E8E8', position: 'relative' },
  containerDark: { backgroundColor: '#121212' },
  overlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0, 0, 0, 0.5)', zIndex: 1 },
  overlayDark: { backgroundColor: 'rgba(0, 0, 0, 0.7)' },
  visualHeader: {
    position: 'absolute', top: 0, left: 0, right: 0, flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 20, paddingTop: 20, zIndex: 4, backgroundColor: 'transparent',
  },
  visualHeaderDark: { backgroundColor: 'transparent' },
  backButton: { padding: 10, width: 44, height: 44, justifyContent: 'center', alignItems: 'center' },
  visualHeaderTitle: { fontSize: 24, fontWeight: 'bold', flex: 1, textAlign: 'center', color: 'black' },
  visualHeaderTitleDark: { color: 'white' },
  modalContainer: { flex: 1, zIndex: 3, marginTop: 150 },
  contentContainer: {
    flex: 1, backgroundColor: 'white', borderTopLeftRadius: 30, borderTopRightRadius: 30,
    paddingTop: 10, overflow: 'hidden', flexDirection: 'column',
  },
  contentContainerDark: { backgroundColor: '#1e1e1e' },
  content: { paddingHorizontal: 20, paddingBottom: 20 },
  contentDark: { backgroundColor: '#1e1e1e' },
  separatorContainer: { alignItems: 'center', paddingVertical: 10, marginBottom: 4, marginTop: -9 },
  separatorContainerDark: { backgroundColor: '#1e1e1e' },
  shortSeparatorLine: { width: '20%', height: 5, backgroundColor: '#ddd', borderRadius: 2.5 },
  shortSeparatorLineDark: { backgroundColor: '#555' },
  subtitle: { fontSize: 17, fontWeight: 'bold', marginBottom: 25, textAlign: 'center' },
  subtitleDark: { color: 'white' },
  paymentOptions: { marginBottom: 10, alignItems: 'center', marginTop: -10 },
  iconRow: { flexDirection: 'row', justifyContent: 'space-around', width: '100%' },
  paymentIconContainer: { borderRadius: 8, justifyContent: 'center', alignItems: 'center' },
  paymentIcon: { width: 85, height: 40 },
  inactivePaymentIcon: { tintColor: 'rgba(0, 0, 0, 0.2)' },
  paypalNote: { paddingVertical: 30, paddingHorizontal: 10 },
  paypalNoteText: { fontSize: 15, color: '#555', textAlign: 'center', lineHeight: 22 },
  paypalNoteTextDark: { color: '#A9A9A9' },
  scanCardButton: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: '#ffdd00', paddingVertical: 11,
    paddingHorizontal: 18, borderRadius: 22, marginBottom: 15, justifyContent: 'center',
    elevation: 10, shadowColor: '#ffdd00', shadowOffset: { width: 0, height: 0 }, shadowOpacity: 1, shadowRadius: 10,
  },
  scanCardButtonDark: {
    backgroundColor: '#555', elevation: 10, shadowColor: '#FFFFFF',
    shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.8, shadowRadius: 10,
  },
  scanIcon: { marginRight: 9 },
  scanCardText: { color: '#333', fontSize: 17, fontWeight: 'bold' },
  scanCardTextDark: { color: 'white' },
  cardDetailsGroup: { marginBottom: 5 },
  cardDetailsTitle: { fontSize: 16, fontWeight: 'bold', marginBottom: 12 },
  cardDetailsTitleDark: { color: 'white' },
  inputGroup: { marginBottom: 8 },
  inputLabel: { marginBottom: 5, color: '#666' },
  inputLabelDark: { color: '#A9A9A9' },
  inputContainer: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: '#f5f5f5', borderRadius: 8,
    paddingHorizontal: 12, paddingVertical: 4, borderWidth: 1, borderColor: '#ddd', position: 'relative',
  },
  inputContainerDark: { backgroundColor: '#282828', borderColor: '#555' },
  input: { flex: 1, fontSize: 16, height: 40, paddingVertical: 0, color: 'black' },
  inputDark: { color: 'white' },
  row: { flexDirection: 'row', justifyContent: 'space-between' },
  rowItem: { width: '48%' },
  proceedButtonContainer: {
    paddingHorizontal: 20, paddingBottom: 20, paddingTop: 20,
    backgroundColor: 'white', borderTopWidth: 1, borderTopColor: '#eee',
  },
  proceedButtonContainerDark: { backgroundColor: '#1e1e1e', borderTopColor: '#333' },
  proceedButton: { flexDirection: 'row', alignItems: 'center', paddingVertical: 14, borderRadius: 25, justifyContent: 'center' },
  proceedButtonLight: {
    backgroundColor: '#ffdd00', elevation: 10, shadowColor: '#ffdd00',
    shadowOffset: { width: 0, height: 0 }, shadowOpacity: 1, shadowRadius: 10,
  },
  proceedButtonDark: {
    backgroundColor: '#555', elevation: 10, shadowColor: '#FFFFFF',
    shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.8, shadowRadius: 10,
  },
  proceedButtonText: { color: '#333', fontSize: 17, fontWeight: 'bold', marginRight: 9 },
  proceedButtonTextDark: { color: 'white' },
  arrowIcon: { color: '#333', fontSize: 17, fontWeight: 'bold' },
  arrowIconDark: { color: 'white' },
  lockIcon: { marginRight: 9 },
  inlineCardIcon: { width: 30, height: 20, position: 'absolute', right: 45, top: '50%', transform: [{ translateY: -10 }] },
  checkmarkCircle: {
    width: 24, height: 24, borderRadius: 12, backgroundColor: 'black',
    justifyContent: 'center', alignItems: 'center', position: 'absolute', right: 10, top: '50%',
    transform: [{ translateY: -12 }],
  },
  checkmarkCircleDark: { backgroundColor: 'white' },
});

export default PaymentScreen;