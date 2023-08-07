const {instance} = require("../config/razorpay");
const Course = require("../models/Course");
const User = require("../models/User");
const mailSender = require("../utils/mailSender");
const {courseEnrollmentEmail} = require("../mail/templates/courseEnrollmentEmail");
const { default: mongoose } = require("mongoose");



//capture the payment and initiate the Razorpay order
exports.capturePayment = async (req, res) => {
    //get courseId and UserID
    const {course_id} = req.body;
    const userId = req.user.id;
    //validation
    //valid courseID
    if(!course_id) {
        return res.json({
            success:false,
            message:'Please provide valid course ID',
        })
    };
    //valid courseDetail
    let course;
    try{
        course = await Course.findById(course_id);
        if(!course) {
            return res.json({
                success:false,
                message:'Could not find the course',
            });
        }

        //user already pay for the same course
        const uid = new mongoose.Types.ObjectId(userId);    //as user id is present in string format we change it into object id
        //what if the student is already enrolled?  if my id is already present in studentsEnrolled array then only
        if(course.studentsEnrolled.includes(uid)) {
            return res.status(200).json({
                success:false,
                message:'Student is already enrolled',
            });
        }
    }
    catch(error) {
        console.error(error);
        return res.status(500).json({
            success:false,
            message:error.message,
        });
    }
    
    //order create
    //check razorpay documentation for these 
    //instance in config
    const amount = course.price;
    const currency = "INR";

    const options = {
        amount: amount * 100,       //300 as 30000 bcz 300.00(razorpay reads like this)
        currency,
        receipt: Math.random(Date.now()).toString(),
        notes:{
            courseId: course_id,
            userId,
        }
        //can be used at the time of verifying signature
    };

    try{
        //initiate the payment using razorpay
        const paymentResponse = await instance.orders.create(options);
        console.log(paymentResponse);
        //return response
        return res.status(200).json({
            success:true,
            courseName:course.courseName,
            courseDescription:course.courseDescription,
            thumbnail: course.thumbnail,
            orderId: paymentResponse.id,
            currency:paymentResponse.currency,
            amount:paymentResponse.amount,
        });
    }
    catch(error) {
        console.log(error);
        res.json({
            success:false,
            message:"Could not initiate order",
        });
    }
    

};

//payment authorization below 
//verify Signature of Razorpay and Server

exports.verifySignature = async (req, res) => {
    //NOTE:- THIS WEBHOOK WILL BE CREATED MANUALLY FROM THE RAZORPAY DASHBOARD WHILE CREATING OUR ACCOUNT AND THEN WILL BE HASHED TO BE A SIGNATURE. WE WILL LATER COMPARE THEM.
    const webhookSecret = "12345678";

    const signature = req.headers["x-razorpay-signature"];
    //By retrieving the value of the "x-razorpay-signature" header using req.headers["x-razorpay-signature"], the code can access and utilize the signature for further processing, such as verifying the authenticity of the request before taking any action related to payment processing or handling.

    //below we are following the steps to convert our secret key to hashed key manually on the other end razorpay will do it.........finally we will compare both to grant authenticity


    const shasum =  crypto.createHmac("sha256", webhookSecret); //create a new HMAC object, first argument is algo used and second is the secretkey 
    shasum.update(JSON.stringify(req.body));    //It updates the HMAC object with the JSON stringified version of the req.body object. 
    //req.body typically contains the data sent in the request body of an HTTP POST or PUT request.
    const digest = shasum.digest("hex");    //It calculates the digest (hash) of the updated HMAC object in hexadecimal format and assigns it to the digest variable.

    if(signature === digest) {
        console.log("Payment is Authorised");

        const {courseId, userId} = req.body.payload.payment.entity.notes;   //frontend wont be giving us these data as all of this is happening in the backend hence we will use notes created while creating the object.

        //after payment is done course me student gets enrolled and student list will have the course access
        try{
                //fulfil the action

                //find the course and enroll the student in it
                const enrolledCourse = await Course.findOneAndUpdate(
                                                {_id: courseId},
                                                {$push:{studentsEnrolled: userId}},
                                                {new:true},
                );

                if(!enrolledCourse) {
                    return res.status(500).json({
                        success:false,
                        message:'Course not Found',
                    });
                }

                console.log(enrolledCourse);

                //find the student and add the course to their list enrolled courses me 
                const enrolledStudent = await User.findOneAndUpdate(
                                                {_id:userId},
                                                {$push:{courses:courseId}},
                                                {new:true},
                );

                console.log(enrolledStudent);

                //mail send krdo confirmation wala 
                const emailResponse = await mailSender(
                                        enrolledStudent.email,
                                        "Congratulations from StudyNotion",
                                        "Congratulations, you are onboarded into our new Course",
                );

                console.log(emailResponse);
                return res.status(200).json({
                    success:true,
                    message:"Signature Verified and COurse Added",
                });


        }       
        catch(error) {
            console.log(error);
            return res.status(500).json({
                success:false,
                message:error.message,
            });
        }
    }
    else {
        return res.status(400).json({
            success:false,
            message:'Invalid request',
        });
    }


};

