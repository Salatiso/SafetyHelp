let map;
let marker;
let userLocation = { lat: null, lng: null };
let municipalities = [];
let reports = JSON.parse(localStorage.getItem("incidentReports")) || [];

// Initialize Google Map
function initMap() {
    const defaultLocation = { lat: -26.2041, lng: 28.0473 }; // Default to Johannesburg if location unavailable
    map = new google.maps.Map(document.getElementById("map"), {
        center: defaultLocation,
        zoom: 12
    });
    marker = new google.maps.Marker({
        position: defaultLocation,
        map: map
    });

    // Get user's location
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
            (position) => {
                userLocation.lat = position.coords.latitude;
                userLocation.lng = position.coords.longitude;
                map.setCenter(userLocation);
                marker.setPosition(userLocation);
                document.getElementById("location-info").innerText = `Location: Lat ${userLocation.lat}, Lng ${userLocation.lng}`;
                fetchWeatherData(userLocation.lat, userLocation.lng);
                fetchWhat3Words(userLocation.lat, userLocation.lng);
                suggestMunicipality(userLocation.lat, userLocation.lng);
            },
            () => {
                document.getElementById("location-info").innerText = "Unable to detect location. Using default (Johannesburg).";
            }
        );
    } else {
        document.getElementById("location-info").innerText = "Geolocation not supported. Using default (Johannesburg).";
    }
}

document.addEventListener("DOMContentLoaded", async () => {
    // Load municipalities data
    try {
        const response = await fetch("../assets/data/municipalities.json");
        municipalities = (await response.json()).municipalities;

        // Populate service provider dropdown
        const providerSelect = document.getElementById("service-provider");
        municipalities.forEach(municipality => {
            const option = document.createElement("option");
            option.value = municipality.name;
            option.text = municipality.name;
            providerSelect.appendChild(option);
        });
    } catch (error) {
        console.error("Error loading municipalities:", error);
    }

    // Initialize form
    document.getElementById("incident-report-form").addEventListener("submit", submitIncidentReport);

    // Disable employee routing for non-members
    const userLoggedIn = false; // Replace with actual login check
    if (!userLoggedIn) {
        document.getElementById("employee-route").disabled = true;
    }
});

// Fetch weather data using OpenWeatherMap API
async function fetchWeatherData(lat, lng) {
    const apiKey = "YOUR_OPENWEATHERMAP_API_KEY"; // Replace with your OpenWeatherMap API key
    const url = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lng}&appid=${apiKey}&units=metric`;
    try {
        const response = await fetch(url);
        const data = await response.json();
        const weather = `${data.weather[0].description}, ${data.main.temp}°C`;
        document.getElementById("weather-info").innerText = `Weather: ${weather}`;
        return weather;
    } catch (error) {
        console.error("Error fetching weather data:", error);
        document.getElementById("weather-info").innerText = "Weather: Unable to fetch weather data.";
        return "Unknown";
    }
}

// Fetch what3words address
async function fetchWhat3Words(lat, lng) {
    const apiKey = "YOUR_WHAT3WORDS_API_KEY"; // Replace with your what3words API key
    const url = `https://api.what3words.com/v3/convert-to-3wa?coordinates=${lat},${lng}&key=${apiKey}`;
    try {
        const response = await fetch(url);
        const data = await response.json();
        const w3wAddress = data.words;
        document.getElementById("location-info").innerText += ` | what3words: ///${w3wAddress}`;
        return w3wAddress;
    } catch (error) {
        console.error("Error fetching what3words address:", error);
        return "Unknown";
    }
}

// Suggest municipality based on location
function suggestMunicipality(lat, lng) {
    const providerSelect = document.getElementById("service-provider");
    const providerContact = document.getElementById("provider-contact");
    const providerSocial = document.getElementById("provider-social");

    const municipality = municipalities.find(m => {
        const bounds = m.location_bounds;
        return lat >= bounds.southwest.lat && lat <= bounds.northeast.lat &&
               lng >= bounds.southwest.lng && lng <= bounds.northeast.lng;
    });

    if (municipality) {
        providerSelect.value = municipality.name;
        providerContact.value = municipality.contact.email || municipality.contact.phone;
        providerSocial.value = municipality.contact.social_media.x_handle || "";
    }
}

// Update service provider details when selection changes
function updateServiceProviderDetails() {
    const providerSelect = document.getElementById("service-provider");
    const providerContact = document.getElementById("provider-contact");
    const providerSocial = document.getElementById("provider-social");

    const selectedMunicipality = municipalities.find(m => m.name === providerSelect.value);
    if (selectedMunicipality) {
        providerContact.value = selectedMunicipality.contact.email || selectedMunicipality.contact.phone;
        providerSocial.value = selectedMunicipality.contact.social_media.x_handle || "";
    } else {
        providerContact.value = "";
        providerSocial.value = "";
    }
}

// Submit incident report
async function submitIncidentReport(event) {
    event.preventDefault();

    const photoFile = document.getElementById("incident-photo").files[0];
    const description = document.getElementById("incident-description").value;
    const userName = document.getElementById("user-name").value;
    const userContact = document.getElementById("user-contact").value;
    const userSocial = document.getElementById("user-social").value;
    const providerName = document.getElementById("service-provider").value;
    const providerContact = document.getElementById("provider-contact").value;
    const providerSocial = document.getElementById("provider-social").value;
    const employeeRoute = document.getElementById("employee-route").value;
    const shareEmail = document.getElementById("share-email").checked;
    const shareSMS = document.getElementById("share-sms").checked;
    const shareWhatsApp = document.getElementById("share-whatsapp").checked;
    const shareX = document.getElementById("share-x").checked;

    const timestamp = new Date().toISOString();
    const weather = document.getElementById("weather-info").innerText.replace("Weather: ", "");
    const w3wAddress = document.getElementById("location-info").innerText.includes("what3words")
        ? document.getElementById("location-info").innerText.split("what3words: ///")[1]
        : "Unknown";

    // Convert photo to base64 if provided
    let photoBase64 = "";
    if (photoFile) {
        photoBase64 = await new Promise((resolve) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result);
            reader.readAsDataURL(photoFile);
        });
    }

    const report = {
        id: Date.now(),
        timestamp,
        location: userLocation,
        w3wAddress,
        weather,
        photo: photoBase64,
        description,
        userName,
        userContact,
        userSocial,
        providerName,
        providerContact,
        providerSocial,
        employeeRoute,
        createdAt: Date.now()
    };

    // Store report
    const userLoggedIn = false; // Replace with actual login check
    reports.push(report);
    localStorage.setItem("incidentReports", JSON.stringify(reports));

    // Clean up expired reports for non-members
    if (!userLoggedIn) {
        const now = Date.now();
        reports = reports.filter(r => now - r.createdAt < 7 * 24 * 60 * 60 * 1000); // 7 days
        localStorage.setItem("incidentReports", JSON.stringify(reports));
    }

    // Generate sharing links
    const reportText = `Incident Report\nTimestamp: ${timestamp}\nLocation: https://www.google.com/maps?q=${userLocation.lat},${userLocation.lng}\nwhat3words: ///${w3wAddress}\nWeather: ${weather}\nDescription: ${description}\nReported by: ${userName || "Anonymous"}\nService Provider: ${providerName}\n`;

    if (shareEmail) {
        const emailLink = `mailto:${providerContact || ""}?subject=Incident Report&body=${encodeURIComponent(reportText)}`;
        window.open(emailLink, "_blank");
    }

    if (shareSMS) {
        const smsLink = `sms:${providerContact || ""}?body=${encodeURIComponent(reportText)}`;
        window.open(smsLink, "_blank");
    }

    if (shareWhatsApp) {
        const whatsappLink = `whatsapp://send?text=${encodeURIComponent(reportText)}`;
        window.open(whatsappLink, "_blank");
    }

    if (shareX) {
        const xPost = `${reportText}\n${userSocial ? `@${userSocial}` : ""} ${providerSocial ? `@${providerSocial}` : ""}`;
        const xLink = `https://x.com/intent/tweet?text=${encodeURIComponent(xPost)}`;
        window.open(xLink, "_blank");
    }

    // Route to employer for members
    if (userLoggedIn && employeeRoute !== "none") {
        // Placeholder: In a real scenario, this would send the report to the supervisor or safety rep
        console.log(`Routing report to ${employeeRoute}:`, report);
    }

    // Reset form
    document.getElementById("incident-report-form").reset();
    alert("Incident report submitted successfully!");
}

// View other tools
function viewTool(toolId) {
    alert(`Viewing tool: ${toolId}. This feature will display a detailed checklist or guide for ${toolId}.`);
}
