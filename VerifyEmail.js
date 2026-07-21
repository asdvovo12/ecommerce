import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Image,
  Alert,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { supabase } from './supabaseClient';

// Verifies a one-time code that SUPABASE emails to the user (server-verified).
// The old version generated the code with Math.random() and checked it inside
// the app, which was insecure and easy to bypass. Now the code is validated by
// Supabase via verifyOtp().
//
// This screen serves two flows, chosen by the `flow` route param:
//   - 'signup'   : confirm the email right after registration.
//   - 'recovery' : verify identity before resetting a forgotten password.
//
// ONE-TIME SUPABASE SETUP (project owner):
// Dashboard > Authentication > Email Templates > "Confirm signup" and
// "Reset password": include the token so the user gets a numeric code, e.g.
//     Your verification code is: {{ .Token }}

const CODE_LENGTH = 6;

const VerifyEmailScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const userEmail = route.params?.email;
  const flow = route.params?.flow === 'recovery' ? 'recovery' : 'signup';

  const [code, setCode] = useState(Array(CODE_LENGTH).fill(''));
  const [isResendDisabled, setIsResendDisabled] = useState(true);
  const [resendTimer, setResendTimer] = useState(60);
  const [loading, setLoading] = useState(false);

  const inputRefs = useRef([]);

  // Resend cooldown timer.
  useEffect(() => {
    if (!isResendDisabled) return undefined;
    if (resendTimer <= 0) {
      setIsResendDisabled(false);
      return undefined;
    }
    const t = setTimeout(() => setResendTimer((s) => s - 1), 1000);
    return () => clearTimeout(t);
  }, [isResendDisabled, resendTimer]);

  const handleCodeChange = (value, index) => {
    const digit = value.replace(/[^0-9]/g, '').slice(-1);
    const updated = [...code];
    updated[index] = digit;
    setCode(updated);
    if (digit && index < CODE_LENGTH - 1) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyPress = (e, index) => {
    if (e.nativeEvent.key === 'Backspace' && !code[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleResend = async () => {
    if (!userEmail) {
      Alert.alert('Error', 'No email address provided.');
      return;
    }
    setLoading(true);
    try {
      let error;
      if (flow === 'recovery') {
        ({ error } = await supabase.auth.resetPasswordForEmail(userEmail));
      } else {
        ({ error } = await supabase.auth.resend({ type: 'signup', email: userEmail }));
      }
      if (error) throw error;
      setResendTimer(60);
      setIsResendDisabled(true);
      Alert.alert('Sent', 'A new verification code has been sent to your email.');
    } catch (e) {
      Alert.alert('Error', e?.message || 'Failed to resend the code.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async () => {
    if (!userEmail) {
      Alert.alert('Error', 'No email address provided.');
      return;
    }
    const token = code.join('');
    if (token.length !== CODE_LENGTH) {
      Alert.alert('Error', `Please enter the ${CODE_LENGTH}-digit code.`);
      return;
    }
    setLoading(true);
    try {
      const { error } = await supabase.auth.verifyOtp({
        email: userEmail,
        token,
        type: flow, // 'signup' | 'recovery'
      });
      if (error) throw error;

      if (flow === 'recovery') {
        // verifyOtp established a temporary session, so the user can now set a
        // new password on the next screen.
        navigation.navigate('ResetPassword', { email: userEmail });
      } else {
        Alert.alert(
          'Verified',
          'Your email has been confirmed. You can now sign in.',
          [
            {
              text: 'OK',
              onPress: () =>
                navigation.reset({ index: 0, routes: [{ name: 'SignIn' }] }),
            },
          ]
        );
      }
    } catch (e) {
      Alert.alert('Error', e?.message || 'Incorrect or expired verification code.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.topSection}>
        <Text style={styles.title}>Verify Your Email</Text>

        <View style={styles.envelopeContainer}>
          <Image
            source={require('./assets/VerifyEmail.png')}
            style={styles.envelopeImage}
          />
        </View>

        <Text style={styles.instructionText}>
          Please enter the {CODE_LENGTH} digit code sent to
        </Text>
        <Text style={styles.emailText}>{userEmail}</Text>

        <View style={styles.codeInputContainer}>
          {Array.from({ length: CODE_LENGTH }).map((_, index) => (
            <TextInput
              key={index}
              ref={(el) => (inputRefs.current[index] = el)}
              style={styles.codeInput}
              value={code[index]}
              onChangeText={(value) => handleCodeChange(value, index)}
              onKeyPress={(e) => handleKeyPress(e, index)}
              maxLength={1}
              keyboardType="number-pad"
            />
          ))}
        </View>

        <TouchableOpacity onPress={handleResend} disabled={isResendDisabled || loading}>
          <Text style={[styles.resendText, (isResendDisabled || loading) && styles.resendDisabled]}>
            {loading
              ? 'Please wait...'
              : isResendDisabled
              ? `Resend Code (${resendTimer})`
              : 'Resend Code'}
          </Text>
        </TouchableOpacity>
      </View>

      <TouchableOpacity style={styles.verifyButton} onPress={handleVerify} disabled={loading}>
        <Text style={styles.verifyButtonText}>{loading ? 'Verifying...' : 'Verify'}</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    justifyContent: 'space-between',
    padding: 20,
  },
  topSection: {
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  envelopeContainer: {
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: '#FFFACD',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
    overflow: 'hidden',
  },
  envelopeImage: {
    width: 200,
    height: 200,
    resizeMode: 'cover',
  },
  instructionText: {
    fontSize: 16,
    textAlign: 'center',
  },
  emailText: {
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 20,
  },
  codeInputContainer: {
    flexDirection: 'row',
    marginBottom: 20,
  },
  codeInput: {
    width: 44,
    height: 58,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 5,
    fontSize: 22,
    textAlign: 'center',
    marginHorizontal: 4,
  },
  resendText: {
    color: '#007AFF',
    fontSize: 16,
    marginBottom: 20,
  },
  resendDisabled: {
    color: '#ccc',
  },
  verifyButton: {
    backgroundColor: '#FFD700',
    paddingVertical: 15,
    borderRadius: 5,
    alignItems: 'center',
  },
  verifyButtonText: {
    color: '#000',
    fontSize: 18,
    fontWeight: 'bold',
  },
});

export default VerifyEmailScreen;
