const Bootcamp = require('../models/Bootcamp');
const ErrorResponse = require('../utils/errorResponse');
const asyncHandler = require('../middleware/async');
const geocoder = require('../utils/geocoder');

// @desc: Get all bootcamps
// @route: GET /api/v1/bootcamps
// @access: Public
exports.getBootcamps = asyncHandler(async (req, res, next) => {
  let query;

  const reqQuery = {...req.query};

  // Fields to exclude
  const excludeFields = ['select','sort'];
  excludeFields.forEach(param=> delete reqQuery[param]);

  let queryStr = JSON.stringify(reqQuery);

  // Create mongodb operators
  queryStr = queryStr.replace(/\b(gt|gte|lt|lte|in)\b/g,match=>`$${match}`);
  query = Bootcamp.find(JSON.parse(queryStr));

  // Getting the selected fields using projection
  if(req.query.select){
    const fields = req.query.select.split(",").join(" ");
    query = query.select(fields);
  }

  if(req.query.sort){
    const sortBy = req.query.sort.split(",").join(" ");
    query = query.sort(sortBy);
  }else query = query.sort("-createdAt");

	const bootcamps = await query;
	res.status(200).json({ success: true, count: bootcamps.length, data: bootcamps });
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
	const bootcamp = await Bootcamp.findByIdAndDelete(req.params.id);
	if (!bootcamp) return next(new ErrorResponse(`Bootcamp not found with id of ${req.params.id}`, 404));
	res.status(200).json({ success: true, data: bootcamp });
});


// @desc: Get bootcamps within a radius
// @route: GET /api/v1/bootcamps/radius/:zipcode/:distance
// @access: Private
exports.getBootcampsInRadius = asyncHandler(async (req, res, next) => {
  const {zipcode,distance} = req.params;
  
  // get lat/long from geocoder
  const [loc] = await geocoder.geocode(zipcode);
  const {latitude,longitude} = loc;

  // calc radius using radians
  // Divide distance by radius of earth
  const radius = distance / 3963;
  const bootcamps = await Bootcamp.find({
    location: {
      $geoWithin: {$centerSphere :[[longitude,latitude],radius]}
    }
  });
  res.status(200).json({success: true,count: bootcamps.length, data: bootcamps});
});