import express from "express"
import { EffectClient } from "@effectai/effect-js"
import dotenv from "dotenv"
import cors from "cors"
import bodyParse from "body-parser"
import { existsSync, readFileSync } from "fs"
import { JsSignatureProvider } from "eosjs/dist/eosjs-jssig.js"
import captcha, { cleanList, generateCaptcha, verifyCaptcha } from "./captcha.js"
import cron from "node-cron"
import { urlCaptcha } from "./captcha.js"
// import knex from "knex"

if (existsSync(".env") && existsSync("./qualifications.json")) {
    dotenv.config()
}

/**
 * Super Official Validated Moderated List of Qualifications and their corresponding Campaigns.
 */
const qualifications = JSON.parse(readFileSync("./qualifications.json"))

// Configuration Object
const config = {
    validator: process.env.VALIDATOR,
    network: process.env.NETWORK,
    accountName: process.env.ACCOUNT_NAME,
    permission: process.env.PERMISSION,
    captchaSecret: process.env.CAPTCHA_SECRET,
    captchaUser: process.env.CAPTCHA_USER,
    captchaChars: process.env.CAPTCHA_CHARS,
}

/**
 * Start server, connect account.
 */
const effectsdk = new EffectClient(config.network)
const app = setUpServer()
const efx = await connectAccount()


/**
 * Poll for new submissions and assignqualifications
 */
const schedule = "30 * * * * *" // Every 30 seconds
cron.schedule(schedule, async () => await assignQuali())

/******************************************************************************
 * SERVER METHODS
 *****************************************************************************/

app.get("/", (req, res) => {
    res.json("🔥")
})

// Use to generateCaptcha
app.get("/captcha", async (req, res) => {
    try {
        console.log(req)
        // const captchaurl = await urlCaptcha()
        // const { campaign_id, batch_id, task_id } = req.query
        const { campaign_id, batch_id, task_id } = {campaign_id: '1', batch_id: '12', task_id:  '123'}
        const captchaString = await generateCaptcha(`${campaign_id}${batch_id}${task_id}`)
        const captchaUrl = urlCaptcha(captchaString)
        console.log(`Captcha URL: ${captchaUrl}`)
        res.json(captchaUrl)
    } catch (error) {
        console.error(error)
        res.status(500).send(error)
    }
})

app.post("/verify", async (req, res) => {
    try {
        //inputForCaptcha, generatedCaptcha
        const { input, captcha } = req.body
        const validCaptcha = await generateCaptcha(input)
        
        // Check that userInput and generatedCaptcha are the same.
        const isValid = validCaptcha === captcha
        console.log(`Input: ${input}, Captcha: ${captcha}, ValidCaptcha: ${validCaptcha} is valid: ${isValid}`)
        res.send({ isValid })
    } catch (error) {
        console.error(error)
        res.status(500).send(`Error: Something went wrong when verifying captcha.`)
    }
})

app.get("/batches", async (req, res) => {
    try {
        const batches = await effectsdk.force.getCampaignBatches(campaign_id)
        res.send(batches)
    } catch (error) {
        console.error(error)
        res.send(error)
    }
})

app.get("/accquali", async (req, res) => {
    try {
        console.log(req.query)
        const result = await effectsdk.force.getAssignedQualifications(req.query.account)
        console.log(result)
        res.json(result)
    } catch (error) {
        console.error(error)
        res.status(500).send(error)
    }
})

app.get("/subs", async (req, res) => {
    try {
        const result = await effectsdk.force.getSubmissions()
        res.status(200).send(result)
    } catch (error) {
        console.error(error)
        res.status(500).send(error)
    }
})


app.get('/allquali', async (req, res) => {
    try {
        const result = await effectsdk.force.getQualifications()
        res.json(result)
    } catch (error) {
        console.error(error)
        res.status(500).send(error)
    }
})

app.get('/info', async (req, res) => {
    try {
        const info = effectsdk.config
        delete info.web3
        res.json(info)
    } catch (error) {
        console.error(error)
        res.status(500).json(error)
    }
})

app.get('/assign', async (req, res) => {
    try {
        const response = await assignQuali()
        res.status(200).json(response)
    } catch (error) {
        console.error(error)
        res.status(500).send(error)
    }
})

async function connectAccount() {
    console.log("Connecting to account")
    const provider = new JsSignatureProvider([process.env.PRIVATE_KEY])
    const eos_accnt = {
        accountName: config.accountName,
        permission: config.permission,
        privateKey: process.env.PRIVATE_KEY
    }
    const effect_account = await effectsdk.connectAccount(provider, eos_accnt)
    console.log(`Connected to account: ${effect_account.accountName}`)
    return effect_account
}

function setUpServer() {
    console.log("Setting up server")
    const server = express()
    const port = process.env.PORT || 3030
    server.use(cors())
    server.use(bodyParse.json())
    server.use(bodyParse.urlencoded({
        extended: true
    }))
    server.listen(port, () => console.log(`Server is running on port ${port}!`))
    return server
}

async function assignQuali() {
    try {

        for (const qual of qualifications.list) {

            // console.log(`Getting batches for campaign: ${qual.campaign_id}`)
            const batches = await effectsdk.force.getCampaignBatches(qual.campaign_id)
            // console.log(`Got batches:\n${JSON.stringify(batches, null, 2)}`)

            for (const batch of batches) {

                const submissions = await effectsdk.force.getSubmissionsOfBatch(batch.batch_id)
                // console.log(`Submissions ${JSON.stringify(submissions, null, 2)}`)

                for (const sub of submissions) {

                    // Get list of assigned qualifications for user.
                    const userQuali = await effectsdk.force.getAssignedQualifications(sub.account_id)
                    // console.log(`User qualifications: ${JSON.stringify(userQuali, null, 2)}`)

                    // Make sure that when iterating through the list we only assign the qualification once.
                    if (!userQuali.some(uq => uq.id === qual.qualification_id)) {
                        // console.log(`Assigning qualification to submission\nqualification: ${qual.qualification_id}\naccount: ${sub.account_id}`)
                        const tx = await effectsdk.force.assignQualification(qual.qualification_id, sub.account_id)
                        // console.log(`Transaction: ${tx.transaction_id}`)
                    }
                }
            }
        }
        console.log(`✅ Done assigning qualifications ${new Date()}`)
    } catch (error) {
        console.error(error)
    }
}
