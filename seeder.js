const fs = require('fs');
const mongoose = require('mongoose');
const colors = require('colors');
const dotenv = require('dotenv');

// Lod env variables
dotenv.config({ path: './config/config.env' });

// Load models
const Bootcamp = require('./models/Bootcamp');
const Course = require('./models/Course');
const User = require('./models/User');

// Connect to db
mongoose.connect(process.env.MONGO_URI, {
	useNewUrlParser: true,
	useCreateIndex: true,
	useFindAndModify: false,
	useUnifiedTopology: true
});

// Read JSON files
const bootcamps = JSON.parse(fs.readFileSync(`${__dirname}/_data/bootcamps.json`, 'UTF-8'));
const courses = JSON.parse(fs.readFileSync(`${__dirname}/_data/courses.json`, 'UTF-8'));
const users = JSON.parse(fs.readFileSync(`${__dirname}/_data/users.json`, 'UTF-8'));

// Import into db
const importData = async (exit = true) => {
	try {
		await Bootcamp.create(bootcamps);
		await Course.create(courses);
		await User.create(users);
		console.log(`Bootcamps imported ...`.green.inverse);
		console.log(`Courses imported ...`.green.inverse);
		console.log(`Users imported ...`.green.inverse);
		if (exit) process.exit();
	} catch (err) {
		console.error(err);
	}
};

const deleteData = async (exit = true) => {
	try {
		await Bootcamp.deleteMany();
		await Course.deleteMany();
		await User.deleteMany();
		console.log(`Bootcamps destroyed ...`.red.inverse);
		console.log(`Courses destroyed ...`.red.inverse);
		console.log(`Users destroyed ...`.red.inverse);
		if (exit) process.exit();
	} catch (err) {
		console.error(err);
	}
};

if (process.argv[2] === '-i') importData();
else if (process.argv[2] === '-d') deleteData();
else if (process.argv[2] === '-b') {
	(async () => {
		await deleteData(false);
		await importData(false);
		process.exit();
	})();
}
