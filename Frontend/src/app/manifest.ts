import type { MetadataRoute } from "next";
export default function manifest(): MetadataRoute.Manifest {
    return {
        name: "Smart Attendance System",
        short_name: "SAS",
        description: "A smart attendance system for CMDA-SL workplace.",
        start_url: "/",
        display: "standalone",
        background_color: "#ffffff",
        theme_color: "#000000",
        icons: [
            {
                src: "/favicon.png",
                sizes: "192x192",
                type: "image/png",
            },
        ],
    }
}