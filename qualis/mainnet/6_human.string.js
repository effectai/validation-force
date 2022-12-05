// Imports need to be relative from the root of the project
// imports need to use require. import is not supported
// Also make sure that the import is present in index.js

const tmpString = `
const { verifyCaptcha } = (await import('./captcha.js')).default
const s = submissions;
const a = answers;
console.log('🔥submission / answers', s, a);
const captchaPath = "" + forceInfo.campaignId + forceInfo.batchId + forceInfo.accountId + forceInfo.submissionId
console.log('🎏🎏🎏🎏', 'captchaPath', captchaPath, 'submissions.captchainput', submissions.captchainput);
const isValid = verifyCaptcha(captchaPath, submissions.captchainput);
console.log("isValid:", isValid, "captchaPath:", captchaPath, "captchaInput:", submissions.captchainput);
if (isValid && a.calcmul === s.calcmul && parseInt(s.humanSlider) >= parseInt(a.humanSlider))
    return { value: true, quali_value: 'human' }
else {
    return { value: false, quali_value: 'bot' }
}
`

export default String(tmpString)

