import dotenv from "dotenv"
import { existsSync } from "fs"

if (process.env.NET_ENV === 'testnet' && existsSync('.testnet.env')) {
    console.log('Loading .testnet.env')
    dotenv.config({path: '.testnet.env', debug: true})
} else {
    if (existsSync(".env")) {
        console.log('Loading .env')
        dotenv.config({path: ".env", debug: true})
    }
}


async function validate(submissions, answers, key, forceInfo) {
    const { generateCaptcha, urlCaptcha, verifyCaptcha }  = (await import("./captcha.js")).default; 
    // verifyCaptcha()
    const fetch = (await import('cross-fetch')).default;
    const response = await fetch("https://api.twitter.com/2/users/by/username/" + submissions.twitter_handle, {
        headers: {
            'Authorization': 'Bearer ' + process.env.TWITTER_BEARER
        }
    });
    const body = await response.json();
    console.log(body);
    if (!body.data || !body.data.id) {
        return false;
    }
    return true;
}

const answers = {
}
const submission = {"twitter_handle":"laurenspv"}

const forceInfo = {
    campaignId: 0,
    batchId: 0,
    accountId: 0,
    submissionId: 0,
}

/*######################*/
async function testValidateFunction() {
    const result = await validate(submission, answers, null, forceInfo);
    console.log("result", result)
}
testValidateFunction()
