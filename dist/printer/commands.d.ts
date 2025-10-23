import { Buffer } from 'node:buffer';
export declare const LF = "\n";
export declare const FS = "\u001C";
export declare const FF = "\f";
export declare const GS = "\u001D";
export declare const DLE = "\u0010";
export declare const EOT = "\u0004";
export declare const NUL = "\0";
export declare const ESC = "\u001B";
export declare const TAB = "t";
export declare const EOL = "\n";
/**
 * [FEED_CONTROL_SEQUENCES Feed control sequences]
 * @type {object}
 */
export declare const FEED_CONTROL_SEQUENCES: {
    CTL_LF: string;
    CTL_GLF: string;
    CTL_FF: string;
    CTL_CR: string;
    CTL_HT: string;
    CTL_VT: string;
};
export declare const CHARACTER_SPACING: {
    CS_DEFAULT: string;
    CS_SET: string;
};
export declare const LINE_SPACING: {
    LS_DEFAULT: string;
    LS_SET: string;
};
/**
 * [HARDWARE Printer hardware]
 * @type {object}
 */
export declare const HARDWARE: {
    HW_INIT: string;
    HW_SELECT: string;
    HW_RESET: string;
};
/**
 * [CASH_DRAWER Cash Drawer]
 * @type {object}
 */
export declare const CASH_DRAWER: {
    CD_KICK_2: string;
    CD_KICK_5: string;
};
/**
 * [MARGINS Margins sizes]
 * @type {object}
 */
export declare const MARGINS: {
    BOTTOM: string;
    LEFT: string;
    RIGHT: string;
};
/**
 * [PAPER Paper]
 * @type {object}
 */
export declare const PAPER: {
    PAPER_FULL_CUT: string;
    PAPER_PART_CUT: string;
    PAPER_CUT_A: string;
    PAPER_CUT_B: string;
    STAR_FULL_CUT: string;
};
/**
 * [TEXT_FORMAT Text format]
 * @type {object}
 */
export declare const TEXT_FORMAT: {
    TXT_NORMAL: string;
    TXT_2HEIGHT: string;
    TXT_2WIDTH: string;
    TXT_4SQUARE: string;
    STAR_TXT_EMPHASIZED: string;
    STAR_CANCEL_TXT_EMPHASIZED: string;
    TXT_CUSTOM_SIZE(width: number, height: number): Buffer<ArrayBuffer>;
    TXT_HEIGHT: {
        1: string;
        2: string;
        3: string;
        4: string;
        5: string;
        6: string;
        7: string;
        8: string;
    };
    TXT_WIDTH: {
        1: string;
        2: string;
        3: string;
        4: string;
        5: string;
        6: string;
        7: string;
        8: string;
    };
    TXT_UNDERL_OFF: string;
    TXT_UNDERL_ON: string;
    TXT_UNDERL2_ON: string;
    TXT_BOLD_OFF: string;
    TXT_BOLD_ON: string;
    TXT_ITALIC_OFF: string;
    TXT_ITALIC_ON: string;
    TXT_FONT_A: string;
    TXT_FONT_B: string;
    TXT_FONT_C: string;
    TXT_ALIGN_LT: string;
    TXT_ALIGN_CT: string;
    TXT_ALIGN_RT: string;
    STAR_TXT_ALIGN_LA: string;
    STAR_TXT_ALIGN_CA: string;
    STAR_TXT_ALIGN_RA: string;
};
/**
 * Qsprinter-compatible
 * Added by Attawit Kittikrairit
 * [MODEL Model-specific commands]
 * @type {object}
 */
export declare const MODEL: {
    QSPRINTER: {
        BARCODE_MODE: {
            ON: string;
            OFF: string;
        };
        BARCODE_HEIGHT_DEFAULT: string;
        CODE2D_FORMAT: {
            PIXEL_SIZE: {
                CMD: string;
                MIN: number;
                MAX: number;
                DEFAULT: number;
            };
            VERSION: {
                CMD: string;
                MIN: number;
                MAX: number;
                DEFAULT: number;
            };
            LEVEL: {
                CMD: string;
                OPTIONS: {
                    L: number;
                    M: number;
                    Q: number;
                    H: number;
                };
            };
            LEN_OFFSET: number;
            SAVEBUF: {
                CMD_P1: string;
                CMD_P2: string;
            };
            PRINTBUF: {
                CMD_P1: string;
                CMD_P2: string;
            };
        };
    };
};
/**
 * [BARCODE_FORMAT Barcode format]
 * @type {object}
 */
export declare const BARCODE_FORMAT: {
    BARCODE_TXT_OFF: string;
    BARCODE_TXT_ABV: string;
    BARCODE_TXT_BLW: string;
    BARCODE_TXT_BTH: string;
    BARCODE_FONT_A: string;
    BARCODE_FONT_B: string;
    BARCODE_HEIGHT(height: number): Buffer<ArrayBuffer>;
    BARCODE_WIDTH: {
        1: string;
        2: string;
        3: string;
        4: string;
        5: string;
    };
    BARCODE_HEIGHT_DEFAULT: string;
    BARCODE_WIDTH_DEFAULT: string;
    BARCODE_UPC_A: string;
    BARCODE_UPC_E: string;
    BARCODE_EAN13: string;
    BARCODE_EAN8: string;
    BARCODE_CODE39: string;
    BARCODE_ITF: string;
    BARCODE_NW7: string;
    BARCODE_CODE93: string;
    BARCODE_CODE128: string;
};
/**
 * [CODE2D_FORMAT description]
 * @type {object}
 */
export declare const CODE2D_FORMAT: {
    TYPE_PDF417: string;
    TYPE_DATAMATRIX: string;
    TYPE_QR: string;
    CODE2D: string;
    QR_LEVEL_L: string;
    QR_LEVEL_M: string;
    QR_LEVEL_Q: string;
    QR_LEVEL_H: string;
};
/**
 * [IMAGE_FORMAT Image format]
 * @type {object}
 */
export declare const IMAGE_FORMAT: {
    S_RASTER_N: string;
    S_RASTER_2W: string;
    S_RASTER_2H: string;
    S_RASTER_Q: string;
};
/**
 * [BITMAP_FORMAT description]
 * @type {object}
 */
export declare const BITMAP_FORMAT: {
    BITMAP_S8: string;
    BITMAP_D8: string;
    BITMAP_S24: string;
    BITMAP_D24: string;
};
/**
 * [GSV0_FORMAT description]
 * @type {object}
 */
export declare const GSV0_FORMAT: {
    GSV0_NORMAL: string;
    GSV0_DW: string;
    GSV0_DH: string;
    GSV0_DWDH: string;
};
/**
 * [BEEP description]
 * @type {string}
 */
export declare const BEEP = "\u001BB";
/**
 * [COLOR description]
 * @type {object}
 */
export declare const COLOR: {
    0: string;
    1: string;
    REVERSE: string;
    UNREVERSE: string;
};
//# sourceMappingURL=commands.d.ts.map