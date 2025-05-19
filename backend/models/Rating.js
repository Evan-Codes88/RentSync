import mongoose from "mongoose";

const ratingSchema = new mongoose.Schema({
    inspection: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'Inspection', 
        required: true 
    },
    user: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'User', 
        required: true 
    },
    rating: { 
        type: Number, 
        required: true,
        min: 1, 
        max: 5 
    },
    comment: { 
        type: String 
    },
    createdAt: { 
        type: Date, 
        default: Date.now 
    },
});

export default mongoose.model("Rating", ratingSchema);