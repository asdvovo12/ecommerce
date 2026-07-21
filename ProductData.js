// productData.js

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

const productDetails = {
    Apple: {
        'iPhone 14': {
            // basePrice REMOVED
            description: "The ultimate iPhone experience.",
            storageOptions: ['128GB', '256GB', '512GB'],
            storagePricing: { //  TOTAL prices, NOT additions
                '128GB': 799,
                '256GB': 899,  // 799 + 100
                '512GB': 999,  // 799 + 200
            },
            category: "Phones",
            images: [
                { uri: 'https://snack-code-uploads.s3.us-west-1.amazonaws.com/~asset/6938a1f01388aa878dfe5c2f788161c5' },
                { uri: 'https://via.placeholder.com/400?text=iPhone14_2' },
                { uri: 'https://via.placeholder.com/400?text=iPhone14_3' },
            ],
        },
        'iPhone 15': {
            //basePrice: 899, //REMOVED
            description: "The newest iPhone, with an even better camera.",
            storageOptions: ['256GB', '512GB', '1TB'],
             storagePricing: {
                '256GB': 899, //total price
                '512GB': 999, //total price
                '1TB': 1149,  //total price
            },
            category: "Phones",
            images: [
                { uri: 'https://snack-code-uploads.s3.us-west-1.amazonaws.com/~asset/659a622f73c919bbd69803299ec126d4' },
                { uri: 'https://via.placeholder.com/400?text=iPhone15_2' },
                { uri: 'https://via.placeholder.com/400?text=iPhone15_3' },
            ],
        },
        'iPhone 14 Pro': {
            //basePrice: 999, //REMOVED
            description: "Pro-level performance and camera.",
            storageOptions: ['256GB', '512GB', '1TB'],
            storagePricing: {
               '256GB': 999,  //total price
               '512GB': 1149, //total price
               '1TB': 1299,   //total price
           },
            category: "Phones",
            images: [
                { uri: 'https://snack-code-uploads.s3.us-west-1.amazonaws.com/~asset/c00c6e913b98368681689949febac646' },
                { uri: 'https://via.placeholder.com/400?text=iPhone14Pro_2' },
                { uri: 'https://via.placeholder.com/400?text=iPhone14Pro_3' },
            ],
        },
        'iPhone 13': {
            //basePrice: 699, //REMOVED
            description: "A powerful and affordable iPhone.",
            storageOptions: ['128GB', '256GB', '512GB'],
            storagePricing: {
                '128GB': 699, //total price
                '256GB': 779, //total price
                '512GB': 859, //total price
            },
            category: "Phones",
            images: [
                { uri: 'https://snack-code-uploads.s3.us-west-1.amazonaws.com/~asset/9fddc7054a9726b0d1986b1f63a9b899' },
                { uri: 'https://via.placeholder.com/400?text=iPhone13_2' },
                { uri: 'https://via.placeholder.com/400?text=iPhone13_3' },
            ],
        },
        'iPhone SE': {
            //basePrice: 500, //REMOVED
            description: "The most affordable iPhone.",
            storageOptions: ['64GB', '128GB', '256GB'],
            storagePricing: {
                '64GB': 500,  //total price
                '128GB': 550,  //total price
                '256GB': 600,  //total price
            },
            category: "Phones",
            images: [
                { uri: 'https://snack-code-uploads.s3.us-west-1.amazonaws.com/~asset/40fe8c22cd3d39ae2ecbfa3cf1283d19' },
                { uri: 'https://via.placeholder.com/400?text=iPhoneSE_2' },
                { uri: 'https://via.placeholder.com/400?text=iPhoneSE_3' },
            ],
        },
    },
    Google: {
      'Pixel 7': {
          //basePrice: 599, //REMOVED
          description: "The ultimate Google experience.",
          storageOptions: ['128GB', '256GB', '512GB'],
          storagePricing: {
              '128GB': 599, //total
              '256GB': 669, //total
              '512GB': 739, //total
          },
          category: "Phones",
          images: [
              { uri: 'https://snack-code-uploads.s3.us-west-1.amazonaws.com/~asset/5d565c4aa9d3f30b1ab8050cf52ef31c' },
              { uri: 'https://via.placeholder.com/400?text=Pixel7_2' },
              { uri: 'https://via.placeholder.com/400?text=Pixel7_3' },
          ],
      },
      'Pixel 8': {
          //basePrice: 699, //REMOVED
          description: "The latest and greatest Pixel phone.",
          storageOptions: ['128GB', '256GB', '512GB'],
          storagePricing: {
              '128GB': 699, //total
              '256GB': 789, //total
              '512GB': 879, //total
          },
          category: "Phones",
          images: [
              { uri: 'https://snack-code-uploads.s3.us-west-1.amazonaws.com/~asset/3aaee0708583ae57645cdd52e614c76f' },
              { uri: 'https://via.placeholder.com/400?text=Pixel8_2' },
              { uri: 'https://via.placeholder.com/400?text=Pixel8_3' },
          ],
      },
      'Pixel 7a': {
          //basePrice: 499, //REMOVED
          description: "A more affordable Pixel phone.",
          storageOptions: ['128GB', '256GB'],
          storagePricing: {
              '128GB': 499, //total
              '256GB': 559, //total
          },
          category: "Phones",
          images: [
              { uri: 'https://snack-code-uploads.s3.us-west-1.amazonaws.com/~asset/c84daa275d8a2d861d9e4d0b8c268a4a' },
              { uri: 'https://via.placeholder.com/400?text=Pixel7a_2' },
              { uri: 'https://via.placeholder.com/400?text=Pixel7a_3' },
          ],
      },
      'Pixel 6': {
          //basePrice: 449, //REMOVED
          description: "A powerful Pixel phone from the previous generation.",
          storageOptions: ['128GB', '256GB'],
          storagePricing: {
              '128GB': 449, //total
              '256GB': 499, //total
          },
          category: "Phones",
          images: [
              { uri: 'https://snack-code-uploads.s3.us-west-1.amazonaws.com/~asset/19e41a7455dc0e62957bd41e7fc42b54' },
              { uri: 'https://via.placeholder.com/400?text=Pixel6_2' },
              { uri: 'https://via.placeholder.com/400?text=Pixel6_3' },
          ],
      },
      'Pixel Fold': {
          //basePrice: 1799, //REMOVED
          description: "Google's first foldable phone.",
          storageOptions: ['256GB', '512GB'],
          storagePricing: {
              '256GB': 1799,
              '512GB': 1999,
          },
          category: "Phones",
          images: [
              { uri: 'https://snack-code-uploads.s3.us-west-1.amazonaws.com/~asset/924c8a315ecfe0f603d4e006d55c27c8' },
              { uri: 'https://via.placeholder.com/400?text=PixelFold_2' },
              { uri: 'https://via.placeholder.com/400?text=PixelFold_3' },
          ],
      },
  },
  Samsung: {
      'Galaxy S23': {
          //basePrice: 799, //REMOVED
          description: "The ultimate Samsung experience.",
          storageOptions: ['128GB', '256GB', '512GB'],
          storagePricing: {
              '128GB': 799,
              '256GB': 899,
              '512GB': 999,
          },
          category: "Phones",
          images: [
              { uri: 'https://snack-code-uploads.s3.us-west-1.amazonaws.com/~asset/c5872c57c0021c73dff8953f83e15936' },
              { uri: 'https://via.placeholder.com/400?text=GalaxyS23_2' },
              { uri: 'https://via.placeholder.com/400?text=GalaxyS23_3' },
          ],
      },
      'Galaxy S22': {
          //basePrice: 699, //REMOVED
          description: "A great all-around Samsung phone.",
          storageOptions: ['128GB', '256GB'],
          storagePricing: {
              '128GB': 699,
              '256GB': 779,
          },
          category: "Phones",
          images: [
              { uri: 'https://snack-code-uploads.s3.us-west-1.amazonaws.com/~asset/540c2fe6aa82f72b6a585780b7579e14' },
              { uri: 'https://via.placeholder.com/400?text=GalaxyS22_2' },
              { uri: 'https://via.placeholder.com/400?text=GalaxyS22_3' },
          ],
      },
      'Galaxy Z Flip': {
          //basePrice: 999, //REMOVED
          description: "A stylish and foldable phone.",
          storageOptions: ['256GB', '512GB'],
          storagePricing: {
              '256GB': 999,
              '512GB': 1149,
          },
          category: "Phones",
          images: [
              { uri: 'https://snack-code-uploads.s3.us-west-1.amazonaws.com/~asset/df14259d00924e8577510a96ab23e780' },
              { uri: 'https://via.placeholder.com/400?text=GalaxyZFlip_2' },
              { uri: 'https://via.placeholder.com/400?text=GalaxyZFlip_3' },
          ],
      },
      'Galaxy S21': {
          //basePrice: 599, //REMOVED
          description: "A powerful Samsung phone from the previous generation.",
          storageOptions: ['128GB', '256GB'],
          storagePricing: {
              '128GB': 599,
              '256GB': 669,
          },
          category: "Phones",
          images: [
              { uri: 'https://snack-code-uploads.s3.us-west-1.amazonaws.com/~asset/3e571e3b2890bad5c2ff269f3df9324a' },
              { uri: 'https://via.placeholder.com/400?text=GalaxyS21_2' },
              { uri: 'https://via.placeholder.com/400?text=GalaxyS21_3' },
          ],
      },
      'Galaxy A54': {
          //basePrice: 449, //REMOVED
          description: "A mid-range Samsung phone with great features.",
          storageOptions: ['128GB', '256GB'],
          storagePricing: {
              '128GB': 449,
              '256GB': 509,
          },
          category: "Phones",
          images: [
              { uri: 'https://snack-code-uploads.s3.us-west-1.amazonaws.com/~asset/2e242585b23e39f55771a079fbccb083' },
              { uri: 'https://via.placeholder.com/400?text=GalaxyA54_2' },
              { uri: 'https://via.placeholder.com/400?text=GalaxyA54_3' },
          ],
      },
  },
};
// Modified createProduct:  No more basePrice!
const createProduct = (brand, model, productType, id) => {
    if (!productDetails[brand] || !productDetails[brand][model]) {
        console.error(`Invalid brand or model: ${brand} ${model}`);
        return null;
    }

    const details = productDetails[brand][model];
      // No basePrice here
    return {
        id: id,
        name: model,
        brand: brand,
        image: ASSETS[brand][model],
        images: details.images,
        isFavorite: false,
        category: details.category,
        productType: productType,
        description: details.description,
        storageOptions: details.storageOptions,
        storagePricing: details.storagePricing, // This now holds TOTAL prices
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
        const product = createProduct(productInfo.brand, productInfo.model, productType, `${productInfo.brand}-${productInfo.model}-${productIdCounter}`);
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