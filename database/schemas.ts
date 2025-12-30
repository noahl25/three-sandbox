import { maxLength, minLength } from "better-auth";
import mongoose, { Schema } from "mongoose";

const vector3Schema = new mongoose.Schema(
    {
        x: { type: Number, required: true },
        y: { type: Number, required: true },
        z: { type: Number, required: true },
    },
    { _id: false }
);

const object3DSchema = new mongoose.Schema({
        vertexShader: { type: String, required: true, maxLength: 100 },
        fragmentShader: { type: String, required: true, maxLength: 100 },
        objectType: {
            type: String,
            required: true,
            enum: ["cube", "sphere", "plane", "cone", "torus", "cylinder"],
        },
        position: { type: vector3Schema, required: true },
        rotation: { type: vector3Schema, required: true },
        scale: { type: vector3Schema, required: true },
        wireframe: { type: Boolean, default: false },
        subdivisions: { type: Number, required: true },
        uuid: { type: String, required: true, maxLength: 50 },
        culling: { type: Number, required: true },
        // config: {
        //     type: mongoose.Schema.Types.Mixed,
        //     default: {},
        // },
    },
    { _id: false }
);

const sceneSchema = new mongoose.Schema({
    files: {
        type: Map,
        of: String,
        validate: {
            validator: (v: Map<string, string>) => {
                if (v.values().toArray().length > 100) return false;
                for (const value of v.values()) {
                    if (value.length > 10000) return false;
                }
                return true;
            }
        },
        default: {},
    },
    objects: {
        type: [object3DSchema],
        default: [],
    },
    cameraPosition: {
        type: vector3Schema,
        required: true,
    },
    cameraDirection: {
        type: vector3Schema,
        required: true,
    },
    },
    { _id: false }
);

const savedSceneSchema = new mongoose.Schema({
    scene: sceneSchema,
    title: {
        type: String,
        minLength: 1,
        maxLength: 35,
        required: true
    },
    description: {
        type: String,
        maxLength: 500
    },
    tags: {
        type: [String],
        default: [],
        validate: {
            validator: (v: string[]) => {
                if (v.length > 10) return false;
                for (const value of v) {
                    if (value.length > 100) return false;
                }
                return true;
            }
        },
    },
    authorEmail: {
        type: String,
        required: true,
        maxLength: 100
    },
    authorName: {
        type: String,
        required: true,
        maxLength: 100
    },
    public: {
        type: Boolean,
        default: false
    },
    authorID: {
        type: Schema.Types.ObjectId,
        ref: "User",
        required: true,
        index: true
    },
    authorImage: {
        type: String,
        maxLength: 250
    }
}, {
    timestamps: { createdAt: 'createdOn', updatedAt: 'updatedOn' }
});



export const SavedScene = mongoose.models.SavedScene || mongoose.model("SavedScene", savedSceneSchema);