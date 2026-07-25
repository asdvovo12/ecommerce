// ChangeLanguageScreen.js  (language.js)
import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { AntDesign } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import i18n, { LANGUAGE_KEY, changeAppLanguage } from './i18n';

const ChangeLanguageScreen = () => {
    const [selectedLanguage, setSelectedLanguage] = useState(i18n.language || 'en');
    const [initialLanguage, setInitialLanguage] = useState(i18n.language || 'en');
    const [isDarkMode, setIsDarkMode] = useState(false);
    const navigation = useNavigation();
    const { t } = useTranslation();

    const languages = ['ar', 'en'];
    const languageNames = {
        ar: t('Arabic'),
        en: t('English'),
    };

    const loadSettings = async () => {
        try {
            const darkModeValue = await AsyncStorage.getItem('darkMode');
            setIsDarkMode(darkModeValue === 'true');

            const storedLanguage = await AsyncStorage.getItem(LANGUAGE_KEY);
            const languageToUse = storedLanguage || i18n.language || 'en';

            setSelectedLanguage(languageToUse);
            setInitialLanguage(languageToUse);
            console.log('Loaded language:', languageToUse);
        } catch (error) {
            console.error('Error loading settings:', error);
            Alert.alert(t('Error'), t('Failed to load settings.'));
        }
    };

    useFocusEffect(
        React.useCallback(() => {
            loadSettings();
        }, [])
    );

    const handleLanguageSelection = (language) => {
        setSelectedLanguage(language);
    };

    const handleSave = async () => {
        if (!selectedLanguage) return;

        try {
            // بتغيّر اللغة وتحفظها في نفس المفتاح المستخدم في i18n.js
            await changeAppLanguage(selectedLanguage);
            setInitialLanguage(selectedLanguage);
            console.log('Language saved successfully:', selectedLanguage);
            navigation.goBack();
        } catch (error) {
            console.error('Error saving language preference:', error);
            Alert.alert(t('Error'), t('Could not save language preference.'));
        }
    };

    const handleGoBack = () => {
        // اللغة مش بتتغير غير بعد الحفظ، فمفيش حاجة نرجّعها
        navigation.goBack();
    };

    return (
        <View style={[styles.container, isDarkMode && styles.darkContainer]}>
            <View style={[styles.header, isDarkMode && styles.darkHeader]}>
                <TouchableOpacity
                    style={[styles.backButton, isDarkMode && styles.darkBackButton]}
                    onPress={handleGoBack}
                >
                    <AntDesign name="arrowleft" size={24} color={isDarkMode ? 'white' : 'black'} />
                </TouchableOpacity>
                <Text
                    style={[
                        styles.headerTitle,
                        { flex: 1, textAlign: 'center' },
                        isDarkMode && styles.darkHeaderTitle,
                    ]}
                >
                    {t('Change Language')}
                </Text>
                <View style={{ width: 34 }} />
            </View>

            <ScrollView
                style={[
                    styles.languageList,
                    { marginTop: 40 },
                    isDarkMode && styles.darkmodeContainer,
                ]}
            >
                {languages.map((languageCode) => (
                    <TouchableOpacity
                        key={languageCode}
                        style={[styles.languageItem, isDarkMode && styles.darkmodeContainer]}
                        onPress={() => handleLanguageSelection(languageCode)}
                    >
                        <View
                            style={[
                                styles.radioButton,
                                selectedLanguage === languageCode && styles.selectedRadioButton,
                                isDarkMode && styles.darkRadioButton,
                            ]}
                        >
                            {selectedLanguage === languageCode && (
                                <View
                                    style={[
                                        styles.radioButtonInner,
                                        isDarkMode && styles.darkRadioButtonInner,
                                    ]}
                                />
                            )}
                        </View>
                        <Text style={[styles.languageText, isDarkMode && styles.darkText]}>
                            {languageNames[languageCode]}
                        </Text>
                    </TouchableOpacity>
                ))}
            </ScrollView>

            <TouchableOpacity
                style={[styles.saveButton, isDarkMode && styles.darkSaveButton]}
                onPress={handleSave}
            >
                <Text style={[styles.saveButtonText, isDarkMode && styles.darkSaveButtonText]}>
                    {t('Save')}
                </Text>
            </TouchableOpacity>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
        paddingTop: 50,
        paddingHorizontal: 16,
    },
    darkContainer: {
        backgroundColor: '#121212',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 20,
    },
    darkHeader: {},
    darkBackButton: {},
    backButton: {
        marginRight: 10,
    },
    headerTitle: {
        fontSize: 24,
        fontWeight: 'bold',
        color: 'black',
    },
    darkHeaderTitle: {
        color: 'white',
    },
    languageList: {
        flex: 1,
    },
    languageItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
    },
    darkmodeContainer: {
        borderBottomColor: '#555',
    },
    radioButton: {
        width: 24,
        height: 24,
        borderRadius: 12,
        borderWidth: 2,
        borderColor: '#f2d911',
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 12,
    },
    selectedRadioButton: {
        borderColor: '#f2d911',
        backgroundColor: '#fff',
    },
    radioButtonInner: {
        width: 12,
        height: 12,
        borderRadius: 6,
        backgroundColor: '#f2d911',
    },
    darkRadioButton: {
        borderColor: '#555',
    },
    darkRadioButtonInner: {
        backgroundColor: '#555',
    },
    languageText: {
        fontSize: 18,
        color: 'black',
    },
    darkText: {
        color: 'white',
    },
    saveButton: {
        backgroundColor: '#ffdd00',
        paddingVertical: 16,
        paddingHorizontal: 32,
        borderRadius: 30,
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 20,
        marginBottom: 20,
        alignSelf: 'center',
        width: '90%',
        elevation: 10,
        shadowColor: '#ffdd00',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 1,
        shadowRadius: 10,
    },
    darkSaveButton: {
        backgroundColor: '#555',
        elevation: 10,
        shadowColor: '#FFFFFF',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.8,
        shadowRadius: 10,
    },
    saveButtonText: {
        color: '#333',
        fontSize: 20,
        fontWeight: 'bold',
    },
    darkSaveButtonText: {
        color: 'white',
    },
});

export default ChangeLanguageScreen;