const fs = require('fs');
const readline = require('readline');

async function processLineByLine() {
  const fileStream = fs.createReadStream('/Users/brianburds/.gemini/antigravity/brain/66aac963-7f4a-4497-b8a7-f6dcf04d0a8f/.system_generated/logs/transcript.jsonl');

  const rl = readline.createInterface({
    input: fileStream,
    crlfDelay: Infinity
  });

  for await (const line of rl) {
    if (line.includes('ResourceBoard.jsx') && line.includes('import')) {
      const parsed = JSON.parse(line);
      // We are looking for VIEW_FILE or REPLACE_FILE or WRITE_TO_FILE
      if (parsed.content && parsed.content.includes('import React')) {
        console.log("FOUND AT STEP:", parsed.step_index);
        fs.appendFileSync('old_resource_board.txt', `\n--- STEP ${parsed.step_index} ---\n`);
        fs.appendFileSync('old_resource_board.txt', parsed.content + '\n');
      }
    }
  }
}

processLineByLine();
