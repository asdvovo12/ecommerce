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

const SignUp = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [passwordVisible, setPasswordVisible] = useState(false);
    const [confirmPasswordVisible, setConfirmPasswordVisible] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const navigation = useNavigation();

    const isValidEmail = (email) => {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    };

    const handleSignUp = async () => {
        if (isLoading) return; // منع الضغطات المتعددة

        // --- Validation ---
        if (!isValidEmail(email)) {
            Alert.alert('Invalid Email', 'Please enter a valid email address.');
            return;
        }
        if (password.length < 6) {
            Alert.alert('Weak Password', 'Password must be at least 6 characters long.');
            return;
        }
        if (password !== confirmPassword) {
            Alert.alert('Password Mismatch', 'The passwords do not match.');
            return;
        }

        setIsLoading(true);

        const { data, error } = await supabase.auth.signUp({
            email: email.toLowerCase().trim(),
            password: password,
        });

        setIsLoading(false);

        if (error) {
            Alert.alert('Sign Up Error', error.message);
        } else if (data.user) {
            // Supabase يرسل إيميل تأكيد تلقائياً
            // إذا كان المستخدم موجوداً ولكن لم يؤكد بريده، سيتم إعادة إرسال الإيميل
            Alert.alert(
                'Verification Email Sent',
                `A confirmation link has been sent to ${data.user.email}. Please check your inbox and spam folder.`,
                [
                    {
                        text: 'OK',
                        onPress: () => navigation.navigate('VerifyEmail', { email: data.user.email, flow: 'signup' }),
                    },
                ]
            );
        }
    };

    const handleGoBack = () => {
        if (!isLoading && navigation.canGoBack()) {
            navigation.goBack();
        }
    };

    // --- Social sign up عبر Supabase OAuth ---
    const handleSocialSignUp = async (provider) => {
        if (isLoading) return;
        setIsLoading(true);
        try {
            const session = await signInWithProvider(provider);
            if (session) {
                // نجح التسجيل/الدخول -> روح للشاشة الرئيسية
                navigation.reset({ index: 0, routes: [{ name: 'Dashboard' }] });
            }
            // لو session = null يبقى المستخدم قفل نافذة تسجيل الدخول، مفيش داعي لأي رسالة.
        } catch (e) {
            Alert.alert('Sign Up Error', e?.message || 'Something went wrong. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleGoogleSignUp = () => handleSocialSignUp('google');
    const handleFacebookSignUp = () => handleSocialSignUp('facebook');

    return (
        <ScrollView contentContainerStyle={styles.scrollContainer} keyboardShouldPersistTaps="handled">
            <View style={styles.container}>
                {navigation.canGoBack() && (
                    <View style={styles.header}>
                        <TouchableOpacity onPress={handleGoBack} style={styles.backButton} disabled={isLoading}>
                            <Icon name="arrow-back" size={24} color="#333" />
                        </TouchableOpacity>
                    </View>
                )}
                <View style={styles.logoContainer}>
                    <Image source={require('./assets/logo.png')} style={styles.logo} />
                </View>
                <Text style={styles.title}>Create your Account</Text>
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
                    <TouchableOpacity onPress={() => setPasswordVisible(!passwordVisible)} style={styles.eyeIcon} disabled={isLoading}>
                        <Icon name={passwordVisible ? 'visibility' : 'visibility-off'} size={24} color="#888" />
                    </TouchableOpacity>
                </View>
                <View style={styles.passwordContainer}>
                    <TextInput
                        style={[styles.input, styles.passwordInput, isLoading && styles.inputDisabled]}
                        placeholder="Confirm Password"
                        value={confirmPassword}
                        onChangeText={setConfirmPassword}
                        secureTextEntry={!confirmPasswordVisible}
                        editable={!isLoading}
                        placeholderTextColor="#888"
                    />
                    <TouchableOpacity onPress={() => setConfirmPasswordVisible(!confirmPasswordVisible)} style={styles.eyeIcon} disabled={isLoading}>
                        <Icon name={confirmPasswordVisible ? 'visibility' : 'visibility-off'} size={24} color="#888" />
                    </TouchableOpacity>
                </View>
                <TouchableOpacity
                    style={[styles.mainButton, styles.signUpButton, isLoading && styles.buttonDisabled]}
                    onPress={handleSignUp}
                    disabled={isLoading}
                >
                    {isLoading ? <ActivityIndicator size="small" color="#000" /> : <Text style={styles.mainButtonText}>Sign up</Text>}
                </TouchableOpacity>
                <Text style={styles.orText}>- Or sign up with -</Text>
                <View style={styles.socialButtonsContainer}>
                    <TouchableOpacity style={[styles.socialButtonBase, styles.socialButtonRound, isLoading && styles.buttonDisabled]} onPress={handleGoogleSignUp} disabled={isLoading}>
                        <Image source={require('./assets/google.png')} style={styles.socialIcon} />
                    </TouchableOpacity>
                    <TouchableOpacity style={[styles.socialButtonBase, styles.socialButtonRound, isLoading && styles.buttonDisabled]} onPress={handleFacebookSignUp} disabled={isLoading}>
                        <Image source={require('./assets/facebook.png')} style={styles.socialIcon} />
                    </TouchableOpacity>
                </View>
                <View style={styles.footerLinkContainer}>
                    <Text style={styles.footerText}>Already have an account? </Text>
                    <TouchableOpacity onPress={() => !isLoading && navigation.navigate('SignIn')} disabled={isLoading}>
                        <Text style={styles.footerLink}>Sign in</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </ScrollView>
    );
};

// --- Styles (تظل كما هي) ---
const styles = StyleSheet.create({
    scrollContainer: { flexGrow: 1 },
    container: { flex: 1, backgroundColor: '#fff', paddingHorizontal: 25, paddingVertical: 20 },
    header: { height: 50, justifyContent: 'center', alignItems: 'flex-start', marginBottom: 10, zIndex: 1 },
    backButton: { padding: 10 },
    logoContainer: { alignSelf: 'center', marginBottom: 20 },
    logo: { width: 130, height: 130, resizeMode: 'contain' },
    title: { fontSize: 26, fontWeight: 'bold', marginBottom: 30, textAlign: 'center', color: '#333' },
    input: { borderWidth: 1, borderColor: '#ccc', borderRadius: 8, paddingVertical: 14, paddingHorizontal: 15, marginBottom: 18, width: '100%', backgroundColor: '#f9f9f9', fontSize: 16, color: '#333' },
    inputDisabled: { backgroundColor: '#eee', color: '#999' },
    passwordContainer: { flexDirection: 'row', alignItems: 'center', width: '100%', position: 'relative', marginBottom: 18 },
    passwordInput: { flex: 1, marginBottom: 0, paddingRight: 50 },
    eyeIcon: { position: 'absolute', right: 0, height: '100%', width: 50, justifyContent: 'center', alignItems: 'center', zIndex: 1 },
    mainButton: { borderRadius: 8, paddingVertical: 15, alignItems: 'center', marginTop: 15, width: '100%', minHeight: 50, justifyContent: 'center' },
    signUpButton: { backgroundColor: '#ffdd00' },
    mainButtonText: { color: '#000', fontSize: 17, fontWeight: 'bold' },
    buttonDisabled: { backgroundColor: '#E0E0E0', opacity: 0.7 },
    orText: { textAlign: 'center', marginVertical: 25, color: '#777', fontSize: 14, fontWeight: '500' },
    socialButtonsContainer: { flexDirection: 'row', justifyContent: 'center', marginBottom: 25 },
    socialButtonBase: { borderWidth: 1, borderColor: '#ddd', marginHorizontal: 15, backgroundColor: '#fff', shadowColor: "#000", shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.15, shadowRadius: 1.5, elevation: 2 },
    socialButtonRound: { width: 60, height: 60, borderRadius: 30, justifyContent: 'center', alignItems: 'center' },
    socialIcon: { width: 50, height: 50, resizeMode: 'contain' },
    footerLinkContainer: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginTop: 15, marginBottom: 10 },
    footerText: { color: '#666', fontSize: 15 },
    footerLink: { color: '#007AFF', fontWeight: 'bold', marginLeft: 5, fontSize: 15 },
});

export default SignUp;