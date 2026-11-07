import { isAndroid } from "../utils/nativeApp";

export const localAlignmentAvailable = () => !isAndroid() || import.meta.env.VITE_ANDROID_ALIGNMENT === "experimental";
export const ANDROID_ALIGNMENT_MESSAGE = "Voice timing is still being tested for Android. You can use manual and waveform timing here.";
