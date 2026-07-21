// EditProfileScreen.js
import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    Image,
    TouchableOpacity,
    Alert,
    Platform,
    TextInput // تأكد من وجود TextInput
} from 'react-native';
import { Ionicons } from '@expo/vector-icons'; // تأكد من تثبيت expo/vector-icons
import * as ImagePicker from 'expo-image-picker'; // تأكد من تثبيت expo-image-picker
import { SafeAreaView } from 'react-native-safe-area-context'; // تأكد من تثبيت safe-area-context
import DateTimePicker, { DateTimePickerAndroid } from '@react-native-community/datetimepicker'; // تأكد من تثبيت datetimepicker
import AsyncStorage from '@react-native-async-storage/async-storage';

// ثوابت للستايل
const imageSize = 130;
const iconSize = 25;

const EditProfileScreen = ({ route, navigation }) => {
    // استقبال البيانات من الـ route (إذا تم تمريرها)
    const {
        name: initialName = '', // اسم مبدئي (لو مررته)
        language = 'en', // اللغة الافتراضية
        // initialEmail تم إزالته، سنعتمد على AsyncStorage
        region: initialRegion = '', // منطقة مبدئية
        birthDate: initialBirthDate = '', // تاريخ ميلاد مبدئي
        onSave = () => { }, // دالة افتراضية للحفظ
        profileImage: initialProfileImage = null // صورة ملف شخصي مبدئية
    } = route.params || {};

    // --- حالات (States) ---
    const [profileImage, setProfileImage] = useState(initialProfileImage ? { uri: initialProfileImage } : require('./assets/profile.png'));
    const [userName, setUserName] = useState(initialName);
    const [email, setEmail] = useState(''); // <-- **مهم:** يبدأ فارغًا، سيتم ملؤه من AsyncStorage
    const [region, setRegion] = useState(initialRegion);
    const [birthDate, setBirthDate] = useState(initialBirthDate ? new Date(initialBirthDate) : null);
    const [showDatePicker, setShowDatePicker] = useState(false);
    const [dateDisplay, setDateDisplay] = useState(''); // النص المعروض لمربع التاريخ
    const [dateSelected, setDateSelected] = useState(!!initialBirthDate); // هل تم اختيار تاريخ؟
    const [isDarkMode, setIsDarkMode] = useState(false); // حالة الوضع الداكن
    const [showFullCalendar, setShowFullCalendar] = useState(false); // للـ iOS DatePicker

    // --- الترجمات ---
    const translations = {
        en: {
            editProfileName: 'Edit Profile Name',
            settings: 'Settings',
            logout: 'Logout',
            nameLabel: 'Name',
            removePhoto: 'Remove Photo',
            takePhoto: 'Take Photo',
            chooseFromLibrary: 'Choose from Library',
            cancel: 'Cancel',
            yourName: 'Your Name',
            email: 'Email',
            region: 'Region',
            yourBirthday: 'Your Birthday',
            save: 'Save',
            back: 'Back',
            editProfile: 'Edit Profile', // النص المطلوب توسطه
            selectDate: 'Select Date',
        },
        ar: {
            editProfileName: 'تعديل اسم الملف الشخصي',
            settings: 'الإعدادات',
            logout: 'تسجيل الخروج',
            nameLabel: 'الاسم',
            removePhoto: 'إزالة الصورة',
            takePhoto: 'التقاط صورة',
            chooseFromLibrary: 'اختيار من المكتبة',
            cancel: 'إلغاء',
            yourName: 'اسمك',
            email: 'البريد الإلكتروني',
            region: 'المنطقة',
            yourBirthday: 'تاريخ ميلادك',
            save: 'حفظ',
            back: 'رجوع',
            editProfile: 'تعديل الملف الشخصي', // النص المطلوب توسطه
            selectDate: 'تاريخ ميلادك', // أو 'اختر تاريخ ميلادك'
        },
    };
    const currentTranslations = translations[language] || translations['en'];

    // --- التأثيرات (useEffect) ---

    // تأثير لتحميل البيانات الأولية عند فتح الشاشة
    useEffect(() => {
        const loadInitialData = async () => {
            // 1. تحميل الوضع الداكن
            await loadDarkMode(); // استدعاء دالة تحميل الوضع الداكن

            // 2. *** تحميل الإيميل المحفوظ من AsyncStorage ***
            try {
                const storedEmail = await AsyncStorage.getItem('loggedInEmail'); // <-- قراءة الإيميل بنفس المفتاح
                if (storedEmail) {
                    console.log('[EditProfile] تحميل الإيميل من AsyncStorage:', storedEmail);
                    setEmail(storedEmail); // <-- تحديث حالة الإيميل لعرضه
                } else {
                    console.log('[EditProfile] لم يتم العثور على loggedInEmail في AsyncStorage.');
                    // يمكنك وضع قيمة افتراضية أو إظهار رسالة للمستخدم هنا
                    setEmail('لا يوجد بريد إلكتروني مسجل'); // يمكنك تعديل هذه الرسالة
                }
            } catch (error) {
                console.error('[EditProfile] خطأ في تحميل الإيميل من التخزين:', error);
                Alert.alert('خطأ', 'لم نتمكن من تحميل بريدك الإلكتروني.');
            }

            // 3. (اختياري) تحميل بيانات أخرى محفوظة مثل الاسم، المنطقة إذا لزم الأمر
            // const storedUsername = await AsyncStorage.getItem(`user:${email}:username`); // استخدم email المحمل
            // if (storedUsername) setUserName(storedUsername);
            // const storedRegion = await AsyncStorage.getItem(`user:${email}:region`);
            // if (storedRegion) setRegion(storedRegion);
        };

        loadInitialData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []); // ينفذ مرة واحدة عند تحميل الكومبوننت

    // تأثير لتحديث نص عرض التاريخ عند تغيير التاريخ أو اللغة
    useEffect(() => {
        if (dateSelected && birthDate) {
            setDateDisplay(birthDate.toLocaleDateString(language === 'ar' ? 'ar-EG' : 'en-US'));
        } else {
            setDateDisplay(currentTranslations.selectDate); // عرض النص الافتراضي إذا لم يتم تحديد تاريخ
        }
    }, [birthDate, dateSelected, language, currentTranslations.selectDate]); // يعتمد على هذه المتغيرات

    // --- دوال مساعدة ---

    // دالة تحميل الوضع الداكن
    const loadDarkMode = async () => {
        try {
            const darkModeValue = await AsyncStorage.getItem('darkMode');
            setIsDarkMode(darkModeValue === 'true');
            console.log('[EditProfile] Dark mode loaded:', darkModeValue === 'true');
        } catch (error) {
            console.error('خطأ في تحميل تفضيل الوضع الداكن:', error);
        }
    };

    // دوال اختيار الصورة
    const pickImage = async () => {
         let result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            aspect: [1, 1],
            quality: 1,
        });

        if (!result.canceled) {
            if (result.assets && result.assets.length > 0) {
                setProfileImage({ uri: result.assets[0].uri });
            }
        }
    };
    const takePhoto = async () => {
        let result = await ImagePicker.launchCameraAsync({
            allowsEditing: true,
            aspect: [1, 1],
            quality: 1,
        });

        if (!result.canceled) {
            if (result.assets && result.assets.length > 0) {
                setProfileImage({ uri: result.assets[0].uri });
            }
        }
    };
    const removePhoto = () => {
        setProfileImage(require('./assets/profile.png'));
    };
    const showImageOptions = () => {
         Alert.alert(
            currentTranslations.editProfileName,
            '',
            [
                { text: currentTranslations.removePhoto, onPress: removePhoto, style: 'destructive', },
                { text: currentTranslations.takePhoto, onPress: takePhoto, },
                { text: currentTranslations.chooseFromLibrary, onPress: pickImage, },
                { text: currentTranslations.cancel, style: 'cancel', },
            ],
            { cancelable: true }
        );
    };

    // دوال اختيار التاريخ
    const showDatepicker = () => {
         if (Platform.OS === 'android') {
            DateTimePickerAndroid.open({
                value: birthDate || new Date(),
                onChange: onChangeDate,
                mode: 'date',
                display: 'spinner',
                maximumDate: new Date(), // لا يمكن اختيار تاريخ في المستقبل
                themeVariant: isDarkMode ? 'dark' : 'light',
            });
        } else {
            setShowDatePicker(true); // إظهار الـ modal في iOS
        }
    };
    const onChangeDate = (event, selectedDate) => {
        const currentDate = selectedDate || birthDate; // Use selected or keep current if cancelled
        setShowDatePicker(Platform.OS === 'ios'); // Keep open on iOS until confirmed/cancelled

        if (event.type === 'set') { // User confirmed a date (Android or iOS "OK")
            setBirthDate(currentDate);
            setDateSelected(true);
            setShowDatePicker(false); // Close picker on iOS after confirmation
            setShowFullCalendar(false); // Close spinner/calendar part
        } else if (event.type === 'dismissed' && Platform.OS === 'android') {
            // Android dismissed, do nothing special, it closes automatically
            setShowDatePicker(false);
        } else if (Platform.OS === 'ios') {
            // iOS potentially interacted without confirming (e.g., scrolled spinner)
            // We keep birthDate as is for now, confirmation happens in renderIOSDatePicker buttons
             setBirthDate(currentDate); // Update the state live on iOS spinner change
             setDateSelected(true); // Mark as selected even during scroll
        }
    };

    // دالة الحفظ
    const handleSave = async () => {
        const updatedBirthDate = birthDate ? birthDate.toISOString() : null; // تحويل التاريخ لـ ISO string أو null
        const loggedInEmail = await AsyncStorage.getItem('loggedInEmail'); // قراءة الإيميل الأصلي

        if (!loggedInEmail) {
            Alert.alert('خطأ', 'لم يتم العثور على البريد الإلكتروني للمستخدم. الرجاء تسجيل الدخول مرة أخرى.');
            return;
        }

        // *** الإيميل للحفظ هو دائماً الإيميل الذي تم تحميله من الحالة (لأنه غير قابل للتعديل) ***
        const emailToSave = email;

        // بيانات المستخدم المراد حفظها
        const userData = {
            email: emailToSave, // الإيميل المحمل (غير قابل للتعديل)
            username: userName,
            birthDate: updatedBirthDate,
            region: region,
            profileImage: profileImage?.uri // حفظ مسار الصورة (uri) فقط
        };

        try {
            // يتم الحفظ باستخدام مفتاح يعتمد على الإيميل الأصلي المسجل به الدخول
            const storageKey = `user:${loggedInEmail}`;
            await AsyncStorage.setItem(storageKey, JSON.stringify(userData));
            console.log(`[EditProfile] تم حفظ بيانات الملف الشخصي للمستخدم: ${loggedInEmail}`);
            Alert.alert('نجاح', 'تم حفظ التغييرات بنجاح.'); // إشعار للمستخدم

            // استدعاء دالة onSave (إذا تم تمريرها) لإعلام الشاشة السابقة بالتغييرات
            onSave({
                name: userName,
                email: emailToSave, // إرسال الإيميل الذي تم حفظه
                region: region,
                birthDate: updatedBirthDate,
                profileImage: profileImage?.uri,
            });

            navigation.goBack(); // <-- الرجوع للشاشة السابقة

        } catch (error) {
            console.error('خطأ في حفظ بيانات الملف الشخصي:', error);
            Alert.alert('خطأ', 'فشل حفظ بيانات الملف الشخصي.');
        }
    };

    // دالة عرض منتقي التاريخ لـ iOS
    const renderIOSDatePicker = () => {
         if (showDatePicker && Platform.OS === 'ios') {
            return (
                <View style={{ backgroundColor: isDarkMode ? '#333' : '#f0f0f0', borderRadius: 10, overflow: 'hidden', marginVertical: 10 }}>
                    {/* Spinner Picker */}
                    <DateTimePicker
                        testID="dateTimePickerSpinner"
                        value={birthDate || new Date()} // Use state variable
                        mode="date"
                        display="spinner" // Shows the wheels
                        onChange={onChangeDate} // Use the main handler
                        maximumDate={new Date()}
                        themeVariant={isDarkMode ? "dark" : 'light'}
                    />
                    {/* Buttons for explicit confirmation/cancel */}
                    <View style={{ flexDirection: 'row', justifyContent: 'space-around', paddingBottom: 15, paddingTop: 10, borderTopWidth: 1, borderTopColor: isDarkMode ? '#555' : '#ccc' }}>
                        <TouchableOpacity
                            style={[styles.pickerButton, { backgroundColor: '#dc3545' }]} // Cancel button style
                            onPress={() => {
                                setShowDatePicker(false); // Close the picker
                                // Reset date to initial state ONLY if needed (or keep last selected)
                                const originalDate = initialBirthDate ? new Date(initialBirthDate) : null;
                                setBirthDate(originalDate); // Reset to original passed date
                                setDateSelected(!!originalDate);
                            }}
                        >
                            <Text style={[styles.pickerButtonText, { color: 'white' }]}>{currentTranslations.cancel}</Text>
                        </TouchableOpacity>
                         <TouchableOpacity
                            style={[styles.pickerButton, { backgroundColor: '#007bff' }]} // OK button style
                            onPress={() => {
                                // Date should already be set by onChangeDate via live update
                                setShowDatePicker(false); // Close the picker
                                // Ensure dateSelected is true if birthDate exists after confirm
                                if (birthDate) {
                                    setDateSelected(true);
                                }
                            }}
                        >
                            <Text style={[styles.pickerButtonText, { color: 'white' }]}>Ok</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            );
        }
        return null;
    };


    // --- العرض (JSX) ---
    return (
        <SafeAreaView style={[styles.safeArea, isDarkMode && styles.darkSafeArea]}>
            {/* الهيدر */}
            <View style={[styles.header, isDarkMode && styles.darkHeader]}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color={isDarkMode ? "white" : "#333"} />
                </TouchableOpacity>
                <Text style={[styles.headerTitle, isDarkMode && styles.darkHeaderTitle]}>{currentTranslations.editProfile}</Text>
                 <View style={{ width: 24 + 10 }} /> {/* عنصر وهمي للتوسيط */}
            </View>

            <ScrollView style={[styles.container, isDarkMode && styles.darkContainer]} keyboardShouldPersistTaps="handled">
                {/* قسم الصورة الشخصية */}
                <View style={[styles.profileHeader, isDarkMode && styles.darkProfileHeader]}>
                    <View style={styles.imageAndIconContainer}>
                        <TouchableOpacity onPress={showImageOptions} style={[styles.imageContainer, isDarkMode && styles.darkImageContainer]}>
                            <Image
                                source={profileImage}
                                style={styles.profileImage}
                                resizeMode="cover"
                            />
                        </TouchableOpacity>
                        <TouchableOpacity style={[styles.cameraIconContainer, isDarkMode && styles.darkCameraIconContainer]} onPress={showImageOptions}>
                            <Image source={require('./assets/camera.png')} style={styles.cameraLogo} />
                        </TouchableOpacity>
                    </View>
                </View>

                {/* قسم حقول الإدخال والزر */}
                <View style={styles.inputAndButtonContainer}>
                    <View style={[styles.inputContainer, isDarkMode && styles.darkInputContainer]}>
                        {/* حقل الاسم */}
                        <Text style={[styles.label, isDarkMode && styles.darkLabel]}>{currentTranslations.yourName}</Text>
                        <TextInput
                            style={[styles.input, isDarkMode && styles.darkInput]}
                            value={userName}
                            onChangeText={setUserName}
                            placeholderTextColor={isDarkMode ? '#aaa' : '#777'}
                            placeholder={currentTranslations.yourName} // Placeholder text
                        />

                        {/* --- حقل البريد الإلكتروني (غير قابل للتعديل) --- */}
                        <Text style={[styles.label, isDarkMode && styles.darkLabel]}>{currentTranslations.email}</Text>
                        <TextInput
                            style={[
                                styles.input, // الستايل الأساسي
                                isDarkMode && styles.darkInput, // ستايل الوضع الداكن
                                // ستايل إضافي لتمييز الحقل غير القابل للتعديل
                                styles.readOnlyInput,
                                isDarkMode && styles.darkReadOnlyInput
                            ]}
                            value={email} // يعرض الإيميل المحمل من AsyncStorage
                            // onChangeText لا نحتاجها هنا
                            placeholderTextColor={isDarkMode ? '#aaa' : '#777'}
                            keyboardType="email-address"
                            autoCapitalize="none"
                            editable={false} // <-- *** التغيير الأساسي: منع التعديل ***
                            selectTextOnFocus={false} // <-- منع تحديد النص عند الضغط (تجربة أفضل)
                            placeholder={currentTranslations.email} // Placeholder text
                        />
                        {/* --- نهاية حقل البريد الإلكتروني --- */}

                        {/* حقل المنطقة */}
                        <Text style={[styles.label, isDarkMode && styles.darkLabel]}>{currentTranslations.region}</Text>
                        <TextInput
                            style={[styles.input, isDarkMode && styles.darkInput]}
                            value={region}
                            onChangeText={setRegion}
                            placeholderTextColor={isDarkMode ? '#aaa' : '#777'}
                             placeholder={currentTranslations.region} // Placeholder text
                        />

                        {/* حقل تاريخ الميلاد */}
                        <Text style={[styles.label, isDarkMode && styles.darkLabel]}>{currentTranslations.yourBirthday}</Text>
                        <TouchableOpacity
                            testID="datePickerButton"
                            onPress={showDatepicker} // فتح منتقي التاريخ عند الضغط
                            style={[styles.datePickerInput, isDarkMode && styles.darkDatePickerInput]}
                        >
                            <Text style={[styles.dateText, isDarkMode && styles.darkDateText, !dateSelected && styles.datePlaceholder]}>
                                {dateDisplay} {/* عرض التاريخ المحدد أو النص الافتراضي */}
                            </Text>
                            <Ionicons name="calendar" size={24} color={isDarkMode ? 'white' : '#ffd700'} />
                        </TouchableOpacity>

                        {/* عرض منتقي التاريخ لـ iOS (يظهر فقط عند الحاجة) */}
                        {renderIOSDatePicker()}
                    </View>

                    {/* زر الحفظ */}
                    <TouchableOpacity style={[styles.saveButton, isDarkMode && styles.darkSaveButton]} onPress={handleSave}>
                        <Text style={[styles.saveButtonText, isDarkMode && styles.darkSaveButtonText]}>{currentTranslations.save}</Text>
                    </TouchableOpacity>
                </View>
            </ScrollView>
        </SafeAreaView>
    );
};

// --- الستايلات ---
const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: '#fff',
    },
    darkSafeArea: {
        backgroundColor: '#121212',
    },
    container: {
        flex: 1,
        paddingHorizontal: 18, // Padding أفقي للحاوية الرئيسية
    },
    darkContainer: {
        backgroundColor: '#121212',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between', // يوزع المسافة بين العناصر
        paddingBottom: 10,
        paddingHorizontal: 18, // Padding أفقي للهيدر
        paddingTop: Platform.OS === 'android' ? 15 : 10,
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
        backgroundColor: '#fff',
        height: 60,
    },
    darkHeader: {
        backgroundColor: '#1e1e1e',
        borderBottomColor: '#333',
    },
    backButton: {
        padding: 5,
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#333',
        textAlign: 'center',
    },
    darkHeaderTitle: {
        color: 'white',
    },
    profileHeader: {
        marginTop: 25,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 30,
    },
    darkProfileHeader: {
        // No changes needed here
    },
    imageAndIconContainer: {
        position: 'relative',
        width: imageSize,
        height: imageSize,
    },
    imageContainer: {
        width: imageSize,
        height: imageSize,
        borderRadius: imageSize / 2,
        overflow: 'hidden',
        borderWidth: 2,
        borderColor: '#ffd700',
    },
    darkImageContainer: {
        borderColor: '#555',
    },
    profileImage: {
        width: '100%',
        height: '100%',
    },
    cameraIconContainer: {
        position: 'absolute',
        bottom: 5,
        right: 5,
        backgroundColor: '#ffd700',
        borderRadius: (iconSize + 10) / 2,
        padding: 5,
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 1, },
        shadowOpacity: 0.2,
        shadowRadius: 1.5,
        elevation: 3,
    },
    darkCameraIconContainer: {
        backgroundColor: '#555',
    },
    cameraLogo: {
        width: iconSize,
        height: iconSize,
        resizeMode: 'contain',
    },
    inputAndButtonContainer: {
        // No changes needed here
    },
    inputContainer: {
        backgroundColor: '#fff',
        padding: 20,
        borderRadius: 15,
        marginBottom: 20,
        ...Platform.select({
            ios: { shadowColor: 'black', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, },
            android: { elevation: 5, },
        }),
    },
    darkInputContainer: {
        backgroundColor: '#1e1e1e',
        ...Platform.select({
            ios: { shadowColor: 'rgba(255,255,255,0.1)', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, },
            android: { elevation: 5, },
        }),
    },
    label: {
        fontSize: 15,
        marginBottom: 8,
        color: '#555',
        fontWeight: '600',
    },
    darkLabel: {
        color: '#ccc',
    },
    input: { // الستايل العام للحقول القابلة للتعديل
        borderWidth: 1,
        borderColor: '#ddd',
        borderRadius: 8,
        paddingVertical: 12,
        paddingHorizontal: 15,
        marginBottom: 20,
        fontSize: 16,
        color: '#333',
        backgroundColor: '#f9f9f9',
    },
    darkInput: { // تعديلات الوضع الداكن للحقول القابلة للتعديل
        borderColor: '#444',
        color: 'white',
        backgroundColor: '#333',
    },
    readOnlyInput: { // ستايل إضافي للحقول غير القابلة للتعديل (وضع فاتح)
        backgroundColor: '#f0f0f0', // خلفية أغمق قليلاً
        color: '#666', // نص رمادي
        borderColor: '#e0e0e0', // حدود أفتح
    },
    darkReadOnlyInput: { // ستايل إضافي للحقول غير القابلة للتعديل (وضع داكن)
        backgroundColor: '#2a2a2a', // خلفية أغمق قليلاً من الحقول العادية الداكنة
        color: '#aaa', // نص رمادي فاتح
        borderColor: '#3a3a3a', // حدود أغمق
    },
    datePickerInput: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#ddd',
        borderRadius: 8,
        paddingVertical: 12,
        paddingHorizontal: 15,
        marginBottom: 20,
        backgroundColor: '#f9f9f9',
    },
    darkDatePickerInput: {
        borderColor: '#444',
        backgroundColor: '#333',
    },
    dateText: {
        fontSize: 16,
        color: '#333',
    },
    darkDateText: {
        color: 'white',
    },
    datePlaceholder: {
        color: '#999',
    },
    pickerButton: {
        paddingHorizontal: 20,
        paddingVertical: 10,
        borderRadius: 5,
        marginHorizontal: 10,
    },
    pickerButtonText: {
        fontSize: 16,
        fontWeight: 'bold',
        textAlign: 'center',
    },
    saveButton: {
        backgroundColor: '#ffdd00',
        paddingVertical: 15,
        borderRadius: 25,
        alignItems: 'center',
        marginTop: -5,
        marginBottom: 20,
        elevation: 8,
        shadowColor: '#ffdd00',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.6,
        shadowRadius: 8,
    },
    darkSaveButton: {
        backgroundColor: '#555',
        elevation: 8,
        shadowColor: '#aaa',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.4,
        shadowRadius: 8,
    },
    saveButtonText: {
        color: '#333',
        fontSize: 18,
        fontWeight: 'bold',
    },
    darkSaveButtonText: {
        color: 'white',
    },
});

export default EditProfileScreen;