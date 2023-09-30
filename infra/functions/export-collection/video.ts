import { exec as execCallback } from "child_process";
import { promisify } from "util";
import * as ffmpegStatic from "ffmpeg-static";
const exec = promisify(execCallback);

export async function encode(input: string, output: string) {
  const command = [
    ffmpegStatic.default,
    "-y",
    "-framerate",
    "1",
    "-i",
    input,
    "-c:v",
    "libx264",
    "-crf",
    "23",
    "-preset",
    "fast",
    "-tune",
    "stillimage",
    "-g",
    "1",
    "-profile:v",
    "baseline",
    "-pix_fmt",
    "yuv420p",
    "-sws_flags",
    "spline+accurate_rnd+full_chroma_int",
    "-vf",
    "colorspace=bt709:iall=bt601-6-625:fast=1",
    "-color_range",
    "1",
    "-colorspace",
    "1",
    "-color_primaries",
    "1",
    "-color_trc",
    "1",
    "-movflags",
    "faststart",
    output,
  ].join(" ");
  console.log(command);
  const { stdout, stderr } = await exec(command);
  // if (stdout) {
  //   console.log(stdout);
  // }
  // if (stderr) {
  //   console.error(stderr);
  // }
}

export async function concat(inputs: string[], output: string) {
  const command = [
    ffmpegStatic.default,
    "-y",
    "-i",
    `"concat:${inputs.join("|")}"`,
    "-c",
    "copy",
    output,
  ].join(" ");
  console.log(command);
  const { stdout, stderr } = await exec(command);
  // if (stdout) {
  //   console.log(stdout);
  // }
  // if (stderr) {
  //   console.error(stderr);
  // }
}
