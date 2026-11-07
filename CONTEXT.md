# Rhymepage

Rhymepage is a lyric-writing workspace that keeps notes, playback, and timing data together for a songwriter's own material.

## Lyric timing

**Lyric sync**:
The timing data that connects a lyric note's lines, and optionally its words, to a backing track.
_Avoid_: karaoke data, caption track

**Alignment pass**:
A local, post-recording process that proposes lyric-sync timestamps by matching a user's vocal guide to the canonical lyric note.
_Avoid_: AI sync, live transcription

**Vocal guide**:
A temporary microphone recording of the songwriter speaking or singing their lyric along with a backing track.
_Avoid_: performance recording, source audio

**Local alignment model**:
The optional speech-recognition model downloaded only after a songwriter starts browser-local alignment; browser storage may cache it for later opted-in uses.
_Avoid_: background AI download, account model

**Canonical lyrics**:
The saved text of a lyric note that an alignment pass attempts to time; deviations in a vocal guide are reviewed rather than written back as lyric changes.
_Avoid_: transcript, generated lyrics
