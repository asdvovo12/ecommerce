// OrderTrackingScreen.js
// Shows the signed-in user's REAL orders (from Supabase) with a simple status
// stepper. All icons are drawn with Views (no icon fonts), so nothing breaks
// when the font asset fails to download.

import React, { useState, useEffect, useCallback } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    SafeAreaView,
    ActivityIndicator,
    RefreshControl,
    I18nManager,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { useNavigation } from '@react-navigation/native';
import { useDarkMode } from './DarkModeContext';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getMyOrders } from './services/orders';

/* =======================================================================
   أيقونات مرسومة بـ Views — مش بتعتمد على أي فونت
   ======================================================================= */

/* ✅ علامة صح (شرطتين متعاكستين) */
const CheckIcon = ({ size = 20, color = '#fff', thickness = 3 }) => {
    const s = size / 20;
    return (
        <View style={{ width: size, height: size }}>
            <View
                style={{
                    position: 'absolute',
                    left: 2.3 * s,
                    top: 6.3 * s,
                    width: thickness * s,
                    height: 9 * s,
                    borderRadius: (thickness * s) / 2,
                    backgroundColor: color,
                    transform: [{ rotate: '-45deg' }],
                }}
            />
            <View
                style={{
                    position: 'absolute',
                    left: 10.4 * s,
                    top: 2 * s,
                    width: thickness * s,
                    height: 14 * s,
                    borderRadius: (thickness * s) / 2,
                    backgroundColor: color,
                    transform: [{ rotate: '45deg' }],
                }}
            />
        </View>
    );
};

/* 🛒 عربة تسوق */
const CartIcon = ({ size = 22, color = '#333' }) => (
    <View style={{ width: size, height: size }}>
        {/* المقبض */}
        <View
            style={{
                position: 'absolute',
                left: 0,
                top: size * 0.16,
                width: size * 0.2,
                height: size * 0.09,
                borderRadius: size * 0.05,
                backgroundColor: color,
            }}
        />
        {/* الوصلة المائلة */}
        <View
            style={{
                position: 'absolute',
                left: size * 0.19,
                top: size * 0.16,
                width: size * 0.08,
                height: size * 0.2,
                borderRadius: size * 0.04,
                backgroundColor: color,
                transform: [{ rotate: '-20deg' }],
            }}
        />
        {/* السلة */}
        <View
            style={{
                position: 'absolute',
                left: size * 0.24,
                top: size * 0.3,
                width: size * 0.66,
                height: size * 0.34,
                borderWidth: size * 0.085,
                borderColor: color,
                borderTopWidth: size * 0.085,
                borderBottomLeftRadius: size * 0.08,
                borderBottomRightRadius: size * 0.08,
            }}
        />
        {/* العجلتين */}
        <View
            style={{
                position: 'absolute',
                left: size * 0.32,
                bottom: size * 0.02,
                width: size * 0.15,
                height: size * 0.15,
                borderRadius: size * 0.075,
                backgroundColor: color,
            }}
        />
        <View
            style={{
                position: 'absolute',
                left: size * 0.66,
                bottom: size * 0.02,
                width: size * 0.15,
                height: size * 0.15,
                borderRadius: size * 0.075,
                backgroundColor: color,
            }}
        />
    </View>
);

/* 🏬 متجر */
const StoreIcon = ({ size = 20, color = '#fff' }) => (
    <View style={{ width: size, height: size }}>
        {/* المظلة */}
        <View
            style={{
                position: 'absolute',
                left: size * 0.06,
                top: size * 0.16,
                width: size * 0.88,
                height: size * 0.16,
                borderRadius: size * 0.04,
                backgroundColor: color,
            }}
        />
        {/* جسم المحل */}
        <View
            style={{
                position: 'absolute',
                left: size * 0.14,
                top: size * 0.34,
                width: size * 0.72,
                height: size * 0.46,
                borderWidth: size * 0.09,
                borderColor: color,
                borderTopWidth: 0,
            }}
        />
        {/* الباب */}
        <View
            style={{
                position: 'absolute',
                left: size * 0.42,
                bottom: size * 0.2,
                width: size * 0.18,
                height: size * 0.24,
                backgroundColor: color,
            }}
        />
    </View>
);

/* 🚚 شاحنة */
const TruckIcon = ({ size = 20, color = '#fff' }) => (
    <View style={{ width: size, height: size }}>
        {/* الصندوق */}
        <View
            style={{
                position: 'absolute',
                left: size * 0.04,
                top: size * 0.28,
                width: size * 0.5,
                height: size * 0.38,
                borderRadius: size * 0.05,
                backgroundColor: color,
            }}
        />
        {/* الكابينة */}
        <View
            style={{
                position: 'absolute',
                left: size * 0.56,
                top: size * 0.42,
                width: size * 0.36,
                height: size * 0.24,
                borderTopLeftRadius: size * 0.05,
                borderTopRightRadius: size * 0.12,
                borderBottomRightRadius: size * 0.05,
                backgroundColor: color,
            }}
        />
        {/* العجلتين */}
        <View
            style={{
                position: 'absolute',
                left: size * 0.14,
                bottom: size * 0.08,
                width: size * 0.16,
                height: size * 0.16,
                borderRadius: size * 0.08,
                backgroundColor: color,
            }}
        />
        <View
            style={{
                position: 'absolute',
                left: size * 0.62,
                bottom: size * 0.08,
                width: size * 0.16,
                height: size * 0.16,
                borderRadius: size * 0.08,
                backgroundColor: color,
            }}
        />
    </View>
);

/* ⚠️ دائرة تعجب */
const AlertIcon = ({ size = 40, color = '#ccc' }) => (
    <View
        style={{
            width: size,
            height: size,
            borderRadius: size / 2,
            borderWidth: size * 0.08,
            borderColor: color,
            alignItems: 'center',
            justifyContent: 'center',
        }}
    >
        <View
            style={{
                width: size * 0.09,
                height: size * 0.34,
                borderRadius: size * 0.045,
                backgroundColor: color,
                marginBottom: size * 0.06,
            }}
        />
        <View
            style={{
                width: size * 0.11,
                height: size * 0.11,
                borderRadius: size * 0.055,
                backgroundColor: color,
            }}
        />
    </View>
);

/* 📦 صندوق */
const BoxIcon = ({ size = 48, color = '#ccc' }) => (
    <View style={{ width: size, height: size }}>
        {/* الغطاء */}
        <View
            style={{
                position: 'absolute',
                left: size * 0.06,
                top: size * 0.2,
                width: size * 0.88,
                height: size * 0.2,
                borderWidth: size * 0.06,
                borderColor: color,
                borderRadius: size * 0.03,
            }}
        />
        {/* الجسم */}
        <View
            style={{
                position: 'absolute',
                left: size * 0.14,
                top: size * 0.4,
                width: size * 0.72,
                height: size * 0.4,
                borderWidth: size * 0.06,
                borderColor: color,
                borderTopWidth: 0,
            }}
        />
        {/* الشريط الأوسط */}
        <View
            style={{
                position: 'absolute',
                left: size * 0.45,
                top: size * 0.2,
                width: size * 0.1,
                height: size * 0.6,
                backgroundColor: color,
            }}
        />
    </View>
);

/* أيقونة الخطوة حسب النوع */
const StepIcon = ({ type, size = 18, color = '#fff' }) => {
    switch (type) {
        case 'cart':
            return <CartIcon size={size} color={color} />;
        case 'store':
            return <StoreIcon size={size} color={color} />;
        case 'truck':
            return <TruckIcon size={size} color={color} />;
        case 'check':
            return <CheckIcon size={size} color={color} thickness={3} />;
        default:
            return null;
    }
};

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
    { key: 'orderPlaced', icon: 'cart', statuses: ['paid', 'pending', 'processing', 'shipped', 'delivered'] },
    { key: 'orderDispatched', icon: 'store', statuses: ['processing', 'shipped', 'delivered'] },
    { key: 'orderInTransit', icon: 'truck', statuses: ['shipped', 'delivered'] },
    { key: 'deliveredSuccessfully', icon: 'check', statuses: ['delivered'] },
];

// Map a raw JS/Supabase error to a translation KEY (never a raw English string).
const toErrorKey = (e) => {
    const msg = String((e && e.message) || '').toLowerCase();
    if (
        msg.includes('network request failed') ||
        msg.includes('failed to fetch') ||
        msg.includes('timeout') ||
        msg.includes('timed out') ||
        (e && e.name === 'TypeError')
    ) {
        return 'networkError';
    }
    if (
        msg.includes('jwt') ||
        msg.includes('not authenticated') ||
        msg.includes('unauthorized') ||
        msg.includes('auth session missing')
    ) {
        return 'authError';
    }
    return 'genericError';
};

const OrderTrackingScreen = () => {
    const { t, i18n } = useTranslation();
    const { isDarkMode } = useDarkMode();
    const navigation = useNavigation();
    const theme = isDarkMode ? darkTheme : lightTheme;
    const isRTL = i18n.language === 'ar' || I18nManager.isRTL;

    const [cartItemCount, setCartItemCount] = useState(0);
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [errorKey, setErrorKey] = useState(null);

    const loadCartCount = useCallback(async () => {
        try {
            const savedCart = await AsyncStorage.getItem('cart');
            setCartItemCount(savedCart ? JSON.parse(savedCart).length : 0);
        } catch (e) {
            setCartItemCount(0);
        }
    }, []);

    const loadOrders = useCallback(async (silent = false) => {
        try {
            if (!silent) setLoading(true);
            setErrorKey(null);
            const data = await getMyOrders();
            setOrders(Array.isArray(data) ? data : []);
        } catch (e) {
            console.error('Failed to load orders:', e);
            setErrorKey(toErrorKey(e));
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, []);

    const onRefresh = useCallback(() => {
        setRefreshing(true);
        loadCartCount();
        loadOrders(true);
    }, [loadCartCount, loadOrders]);

    useEffect(() => {
        loadCartCount();
        loadOrders();
        const unsubscribe = navigation.addListener('focus', () => {
            loadCartCount();
            loadOrders(true);
        });
        return unsubscribe;
    }, [navigation, loadCartCount, loadOrders]);

    const styles = createStyles(theme, isRTL);

    // Translate an order status; falls back to the raw value if no key exists.
    const statusLabel = (status) => {
        if (!status) return '';
        const key = String(status).toLowerCase();
        return i18n.exists(key) ? t(key) : String(status);
    };

    const formatMoney = (value) => `$${Number(value || 0).toFixed(2)}`;

    const renderOrder = (order) => {
        const items = order.order_items || [];
        const created = order.created_at ? new Date(order.created_at) : null;
        const locale = i18n.language === 'ar' ? 'ar-EG' : 'en-US';

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
                        {created.toLocaleDateString(locale)}
                        {t('dateTimeSeparator')}
                        {created.toLocaleTimeString(locale, { hour: '2-digit', minute: '2-digit' })}
                    </Text>
                )}

                {items.map((it) => (
                    <View key={it.id} style={styles.itemRow}>
                        <Text style={styles.itemName} numberOfLines={1}>
                            {it.name}
                            {it.storage ? ` (${it.storage})` : ''} x{it.quantity}
                        </Text>
                        <Text style={styles.itemPrice}>
                            {formatMoney(Number(it.unit_price) * it.quantity)}
                        </Text>
                    </View>
                ))}

                <View style={styles.divider} />

                <View style={styles.totalRow}>
                    <Text style={styles.totalLabel}>{t('Order total')}</Text>
                    <Text style={styles.totalValue}>{formatMoney(order.total)}</Text>
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
                                    <StepIcon type={step.icon} size={18} color="#fff" />
                                </View>
                                <Text
                                    style={[
                                        styles.stepLabel,
                                        { color: active ? theme.activeTitle : theme.inactiveTitle },
                                    ]}
                                    numberOfLines={2}
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
                {/* Header — من غير سهم/placeholder */}
                <View style={styles.appHeader}>
                    <Text style={styles.headerTitle}>{t('myOrders')}</Text>

                    <TouchableOpacity
                        onPress={() => navigation.navigate('Cart')}
                        style={styles.headerCartIconContainer}
                        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                    >
                        <CartIcon size={22} color={theme.headerText} />
                        {cartItemCount > 0 && (
                            <View style={styles.cartBadge}>
                                <Text style={styles.cartBadgeText}>{cartItemCount}</Text>
                            </View>
                        )}
                    </TouchableOpacity>
                </View>

                {/* Orders list */}
                <ScrollView
                    contentContainerStyle={styles.listContent}
                    showsVerticalScrollIndicator={false}
                    refreshControl={
                        <RefreshControl
                            refreshing={refreshing}
                            onRefresh={onRefresh}
                            tintColor={theme.activeIconBg}
                            colors={[theme.activeIconBg]}
                        />
                    }
                >
                    {loading ? (
                        <ActivityIndicator
                            size="large"
                            color={theme.activeIconBg}
                            style={{ marginTop: 50 }}
                        />
                    ) : errorKey ? (
                        <View style={styles.emptyWrap}>
                            <AlertIcon size={40} color={theme.inactiveIconBg} />
                            <Text style={styles.emptyText}>{t(errorKey)}</Text>
                            <TouchableOpacity onPress={() => loadOrders()} style={styles.retryBtn}>
                                <Text style={styles.retryText}>{t('Retry')}</Text>
                            </TouchableOpacity>
                        </View>
                    ) : orders.length === 0 ? (
                        <View style={styles.emptyWrap}>
                            <BoxIcon size={48} color={theme.inactiveIconBg} />
                            <Text style={styles.emptyText}>{t('noOrdersYet')}</Text>
                        </View>
                    ) : (
                        orders.map(renderOrder)
                    )}
                </ScrollView>
            </View>
        </SafeAreaView>
    );
};

const createStyles = (theme, isRTL) =>
    StyleSheet.create({
        safeArea: { flex: 1, backgroundColor: theme.headerBg },
        container: { flex: 1, backgroundColor: theme.appBg },

        appHeader: {
            flexDirection: isRTL ? 'row-reverse' : 'row',
            alignItems: 'center',
            paddingHorizontal: 20,
            paddingVertical: 10,
            borderBottomWidth: 1,
            borderBottomColor: theme.borderSubtle,
            backgroundColor: theme.headerBg,
            height: 60,
        },
        headerTitle: {
            fontSize: 20,
            fontWeight: 'bold',
            textAlign: 'center',
            color: theme.headerText,
            flex: 1,
            marginHorizontal: 8,
        },
        headerCartIconContainer: {
            width: 40,
            height: 40,
            alignItems: 'center',
            justifyContent: 'center',
            position: 'relative',
            overflow: 'visible',
        },
        cartBadge: {
            position: 'absolute',
            right: 0,
            top: 0,
            backgroundColor: theme.badgeBg,
            borderRadius: 9,
            minWidth: 18,
            height: 18,
            paddingHorizontal: 4,
            justifyContent: 'center',
            alignItems: 'center',
            zIndex: 10,
        },
        cartBadgeText: { color: theme.badgeText, fontSize: 10, fontWeight: 'bold' },

        listContent: { padding: 16, paddingBottom: 40, flexGrow: 1 },
        orderCard: {
            backgroundColor: theme.cardBg,
            borderRadius: 12,
            padding: 16,
            marginBottom: 16,
            borderWidth: 1,
            borderColor: theme.borderSubtle,
        },
        orderHeader: {
            flexDirection: isRTL ? 'row-reverse' : 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: 6,
        },
        orderId: {
            fontWeight: 'bold',
            color: theme.headerText,
            fontSize: 15,
            textAlign: isRTL ? 'right' : 'left',
        },
        orderStatus: {
            color: theme.activeTitle,
            fontWeight: 'bold',
            textTransform: 'capitalize',
            fontSize: 13,
        },
        orderDate: {
            color: theme.appTextDefault,
            fontSize: 12,
            marginBottom: 12,
            textAlign: isRTL ? 'right' : 'left',
        },
        itemRow: {
            flexDirection: isRTL ? 'row-reverse' : 'row',
            justifyContent: 'space-between',
            marginBottom: 6,
        },
        itemName: {
            color: theme.appTextDefault,
            flex: 1,
            marginHorizontal: 8,
            textAlign: isRTL ? 'right' : 'left',
        },
        itemPrice: { color: theme.appTextDefault, fontWeight: '600' },
        divider: { height: 1, backgroundColor: theme.borderSubtle, marginVertical: 10 },
        totalRow: {
            flexDirection: isRTL ? 'row-reverse' : 'row',
            justifyContent: 'space-between',
            marginBottom: 16,
        },
        totalLabel: { fontWeight: 'bold', color: theme.headerText },
        totalValue: { fontWeight: 'bold', color: theme.headerText },

        stepper: {
            flexDirection: isRTL ? 'row-reverse' : 'row',
            justifyContent: 'space-between',
        },
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
            lineHeight: 22,
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