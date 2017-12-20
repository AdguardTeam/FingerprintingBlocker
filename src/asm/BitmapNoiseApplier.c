/**
 * Current noise algorithm is simple:
 *  - We apply noise for each color value for each pixels.
 *  - if the number forms an arithmetic progression between color value of adjacent pixels
 *    in both horizontal and vertical direction, we omit modifying the pixel.
 *    This is to prevent adding noise to blank canvas.
 */
int max(int a, int b) {
    if (a > b) {
        return a;
    } else {
        return b;
    }
}

int min(int a, int b) {
    if (a > b) {
        return b;
    } else {
        return a;
    }
}

_Bool get_salt(long pos, long h0, long h1, long h2, long h3) {
    char res = pos & 127;
    if (res >= 96) {
        return h3 & (1 << (res - 96));
    } else if (res >= 64) {
        return h2 & (1 << (res - 64));
    } else if (res >= 32) {
        return h1 & (1 << (res - 32));
    } else {
        return h0 & (1 << res);
    }
}

int apply_noise(unsigned char *data, int x, int y, int w, int h, int orig_w, int orig_h, long h0, long h1, long h2, long h3) {
    int iy_min = max(-y, 0);
    int iy_max = min(orig_h - y, h);
    int ix_min = max(-x, 0);
    int ix_max = min(orig_w - x, w);

    int counter = 0;

    if (iy_min <= iy_max && ix_min <= ix_max) {
        for (int iy = iy_min; iy < iy_max; iy++) {
            for (int ix = ix_min; ix < ix_max; ix++) {
                long n = (iy * w + ix) << 2;
                for (char i = 0; i < 4; n++, i++) {
                    if (data[n] == 255 || data[n] == 0) { continue; }
                    int dx_a = ix != ix_min ? data[n - 4] - data[n] : 0;
                    int dx_b = ix != ix_max - 1 ? data[n + 4] - data[n] : 0;
                    int dx = dx_a + dx_b;

                    int dy_a = iy != iy_min ? data[n - (w << 2)] - data[n] : 0;
                    int dy_b = iy != iy_max - 1 ? data[n + (w << 2)] - data[n] : 0;
                    int dy = dy_a + dy_b;

                    long pos = ((ix + x + (iy + y) * orig_w) << 2) + i;

                    _Bool bit = get_salt(pos, h0, h1, h2, h3);

                    if (dx == 0 && dy == 0) {
                        continue;
                    }

                    counter++;

                    if (dx > 0) {
                        data[n] += bit;
                    } else if (dx < 0) {
                        data[n] -= bit;
                    } else if (dy > 0) {
                        data[n] += bit;
                    } else {
                        data[n] -= bit;
                    }
                }
            }
        }
    }

    return counter;
}
