// screens/SignIn.js

import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Image,
  Alert,
  ActivityIndicator,
  ScrollView
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useNavigation } from '@react-navigation/native';
import { supabase } from './supabaseClient'; // تأكد من صحة المسار
import { signInWithProvider } from './services/socialAuth';

const SignInScreen = () => {
    const navigation = useNavigation();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [passwordVisible, setPasswordVisible] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    const handleSignIn = async () => {
        if (isLoading) return;

        if (!email || !password) {
            Alert.alert('Missing Information', 'Please enter both email and password.');
            return;
        }

        setIsLoading(true);

        const { data, error } = await supabase.auth.signInWithPassword({
            email: email.toLowerCase().trim(),
            password: password,
        });

        setIsLoading(false);

        if (error) {
            // التعامل مع الأخطاء الشائعة
            if (error.message === 'Email not confirmed') {
                Alert.alert(
                    'Email Not Verified',
                    'Please check your email to verify your account before signing in.'
                );
            } else if (error.message === 'Invalid login credentials') {
                Alert.alert('Sign In Failed', 'The email or password you entered is incorrect.');
            } else {
                Alert.alert('Sign In Error', error.message);
            }
        } else if (data.session) {
            // نجح تسجيل الدخول، data.session سيكون موجوداً
            console.log('Sign in successful, navigating to main app...');
            // قم بإعادة تعيين مكدس التنقل لمنع المستخدم من العودة إلى شاشات المصادقة
            navigation.reset({
                index: 0,
                routes: [{ name: 'Dashboard' }], // استبدل 'Dashboard' بالاسم الصحيح لشاشتك الرئيسية
            });
        }
    };
    
    const handleForgotPassword = () => {
        if (!isLoading) {
            navigation.navigate('ForgotPassword'); // تأكد من وجود هذه الشاشة
        }
    };
    
    const handleGoBack = () => {
        if (!isLoading && navigation.canGoBack()) {
            navigation.goBack();
        }
    };
    
    // --- Social sign in عبر Supabase OAuth ---
    const handleSocialSignIn = async (provider) => {
        if (isLoading) return;
        setIsLoading(true);
        try {
            const session = await signInWithProvider(provider);
            if (session) {
                navigation.reset({ index: 0, routes: [{ name: 'Dashboard' }] });
            }
        } catch (e) {
            Alert.alert('Sign In Error', e?.message || 'Something went wrong. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleGoogleSignIn = () => handleSocialSignIn('google');
    const handleFacebookSignIn = () => handleSocialSignIn('facebook');
    
    return (
        <ScrollView contentContainerStyle={styles.scrollContainer} keyboardShouldPersistTaps="handled">
            <View style={styles.container}>
                {navigation.canGoBack() && (
                    <View style={styles.header}>
                        <TouchableOpacity style={styles.backButton} onPress={handleGoBack} disabled={isLoading}>
                            <Icon name="arrow-back" size={24} color="#333" />
                        </TouchableOpacity>
                    </View>
                )}
                <Image source={require('./assets/logo.png')} style={styles.logo} />
                <Text style={styles.title}>Login to your Account</Text>
                <View style={styles.inputContainer}>
                    <TextInput
                        style={[styles.input, isLoading && styles.inputDisabled]}
                        placeholder="Email"
                        value={email}
                        onChangeText={setEmail}
                        keyboardType="email-address"
                        autoCapitalize="none"
                        editable={!isLoading}
                        placeholderTextColor="#888"
                    />
                </View>
                <View style={styles.passwordContainer}>
                    <TextInput
                        style={[styles.input, styles.passwordInput, isLoading && styles.inputDisabled]}
                        placeholder="Password"
                        value={password}
                        onChangeText={setPassword}
                        secureTextEntry={!passwordVisible}
                        editable={!isLoading}
                        placeholderTextColor="#888"
                    />
                    <TouchableOpacity
                        style={styles.eyeIcon}
                        onPress={() => setPasswordVisible(!passwordVisible)}
                        disabled={isLoading}
                    >
                        <Icon name={passwordVisible ? 'visibility' : 'visibility-off'} size={24} color="#888" />
                    </TouchableOpacity>
                </View>
                <TouchableOpacity
                    onPress={handleForgotPassword}
                    style={styles.forgotPasswordContainer}
                    disabled={isLoading}
                >
                    <Text style={styles.forgotPasswordText}>Forgot password?</Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={[styles.mainButton, styles.signInButton, isLoading && styles.buttonDisabled]}
                    onPress={handleSignIn}
                    disabled={isLoading}
                >
                    {isLoading ? <ActivityIndicator size="small" color="#000" /> : <Text style={styles.mainButtonText}>Sign in</Text>}
                </TouchableOpacity>
                <Text style={styles.orText}>- Or sign in with -</Text>
                <View style={styles.socialButtonsContainer}>
                    <TouchableOpacity style={[styles.socialButtonBase, styles.socialButtonRound, isLoading && styles.buttonDisabled]} onPress={handleGoogleSignIn} disabled={isLoading}>
                        <Image source={require('./assets/google.png')} style={styles.socialIcon} />
                    </TouchableOpacity>
                    <TouchableOpacity style={[styles.socialButtonBase, styles.socialButtonRound, isLoading && styles.buttonDisabled]} onPress={handleFacebookSignIn} disabled={isLoading}>
                        <Image source={require('./assets/facebook.png')} style={styles.socialIcon} />
                    </TouchableOpacity>
                </View>
                <View style={styles.footerLinkContainer}>
                    <Text style={styles.footerText}>Don't have an account? </Text>
                    <TouchableOpacity onPress={() => !isLoading && navigation.navigate('SignUp')} disabled={isLoading}>
                        <Text style={styles.footerLink}>Sign up</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </ScrollView>
    );
};

// --- Styles (تظل كما هي) ---
const styles = StyleSheet.create({
    scrollContainer: { flexGrow: 1, justifyContent: 'center' },
    container: { flex: 1, backgroundColor: '#fff', paddingHorizontal: 25, paddingVertical: 20, paddingTop: 60, justifyContent: 'center' },
    header: { position: 'absolute', top: 40, left: 15, height: 50, justifyContent: 'center', alignItems: 'flex-start', zIndex: 1 },
    backButton: { padding: 10 },
    logo: { width: 130, height: 130, resizeMode: 'contain', marginBottom: 30, alignSelf: 'center' },
    title: { fontSize: 26, fontWeight: 'bold', marginBottom: 30, color: '#333', textAlign: 'center' },
    inputContainer: { marginBottom: 18, width: '100%' },
    input: { borderWidth: 1, borderColor: '#ccc', borderRadius: 8, paddingVertical: 14, paddingHorizontal: 15, width: '100%', backgroundColor: '#f9f9f9', fontSize: 16, color: '#333' },
    inputDisabled: { backgroundColor: '#eee', color: '#999' },
    passwordContainer: { flexDirection: 'row', alignItems: 'center', width: '100%', position: 'relative', marginBottom: 18 },
    passwordInput: { flex: 1, paddingRight: 50 },
    eyeIcon: { position: 'absolute', right: 0, height: '100%', width: 50, justifyContent: 'center', alignItems: 'center', zIndex: 1 },
    forgotPasswordContainer: { alignSelf: 'flex-end', marginBottom: 25, marginRight: 5 },
    forgotPasswordText: { color: '#007AFF', fontWeight: '600', fontSize: 14 },
    mainButton: { borderRadius: 8, paddingVertical: 15, alignItems: 'center', marginTop: 5, width: '100%', minHeight: 50, justifyContent: 'center' },
    signInButton: { backgroundColor: '#ffdd00' },
    mainButtonText: { color: '#000', fontSize: 17, fontWeight: 'bold' },
    buttonDisabled: { backgroundColor: '#E0E0E0', opacity: 0.7 },
    orText: { textAlign: 'center', marginVertical: 30, color: '#777', fontSize: 14, fontWeight: '500' },
    socialButtonsContainer: { flexDirection: 'row', justifyContent: 'center', marginBottom: 30 },
    socialButtonBase: { borderWidth: 1, borderColor: '#ddd', marginHorizontal: 15, backgroundColor: '#fff', shadowColor: "#000", shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.15, shadowRadius: 1.5, elevation: 2 },
    socialButtonRound: { width: 60, height: 60, borderRadius: 30, justifyContent: 'center', alignItems: 'center' },
    socialIcon: { width: 50, height: 50, resizeMode: 'contain' },
    footerLinkContainer: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginTop: 25, marginBottom: 10 },
    footerText: { color: '#666', fontSize: 15 },
    footerLink: { color: '#007AFF', fontWeight: 'bold', marginLeft: 5, fontSize: 15 },
});

export default SignInScreen;