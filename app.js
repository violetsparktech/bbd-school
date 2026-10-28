"use strict";

const SCHOOL_PHONE = "919956968794";
const RECEIPT_STORAGE_KEY = "bbd-school-fee-receipts-v1";
const RECEIPT_LOGIN_ID = "bbd123";
const RECEIPT_LOGIN_PASSWORD = "bbd321";
const receiptForm = document.getElementById("receipt-form");
const feeItems = document.getElementById("fee-items");
const printButton = document.getElementById("print-receipt");
const newReceiptButton = document.getElementById("new-receipt");
const storageNote = document.getElementById("storage-note");
const accountsSection = document.getElementById("accounts");
const loginPanel = document.getElementById("receipt-login-panel");
const loginForm = document.getElementById("receipt-login-form");
const loginError = document.getElementById("receipt-login-error");
const dashboard = document.getElementById("receipt-dashboard");
let latestReceipt = null;

document.getElementById("current-year").textContent = String(new Date().getFullYear());

const menuToggle = document.querySelector(".menu-toggle");
const navLinks = document.getElementById("primary-nav");
menuToggle.addEventListener("click", () => {
  const isOpen = menuToggle.getAttribute("aria-expanded") === "true";
  menuToggle.setAttribute("aria-expanded", String(!isOpen));
  menuToggle.setAttribute("aria-label", isOpen ? "Open navigation" : "Close navigation");
  navLinks.classList.toggle("is-open", !isOpen);
});

navLinks.addEventListener("click", (event) => {
  if (event.target.closest("a")) {
    navLinks.classList.remove("is-open");
    menuToggle.setAttribute("aria-expanded", "false");
    menuToggle.setAttribute("aria-label", "Open navigation");
  }
});

function closeReceiptAccess() {
  accountsSection.hidden = true;
  loginPanel.hidden = false;
  dashboard.hidden = true;
  loginForm.reset();
  loginError.hidden = true;
  history.replaceState(null, "", `${window.location.pathname}${window.location.search}`);
  document.querySelector(".nav-cta").focus();
}

document.addEventListener("click", (event) => {
  const receiptLink = event.target.closest('a[href="#accounts"]');
  if (!receiptLink) return;

  event.preventDefault();
  accountsSection.hidden = false;
  loginPanel.hidden = false;
  dashboard.hidden = true;
  loginError.hidden = true;
  history.replaceState(null, "", "#accounts");
  accountsSection.scrollIntoView({ behavior: "smooth" });
  document.getElementById("receipt-login-id").focus({ preventScroll: true });

  navLinks.classList.remove("is-open");
  menuToggle.setAttribute("aria-expanded", "false");
  menuToggle.setAttribute("aria-label", "Open navigation");
});

loginForm.addEventListener("submit", (event) => {
  event.preventDefault();
  if (!loginForm.reportValidity()) return;

  const staffId = document.getElementById("receipt-login-id").value.trim();
  const password = document.getElementById("receipt-login-password").value;
  if (staffId !== RECEIPT_LOGIN_ID || password !== RECEIPT_LOGIN_PASSWORD) {
    loginError.hidden = false;
    document.getElementById("receipt-login-password").value = "";
    document.getElementById("receipt-login-password").focus();
    return;
  }

  loginError.hidden = true;
  loginPanel.hidden = true;
  dashboard.hidden = false;
  document.getElementById("receipt-workspace-title").focus();
});

document.getElementById("receipt-login-back").addEventListener("click", closeReceiptAccess);
document.getElementById("receipt-logout").addEventListener("click", () => {
  receiptForm.reset();
  feeItems.innerHTML = '<div class="fee-item"><div><label class="sr-only">Fee description</label><input class="fee-description" maxlength="80" required value="Tuition fee" aria-label="Fee item description"></div><div class="amount-input"><span>₹</span><input class="fee-amount" type="number" min="0.01" max="10000000" step="0.01" inputmode="decimal" required placeholder="0.00" aria-label="Fee item amount"></div><button class="remove-fee" type="button" aria-label="Remove fee item" title="Remove fee item">×</button></div>';
  document.getElementById("payment-date").value = getSchoolDate();
  document.getElementById("fee-total").textContent = formatCurrency(0);
  resetPreview();
  storageNote.textContent = "Complete the form to prepare a receipt preview.";
  closeReceiptAccess();
});

document.getElementById("enquiry-form").addEventListener("submit", (event) => {
  event.preventDefault();
  const form = event.currentTarget;
  if (!form.reportValidity()) return;

  const values = new FormData(form);
  const message = [
    "Hello BBD International School, I would like to enquire about admission.",
    `Parent/guardian: ${values.get("name")}`,
    `Class of interest: ${values.get("class")}`,
    `Phone: ${values.get("phone")}`,
    values.get("message") ? `Question: ${values.get("message")}` : ""
  ].filter(Boolean).join("\n");
  const whatsappUrl = `https://wa.me/${SCHOOL_PHONE}?text=${encodeURIComponent(message)}`;
  window.open(whatsappUrl, "_blank", "noopener,noreferrer");
});

function formatCurrency(amount) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(amount);
}

function getSchoolDate(date = new Date()) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Kolkata",
    year: "numeric",
    month: "2-digit",
    day: "2-digit"
  }).formatToParts(date);
  const value = (type) => parts.find((part) => part.type === type).value;
  return `${value("year")}-${value("month")}-${value("day")}`;
}

function formatReceiptDate(date) {
  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    timeZone: "UTC"
  }).format(new Date(`${date}T00:00:00Z`));
}

function readFeeItems() {
  return Array.from(feeItems.querySelectorAll(".fee-item")).map((row) => {
    const amountInput = row.querySelector(".fee-amount");
    return {
      description: row.querySelector(".fee-description").value.trim(),
      amount: Math.round(Number(amountInput.value) * 100),
      hasAmount: amountInput.value.trim() !== ""
    };
  });
}

function updateTotal() {
  const amount = readFeeItems().reduce((sum, item) => {
    return sum + (item.hasAmount && Number.isSafeInteger(item.amount) && item.amount > 0 ? item.amount : 0);
  }, 0);
  document.getElementById("fee-total").textContent = formatCurrency(amount / 100);
  return amount;
}

function addFeeItem(description = "", amount = "") {
  const row = document.createElement("div");
  row.className = "fee-item";

  const descriptionWrap = document.createElement("div");
  const descriptionLabel = document.createElement("label");
  descriptionLabel.className = "sr-only";
  descriptionLabel.textContent = "Fee description";
  const descriptionInput = document.createElement("input");
  descriptionInput.className = "fee-description";
  descriptionInput.maxLength = 80;
  descriptionInput.required = true;
  descriptionInput.setAttribute("aria-label", "Fee item description");
  descriptionInput.placeholder = "e.g. Examination fee";
  descriptionInput.value = description;
  descriptionWrap.append(descriptionLabel, descriptionInput);

  const amountWrap = document.createElement("div");
  amountWrap.className = "amount-input";
  const currency = document.createElement("span");
  currency.textContent = "₹";
  const amountInput = document.createElement("input");
  amountInput.className = "fee-amount";
  amountInput.type = "number";
  amountInput.min = "0.01";
  amountInput.max = "10000000";
  amountInput.step = "0.01";
  amountInput.inputMode = "decimal";
  amountInput.required = true;
  amountInput.placeholder = "0.00";
  amountInput.setAttribute("aria-label", "Fee item amount");
  amountInput.value = amount;
  amountWrap.append(currency, amountInput);

  const removeButton = document.createElement("button");
  removeButton.className = "remove-fee";
  removeButton.type = "button";
  removeButton.setAttribute("aria-label", "Remove fee item");
  removeButton.title = "Remove fee item";
  removeButton.textContent = "×";
  row.append(descriptionWrap, amountWrap, removeButton);
  feeItems.append(row);
  descriptionInput.focus();
}

document.getElementById("add-fee").addEventListener("click", () => addFeeItem());
feeItems.addEventListener("input", updateTotal);
feeItems.addEventListener("click", (event) => {
  const button = event.target.closest(".remove-fee");
  if (!button) return;
  if (feeItems.querySelectorAll(".fee-item").length === 1) {
    const row = button.closest(".fee-item");
    row.querySelector(".fee-description").value = "";
    row.querySelector(".fee-amount").value = "";
  } else {
    button.closest(".fee-item").remove();
  }
  updateTotal();
});

function getStoredReceipts() {
  try {
    const stored = JSON.parse(localStorage.getItem(RECEIPT_STORAGE_KEY) || "[]");
    if (!Array.isArray(stored) || !stored.every((receipt) => receipt && typeof receipt.number === "string")) {
      throw new Error("Stored receipt data is invalid.");
    }
    return stored;
  } catch (error) {
    throw new Error("Could not read the saved receipt records. Check browser storage before continuing.", { cause: error });
  }
}

function createReceiptNumber(receipts, paymentDate) {
  const datePart = paymentDate.replaceAll("-", "");
  const dayCount = receipts.filter((receipt) => receipt.number.startsWith(`BBD-${datePart}-`)).length + 1;
  return `BBD-${datePart}-${String(dayCount).padStart(3, "0")}`;
}

function renderReceipt(receipt) {
  document.getElementById("receipt-status").textContent = "RECEIVED";
  document.getElementById("preview-receipt-no").textContent = receipt.number;
  document.getElementById("preview-date").textContent = formatReceiptDate(receipt.paymentDate);
  document.getElementById("preview-guardian").textContent = receipt.guardianName;
  document.getElementById("preview-student").textContent = receipt.studentName;
  document.getElementById("preview-class").textContent = receipt.studentClass;
  document.getElementById("preview-admission").textContent = receipt.admissionNumber ? ` · No. ${receipt.admissionNumber}` : "";
  document.getElementById("preview-total").textContent = formatCurrency(receipt.total / 100);
  document.getElementById("preview-mode").textContent = receipt.paymentMode;
  document.getElementById("preview-reference").textContent = receipt.paymentReference || "—";
  document.getElementById("preview-received-by").textContent = receipt.receivedBy;

  const items = document.getElementById("preview-items");
  items.replaceChildren();
  receipt.items.forEach((item) => {
    const row = document.createElement("div");
    row.className = "paper-item";
    const label = document.createElement("span");
    label.textContent = item.description;
    const amount = document.createElement("span");
    amount.textContent = formatCurrency(item.amount / 100);
    row.append(label, amount);
    items.append(row);
  });
}

function resetPreview() {
  latestReceipt = null;
  document.getElementById("receipt-status").textContent = "DRAFT";
  document.getElementById("preview-receipt-no").textContent = "Generated on submission";
  document.getElementById("preview-date").textContent = "—";
  document.getElementById("preview-guardian").textContent = "Parent / guardian";
  document.getElementById("preview-student").textContent = "Student name";
  document.getElementById("preview-class").textContent = "—";
  document.getElementById("preview-admission").textContent = "";
  document.getElementById("preview-total").textContent = formatCurrency(0);
  document.getElementById("preview-mode").textContent = "—";
  document.getElementById("preview-reference").textContent = "—";
  document.getElementById("preview-received-by").textContent = "Authorised receiver";
  const placeholder = document.createElement("div");
  placeholder.className = "paper-item";
  const label = document.createElement("span");
  label.textContent = "Fee items will appear here";
  const amount = document.createElement("span");
  amount.textContent = "—";
  placeholder.append(label, amount);
  document.getElementById("preview-items").replaceChildren(placeholder);
  printButton.disabled = true;
  newReceiptButton.hidden = true;
}

receiptForm.addEventListener("submit", (event) => {
  event.preventDefault();
  if (!receiptForm.reportValidity()) return;

  const total = updateTotal();
  const feeRows = readFeeItems();
  const items = feeRows.map(({ description, amount }) => ({ description, amount }));
  if (!items.length || feeRows.some((item) => !item.description || !item.hasAmount || !Number.isSafeInteger(item.amount) || item.amount <= 0)) {
    storageNote.textContent = "Add a description and a valid amount greater than zero for every fee item.";
    return;
  }
  if (!Number.isSafeInteger(total) || total > 1000000000) {
    storageNote.textContent = "The total must be a valid amount under ₹1,00,00,000.";
    return;
  }

  const formData = new FormData(receiptForm);
  const baseReceipt = {
    studentName: String(formData.get("studentName")).trim(),
    studentClass: String(formData.get("studentClass")).trim(),
    admissionNumber: String(formData.get("admissionNumber")).trim(),
    guardianName: String(formData.get("guardianName")).trim(),
    items,
    total,
    paymentMode: String(formData.get("paymentMode")),
    paymentReference: String(formData.get("paymentReference")).trim(),
    paymentDate: String(formData.get("paymentDate")),
    receivedBy: String(formData.get("receivedBy")).trim(),
    createdAt: new Date().toISOString()
  };

  try {
    const receipts = getStoredReceipts();
    const receipt = { ...baseReceipt, number: createReceiptNumber(receipts, baseReceipt.paymentDate) };
    localStorage.setItem(RECEIPT_STORAGE_KEY, JSON.stringify([...receipts, receipt]));
    latestReceipt = receipt;
    renderReceipt(receipt);
    printButton.disabled = false;
    newReceiptButton.hidden = false;
    storageNote.textContent = `Receipt ${receipt.number} saved in this browser. Print it or save it as a PDF for the school record.`;
  } catch (error) {
    console.error("Receipt could not be saved.", error);
    storageNote.textContent = `${error.message} No receipt was generated.`;
  }
});

printButton.addEventListener("click", () => {
  if (!latestReceipt) return;
  window.print();
});

newReceiptButton.addEventListener("click", () => {
  receiptForm.reset();
  feeItems.innerHTML = '<div class="fee-item"><div><label class="sr-only">Fee description</label><input class="fee-description" maxlength="80" required value="Tuition fee" aria-label="Fee item description"></div><div class="amount-input"><span>₹</span><input class="fee-amount" type="number" min="0.01" max="10000000" step="0.01" inputmode="decimal" required placeholder="0.00" aria-label="Fee item amount"></div><button class="remove-fee" type="button" aria-label="Remove fee item" title="Remove fee item">×</button></div>';
  document.getElementById("payment-date").value = getSchoolDate();
  document.getElementById("fee-total").textContent = formatCurrency(0);
  resetPreview();
  storageNote.textContent = "Complete the form to prepare a receipt preview.";
});

document.getElementById("payment-date").value = getSchoolDate();
