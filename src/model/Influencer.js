const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const InfluencerSchema = new mongoose.Schema({
  name: {
    type: String,
  },
  email: {
    type: String,
   
    
  },
  mobile: { type: String,
     default: ''
     },
  password: {
    type: String,
    // required: true,
  },
  verified: {
    type: Boolean,
    default: false,
    // required: true,
  },
});

InfluencerSchema.pre("save", async function (next) {
  if (this.isModified("password")) {
    const hash = await bcrypt.hash(this.password, 8);
    this.password = hash;
  }
  next();
});

InfluencerSchema.methods.comparePassword = async function (password) {
  const result = await bcrypt.compareSync(password, this.password);
  return result;
};

module.exports = mongoose.model("Influencer", InfluencerSchema);
