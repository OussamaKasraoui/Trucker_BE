const session = require('express-session');
const MongoStore = require('connect-mongo');

const sessionMiddleware = session({
  secret: process.env.SESSION_SECRET || 'yourSecretKey',

  resave: false,
  saveUninitialized: false,
  
  store: MongoStore.create({
    mongoUrl: process.env.MONGODB_BASE_URL, // Connection URI
    collectionName: 'sessions',
  }),
  cookie: {
    httpOnly: true,
    maxAge: 1000 * 60 * 60 * 24, // 1 day
  },
});

module.exports = sessionMiddleware;
