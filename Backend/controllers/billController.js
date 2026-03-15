const { db } = require("../firebase/firebaseConfig");
const PDFDocument = require("pdfkit");

/**
 * Helper: Generate Invoice Number Safely
 */
const generateInvoiceNumber = async () => {
    try {
        const snapshot = await db.ref("invoiceCounter").once("value");
        let counter = parseInt(snapshot.val()) || 0;
        counter++;
        await db.ref("invoiceCounter").set(counter);
        
        const year = new Date().getFullYear();
        return `VK-${year}-${String(counter).padStart(4, "0")}`;
    } catch (error) {
        console.error("Counter Error:", error);
        throw new Error("Failed to generate invoice number");
    }
};

/**
 * CREATE BILL & UPDATE STOCK
 */
exports.createBill = async (req, res) => {
    try {
        const { items, gstPercent, customerName, mobile } = req.body;
        
        if (!items || items.length === 0) {
            return res.status(400).json({ error: "Cart is empty" });
        }

        const invoiceNumber = await generateInvoiceNumber();
        let subtotal = 0;

        for (const item of items) {
            const price = parseFloat(item.selling) || 0;
            const qtySold = parseInt(item.qty || item.quantity) || 0;
            subtotal += price * qtySold;

            const productId = item.id || item._id;
            if (productId && qtySold > 0) {
                const productRef = db.ref(`products/${productId}`);
                const productSnap = await productRef.once("value");
                
                if (productSnap.exists()) {
                    const currentStock = parseInt(productSnap.val().stock) || 0;
                    const newStock = Math.max(0, currentStock - qtySold);
                    if (!isNaN(newStock)) {
                        await productRef.update({ stock: newStock });
                    }
                }
            }
        }

        const gstRate = parseFloat(gstPercent) || 0;
        const gstAmount = (subtotal * gstRate) / 100;
        const totalAmount = subtotal + gstAmount;

        const billData = {
            invoiceNumber,
            customerName: customerName || "Cash Sale",
            mobile: mobile || "N/A",
            items: items.map(i => ({
                product: i.product,
                qty: parseInt(i.qty || i.quantity) || 0,
                price: parseFloat(i.selling) || 0
            })),
            subtotal: parseFloat(subtotal.toFixed(2)),
            gstPercent: gstRate,
            gstAmount: parseFloat(gstAmount.toFixed(2)),
            total: parseFloat(totalAmount.toFixed(2)),
            date: new Date().toISOString()
        };

        await db.ref(`bills/${invoiceNumber}`).set(billData);

        res.status(201).json({ 
            message: "Bill created successfully", 
            invoiceId: invoiceNumber, 
            bill: billData 
        });

    } catch (error) {
        console.error("Create Bill Error:", error);
        res.status(500).json({ error: "Server error: " + error.message });
    }
};

/**
 * GENERATE PDF with Full Store Branding
 */
exports.generateBillPDF = async (req, res) => {
    try {
        const invoiceId = req.params.id;
        const snapshot = await db.ref(`bills/${invoiceId}`).once("value");
        const bill = snapshot.val();

        if (!bill) return res.status(404).json({ message: "Bill not found" });

        const doc = new PDFDocument({ margin: 50, size: 'A4' });
        res.setHeader("Content-Type", "application/pdf");
        res.setHeader("Content-Disposition", `inline; filename=${invoiceId}.pdf`);
        doc.pipe(res);

        // --- 1. HEADER SECTION ---
        doc.fillColor("#1e5128").fontSize(22).text("VAIBHAV KRISHI KENDRA", { align: "center", bold: true });
        doc.fillColor("#1e5128").fontSize(12).text("Jay Jawan, Jay Kisan", { align: "center", italic: true });
        doc.moveDown(0.3);

        // --- 2. STORE ADDRESS & PROPRIETOR ---
        doc.fillColor("#000000").fontSize(10);
        doc.text("Manegaon Bazar, Dist: Bhandara - 441924", { align: "center" });
        doc.text("Prop.Pramod Lanjewar | Contact: +91 9766447797", { align: "center" });
        
        doc.moveDown();
        doc.moveTo(50, 130).lineTo(550, 130).stroke("#cccccc");

        // --- 3. CUSTOMER & INVOICE DETAILS ---
        doc.moveDown(2);
        const detailY = 145;
        doc.fontSize(10).text(`Bill To:`, 50, detailY, { bold: true });
        doc.text(`${bill.customerName}`, 50, detailY + 15);
        doc.text(`Mobile: ${bill.mobile}`, 50, detailY + 30);

        doc.text(`Invoice No:`, 400, detailY, { bold: true });
        doc.text(`${bill.invoiceNumber}`, 400, detailY + 15);
        doc.text(`Date: ${new Date(bill.date).toLocaleDateString('en-IN')}`, 400, detailY + 30);

        // --- 4. TABLE HEADER ---
        const tableTop = 210;
        doc.rect(50, tableTop, 500, 20).fill("#1e5128").stroke(); 
        doc.fillColor("#ffffff").text("Product Description", 60, tableTop + 6, { bold: true });
        doc.text("Qty", 300, tableTop + 6, { bold: true });
        doc.text("Rate", 380, tableTop + 6, { bold: true });
        doc.text("Amount", 480, tableTop + 6, { bold: true, align: 'right' });

        // --- 5. TABLE ROWS ---
        let y = 235;
        doc.fillColor("#000000");
        
        bill.items.forEach((item, index) => {
            if (index % 2 === 0) {
                doc.rect(50, y - 5, 500, 20).fill("#f9f9f9").stroke("none");
            }
            doc.fillColor("#000000");
            doc.text(item.product, 60, y);
            doc.text(item.qty.toString(), 300, y);
            doc.text(`Rs. ${item.price.toFixed(2)}`, 380, y);
            doc.text(`Rs. ${(item.price * item.qty).toFixed(2)}`, 480, y, { align: 'right' });
            y += 20;
        });

        // --- 6. TOTALS SECTION ---
        const footerY = Math.max(y + 30, 400); 
        doc.moveTo(350, footerY).lineTo(550, footerY).stroke("#333333");
        
        doc.fontSize(10).text(`Subtotal:`, 350, footerY + 10);
        doc.text(`Rs. ${bill.subtotal.toFixed(2)}`, 480, footerY + 10, { align: 'right' });

        doc.text(`GST (${bill.gstPercent}%):`, 350, footerY + 25);
        doc.text(`Rs. ${bill.gstAmount.toFixed(2)}`, 480, footerY + 25, { align: 'right' });

        doc.rect(350, footerY + 40, 200, 25).fill("#1e5128").stroke();
        doc.fillColor("#ffffff").fontSize(12).text(`GRAND TOTAL:`, 360, footerY + 47, { bold: true });
        doc.text(`Rs. ${bill.total.toFixed(2)}`, 480, footerY + 47, { bold: true, align: 'right' });

        // --- 7. FOOTER & SIGNATURE ---
        doc.fillColor("#444444").fontSize(8).text("Thank you for your business!", 50, 750, { align: "center" });
        doc.text("Computer Generated Invoice - No Signature Required", 50, 762, { align: "center" });
        
        doc.fontSize(10).fillColor("#000000").text("For Vaibhav Krishi Kendra", 400, 715, { align: "right" });
        doc.text("Authorized Signatory", 400, 755, { align: "right" });
        doc.moveTo(400, 750).lineTo(530, 750).stroke("#000000");

        doc.end();
    } catch (error) {
        console.error("PDF Gen Error:", error);
        res.status(500).json({ error: error.message });
    }
};

exports.getAllBills = async (req, res) => {
    try {
        const snapshot = await db.ref("bills").once("value");
        res.status(200).json(snapshot.val() || {});
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};