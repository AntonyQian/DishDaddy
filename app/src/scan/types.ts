/** A photo taken during a Scan, kept on the device until the Scan is reviewed. */
export interface CapturedPhoto {
  uri: string;
  width: number;
  height: number;
  /** Which prompt it was taken under (shelf, door, drawer…). */
  spot: string;
}
