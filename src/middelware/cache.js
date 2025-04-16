const NodeCache = require("node-cache");
const cache = new NodeCache({ stdTTL: 3600, checkperiod: 120 }); // TTL: 1 hour, auto-check every 2 mins

// Get data from cache
exports.get = (key) => {
    return cache.get(key);
};

// Set data to cache
exports.set = (key, value) => {
    cache.set(key, value);
};

// Delete data from cache
exports.del = (key) => {
    cache.del(key);
};

// Clear all cache
exports.flush = () => {
    cache.flushAll();
};
