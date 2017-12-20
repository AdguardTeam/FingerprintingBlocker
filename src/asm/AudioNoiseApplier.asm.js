var audioNoiseApplier = function(global, env, buffer) {
 "use asm";
 var a = new global.Int8Array(buffer);
 var d = new global.Uint8Array(buffer);
 var g = new global.Float32Array(buffer);
 var R = global.Math.imul;
 function ca(b, c, e, f, g, h) {
  b = b | 0;
  c = c | 0;
  e = e | 0;
  f = f | 0;
  g = g | 0;
  h = h | 0;
  var i = 0, j = 0, k = 0, l = 0, m = 0;
  if ((c | 0) > 0) l = 0; else return;
  do {
   j = l << 1 & 126;
   do if (j >>> 0 <= 95) {
    if (j >>> 0 > 63) {
     i = 1 << j + -64 & g;
     break;
    }
    if (j >>> 0 > 31) {
     i = 1 << j + -32 & f;
     break;
    } else {
     i = 1 << j & e;
     break;
    }
   } else i = 1 << j + -96 & h; while (0);
   k = (i | 0) != 0;
   i = j | 1;
   do if (i >>> 0 <= 95) {
    if (i >>> 0 > 63) {
     i = 1 << i + -64 & g;
     break;
    }
    if (i >>> 0 > 31) {
     i = 1 << i + -32 & f;
     break;
    } else {
     i = 1 << i & e;
     break;
    }
   } else i = 1 << i + -96 & h; while (0);
   if (k ^ (i | 0) != 0) {
    j = b + l | 0;
    i = d[j >> 0] | 0;
    m = (R(R(i + -128 | 0, i) | 0, i | -256) | 0) / 16777216 | 0;
    a[j >> 0] = (k ? m : 0 - m | 0) + i;
   }
   l = l + 1 | 0;
  } while ((l | 0) != (c | 0));
  return;
 }
 function aa(a, b, c, d, e, f) {
  a = a | 0;
  b = b | 0;
  c = c | 0;
  d = d | 0;
  e = e | 0;
  f = f | 0;
  var h = 0, i = 0, j = 0, k = 0, l = 0.0, m = 0.0;
  if ((b | 0) > 0) k = 0; else return;
  do {
   i = k << 1 & 126;
   do if (i >>> 0 <= 95) {
    if (i >>> 0 > 63) {
     h = 1 << i + -64 & e;
     break;
    }
    if (i >>> 0 > 31) {
     h = 1 << i + -32 & d;
     break;
    } else {
     h = 1 << i & c;
     break;
    }
   } else h = 1 << i + -96 & f; while (0);
   j = (h | 0) != 0;
   h = i | 1;
   do if (h >>> 0 <= 95) {
    if (h >>> 0 > 63) {
     h = 1 << h + -64 & e;
     break;
    }
    if (h >>> 0 > 31) {
     h = 1 << h + -32 & d;
     break;
    } else {
     h = 1 << h & c;
     break;
    }
   } else h = 1 << h + -96 & f; while (0);
   if (j ^ (h | 0) != 0) {
    i = a + (k << 2) | 0;
    m = +g[i >> 2];
    l = (m + 1.0) * m * (m + -1.0) * .0009765625;
    g[i >> 2] = m + (j ? l : -l);
   }
   k = k + 1 | 0;
  } while ((k | 0) != (b | 0));
  return;
 }
 function ba(b, c, e, f, g, h, i, j) {
  b = b | 0;
  c = c | 0;
  e = e | 0;
  f = f | 0;
  g = g | 0;
  h = h | 0;
  i = i | 0;
  j = j | 0;
  var k = 0, l = 0;
  if ((c | 0) > 0) l = 0; else return;
  do {
   f = l << 1 & 126;
   do if (f >>> 0 <= 95) {
    if (f >>> 0 > 63) {
     e = 1 << f + -64 & i;
     break;
    }
    if (f >>> 0 > 31) {
     e = 1 << f + -32 & h;
     break;
    } else {
     e = 1 << f & g;
     break;
    }
   } else e = 1 << f + -96 & j; while (0);
   k = (e | 0) != 0;
   e = f | 1;
   do if (e >>> 0 <= 95) {
    if (e >>> 0 > 63) {
     e = 1 << e + -64 & i;
     break;
    }
    if (e >>> 0 > 31) {
     e = 1 << e + -32 & h;
     break;
    } else {
     e = 1 << e & g;
     break;
    }
   } else e = 1 << e + -96 & j; while (0);
   if (k ^ (e | 0) != 0) {
    f = b + l | 0;
    a[f >> 0] = (d[f >> 0] | 0) + (k ? 1 : 255);
   }
   l = l + 1 | 0;
  } while ((l | 0) != (c | 0));
  return;
 }
 function $(a, b, c, d, e, f) {
  a = a | 0;
  b = b | 0;
  c = c | 0;
  d = d | 0;
  e = e | 0;
  f = f | 0;
  var h = 0, i = 0, j = 0, k = 0, l = 0;
  if ((b | 0) > 0) k = 0; else return;
  do {
   i = k << 1 & 126;
   do if (i >>> 0 <= 95) {
    if (i >>> 0 > 63) {
     h = 1 << i + -64 & e;
     break;
    }
    if (i >>> 0 > 31) {
     h = 1 << i + -32 & d;
     break;
    } else {
     h = 1 << i & c;
     break;
    }
   } else h = 1 << i + -96 & f; while (0);
   j = (h | 0) != 0;
   h = i | 1;
   do if (h >>> 0 <= 95) {
    if (h >>> 0 > 63) {
     h = 1 << h + -64 & e;
     break;
    }
    if (h >>> 0 > 31) {
     h = 1 << h + -32 & d;
     break;
    } else {
     h = 1 << h & c;
     break;
    }
   } else h = 1 << h + -96 & f; while (0);
   if (j ^ (h | 0) != 0 ? (l = a + (k << 2) | 0, j) : 0) g[l >> 2] = +g[l >> 2] + 0.0;
   k = k + 1 | 0;
  } while ((k | 0) != (b | 0));
  return;
 }
 return {
  _noise_to_frequency: $,
  _noise_to_byte_time_domain: ca,
  _noise_to_byte_frequency: ba,
  _noise_to_time_domain: aa
 };
}