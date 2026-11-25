const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const scripts = path.resolve('assets/scripts');
fs.copyFileSync(path.join(__dirname, 'PMMobileSimulatorQA.ts'), path.join(scripts, 'PMMobileSimulatorQA.ts'));
const game = path.join(scripts, 'PMGame.ts');
const source = fs.readFileSync(game, 'utf8');
const marker = "version:'0.12.0',ready:true};";
assert.equal(source.split(marker).length, 2, 'Simulator hook changed');
fs.writeFileSync(game, "import { runMobileSimulatorQA } from './PMMobileSimulatorQA';\n" +
  source.replace(marker, marker + '\n      void runMobileSimulatorQA(this);'));
