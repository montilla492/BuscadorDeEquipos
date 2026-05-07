import { initializeApp } from "firebase/app";
import { getFirestore, collection, addDoc, serverTimestamp } from "firebase/firestore";
import firebaseConfig from "../firebase-applet-config.json";
import { SquadStatus, Vibe } from "../src/types";

const app = initializeApp(firebaseConfig);
const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);

async function seed() {
  console.log("Seeding squads...");
  const squads = [
    {
      leaderId: "system",
      gameId: "valorant",
      title: "Ranked Grind - Plat+",
      description: "Looking for serious entry fragger.",
      rankLimit: "Platinum+",
      vibe: Vibe.COMPETITIVE,
      maxMembers: 5,
      memberIds: ["system", "player2"],
      members: [
        { uid: "system", displayName: "LeaderPro", role: "Duelist", status: "ready" },
        { uid: "player2", displayName: "NoobSlayer", role: "Sentinel", status: "ready" }
      ],
      status: SquadStatus.SEARCHING,
      createdAt: serverTimestamp()
    },
    {
      leaderId: "system2",
      gameId: "lol",
      title: "ARAM & Chill",
      description: "Zero toxicity allowed. Just fun.",
      rankLimit: "Any Rank",
      vibe: Vibe.CHILL,
      maxMembers: 5,
      memberIds: ["system2"],
      members: [
        { uid: "system2", displayName: "ChillMaster", role: "Any", status: "ready" }
      ],
      status: SquadStatus.SEARCHING,
      createdAt: serverTimestamp()
    }
  ];

  for (const squad of squads) {
    await addDoc(collection(db, "squads"), squad);
  }
  console.log("Seeding complete.");
  process.exit(0);
}

seed().catch(err => {
  console.error(err);
  process.exit(1);
});
