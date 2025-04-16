require('dotenv').config({ path: '.env.local' });
const express = require('express');
const passport = require("passport");
const { initializeDatabase } = require('./config/db.config');
const routes = require('./routes');
const { initializeSocketIO } = require('./config/socketio.config');
const fs = require('fs'); // File system for optional logging to a file
// const sessionMiddleware = require('./src/middelware/session');

const app = express();

// Setup CORS middleware
app.use(function (req, res, next) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Credentials", "true");
  res.setHeader("Access-Control-Allow-Methods", "GET,HEAD,OPTIONS,POST,PUT,DELETE");
  res.setHeader("Access-Control-Allow-Headers", 
    "Origin,Cache-Control,Accept,X-Access-Token,X-Requested-With, Content-Type, Access-Control-Request-Method,Origin-Referrer,credentials, zz-Made-by");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }
  next();
});


// Middleware setup
app.use(express.urlencoded({ extended: true }));

app.use(express.json());

// app.use(sessionMiddleware);

app.use(passport.initialize());

require("./config/passport")(passport); // Initialize Passport



// Middleware to track all requests
/* app.use((req, res, next) => {
  const log = {
    headers: req.headers,
    protocol: req.protocol,

    client: req.hostname,
    url: req.originalUrl,

    method: req.method,
    body: req.body,
    parms: req.params,

    timestamp: new Date().toISOString(),
  };

  if (!req.session.history) {
    req.session.history = []; // Initialize session history if it doesn't exist
  }

  // Add the current action to the session history
  req.session.history.push(log);

  // Save the session and handle potential errors
  req.session.save((err) => {
    if (err) {
      console.error('Failed to save session:', err);
    }
  });


  // Log to the console
  console.log(`[${log.timestamp}] \t ${req.session.id} \t ${log.method} \t ${log.client} \t ${log.url} \n`, req.session.history);

  // Optionally, write to a log file
  fs.appendFile('request_logs.txt', `[${log.timestamp}] \t ${req.session.id} \n${JSON.stringify(log)} \n`, (err) => {
    if (err) console.error('Failed to write to log file', err);
  });



  // Proceed to the next middleware
  next();
});
 */
// Initialize Database
initializeDatabase();

// Initialize Routes
routes(app);

// Create and start the server
const server = require('http').createServer(app);
initializeSocketIO(server);

const port = process.env.PORT || 5000;
server.listen(port, () => {
  console.log(`Server is listening on port ${port}`);
});
