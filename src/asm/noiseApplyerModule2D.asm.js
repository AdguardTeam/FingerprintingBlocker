var noiseApplyerModule2D = function(global, env, buffer) {
 "use asm";
 var a = new global.Int8Array(buffer);
 var d = new global.Uint8Array(buffer);
 var R = global.Math.imul;
 function $(b, c, e, f, g, h, i, j, k, l, m) {
  b = b | 0;
  c = c | 0;
  e = e | 0;
  f = f | 0;
  g = g | 0;
  h = h | 0;
  i = i | 0;
  j = j | 0;
  k = k | 0;
  l = l | 0;
  m = m | 0;
  var n = 0, o = 0, p = 0, q = 0, r = 0, s = 0, t = 0, u = 0, v = 0, w = 0, x = 0, y = 0, z = 0, A = 0, B = 0, C = 0, D = 0, E = 0, F = 0, G = 0, H = 0, I = 0, J = 0;
  J = 0 - e | 0;
  J = (J | 0) > 0 ? J : 0;
  D = i - e | 0;
  D = (D | 0) > (g | 0) ? g : D;
  C = 0 - c | 0;
  C = (C | 0) > 0 ? C : 0;
  B = h - c | 0;
  B = (B | 0) > (f | 0) ? f : B;
  if (!((J | 0) < (D | 0) & (C | 0) <= (B | 0))) {
   l = 0;
   return l | 0;
  }
  F = (C | 0) < (B | 0);
  G = B + -1 | 0;
  H = D + -1 | 0;
  I = f << 2;
  E = J;
  g = 0;
  do {
   if (F) {
    x = R(E, f) | 0;
    y = (E | 0) == (J | 0);
    z = (E | 0) == (H | 0);
    A = (R(E + e | 0, h) | 0) + c | 0;
    w = C;
    do {
     i = w + x << 2;
     u = (w | 0) == (G | 0);
     v = A + w << 2;
     a : do if ((w | 0) == (C | 0)) {
      t = 0;
      while (1) {
       s = b + i | 0;
       r = a[s >> 0] | 0;
       b : do switch (r << 24 >> 24) {
       case 0:
       case -1:
        break;
       default:
        {
         if (u) q = 0; else q = (d[b + (i + 4) >> 0] | 0) - (r & 255) | 0;
         if (y) n = 0; else n = (d[b + (i - I) >> 0] | 0) - (r & 255) | 0;
         if (z) o = 0; else o = (d[b + (i + I) >> 0] | 0) - (r & 255) | 0;
         p = o + n | 0;
         n = t + v & 127;
         do if (n >>> 0 <= 95) {
          if (n >>> 0 > 63) {
           n = 1 << n + -64 & l;
           break;
          }
          if (n >>> 0 > 31) {
           n = 1 << n + -32 & k;
           break;
          } else {
           n = 1 << n & j;
           break;
          }
         } else n = 1 << n + -96 & m; while (0);
         n = (n | 0) != 0;
         if (p | q) {
          g = g + 1 | 0;
          if ((q | 0) > 0) {
           a[s >> 0] = (r & 255) + (n & 1);
           break b;
          }
          if ((q | 0) < 0) {
           a[s >> 0] = (r & 255) - (n & 1);
           break b;
          }
          o = n & 1;
          n = r & 255;
          if ((p | 0) > 0) {
           a[s >> 0] = n + o;
           break b;
          } else {
           a[s >> 0] = n - o;
           break b;
          }
         }
        }
       } while (0);
       t = t + 1 | 0;
       if ((t | 0) == 4) break a; else i = i + 1 | 0;
      }
     } else {
      s = 0;
      while (1) {
       r = b + i | 0;
       n = a[r >> 0] | 0;
       c : do switch (n << 24 >> 24) {
       case 0:
       case -1:
        break;
       default:
        {
         q = n & 255;
         if (u) n = 0; else n = (d[b + (i + 4) >> 0] | 0) - q | 0;
         p = n + ((d[b + (i + -4) >> 0] | 0) - q) | 0;
         if (y) n = 0; else n = (d[b + (i - I) >> 0] | 0) - q | 0;
         if (z) o = 0; else o = (d[b + (i + I) >> 0] | 0) - q | 0;
         o = o + n | 0;
         n = s + v & 127;
         do if (n >>> 0 <= 95) {
          if (n >>> 0 > 63) {
           n = 1 << n + -64 & l;
           break;
          }
          if (n >>> 0 > 31) {
           n = 1 << n + -32 & k;
           break;
          } else {
           n = 1 << n & j;
           break;
          }
         } else n = 1 << n + -96 & m; while (0);
         n = (n | 0) != 0;
         if (o | p) {
          g = g + 1 | 0;
          if ((p | 0) > 0) {
           a[r >> 0] = q + (n & 1);
           break c;
          }
          if ((p | 0) < 0) {
           a[r >> 0] = q - (n & 1);
           break c;
          }
          n = n & 1;
          if ((o | 0) > 0) {
           a[r >> 0] = q + n;
           break c;
          } else {
           a[r >> 0] = q - n;
           break c;
          }
         }
        }
       } while (0);
       s = s + 1 | 0;
       if ((s | 0) == 4) break a; else i = i + 1 | 0;
      }
     } while (0);
     w = w + 1 | 0;
    } while ((w | 0) < (B | 0));
   }
   E = E + 1 | 0;
  } while ((E | 0) < (D | 0));
  return g | 0;
 }
 return {
  _apply_noise: $
 };
}