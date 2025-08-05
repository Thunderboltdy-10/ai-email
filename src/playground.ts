import {create, insert, search, type AnyOrama} from "@orama/orama"
import { OramaClient } from "./lib/orama"
import { turndown } from "./lib/turndown"
import { getEmbeddings } from "./lib/embedding"
import { pushNotification } from "./lib/aurinko"
import { authoriseAccountAccess } from "./server/api/routers/account"
import { Account } from "./lib/account"
import axios from "axios"
import { db } from "./server/db"
import { api } from "./trpc/react"


// const orama = new OramaClient("132090")
// await orama.initialize()

// // const emails = await db.email.findMany({
// //     select: {
// //         subject: true,
// //         body: true,
// //         from: true,
// //         to: true,
// //         sentAt: true,
// //         threadId: true,
// //         bodySnippet: true,
// //     }
// // })

// // await Promise.all(emails.map(async (email) => {
// //     const body = turndown.turndown(email.body ?? email.bodySnippet ?? "")
// //     const embeddings = await getEmbeddings(body)
// //     console.log(embeddings?.length)

// //     await orama.insert({
// //         subject: email.subject,
// //         body: body,
// //         rawBody: email.bodySnippet ?? "",
// //         from: email.from.address,
// //         to: email.to.map(to => to.address),
// //         sentAt: email.sentAt.toLocaleString(),
// //         threadId: email.threadId,
// //         embeddings
// //     })
// // }))
// // await orama.saveIndex()

// const searchResult = await orama.vectorSearch({
//     term: "Neon"
// })

// console.log(searchResult.hits)
// // for (const hit of searchResult.hits) {
// //     console.log(hit.document.subject)
// // }

// console.log(pushNotification("A9zk2qhzntlhZZN-i5OGV3yWJMhFZkHZS8O5hHdpsBQ"))

// const account = new Account("A9zk2qhzntlhZZN-i5OGV3yWJMhFZkHZS8O5hHdpsBQ")

// const accessToken = await db.account.findUnique({
//         where: {
//             id: "132090"
//         },
//         select: {
//             accessToken: true
//         }
//     })

// console.log(accessToken?.accessToken)

// import { db } from "@/server/db"
// import axios from "axios"

// async function getDeleteDeltaToken(accessToken: string) {
//   try {
//     const response = await axios.post("https://api.aurinko.io/v1/email/sync", {}, {
//       headers: {
//         Authorization: `Bearer ${accessToken}`
//       },
//       params: {
//         daysWithin: 1,
//         bodyType: "html"
//       }
//     })

//     const sync = response.data

//     if (!sync.ready) {
//       console.log("Sync is not ready yet. Please retry later.")
//       return
//     }

//     const deleteDeltaToken = sync.syncDeletedToken

//     if (!deleteDeltaToken) {
//       console.log("No deleteDeltaToken returned")
//       return
//     }

//     const updated = await db.account.update({
//       where: { accessToken },
//       data: { deleteDeltaToken }
//     })

//     console.log("Updated account:", updated.id, "with deleteDeltaToken:", deleteDeltaToken)
//   } catch (error) {
//     if (axios.isAxiosError(error)) {
//       console.error("Error:", error.response?.data || error.message)
//     } else {
//       console.error("Unexpected error:", error)
//     }
//   }
// }

// // Replace this with a real accessToken from your DB
// getDeleteDeltaToken("A9zk2qhzntlhZZN-i5OGV3yWJMhFZkHZS8O5hHdpsBQ")

// const CLIENT_ID   = process.env.AURINKO_CLIENT_ID!;
// const BASE_URL    = process.env.NEXT_PUBLIC_URL!;
// const ACCOUNT_ID  = "132090";  // ← replace with the accountId you want to re-auth

// if (!CLIENT_ID || !BASE_URL) {
//   console.error("⚠️  Please set AURINKO_CLIENT_ID and NEXT_PUBLIC_URL");
//   process.exit(1);
// }

// // 2️⃣  Build the query params for /authorizeUser
// const params = new URLSearchParams({
//   clientId:     CLIENT_ID,
//   serviceType:  "Google",
//   scopes: 'Mail.All',
//   responseType: "code",            // you want a `code` returned for exchange
//   accountRole:  "primary",         // re-auth this primary account
//   accountId:    ACCOUNT_ID,        // the existing account you already have in your DB
//   returnUrl:    `${BASE_URL}/api/aurinko/callback`,
//   ensureScopes:"true",
//   ensureAccess:"true"
// });

// // 3️⃣  Compose the full Authorize URL
// const authUrl = `https://api.aurinko.io/v1/auth/authorize?${params.toString()}`;

// console.log("\n🚀  Open this URL to re-authorize:");
// console.log(authUrl, "\n");

// async function main() {
//   const orphanThreads = await db.thread.findMany({
//     where: {
//       emails: { none: {} },
//     },
//   });

//   console.log('Orphan threads:', orphanThreads);

//   for (const thread of orphanThreads) {
//     await db.thread.delete({
//       where: { id: thread.id },
//     });
//     console.log(`Deleted thread ${thread.id}`);
//   }
// }

// main().catch(console.error);
