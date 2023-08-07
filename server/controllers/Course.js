const Course = require("../models/Course");
const Category = require("../models/Category");
const User = require("../models/User");
const { uploadImageToCloudinary } = require("../utils/imageUploader");

//createCourse handler function
exports.createCourse = async (req, res) => {
    try {
        // Get user ID from request object
		const userId = req.user.id;

        //fetch data 
        let {
            courseName,
            courseDescription,
            whatYouWillLearn,
            price,
            tag,
            category,
            status,
            instructions,
        } = req.body;


        //get thumbnail
        const thumbnail = req.files.thumbnailImage;

        //validation
        if (!courseName || !courseDescription || !whatYouWillLearn || !price || !category || !thumbnail || !tag) {
            return res.status(400).json({
                success: false,
                message: 'All fields are required',
            });
        }

        if (!status || status === undefined) {
            status = "Draft";
        }

        //check for instructor xtra validation
        // Check if the user is an instructor
        const instructorDetails = await User.findById(userId, {
            accountType: "Instructor",
        });
        //TODO: Verify that userId and instructorDetails._id  are same or different ? 

        if (!instructorDetails) {
            return res.status(404).json({
                success: false,
                message: 'Instructor Details not found',
            });
        }

        //check given tag is valid or not
        const categoryDetails = await Category.findById(category);
        if (!categoryDetails) {
            return res.status(404).json({
                success: false,
                message: 'Category Details not found',
            });
        }

        //Upload ImageTHUMBNAIL top Cloudinary
        const thumbnailImage = await uploadImageToCloudinary(thumbnail, process.env.FOLDER_NAME);
        console.log(thumbnailImage);

        //create an entry for new Course
        const newCourse = await Course.create({
            courseName,
            courseDescription,
            instructor: instructorDetails._id, //according to course schema we need to fetch id 
            whatYouWillLearn: whatYouWillLearn,
            price,
            tag: tag,
            category: categoryDetails._id,
            thumbnail: thumbnailImage.secure_url,
            status: status,
            instructions: instructions,
        });

        //Add the new course to the user schema of Instructor
        // By using the $push operator, the new course's ID is added to the courses array field in the instructor's document, establishing the relationship between the instructor and the course. This allows you to easily retrieve the courses associated with a specific instructor in the future or perform operations related to the instructor's courses.
        await User.findByIdAndUpdate(
            { _id: instructorDetails._id },
            {
                $push: {
                    courses: newCourse._id,
                },
            },
            { new: true },
        );

        // Add the new course to the Categories
        await Category.findByIdAndUpdate(
            { _id: category },
            {
                $push: {
                    course: newCourse._id,
                },
            },
            { new: true }
        );

        //return response
        res.status(200).json({
            success: true,
            message: "Course Created Successfully",
            data: newCourse,
        });

    }
    catch (error) {
        console.error(error);
        return res.status(500).json({
            success: false,
            message: 'Failed to create Course',
            error: error.message,
        });
    }
};





//getAllCourses handler function

exports.getAllCourses = async (req, res) => {
    try {
        //TODO: change the below statement incrementally
        const allCourses = await Course.find({}, {
            courseName: true,
            price: true,
            thumbnail: true,
            instructor: true,
            ratingAndReviews: true,
            studentsEnroled: true,
        }).populate("instructor").exec();
        return res.status(200).json({
            success: true,
            data: allCourses,
        });

    }
    catch (error) {
        console.log(error);
        return res.status(404).json({
            success: false,
            message: 'Cannot Fetch course data',
            error: error.message,
        });
    }
};


// For example, after executing the query, the allCourses variable will contain an array of course documents. Each course document will have the courseName, price, thumbnail, and instructor fields, where the instructor field will contain the instructor object with all associated details, such as name, email, and other instructor-specific information.

//getCourseDetails
exports.getCourseDetails = async (req, res) => {
    try {
        //get id 
        const { courseId } = req.body;

        //find course details
        const courseDetails = await Course.find({ _id: courseId })
            .populate(
                {
                    //instructor ke andar bhi reference to user hai and uske additional details ko v populate krna hai...NESTED BCZ REFERENCE TO OTHER MODEL HAI 
                    path: "instructor",
                    populate: {
                        path: "additionalDetails",
                    },
                }
            )
            .populate("category")
            // .populate("ratingAndreviews")
            .populate({
                path: 'courseContent',
                populate: {
                    path: "subSection",
                },
            })
            .exec();

            //validation
            if(!courseDetails){
                return res.status(400).json({
                    success :false,
                    message: `Could not find the course with ${courseId}`,
                });
            }

            //return response
            return res.status(200).json({
                success:true,
                message:"Course Details Fetched Successfully",
                data:courseDetails,
            })
    }
    catch (error) {
        console.log(error);
        return res.status(500).json({
            success:false,
            message:error.message,
        });
    }
}