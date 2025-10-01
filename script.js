// --- SCREEN NAVIGATION ---
const screens = document.querySelectorAll(".screen");
const appScreens = document.querySelectorAll(".app-screen");
const navItems = document.querySelectorAll(".nav-item");
const startCalculatingBtn = document.getElementById("start-calculating");

function showScreen(screenId, isAppScreen = false) {
  if (screenId === "home") {
    document.getElementById("welcome-screen").classList.add("active");
    document.getElementById("main-app").classList.remove("active");
  } else {
    document.getElementById("welcome-screen").classList.remove("active");
    document.getElementById("main-app").classList.add("active");

    appScreens.forEach((screen) => {
      screen.classList.remove("active");
    });
    const activeScreen = document.getElementById(screenId);
    if (activeScreen) {
      activeScreen.classList.add("active");
    }
  }
}

startCalculatingBtn.addEventListener("click", () => {
  showScreen("calculator-screen", true);
});

navItems.forEach((item) => {
  item.addEventListener("click", (e) => {
    e.preventDefault();
    const screenId = item.dataset.screen;
    showScreen(screenId, true);

    navItems.forEach((nav) => nav.classList.remove("active"));
    item.classList.add("active");
  });
});

// --- CALCULATOR LOGIC ---
const mainBreakdown = {
  Foundation: 15,
  Structure: 35,
  Roofing: 10,
  Finishing: 25,
  "Services (Elec/Plumb)": 15,
};
const detailedBreakdown = {
  Foundation: { Excavation: 40, Concrete: 40, Reinforcement: 20 },
  Structure: { Brickwork: 50, Cement: 30, "Labor & Scaffolding": 20 },
  Roofing: { "Roofing Material": 70, "Waterproofing & Labor": 30 },
  Finishing: { Flooring: 40, Painting: 30, "Doors & Windows": 30 },
  "Services (Elec/Plumb)": {
    "Electrical & Lighting": 50,
    Plumbing: 30,
    Fixtures: 20,
  },
};
const chartColors = ["#1193d4", "#f5a623", "#f8e71c", "#7ed321", "#4a90e2"];
const calculateBudgetBtn = document.getElementById("calculate-budget");
const finalTotalCostSpan = document.getElementById("finalTotalCost");
const breakdownTableDiv = document.getElementById("cost-breakdown-table");
const detailedComponentsDiv = document.getElementById("detailed-breakdown");
const resetBudgetBtn = document.getElementById("resetBudget");
const shareBudgetBtn = document.getElementById("shareBudget");
const downloadPdfBtn = document.getElementById("downloadPdfBtn");
const qualityRadios = document.querySelectorAll('input[name="finish-quality"]');
const costPerSqftInput = document.getElementById("costPerSqft");
const areaInput = document.getElementById("area");
const canvas = document.getElementById("budgetChart");
let myChart = null;

const formatCurrency = (value) =>
  value.toLocaleString("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  });

function animateValue(element, start, end, duration) {
  let startTimestamp = null;
  const step = (timestamp) => {
    if (!startTimestamp) startTimestamp = timestamp;
    const progress = Math.min((timestamp - startTimestamp) / duration, 1);
    const currentVal = Math.floor(progress * (end - start) + start);
    element.textContent = formatCurrency(currentVal);
    if (progress < 1) window.requestAnimationFrame(step);
  };
  window.requestAnimationFrame(step);
}
qualityRadios.forEach((radio) => {
  radio.addEventListener("change", function () {
    costPerSqftInput.value = this.value;
  });
});

document.addEventListener("DOMContentLoaded", () => {
  costPerSqftInput.value = document.querySelector(
    'input[name="finish-quality"]:checked'
  ).value;
});

calculateBudgetBtn.addEventListener("click", function (e) {
  e.preventDefault();
  const area = parseFloat(areaInput.value);
  const costPerSqft = parseFloat(costPerSqftInput.value);
  if (isNaN(area) || isNaN(costPerSqft) || area <= 0 || costPerSqft <= 0) {
    alert("Please enter valid numbers greater than zero.");
    return;
  }
  const totalCost = area * costPerSqft;
  updateUI(totalCost);
  showScreen("results-screen", true);
});

function updateUI(totalCost) {
  animateValue(finalTotalCostSpan, 0, totalCost, 1500);
  breakdownTableDiv.innerHTML = "";
  detailedComponentsDiv.innerHTML = "";

  const chartLabels = [];
  const chartData = [];

  let breakdownTableHTML =
    '<table><thead><tr><th>Component</th><th>Allocation</th><th style="text-align: right;">Cost (INR)</th></tr></thead><tbody>';
  Object.entries(mainBreakdown).forEach(([component, percentage]) => {
    const cost = (totalCost * percentage) / 100;
    breakdownTableHTML += `
            <tr>
              <td>${component}</td>
              <td>${percentage}%</td>
              <td style="text-align: right;">${formatCurrency(cost)}</td>
            </tr>`;
    chartLabels.push(component);
    chartData.push(cost);
    const details = detailedBreakdown[component];
    if (details) {
      let detailsHTML = `<div class="component-card"><h3>${component} Details</h3><table><tbody>`;
      Object.entries(details).forEach(([subComp, subPercent]) => {
        const subCost = (cost * subPercent) / 100;
        detailsHTML += `<tr><td>${subComp}</td><td style="text-align: right;">${formatCurrency(
          subCost
        )}</td></tr>`;
      });
      detailsHTML += `</tbody></table></div>`;
      detailedComponentsDiv.innerHTML += detailsHTML;
    }
  });
  breakdownTableHTML += "</tbody></table>";
  breakdownTableDiv.innerHTML = breakdownTableHTML;
  createOrUpdateChart(chartLabels, chartData);
}

// chart
function createOrUpdateChart(labels, data) {
  if (myChart) myChart.destroy();
  myChart = new Chart(canvas.getContext("2d"), {
    type: "doughnut",
    data: {
      labels: labels,
      datasets: [
        {
          data: data,
          backgroundColor: chartColors,
          borderColor: "#343536ff", // FIX: Changed from white to a visible light grey to create separation.
          borderWidth: 2, // FIX: Reduced border width for a cleaner look.
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: "bottom",
          labels: {
            font: { family: "'Manrope', sans-serif" },
            padding: 20,
            color: "#101c22", // FIX: Explicitly set a dark color for the legend text.
          },
        },
        tooltip: {
          callbacks: {
            label: (context) =>
              `${context.label}: ${formatCurrency(context.parsed)}`,
          },
        },
      },
    },
  });
}
resetBudgetBtn.addEventListener("click", function () {
  areaInput.value = "";
  costPerSqftInput.value = document.querySelector(
    'input[name="finish-quality"]:checked'
  ).value;
  showScreen("calculator-screen", true);
});

shareBudgetBtn.addEventListener("click", function () {
  const shareData = {
    title: "My House Construction Budget",
    text: `I just calculated my house construction budget! Total Cost: ${finalTotalCostSpan.textContent}`,
    url: window.location.href,
  };
  if (navigator.share) {
    navigator
      .share(shareData)
      .catch((err) => console.error("Share failed:", err));
  } else {
    alert("Sharing is not supported on your browser.");
  }
});

downloadPdfBtn.addEventListener("click", function () {
  const { jsPDF } = window.jspdf;
  const originalButtonText = this.innerHTML;
  this.innerHTML = "<span>Generating...</span>";
  this.disabled = true;

  // Create a temporary div to render content for PDF generation
  const pdfContent = document.createElement("div");
  pdfContent.style.width = "794px"; // A4 width at 96dpi
  pdfContent.style.padding = "40px";
  pdfContent.style.backgroundColor = "#ffffff";
  pdfContent.style.boxSizing = "border-box";
  pdfContent.style.fontFamily = "'Manrope', sans-serif";

  // **FIX: Inject a style tag to force dark text color for all elements**
  pdfContent.innerHTML = `
        <style>
            * {
                color: #101c22 !important; /* Use !important to override other styles */
                -webkit-print-color-adjust: exact; /* Ensure color prints correctly */
            }
            .estimated-cost-label { color: #1a1a1aff !important; }
        </style>
        <div style="text-align: center;">
            <h1 style="font-size: 1.5rem; font-weight: 700; margin: 0;">DreamHomeCalc</h1>
            <p class="estimated-cost-label" style="font-size: 0.875rem;">ESTIMATED COST</p>
            <p style="font-size: 3rem; font-weight: 800; margin-top: 0.5rem;">${finalTotalCostSpan.textContent}</p>
        </div>
        <h2 style="font-size: 1.25rem; font-weight: 700; margin-bottom: 1rem; text-align: center; margin-top: 2rem;">Cost Breakdown</h2>
    `;

  // Append Cloned Chart
  const chartImage = canvas.toDataURL("image/png");
  pdfContent.innerHTML += `<div style="text-align: center; margin-bottom: 2rem;"><img src="${chartImage}" style="max-width: 400px; margin: auto;"/></div>`;

  // Append Cloned Table and Details
  pdfContent.innerHTML += document.getElementById(
    "cost-breakdown-table"
  ).innerHTML;
  pdfContent.innerHTML += `<h2 style="font-size: 1.25rem; font-weight: 700; margin-bottom: 1rem; text-align: center; margin-top: 2rem;">Detailed Component Breakdown</h2>`;
  pdfContent.innerHTML +=
    document.getElementById("detailed-breakdown").innerHTML;

  // Temporarily append to body to render
  document.body.appendChild(pdfContent);

  html2canvas(pdfContent, { scale: 2, useCORS: true })
    .then((canvas) => {
      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF({
        orientation: "portrait",
        unit: "px",
        format: "a4",
      });
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const imgHeight = (canvas.height * pdfWidth) / canvas.width;
      pdf.addImage(imgData, "PNG", 0, 0, pdfWidth, imgHeight);
      pdf.save("House-Construction-Budget.pdf");

      // Cleanup
      document.body.removeChild(pdfContent);
      this.innerHTML = originalButtonText;
      this.disabled = false;
    })
    .catch((err) => {
      console.error("PDF generation failed:", err);
      // Cleanup
      document.body.removeChild(pdfContent);
      this.innerHTML = originalButtonText;
      this.disabled = false;
    });
});

// --- PWA INSTALL PROMPT LOGIC ---
const installPopup = document.getElementById("install-popup");
const installButton = document.getElementById("install-button");
const dismissButton = document.getElementById("dismiss-button");
let deferredPrompt;

window.addEventListener("beforeinstallprompt", (e) => {
  e.preventDefault();
  deferredPrompt = e;
  installPopup.classList.add("visible");
});

installButton.addEventListener("click", async () => {
  if (deferredPrompt) {
    installPopup.classList.remove("visible");
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    console.log(`User response to the install prompt: ${outcome}`);
    deferredPrompt = null;
  }
});

dismissButton.addEventListener("click", () => {
  installPopup.classList.remove("visible");
});

window.addEventListener("appinstalled", () => {
  installPopup.classList.remove("visible");
  deferredPrompt = null;
});
