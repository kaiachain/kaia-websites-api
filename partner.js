const fetch = require("node-fetch");

// API configuration
const CALL_INTERVAL_API = 300000; // Call api for every 5 minutes
const collectionId = process.env.COLLECTION_PARTNER_ID;
const formId = process.env.FORM_ID_SUBMISSION_PARTNER;
const webflowCollectionUrl = `https://api.webflow.com/v2/collections/${collectionId}/items`;
const formSubmissionUrl = `https://api.webflow.com/v2/forms/${formId}/submissions`;

// Function to fetch form submissions
async function fetchFormSubmissions() {
  try {
    const data = await fetchFromApi(formSubmissionUrl);
    await processAndUpsertData(data.formSubmissions); // Adjust if submissions key is different
  } catch (err) {
    console.error("Error fetching form submissions:", err.message);
  }
}

// Function to process and upsert data
async function processAndUpsertData(submissions) {
  try {
    const existingItems = await fetchExistingItems();

    for (const submission of submissions) {
      const formResponse = submission.formResponse;

      // Map the fields from formResponse
      const submissionData = {
        Name: formResponse["Project Name"],
        projectCategory: formResponse["Project Category"],
        projectDescription: formResponse["Project Description"],
        projectWebsite: formResponse["Project Website"],
        Twitter: formResponse["Twitter"],
        Telegram: formResponse["Telegram"],
        Medium: formResponse["Medium"],
        Facebook: formResponse["Facebook"],
        Github: formResponse["Github"],
        Youtube: formResponse["Youtube"],
        Linkedin: formResponse["Linkedin"],
        Reddit: formResponse["Reddit"],
        Instagram: formResponse["Instagram"],
        OthersSocialLink: formResponse["Others Social Link"],
        FullLogo: formResponse["Project Logo"]?.hostedUrl || null,
        FullLogoWhite: formResponse["Project Logo"]?.hostedUrl || null,
        Logo: formResponse["Project Logo"]?.hostedUrl || null,
      };

      const existingItem = existingItems.find(
        (item) => item.Name === submissionData.Name
      );

      if (existingItem) {
        await updateItem(existingItem._id, submissionData);
      } else {
        await insertItem(submissionData);
      }
    }
  } catch (err) {
    console.error("Error processing and upserting data:", err.message);
  }
}

// Function to fetch existing items in the collection
async function fetchExistingItems() {
  try {
    const data = await fetchFromApi(webflowCollectionUrl);
    return data.items || [];
  } catch (err) {
    console.error("Error fetching existing items:", err.message);
    return [];
  }
}

// Function to insert new item into the collection
async function insertItem(item) {
  const body = JSON.stringify({
    fields: {
      "Name": item.projectName | "",
      "Categories": item.projectCategory | "",
      "Short Description": item.projectDescription | "",
      "External Project Link Out": item.projectWebsite | "",
      "Twitter/X": item.Twitter | "",
      "Telegram": item.Telegram | "",
      "Medium": item.Medium | "",
      "Facebook": item.Facebook | "",
      "Github": item.Github,
      "Youtube": item.Youtube | "",
      "Linkedin": item.Linkedin | "",
      "Reddit": item.Reddit | "",
      "Instagram": item.Instagram | "",
      "OthersSocialLink": item.OthersSocialLink | "",
      "Full Logo": item.projectLogo | "",
      "Full Logo White": item.projectLogo | "",
      "Sector 1": "",
      "Sector 2": "",
      "Logo": item.projectLogo | "",
    },
  });

  try {
    await sendToApi(webflowCollectionUrl, "POST", body);
    console.log("Item inserted:", item.projectName);
  } catch (err) {
    console.error("Error inserting item:", err.message);
  }
}

// Function to update existing item in the collection
async function updateItem(itemId, updatedItem) {
  const updateUrl = `${webflowCollectionUrl}/${itemId}`;
  const body = JSON.stringify({
    fields: {
      "Name": updatedItem.projectName | "",
      "Categories": updatedItem.projectCategory | "",
      "Short Description": updatedItem.projectDescription | "",
      "External Project Link Out": updatedItem.projectWebsite | "",
      "Twitter/X": updatedItem.Twitter | "",
      "Telegram": updatedItem.Telegram | "",
      "Medium": updatedItem.Medium | "",
      "Facebook": updatedItem.Facebook | "",
      "Github": updatedItem.Github | "",
      "Linkedin": updatedItem.Linkedin | "",
      "Instagram": updatedItem.Instagram | "",
      "OthersSocialLink": updatedItem.OthersSocialLink | "",
      "Full Logo": updatedItem.projectLogo | "",
      "Full Logo White": updatedItem.projectLogo | "",
      "Logo": updatedItem.projectLogo | "",
    },
  });

  try {
    await sendToApi(updateUrl, "PATCH", body);
    console.log("Item updated:", updatedItem.projectName);
  } catch (err) {
    console.error("Error updating item:", err.message);
  }
}

// Helper function to fetch data from API
async function fetchFromApi(url) {
  const response = await fetch(url, {
    method: "GET",
    headers: getAuthHeaders(),
  });
  if (!response.ok)
    throw new Error(`Failed to fetch from API. Status: ${response.status}`);
  return response.json();
}

// Helper function to send data to API (for POST and PATCH requests)
async function sendToApi(url, method, body) {
  const response = await fetch(url, {
    method,
    headers: getAuthHeaders(method),
    body,
  });
  if (!response.ok)
    throw new Error(
      `Failed to ${method} data to API. Status: ${response.status}`
    );
}

// Function to generate API headers
function getAuthHeaders(method = "GET") {
  return {
    accept: "application/json",
    authorization: `Bearer ${process.env.TOKEN_AUTH_WEBSTIE}`,
    ...(method === "POST" || method === "PATCH"
      ? { "Content-Type": "application/json" }
      : {}),
  };
}

// Schedule fetching form submissions every 5 minutes
setInterval(() => {
  try {
    fetchFormSubmissions();
  } catch (err) {
    console.log(err);
  }
}, CALL_INTERVAL_API);
