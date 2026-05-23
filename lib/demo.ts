import { cookies } from "next/headers";

export const demoProfile = {
  id: "demo-user-ranveer",
  full_name: "Ranveer Gautam",
  selected_name: "Ranveer",
  selected_part: "First name",
  provider: "Demo bypass"
};

export const demoRooms = [
  {
    id: "demo-ranveer-room",
    display_name: "Ranveer",
    status: "active",
    created_at: new Date().toISOString()
  },
  {
    id: "demo-sakshi-room",
    display_name: "Sakshi",
    status: "waiting",
    created_at: new Date(Date.now() - 86400000).toISOString()
  }
];

export const demoMessages = [
  {
    id: 1,
    room_id: "demo-ranveer-room",
    sender_id: "demo-match-ranveer",
    body: "Same first name, zero extra details. This is the whole magic.",
    created_at: new Date(Date.now() - 1000 * 60 * 8).toISOString()
  },
  {
    id: 2,
    room_id: "demo-ranveer-room",
    sender_id: demoProfile.id,
    body: "Perfect. I wanted to see the app flow before setting up Google OAuth.",
    created_at: new Date(Date.now() - 1000 * 60 * 5).toISOString()
  },
  {
    id: 3,
    room_id: "demo-ranveer-room",
    sender_id: "demo-match-ranveer",
    body: "Then keep roaming. Home, matches, chats, profile are all open in demo mode.",
    created_at: new Date(Date.now() - 1000 * 60 * 2).toISOString()
  }
];

export function isDemoBypassEnabled() {
  return process.env.NAMER_DEV_BYPASS === "true";
}

export async function isDemoSession() {
  if (!isDemoBypassEnabled()) return false;
  return (await cookies()).get("namer_demo")?.value === "1";
}
