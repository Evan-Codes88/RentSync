import mongoose from "mongoose";

const inspectionSchema = new mongoose.Schema({
    group: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'Group', 
        required: true 
    },
    propertyaddress: {
        type: String,
        required: true
    },
    time: {
        type: String,
        required: true
    },
    assignedTo: {
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'User'
    },
    attendees: [{
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'User'
    }],
    createdBy: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'User', 
        required: true 
    },
    createdAt: { 
        type: Date, 
        default: Date.now 
    },
});

export default mongoose.model("Inspection", inspectionSchema);