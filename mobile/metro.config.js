const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const config = getDefaultConfig(__dirname);

// Force Metro to resolve all React and React-Native imports to the specific node_modules in this folder.
// This prevents the "Cannot read property 'useContext' of null" error caused by multiple React instances.
config.resolver.extraNodeModules = {
    'react': path.resolve(__dirname, 'node_modules/react'),
    'react-native': path.resolve(__dirname, 'node_modules/react-native'),
};

// Also ensure we look in node_modules first
config.resolver.nodeModulesPaths = [
    path.resolve(__dirname, 'node_modules'),
];

module.exports = config;
