import { createHash } from "crypto"
import dotenv from "dotenv"

dotenv.config()

// Configuration Object
const config = {
    captchaSecret: process.env.CAPTCHA_SECRET, //Captcha Secret Key
    captchaUser: process.env.CAPTCHA_USER, //Captcha User Name
    captchaChars: process.env.CAPTCHA_CHARS, //Captcha Characters,
    letters: process.env.CAPTCHA_LETTERS, //Captcha Letters aka length of captcha
}

const generateSecretCaptcha = () => {
    try {
        // const secretKey = 'secret'
        // const randomString = 'RandomZufall'
        // Output using these parameters: wvphnh
        
        const secretKey = config.captchaSecret
        const userName = config.captchaUser 
        const chars = config.captchaChars
        
        const generateRandomString = () => {
            const arr = [...Array(chars.length).keys()]
            return arr.map(() => chars[Math.floor(Math.random() * chars.length)]).join('').toString()
        }
        
        const randomString = generateRandomString(42)
        const input = `${secretKey}${randomString}:${chars}:${config.letters}`

        const hash = createHash('md5').update(secretKey + randomString).digest()
        const slicedHash = hash.slice(0, config.letters)
    
        let decodedArray = []
        
        for (const buf of slicedHash.entries()) {
            const remainder = buf.pop() % chars.length
            const char = chars[remainder]
            decodedArray.push(char)
        }
    
        const decodedString = decodedArray.join('')
        console.log(`decodedString: ${decodedString}`)

        return decodedString
        
    } catch (error) {
        console.error(error)
    } 
}

const generateNetCaptcha = () => {
    // http://image.captchas.net?client=effect_validator&random=algocumisa&letters=12&width=400&height=200
    return `http://image.captchas.net?client=${config.captchaUser}&random=${generateSecretCaptcha()}&letters=${config.letters}&width=400&height=200`
}

console.log(generateNetCaptcha())

export default { generateSecretCaptcha, generateNetCaptcha }

