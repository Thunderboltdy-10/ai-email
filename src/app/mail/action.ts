"use server"
import {streamText} from "ai"
import {google} from "@ai-sdk/google"
import {createStreamableValue} from "ai/rsc"

export async function generateEmail(context: string, prompt: string) {
    const stream = createStreamableValue("");
    (
        async () => {
            const {textStream} = streamText({
                model: google("gemini-2.5-flash"),
                onError({error}) {
                    console.error(error)
                },
                prompt: `
                    You are an AI email assistant in the user’s email client. Your sole output must be the complete body of the email, written in the user’s voice.

                    CURRENT TIME: ${new Date().toLocaleString()}

                    === EMAIL CONTEXT ===
                    ${context}
                    === END CONTEXT ===

                    === INSTRUCTION ===
                    ${prompt}
                    === END INSTRUCTION ===

                    REQUIREMENTS:
                    1. Output **only** the email body—no subject line, no commentary, no questions, no apologies.
                    2. Write clearly and professionally, matching the tone and style in the context.
                    3. If the context lacks specific details (recipient’s name, topic, etc.), **invent plausible details** (e.g. “Dear Professor Smith,” “In our May 10th meeting,” etc.) so the email is complete.
                    4. Do not ask the user for more information—just fill in any gaps yourself.
                    5. Do not invent facts about context—only generic placeholders or plausible details (e.g., course names, dates).
                `,
            })

            for await (const token of textStream) {
                stream.update(token)
            }

            stream.done()
        }
    )()
    return {output: stream.value}
}

export async function generate(input: string) {
    console.log(input)
    const stream = createStreamableValue("");
    (
        async () => {
            const {textStream} = streamText({
                model: google("gemini-2.5-flash"),
                onError({error}) {
                    console.error(error)
                },
                prompt: `
                    ALWAYS RESPOND IN PLAIN TEXT, no HTML or Markdown.
                    You are an AI autocomplete assistant embedded in an email client, like Gmail’s Smart Compose.
                    Your style is expert, friendly, concise, and consistent with the user’s existing tone.

                    I am writing an email. Here is what I’ve typed so far:
                    <input>${input}</input>

                    INSTRUCTIONS:
                    1. **Only output the appended text**—do **not** repeat or paraphrase any part of the input.
                    2. Complete the user’s train of thought in **one or two sentences**:
                    - If the input ends mid‑sentence, finish that sentence exactly where it left off.
                    - If the input ends at a complete sentence, append an additional sentence to round out the idea if you want.
                    3. Do **not** start a new paragraph or add line breaks. Your text will be **directly concatenated** to the input.
                    4. Keep it short, sweet, and relevant—no fluff, apologies, or meta commentary.
                    5. Match tone, formality, and style already present.
                    6. Invent any missing details (names, dates) as needed for coherence.

                    Your output here (just the new text to append):
                    `,
                })

            for await (const token of textStream) {
                stream.update(token)
            }

            stream.done()
        }
    )()
    return {output: stream.value}
}