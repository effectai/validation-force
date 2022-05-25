import express from "express"
import { EffectClient } from "@effectai/effect-js"
import dotenv from "dotenv"
import cors from "cors"
import bodyParse from "body-parser"
import { existsSync } from "fs"

if (existsSync(".env")) {
    if (process.env[2] === 'testnet') {
    dotenv.config({ path: './testnet.env' })
    } else {
        dotenv.config({ path: './mainnet.env' })
    }
} else {
    // exit process
    console.log("Please create a .testnet.env or .mainnet.env file")
    process.exit(1)
}
const app = express()
const port = process.env.PORT || 3000
app.use(cors())
app.use(bodyParse.json())
app.use(bodyParse.urlencoded({ extended: true }))

const config = {
    validator: process.env.VALIDATOR,
    permission: process.env.PERMISSION,
    privateKey: process.env.PRIVATE_KEY,
}

const effectsdk = new EffectClient(config.network)

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

app.listen(port, () => {
    console.log(`Server is running on port ${port}`)
})

export default app