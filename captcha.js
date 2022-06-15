import { createHash } from "crypto";
import dotenv from "dotenv";
import fs from "fs-extra";
import chalk from "chalk";

const tmpFile = "list.json";

// Configuration Object
dotenv.config();
const config = {
  captchaSecret: process.env.CAPTCHA_SECRET, //Captcha Secret Key
  captchaUser: process.env.CAPTCHA_USER, //Captcha User Name
  captchaChars: process.env.CAPTCHA_CHARS, //Captcha Characters,
  letters: Number(process.env.CAPTCHA_LETTERS), //Captcha Letters aka length of captcha
};

const generateRandomString = () => {
  const arr = [...Array(config.captchaChars.length).keys()];
  return arr
    .map(
      () =>
        config.captchaChars[
          Math.floor(Math.random() * config.captchaChars.length)
        ]
    )
    .join("")
    .toString();
};

/**
 * We create a random string, which is then sent to the captcha service, we encode it ourselves, and store it locally.
 * The randomString is sent over and encoded using the same secret key and presented to the user.
 * The user then needs to fill in the same encoded string in order to prove the captcha.
 * We keep track of the time that the encoded string was created in order to clear it from the table.
 * @returns {Promise<String>} Encoded Captcha, Promise resolves to string
 */
export const createCaptcha = async () => {
  const randomString = generateRandomString(42)
//   const randomString = "algocumisa"; // for testing, which resolves to fgveiihrab
  console.debug(`Random String: ${randomString}`);

  // <secret><random>:<alphabet>:<letters>
  const inputFormat = `${config.captchaSecret}${randomString}:${config.captchaChars}:${config.letters}`;

  // Hash the input
  const hash = createHash("md5").update(inputFormat).digest();
  const slicedHash = hash.slice(0, config.letters);

  // Loop over the hash and convert each byte to a character, then join the characters
  let decodedArray = [];
  for (const buf of slicedHash.entries()) {
    const remainder = buf.pop() % chars.length;
    const char = chars[remainder];
    decodedArray.push(char);
  }
  const captcha = decodedArray.join("");
  console.debug(`captcha: ${captcha}`);

  // Prep the data to store it in memory, with its expiration time.
  // We need to keep track of the captcha, that is what we are going to test against
  // This part should be removed into it's own function
  const expirationTime = 1000 * 2 * 60 // 2 minutes
  const expire = Date.now() + expirationTime;
  const tmpList = await fs.readJSON(tmpFile).catch(console.error);
  tmpList.push({ captcha, expire });
  await fs.writeJSON(tmpFile, tmpList).catch(console.error);
  console.debug(tmpList);

  return { randomString, captcha };
};


/**
 * Returns the string to where the captcha image can be obtained.
 * @returns {Promise<String>} URL to the captcha image
 */
export const urlCaptcha = async () => {
  const { randomString, captcha } = await createCaptcha();
  return `http://image.captchas.net?client=${config.captchaUser}&random=${randomString}&letters=${config.letters}&width=400&height=200`;
};

export const verifyCaptcha = async (userCaptcha) => {
  const tmpList = await fs.readJSON(tmpFile);
  const parsedList = JSON.stringify(tmpList);

  // if list is empty, return false
  if (userCaptcha.length === 0) {
    return false;
  }

  return tmpList.some((el) => el.captcha === userCaptcha)
}

export const cleanList = async () => {
    const tmpList = await fs.readJSON(tmpFile);
    const parsedList = JSON.stringify(tmpList);
    const cleanList = tmpList.filter(el => el.expire > Date.now());
    await fs.writeJSON(tmpFile, cleanList).catch(console.error);
}

export default { createCaptcha, urlCaptcha, cleanList };
