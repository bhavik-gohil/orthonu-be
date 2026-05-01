require('dotenv').config();
const express = require('express');
const { sequelize } = require('./models');
const routes = require('./routes/routes');
const allowedOrigins = require('./utils/allowOrigins');
const cookieParser = require('cookie-parser');

const app = express();
app.use(cookieParser());
app.use((req, res, next) => {
  const origin = req.headers.origin;
  if (allowedOrigins.includes(origin)) {
    res.header("Access-Control-Allow-Origin", origin);
  }
  res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS, PATCH");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept, Authorization");
  res.header("Access-Control-Allow-Credentials", "true");

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  next();
});
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));
app.use('/uploads', express.static(require('path').join(__dirname, 'public/uploads')));
app.use('/', routes);

const PORT = process.env.PORT || 3100;
async function start() {
  await sequelize.authenticate();
  await sequelize.sync({ alter: true }); // alter: true adds new columns to existing tables
  
  app.listen(PORT, () => console.log(`Listening ${PORT}`));
}
start().catch(err => { console.error(err); process.exit(1); });
