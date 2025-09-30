// --- WEBSITE INTERACTIVITY (NAVBAR, SCROLL) ---
const hamburger = document.querySelector(".hamburger");
const navMenu = document.querySelector(".nav-menu");
const navLinks = document.querySelectorAll(".nav-link");
const sections = document.querySelectorAll("main section");

hamburger.addEventListener("click", () => {
  hamburger.classList.toggle("active");
  navMenu.classList.toggle("active");
});

navLinks.forEach((link) =>
  link.addEventListener("click", () => {
    hamburger.classList.remove("active");
    navMenu.classList.remove("active");
  })
);

// Active link on scroll
window.addEventListener("scroll", () => {
  let current = "";
  sections.forEach((section) => {
    const sectionTop = section.offsetTop;
    if (pageYOffset >= sectionTop - 100) {
      current = section.getAttribute("id");
    }
  });

  navLinks.forEach((link) => {
    link.classList.remove("active");
    if (link.getAttribute("href").includes(current)) {
      link.classList.add("active");
    }
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
const chartColors = ["#ff6f00", "#2c3e50", "#fbc02d", "#3498db", "#95a5a6"];
const form = document.getElementById("budgetForm");
const qualityRadios = document.querySelectorAll('input[name="quality"]');
const costPerSqftInput = document.getElementById("costPerSqft");
const resultsSection = document.getElementById("resultsSection");
const finalTotalCostSpan = document.getElementById("finalTotalCost");
const breakdownTable = document.getElementById("breakdownTable");
const detailedComponentsDiv = document.getElementById("detailedComponents");
const resetBudgetBtn = document.getElementById("resetBudget");
const shareBudgetBtn = document.getElementById("shareBudget");
const downloadPdfBtn = document.getElementById("downloadPdfBtn");
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
    'input[name="quality"]:checked'
  ).value;
});

form.addEventListener("submit", function (e) {
  e.preventDefault();
  const area = parseFloat(document.getElementById("area").value);
  const costPerSqft = parseFloat(costPerSqftInput.value);
  if (isNaN(area) || isNaN(costPerSqft) || area <= 0 || costPerSqft <= 0) {
    alert("Please enter valid numbers greater than zero.");
    return;
  }
  const totalCost = area * costPerSqft;
  updateUI(totalCost);
});

resetBudgetBtn.addEventListener("click", function () {
  form.reset();
  costPerSqftInput.value = document.querySelector(
    'input[name="quality"]:checked'
  ).value;
  resultsSection.classList.remove("visible");
  if (myChart) myChart.destroy();
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
  this.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Generating...';
  this.disabled = true;
  const content = document.querySelector("#resultsSection .card");
  html2canvas(content, { scale: 2, useCORS: true })
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
      this.innerHTML = originalButtonText;
      this.disabled = false;
    })
    .catch((err) => {
      console.error("PDF generation failed:", err);
      this.innerHTML = originalButtonText;
      this.disabled = false;
    });
});

function updateUI(totalCost) {
  animateValue(finalTotalCostSpan, 0, totalCost, 1500);
  breakdownTable.innerHTML = "";
  detailedComponentsDiv.innerHTML = "";
  const chartLabels = [];
  const chartData = [];
  Object.entries(mainBreakdown).forEach(([component, percentage]) => {
    const cost = (totalCost * percentage) / 100;
    breakdownTable.innerHTML += `
            <tr>
              <td>${component}</td>
              <td>${percentage}%</td>
              <td class="text-right">${formatCurrency(cost)}</td>
            </tr>`;
    chartLabels.push(component);
    chartData.push(cost);
    const details = detailedBreakdown[component];
    if (details) {
      let detailsHTML = `<div class="component-card"><h3>${component} Details</h3><table><tbody>`;
      Object.entries(details).forEach(([subComp, subPercent]) => {
        const subCost = (cost * subPercent) / 100;
        detailsHTML += `<tr><td>${subComp}</td><td class="text-right">${formatCurrency(
          subCost
        )}</td></tr>`;
      });
      detailsHTML += `</tbody></table></div>`;
      detailedComponentsDiv.innerHTML += detailsHTML;
    }
  });
  createOrUpdateChart(chartLabels, chartData);
  resultsSection.style.display = "block";
  setTimeout(() => {
    resultsSection.classList.add("visible");
    resultsSection.scrollIntoView({ behavior: "smooth", block: "start" });
  }, 100);
}

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
          borderColor: "#ffffff",
          borderWidth: 4,
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
            font: { family: "'Poppins', sans-serif" },
            padding: 20,
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
