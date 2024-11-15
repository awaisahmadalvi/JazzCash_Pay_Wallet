require('dotenv').config(); // Load environment variables from .env
const JazzCash = require('./JazzCash'); // Import the Jazzcash library

// Set credentials for Jazzcash
const credentials = {
    config: {
        pp_MerchantID: process.env.PP_MERCHANT_ID, // Merchant ID from .env
        pp_Password: process.env.PP_PASSWORD, // Password from .env
        integritySalt: process.env.INTEGRITY_SALT, // Hash Key from .env
    },
    environment: 'sandbox', // Sandbox environment for testing
};

// Unique Transaction Reference Number
const pp_TxnRefNo = "T" + new Date().getTime();

// Test function to run Jazzcash requests
const testJazzCashAPI = async () => {
    try {
        // Initialize Jazzcash with credentials
        const jazzcash = new JazzCash(credentials);

        // // Test Case 1: PAY Request
        // const payRequestData = {
        //     pp_Amount: 1000, // Amount in paisas (e.g., 1000 = PKR 10)
        //     pp_BankID: "",
        //     pp_BillReference: "billRef2023",
        //     pp_Description: "Testing PAY Request",
        //     pp_Language: "EN",
        //     pp_ProductID: "12345",
        //     pp_ReturnURL: "https://example.com/callback",
        //     pp_TxnCurrency: "PKR",
        //     pp_TxnRefNo: pp_TxnRefNo,
        //     pp_TxnDateTime: new Date().toISOString().replace(/[-T:.Z]/g, "").slice(0, 14),
        //     pp_TxnExpiryDateTime: new Date(Date.now() + 3600000).toISOString().replace(/[-T:.Z]/g, "").slice(0, 14), // 1 hour expiry
        //     ppmpf_1: "",
        //     ppmpf_2: "",
        //     ppmpf_3: "",
        //     ppmpf_4: "",
        //     ppmpf_5: "",
        // };

        // jazzcash.setData(payRequestData);
        // console.log("🚀 Sending PAY request...");
        // const payResponse = await jazzcash.createRequest("PAY");
        // console.log("🎉 PAY Response:", payResponse);

        // Test Case 2: WALLET Request
        const walletRequestData = {
            pp_Amount: 500, // Amount in paisas (e.g., 500 = PKR 5)
            pp_BillReference: "billRef2023",
            pp_CNIC: "345678",
            pp_Description: "Testing WALLET Payment",
            pp_Language: "EN",
            pp_MobileNumber: "03123456789",
            pp_TxnCurrency: "PKR",
            pp_TxnRefNo: pp_TxnRefNo,
            ppmpf_1: "",
            ppmpf_2: "",
            ppmpf_3: "",
            ppmpf_4: "",
            ppmpf_5: "",
        };

        jazzcash.setData(walletRequestData);
        console.log("🚀 Sending WALLET request...");
        const walletResponse = await jazzcash.createRequest("WALLET");
        console.log("🎉 WALLET Response:", JSON.parse(walletResponse));

        // Test Case 3: INQUIRY Request
        const inquiryRequestData = { pp_TxnRefNo }; // Only Transaction Ref No is required
        jazzcash.setData(inquiryRequestData);

        console.log("🚀 Sending INQUIRY request...");
        const inquiryResponse = await jazzcash.createRequest("INQUIRY");
        console.log("🎉 INQUIRY Response:", JSON.parse(inquiryResponse));

        // Test Case 4: REFUND Request
        const refundRequestData = {
            pp_Amount: 500, // Amount in paisas (e.g., 500 = PKR 5)
            pp_TxnCurrency: "PKR",
            pp_TxnRefNo: pp_TxnRefNo, // Referring to a previous transaction
            pp_MerchantMPIN: "0000", // Replace with the actual Merchant MPIN
        };

        jazzcash.setData(refundRequestData);
        console.log("🚀 Sending REFUND request...");
        const refundResponse = await jazzcash.createRequest("REFUND");
        console.log("🎉 REFUND Response:", JSON.parse(refundResponse));
    } catch (error) {
        // Error handling
        console.error("❌ Error:", error.message || error);
    }
};

// Execute the test function
testJazzCashAPI();
