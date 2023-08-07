const RatingAndReview = require("../models/RatingAndReview");
const Course = require("../models/Course");
const { mongo, default: mongoose } = require("mongoose");

//create Rating
exports.createRating = async (req, res) => {
    try {
        //GET USER ID 
        const userId = req.user.id; //ek payload tha joki hamne login krte hue attach kia tha token k sath , auth wale middleware k andar token ko detach kia and wahan se payload nikala and usko req object k sath link kr dia and wahan se fetch kr parhe hai 

        //FETCH DATA FROM REQ BODY
        const { rating, review, courseId } = req.body;

        //CHECK WHETHER USER ENROLLED IN COURSE OR NOT
        const courseDetails = await Course.findOne({
            _id: courseId,              //condition1
            studentsEnrolled: {        //condition2
                $elemMatch: {
                    $eq: userId
                }
            }
        });
        //$elemMatch is an operator that allows you to specify multiple conditions on an array field. In this case, it ensures that at least one element in the studentsEnrolled array matches the condition inside.
        //$eq: userId checks if an element in the studentsEnrolled array is equal to the specified userId.

        if (!courseDetails) {
            return res.status(404).json({
                success: false,
                message: 'Student is not enrolled in the course',
            });
        }

        //CHECK IF USER HAS ALREADY REVIEWED THE COURSE
        const alreadyReviewed = await RatingAndReview.findOne({
            user: userId,
            course: courseId,
        });

        if (alreadyReviewed) {
            return res.status(403).json({
                success: false,
                error: "User has already reviewed this course",
            });
        }

        //CREATE RATING AND REVIEW
        const ratingReview = await RatingAndReview.create({
            rating,
            review,
            course: courseId,
            user: userId,
        });

        //UPDATE THE COURSE WITH THIS RATING REVIEW
        const updatedCourseDetails = await Course.findByIdAndUpdate(
            { _id: courseId },
            {
                $push: {
                    ratingsReviews: ratingReview._id,
                }
            },
            { new: true },
        );
        console.log(updatedCourseDetails);

        //RETURN RESPONSE
        return res.status(200).json({
            success: true,
            message: 'Course Reviewed Successfully',
            ratingReview,
        });

    }
    catch(error) {
        console.log(error);
        return res.status(500).json({
            success:false,
            message:error.message,
        })
    }
}

//getAverageRating
exports.getAverageRating = async (req, res) => {
    try {
        //get courseID
        const courseId = req.body.courseId;

        //calculate avg rating 
        const result = await RatingAndReview.aggregate([
            {
                $match: {
                    course: new mongoose.Types.ObjectId(courseId),
                },
            },
            {
                $group: {
                    _id: null,      //The _id: null means that all documents will be grouped into a single group
                    averageRating: { $avg: "$ratings" },
                },
            },
        ])

        //return response
        if (result.length > 0) {
            return res.status(200).json({
                success: true,
                averageRating: result[0].averageRating,
            });
        }

        //if no ratings exist
        return result.status(200).json({
            success: true,
            message: "average rating=0 no rating given till now",
            averageRating: 0,
        })
    }
    catch (error) {
        console.log(error);
        return res.status(500).json({
            success: false,
            message: error.message,
        });
    }
}

//getAll Rating and reviews

exports.getAllRating = async (req, res) => {
    try {
        const allReviews = await RatingAndReview.find({})
            .sort({ rating: "desc" })
            .populate({
                path: "user",   //It specifies the path as "user" to indicate the field to populate.
                select: "firstName lastName image", //The select option is used to specify which fields of the user document to include in the populated result.
            })
            .populate({
                path: "course",
                select: "courseName",
            })
            .exec();

        return res.status(200).json({
            success: true,
            message: "All reviews fetched successfully",
            data:allReviews,
        });
    }
    catch (error) {
        console.log(error);
        return res.status(500).json({
            success: false,
            message: error.message,
        });
    }
}