declare module 'tesseract-wasm' {
  export class OCRClient {
    constructor();
    loadModel(url: string | ArrayBuffer | Uint8Array): Promise<void>;
    loadImage(image: HTMLImageElement | HTMLCanvasElement | OffscreenCanvas | ImageBitmap | ImageData | ArrayBuffer | Uint8Array): Promise<void>;
    getText(): Promise<string>;
    destroy(): void;
  }
}
