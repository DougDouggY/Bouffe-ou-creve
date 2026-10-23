import { applyProfileGrant } from "./trophy-rules.js";
import { onlineProfile } from "../../multiplayer-trophy-catalog.js?v=trophies-32";
import { RoomError } from "./room.js";
export const validProfileId = (id) =>
  typeof id === "string" && /^[a-f0-9-]{36}$/.test(id);
export const validProfileToken = (token) =>
  typeof token === "string" && /^[a-f0-9]{64}$/.test(token);
export async function profileRequest(storage, action, body) {
  if (action === "create") {
    if (
      !validProfileId(body.profileId) ||
      !validProfileToken(body.profileToken)
    )
      throw new RoomError("PROFILE", "Profil invalide.");
    if (await storage.get("player"))
      throw new RoomError("PROFILE", "Ce profil existe déjà.", 409);
    const state = onlineProfile({ profileId: body.profileId });
    await storage.put({ player: { token: body.profileToken, state } });
    return state;
  }
  const player = await storage.get("player");
  if (!player)
    throw new RoomError("PROFILE", "Profil multijoueur introuvable.", 401);
  if (action === "state") {
    if (body.profileToken !== player.token)
      throw new RoomError("PROFILE", "Profil multijoueur invalide.", 401);
    return player.state;
  }
  if (action === "apply") {
    if (
      body.profileId !== player.state.profileId ||
      typeof body.key !== "string" ||
      body.key.length > 220
    )
      throw new RoomError("PROFILE", "Événement invalide.");
    return storage.transaction(async (txn) => {
      const receipt = "receipt:" + body.key;
      const current = await txn.get("player");
      if (await txn.get(receipt)) return current.state;
      current.state = applyProfileGrant(current.state, body);
      await txn.put({ player: current, [receipt]: Date.now() });
      return current.state;
    });
  }
  throw new RoomError("PROFILE", "Action de profil inconnue.");
}
