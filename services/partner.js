const fetch = require("node-fetch");

// API configuration
const LIMIT = 100
const CALL_INTERVAL_API = 300000; // Call API every 5 minutes
const VALUE_DEFAULT_IS_PARTNER = "df269bd69bbdfe316f01a412638f33aa" // default set iok partner is true
const VALUE_HAS_OFFERINGS_TRUE = "b2b36056e8b11b2c2c66ae2b22a07172" // default set has offerings is true
const VALUE_HAS_OFFERINGS_FALSE = "69905878a010d2d2ea932d6d52c5d3ee" // default set has offerings is false
const {
  TOKEN_AUTH_WEBSITE: websiteAuthToken,
  COLLECTION_PARTNER_ID: partnerCollectionId,
  FORM_ID_SUBMISSION_PROJECTS: submissionFormIdProjects,
  FORM_ID_SUBMISSION_IOK: submissionFormIdIok,
  COLLECTION_CATEGORIES_PARTNERS_ID: partnerCategoryCollectionId
} = process.env

const webflowCollectionUrl = `https://api.webflow.com/v2/collections/${partnerCollectionId}/items`;
const webflowCategoriesPartnersUrl = `https://api.webflow.com/v2/collections/${partnerCategoryCollectionId}/items`;

// Fetch form submissions based on form type with pagination
async function fetchFormSubmissions(formId) {
  const allSubmissions = [];
  let offset = 0;
  const limit = LIMIT;
  
  try {
    while (true) {
      const formSubmissionUrl = `https://api.webflow.com/v2/forms/${formId}/submissions?limit=${limit}&offset=${offset}`;
      console.log(`Fetching form submissions with offset: ${offset}, limit: ${limit}`);
      
      const data = await fetchFromApi(formSubmissionUrl);
      const submissions = data.formSubmissions || [];
      
      if (submissions.length === 0) {
        console.log(`No more form submissions found at offset: ${offset}`);
        break;
      }
      
      allSubmissions.push(...submissions);
      console.log(`Fetched ${submissions.length} form submissions at offset: ${offset}, total so far: ${allSubmissions.length}`);
      
      // If we got less than the limit, we've reached the end
      if (submissions.length < limit) {
        console.log(`Reached end of form submissions. Total fetched: ${allSubmissions.length}`);
        break;
      }
      
      offset += limit;
    }
    
    console.log(`Total form submissions fetched: ${allSubmissions.length}`);
    await processAndUpsertData(allSubmissions);
  } catch (err) {
    console.error("Error fetching form submissions:", err.message);
  }
}

// Fetch categories from Webflow with pagination
async function fetchCategories() {
  const allCategories = [];
  let offset = 0;
  const limit = LIMIT;
  
  try {
    while (true) {
      const paginatedUrl = `${webflowCategoriesPartnersUrl}?limit=${limit}&offset=${offset}`;
      console.log(`Fetching categories with offset: ${offset}, limit: ${limit}`);
      
      const response = await fetchFromApi(paginatedUrl);
      const categories = response.items || [];
      
      if (categories.length === 0) {
        console.log(`No more categories found at offset: ${offset}`);
        break;
      }
      
      allCategories.push(...categories);
      console.log(`Fetched ${categories.length} categories at offset: ${offset}, total so far: ${allCategories.length}`);
      
      // If we got less than the limit, we've reached the end
      if (categories.length < limit) {
        console.log(`Reached end of categories. Total fetched: ${allCategories.length}`);
        break;
      }
      
      offset += limit;
    }
    
    console.log(`Total categories fetched: ${allCategories.length}`);
    
    const categoriesData = allCategories.map((category) => ({
      id: category.id,  
      name: category.fieldData.name 
    }));

    return categoriesData;

  } catch (err) {
    console.error("Error fetching categories:", err.message);
    return [];
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
  // contributionTypes
  const contributionTypes = formResponse["Contribution Type"]?.split(",").filter(Boolean) || [];

  // project category
  const projectCategory = formResponse["Project Category"]?.split(",").filter(Boolean) || [];
  // project logo
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
    OfferingDescription: formResponse["Offering Description"],
    RedemptionInstructions: formResponse["Redemption Instructions"]
  };
}

// Map fields for other projects
function mapProjectFields(formResponse) {
  // project logo
  const projectLogo = formResponse["Project Logo"]?.hostedUrl || null;
  const projectLogoId = formResponse["Project Logo"]?.id || null;
  const projectLogoName = formResponse["Project Logo"]?.name || null;
  // project category
  const projectCategory = formResponse["Project Category"]?.split(",").filter(Boolean) || [];
  // project logo white
  const projectLogoWhite = formResponse["Project Logo white"]?.hostedUrl || null;
  const projectLogoIdWhite = formResponse["Project Logo white"]?.hostedUrl || null;
  const projectLogoNameWhite = formResponse["Project Logo white"]?.hostedUrl || null;
  
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
    // full logo
    projectLogoId: projectLogoId,
    projectLogoName: projectLogoName,
    FullLogo: projectLogo,
    //logo white
    projectLogoIdWhite: projectLogoIdWhite,
    projectLogoNameWhite: projectLogoNameWhite,
    FullLogoWhite: projectLogoWhite,
    // logo
    Logo: projectLogo,
  };
}

// Fetch existing items from the Webflow collection with pagination
async function fetchExistingItems() {
  console.log("Fetching existing items with pagination");
  const allItems = [];
  let offset = 0;
  const limit = LIMIT; // Using the LIMIT constant defined at the top
  
  try {
    while (true) {
      const paginatedUrl = `${webflowCollectionUrl}?limit=${limit}&offset=${offset}`;
      console.log(`Fetching items with offset: ${offset}, limit: ${limit}`);
      
      const data = await fetchFromApi(paginatedUrl);
      const items = data.items || [];
      
      if (items.length === 0) {
        console.log(`No more items found at offset: ${offset}`);
        break;
      }
      
      allItems.push(...items);
      console.log(`Fetched ${items.length} items at offset: ${offset}, total items so far: ${allItems.length}`);
      
      // If we got less than the limit, we've reached the end
      if (items.length < limit) {
        console.log(`Reached end of collection. Total items fetched: ${allItems.length}`);
        break;
      }
      
      offset += limit;
    }
    
    console.log(`Total existing items fetched: ${allItems.length}`);
    return allItems;
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
const validSectors = ["Price Discount", "Free Trail", "Special Offering"];

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
      "full-logo-white": item.FullLogoWhite ? { "fileId": item.projectLogoIdWhite, "url": item.FullLogoWhite, "alt": null } : {},
      "logo": item.Logo ? { "fileId": item.projectLogoId, "url": item.Logo, "alt": null } : {},
      "is-partner": VALUE_DEFAULT_IS_PARTNER,
      "sector-1-7": item.SectorFirst || "",
      "sector-2-7": item.SectorSeconds || "",
      "offering-description": item.OfferingDescription || "",
      "redemption-instructions": item.RedemptionInstructions || "",
      "has-offerings": (validSectors.includes(item.SectorFirst) || validSectors.includes(item.SectorSeconds)) ? VALUE_HAS_OFFERINGS_TRUE : VALUE_HAS_OFFERINGS_FALSE
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

// Function to fetch partners data from Webflow live collection with automatic pagination
async function fetchPartnersData() {
  try {
    const allItems = [];
    let currentOffset = 0;
    const maxLimit = LIMIT; // Reuse existing LIMIT constant
    let totalItems = 0;
    let hasMore = true;

    const categoriesData = await fetchCategories();
    const categoriesDataMap = categoriesData.reduce((acc, category) => {  
      acc[category.id] = category.name;
      return acc;
    }, {});
    
    console.log('Starting to fetch all partners data with automatic pagination');
    
    // Loop through all pages to get complete data
    while (hasMore) {
      const liveCollectionUrl = `${webflowCollectionUrl}/live?limit=${maxLimit}&offset=${currentOffset}`;
      console.log(`Fetching page at offset: ${currentOffset}, limit: ${maxLimit}`);
      
      // Reuse existing fetchFromApi function instead of duplicating fetch logic
      const data = await fetchFromApi(liveCollectionUrl);
      const items = data.items || [];
      
      if (items.length === 0) {
        console.log(`No more items found at offset: ${currentOffset}`);
        hasMore = false;
        break;
      }
      
      // Transform the data to a cleaner format
      const transformedItems = items.map(item => ({
        name: item.fieldData?.name || '',
        shortDescription: item.fieldData?.['short-description'] || '',
        description: item.fieldData?.decsription || item.fieldData?.description || '',
        categories: item.fieldData?.categories?.map(categoryId => categoriesDataMap[categoryId]) || [],
        externalLink: item.fieldData?.['external-link'] || '',
        socialLinks: {
          twitter: item.fieldData?.['twitter-x'] || '',
          telegram: item.fieldData?.telegram || '',
          medium: item.fieldData?.medium || '',
          facebook: item.fieldData?.['facebook-2'] || '',
          github: item.fieldData?.github || '',
          youtube: item.fieldData?.youtube || '',
          linkedin: item.fieldData?.linkedin || '',
          reddit: item.fieldData?.['reddit-2'] || '',
          instagram: item.fieldData?.instagram || '',
          others: item.fieldData?.['others-social-link'] || ''
        },
        logo: item.fieldData?.logo?.url || item.fieldData?.['full-logo']?.url || null
      }));

      transformedItems.forEach(item => {
        if(item.fieldData?.['is-partner'] === VALUE_DEFAULT_IS_PARTNER) {
          allItems.push(item);
        }
      });
      
      allItems.push(...transformedItems);
      totalItems = data.total || allItems.length;
      
      console.log(`Fetched ${items.length} items at offset: ${currentOffset}, total items so far: ${allItems.length}`);
      
      // If we got less than the max limit, we've reached the end
      if (items.length < maxLimit) {
        console.log(`Reached end of collection. Total items fetched: ${allItems.length}`);
        hasMore = false;
        break;
      }
      
      currentOffset += maxLimit;
      
      // Add a small delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    
    console.log(`Final result: ${allItems.length} total partners fetched`);

    return allItems || [];
    
  } catch (error) {
    console.error('Error fetching partners data:', error.message);
    throw error;
  }
}

// Export the function for use in other files
module.exports = {
  fetchPartnersData
};

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

