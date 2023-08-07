const Section = require("../models/Section");
const Course = require("../models/Course");

exports.createSection = async (req, res) => {
    try{
        //data fetch
        const {sectionName, courseId} = req.body;
        //data validation
        if(!sectionName || !courseId) {
            return res.status(400).json({
                success:false,
                message:'Missing required Properties',
            });
        }
		// Create a new section with the given name
        const newSection = await Section.create({sectionName});
		// Add the new section to the course's content array
        const updatedCourse = await Course.findByIdAndUpdate(
			courseId,
			{
				$push: {
					courseContent: newSection._id,
				},
			},
			{ new: true }
		)
			.populate({
				path: "courseContent",
				populate: {
					path: "subSection",
				},
			})
			.exec();

		// Return the updated course object in the response
        res.status(200).json({
            success:true,
            message:'Section created successfully',
            updatedCourse,
        });
    }
    catch(error) {
        return res.status(500).json({
            success:false,
			message: "Internal server error",
            error:error.message,
        });
    }
}

exports.updateSection = async (req,res) => {
    try {

        //data input
        const {sectionName, sectionId} = req.body;
        //data validation
        if(!sectionName || !sectionId) {
            return res.status(400).json({
                success:false,
                message:'Missing Properties',
            });
        }

        //update data
        const section = await Section.findByIdAndUpdate(sectionId, {sectionName}, {new:true});

        //return res
        return res.status(200).json({
            success:true,
            message:'Section Updated Successfully',
        });

    }
    catch(error) {
        return res.status(500).json({
            success:false,
            message:"Unable to update Section, please try again",
            error:error.message,
        });
    }
};

// DELETE a section
exports.deleteSection = async (req, res) => {
	try {
		const { sectionId } = req.body;
		await Section.findByIdAndDelete(sectionId);
		res.status(200).json({
			success: true,
			message: "Section deleted",
		});
	} catch (error) {
		console.error("Error deleting section:", error);
		res.status(500).json({
			success: false,
			message: "Internal server error",
		});
	}
};