import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({})

export async function getEmbeddings(text: string) {
    try {
        if (text.length === 0) return

        const response = await ai.models.embedContent({
            model: "gemini-embedding-exp-03-07",
            contents: text.replace(/\n/g, " "),
            config: {
                outputDimensionality: 1536,
            }
        })

        const embeddings = response.embeddings?.[0]
        if (!embeddings) throw new Error("No embeddings returned")
        
        return embeddings.values
    } catch (error) {
        console.log("Error calling embedding api", error)
        throw error
    }
}