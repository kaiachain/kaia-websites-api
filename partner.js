const fetch = require("node-fetch");

// API configuration
const LIMIT = 100
const CALL_INTERVAL_API = 300000; // Call API every 5 minutes
const {
  COLLECTION_PARTNER_ID: collectionId,
  FORM_ID_SUBMISSION_PROJECTS: formIdProjects,
  FORM_ID_SUBMISSION_IOK: formIdIok,
  TOKEN_AUTH_WEBSTIE: authToken,
} = process.env;

const webflowCollectionUrl = `https://api.webflow.com/v2/collections/${collectionId}/items`;

// Fetch form submissions based on form type
async function fetchFormSubmissions(formId) {
  const formSubmissionUrl = `https://api.webflow.com/v2/forms/${formId}/submissions?limit=${LIMIT}`;
  
  try {
    const data = await fetchFromApi(formSubmissionUrl);
    await processAndUpsertData(data.formSubmissions);
  } catch (err) {
    console.error("Error fetching form submissions:", err.message);
  }
}

// Process submissions and insert or update accordingly
async function processAndUpsertData(submissions) {
  try {
    const existingItems = await fetchExistingItems();

    for (const submission of submissions) {
      const { formResponse, displayName } = submission;

      const submissionData =
        displayName === "IOK Partners"
          ? mapIOKPartnersFields(formResponse)
          : mapProjectFields(formResponse);

      const existingItem = existingItems.find(
        (item) => item.Name === submissionData.Name
      );

      existingItem
        ? await updateItem(existingItem._id, submissionData)
        : await insertItem(submissionData);
    }
  } catch (err) {
    console.error("Error processing and upserting data:", err.message);
  }
}

// Map fields for IOK Partners
function mapIOKPartnersFields(formResponse) {
  const contributionTypes = formResponse["Contribution Type"]?.split(",").filter(Boolean) || [];
  
  return {
    Name: formResponse["Name Of Organization"],
    projectCategory: formResponse["Project Category"],
    projectDescription: formResponse["Description Of Organization"],
    projectWebsite: formResponse["Organization Website URL"],
    Twitter: formResponse["Organizations Twitterhandle"],
    Telegram: formResponse["Representatives Telegramhandle"] || "",
    SectorFirst: contributionTypes[0] || "",
    SectorSeconds: contributionTypes[1] || "",
    OthersSocialLink: formResponse["Whitepaper Deck URL"] || "",
    FullLogo: null,
    FullLogoWhite: null,
    Logo: null,
  };
}

// Map fields for other projects
function mapProjectFields(formResponse) {
  const projectLogo = formResponse["Project Logo"]?.hostedUrl || null;
  
  return {
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
    FullLogo: projectLogo,
    FullLogoWhite: projectLogo,
    Logo: projectLogo,
  };
}

// Fetch existing items from the Webflow collection
async function fetchExistingItems() {
  try {
    const data = await fetchFromApi(webflowCollectionUrl);
    return data.items || [];
  } catch (err) {
    console.error("Error fetching existing items:", err.message);
    return [];
  }
}

// Insert a new item into the Webflow collection
async function insertItem(item) {
  const body = buildRequestBody(item);
  try {
    await sendToApi(webflowCollectionUrl, "POST", body);
    console.log("Item inserted:", item.Name);
  } catch (err) {
    console.error("Error inserting item:", err.message);
  }
}

// Update an existing item in the Webflow collection
async function updateItem(itemId, updatedItem) {
  const updateUrl = `${webflowCollectionUrl}/${itemId}`;
  const body = buildRequestBody(updatedItem);
  try {
    await sendToApi(updateUrl, "PATCH", body);
    console.log("Item updated:", updatedItem.Name);
  } catch (err) {
    console.error("Error updating item:", err.message);
  }
}

// Build the request body for insert or update
function buildRequestBody(item) {
  return JSON.stringify({
    fields: {
      "Name": item.Name || "",
      "Categories": item.projectCategory || "",
      "Short Description": item.projectDescription || "",
      "External Project Link Out": item.projectWebsite || "",
      "Twitter/X": item.Twitter || "",
      "Telegram": item.Telegram || "",
      "Medium": item.Medium || "",
      "Facebook": item.Facebook || "",
      "Github": item.Github || "",
      "Youtube": item.Youtube || "",
      "Linkedin": item.Linkedin || "",
      "Reddit": item.Reddit || "",
      "Instagram": item.Instagram || "",
      "OthersSocialLink": item.OthersSocialLink || "",
      "Full Logo": item.FullLogo || "",
      "Full Logo White": item.FullLogoWhite || "",
      "Logo": item.Logo || "",
      "Sector 1": item.SectorFirst || "",
      "Sector 2": item.SectorSeconds || ""
    }
  });
}

// Fetch data from API with appropriate headers
async function fetchFromApi(url) {
  const response = await fetch(url, {
    method: "GET",
    headers: getAuthHeaders(),
  });
  if (!response.ok) throw new Error(`Failed to fetch from API. Status: ${response.status}`);
  return response.json();
}

// Send data to API (for POST and PATCH requests)
async function sendToApi(url, method, body) {
  const response = await fetch(url, {
    method,
    headers: getAuthHeaders(method),
    body,
  });
  if (!response.ok) throw new Error(`Failed to ${method} data to API. Status: ${response.status}`);
}

// Generate authorization headers for API requests
function getAuthHeaders(method = "GET") {
  return {
    accept: "application/json",
    authorization: `Bearer ${authToken}`,
    ...(method !== "GET" && { "Content-Type": "application/json" }),
  };
}

// Schedule fetching form submissions for both IOK Partners and Projects
setInterval(() => {
  try {
    fetchFormSubmissions(formIdIok);    // Fetch IOK Partners form submissions
    fetchFormSubmissions(formIdProjects); // Fetch Projects form submissions
  } catch (err) {
    console.error(err);
  }
}, CALL_INTERVAL_API);
