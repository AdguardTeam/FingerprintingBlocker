/**
 * @fileoverview Just a stub
 */
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

void noise_to_frequency(float *data, int length, long h0, long h1, long h2, long h3) {
    for (int i = 0; i < length; i++) {
        _Bool bit1 = get_salt(2 * i, h0, h1, h2, h3);
        _Bool bit2 = get_salt(2 * i + 1, h0, h1, h2, h3);
        if (bit1 == bit2) { continue; }
        float value = data[i];
        if (bit1 == 1) {
            data[i] = value + (1 / 128);
        } else {
            data[i] = value - (1 / 128);
        }
    }
}

float get_delta_for_time_domain(float amplitude) {
    return amplitude * (amplitude - 1) * (amplitude + 1) / 1024;
}

void noise_to_time_domain(float *data, int length, long h0, long h1, long h2, long h3) {
    for (int i = 0; i < length; i++) {
        _Bool bit1 = get_salt(2 * i, h0, h1, h2, h3);
        _Bool bit2 = get_salt(2 * i + 1, h0, h1, h2, h3);

        if (bit1 == bit2) { continue; }

        float value = data[i];
        if (bit1 == 1) {
            data[i] = value + get_delta_for_time_domain(value);
        } else {
            data[i] = value - get_delta_for_time_domain(value);
        }
    }
}

void noise_to_byte_frequency(unsigned char *data, int length, int min, int max, long h0, long h1, long h2, long h3) {
    for (int i = 0; i < length; i++) {
        _Bool bit1 = get_salt(2 * i, h0, h1, h2, h3);
        _Bool bit2 = get_salt(2 * i + 1, h0, h1, h2, h3);
        if (bit1 == bit2) { continue; }

        unsigned char value = data[i];
        if (bit1 == 1) {
            data[i] = value + 1;
        } else {
            data[i] = value - 1;
        }
    }
}

char get_delta(unsigned char amplitude) {
    int amp = amplitude;
    return amp * (amp - 128) * (amp - 256) / (1024 * 128 * 128);
}

void noise_to_byte_time_domain(unsigned char *data, int length, long h0, long h1, long h2, long h3) {
    for (int i = 0; i < length; i++) {
        _Bool bit1 = get_salt(2 * i, h0, h1, h2, h3);
        _Bool bit2 = get_salt(2 * i + 1, h0, h1, h2, h3);

        if (bit1 == bit2) { continue; }

        unsigned char value = data[i];

        if (bit1 == 1) {
            data[i] = value + get_delta(value);
        } else {
            data[i] = value - get_delta(value);
        }
    }
}
