const Bootcamp = require('../models/Bootcamp');
const ErrorResponse = require('../utils/errorResponse');
const asyncHandler = require('../middleware/async');
const geocoder = require('../utils/geocoder');
const path = require('path');

// @desc: Get all bootcamps
// @route: GET /api/v1/bootcamps
// @access: Public
exports.getBootcamps = asyncHandler(async (req, res, next) => {
	let query;

	const reqQuery = { ...req.query };

	// Fields to exclude
	const excludeFields = [ 'select', 'sort', 'page', 'limit' ];
	excludeFields.forEach((param) => delete reqQuery[param]);

	let queryStr = JSON.stringify(reqQuery);

	// Create mongodb operators
	queryStr = queryStr.replace(/\b(gt|gte|lt|lte|in)\b/g, (match) => `$${match}`);
	query = Bootcamp.find(JSON.parse(queryStr)).populate('courses');

	// Getting the selected fields using projection
	if (req.query.select) {
		const fields = req.query.select.split(',').join(' ');
		query = query.select(fields);
	}

	if (req.query.sort) {
		const sortBy = req.query.sort.split(',').join(' ');
		query = query.sort(sortBy);
	} else query = query.sort('-createdAt');

	// Pagination
	const page = parseInt(req.query.page) || 1;
	const limit = parseInt(req.query.limit) || 10;
	const startIndex = (page - 1) * limit;
	const endIndex = page * limit;
	const total = await Bootcamp.countDocuments();

	query = query.skip(startIndex).limit(limit);

	// Pagination result
	const pagination = {};
	if (endIndex < total) {
		pagination.next = {
			page: page + 1,
			limit
		};
	}

	if (startIndex > 0) {
		pagination.prev = {
			page: page - 1,
			limit
		};
	}

	const bootcamps = await query;
	res.status(200).json({ success: true, count: bootcamps.length, pagination, data: bootcamps });
});

// @desc: Get single bootcamp
// @route: GET /api/v1/bootcamps/:id
// @access: Public
exports.getBootcamp = asyncHandler(async (req, res, next) => {
	const bootcamp = await Bootcamp.findById(req.params.id);
	if (!bootcamp) return next(new ErrorResponse(`Bootcamp not found with id of ${req.params.id}`, 404));
	res.status(200).json({ success: true, data: bootcamp });
});

// @desc: Create single bootcamp
// @route: POST /api/v1/bootcamps/:id
// @access: Private
exports.createBootcamp = asyncHandler(async (req, res, next) => {
	const bootcamp = await Bootcamp.create(req.body);
	res.status(201).json({ success: true, data: bootcamp });
});

// @desc: Update single bootcamp
// @route: PUT /api/v1/bootcamps/:id
// @access: Private
exports.updateBootcamp = asyncHandler(async (req, res, next) => {
	const bootcamp = await Bootcamp.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
	if (!bootcamp) return next(new ErrorResponse(`Bootcamp not found with id of ${req.params.id}`, 404));
	res.status(200).json({ success: true, data: bootcamp });
});

// @desc: Delete single bootcamp
// @route: DELETE /api/v1/bootcamps/:id
// @access: Private
exports.deleteBootcamp = asyncHandler(async (req, res, next) => {
	const bootcamp = await Bootcamp.findById(req.params.id);
	if (!bootcamp) return next(new ErrorResponse(`Bootcamp not found with id of ${req.params.id}`, 404));
	await bootcamp.remove();
	res.status(200).json({ success: true, data: bootcamp });
});

// @desc: Get bootcamps within a radius
// @route: GET /api/v1/bootcamps/radius/:zipcode/:distance
// @access: Private
exports.getBootcampsInRadius = asyncHandler(async (req, res, next) => {
	const { zipcode, distance } = req.params;

	// get lat/long from geocoder
	const [ loc ] = await geocoder.geocode(zipcode);
	const { latitude, longitude } = loc;

	// calc radius using radians
	// Divide distance by radius of earth
	const radius = distance / 3963;
	const bootcamps = await Bootcamp.find({
		location: {
			$geoWithin: { $centerSphere: [ [ longitude, latitude ], radius ] }
		}
	});
	res.status(200).json({ success: true, count: bootcamps.length, data: bootcamps });
});

// @desc: Upload single bootcamp photo
// @route: PUT /api/v1/bootcamps/:id/photo
// @access: Private
exports.bootcampPhotoUpload = asyncHandler(async (req, res, next) => {
	const bootcamp = await Bootcamp.findById(req.params.id);
	if (!bootcamp) return next(new ErrorResponse(`Bootcamp not found with id of ${req.params.id}`, 404));
	if (!req.files) return next(new ErrorResponse(`Please upload a file`, 400));
	const { file } = req.files;

	// Make sure that the image is a photo
	if (!file.mimetype.startsWith('image/')) return next(new ErrorResponse(`Please upload an image file`, 400));

	// check file size
	if (file.size > process.env.FILE_UPLOAD_SIZE) return next(new ErrorResponse(`Photo larger than 1mb`, 400));

	// Create custom filename
	file.name = `bootcamp_${bootcamp._id}${path.parse(file.name).ext}`;

	file.mv(`${process.env.FILE_UPLOAD_PATH}/${file.name}`, async (err) => {
		if (err) {
			console.log(err);
			return next(new ErrorResponse(`Problem with file upload`, 500));
		}
		await Bootcamp.findByIdAndUpdate(bootcamp._id, {
			photo: file.name
		});
		res.status(200).json({ success: true, data: file.name });
	});
});
