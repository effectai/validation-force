/**
 * Miscellaneous utilities, that were written and might be useful in the future.
 */

/**
 * We create a random string, which is then sent to the captcha service, we encode it ourselves, and store it locally.
 * The randomString is sent over and encoded using the same secret key and presented to the user.
 * The user then needs to fill in the same encoded string in order to prove the captcha.
 * We keep track of the time that the encoded string was created in order to clear it from the table.
 * @returns {Promise<String>} Encoded Captcha, Promise resolves to string
 */
 export const generateRandomCaptcha = async () => {
    const randomString = generateRandomString(42)
    // const randomString = "algocumisa"; // for testing, which resolves to fgveiihrab
    console.debug(`Random String: ${randomString}`);

    // <secret><random>:<alphabet>:<letters>
    const inputFormat = `${config.captchaSecret}${randomString}:${config.captchaChars}:${config.letters}`;

    // Hash the input
    const hash = createHash("md5").update(inputFormat).digest();
    const slicedHash = hash.slice(0, config.letters);

    // Loop over the hash and convert each byte to a character, then join the characters
    let decodedArray = [];
    for (const buf of slicedHash.entries()) {
        const remainder = buf.pop() % config.captchaChars.length;
        const char = config.captchaChars[remainder];
        decodedArray.push(char);
    }
    const captcha = decodedArray.join("");
    console.debug(`captcha: ${captcha}`);

    // Prep the data to store it in memory, with its expiration time.
    // We need to keep track of the captcha, that is what we are going to test against
    // This part should be removed into it's own function
    const expirationTime = config.expirationTime * 1000 * 60 // Convert to milliseconds
    const expire = Date.now() + expirationTime;
    console.log(`expire: ${expire}`);
    const tmpList = await fs.readJSON(tmpFile).catch(console.error);
    tmpList.push({ captcha, expire });
    await fs.writeJSON(tmpFile, tmpList).catch(console.error);
    console.debug(tmpList);

    return { randomString, captcha };
};

/**
 * Used to clean the list of json 
 */
export const cleanList = async () => {
    const tmpList = await fs.readJSON(tmpFile);
    const parsedList = JSON.stringify(tmpList);
    const cleanList = tmpList.filter(el => el.expire > Date.now());
    await fs.writeJSON(tmpFile, cleanList).catch(console.error);
}


/**
 * Used to check if the captcha is in the tmp list.
 */
export const verifyCaptcha = async (userCaptcha) => {
    const tmpList = await fs.readJSON(tmpFile);
    const parsedList = JSON.stringify(tmpList);

    // if list is empty, return false
    if (userCaptcha.length === 0) {
        return false;
    }

    return tmpList.some((el) => el.captcha === userCaptcha)
}