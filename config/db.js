const mongoose = require('mongoose');
const config = require('./config');

const connectDB = async () => {
  try {
    await mongoose.connect(config.mongoURI, {
      useCreateIndex: true,
      useNewUrlParser: true
    });
    mongoose.set('useCreateIndex', true);
    console.log('MongoDB Connected...');
  } catch (err) {
    console.error(err.message);
    // exit process with failuer
    process.exit(1);
  }
};

module.exports = connectDB;