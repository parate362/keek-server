const { influencerverifyAndSignUpWithMobile, createInfluencer, loginInfluencer } = require('../Controller/influController')

module.exports = async(app, router) =>{
    router.post('/verify-and-signup-influencer', influencerverifyAndSignUpWithMobile)
    router.post('/register-email-influencer', createInfluencer)
    router.post('/login-email-influencer', loginInfluencer)


    app.use('/api/influencer', router)
}