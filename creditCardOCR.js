// creditCardOCR.js
// A reusable credit-card scanner. Opens the camera, takes a photo, runs OCR
// (Tesseract) on it, and extracts a 13-19 digit card number + optional expiry.
//
// Usage:
//   navigation.navigate('CreditCardOCR', {
//     onScanned: ({ cardNumber, expiryDate }) => { ... }
//   });
// or render <CreditCardScanner onScanned={...} onCancel={...} /> directly.

import React, { useRef, useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import Tesseract from 'tesseract.js';

// --- Pure helpers (exported so they can be unit-tested / reused) ---

// Extract the most likely card number from raw OCR text.
export function extractCardNumber(rawText) {
  if (!rawText) return null;
  // Collapse everything to digits grouped by whitespace, then look for
  // sequences of 13-19 digits (covers Visa/MC/Amex/Discover).
  const normalized = rawText.replace(/[^0-9\s]/g, ' ').replace(/\s+/g, ' ');
  const candidates = normalized.match(/(?:\d[ ]?){13,19}/g) || [];
  for (const candidate of candidates) {
    const digits = candidate.replace(/\s/g, '');
    if (digits.length >= 13 && digits.length <= 19 && luhnCheck(digits)) {
      return digits;
    }
  }
  // Fallback: return the longest digit run even if Luhn fails.
  const longest = candidates
    .map((c) => c.replace(/\s/g, ''))
    .sort((a, b) => b.length - a.length)[0];
  return longest && longest.length >= 13 ? longest : null;
}

// Extract an MM/YY expiry date if present.
export function extractExpiry(rawText) {
  if (!rawText) return null;
  const match = rawText.match(/(0[1-9]|1[0-2])\s*[\/\-]\s*(\d{2})/);
  return match ? `${match[1]}/${match[2]}` : null;
}

// Luhn checksum validation.
export function luhnCheck(number) {
  let sum = 0;
  let shouldDouble = false;
  for (let i = number.length - 1; i >= 0; i--) {
    let digit = parseInt(number.charAt(i), 10);
    if (shouldDouble) {
      digit *= 2;
      if (digit > 9) digit -= 9;
    }
    sum += digit;
    shouldDouble = !shouldDouble;
  }
  return sum % 10 === 0;
}

// Format 16 digits into groups of 4 for display.
export function formatCardNumber(digits) {
  return (digits || '').replace(/(\d{4})(?=\d)/g, '$1 ').trim();
}

// --- The scanner component ---

export default function CreditCardScanner({ onScanned, onCancel, navigation, route }) {
  const cameraRef = useRef(null);
  const [permission, requestPermission] = useCameraPermissions();
  const [isProcessing, setIsProcessing] = useState(false);

  // Support both direct props and react-navigation params.
  const handleScanned =
    onScanned || route?.params?.onScanned || (() => {});
  const handleCancel =
    onCancel ||
    (() => (navigation ? navigation.goBack() : undefined));

  useEffect(() => {
    if (permission && !permission.granted && permission.canAskAgain) {
      requestPermission();
    }
  }, [permission]);

  const captureAndScan = async () => {
    if (!cameraRef.current || isProcessing) return;
    try {
      setIsProcessing(true);
      const photo = await cameraRef.current.takePictureAsync({
        quality: 1,
        skipProcessing: true,
      });

      const {
        data: { text },
      } = await Tesseract.recognize(photo.uri, 'eng', {
        tessedit_char_whitelist: '0123456789/ ',
      });

      const cardNumber = extractCardNumber(text);
      const expiryDate = extractExpiry(text);

      if (!cardNumber) {
        Alert.alert(
          'Card not recognized',
          'Could not read the card number. Please try again with better lighting.'
        );
        return;
      }

      handleScanned({ cardNumber, expiryDate });
      if (navigation) navigation.goBack();
    } catch (error) {
      console.error('Credit card OCR failed:', error);
      Alert.alert('Scan failed', 'Something went wrong while scanning the card.');
    } finally {
      setIsProcessing(false);
    }
  };

  if (!permission) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  if (!permission.granted) {
    return (
      <View style={styles.center}>
        <Text style={styles.infoText}>
          Camera access is required to scan your card.
        </Text>
        <TouchableOpacity style={styles.button} onPress={requestPermission}>
          <Text style={styles.buttonText}>Grant permission</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.linkButton} onPress={handleCancel}>
          <Text style={styles.linkText}>Cancel</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <CameraView ref={cameraRef} style={styles.camera} facing="back" />

      {/* Guide frame overlay */}
      <View style={styles.overlay} pointerEvents="none">
        <View style={styles.cardFrame} />
        <Text style={styles.hint}>Align your card inside the frame</Text>
      </View>

      <View style={styles.controls}>
        <TouchableOpacity style={styles.linkButton} onPress={handleCancel}>
          <Text style={styles.linkText}>Cancel</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, isProcessing && styles.buttonDisabled]}
          onPress={captureAndScan}
          disabled={isProcessing}
        >
          {isProcessing ? (
            <ActivityIndicator color="#000" />
          ) : (
            <Text style={styles.buttonText}>Scan card</Text>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
    backgroundColor: '#fff',
  },
  camera: { flex: 1 },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardFrame: {
    width: '85%',
    aspectRatio: 1.586, // standard credit-card ratio
    borderWidth: 2,
    borderColor: '#ffdd00',
    borderRadius: 12,
  },
  hint: { color: '#fff', marginTop: 16, fontSize: 16 },
  controls: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    padding: 24,
    backgroundColor: '#000',
  },
  button: {
    backgroundColor: '#ffdd00',
    paddingVertical: 14,
    paddingHorizontal: 32,
    borderRadius: 8,
  },
  buttonDisabled: { opacity: 0.6 },
  buttonText: { color: '#000', fontSize: 16, fontWeight: 'bold' },
  infoText: { fontSize: 16, textAlign: 'center', marginBottom: 20 },
  linkButton: { padding: 12 },
  linkText: { color: '#ffdd00', fontSize: 16 },
});
