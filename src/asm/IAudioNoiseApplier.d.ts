interface IAudioNoiseApplier {
    _noise_to_frequency(ptr:number, length:number,  h0:number, h1:number, h2:number, h3:number):void
    _noise_to_time_domain(ptr:number, length:number,  h0:number, h1:number, h2:number, h3:number):void
    _noise_to_byte_frequency(ptr:number, length:number, min:number, max:number, h0:number, h1:number, h2:number, h3:number):void
    _noise_to_byte_time_domain(ptr:number, length:number, h0:number, h1:number, h2:number, h3:number):void
}

declare function audioNoiseApplier(stdlib:Window, ffi:any, heap:ArrayBuffer):IAudioNoiseApplier
