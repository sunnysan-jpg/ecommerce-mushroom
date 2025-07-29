const express = require('express');
const cookieParser = require('cookie-parser');
const session = require("express-session");
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const sequelize = require('./config/db.config');
const path = require('path');
require('dotenv').config();
require('./config/passport');
const app = express();
const passport = require("passport");

// import routes
const authRoutes = require('./routes/auth.routes');
const productRoutes = require('./routes/product.routes');
const cartRoutes = require('./routes/cart.routes');
const orderRoutes = require('./routes/order.routes');


// Security middleware first
app.use(helmet()); // 🛡️ Set secure headers
app.use(cors({ origin: 'https://verdant-cheesecake-b2f6f3.netlify.app/', credentials: true })); // Enable CORS
app.use(express.json()); // Parse JSON body
app.use(cookieParser()); // Parse cookies
app.use(rateLimit({ // ⛔ Prevent brute-force
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: "Too many requests from this IP. Try again later.",
}));


app.use(session({ secret: 'secret', resave: false, saveUninitialized: false }));

app.use(passport.initialize());
app.use(passport.session());

// Import models before syncing DB
require('./models/user.model');
require('./models/product.model'); // include this too if needed
require('./models/orderItem.model'); 
require('./models/order.model'); 
require('./models/category.model'); 
require('./models/cart.model'); 


// Routes
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/cart', cartRoutes);
app.use('/api/orders', orderRoutes);

// DB connection
sequelize.sync({ alter: true }).then(() => {
  console.log('✅ DB Synced');
});

module.exports = app;
