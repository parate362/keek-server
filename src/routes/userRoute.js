const { createUser, signin, SendOTPToMobile, verifyAndSignUpWithMobile, verifyOTP, sendOtp, verifyEmail, resetemailPassword, resetmobilePassword } = require('../Controller/userController')


module.exports = async(app, router) =>{

router.post('/register-email', createUser)
router.post('/send-email-otp', sendOtp);
router.post('/verify-email-otp', verifyEmail)
router.post('/signin-email', signin)

// // Registration through Mobile
router.post('/send-mobile-otp', SendOTPToMobile)
router.post('/verify-and-signup', verifyAndSignUpWithMobile)
router.post('/verify-otp', verifyOTP)
router.post('/reset-email-password', resetemailPassword)
router.post('/reset-mobile-password', resetmobilePassword)

    app.use('/api/user', router)
}