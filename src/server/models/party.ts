export interface Party {
  id: string;
  hostId: string;
  partyName: string;
  members: Record<string, boolean>;
  createdAt: number;
}
