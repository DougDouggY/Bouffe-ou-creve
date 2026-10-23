// Anonymous Cloudflare profile: credentials remain private and never enter room broadcasts.
const KEY = "bouffe-online-profile-v1";
export function createOnlineProfileClient(server, onProfile) {
  let credentials = null,
    pending = null,
    lastState = null;
  function readCredentials() {
    try {
      return JSON.parse(localStorage.getItem(KEY));
    } catch {
      return null;
    }
  }
  function valid(value) {
    return (
      /^[a-f0-9-]{36}$/.test(value?.profileId || "") &&
      /^[a-f0-9]{64}$/.test(value?.profileToken || "")
    );
  }
  async function request(path, body) {
    const response = await fetch(server + path, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(10000),
    });
    const data = await response.json();
    if (!response.ok)
      throw Error(data.message || "Profil multijoueur indisponible.");
    return data;
  }
  async function load() {
    const saved = credentials || readCredentials();
    let received;
    if (valid(saved)) {
      credentials = saved;
      received = await request("/api/profile/state", credentials);
    } else {
      const created = await request("/api/profile", {});
      credentials = {
        profileId: created.profileId,
        profileToken: created.profileToken,
      };
      received = created.state;
      try {
        localStorage.setItem(KEY, JSON.stringify(credentials));
      } catch {}
    }
    if (
      !lastState ||
      lastState.profileId !== received.profileId ||
      received.revision >= lastState.revision
    ) {
      lastState = received;
      onProfile(lastState, { notify: false });
    }
    return credentials;
  }
  return {
    ensure() {
      return (pending ||= (
        navigator.locks ? navigator.locks.request(KEY, load) : load()
      ).finally(() => {
        pending = null;
      }));
    },
    async refresh() {
      if (!credentials && !valid(readCredentials())) return;
      return this.ensure();
    },
    accept(state, options = { notify: true }) {
      if (
        !credentials ||
        state?.profileId !== credentials.profileId ||
        (lastState &&
          lastState.profileId === state.profileId &&
          state.revision < lastState.revision)
      )
        return;
      lastState = state;
      onProfile(state, options);
    },
  };
}
