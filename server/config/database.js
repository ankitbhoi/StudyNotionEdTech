const mongoose=require("mongoose");
require("dotenv").config();

exports.connect=()=>{
    mongoose.connect(process.env.MONGODB_URL,{
        useNewUrlParser:true,
        useUnifiedTopology: true,
    })
    .then(()=> console.log("DB CONNECTED SUCCESSFULLY"))
    .catch( (error) => {
        console.log("DB CONNECTION FAILED");
        console.error(error);
        process.exit(1);
    })
}

//ye part almost har code me same hi rahta hai.

// By calling 
// process.exit(1)
// , the program execution will immediately stop, and the exit code will be set to 1. An exit code of 0 usually indicates successful termination, while non-zero codes (such as 1) typically represent errors or abnormal terminations.