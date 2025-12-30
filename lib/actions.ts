'use server'

import { headers } from "next/headers";
import { auth } from "@/lib/auth/auth";
import { SavedScene } from "@/database/schemas";
import { connectToDatabase } from "@/database/mongoose"
import { success } from "better-auth";
import mongoose from "mongoose";

export async function saveShader(scene: Scene, title: string, currentLoadedSceneID: string | null, description?: string, tags?: string[], publish: boolean | null = null) {
    try {

        const session = await auth.api.getSession({
            headers: await headers()
        });
        if (!session) return { success: false, error: "Authentication error. Please try signing in again." };

        await connectToDatabase();
        const savedScene = new SavedScene({ 
            scene: {
                files: scene.files,
                objects: scene.objects,
                cameraPosition: {
                    x: scene.cameraPosition.x,
                    y: scene.cameraPosition.y,
                    z: scene.cameraPosition.z
                },
                cameraDirection: {
                    x: scene.cameraDirection.x,
                    y: scene.cameraDirection.y,
                    z: scene.cameraDirection.z
                },
            },
            title,
            description,
            tags,
            authorEmail: session.user.email,
            authorName: session.user.name,
            authorImage: session.user.image,
            authorID: new mongoose.Types.ObjectId(session.user.id),
            public: publish
        });
        if (currentLoadedSceneID) {
            const existingScene = await SavedScene.findOne({ _id: currentLoadedSceneID, authorID: new mongoose.Types.ObjectId(session.user.id) });
            if (existingScene) {
                existingScene.scene = savedScene.scene;
                if (title && title.length > 0) {
                    existingScene.title = savedScene.title;
                }
                if (typeof description === "string" && description.length > 0) {
                    existingScene.description = savedScene.description;
                }
                if (Array.isArray(tags) && tags.length > 0) {
                    existingScene.tags = savedScene.tags;
                }
                if (publish !== null) {
                    existingScene.public = existingScene.public ? true : savedScene.public;
                }
                await existingScene.save();
                console.log("here");
                return { success: true }
            }
            else {
                return { success: false, error: `Unable to save scene with ID ${currentLoadedSceneID}.` }
            }
        }
        const titleExists = Boolean(await SavedScene.exists({ title, authorID: new mongoose.Types.ObjectId(session.user.id) }));
        if (titleExists) {
            return { success: false, error: "Title already used." };
        }
        await savedScene.save();
        return { success: true, id: savedScene._id.toString(), title: savedScene.title }
    }
    catch (e: unknown) {
        console.error(e);
        return { success: false };
    }
}

export async function deleteShader(id: string) {
    try {

        const session = await auth.api.getSession({
            headers: await headers()
        });
        if (!session) return { success: false, error: "Authentication error. Please try signing in again." };
        await connectToDatabase();

        const scene = await SavedScene.findOneAndDelete({
            _id: id,
            authorID: new mongoose.Types.ObjectId(session.user.id)
        });
        if (!scene) {
            return { success: false, error: "Unable to delete shader." };
        }
        return { success: true }
    }
    catch (e: unknown) {
        console.error(e);
        return { success: false };
    }
}