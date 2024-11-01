import mongoose, { Schema } from "mongoose";

const emailVerficationSchem = new Schema({
  userId: String,
  token: String,
  createdAt: Date,
  expiresAt: Date,
});

const Verfication = mongoose.model("Verfication", emailVerficationSchem);

export default Verfication;
