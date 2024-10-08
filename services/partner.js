const fetch = require("node-fetch");

// API configuration
const LIMIT = 100
const CALL_INTERVAL_API = 300000; // Call API every 5 minutes
const VALUE_DEFAULT_IS_PARTNER = "df269bd69bbdfe316f01a412638f33aa" // default set iok partner is true
const {
  TOKEN_AUTH_WEBSITE: websiteAuthToken,
  COLLECTION_PARTNER_ID: partnerCollectionId,
  FORM_ID_SUBMISSION_PROJECTS: submissionFormIdProjects,
  FORM_ID_SUBMISSION_IOK: submissionFormIdIok,
  COLLECTION_CATEGORIES_PARTNERS_ID: partnerCategoryCollectionId
} = process.env

const webflowCollectionUrl = `https://api.webflow.com/v2/collections/${partnerCollectionId}/items`;
const webflowCategoriesPartnersUrl = `https://api.webflow.com/v2/collections/${partnerCategoryCollectionId}/items`;

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

// Fetch categories from Webflow
async function fetchCategories() {
  try {
    const response = await fetchFromApi(webflowCategoriesPartnersUrl);
    const categories = response.items || [];

    const categoriesData = categories.map((category) => ({
      id: category.id,  
      name: category.fieldData.name 
    }));

    return categoriesData;

  } catch (err) {
    console.error("Error fetching categories:", err.message);
  }
}

// Process submissions and insert or update accordingly
async function processAndUpsertData(submissions) {
  try {
    const existingItems = await fetchExistingItems();
    const categoriesData = await fetchCategories();

    for (const submission of submissions) {
      const { formResponse, displayName } = submission;

      const submissionData =
        displayName === "IOK Partners"
          ? mapIOKPartnersFields(formResponse)
          : mapProjectFields(formResponse);

      const matchedCategories = categoriesData.filter(
        (category) => submissionData.projectCategory.some(
          (projCat) => projCat === category.name
        )
      );
      
      // If matches are found, assign the category IDs
      submissionData.categoryId = matchedCategories.length
        ? matchedCategories.map((category) => category.id)
        : [];
      
      const existingItem = existingItems.find(
        (item) => item.fieldData.name === submissionData.Name
      );      

      if(existingItem) {
        // await updateItem(existingItem.id, submissionData)
        // console.log('Updated item:', submissionData.Name);
      } else {
        await insertItem(submissionData);
        console.log('Inserting new item:', submissionData.Name);
      }

    }
  } catch (err) {
    console.error("Error processing and upserting data:", err.message);
  }
}

// Map fields for IOK Partners
function mapIOKPartnersFields(formResponse) {
  const contributionTypes = formResponse["Contribution Type"]?.split(",").filter(Boolean) || [];
  const projectCategory = formResponse["Project Category"]?.split(",").filter(Boolean) || [];
  const projectLogo = formResponse["Project Logo 2"]?.hostedUrl || null;
  const projectLogoId = formResponse["Project Logo 2"]?.id || null;
  const projectLogoName = formResponse["Project Logo 2"]?.name || null;

  return {
    Name: formResponse["Name Of Organization"],
    projectCategory: projectCategory,
    projectDescription: formResponse["Description Of Organization"],
    projectWebsite: formResponse["Organization Website URL"],
    Twitter: formResponse["Organizations Twitterhandle"],
    Telegram:  "", //formResponse["Representatives Telegramhandle"] ||
    SectorFirst: contributionTypes[0] || "",
    SectorSeconds: contributionTypes[1] || "",
    OthersSocialLink: formResponse["Whitepaper Deck URL"] || "",
    projectLogoId: projectLogoId,
    projectLogoName: projectLogoName,
    FullLogo: projectLogo,
    FullLogoWhite: projectLogo,
    Logo: projectLogo,
  };
}

// Map fields for other projects
function mapProjectFields(formResponse) {
  const projectLogo = formResponse["Project Logo"]?.hostedUrl || null;
  const projectLogoId = formResponse["Project Logo"]?.id || null;
  const projectCategory = formResponse["Project Category"]?.split(",").filter(Boolean) || [];
  const projectLogoName = formResponse["Project Logo"]?.name || null;
  
  return {
    Name: formResponse["Project Name"],
    projectCategory: projectCategory,
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
    projectLogoId: projectLogoId,
    projectLogoName: projectLogoName,
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
  } catch (err) {
    console.error("Error updating item:", err.message);
  }
}

// Build the request body for insert or update
function buildRequestBody(item) {
  return JSON.stringify({
    isArchived: false,
    isDraft: true,
    fieldData: {
      "name": item.Name || "",
      "slug": (item.Name || "").toLowerCase().replace(/\s+/g, "-"),
      "categories": item.categoryId || [],
      "short-description": (item.projectDescription || "").substring(0, 200),
      "decsription": item.projectDescription || "",
      "external-link": item.projectWebsite || "",
      "twitter-x": item.Twitter || "",
      "telegram": item.Telegram || "",
      "medium": item.Medium || "",
      "facebook-2": item.Facebook || "",
      "github": item.Github || "",
      "youtube": item.Youtube || "",
      "linkedin": item.Linkedin || "",
      "reddit-2": item.Reddit || "",
      "instagram": item.Instagram || "",
      "others-social-link": item.OthersSocialLink || "",
      "full-logo": item.FullLogo ? { "fileId": item.projectLogoId, "url": item.FullLogo, "alt": null } : {},
      "full-logo-white": item.FullLogoWhite ? { "fileId": item.projectLogoId, "url": item.FullLogoWhite, "alt": null } : {},
      "logo": item.Logo ? { "fileId": item.projectLogoId, "url": item.Logo, "alt": null } : {},
      "is-partner": VALUE_DEFAULT_IS_PARTNER,
      "sector-1-7": item.SectorFirst || "",
      "sector-2-7": item.SectorSeconds || ""
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
    authorization: `Bearer ${websiteAuthToken}`,
    ...(method !== "GET" && { "Content-Type": "application/json" }),
  };
}

// Schedule fetching form submissions for both IOK Partners and Projects
setInterval(() => {
  console.log("Triggering Interval "+Date.now())
  try {
    fetchFormSubmissions(submissionFormIdIok);    // Fetch IOK Partners form submissions
    fetchFormSubmissions(submissionFormIdProjects); // Fetch Projects form submissions
  } catch (err) {
    console.error(err);
  }
}, CALL_INTERVAL_API);

fetchFormSubmissions(submissionFormIdIok);
fetchFormSubmissions(submissionFormIdProjects);