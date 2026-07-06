import { runClassify } from "../src/jobs/classify";
import { runCollect } from "../src/jobs/collect";
import { runGenerate } from "../src/jobs/generate";

async function main() {
  console.log("== collect ==");
  console.log(JSON.stringify(await runCollect(), null, 2));

  console.log("== classify ==");
  console.log(JSON.stringify(await runClassify(), null, 2));

  console.log("== generate ==");
  console.log(JSON.stringify(await runGenerate(), null, 2));
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
