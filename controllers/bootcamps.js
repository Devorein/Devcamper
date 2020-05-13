const Bootcamp = require('../models/Bootcamp');
const ErrorResponse = require('../utils/errorResponse');
const asyncHandler = require('../middleware/async');
const geocoder = require('../utils/geocoder');
const path = require('path');

// @desc: Get all bootcamps
// @route: GET /api/v1/bootcamps
// @access: Public
exports.getBootcamps = asyncHandler(async (req, res, next) => {
	res.status(200).json(res.advancedResults);
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
	req.body.user = req.user;
	// Check for published bootcamp
	const publishedBootcamp = await Bootcamp.findOne({ user: req.user.id });
	// If not admin can add only one bootcamp
	if (publishedBootcamp && req.user.role !== 'admin')
		return next(new ErrorResponse(`User with id ${req.user.id} has already published bootcamp`, 400));
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
