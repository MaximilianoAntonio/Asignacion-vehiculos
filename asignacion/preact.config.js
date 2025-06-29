export default (config) => {
  if (config.devServer) {
    config.devServer.host = '0.0.0.0';
  }
};