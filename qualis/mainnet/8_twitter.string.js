// Imports need to be relative from the root of the project
// imports need to use require. import is not supported
// Also make sure that the import is present in index.js

const newLocal = `
const fetch = (await import('cross-fetch')).default;

const response = await fetch("https://api.twitter.com/2/users/by/username/" + submissions.twitter_handle, {
    headers: { 'Authorization': "Bearer " + process.env.TWITTER_BEARER }
});

const body = await response.json();

// sleep for 1 second to avoid rate limiting
await new Promise(resolve => setTimeout(resolve, 1000));


console.log(body);
if (!body.data || !body.data.id) {
    console.log("Rejecting from twitter", submissions.twitter_handle);
    return { value: false, quali_value: submissions.twitter_handle }
} else {
    console.log("Accepted from twitter", submissions.twitter_handle);
    return { value: true, quali_value: submissions.twitter_handle }
}
`

export default String(newLocal)
