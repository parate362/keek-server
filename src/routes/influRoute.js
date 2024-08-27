const { influencerverifyAndSignUpWithMobile, createInfluencer } = require('../Controller/influController')

module.exports = async(app, router) =>{
    router.post('/verify-and-signup-influencer', influencerverifyAndSignUpWithMobile)
    router.post('/register-email-influencer', createInfluencer)


    app.use('/api/influencer', router)
}