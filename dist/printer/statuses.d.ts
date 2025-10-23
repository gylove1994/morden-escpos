declare enum Status {
    Ok = "ok",
    Warning = "warning",
    Error = "error"
}
interface StatusJSONElementSingle {
    bit: number;
    value: 0 | 1;
    label: string;
    status: Status;
}
interface StatusJSONElementMultiple {
    bit: string;
    value: string;
    label: string;
    status: Status;
}
type StatusJSONElement = StatusJSONElementSingle | StatusJSONElementMultiple;
interface StatusJSON<T extends string> {
    className: T;
    byte: number;
    bits: string;
    statuses: StatusJSONElement[];
}
export declare abstract class DeviceStatus {
    byte: number;
    bits: (0 | 1)[];
    bitsAsc: (0 | 1)[];
    constructor(byte: number);
    private getBits;
    protected toBaseJSON<T extends StatusClassName>(name: T): StatusJSON<T>;
}
export declare class PrinterStatus extends DeviceStatus {
    static commands(): string[];
    toJSON(): StatusJSON<"PrinterStatus">;
}
export declare class OfflineCauseStatus extends DeviceStatus {
    static commands(): string[];
    toJSON(): StatusJSON<"OfflineCauseStatus">;
}
export declare class ErrorCauseStatus extends DeviceStatus {
    static commands(): string[];
    toJSON(): StatusJSON<"ErrorCauseStatus">;
}
export declare class RollPaperSensorStatus extends DeviceStatus {
    static commands(): string[];
    toJSON(): StatusJSON<"RollPaperSensorStatus">;
}
export declare const statusClasses: {
    PrinterStatus: typeof PrinterStatus;
    OfflineCauseStatus: typeof OfflineCauseStatus;
    ErrorCauseStatus: typeof ErrorCauseStatus;
    RollPaperSensorStatus: typeof RollPaperSensorStatus;
};
export type Statuses = typeof statusClasses;
export type StatusClassName = keyof Statuses;
export interface StatusClassConstructor<T extends DeviceStatus> {
    new (byte: number): T;
    commands: () => string[];
}
export {};
//# sourceMappingURL=statuses.d.ts.map