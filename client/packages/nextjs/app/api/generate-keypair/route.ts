import { NextResponse } from "next/server";
import { exec } from "child_process";
import path from "path";

export async function GET() {
  const scriptPath = path.join(process.cwd(), "scripts", "phe.py");
  console.log(scriptPath);
  const command = `python3 ${scriptPath} generate_keypair`;

  return new Promise(resolve => {
    exec(command, (error, stdout, stderr) => {
      if (error) {
        console.error(`exec error: ${error}`);
        resolve(NextResponse.json({ error: "Error executing Python script" }, { status: 500 }));
      } else if (stderr) {
        console.error(`stderr: ${stderr}`);
        resolve(NextResponse.json({ error: "Error in Python script" }, { status: 500 }));
      } else {
        const [phi, g, n] = stdout.trim().slice(1, -1).split("|");
        resolve(NextResponse.json({ phi, g, n }));
      }
    });
  });
}
