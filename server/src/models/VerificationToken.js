import mongoose from "mongoose";

const Schema = mongoose.Schema;

const verificationTokenSchema = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "user",
      required: true,
    },
    token: {
      type: String,
      required: true,
    },
  },
  { timestamps: true }
);

export default mongoose.model("verificationToken", verificationTokenSchema);
