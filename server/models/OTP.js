const mongoose = require("mongoose");
const mailSender = require("../utils/mailSender");
const emailTemplate = require("../mail/templates/emailVerificationTemplate");

const OTPSchema = new mongoose.Schema({
    email:{
        type:String,
        required: true,
    },
    otp: {
        type:String,
        required:true,
    },
    createdAt: {
        type:Date,
        default:Date.now(),
        expires: 60*5,  // The document will be automatically deleted after 5 minutes of its creation time
    }
});


//a function -> to send emails
async function sendVerificationEmail(email, otp) {
    try{
        const mailResponse = await mailSender(email, "Verification Email from StudyNotion", emailTemplate(otp)
        );   //email,title,otp
        console.log("Email sent Successfully: ", mailResponse.response);
    }
    catch(error) {
        console.log("error occured while sending mails: ", error);
        throw error;
    }
}

OTPSchema.pre("save", async function(next) {
    console.log("New document saved to database");

	// Only send an email when a new document is created
	if (this.isNew) {
        await sendVerificationEmail(this.email, this.otp);
    }
    next();
});
//this.email,this.otp aapke current object ke data ko darshata hai 

// schema k bad and model k pehele apne code ko state karna hota hai for  pre hook
const OTP = mongoose.model("OTP", OTPSchema);

module.exports = OTP;

// The save event is triggered when a document of the OTPSchema is being saved to the database. By using pre("save", ...), you can specify a function to be executed before the document is saved to database.

// the next function is asynchronous, and it can also accept an error as a parameter. If you pass an error object to next, Mongoose will skip the remaining middleware and go directly to the error handling middleware, allowing you to handle any errors that occur during the middleware execution.