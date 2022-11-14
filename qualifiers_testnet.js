import { readFile } from 'fs/promises'

const campaign14 = await readFile('qualis/testnet/14_human.string.js', 'utf8')

export default [
    { 
        "campaign_id": 9,
        "approve_qualification_id": 25,
        "reject_qualification_id": 25,
        "validate_function": "return submission === answer;",
        "auto_loop": true,
        "threshold": 1,
        "answers": {
            "sentiment": "neutral"
        }
    },
    {
        "campaign_id": 14,
        "approve_qualification_id": 31,
        "reject_qualification_id": 32,
        "validate_function": campaign14,
        "auto_loop": false,
        "answers": {
            "calcmul":"27","humanint":"1","humantxt":"Yes","humanfriendyes":true,"overoveryes":true,"ballofwool":true,"humanSlider":"75"
        }
    }
]
