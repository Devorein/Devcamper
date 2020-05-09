const ErrorResponse = require('../utils/errorResponse');

function errorHandler(err, req, res, next) {
	console.log(err.stack.red);

	let error = { ...err };
	error.message = err.message;

	// Mongoose bad objectid
	if (err.name === 'CastError') {
		const message = `Resource not found with id of ${err.value}`;
		error = new ErrorResponse(message, 404);
	}
	res.status(error.statusCode || 500).json({ success: false, error: error.message || 'Server Error' });
}

module.exports = errorHandler;
