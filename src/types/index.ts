export enum SquadStatus {
  SEARCHING = "searching",
  IN_GAME = "in-game",
  CLOSED = "closed",
}

export enum Vibe {
  COMPETITIVE = "competitive",
  CHILL = "chill",
}

export interface GameProfile {
  rank: string;
  role: string;
  vibe: Vibe;
  availability: {
    from: string;
    to: string;
  };
}

export interface UserProfile {
  uid: string;
  displayName: string;
  photoURL: string;
  reputation: number;
  bio?: string;
  games: Record<string, GameProfile>;
  createdAt: string;
  updatedAt: string;
}

export interface SquadMember {
  uid: string;
  displayName: string;
  photoURL?: string;
  role: string;
  status: "ready" | "not-ready";
}

export interface Squad {
  id: string;
  leaderId: string;
  gameId: string;
  title: string;
  description: string;
  rankLimit: string;
  vibe: Vibe;
  maxMembers: number;
  memberIds: string[];
  members: SquadMember[];
  status: SquadStatus;
  createdAt: string;
}

export interface Message {
  id: string;
  squadId: string;
  senderId: string;
  senderName: string;
  senderPhoto: string;
  text: string;
  createdAt: any;
}

export interface Invitation {
  id: string;
  squadId: string;
  fromId: string;
  toId: string;
  type: "invite" | "request";
  status: "pending" | "accepted" | "rejected";
  createdAt: string;
}
