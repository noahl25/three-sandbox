import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/database/mongoose";
import { SavedScene } from "@/database/schemas";
import { auth } from "@/lib/auth/auth";

export async function GET(req: NextRequest) {

    try {        
        const params = req.nextUrl.searchParams;
        await connectToDatabase();
        const scene = await SavedScene.findById(params.get("id")).lean();
        if (!scene) return NextResponse.json({ error: "Not found" }, { status: 404 });
        scene.createdOn = scene.createdOn?.toLocaleString("en-CA").split(",")[0];
        scene.updatedOn = scene.updatedOn?.toLocaleString("en-CA").split(",")[0];
        return NextResponse.json(scene);
    } 
    catch (err) {
        console.error(err);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }

}
