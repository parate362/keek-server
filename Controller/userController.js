const express = require("express");
const bcrypt = require("bcryptjs");
const User = require("../model/User");
const VerificationToken = require("../model/verificationToken");
const { sendError } = require("../utils/helper");
const jwt = require("jsonwebtoken");
require("dotenv").config();
const {
    generateOTP,
    mailTransport,
  } = require("../utils/mail");
 const twilio = require("twilio");
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


  exports.SendOTPToMobile = async (req, res) => {
    const otp = generateOTP(); // Function to generate OTP
    const hash = await bcrypt.hash(otp, 8);
  
    try {
      const phone = Number(req.body.mobileNumber);
  
      // Send OTP via Twilio
      const sendOtp = await client.messages.create({
        body: `Your OTP for Keek is ${otp}`,
        to: `+91${phone}`, // Adjust country code as needed
        from: process.env.TWILIO_PHONE_NUMBER, // Your Twilio phone number
      });
  
      if (sendOtp) {
        // Save OTP and hash to database
        const verificationToken = new VerificationToken({
          mobile: phone,
          token: otp,
        });
        await verificationToken.save();
  
        return res.status(201).json({
          status: true,
          statuscode: 201,
          message: "OTP sent successfully",
        });
      } else {
        return res.status(422).json({
          status: false,
          statuscode: 422,
          message: "Something went wrong while sending OTP",
        });
      }
    } catch (error) {
      console.error("Error sending OTP:", error);
      return res.status(500).json({
        status: false,
        statuscode: 500,
        message: "Internal server error",
      });
    }
  };

  exports.verifyAndSignUpWithMobile = async (req, res) => {
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
        user = new User({
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

  exports.verifyOTP = async (req, res) => {
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
        }
    
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


  exports.sendOtp = async (req, res) => {
    const { email } = req.body;
  
    const otp = generateOTP();
    const hash = await bcrypt.hash(otp, 8);
  
    const mailOptions = {
      from: "your-email@gmail.com",
      to: email,
      subject: "Your OTP",
      text: `Your OTP is ${otp}`,
    };
  
    mailTransport().sendMail(mailOptions, async (error, info) => {
      if (error) {
        return res.status(500).json({ error: "Failed to send OTP" });
      } else {
        const verificationToken = new VerificationToken({
          email: email,
          token: otp,
        });
        await verificationToken.save();
        res.status(200).send({ message: "OTP sent" });
      }
    });
  };


  exports.createUser = async (req, res) => {
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
  
      const newUser = new User({
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
   

  exports.signin = async (req, res) => {
    const { email, password } = req.body;
    console.log(req.body);
    if (!email.trim() || !password.trim())
      return sendError(res, "email/password is missing!");
  
    const user = await User.findOne({ email });
    if (!user) return sendError(res, "User not found!");
  
    const isMatched = await user.comparePassword(password);
    if (!isMatched) return sendError(res, "email/password does not matched");
  
    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, {
      expiresIn: "1d",
    });
  
    res.json({
      success: true,
      user: { name: user.name, email: user.email, id: user._id, token },
    });
  };
  


  exports.verifyEmail = async (req, res) => {
    const { contactInfo, otp } = req.body;
  
    try {
      const { email, otp } = req.body;
    
      // Verify OTP
      const verificationToken = await VerificationToken.findOne({
        email: email,
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
      let user = await User.findOne({ email: email });
  
      // If user exists but not verified, mark as verified
      if (user) {
        user.verified = true;
      
      }
  
      // Delete the verification token after successful verification
      await VerificationToken.deleteOne({ email: email });
  
      // Return success response
      return res.status(201).json({
        status: true,
        statuscode: 201,
        message: "User verified and registered successfully.",
        data: user,
      });
    } catch (error) {
      res.status(500).json({ error: "Internal Server Error" });
    }
    mailTransport().sendMail({
      from: "emailverification@gmail.com",
      to: email,
      subject: "Wekcome To Keek",
      html: "<h1>Email Verified Successfully</h1>",
    });
  };

 

  exports.resetmobilePassword = async (req, res) => {
    const { password, confirmPassword, mobileNumber } = req.body;
    try {
      if (password !== confirmPassword) {
        return res.status(400).send('Passwords do not match');
      }
  
      if (!mobileNumber) {
        return res.status(400).send('Mobile number is required');
      }
  
      const user = await User.findOne({ mobile: mobileNumber });
      if (!user) {
        return res.status(400).send('User not found');
      }
  
      const hashedPassword = await bcrypt.hash(password, 10);
      user.$set({ password: hashedPassword, otp: undefined, otpExpires: undefined });
  
      await user.save();
      res.send('Your password has been successfully reset. Please log in with your new credentials.');
    } catch (error) {
      console.error(error);
      res.status(500).send('An error occurred while resetting your password. Please try again later.');
    }
  };

  exports.resetemailPassword = async (req, res) => {
    const { password, confirmPassword, mobileNumber } = req.body;
    try {
      if (password !== confirmPassword) {
        return res.status(400).send('Passwords do not match');
      }
  
      if (!mobileNumber) {
        return res.status(400).send('emailr is required');
      }
  
      const user = await User.findOne({ email: mobileNumber });
      if (!user) {
        return res.status(400).send('User not found');
      }
  
      const hashedPassword = await bcrypt.hash(password, 2);
      user.$set({ password: hashedPassword, otp: undefined, otpExpires: undefined });
  
      await user.save();
      res.send('Your password has been successfully reset. Please log in with your new credentials.');
    } catch (error) {
      console.error(error);
      res.status(500).send('An error occurred while resetting your password. Please try again later.');
    }
  };