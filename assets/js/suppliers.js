let suppliersData = {};
let filteredSuppliers = [];

// Load supplier data on page load
document.addEventListener("DOMContentLoaded", async () => {
    try {
        const response = await fetch("../assets/data/suppliers.json");
        suppliersData = await response.json();
        filteredSuppliers = [...suppliersData.suppliers];
        
        // Calculate initial rankings
        filteredSuppliers.forEach(supplier => {
            supplier.average_rating = calculateRanking(supplier);
        });

        // Populate supplier table
        populateSupplierTable(filteredSuppliers);

        // Initialize review form
        document.getElementById("supplier-review-form").addEventListener("submit", submitReview);
    } catch (error) {
        console.error("Error loading supplier data:", error);
    }
});

// Calculate supplier ranking (60% user reviews, 40% external reviews)
function calculateRanking(supplier) {
    const userReviews = supplier.user_reviews || [];
    const externalReviews = supplier.external_reviews || [];

    const userAvg = userReviews.length > 0 
        ? userReviews.reduce((sum, review) => sum + parseFloat(review.rating), 0) / userReviews.length 
        : 0;
    
    const externalAvg = externalReviews.length > 0 
        ? externalReviews.reduce((sum, review) => sum + parseFloat(review.rating), 0) / externalReviews.length 
        : 0;

    const userWeight = userReviews.length > 0 ? 0.6 : 0;
    const externalWeight = externalReviews.length > 0 ? 0.4 : 0;
    const totalWeight = userWeight + externalWeight;

    if (totalWeight === 0) return 0;

    return ((userAvg * userWeight) + (externalAvg * externalWeight)) / totalWeight;
}

// Populate supplier table
function populateSupplierTable(suppliers) {
    const tbody = document.getElementById("supplier-table-body");
    tbody.innerHTML = "";

    suppliers.forEach(supplier => {
        const contactDetails = supplier.contact.website 
            ? `<a href="${supplier.contact.website}" target="_blank">${supplier.contact.email || supplier.contact.telephone}</a>`
            : `${supplier.contact.email || supplier.contact.telephone || "Not Specified"}`;

        const row = document.createElement("tr");
        row.innerHTML = `
            <td>${supplier.name}</td>
            <td>${supplier.location}</td>
            <td>${supplier.services.join("<br>")}</td>
            <td>${contactDetails}</td>
            <td>${supplier.average_rating.toFixed(1)}/5 (${supplier.user_reviews.length + supplier.external_reviews.length} reviews)</td>
            <td><button onclick="openReviewForm('${supplier.name}')" data-i18n="suppliers.table.action_review">Submit Review</button></td>
        `;
        tbody.appendChild(row);
    });
}

// Filter suppliers based on province and service
function filterSuppliers() {
    const province = document.getElementById("province-filter").value;
    const service = document.getElementById("service-filter").value;

    filteredSuppliers = suppliersData.suppliers.filter(supplier => {
        const provinceMatch = !province || supplier.location.includes(province);
        const serviceMatch = !service || supplier.services.some(s => s.includes(service));
        return provinceMatch && serviceMatch;
    });

    // Recalculate rankings
    filteredSuppliers.forEach(supplier => {
        supplier.average_rating = calculateRanking(supplier);
    });

    // Apply sorting after filtering
    sortSuppliers();
}

// Sort suppliers based on selected criterion
function sortSuppliers() {
    const sortBy = document.getElementById("sort-by").value;

    filteredSuppliers.sort((a, b) => {
        if (sortBy === "ranking") {
            return b.average_rating - a.average_rating;
        } else if (sortBy === "name") {
            return a.name.localeCompare(b.name);
        } else if (sortBy === "established") {
            const yearA = parseInt(a.established.match(/\d+/) || 0);
            const yearB = parseInt(b.established.match(/\d+/) || 0);
            return yearB - yearA;
        }
        return 0;
    });

    populateSupplierTable(filteredSuppliers);
}

// Open review form for a supplier
function openReviewForm(supplierName) {
    const userLoggedIn = true; // Replace with actual login check
    if (!userLoggedIn) {
        alert("Please log in to submit a review.");
        window.location.href = "../login.html";
        return;
    }

    document.getElementById("review-supplier").value = supplierName;
    document.getElementById("review-form").style.display = "block";
}

// Submit a review
function submitReview(event) {
    event.preventDefault();

    const supplierName = document.getElementById("review-supplier").value;
    const rating = document.getElementById("review-rating").value;
    const comment = document.getElementById("review-text").value;

    const supplier = suppliersData.suppliers.find(s => s.name === supplierName);
    if (supplier) {
        supplier.user_reviews.push({ rating, comment });
        supplier.average_rating = calculateRanking(supplier);

        // Update filtered suppliers
        const filteredSupplier = filteredSuppliers.find(s => s.name === supplierName);
        if (filteredSupplier) {
            filteredSupplier.user_reviews = supplier.user_reviews;
            filteredSupplier.average_rating = supplier.average_rating;
        }

        // Refresh table
        sortSuppliers();

        // Reset form
        document.getElementById("review-form").style.display = "none";
        document.getElementById("supplier-review-form").reset();

        alert("Review submitted successfully!");
    }
}
