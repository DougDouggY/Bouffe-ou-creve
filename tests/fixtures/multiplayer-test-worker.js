// Test-only fixture: production wrangler.jsonc never references this module.
import worker, {
  PrivateRoom as ProductionRoom,
} from "../../cloudflare/src/worker.js";
import { checkpoint, snapshot } from "../../multiplayer-simulation.js";
import { XA as World } from "../../simulation-core.js";
export class PrivateRoom extends ProductionRoom {
  fetch(request) {
    if (new URL(request.url).pathname === "/__test__/end")
      return this.serial(async () => {
        const game = this.room.game;
        for (const person of game.people) {
          person.alive = false;
          World.remove(game.engine.world, person.body);
        }
        game.phase = "ended";
        game.outcome = "draw";
        this.room.data.phase = "ended";
        this.room.data.readyAt = Date.now();
        this.room.data.checkpoint = checkpoint(game);
        this.room.replay = null;
        await this.persist();
        this.broadcast({ type: "state", state: snapshot(game) });
        this.publish();
        return new Response("ok");
      });
    return super.fetch(request);
  }
}
export default {
  fetch(request, env, ctx) {
    const path = new URL(request.url).pathname;
    if (path.startsWith("/__test__/end/"))
      return env.ROOMS.get(
        env.ROOMS.idFromName("room:" + path.split("/").at(-1)),
      ).fetch("https://internal/__test__/end");
    return worker.fetch(request, env, ctx);
  },
};
