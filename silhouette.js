let markers = new Uint32Array(0),
  queue = new Uint32Array(0);
export function extractSilhouette(e, g) {
  const [o, u, E, A] = g,
    n = document.createElement("canvas");
  ((n.width = E - o), (n.height = A - u));
  const i = n.getContext("2d", { willReadFrequently: !0 });
  i.drawImage(e, o, u, n.width, n.height, 0, 0, n.width, n.height);
  const I = i.getImageData(0, 0, n.width, n.height),
    C = I.data,
    Q = n.width,
    B = n.height,
    k = Q * B;
  if (markers.length < k) {
    markers = new Uint32Array(k);
    queue = new Uint32Array(k);
  }
  const t = markers,
    a = queue;
  t.fill(0, 0, k);
  let s = 0,
    r = 0,
    d = 0;
  for (let M = 0; M < k; M++) {
    if (t[M] || C[M * 4 + 3] <= 40) continue;
    const S = ++s;
    let v = 0,
      f = 1;
    for (a[0] = M, t[M] = S; v < f;) {
      const l = a[v++],
        R = l % Q,
        h = Math.floor(l / Q);
      let c;
      if (R > 0) {
        c = l - 1;
        if (!t[c] && C[c * 4 + 3] > 40) {
          t[c] = S;
          a[f++] = c;
        }
      }
      if (R < Q - 1) {
        c = l + 1;
        if (!t[c] && C[c * 4 + 3] > 40) {
          t[c] = S;
          a[f++] = c;
        }
      }
      if (h > 0) {
        c = l - Q;
        if (!t[c] && C[c * 4 + 3] > 40) {
          t[c] = S;
          a[f++] = c;
        }
      }
      if (h < B - 1) {
        c = l + Q;
        if (!t[c] && C[c * 4 + 3] > 40) {
          t[c] = S;
          a[f++] = c;
        }
      }
    }
    f > d && ((r = S), (d = f));
  }
  for (let M = 0; M < k; M++) {
    if (t[M] === r) continue;
    let S = !1;
    if (C[M * 4 + 3] <= 40 && C[M * 4 + 3] > 0) {
      const v = M % Q,
        f = Math.floor(M / Q);
      for (let l = -2; l <= 2 && !S; l++)
        for (let R = -2; R <= 2; R++)
          if (
            v + R >= 0 &&
            v + R < Q &&
            f + l >= 0 &&
            f + l < B &&
            t[M + l * Q + R] === r
          ) {
            S = !0;
            break;
          }
    }
    S || (C[M * 4 + 3] = 0);
  }
  return (i.putImageData(I, 0, 0), n);
}
