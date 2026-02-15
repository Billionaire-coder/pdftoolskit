import { serve } from "inngest/next";
import { inngest } from "@/lib/inngest/client";
import { generatePdf } from "@/lib/inngest/functions";

// Create an API that serves zero-downtime functions
export const { GET, POST, PUT } = serve({
    client: inngest,
    functions: [
        generatePdf,
    ],
});
