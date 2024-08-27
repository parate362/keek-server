const express = require("express");
const bcrypt = require("bcryptjs"); 
const User = require("../model/Influencer");
const VerificationToken = require("../model/verificationToken");

require("dotenv").config();

 const twilio = require("twilio");
const Influencer = require("../model/Influencer");
const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
if (!accountSid || !authToken) {
    throw new Error(
      "TWILIO_ACCOUNT_SID and TWILIO_AUTH_TOKEN must be set in the environment variables."
    );
  }
  
  const client = twilio(
    process.env.TWILIO_ACCOUNT_SID,
    process.env.TWILIO_AUTH_TOKEN
  );

  exports.influencerverifyAndSignUpWithMobile = async (req, res) => {
    try {
      const { name, mobileNumber, otp } = req.body;
  
      // Verify OTP
      const verificationToken = await VerificationToken.findOne({
        mobile: mobileNumber,
      });
      console.log(verificationToken);
      if (!verificationToken) {
        return res.status(400).json({ error: "Invalid OTP" });
      }
  
      // const isValid = await bcrypt.compare(otp);
      // console.log(isValid);
      if (verificationToken.otp === req.body.otp) {
        return res.status(400).json({ error: "Invalid OTP" });
      }
  
      // Check if the user already exists and is verified
      let user = await User.findOne({ mobile: mobileNumber });
      if (user && user.verified) {
        return res.status(402).json({
          status: false,
          statuscode: 402,
          message: "User mobile number already exists and is verified!",
        });
      }
  
      // If user exists but not verified, mark as verified
      if (user) {
        user.verified = true;
        user.name = name;
      } else {
        // Create new user if doesn't exist
        user = new Influencer({
          name: name,
          mobile: mobileNumber,
          verified: true,
        });
      }
  
      // Save user to database
      await user.save();
  
      // Delete the verification token after successful verification
      await VerificationToken.deleteOne({ mobile: mobileNumber });
  
      // Return success response
      return res.status(201).json({
        status: true,
        statuscode: 201,
        message: "User verified and registered successfully.",
        data: user,
      });
    } catch (error) {
      console.error("Error during user registration:", error);
      res.status(500).send("Internal server error");
    }
  };

  exports.createInfluencer = async (req, res) => {
    try {
      const { name, email, password } = req.body;
      console.log(req.body, "---- log 205 ----");
  
      // Check if user with email already exists
      const existingUser = await User.findOne({ email });
      if (existingUser) {
        return res.status(402).json({
          status: false,
          statuscode: 402,
          message: "User email already exists!",
        });
      }
  
      const newUser = new Influencer({
        name,
        email,
        password,
        verified: true,
      });
  
      // Save user to database
      await newUser.save();
  
      // Return success response
      return res.status(201).json({
        status: true,
        statuscode: 201,
        message: "User registered successfully.",
        data: newUser,
      });
    } catch (error) {
      if (error.code === 11000) {
        return res.status(400).json({
          status: false,
          message: 'Mobile number already exists',
        }) } else {
          return res.status(500).json({
            status: false,
            message: 'Something went wrong',
          })
    }
  };
  }