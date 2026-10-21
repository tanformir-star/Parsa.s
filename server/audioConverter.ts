import { Mp3Encoder } from '@breezystack/lamejs';

/**
 * Converts a 16-bit PCM or standard RIFF WAV buffer into a real MP3 Buffer using lamejs.
 */
export function wavOrPcmToMp3(
  audioBuffer: Buffer,
  sampleRate = 24000,
  channels = 1,
  bitrate = 128
): Buffer {
  let pcmData = audioBuffer;
  let detectedSampleRate = sampleRate;
  let detectedChannels = channels;

  // Check if buffer starts with 'RIFF' header
  if (
    audioBuffer.length > 44 &&
    audioBuffer.toString('ascii', 0, 4) === 'RIFF' &&
    audioBuffer.toString('ascii', 8, 12) === 'WAVE'
  ) {
    // Read WAV header details
    detectedChannels = audioBuffer.readUInt16LE(22);
    detectedSampleRate = audioBuffer.readUInt32LE(24);
    const bitsPerSample = audioBuffer.readUInt16LE(34);

    // Locate data chunk
    let offset = 12;
    let dataOffset = 44;
    let dataLength = audioBuffer.length - 44;

    while (offset < audioBuffer.length - 8) {
      const chunkId = audioBuffer.toString('ascii', offset, offset + 4);
      const chunkSize = audioBuffer.readUInt32LE(offset + 4);
      if (chunkId === 'data') {
        dataOffset = offset + 8;
        dataLength = chunkSize;
        break;
      }
      offset += 8 + chunkSize;
    }

    pcmData = audioBuffer.subarray(dataOffset, dataOffset + dataLength);
  }

  // Convert raw bytes to Int16Array
  const samples = new Int16Array(
    pcmData.buffer,
    pcmData.byteOffset,
    Math.floor(pcmData.byteLength / 2)
  );

  const mp3encoder = new Mp3Encoder(
    detectedChannels,
    detectedSampleRate,
    bitrate
  );
  const mp3Chunks: Buffer[] = [];
  const sampleBlockSize = 1152;

  if (detectedChannels === 1) {
    for (let i = 0; i < samples.length; i += sampleBlockSize) {
      const sampleChunk = samples.subarray(i, i + sampleBlockSize);
      const mp3buf = mp3encoder.encodeBuffer(sampleChunk);
      if (mp3buf.length > 0) {
        mp3Chunks.push(Buffer.from(mp3buf.buffer, mp3buf.byteOffset, mp3buf.length));
      }
    }
  } else {
    // Stereo: de-interleave
    const left = new Int16Array(samples.length / 2);
    const right = new Int16Array(samples.length / 2);
    for (let i = 0; i < samples.length; i += 2) {
      left[i / 2] = samples[i];
      right[i / 2] = samples[i + 1];
    }
    for (let i = 0; i < left.length; i += sampleBlockSize) {
      const leftChunk = left.subarray(i, i + sampleBlockSize);
      const rightChunk = right.subarray(i, i + sampleBlockSize);
      const mp3buf = mp3encoder.encodeBuffer(leftChunk, rightChunk);
      if (mp3buf.length > 0) {
        mp3Chunks.push(Buffer.from(mp3buf.buffer, mp3buf.byteOffset, mp3buf.length));
      }
    }
  }

  const endBuf = mp3encoder.flush();
  if (endBuf.length > 0) {
    mp3Chunks.push(Buffer.from(endBuf.buffer, endBuf.byteOffset, endBuf.length));
  }

  return Buffer.concat(mp3Chunks);
}

/**
 * Checks if a buffer is already an MP3 stream (ID3 header or sync frame 0xFF)
 */
export function isMp3Buffer(buf: Buffer): boolean {
  if (buf.length < 4) return false;
  // ID3 tag
  if (buf[0] === 0x49 && buf[1] === 0x44 && buf[2] === 0x33) return true;
  // MPEG Audio Frame Sync: starts with 0xFF followed by 0xFB, 0xF3, 0xF2, 0xFA
  if (buf[0] === 0xff && (buf[1] & 0xe0) === 0xe0) return true;
  return false;
}
