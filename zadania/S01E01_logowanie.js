const dotenv = require("dotenv");
const path = require("path");
const axios = require("axios");
const cheerio = require("cheerio");
const OpenAI = require("openai");
const qs = require("qs"); // For form-data encoding

// Correctly resolve the .env file path one folder up
const envPath = path.resolve(__dirname, "../.env");
dotenv.config({ path: envPath });

// OpenAI API configuration
const openai = new OpenAI({
  apiKey: process.env["OPENAI_API_KEY"],
});

// URLs and credentials
const LOGIN_URL = "https://xyz.ag3nts.org/"; // Replace with your login page
const username = "tester";
const password = "574e112a";

async function fetchQuestion() {
  try {
    const response = await axios.get(LOGIN_URL);
    const $ = cheerio.load(response.data);

    // Fetch the question from the page (adjust the selector to your HTML structure)
    const question = $("#human-question").text().trim();

    return question;
  } catch (error) {
    console.error("Error fetching question:", error.message);
    throw error;
  }
}

async function getLLMAnswer(question) {
  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content:
            "You are a helpful assistant. IMPORTANT!! Answer strict to the question, single word only!",
        },
        {
          role: "user",
          content: question,
        },
      ],
    });
    return completion.choices[0].message.content.trim(); // Extract the assistant's response
  } catch (error) {
    console.error("Error fetching response from OpenAI:", error.message);
    throw error;
  }
}

async function sendLoginRequest(username, password, answer) {
  try {
    // Prepare form-data
    const formData = qs.stringify({
      username,
      password,
      answer,
    });

    const response = await axios.post(LOGIN_URL, formData, {
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
    });

    console.log("Response data:", response.data);

    if (response.data && response.data.secret_url) {
      return response.data.secret_url;
    } else {
      throw new Error("Secret URL not found in response.");
    }
  } catch (error) {
    console.error("Error sending login request:", error.message);
    throw error;
  }
}

async function visitSecretPage(secretUrl) {
  try {
    const response = await axios.get(secretUrl);
    console.log("Secret page content:", response.data);
  } catch (error) {
    console.error("Error visiting secret page:", error.message);
    throw error;
  }
}

async function main() {
  try {
    // Step 1: Fetch the question from the login page
    const question = await fetchQuestion();
    console.log("Fetched question:", question);

    // Step 2: Get the answer from OpenAI's chat model
    const answer = await getLLMAnswer(question);
    console.log("Answer from OpenAI:", answer);

    // Step 3: Submit login credentials and the answer
    const secretUrl = await sendLoginRequest(username, password, answer);
    console.log("Secret URL:", secretUrl);

    // Step 4: Visit the secret page
    await visitSecretPage(secretUrl);
  } catch (error) {
    console.error("Error running script:", error.message);
  }
}

main();
