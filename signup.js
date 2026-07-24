// screens/SignUp.js
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
    ScrollView,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useNavigation } from '@react-navigation/native';
import { supabase } from './supabaseClient';
import { signInWithProvider } from './services/socialAuth';

const SignUp = () => {
    const navigation = useNavigation();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [passwordVisible, setPasswordVisible] = useState(false);
    const [confirmPasswordVisible, setConfirmPasswordVisible] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    const isValidEmail = (emailAddress) => {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(emailAddress.trim());
    };

    const handleSignUp = async () => {
        if (isLoading) return;
        const normalizedEmail = email.toLowerCase().trim();

        if (!normalizedEmail) {
            Alert.alert('Missing Email', 'Please enter your email address.');
            return;
        }
        if (!isValidEmail(normalizedEmail)) {
            Alert.alert('Invalid Email', 'Please enter a valid email address.');
            return;
        }
        if (!password) {
            Alert.alert('Missing Password', 'Please enter your password.');
            return;
        }
        if (password.length < 6) {
            Alert.alert('Weak Password', 'Password must be at least 6 characters long.');
            return;
        }
        if (!confirmPassword) {
            Alert.alert('Confirm Password', 'Please confirm your password.');
            return;
        }
        if (password !== confirmPassword) {
            Alert.alert('Password Mismatch', 'The passwords do not match.');
            return;
        }

        setIsLoading(true);
        try {
            const { data, error } = await supabase.auth.signUp({
                email: normalizedEmail,
                password,
            });

            if (error) {
                Alert.alert('Sign Up Error', error.message);
                return;
            }

            // ===== الجزء المهم =====
            // ييجي إيميل فيه لينك "أكد حسابك".
            // نطلع رسالة، وبعد OK نروح لشاشة Sign In (مش شاشة الأرقام).
            if (data?.user) {
                Alert.alert(
                    'Confirm your account',
                    'We sent a confirmation link to your email. Please confirm your account, then sign in.',
                    [
                        {
                            text: 'OK',
                            onPress: () =>
                                navigation.reset({
                                    index: 0,
                                    routes: [{ name: 'SignIn' }],
                                }),
                        },
                    ]
                );
            }
        } catch (error) {
            Alert.alert(
                'Sign Up Error',
                error?.message || 'Something went wrong. Please try again.'
            );
        } finally {
            setIsLoading(false);
        }
    };

    const handleGoBack = () => {
        if (!isLoading && navigation.canGoBack()) {
            navigation.goBack();
        }
    };

    const handleSocialSignUp = async (provider) => {
        if (isLoading) return;
        setIsLoading(true);
        try {
            const session = await signInWithProvider(provider);
            if (session) {
                navigation.reset({
                    index: 0,
                    routes: [{ name: 'Dashboard' }],
                });
            }
        } catch (error) {
            Alert.alert(
                'Sign Up Error',
                error?.message || 'Something went wrong. Please try again.'
            );
        } finally {
            setIsLoading(false);
        }
    };

    const handleGoogleSignUp = () => handleSocialSignUp('google');
    const handleFacebookSignUp = () => handleSocialSignUp('facebook');

    return (
        <ScrollView
            contentContainerStyle={styles.scrollContainer}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
        >
            <View style={styles.container}>
                {navigation.canGoBack() && (
                    <View style={styles.header}>
                        <TouchableOpacity
                            style={styles.backButton}
                            onPress={handleGoBack}
                            disabled={isLoading}
                        >
                            <Icon name="arrow-back" size={24} color="#333333" />
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
                    placeholderTextColor="#888888"
                    value={email}
                    onChangeText={setEmail}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    autoCorrect={false}
                    editable={!isLoading}
                />

                <View style={styles.passwordContainer}>
                    <TextInput
                        style={[styles.input, styles.passwordInput, isLoading && styles.inputDisabled]}
                        placeholder="Password"
                        placeholderTextColor="#888888"
                        value={password}
                        onChangeText={setPassword}
                        secureTextEntry={!passwordVisible}
                        autoCapitalize="none"
                        autoCorrect={false}
                        editable={!isLoading}
                    />
                    <TouchableOpacity
                        style={styles.eyeIcon}
                        onPress={() => setPasswordVisible((v) => !v)}
                        disabled={isLoading}
                    >
                        <Icon
                            name={passwordVisible ? 'visibility' : 'visibility-off'}
                            size={24}
                            color="#888888"
                        />
                    </TouchableOpacity>
                </View>

                <View style={styles.passwordContainer}>
                    <TextInput
                        style={[styles.input, styles.passwordInput, isLoading && styles.inputDisabled]}
                        placeholder="Confirm Password"
                        placeholderTextColor="#888888"
                        value={confirmPassword}
                        onChangeText={setConfirmPassword}
                        secureTextEntry={!confirmPasswordVisible}
                        autoCapitalize="none"
                        autoCorrect={false}
                        editable={!isLoading}
                    />
                    <TouchableOpacity
                        style={styles.eyeIcon}
                        onPress={() => setConfirmPasswordVisible((v) => !v)}
                        disabled={isLoading}
                    >
                        <Icon
                            name={confirmPasswordVisible ? 'visibility' : 'visibility-off'}
                            size={24}
                            color="#888888"
                        />
                    </TouchableOpacity>
                </View>

                <TouchableOpacity
                    style={[styles.mainButton, styles.signUpButton, isLoading && styles.buttonDisabled]}
                    onPress={handleSignUp}
                    disabled={isLoading}
                    activeOpacity={0.8}
                >
                    {isLoading ? (
                        <ActivityIndicator size="small" color="#000000" />
                    ) : (
                        <Text style={styles.mainButtonText}>Sign up</Text>
                    )}
                </TouchableOpacity>

                <Text style={styles.orText}>- Or sign up with -</Text>

                <View style={styles.socialButtonsContainer}>
                    {/* Google */}
                    <TouchableOpacity
                        style={[styles.socialButton, isLoading && styles.buttonDisabled]}
                        onPress={handleGoogleSignUp}
                        disabled={isLoading}
                        activeOpacity={0.8}
                    >
                        <Image source={require('./assets/google.png')} style={styles.googleIcon} />
                    </TouchableOpacity>

                    {/* Facebook */}
                    <TouchableOpacity
                        style={[styles.socialButton, isLoading && styles.buttonDisabled]}
                        onPress={handleFacebookSignUp}
                        disabled={isLoading}
                        activeOpacity={0.8}
                    >
                        <Image source={require('./assets/facebook.png')} style={styles.facebookIcon} />
                    </TouchableOpacity>
                </View>

                <View style={styles.footerLinkContainer}>
                    <Text style={styles.footerText}>Already have an account?</Text>
                    <TouchableOpacity
                        onPress={() => {
                            if (!isLoading) navigation.navigate('SignIn');
                        }}
                        disabled={isLoading}
                    >
                        <Text style={styles.footerLink}>Sign in</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </ScrollView>
    );
};

const styles = StyleSheet.create({
    scrollContainer: { flexGrow: 1, backgroundColor: '#FFFFFF' },
    container: { flex: 1, paddingHorizontal: 25, paddingVertical: 20, backgroundColor: '#FFFFFF' },
    header: { height: 50, marginBottom: 10, justifyContent: 'center', alignItems: 'flex-start', zIndex: 1 },
    backButton: { padding: 10 },
    logoContainer: { alignSelf: 'center', marginBottom: 20 },
    logo: { width: 130, height: 130, resizeMode: 'contain' },
    title: { marginBottom: 30, color: '#333333', fontSize: 26, fontWeight: 'bold', textAlign: 'center' },
    input: {
        width: '100%', marginBottom: 18, paddingVertical: 14, paddingHorizontal: 15,
        borderWidth: 1, borderColor: '#CCCCCC', borderRadius: 8, backgroundColor: '#F9F9F9',
        color: '#333333', fontSize: 16,
    },
    inputDisabled: { backgroundColor: '#EEEEEE', color: '#999999' },
    passwordContainer: { position: 'relative', width: '100%', marginBottom: 18, flexDirection: 'row', alignItems: 'center' },
    passwordInput: { flex: 1, marginBottom: 0, paddingRight: 50 },
    eyeIcon: { position: 'absolute', right: 0, width: 50, height: '100%', justifyContent: 'center', alignItems: 'center', zIndex: 1 },
    mainButton: { width: '100%', minHeight: 50, marginTop: 15, paddingVertical: 15, borderRadius: 8, justifyContent: 'center', alignItems: 'center' },
    signUpButton: { backgroundColor: '#FFDD00' },
    mainButtonText: { color: '#000000', fontSize: 17, fontWeight: 'bold' },
    buttonDisabled: { opacity: 0.6 },
    orText: { marginVertical: 25, color: '#777777', fontSize: 14, fontWeight: '500', textAlign: 'center' },
    socialButtonsContainer: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginBottom: 25 },
    socialButton: {
        width: 60, height: 60, marginHorizontal: 15, borderWidth: 1, borderColor: '#DDDDDD',
        borderRadius: 30, backgroundColor: '#FFFFFF', justifyContent: 'center', alignItems: 'center',
        overflow: 'hidden', shadowColor: '#000000', shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.15, shadowRadius: 1.5, elevation: 2,
    },
    googleIcon: { width: 60, height: 60, borderRadius: 30, resizeMode: 'contain' },
    facebookIcon: { width: 87, height: 87, borderRadius: 34, resizeMode: 'contain' },
    footerLinkContainer: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginTop: 15, marginBottom: 10 },
    footerText: { color: '#666666', fontSize: 15 },
    footerLink: { marginLeft: 5, color: '#007AFF', fontSize: 15, fontWeight: 'bold' },
});

export default SignUp;