interface IBitmapNoiseApplier {
    /**
     * Apply noise to a canvas imageData.
     * @param x x-coord in which `data` is extracted from
     * @param y y-coord in which `data` is extracted from
     * @param w width of `data`
     * @param h height of `data`
     * @param orig_w width of a data from which `data` is extracted
     * @param orig_h height of a data from which `data` is extracted
     * @param h0-h3 hash
     * @return A number of modified pixels (that is, at most 4 for each pixels).
     */
    _apply_noise(ptr:number, x:number, y:number, w:number, h:number, orig_w:number, orig_h:number, h0:number, h1:number, h2:number, h3:number):number
}

declare function bitmapNoiseApplier(stdlib:Window, ffi:any, heap:ArrayBuffer):IBitmapNoiseApplier
