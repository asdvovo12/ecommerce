// metro.config.js
const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const config = getDefaultConfig(__dirname);

const emptyShim = path.resolve(__dirname, 'emptyShim.js');

// (1) نفضّل نسخ RN/المتصفح بدل نسخ Node
config.resolver.unstable_enablePackageExports = false;

// (2) أي مكتبة Node بتحاول "ws" تستوردها -> نوجّهها لموديول فاضي
config.resolver.extraNodeModules = {
  ...(config.resolver.extraNodeModules || {}),
  stream: emptyShim,
  zlib: emptyShim,
  crypto: emptyShim,
  net: emptyShim,
  tls: emptyShim,
  http: emptyShim,
  https: emptyShim,
  events: emptyShim,
  url: emptyShim,
  buffer: emptyShim,
  bufferutil: emptyShim,
  'utf-8-validate': emptyShim,
};

// (3) الأهم: نوقف مكتبة "ws" نفسها تماماً — React Native عنده WebSocket جاهز
const defaultResolveRequest = config.resolver.resolveRequest;
config.resolver.resolveRequest = (context, moduleName, platform) => {
  if (moduleName === 'ws' || moduleName.startsWith('ws/')) {
    return { type: 'sourceFile', filePath: emptyShim };
  }
  return defaultResolveRequest
    ? defaultResolveRequest(context, moduleName, platform)
    : context.resolveRequest(context, moduleName, platform);
};

module.exports = config;