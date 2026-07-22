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
    ScrollView,
} from 'react-native';

import Icon from 'react-native-vector-icons/MaterialIcons';
import { useNavigation } from '@react-navigation/native';

import { supabase } from './supabaseClient';
import { signInWithProvider } from './services/socialAuth';

const SignInScreen = () => {
    const navigation = useNavigation();

    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [passwordVisible, setPasswordVisible] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    const handleSignIn = async () => {
        if (isLoading) return;

        if (!email.trim() || !password) {
            Alert.alert(
                'Missing Information',
                'Please enter both email and password.'
            );
            return;
        }

        setIsLoading(true);

        try {
            const { data, error } =
                await supabase.auth.signInWithPassword({
                    email: email.toLowerCase().trim(),
                    password,
                });

            if (error) {
                if (error.message === 'Email not confirmed') {
                    Alert.alert(
                        'Email Not Verified',
                        'Please check your email to verify your account before signing in.'
                    );
                } else if (
                    error.message === 'Invalid login credentials'
                ) {
                    Alert.alert(
                        'Sign In Failed',
                        'The email or password you entered is incorrect.'
                    );
                } else {
                    Alert.alert('Sign In Error', error.message);
                }

                return;
            }

            if (data?.session) {
                navigation.reset({
                    index: 0,
                    routes: [{ name: 'Dashboard' }],
                });
            }
        } catch (error) {
            Alert.alert(
                'Sign In Error',
                error?.message ||
                    'Something went wrong. Please try again.'
            );
        } finally {
            setIsLoading(false);
        }
    };

    const handleForgotPassword = () => {
        if (!isLoading) {
            navigation.navigate('ForgotPassword');
        }
    };

    const handleGoBack = () => {
        if (!isLoading && navigation.canGoBack()) {
            navigation.goBack();
        }
    };

    const handleSocialSignIn = async (provider) => {
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
                'Sign In Error',
                error?.message ||
                    'Something went wrong. Please try again.'
            );
        } finally {
            setIsLoading(false);
        }
    };

    const handleGoogleSignIn = () => {
        handleSocialSignIn('google');
    };

    const handleFacebookSignIn = () => {
        handleSocialSignIn('facebook');
    };

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
                            <Icon
                                name="arrow-back"
                                size={24}
                                color="#333333"
                            />
                        </TouchableOpacity>
                    </View>
                )}

                <Image
                    source={require('./assets/logo.png')}
                    style={styles.logo}
                />

                <Text style={styles.title}>
                    Login to your Account
                </Text>

                <View style={styles.inputContainer}>
                    <TextInput
                        style={[
                            styles.input,
                            isLoading && styles.inputDisabled,
                        ]}
                        placeholder="Email"
                        placeholderTextColor="#888888"
                        value={email}
                        onChangeText={setEmail}
                        keyboardType="email-address"
                        autoCapitalize="none"
                        autoCorrect={false}
                        editable={!isLoading}
                    />
                </View>

                <View style={styles.passwordContainer}>
                    <TextInput
                        style={[
                            styles.input,
                            styles.passwordInput,
                            isLoading && styles.inputDisabled,
                        ]}
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
                        onPress={() =>
                            setPasswordVisible(
                                (currentValue) => !currentValue
                            )
                        }
                        disabled={isLoading}
                    >
                        <Icon
                            name={
                                passwordVisible
                                    ? 'visibility'
                                    : 'visibility-off'
                            }
                            size={24}
                            color="#888888"
                        />
                    </TouchableOpacity>
                </View>

                <TouchableOpacity
                    style={styles.forgotPasswordContainer}
                    onPress={handleForgotPassword}
                    disabled={isLoading}
                >
                    <Text style={styles.forgotPasswordText}>
                        Forgot password?
                    </Text>
                </TouchableOpacity>

                <TouchableOpacity
                    style={[
                        styles.mainButton,
                        styles.signInButton,
                        isLoading && styles.buttonDisabled,
                    ]}
                    onPress={handleSignIn}
                    disabled={isLoading}
                    activeOpacity={0.8}
                >
                    {isLoading ? (
                        <ActivityIndicator
                            size="small"
                            color="#000000"
                        />
                    ) : (
                        <Text style={styles.mainButtonText}>
                            Sign in
                        </Text>
                    )}
                </TouchableOpacity>

                <Text style={styles.orText}>
                    - Or sign in with -
                </Text>

                <View style={styles.socialButtonsContainer}>
                    {/* Google */}
                    <TouchableOpacity
                        style={[
                            styles.socialButton,
                            isLoading && styles.buttonDisabled,
                        ]}
                        onPress={handleGoogleSignIn}
                        disabled={isLoading}
                        activeOpacity={0.8}
                    >
                        <Image
                            source={require('./assets/google.png')}
                            style={styles.googleIcon}
                        />
                    </TouchableOpacity>

                    {/* Facebook */}
                    <TouchableOpacity
                        style={[
                            styles.socialButton,
                            isLoading && styles.buttonDisabled,
                        ]}
                        onPress={handleFacebookSignIn}
                        disabled={isLoading}
                        activeOpacity={0.8}
                    >
                        <Image
                            source={require('./assets/facebook.png')}
                            style={styles.facebookIcon}
                        />
                    </TouchableOpacity>
                </View>

                <View style={styles.footerLinkContainer}>
                    <Text style={styles.footerText}>
                        Don't have an account?
                    </Text>

                    <TouchableOpacity
                        onPress={() => {
                            if (!isLoading) {
                                navigation.navigate('SignUp');
                            }
                        }}
                        disabled={isLoading}
                    >
                        <Text style={styles.footerLink}>
                            Sign up
                        </Text>
                    </TouchableOpacity>
                </View>
            </View>
        </ScrollView>
    );
};

const styles = StyleSheet.create({
    scrollContainer: {
        flexGrow: 1,
        justifyContent: 'center',
        backgroundColor: '#FFFFFF',
    },

    container: {
        flex: 1,
        paddingHorizontal: 25,
        paddingVertical: 20,
        paddingTop: 60,
        justifyContent: 'center',
        backgroundColor: '#FFFFFF',
    },

    header: {
        position: 'absolute',
        top: 40,
        left: 15,
        height: 50,
        justifyContent: 'center',
        alignItems: 'flex-start',
        zIndex: 1,
    },

    backButton: {
        padding: 10,
    },

    logo: {
        width: 130,
        height: 130,
        marginBottom: 30,
        alignSelf: 'center',
        resizeMode: 'contain',
    },

    title: {
        marginBottom: 30,
        color: '#333333',
        fontSize: 26,
        fontWeight: 'bold',
        textAlign: 'center',
    },

    inputContainer: {
        width: '100%',
        marginBottom: 18,
    },

    input: {
        width: '100%',
        paddingVertical: 14,
        paddingHorizontal: 15,
        borderWidth: 1,
        borderColor: '#CCCCCC',
        borderRadius: 8,
        backgroundColor: '#F9F9F9',
        color: '#333333',
        fontSize: 16,
    },

    inputDisabled: {
        backgroundColor: '#EEEEEE',
        color: '#999999',
    },

    passwordContainer: {
        position: 'relative',
        width: '100%',
        marginBottom: 18,
        flexDirection: 'row',
        alignItems: 'center',
    },

    passwordInput: {
        flex: 1,
        paddingRight: 50,
    },

    eyeIcon: {
        position: 'absolute',
        right: 0,
        width: 50,
        height: '100%',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 1,
    },

    forgotPasswordContainer: {
        alignSelf: 'flex-end',
        marginRight: 5,
        marginBottom: 25,
    },

    forgotPasswordText: {
        color: '#007AFF',
        fontSize: 14,
        fontWeight: '600',
    },

    mainButton: {
        width: '100%',
        minHeight: 50,
        marginTop: 5,
        paddingVertical: 15,
        borderRadius: 8,
        justifyContent: 'center',
        alignItems: 'center',
    },

    signInButton: {
        backgroundColor: '#FFDD00',
    },

    mainButtonText: {
        color: '#000000',
        fontSize: 17,
        fontWeight: 'bold',
    },

    buttonDisabled: {
        opacity: 0.6,
    },

    orText: {
        marginVertical: 30,
        color: '#777777',
        fontSize: 14,
        fontWeight: '500',
        textAlign: 'center',
    },

    socialButtonsContainer: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 30,
    },

    socialButton: {
        width: 60,
        height: 60,
        marginHorizontal: 15,
        borderWidth: 1,
        borderColor: '#DDDDDD',
        borderRadius: 30,
        backgroundColor: '#FFFFFF',
        justifyContent: 'center',
        alignItems: 'center',
        overflow: 'hidden',

        shadowColor: '#000000',
        shadowOffset: {
            width: 0,
            height: 1,
        },
        shadowOpacity: 0.15,
        shadowRadius: 1.5,
        elevation: 2,
    },

    googleIcon: {
        width: 60,
        height: 60,
        borderRadius: 30,
        resizeMode: 'contain',
    },

    facebookIcon: {
        width: 87,
        height: 87,
        borderRadius: 34,
        resizeMode: 'contain',
    },

    footerLinkContainer: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 25,
        marginBottom: 10,
    },

    footerText: {
        color: '#666666',
        fontSize: 15,
    },

    footerLink: {
        marginLeft: 5,
        color: '#007AFF',
        fontSize: 15,
        fontWeight: 'bold',
    },
});

export default SignInScreen;