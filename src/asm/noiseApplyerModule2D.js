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
function noiseApplyerModule2D (stdlib, ffi, heap) {
    var metaView = new stdlib.Int32Array(heap, 0, 10)
    var resultView = new stdlib.Uint8Array(heap, 40, 1);
    var data = new stdlib.Uint8Array(heap, 41);

    function getHashVal(n) {
        if (n >= 96) {
            return metaView[3] & (1 << (n - 96));
        } else if (n >= 64) {
            return metaView[2] & (1 << (n - 64));
        } else if (n >= 32) {
            return metaView[1] & (1 << (n - 32));
        } else {
            return metaView[0] & (1 << n);
        }
    }

    function apply() {
        var sx = metaView[4];
        var sy = metaView[5];
        var w = metaView[6];
        var h = metaView[7];
        var orig_w = metaView[8];
        var orig_h = metaView[9];

        var iy_min = Math.max(-sx, 0);
        var iy_max = Math.min(orig_h - sy, h);

        var ix_min = Math.max(-sy, 0);
        var ix_max = Math.min(orig_w - sx, w)

        resultView[0] = 0;

        for (var iy = iy_min; iy < iy_max; iy++) {
            for (var ix = ix_min; ix < ix_max; ix++) {
                var n = (iy * w + ix) << 2;

                var dx_a = ix !== ix_min ? data[n - 4] - data[n] : 0;
                var dx_b = ix !== ix_max - 1 ? data[n + 4] - data[n] : 0;
                var dx = dx_a + dx_b;


                var dy_a = iy !== iy_min ? data[n - w * 4] - data[n] : 0;
                var dy_b = iy !== iy_max - 1 ? data[n + w * 4] - data[n] : 0;
                var dy = dy_a + dy_b;

                var pos = (ix - sx) + (iy - sy) * w;

                var bit = getHashVal(pos & 127);

                if (dx === 0 && dy === 0) {
                    continue;
                }

                resultView[0]++;

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

    return {
        a: apply
    }
}
