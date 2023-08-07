const User = require("../models/User");
const mailSender = require("../utils/mailSender");
const bcrypt = require("bcrypt");
const crypto=require("crypto");

//resetPasswordToken
exports.resetPasswordToken = async (req, res) => {
    try {
        //get email from req body
        const email = req.body.email;
        //check user for this email , email validation
        const user = await User.findOne({email: email});
        if(!user) {
            return res.json({
                success:false,
                message:`This Email: ${email} is not Registered With Us Enter a Valid Email `
            });
        }
        //generate token = unique token
        const token = crypto.randomBytes(20).toString("hex");
        //update user by adding token and expiration time
        const updatedDetails = await User.findOneAndUpdate(
                                        {email:email},
                                        {
                                            token:token,
                                            resetPasswordExpires: Date.now() + 3600000,
                                        },
                                        {new:true});//updated document ayega response me
        //create url for resetting password; frontend url

        console.log("DETAILS", updatedDetails);

        const url = `http://localhost:3000/update-password/${token}`
        //send mail containing the url
        await mailSender(email,  
                        "Password Reset Link",
                        `Password Reset Link: ${url}. Please click this url to reset your password.`
                    );
        //return response
        res.json({
            success:true,
            message:'Email Sent Successfully, Please Check Your Email to Continue Further',
        });
    }
    catch(error) {
        console.log(error);
        return res.status(500).json({
            error: error.message,
            success:false,
            message:'Something went wrong while sending reset password mail'
        })
    }



   
}


//resetPassword

exports.resetPassword = async (req, res) => {
    try {
          //data fetch
          //front ne iss token ko request ki body me dali hogi bcz url se backend me kaise nikaloge?
        const {password, confirmPassword, token} = req.body;
        //validation
        if(confirmPassword !== password) {
            return res.json({
                success:false,
				message: "Password and Confirm Password Does not Match",
            });
        }
        //get userdetails from db using token
        const userDetails = await User.findOne({token: token});
        //if no entry - invalid token
        if(!userDetails) {
            return res.json({
                success:false,
                message:'Token is invalid',
            });
        }
        //token time check 
        // 5:00->5:05<6:00pm
        if (!(userDetails.resetPasswordExpires > Date.now())) {
			return res.status(403).json({
				success: false,
				message: `Token is Expired, Please Regenerate Your Token`,
			});
		}
        //hash pwd
        const encryptedPassword = await bcrypt.hash(password, 10);

        //password update
        await User.findOneAndUpdate(
            {token:token},
            {password:encryptedPassword},
            {new:true},
        );
        //return response
        return res.status(200).json({
            success:true,
            message:'Password reset successful',
        });
    }
    catch (error) {
		return res.json({
			error: error.message,
			success: false,
			message: `Some Error in Updating the Password`,
		});
    }
};