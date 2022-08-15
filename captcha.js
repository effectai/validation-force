import { createHash } from "crypto"
import dotenv from "dotenv"
import { existsSync } from "fs"

// Configuration Object
if (process.env.DEV_ENV === 'dev' && existsSync('.testnet.env')) {
    console.log('Loading .testnet.env')
    dotenv.config({path: '.testnet.env', debug: true})
} else {
    if (existsSync(".env")) {
        console.log('Loading .env')
        dotenv.config({path: ".env", debug: true})
    }
}
const config = {
    captchaSecret: process.env.CAPTCHA_SECRET, //Captcha Secret Key
    captchaUser: process.env.CAPTCHA_USER, //Captcha User Name
    captchaChars: process.env.CAPTCHA_CHARS, //Captcha Characters,
    letters: Number(process.env.CAPTCHA_LETTERS), //Captcha Letters aka length of captcha
}

/** 
 * Random string generator based on the number of characters defined in the config object
 */
const generateRandomString = () => {
    const arr = [...Array(config.captchaChars.length).keys()]
    return arr
        .map(() => config.captchaChars[Math.floor(Math.random() * config.captchaChars.length)])
        .join("")
        .toString()
}

/**
 * @param {String} inputString User input string to be hashed into a captcha.
 * @returns 
 */
export const generateCaptcha = (inputString) => {
    const inputFormat = `${config.captchaSecret}${inputString}:${config.captchaChars}:${config.letters}`
    // console.error(inputFormat)

    // Hash the input
    const hash = createHash("md5").update(inputFormat).digest()
    const slicedHash = hash.slice(0, config.letters)

    // Loop over the hash and convert each byte to a character, then join the characters
    let decodedArray = []
    for (const buf of slicedHash.entries()) {
        const remainder = buf.pop() % config.captchaChars.length
        const char = config.captchaChars[remainder]
        decodedArray.push(char)
    }
    const captcha = decodedArray.join("")
    console.debug(`captcha: ${captcha}`)
    return captcha
}

/**
 * Returns the string to where the captcha image can be obtained.
 * @returns {Promise<String>} URL to the captcha image
 */
export const urlCaptcha = (inputString) => {
    return `http://image.captchas.net?client=${config.captchaUser}&random=${inputString}&letters=${config.letters}&width=400&height=200`
}

/**
 * Verify that captcha mathces each other. 
 * @param {String} input String to be hashed into a captcha.
 * @param {String} captcha Captcha to be checked against.
 * @returns {Boolean} True if the captcha is correct, false otherwise.
 */
export const verifyCaptcha = (input, captcha) => {
    const generatedCaptcha = generateCaptcha(input)
    // console.log(`input: ${input}, captcha: ${captcha}, generatedCaptcha: ${generatedCaptcha}`)
    return generatedCaptcha.toString().trim().toLowerCase() === captcha.toString().trim().toLowerCase()
}

export default {generateRandomString, generateCaptcha, urlCaptcha, verifyCaptcha}
