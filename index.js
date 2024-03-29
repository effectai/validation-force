import express from "express";
import { EffectClient } from "@effectai/effect-js";
import dotenv from "dotenv";
import cors from "cors";
import bodyParse from "body-parser";
import { existsSync, readFileSync } from "fs";
import { JsSignatureProvider } from "eosjs/dist/eosjs-jssig.js";
import { urlCaptcha, verifyCaptcha } from "./captcha.js";
import cron from "node-cron";
const AsyncFunction = Object.getPrototypeOf(async function () {}).constructor;

import qualifiers_mainnet from "./qualifiers_mainnet.js";
import qualifiers_testnet from "./qualifiers_testnet.js";

console.log("Starting script", process.env.NET_ENV);

// Init Configuration
if (process.env.NET_ENV === "testnet" && existsSync(".testnet.env")) {
  console.log("Loading .testnet.env");
  dotenv.config({ path: ".testnet.env", debug: true });
} else if (existsSync(".env")) {
    console.log("Loading .env");
    dotenv.config({ path: ".env", debug: true });
}

/**
 * Super Official Validated Moderated List of Qualifications and their corresponding Campaigns.
 */
const qualifications = process.env.NET_ENV === 'mainnet'
? JSON.parse(qualifiers_mainnet)
: JSON.parse(qualifiers_testnet);

console.log(`Using ${JSON.stringify(qualifications)} for this round`)

// Configuration Object
const config = {
  validator: process.env.VALIDATOR,
  network: process.env.NETWORK,
  accountName: process.env.ACCOUNT_NAME,
  permission: process.env.PERMISSION,
  captchaSecret: process.env.CAPTCHA_SECRET,
  captchaUser: process.env.CAPTCHA_USER,
  captchaChars: process.env.CAPTCHA_CHARS,
};

/**
 * Set up, Start server, connect account.
 */
const effectsdk = new EffectClient(config.network);
const app = setUpServer();
const efx = await connectAccount().catch(console.error);

/******************************************************************************
 * THE MAIN SHOW
 * Poll for new submissions and assignqualifications
 *****************************************************************************/
await assignQuali();
const schedule = "* * * * *"; // Every minute
cron.schedule(schedule, async () => await assignQuali());

/******************************************************************************
 * SERVER METHODS
 *****************************************************************************/
app.get("/", (req, res) => {
  try {
    res.json("🔥");
  } catch (error) {
    console.error(error);
    res.status(500).send(error);
  }
});

// Use to generateCaptcha
app.get("/captcha", async (req, res) => {
  try {
    const captchaUrl = urlCaptcha();
    // console.log(`Captcha URL: ${captchaUrl}`)
    res.status(200).json(captchaUrl);
  } catch (error) {
    console.error(error);
    res.status(500).send(error);
  }
});

app.post("/verify", async (req, res) => {
  try {
    //inputForCaptcha, generatedCaptcha
    const { input, captcha } = req.body;
    const isValid = verifyCaptcha(input, captcha);
    // console.log(`Input: ${input}, Captcha: ${captcha}, is valid: ${isValid}`)
    res.status(200).json({ isValid });
  } catch (error) {
    console.error(error);
    res.status(500).send(`Error: Something went wrong when verifying captcha.`);
  }
});

app.get("/batches", async (req, res) => {
  try {
    const batches = await effectsdk.force.getCampaignBatches(campaign_id);
    res.send(batches);
  } catch (error) {
    console.error(error);
    res.send(error);
  }
});

app.get("/accquali", async (req, res) => {
  try {
    console.log(req.query);
    const result = await effectsdk.force.getAssignedQualifications(
      null,
      100,
      true,
      req.query.account
    );
    console.log(result);
    res.json(result);
  } catch (error) {
    console.error(error);
    res.status(500).send(error);
  }
});

app.get("/subs", async (req, res) => {
  try {
    const result = await effectsdk.force.getSubmissions();
    res.status(200).send(result);
  } catch (error) {
    console.error(error);
    res.status(500).send(error);
  }
});

app.get("/allquali", async (req, res) => {
  try {
    const result = await effectsdk.force.getQualifications();
    res.json(result);
  } catch (error) {
    console.error(error);
    res.status(500).send(error);
  }
});

app.get("/info", async (req, res) => {
  try {
    const info = effectsdk.config;
    delete info.web3;
    res.json(info);
  } catch (error) {
    console.error(error);
    res.status(500).json(error);
  }
});

app.get("/assign", async (req, res) => {
  try {
    const response = await assignQuali();
    res.status(200).json(response);
  } catch (error) {
    console.error(error);
    res.status(500).send(error);
  }
});

async function connectAccount() {
  try {
    console.log("Connecting to account");
    const provider = new JsSignatureProvider([process.env.PRIVATE_KEY]);
    const eos_accnt = {
      accountName: config.accountName,
      permission: config.permission,
      privateKey: process.env.PRIVATE_KEY,
    };
    const effect_account = await effectsdk.connectAccount(provider, eos_accnt);
    console.log(
      `🔥 Connected to ${config.network} with ${effect_account.accountName}`
    );
    return effect_account;
  } catch (error) {
    console.error("⚠ connectAccount", error);
  }
}

function setUpServer() {
  try {
    console.log("Setting up server");
    const server = express();
    const port = process.env.PORT || 3030;
    server.use(cors());
    server.use(bodyParse.json());
    server.use(
      bodyParse.urlencoded({
        extended: true,
      })
    );
    server.listen(port, () =>
      console.log(`Server is running on port ${port}!`)
    );
    return server;
  } catch (error) {
    console.error("⚠ setupServer", error);
  }
}

async function assignQuali() {
  console.log("checking for submissions to assign qualifications..");
  try {
    for (const qual of qualifications) {
      // console.log(`🚇️🚇️🚇️ Getting batches and submissions for campaign: ${JSON.stringify(qual)}`)
      const batches = await effectsdk.force.getCampaignBatches(
        qual.campaign_id
      );

      // console.log("🐯🐯🐯🐯 Using the following qual.validate_function", qual.validate_function)

      // console.log(`🛀🏽🛀🏽🛀🏽 Got batches:\n${JSON.stringify(batches, null, 2)}`)
      let validate;
      if (qual.auto_loop) {
        validate = new AsyncFunction(
          "submission",
          "answer",
          "key",
          "forceInfo",
          qual.validate_function
        );
      } else {
        validate = new AsyncFunction(
          "submissions",
          "answers",
          "key",
          "forceInfo",
          qual.validate_function
        );
      }
      for (const batch of batches) {
        const submissions = await effectsdk.force.getSubmissionsOfBatch(
          batch.batch_id
        );
        // console.log(`Submissions ${JSON.stringify(submissions, null, 2)}`)

        for (const sub of submissions) {
          // Get list of assigned qualifications for user.
          const userQuali = await effectsdk.force.getAssignedQualifications(
            null,
            100,
            true,
            sub.account_id
          );
          // console.log(`User qualifications: ${JSON.stringify(userQuali, null, 2)}`)

          // Make sure that when iterating through the list we only assign the qualification once.
          const check =
            sub.data &&
            !userQuali.some(
              (uq) =>
                uq.id === qual.approve_qualification_id ||
                uq.id === qual.reject_qualification_id
            );
          if (check) {
            // console.log(`🦁🦁🦁 checking submission ${sub.id} for user ${sub.account_id}..`)
            let givenAnswers = JSON.parse(sub.data);
            if (givenAnswers.ipfs) {
              givenAnswers = await effectsdk.force.getIpfsContent(
                givenAnswers.ipfs
              );
            }
            // console.log("🫂🫂🫂 givenAnswers", givenAnswers)
            const forceInfo = {
              accountId: sub.account_id,
              submissionId: sub.id,
              campaignId: qual.campaign_id,
              batchNumber: batch.id,
              batchId: batch.batch_id,
            };

            let valid;
            let quali_value;
            try {
              if (qual.auto_loop) {
                let correct = 0;
                let wrong = 0;

                // { 'value': 'true', 'quali_value': 'insta_handle }
                for (const key in qual.answers) {
                  const result = await validate(
                    givenAnswers[key],
                    qual.answers[key],
                    key,
                    forceInfo
                  );
                  quali_value = result.quali_value;
                  result.value
                    ? correct++
                    : wrong++;
                }
                valid = correct / (correct + wrong);
                // console.log("valid", valid, "treshold", qual.threshold)
              } else {
                // console.log("🐳🐳🐳 validating answers",
                //     `givenAnswers: ${JSON.stringify(givenAnswers, null, 2)},
                //     answers: ${JSON.stringify(qual.answers, null, 2)},
                //     forceInfo: ${JSON.stringify(forceInfo, null, 2)}`
                // )
                const result = await validate(
                  givenAnswers,
                  qual.answers,
                  null,
                  forceInfo
                ).catch((e) => {
                  console.error("🌪️🌪️🌪️ error validating answers", e)
                });
                // console.log("😴😴😴 result", result)
                valid = result.value;
                quali_value = result.quali_value;
              }

              // console.log("🔋🔋🔋 valid", valid, "quali", quali_value, "Assign Quali now...")

              // console.log("🏗️🏗️🏗️ qual.autoloop", qual.auto_loop, valid, qual.threshold)

              if (qual.auto_loop ? valid >= qual.threshold : valid) {
                console.log(
                  "APPROVED",
                  `Assigning approve qualification for campaign ${qual.campaign_id} to submission\nqualification: ${qual.approve_qualification_id}\naccount: ${sub.account_id}`
                );
                const tx = await effectsdk.force.assignQualification(
                  qual.approve_qualification_id,
                  sub.account_id,
                  JSON.stringify(quali_value ?? undefined)
                );
                console.log(`Transaction: ${tx.transaction_id}`)
              } else {
                console.log(
                  "REJECTED",
                  `Assigning reject qualification for campaign ${qual.campaign_id} to submission\nqualification: ${qual.reject_qualification_id}\naccount: ${sub.account_id}`
                );
                const tx = await effectsdk.force.assignQualification(
                  qual.reject_qualification_id,
                  sub.account_id,
                  JSON.stringify(quali_value ?? undefined)
                );
                console.log(`Transaction: ${tx.transaction_id}`)
              }

            } catch (error) {
              console.error(JSON.stringify(error));
              // continue;
            }
          }
        }
      }
    }
    console.log(`🔋 Done assigning qualifications ${new Date()}`);
  } catch (error) {
    console.error("🧯 AssignQuali", error);
  }
}
