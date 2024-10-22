import { NextResponse } from "next/server";
import { exec } from "child_process";
import path from "path";

export async function POST(req: Request) {
  const { array, g, n } = await req.json();
  if (!array || !g || !n) {
    return NextResponse.json({ error: "Missing required parameters" }, { status: 400 });
  }

  const scriptPath = path.join(process.cwd(), "scripts", "phe.py");
  const command = `python3 ${scriptPath} encrypt "${array}" "${g}" "${n}"`;
  return new Promise(resolve => {
    exec(command, (error, stdout, stderr) => {
      if (error) {
        console.error(`exec error: ${error}`);
        resolve(NextResponse.json({ error: "Error executing Python script" }, { status: 500 }));
      } else if (stderr) {
        console.error(`stderr: ${stderr}`);
        resolve(NextResponse.json({ error: "Error in Python script" }, { status: 500 }));
      } else {
        resolve(NextResponse.json({ encryptedArray: stdout.trim() }));
      }
    });
  });
}
