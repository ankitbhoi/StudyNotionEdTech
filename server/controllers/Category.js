const Category = require("../models/Category");

//create Category ka handler funciton

exports.createCategory = async (req, res) => {
	try {
		//fetch data
		const { name, description } = req.body;
		//validation
		if (!name) {
			return res.status(400).json({
				success: false,
				message: 'All fields are required',
			});
		}
		//create entry in DB
		const CategoryDetails = await Category.create({
			name: name,
			description: description,
		});
		console.log(CategoryDetails);
		//return response

		return res.status(200).json({
			success: true,
			message: "Category Created Successfully",
		});
	}
	catch (error) {
		return res.status(500).json({
			success: true,
			message: error.message,
		});
	}
};

//getAllCategorys handler function

exports.showAllCategories = async (req, res) => {
	try {
		const allCategorys = await Category.find({}, { name: true, description: true });
		res.status(200).json({
			success: true,
			message: "All Categorys returned successfully",
			data: allCategorys,
		});
	}
	catch (error) {
		return res.status(500).json({
			success: false,
			message: error.message,
		});
	}
};

//line 43->This line uses the Category model and the find() method to retrieve all Categorys from the database. The first argument {} specifies an empty filter, indicating that all Categorys should be returned. The second argument {name:true, description:true} is the projection parameter, which specifies that only the name and description fields should be included in the returned documents. This helps to reduce the amount of data transferred from the database. 

exports.categoryPageDetails = async (req, res) => {
	try {
		const { categoryId } = req.body;

		// Get courses for the specified category
		const selectedCategory = await Category.findById(categoryId)
			.populate("courses")
			.exec();
		console.log(selectedCategory);
		// Handle the case when the category is not found
		if (!selectedCategory) {

			return res
				.status(404)
				.json({
					success: false, message: "DATA not found",
				});
		}
		// Handle the case when there are no courses
		// if (selectedCategory.courses.length === 0) {
		// 	console.log("No courses found for the selected category.");
		// 	return res.status(404).json({
		// 		success: false,
		// 		message: "No courses found for the selected category.",
		// 	});
		// }

		// const selectedCourses = selectedCategory.courses;

		// Get courses for other categories
		const differentCategories = await Category.find({
			_id: { $ne: categoryId },	//not equal to category ID
		})
		.populate("courses")
		.exec();

		// let differentCourses = [];
		// for (const category of differentCategories) {
		// 	differentCourses.push(...category.courses);
		// }

		// // Get top-selling courses across all categories
		// const allCategories = await Category.find().populate("courses");
		// const allCourses = allCategories.flatMap((category) => category.courses);
		// const mostSellingCourses = allCourses
		// 	.sort((a, b) => b.sold - a.sold)
		// 	.slice(0, 10);

		return res.status(200).json({
			success:true,
			data:{
				selectedCategory,
				differentCategories,
				// mostSellingCourses
			}
		});
	} catch (error) {
		console.log(error);
		return res.status(500).json({
			success: false,
			message: "Internal server error",
			error: error.message,
		});
	}
};


// It fetches all the categories from the "Category" collection in the database and populates the "courses" field for each category using the .populate("courses") method. This allows you to retrieve the associated courses for each category.

// The allCourses variable is then assigned the flattened array of courses obtained from the allCategories array. The flatMap method is used to iterate over each category and extract the "courses" array from it, creating a single flattened array of all courses.

// Next, the mostSellingCourses array is generated by sorting the allCourses array in descending order based on the "sold" property of each course. The .sort((a, b) => b.sold - a.sold) function is used for this, with the comparison function sorting the courses based on their "sold" property.

// Finally, the slice(0, 10) method is used to extract the first 10 elements from the sorted allCourses array, resulting in an array of the top 10 most selling courses.