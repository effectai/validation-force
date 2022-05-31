import express from "express"
import {
    EffectClient
} from "@effectai/effect-js"
import dotenv from "dotenv"
import cors from "cors"
import bodyParse from "body-parser"
import {
    existsSync
} from "fs"
import {
    JsSignatureProvider
} from "eosjs/dist/eosjs-jssig.js"

if (existsSync(".env")) {
    dotenv.config()
}

const campaign_id = 7
const quali_id = 23
// So we will have a list of these objects,  quali's and their associated campaigns.
const qualifications = [{
    qualification_id: quali_id,
    campaign_id: campaign_id
}]

// Destructure config variables
const config = {
    validator: process.env.VALIDATOR,
    network: process.env.NETWORK,
    accountName: process.env.ACCOUNT_NAME,
    permission: process.env.PERMISSION
}

console.log(config)

const effectsdk = new EffectClient(config.network)
const app = setUpServer()
const efx = await connectAccount()

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
        const result = await effectsdk.force.getAssignedQualifications(389)
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

app.get("/taskcomplete", async (req, res) => {
    try {
        const workerDidTask = await effectsdk.force.didWorkerDoTask(idx, key)
        // Kico mi ta wardando aki nan? 
        // Mi ta sinti cu aki nan mi ta suppos di hanja un boolean.

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
        const info = await effectsdk.config
        delete info.web3
        res.json(JSON.stringify(info))
    } catch (error) {
        console.error(error)
        res.status(500).json(error)
    }
})

app.get('/assign', async (req, res) => {
    try {
        await assignQuali()
        res.status(200).send("Assigned Qualification")
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
    const port = process.env.PORT || 3000
    server.use(cors())
    server.use(bodyParse.json())
    server.use(bodyParse.urlencoded({
        extended: true
    }))
    server.listen(port, () => console.log(`Server is running on port ${port}!`))
    return server
}

// const qualifications = [
//     {
//         qualification_id: quali_id,
//         campaign_id: campaign_id
//     }
// ]
async function assignQuali() {
    console.log(`Assigning qualification for ${JSON.stringify(qualifications, null, 2)}`)
    // const campaign = await effectsdk.force.getCampaign(qualifications[0].campaign_id)
    // console.log(`Got campaign: ${JSON.stringify(campaign, null, 2)}`)

    try {
        // get list of subs
        const subs = await effectsdk.force.getSubmissions()
        console.log(`Got submissions:${JSON.stringify(subs, null, 2)}`)

        for (const qual of qualifications) {
            // get batches for Campaign
            const batches = await effectsdk.force.getCampaignBatches(qual.campaign_id)
            console.log(`Got batches:\n${JSON.stringify(batches, null, 2)}`)

            for (const batch of batches) {
                const filterSubs = subs.rows.filter(sub => Number(sub.batch_id) === batch.batch_id)
                console.log(`Filtered Batches ${JSON.stringify(filterSubs, null, 2)}`)
            
                for (const sub of filterSubs) {
                    // asign quali
                    console.log(`Assigning qualification to submission\nqualification: ${qual.qualification_id}\naccount: ${sub.account_id}`)
                    const tx = await effectsdk.force.assignQualification(qual.qualification_id, sub.account_id)
                    console.log(`Transaction: ${tx.transaction_id}`)
                }
            }
        }
    } catch (error) {
        console.error(error)
    }
}
