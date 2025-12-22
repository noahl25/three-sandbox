import mongoose from "mongoose";

const sceneSchema = new mongoose.Schema({

});

export const Scene = mongoose.models.sceneSchema || mongoose.model("Scene", sceneSchema);