declare module 'upng-js' {
  export type DecodedPng = {
    width: number;
    height: number;
    depth: number;
    ctype: number;
    data: ArrayBuffer;
  };

  export function decode(buffer: ArrayBuffer): DecodedPng;
  export function toRGBA8(decoded: DecodedPng): ArrayBuffer[];
}
