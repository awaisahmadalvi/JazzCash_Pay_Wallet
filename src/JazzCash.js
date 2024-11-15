const crypto = require("crypto");
const https = require("https");

// Configuration URLs and Fields
const urls = {
  PAY: "/CustomerPortal/transactionmanagement/merchantform/",
  WALLET: "/ApplicationAPI/API/2.0/Purchase/DoMWalletTransaction",
  INQUIRY: "/ApplicationAPI/API/PaymentInquiry/Inquire",
  REFUND: "/ApplicationAPI/API/Purchase/domwalletrefundtransaction",
};

const fields = {
  PAY: [
    "pp_Amount",
    "pp_BankID",
    "pp_BillReference",
    "pp_Description",
    "pp_Language",
    "pp_MerchantID",
    "pp_Password",
    "pp_ProductID",
    "pp_ReturnURL",
    "pp_TxnCurrency",
    "pp_TxnDateTime",
    "pp_TxnExpiryDateTime",
    "pp_TxnRefNo",
    "pp_TxnType",
    "pp_Version",
    "ppmpf_1",
    "ppmpf_2",
    "ppmpf_3",
    "ppmpf_4",
    "ppmpf_5",
  ],
  WALLET: [
    "pp_Amount",
    "pp_BillReference",
    "pp_CNIC",
    "pp_Description",
    "pp_Language",
    "pp_MerchantID",
    "pp_MobileNumber",
    "pp_Password",
    "pp_TxnCurrency",
    "pp_TxnDateTime",
    "pp_TxnExpiryDateTime",
    "pp_TxnRefNo",
    "ppmpf_1",
    "ppmpf_2",
    "ppmpf_3",
    "ppmpf_4",
    "ppmpf_5",
  ],
  INQUIRY: ["pp_MerchantID", "pp_Password", "pp_TxnRefNo"],
  REFUND: [
    "pp_Amount",
    "pp_MerchantID",
    "pp_MerchantMPIN",
    "pp_Password",
    "pp_TxnCurrency",
    "pp_TxnRefNo",
  ],
};

// Utility Functions
const getDateTime = (daysToAdd = 0) => {
  const date = new Date();
  date.setDate(date.getDate() + daysToAdd);
  return date.toISOString().replace(/[-T:.Z]/g, "").slice(0, 14);
};

function makeRequest(url, requestData) {
  const dataString = JSON.stringify(requestData);
  const options = {
    method: "POST",
    timeout: 10000, // Set timeout to 10 seconds (10000 milliseconds)
    headers: {
      "Content-Type": "application/json",
      "Content-Length": dataString.length,
    },
  };

  return new Promise((resolve, reject) => {
    const req = https.request(url, options, (res) => {
      if (res.statusCode < 200 || res.statusCode > 299) {
        return reject(new Error(`HTTP status code ${res.statusCode}`));
      }
      const body = [];
      res.on("data", (chunk) => body.push(chunk));
      res.on("end", () => resolve(Buffer.concat(body).toString()));
    });

    req.on("error", (err) => reject(err));
    req.on("timeout", () => {
      req.destroy();
      reject(new Error("Request timed out"));
    });

    req.write(dataString);
    req.end();
  });
}


// Main Library
class JazzCash {
  constructor (creds) {
    this.config = {
      pp_MerchantID: "",
      pp_Password: "",
      integritySalt: "",
    };
    this.url = "";
    this.error = false;
    this.secureHash = "";
    this.initialized = false;
    this.environment = "sandbox";
    this.liveURL = "https://payments.jazzcash.com.pk";
    this.sandboxURL = "https://sandbox.jazzcash.com.pk";
    this.data = {};

    this.credentials(creds)
  }

  credentials({ config, environment }) {
    try {
      if (
        config.pp_MerchantID.length &&
        config.pp_Password.length &&
        config.integritySalt.length
      ) {
        this.config = {
          pp_MerchantID: config.pp_MerchantID,
          pp_Password: config.pp_Password,
          integritySalt: config.integritySalt,
        };
        this.environment = environment || this.environment;
        this.initialized = true;
      } else {
        throw new Error("Credentials are missing or invalid.");
      }
    } catch (err) {
      this.catchError(err);
    }
  }

  setData(data) {
    if (this.initialized && !this.error) {
      this.data = {
        pp_Amount: data.pp_Amount ? data.pp_Amount * 100 : 0, // Convert to paisas
        pp_BillReference: data.pp_BillReference || "",
        pp_CNIC: data.pp_CNIC || "",
        pp_Description: data.pp_Description || "",
        pp_Language: data.pp_Language || "EN",
        pp_MerchantID: this.config.pp_MerchantID,
        pp_MobileNumber: data.pp_MobileNumber || "",
        pp_Password: this.config.pp_Password,
        pp_TxnCurrency: data.pp_TxnCurrency || "PKR",
        pp_TxnDateTime: data.pp_TxnDateTime || getDateTime(),
        pp_TxnExpiryDateTime: data.pp_TxnExpiryDateTime || getDateTime(3),
        pp_TxnRefNo: data.pp_TxnRefNo || "T" + new Date().getTime(),
        ppmpf_1: data.ppmpf_1 || "",
        ppmpf_2: data.ppmpf_2 || "",
        ppmpf_3: data.ppmpf_3 || "",
        ppmpf_4: data.ppmpf_4 || "",
        ppmpf_5: data.ppmpf_5 || "",
      };
    } else {
      this.catchError("JazzCash is not initialized properly to set data.");
    }
  }

  async createRequest(request) {
    if (this.initialized && !this.error) {
      if (this.createHash(request)) {
        const requestData = {};
        fields[request].forEach((field) => {
          requestData[field] = this.data[field];
        });
        requestData.pp_SecureHash = this.secureHash;

        // Treat 'PAY' the same as the others by making an actual request
        try {
          // Make the HTTP request for all types, including 'PAY'
          const response = await makeRequest(this.url, requestData);
          return response;
        } catch (error) {
          // Handle errors from makeRequest and propagate
          throw new Error(`Request failed: ${error.message}`);
        }
      }
    } else {
      throw new Error("JazzCash is not initialized properly to create request.");
    }
  }

  createHash(request) {
    if (urls[request]) {
      this.url =
        (this.environment === "live" ? this.liveURL : this.sandboxURL) +
        urls[request];

      const hashFields = fields[request];
      let unhashedString = this.config.integritySalt;
      hashFields.forEach((field) => {
        if (this.data[field]) unhashedString += `&${this.data[field]}`;
      });

      this.secureHash = crypto
        .createHmac("SHA256", this.config.integritySalt)
        .update(Buffer.from(unhashedString, "utf-8"))
        .digest("hex");
      return true;
    } else {
      this.catchError("Invalid request type. Try PAY, WALLET, INQUIRY, REFUND.");
      return false;
    }
  }

  catchError(err) {
    this.error = true;
    console.error(err.message || err);
  }
}

module.exports = JazzCash;
