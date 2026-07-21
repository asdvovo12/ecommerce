import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Image, Alert } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useNavigation } from '@react-navigation/native';
import { supabase } from './supabaseClient';

const ForgotPasswordScreen = () => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const navigation = useNavigation();

  const handleSend = async () => {
    if (loading) return;
    if (!email) {
      Alert.alert('Error', 'Please enter your email address.');
      return;
    }

    const cleanEmail = email.toLowerCase().trim();
    setLoading(true);
    // Ask Supabase to email a recovery code (server-side). The next screen
    // verifies that code with verifyOtp(type: 'recovery').
    const { error } = await supabase.auth.resetPasswordForEmail(cleanEmail);
    setLoading(false);

    if (error) {
      Alert.alert('Error', error.message);
      return;
    }

    navigation.navigate('VerifyEmail', { email: cleanEmail, flow: 'recovery' });
  };

  const handleGoBack = () => {
    navigation.goBack();
  };

  return (
    <View style={styles.container}>
      <View style={styles.topSection}>
        <View style={styles.headerContainer}>
          <TouchableOpacity style={styles.backButton} onPress={handleGoBack}>
            <Icon name="arrow-back" size={24} color="#000" />
          </TouchableOpacity>
          <Text style={styles.title}>Forgot Password</Text>
        </View>

        <View style={styles.imageContainer}>
          <Image
            source={require('./assets/forgotpassword.png')}
            style={styles.image}
          />
        </View>

        <Text style={styles.description}>
          Please enter your email address to receive a verification code.
        </Text>

        <View style={styles.emailContainer}>
          <Text style={styles.label}>Email Address</Text>
          <TextInput
            style={styles.input}
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            placeholder="Email"
          />
        </View>
      </View>

      <View style={styles.sendButtonContainer}>
        <TouchableOpacity style={styles.sendButton} onPress={handleSend}>
          <Text style={styles.sendButtonText}>Send</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    justifyContent: 'space-between',
  },
  headerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    justifyContent: 'center',
    padding: 20,
  },
  topSection: {
    alignItems: 'center',
    padding: 20,
  },
  backButton: {
    position: 'absolute',
    left: -5,
    top: 17,
    padding: 10,
    zIndex: 1,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 20,
  },
  imageContainer: {
    marginTop: 20,
    marginBottom: 20,
    width: 200, // تم تعديل العرض
    height: 200, // تم تعديل الارتفاع
    borderRadius: 100,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  image: {
    width: 200, // تم تعديل العرض
    height: 200, // تم تعديل الارتفاع
    resizeMode: 'cover', // تم تغيير وضع التحجيم
  },
  description: {
    fontSize: 16,
    color: '#7f8c8d',
    textAlign: 'center',
    marginBottom: 30,
    marginHorizontal: 40,
  },
  emailContainer: {
    width: '100%',
    marginBottom: 10,
  },
  label: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 5,
    textAlign: 'left',
    paddingLeft: 5,
    color: '#2c3e50',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 5,
    padding: 15,
    width: '100%',
  },
  sendButtonContainer: {
    paddingHorizontal: 20,
    paddingBottom: 30,
  },
  sendButton: {
    backgroundColor: '#ffdd00',
    borderRadius: 5,
    paddingVertical: 15,
    width: '100%',
    alignItems: 'center',
  },
  sendButtonText: {
    color: '#000',
    fontSize: 18,
    fontWeight: 'bold',
  },
});

export default ForgotPasswordScreen;