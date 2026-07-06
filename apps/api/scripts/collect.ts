import { runCollect } from "../src/jobs/collect";

runCollect()
  .then((summary) => {
    console.log(JSON.stringify(summary, null, 2));
  })
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
