import { generateCaptcha, urlCaptcha, verifyCaptcha } from "./captcha.js"

async function validate(submissions, answers, key, forceInfo) {
    const s = submissions;
    const a = answers;
    const captchaPath = "" + forceInfo.campaignId + forceInfo.batchId + forceInfo.accountId + forceInfo.submissionId;
    const isValid = verifyCaptcha(captchaPath, submissions.captchainput);
    return isValid && a.calcmul === s.calcmul && a.humanint === s.humanint && a.humantxt?.toString() === s.humantxt?.toString() && a.humanfriendyes === s.humanfriendyes && a.humanSlider > s.humanSlider
}

const answers = {
    "calcmul":"27","humanint":"1","humantxt":"Yes","humanfriendyes":true,"overoveryes":true,"ballofwool":true,"humanSlider":"75","captchainput":"","captchaPath":"  "
}
const submission = {"calcmul":"27","humanint":"1","humantxt":"Yes","humanfriendyes":true,"overoveryes":true,"ballofwool":true,"humanSlider":"100","captchainput":"expheheyej","captchaPath":"codcrs"}

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
