// ProductData.js
const ASSETS = {
    Apple: {
        'iPhone 14': require('./assets/iphone14.jpg'),
        'iPhone 15': require('./assets/iphone15.png'),
        'iPhone 14 Pro': require('./assets/iphone14.jpg'),
        'iPhone 13': require('./assets/iphone13.png'),
        'iPhone SE': require('./assets/iphonese.png'),
    },
    Google: {
        'Pixel 7': require('./assets/pixel7.png'),
        'Pixel 8': require('./assets/pixel8.png'),
        'Pixel 7a': require('./assets/pixel7a.png'),
        'Pixel 6': require('./assets/pixel6.png'),
        'Pixel Fold': require('./assets/pixelfold.png'),
    },
    Samsung: {
        'Galaxy S23': require('./assets/GalaxyS23.png'),
        'Galaxy S22': require('./assets/GalaxyS22.png'),
        'Galaxy Z Flip': require('./assets/GalaxyZFlip.png'),
        'Galaxy S21': require('./assets/GalaxyS21.png'),
        'Galaxy A54': require('./assets/GalaxyA54.png'),
    },
};

/* ✅ اتشالت كل الـ images بتاعة الإنترنت (S3 + via.placeholder) لأنها ميتة.
   الصور دلوقتي بتتبني من ASSETS المحلية جوه createProduct. */
const productDetails = {
    Apple: {
        'iPhone 14': {
            description: "The ultimate iPhone experience.",
            storageOptions: ['128GB', '256GB', '512GB'],
            storagePricing: { '128GB': 799, '256GB': 899, '512GB': 999 },
            category: "Phones",
        },
        'iPhone 15': {
            description: "The newest iPhone, with an even better camera.",
            storageOptions: ['256GB', '512GB', '1TB'],
            storagePricing: { '256GB': 899, '512GB': 999, '1TB': 1149 },
            category: "Phones",
        },
        'iPhone 14 Pro': {
            description: "Pro-level performance and camera.",
            storageOptions: ['256GB', '512GB', '1TB'],
            storagePricing: { '256GB': 999, '512GB': 1149, '1TB': 1299 },
            category: "Phones",
        },
        'iPhone 13': {
            description: "A powerful and affordable iPhone.",
            storageOptions: ['128GB', '256GB', '512GB'],
            storagePricing: { '128GB': 699, '256GB': 779, '512GB': 859 },
            category: "Phones",
        },
        'iPhone SE': {
            description: "The most affordable iPhone.",
            storageOptions: ['64GB', '128GB', '256GB'],
            storagePricing: { '64GB': 500, '128GB': 550, '256GB': 600 },
            category: "Phones",
        },
    },
    Google: {
        'Pixel 7': {
            description: "The ultimate Google experience.",
            storageOptions: ['128GB', '256GB', '512GB'],
            storagePricing: { '128GB': 599, '256GB': 669, '512GB': 739 },
            category: "Phones",
        },
        'Pixel 8': {
            description: "The latest and greatest Pixel phone.",
            storageOptions: ['128GB', '256GB', '512GB'],
            storagePricing: { '128GB': 699, '256GB': 789, '512GB': 879 },
            category: "Phones",
        },
        'Pixel 7a': {
            description: "A more affordable Pixel phone.",
            storageOptions: ['128GB', '256GB'],
            storagePricing: { '128GB': 499, '256GB': 559 },
            category: "Phones",
        },
        'Pixel 6': {
            description: "A powerful Pixel phone from the previous generation.",
            storageOptions: ['128GB', '256GB'],
            storagePricing: { '128GB': 449, '256GB': 499 },
            category: "Phones",
        },
        'Pixel Fold': {
            description: "Google's first foldable phone.",
            storageOptions: ['256GB', '512GB'],
            storagePricing: { '256GB': 1799, '512GB': 1999 },
            category: "Phones",
        },
    },
    Samsung: {
        'Galaxy S23': {
            description: "The ultimate Samsung experience.",
            storageOptions: ['128GB', '256GB', '512GB'],
            storagePricing: { '128GB': 799, '256GB': 899, '512GB': 999 },
            category: "Phones",
        },
        'Galaxy S22': {
            description: "A great all-around Samsung phone.",
            storageOptions: ['128GB', '256GB'],
            storagePricing: { '128GB': 699, '256GB': 779 },
            category: "Phones",
        },
        'Galaxy Z Flip': {
            description: "A stylish and foldable phone.",
            storageOptions: ['256GB', '512GB'],
            storagePricing: { '256GB': 999, '512GB': 1149 },
            category: "Phones",
        },
        'Galaxy S21': {
            description: "A powerful Samsung phone from the previous generation.",
            storageOptions: ['128GB', '256GB'],
            storagePricing: { '128GB': 599, '256GB': 669 },
            category: "Phones",
        },
        'Galaxy A54': {
            description: "A mid-range Samsung phone with great features.",
            storageOptions: ['128GB', '256GB'],
            storagePricing: { '128GB': 449, '256GB': 509 },
            category: "Phones",
        },
    },
};

const createProduct = (brand, model, productType, id) => {
    if (!productDetails[brand] || !productDetails[brand][model]) {
        console.error(`Invalid brand or model: ${brand} ${model}`);
        return null;
    }
    const details = productDetails[brand][model];
    const localImage = ASSETS[brand] && ASSETS[brand][model];

    return {
        id,
        name: model,
        brand,
        image: localImage,
        // ✅ صور محلية مضمونة الظهور (لو عندك صور إضافية ضيفها هنا بـ require)
        images: localImage ? [localImage] : [],
        isFavorite: false,
        category: details.category,
        productType,
        description: details.description,
        storageOptions: details.storageOptions,
        storagePricing: details.storagePricing,
    };
};

const sections = {
    'Popular Products': [
        { brand: 'Apple', model: 'iPhone 14' },
        { brand: 'Apple', model: 'iPhone 15' },
        { brand: 'Google', model: 'Pixel 7' },
        { brand: 'Apple', model: 'iPhone 13' },
        { brand: 'Apple', model: 'iPhone SE' },
        { brand: 'Google', model: 'Pixel 8' },
        { brand: 'Google', model: 'Pixel 7a' },
    ],
    'New Arrivals': [
        { brand: 'Google', model: 'Pixel 8' },
        { brand: 'Apple', model: 'iPhone 15' },
        { brand: 'Samsung', model: 'Galaxy S23' },
        { brand: 'Google', model: 'Pixel 7a' },
        { brand: 'Google', model: 'Pixel 6' },
        { brand: 'Google', model: 'Pixel Fold' },
        { brand: 'Samsung', model: 'Galaxy S22' },
        { brand: 'Samsung', model: 'Galaxy Z Flip' },
        { brand: 'Apple', model: 'iPhone 14 Pro' },
    ],
    'Special Offer': [
        { brand: 'Apple', model: 'iPhone 13' },
        { brand: 'Samsung', model: 'Galaxy S21' },
        { brand: 'Apple', model: 'iPhone 14' },
        { brand: 'Apple', model: 'iPhone SE' },
        { brand: 'Google', model: 'Pixel 7' },
    ],
    'Official Store': [
        { brand: 'Samsung', model: 'Galaxy S23' },
        { brand: 'Samsung', model: 'Galaxy S22' },
        { brand: 'Samsung', model: 'Galaxy Z Flip' },
        { brand: 'Samsung', model: 'Galaxy S21' },
        { brand: 'Samsung', model: 'Galaxy A54' },
        { brand: 'Apple', model: 'iPhone 14' },
        { brand: 'Apple', model: 'iPhone 15' },
        { brand: 'Apple', model: 'iPhone 14 Pro' },
        { brand: 'Apple', model: 'iPhone 13' },
        { brand: 'Apple', model: 'iPhone SE' },
        { brand: 'Google', model: 'Pixel 7' },
    ],
    'Default': [
        { brand: 'Samsung', model: 'Galaxy S23' },
        { brand: 'Samsung', model: 'Galaxy S22' },
        { brand: 'Google', model: 'Pixel 6' },
        { brand: 'Google', model: 'Pixel Fold' },
        { brand: 'Apple', model: 'iPhone 14' },
        { brand: 'Apple', model: 'iPhone 15' },
        { brand: 'Apple', model: 'iPhone 14 Pro' },
        { brand: 'Apple', model: 'iPhone 13' },
        { brand: 'Google', model: 'Pixel 7' },
    ],
};

const allProducts = [];
let productIdCounter = 1;

for (const [productType, productList] of Object.entries(sections)) {
    for (const productInfo of productList) {
        const product = createProduct(
            productInfo.brand,
            productInfo.model,
            productType,
            `${productInfo.brand}-${productInfo.model}-${productIdCounter}`
        );
        if (product) {
            allProducts.push(product);
            productIdCounter++;
        }
    }
}

const STORES = [
    { id: 'store1', name: 'Store A', latitude: 37.7749, longitude: -122.4194, products: ['Apple-iPhone 14-1', 'Apple-iPhone 15-2', 'Google-Pixel 7-3'] },
    { id: 'store2', name: 'Store B', latitude: 34.0522, longitude: -118.2437, products: ['Samsung-Galaxy S23-6', 'Google-Pixel 8-7', 'Apple-iPhone 14 Pro-9'] },
    { id: 'store3', name: 'Store C', latitude: 40.7128, longitude: -74.0060, products: ['Apple-iPhone SE-5', 'Samsung-Galaxy S22-7', 'Google-Pixel 7a-8'] },
];

export { allProducts, STORES, ASSETS };