/**
 * A simple image noise applyer.
 *
 * Heap structure -
 * 0  - 15: hash
 * 16 - 19: x
 * 20 - 23: y
 * 24 - 27: width
 * 28 - 31: height
 * 32 - 35: origWidth
 * 36 - 39: origHeight
 * 40     : result
 * 41 -   : data
 * 
 * @todo convert it to asm.js.
 */
function noiseApplyerModule2D_plainJs (stdlib, ffi, heap) {
    var data = new stdlib.Uint8Array(heap);
    
    function apply_noise(_, sx, sy, w, h, orig_w, orig_h, h0, h1, h2, h3) {
        var iy_min = (-sy > 0) ? -sy : 0;
        var iy_max = (orig_h - sy < h) ? orig_h - sy : h;

        var ix_min = (-sx > 0) ? -sx : 0;
        var ix_max = (orig_w - sx < w) ? orig_w - sx : w;

        var counter = 0;

        if (iy_min > iy_max || ix_min > ix_max) {
            return;
        }

        for (var iy = iy_min; iy < iy_max; iy++) {
            for (var ix = ix_min; ix < ix_max; ix++) {
                for(var i = 0, n = (iy * w + ix) << 2; i < 4; i++, n++) {
                    if (data[n] === 255 || data[n] === 0) { continue; }
                    var dx_a = ix !== ix_min ? data[n - 4] - data[n] : 0;
                    var dx_b = ix !== ix_max - 1 ? data[n + 4] - data[n] : 0;
                    var dx = dx_a + dx_b;

                    var dy_a = iy !== iy_min ? data[n - w * 4] - data[n] : 0;
                    var dy_b = iy !== iy_max - 1 ? data[n + w * 4] - data[n] : 0;
                    var dy = dy_a + dy_b;

                    var pos = ((ix + sx) + (iy + sy) * orig_w) * 4 + i;

                    var bit;
                    var r = pos & 127;
                    // Inline function for fair comparison
                    if (r >= 96) {
                        bit = h3 & (1 << (r - 96));
                    } else if (r >= 64) {
                        bit = h2 & (1 << (r - 64));
                    } else if (r >= 32) {
                        bit = h1 & (1 << (r - 32));
                    } else {
                        bit = h0 & (1 << r);
                    }

                    if (dx === 0 && dy === 0) {
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

    return {
        _apply_noise: apply_noise
    }
}