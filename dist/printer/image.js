"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const get_pixels_1 = __importDefault(require("get-pixels"));
/**
 * [Image description]
 * @param {[type]} pixels [description]
 */
class Image {
    pixels;
    data = [];
    constructor(pixels) {
        this.pixels = pixels;
        const rgbaData = [];
        for (let i = 0; i < this.pixels.data.length; i += this.size.colors) { // todo: fix this
            rgbaData.push(
            // todo: fix this
            Array.from({ length: this.size.colors }).fill(0).map((_, b) => this.pixels.data[i + b]));
        }
        this.data = rgbaData.map(
        // todo: fix this
        ([r, g, b, a]) => a !== 0 && r > 200 && g > 200 && b > 200);
    }
    get size() {
        return {
            width: this.pixels.shape[0],
            height: this.pixels.shape[1],
            colors: this.pixels.shape[2],
        };
    }
    /**
     * [toBitmap description]
     * @param  {[type]} density [description]
     * @return {[type]}         [description]
     */
    toBitmap(density = 24) {
        const result = [];
        let x, y, b, l, i;
        const c = density / 8;
        // n blocks of lines
        const n = Math.ceil(this.size.height / density);
        for (y = 0; y < n; y++) {
            // line data
            const ld = result[y] = [];
            for (x = 0; x < this.size.width; x++) {
                for (b = 0; b < density; b++) {
                    i = x * c + (b >> 3);
                    if (ld[i] === undefined)
                        ld[i] = 0;
                    l = y * density + b;
                    // todo: fix this
                    if (l < this.size.height) {
                        if (this.data[l * this.size.width + x]) {
                            ld[i] += (0x80 >> (b & 0x7));
                        }
                    }
                    // todo: fix this end
                }
            }
        }
        return {
            data: result,
            density,
        };
    }
    ;
    /**
     * [toRaster description]
     * @return {[type]} [description]
     */
    toRaster() {
        const result = [];
        const { width, height } = this.size;
        // n blocks of lines // todo: fix this
        const n = Math.ceil(width / 8);
        // todo: fix this
        for (let y = 0; y < height; y++) {
            for (let x = 0; x < n; x++) {
                for (let b = 0; b < 8; b++) {
                    const i = x * 8 + b;
                    if (result[y * n + x] === undefined) {
                        result[y * n + x] = 0;
                    }
                    const c = x * 8 + b;
                    // todo: fix this
                    if (c < width) {
                        if (this.data[y * width + i]) {
                            result[y * n + x] += (0x80 >> (b & 0x7));
                        }
                    }
                    // todo: fix this end
                }
            }
        }
        return {
            data: result,
            width: n,
            height,
        };
    }
    /**
     * Load image from URL
     * @param  {[string]}   url      [description]
     * @param  {[type]}   type     [description]
     * @return {[Promise<Image>]}            [description]
     */
    static load(url, type = null) {
        return new Promise((resolve, reject) => {
            (0, get_pixels_1.default)(url, type ?? '', (error, pixels) => {
                if (error)
                    reject(error);
                else
                    resolve(new Image(pixels));
            });
        });
    }
}
exports.default = Image;
;
//# sourceMappingURL=image.js.map