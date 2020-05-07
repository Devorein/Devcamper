const express = require('express');
const dotenv = require('dotenv');
const morgan = require('morgan');
const connectDB = require('./config/db');

// load env vars
dotenv.config({ path: './config/config.env' });

// Route files
const bootcamps = require('./routes/bootcamps');

// Connect to database
connectDB();

const app = express();

// Dev loggin middleware

if (process.env.NODE_ENV === 'development') app.use(morgan('dev'));

// Mount routers
app.use('/api/v1/bootcamps', bootcamps);

const { PORT = 5000 } = process.env;

const server = app.listen(PORT, () => {
	console.log(`Server listening in ${process.env.NODE_ENV} mode on port ${PORT}`);
});

// handle unhandled promise rejections

process.on('unhandledRejection', (err, promise) => {
	console.log(`Error: ${err.message}`);
	// Close server and exit process
	server.close(() => process.exit(1));
});
