import type { NdArray } from 'ndarray';
export type ImageMimeType = 'image/png' | 'image/jpg' | 'image/jpeg' | 'image/gif' | 'image/bmp';
/**
 * [Image description]
 * @param {[type]} pixels [description]
 */
export default class Image {
    private readonly pixels;
    private readonly data;
    constructor(pixels: NdArray<Uint8Array>);
    private get size();
    /**
     * [toBitmap description]
     * @param  {[type]} density [description]
     * @return {[type]}         [description]
     */
    toBitmap(density?: number): {
        data: number[][];
        density: number;
    };
    /**
     * [toRaster description]
     * @return {[type]} [description]
     */
    toRaster(): {
        data: number[];
        width: number;
        height: number | undefined;
    };
    /**
     * Load image from URL
     * @param  {[string]}   url      [description]
     * @param  {[type]}   type     [description]
     * @return {[Promise<Image>]}            [description]
     */
    static load(url: string, type?: ImageMimeType | null): Promise<Image>;
}
//# sourceMappingURL=image.d.ts.map