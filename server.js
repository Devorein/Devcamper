const express = require('express');
const dotenv = require('dotenv');

// load env vars

dotenv.config({ path: './config/config.env' });

const app = express();

const { PORT = 5000 } = process.env;

app.listen(PORT, () => {
	console.log(`Server listening in ${process.env.NODE_ENV} mode on port ${PORT}`);
});
