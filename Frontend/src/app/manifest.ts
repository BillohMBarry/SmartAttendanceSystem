import type { MetadataRoute } from "next";
export default function manifest(): MetadataRoute.Manifest {
    return {
        name: "Smart Attendance System",
        short_name: "CMDA-SL Attendance",
        description: "A smart attendance system for CMDA-SL workplace.",
        start_url: "/",
        display: "standalone",
        background_color: "#3a0ae4ff",
        theme_color: "#ffffffff",
        icons: [
            {
                src: "/favicon.png",
                sizes: "192x192",
                type: "image/png",
            },
        ],
    }
}