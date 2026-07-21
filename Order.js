// OrderTrackingScreen.js
// Shows the signed-in user's REAL orders (from Supabase) with a simple status
// stepper. Replaces the previous hardcoded placeholder order data.

import React, { useState, useEffect, useCallback } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    SafeAreaView,
    ActivityIndicator,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { useNavigation } from '@react-navigation/native';
import { useDarkMode } from './DarkModeContext';
import Icon from 'react-native-vector-icons/FontAwesome5';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getMyOrders } from './services/orders';

// --- Theme Colors ---
const lightTheme = {
    appBg: '#f8f8f8',
    appTextDefault: '#444',
    borderSubtle: '#EFEFEF',
    headerBg: '#ffffff',
    headerText: '#333',
    cardBg: '#ffffff',
    activeIconBg: '#FFDD00',
    inactiveIconBg: '#e0e0e0',
    activeTitle: '#B8860B',
    inactiveTitle: '#999',
    badgeBg: 'red',
    badgeText: 'white',
};

const darkTheme = {
    appBg: '#121212',
    appTextDefault: '#E0E0E0',
    borderSubtle: '#333',
    headerBg: '#1e1e1e',
    headerText: '#E0E0E0',
    cardBg: '#1e1e1e',
    activeIconBg: '#FFDD00',
    inactiveIconBg: '#404040',
    activeTitle: '#FFDD00',
    inactiveTitle: '#888',
    badgeBg: 'red',
    badgeText: 'white',
};

// Which steps are "active" for a given order status.
const STATUS_STEPS = [
    { key: 'orderPlaced', icon: 'shopping-cart', statuses: ['paid', 'pending', 'processing', 'shipped', 'delivered'] },
    { key: 'orderDispatched', icon: 'store-alt', statuses: ['processing', 'shipped', 'delivered'] },
    { key: 'orderInTransit', icon: 'truck', statuses: ['shipped', 'delivered'] },
    { key: 'deliveredSuccessfully', icon: 'check-circle', statuses: ['delivered'], solid: true },
];

const OrderTrackingScreen = () => {
    const { t } = useTranslation();
    const { isDarkMode } = useDarkMode();
    const navigation = useNavigation();
    const theme = isDarkMode ? darkTheme : lightTheme;

    const [cartItemCount, setCartItemCount] = useState(0);
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const loadCartCount = useCallback(async () => {
        try {
            const savedCart = await AsyncStorage.getItem('cart');
            setCartItemCount(savedCart ? JSON.parse(savedCart).length : 0);
        } catch (e) {
            setCartItemCount(0);
        }
    }, []);

    const loadOrders = useCallback(async () => {
        try {
            setLoading(true);
            setError(null);
            const data = await getMyOrders();
            setOrders(data || []);
        } catch (e) {
            console.error('Failed to load orders:', e);
            setError(e && e.message ? e.message : 'Failed to load orders');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        loadCartCount();
        loadOrders();
        const unsubscribe = navigation.addListener('focus', () => {
            loadCartCount();
            loadOrders();
        });
        return unsubscribe;
    }, [navigation, loadCartCount, loadOrders]);

    const styles = createStyles(theme);

    const statusLabel = (status) => {
        const translated = t(status);
        return translated !== status ? translated : status;
    };

    const renderOrder = (order) => {
        const items = order.order_items || [];
        const created = order.created_at ? new Date(order.created_at) : null;
        let activeIndex = 0;
        STATUS_STEPS.forEach((step, i) => {
            if (step.statuses.includes(order.status)) activeIndex = i;
        });
        if (order.status === 'cancelled' || order.status === 'failed') activeIndex = -1;

        return (
            <View key={order.id} style={styles.orderCard}>
                <View style={styles.orderHeader}>
                    <Text style={styles.orderId}>
                        {t('Order')} #{String(order.id).slice(0, 8)}
                    </Text>
                    <Text style={styles.orderStatus}>{statusLabel(order.status)}</Text>
                </View>

                {created && (
                    <Text style={styles.orderDate}>
                        {created.toLocaleDateString()} @{' '}
                        {created.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </Text>
                )}

                {items.map((it) => (
                    <View key={it.id} style={styles.itemRow}>
                        <Text style={styles.itemName} numberOfLines={1}>
                            {it.name}
                            {it.storage ? ` (${it.storage})` : ''} x{it.quantity}
                        </Text>
                        <Text style={styles.itemPrice}>
                            ${(Number(it.unit_price) * it.quantity).toFixed(2)}
                        </Text>
                    </View>
                ))}

                <View style={styles.divider} />

                <View style={styles.totalRow}>
                    <Text style={styles.totalLabel}>{t('Order total')}</Text>
                    <Text style={styles.totalValue}>${Number(order.total).toFixed(2)}</Text>
                </View>

                <View style={styles.stepper}>
                    {STATUS_STEPS.map((step, i) => {
                        const active = i <= activeIndex;
                        return (
                            <View key={step.key} style={styles.step}>
                                <View
                                    style={[
                                        styles.stepIcon,
                                        { backgroundColor: active ? theme.activeIconBg : theme.inactiveIconBg },
                                    ]}
                                >
                                    <Icon name={step.icon} size={14} color="#fff" solid={!!step.solid} />
                                </View>
                                <Text
                                    style={[
                                        styles.stepLabel,
                                        { color: active ? theme.activeTitle : theme.inactiveTitle },
                                    ]}
                                    numberOfLines={1}
                                >
                                    {t(step.key)}
                                </Text>
                            </View>
                        );
                    })}
                </View>
            </View>
        );
    };

    return (
        <SafeAreaView style={styles.safeArea}>
            <View style={styles.container}>
                {/* Header */}
                <View style={styles.appHeader}>
                    <View style={styles.headerPlaceholder} />
                    <Text style={styles.headerTitle}>{t('myOrders')}</Text>
                    <TouchableOpacity
                        onPress={() => navigation.navigate('Cart')}
                        style={styles.headerCartIconContainer}
                    >
                        <Icon name="shopping-cart" size={22} color={theme.headerText} />
                        {cartItemCount > 0 && (
                            <View style={styles.cartBadge}>
                                <Text style={styles.cartBadgeText}>{cartItemCount}</Text>
                            </View>
                        )}
                    </TouchableOpacity>
                </View>

                {/* Orders list */}
                <ScrollView contentContainerStyle={styles.listContent} showsVerticalScrollIndicator={false}>
                    {loading ? (
                        <ActivityIndicator size="large" color={theme.activeIconBg} style={{ marginTop: 50 }} />
                    ) : error ? (
                        <View style={styles.emptyWrap}>
                            <Icon name="exclamation-circle" size={40} color={theme.inactiveIconBg} />
                            <Text style={styles.emptyText}>{error}</Text>
                            <TouchableOpacity onPress={loadOrders} style={styles.retryBtn}>
                                <Text style={styles.retryText}>{t('Retry', 'Retry')}</Text>
                            </TouchableOpacity>
                        </View>
                    ) : orders.length === 0 ? (
                        <View style={styles.emptyWrap}>
                            <Icon name="box-open" size={48} color={theme.inactiveIconBg} />
                            <Text style={styles.emptyText}>
                                {t('noOrdersYet', 'You have no orders yet.')}
                            </Text>
                        </View>
                    ) : (
                        orders.map(renderOrder)
                    )}
                </ScrollView>
            </View>
        </SafeAreaView>
    );
};

const createStyles = (theme) =>
    StyleSheet.create({
        safeArea: { flex: 1, backgroundColor: theme.headerBg },
        container: { flex: 1, backgroundColor: theme.appBg },
        appHeader: {
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
            paddingHorizontal: 20,
            paddingVertical: 10,
            borderBottomWidth: 1,
            borderBottomColor: theme.borderSubtle,
            backgroundColor: theme.headerBg,
            height: 60,
        },
        headerPlaceholder: { width: 40 },
        headerTitle: {
            fontSize: 20,
            fontWeight: 'bold',
            textAlign: 'center',
            color: theme.headerText,
            flex: 1,
        },
        headerCartIconContainer: {
            width: 40,
            height: 40,
            alignItems: 'center',
            justifyContent: 'center',
            position: 'relative',
        },
        cartBadge: {
            position: 'absolute',
            right: -5,
            top: -5,
            backgroundColor: theme.badgeBg,
            borderRadius: 9,
            width: 18,
            height: 18,
            justifyContent: 'center',
            alignItems: 'center',
            zIndex: 10,
        },
        cartBadgeText: { color: theme.badgeText, fontSize: 10, fontWeight: 'bold' },
        listContent: { padding: 16, paddingBottom: 40 },
        orderCard: {
            backgroundColor: theme.cardBg,
            borderRadius: 12,
            padding: 16,
            marginBottom: 16,
            borderWidth: 1,
            borderColor: theme.borderSubtle,
        },
        orderHeader: {
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: 6,
        },
        orderId: { fontWeight: 'bold', color: theme.headerText, fontSize: 15 },
        orderStatus: {
            color: theme.activeTitle,
            fontWeight: 'bold',
            textTransform: 'capitalize',
            fontSize: 13,
        },
        orderDate: { color: theme.appTextDefault, fontSize: 12, marginBottom: 12 },
        itemRow: {
            flexDirection: 'row',
            justifyContent: 'space-between',
            marginBottom: 6,
        },
        itemName: { color: theme.appTextDefault, flex: 1, marginRight: 8 },
        itemPrice: { color: theme.appTextDefault, fontWeight: '600' },
        divider: { height: 1, backgroundColor: theme.borderSubtle, marginVertical: 10 },
        totalRow: {
            flexDirection: 'row',
            justifyContent: 'space-between',
            marginBottom: 16,
        },
        totalLabel: { fontWeight: 'bold', color: theme.headerText },
        totalValue: { fontWeight: 'bold', color: theme.headerText },
        stepper: { flexDirection: 'row', justifyContent: 'space-between' },
        step: { alignItems: 'center', flex: 1 },
        stepIcon: {
            width: 34,
            height: 34,
            borderRadius: 17,
            alignItems: 'center',
            justifyContent: 'center',
        },
        stepLabel: { fontSize: 9, marginTop: 4, textAlign: 'center' },
        emptyWrap: { alignItems: 'center', marginTop: 60, paddingHorizontal: 20 },
        emptyText: {
            textAlign: 'center',
            color: theme.appTextDefault,
            marginTop: 16,
            fontSize: 15,
        },
        retryBtn: {
            marginTop: 16,
            backgroundColor: theme.activeIconBg,
            paddingHorizontal: 24,
            paddingVertical: 10,
            borderRadius: 8,
        },
        retryText: { color: '#333', fontWeight: 'bold' },
    });

export default OrderTrackingScreen;
