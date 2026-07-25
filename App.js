// App.js
import React, { useState, useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { View, Image, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StripeProvider } from '@stripe/stripe-react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { STRIPE_PUBLISHABLE_KEY } from './config';

// ✅ الـ Context الموحّد
import { DarkModeProvider } from './DarkModeContext';

// Screens
import SignUp from './signup';
import SignInScreen from './SignIn';
import SplashScreen from './SplashScreen';
import ForgotPasswordScreen from './ForgotPassword';
import VerifyEmailScreen from './VerifyEmail';
import ResetPasswordScreen from './ResetPassword';
import CartScreen from './Cart';
import OrderScreen from './Order';
import EditProfileScreen from './editprofile';
import PaymentScreen from './Payment';
import CheckoutScreen from './Checkout';
import ShippingAddressScreen from './ShippingAddress';
import ChangeLanguageScreen from './language';
import MyFavoritesScreen from './Favourite';
import SpecialOffersScreen from './SpecialOffer';
import PopularProductsScreen from './PopularProducts';
import NewArrivalsScreen from './NewArrivals';
import NotificationsScreen from './Notifications';
import Dashboard from './Dashboard';

// ✅ الشاشة الناقصة اللي بتسبب الإيرور
import ProductDetail from './ProductDetail';
// (لو عندك ملف Products.js منفصل ومش جوه الـ Dashboard، فكّ الكومنت ده)
// import ProductsScreen from './Products';

import sales from './assets/sales.png';
import salesImage from './assets/sign.png';
import './i18n';

const Stack = createNativeStackNavigator();

const Report = () => (
  <View>
    <Text>Report Screen Placeholder</Text>
  </View>
);

// --- First Page (Intro Screens) ---
const FirstPage = ({ navigation }) => {
  const [showFirstPage, setShowFirstPage] = useState(true);
  const handleNextPage = () => setShowFirstPage(false);

  return (
    <View style={styles.wrapper}>
      {showFirstPage ? (
        <ScrollView style={styles.scrollView}>
          <View style={styles.app}>
            <View style={styles.content}>
              <Image source={sales} style={styles.illustration1} />
              <View style={styles.bottomContent}>
                <View style={styles.textContainer1}>
                  <Text style={styles.title}>Effortless Sales Management</Text>
                  <Text style={styles.description}>
                    Track your sales in real-time and get actionable insights to boost your business.
                  </Text>
                </View>
                <View style={styles.pagination}>
                  <View style={[styles.paginationSpan, styles.activePaginationSpan]} />
                  <View style={styles.paginationSpan} />
                </View>
              </View>
              <View style={styles.footer}>
                <TouchableOpacity onPress={handleNextPage} style={styles.nextButton}>
                  <Text style={styles.buttonText1}>Next</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </ScrollView>
      ) : (
        <View style={styles.appWrapper2}>
          <View style={styles.imageContainer}>
            <Image source={salesImage} style={styles.illustration2} />
          </View>
          <View style={styles.textWrapper}>
            <View style={styles.textContainer2}>
              <Text style={styles.h2}>
                Join us and unlock the power of effortless sales management.
              </Text>
              <Text style={styles.p}>Gain real-time sales insights.</Text>
            </View>
            <View style={styles.dotsWrapper}>
              <View style={styles.dotsContainer}>
                <View style={styles.dots}>
                  <View style={styles.dot} />
                  <View style={[styles.dot, styles.activeDot]} />
                </View>
              </View>
            </View>
          </View>
          <View style={styles.buttonContainer}>
            <TouchableOpacity onPress={() => navigation.navigate('SignIn')} style={styles.authButton}>
              <Text style={styles.buttonText2}>Sign In</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => navigation.navigate('SignUp')} style={styles.authButton}>
              <Text style={styles.buttonText2}>Sign Up</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </View>
  );
};

// --- Main App ---
const App = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [initialRoute, setInitialRoute] = useState('FirstPage');

  useEffect(() => {
    const bootstrap = async () => {
      let route = 'FirstPage';
      try {
        const loggedIn = await AsyncStorage.getItem('isLoggedIn');
        if (loggedIn === 'true') route = 'Dashboard';
      } catch (e) {
        console.error('Auth check error:', e);
      }
      setTimeout(() => {
        setInitialRoute(route);
        setIsLoading(false);
      }, 2500);
    };
    bootstrap();
  }, []);

  if (isLoading) {
    return (
      <SafeAreaProvider>
        <SplashScreen />
      </SafeAreaProvider>
    );
  }

  return (
    <SafeAreaProvider>
      <DarkModeProvider>
        <StripeProvider publishableKey={STRIPE_PUBLISHABLE_KEY}>
          <NavigationContainer>
            <Stack.Navigator initialRouteName={initialRoute}>
              <Stack.Screen name="FirstPage" component={FirstPage} options={{ headerShown: false }} />
              <Stack.Screen name="SignUp" component={SignUp} options={{ headerShown: false }} />
              <Stack.Screen name="SignIn" component={SignInScreen} options={{ headerShown: false }} />
              <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} options={{ headerShown: false }} />
              <Stack.Screen name="VerifyEmail" component={VerifyEmailScreen} options={{ headerShown: false }} />
              <Stack.Screen name="ResetPassword" component={ResetPasswordScreen} options={{ headerShown: false }} />
              <Stack.Screen name="Dashboard" component={Dashboard} options={{ headerShown: false }} />

              {/* ✅ الإضافات المهمة */}
              <Stack.Screen name="ProductDetail" component={ProductDetail} options={{ headerShown: false }} />
              <Stack.Screen name="Cart" component={CartScreen} options={{ headerShown: false }} />
              {/* <Stack.Screen name="Products" component={ProductsScreen} options={{ headerShown: false }} /> */}

              <Stack.Screen name="ReportScreen" component={Report} options={{ title: 'Report' }} />
              <Stack.Screen name="EditProfile" component={EditProfileScreen} options={{ headerShown: false }} />
              <Stack.Screen name="MyFavorites" component={MyFavoritesScreen} options={{ headerShown: false }} />
              <Stack.Screen name="SpecialOffersScreen" component={SpecialOffersScreen} options={{ headerShown: false }} />
              <Stack.Screen name="PopularProductsScreen" component={PopularProductsScreen} options={{ headerShown: false }} />
              <Stack.Screen name="NewArrivalsScreen" component={NewArrivalsScreen} options={{ headerShown: false }} />
              <Stack.Screen name="Payment" component={PaymentScreen} options={{ headerShown: false }} />
              <Stack.Screen name="Checkout" component={CheckoutScreen} options={{ headerShown: false }} />
              <Stack.Screen name="ShippingAddress" component={ShippingAddressScreen} options={{ headerShown: false }} />
              <Stack.Screen name="Order" component={OrderScreen} options={{ headerShown: false }} />
              <Stack.Screen name="ChangeLanguage" component={ChangeLanguageScreen} options={{ headerShown: false }} />
              <Stack.Screen name="Notifications" component={NotificationsScreen} options={{ headerShown: false }} />
            </Stack.Navigator>
          </NavigationContainer>
        </StripeProvider>
      </DarkModeProvider>
    </SafeAreaProvider>
  );
};

const styles = StyleSheet.create({
  wrapper: { flex: 1, backgroundColor: '#fff' },
  scrollView: { flex: 1, backgroundColor: '#fff' },
  app: { flex: 1, justifyContent: 'space-between' },
  content: { flexGrow: 1, flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 20 },
  illustration1: { width: 300, height: 300, maxWidth: '90%', resizeMode: 'contain', marginBottom: 20 },
  textContainer1: { width: '90%', marginBottom: 10 },
  title: { fontSize: 24, fontWeight: 'bold', marginBottom: 5, textAlign: 'center' },
  description: { textAlign: 'center', marginBottom: 10, color: '#555', paddingHorizontal: 10 },
  pagination: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginBottom: 20, marginTop: 20 },
  paginationSpan: { width: 10, height: 10, borderRadius: 5, backgroundColor: '#ddd', marginHorizontal: 5 },
  activePaginationSpan: { backgroundColor: '#ffd700' },
  footer: { padding: 20, width: '100%', marginTop: 30 },
  nextButton: { width: '100%', paddingVertical: 15, paddingHorizontal: 15, backgroundColor: '#ffdd00', borderRadius: 25, alignItems: 'center' },
  buttonText1: { color: '#000', fontSize: 18, fontWeight: 'bold', textAlign: 'center' },
  bottomContent: { alignItems: 'center', paddingHorizontal: 20, width: '100%' },
  appWrapper2: { flex: 1, backgroundColor: '#fff' },
  imageContainer: { position: 'absolute', top: 60, left: 0, right: 0, alignItems: 'center' },
  illustration2: { width: 250, height: 250, resizeMode: 'contain' },
  textWrapper: { position: 'absolute', top: 340, left: 0, right: 0, alignItems: 'center' },
  textContainer2: { width: '90%', marginBottom: 20 },
  h2: { fontSize: 22, fontWeight: 'bold', color: '#222', textAlign: 'center', marginBottom: 10 },
  p: { fontSize: 16, color: '#555', textAlign: 'center' },
  dotsWrapper: { marginTop: 30 },
  dotsContainer: {},
  dots: { flexDirection: 'row', justifyContent: 'center' },
  dot: { width: 10, height: 10, borderRadius: 5, backgroundColor: '#ddd', marginHorizontal: 5 },
  activeDot: { backgroundColor: '#ffd700' },
  buttonContainer: { position: 'absolute', bottom: 40, left: 0, right: 0, alignItems: 'center', paddingHorizontal: 20 },
  authButton: { backgroundColor: '#ffd700', paddingVertical: 15, paddingHorizontal: 15, width: '100%', marginBottom: 15, alignItems: 'center', borderRadius: 25 },
  buttonText2: { color: '#000', fontSize: 18, fontWeight: 'bold', textAlign: 'center' },
});

export default App;