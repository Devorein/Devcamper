const Course = require('../models/Course');
const ErrorResponse = require('../utils/errorResponse');
const asyncHandler = require('../middleware/async');

// @desc: Get all courses
// @route: GET /api/v1/courses
// @route: GET /api/v1/bootcamp/:bootcampId/courses
// @access: Public

exports.getCourses = asyncHandler(async function(req, res, next) {
	let query;

	if (req.params.bootcampId) query = Course.find({ bootcamp: req.params.bootcampId });
	else query = Course.find();
	console.log(req.params.bootcampId);
	const courses = await query;
	res.status(200).json({ success: true, count: courses.length, data: courses });
});