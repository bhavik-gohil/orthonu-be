const allowedOrigins = [
  process.env.FE_BASE_URL,
  process.env.FE_SHOP_BASE_URL,
  process.env.FE_ADMIN_BASE_URL,
].filter(Boolean);

module.exports = allowedOrigins;
