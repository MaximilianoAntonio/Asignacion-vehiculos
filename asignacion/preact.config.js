export default (config) => {
  if (config.devServer) {
    config.devServer.host = '0.0.0.0';
  }
  
  // Disable critters plugin that's causing CSS parsing issues
  config.plugins = config.plugins.filter(plugin => 
    plugin.constructor.name !== 'Critters'
  );

  // Optimización de performance: Configurar límites de tamaño de archivos
  config.performance = {
    maxAssetSize: 500000, // 500 KiB
    maxEntrypointSize: 1200000, // 1.2 MiB para entrypoints (ajustado para el estado actual optimizado)
    hints: 'warning',
    assetFilter: function(assetFilename) {
      return !assetFilename.endsWith('.map');
    }
  };

  // Optimización adicional: Configurar splitChunks para mejor division de código
  if (config.optimization) {
    config.optimization.splitChunks = {
      chunks: 'all',
      maxInitialRequests: 30,
      maxAsyncRequests: 30,
      cacheGroups: {
        // Separar React/Preact (más pequeño, cargar primero)
        preact: {
          test: /[\\/]node_modules[\\/](preact|preact-compat|preact-router)/,
          name: 'preact',
          chunks: 'all',
          priority: 40,
        },
        // Separar jsPDF (muy grande)
        jspdf: {
          test: /[\\/]node_modules[\\/](jspdf|jspdf-autotable)/,
          name: 'jspdf',
          chunks: 'async', // Solo cargar cuando se necesite
          priority: 35,
        },
        // Separar leaflet
        leaflet: {
          test: /[\\/]node_modules[\\/]leaflet/,
          name: 'leaflet',
          chunks: 'async', // Solo cargar cuando se necesite
          priority: 30,
        },
        // Separar framer-motion
        framerMotion: {
          test: /[\\/]node_modules[\\/]framer-motion/,
          name: 'framer-motion',
          chunks: 'async', // Solo cargar cuando se necesite
          priority: 30,
        },
        // Separar axios (networking)
        axios: {
          test: /[\\/]node_modules[\\/]axios/,
          name: 'axios',
          chunks: 'all',
          priority: 25,
        },
        // Separar otras utilidades
        utilities: {
          test: /[\\/]node_modules[\\/](jsqr|@emotion)/,
          name: 'utilities',
          chunks: 'async',
          priority: 20,
        },
        // Vendors más pequeños restantes
        vendor: {
          test: /[\\/]node_modules[\\/]/,
          name: 'vendors',
          chunks: 'all',
          priority: 10,
          enforce: true,
          maxSize: 300000, // Máximo 300KB por chunk
        },
        // Chunk común para código de la app
        common: {
          name: 'common',
          minChunks: 2,
          chunks: 'all',
          priority: 5,
          enforce: true,
          maxSize: 200000, // Máximo 200KB
        },
      },
    };
  }
};