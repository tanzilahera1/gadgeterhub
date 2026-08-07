// src/app/(admin)/admin/orders/[id]/invoice/InvoiceClient.tsx
"use client";

import type { IOrderSerializable } from "@/types/order";
import {
  WhatsAppIcon,
  FacebookIcon,
} from "@/socialCustomSVGIcon/SocialCustomSVGIcon";
import { Phone } from "lucide-react";


import "@/styles/invoice.css";
import { InvoiceQR } from "@/components/admin/InvoiceQR";
import { getZoneBadgeInfo } from "@/lib/shipping";

interface Props {
  order: IOrderSerializable;
}

function nWords(n: number): string {
  return n.toLocaleString("bn-BD");
}


export function InvoiceClient({ order }: Props) {
  const dateStr = new Date(order.createdAt).toLocaleString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });

  const totalItems = order.items.reduce((s, i) => s + i.itemQuantity, 0);

  const payLabel = order.paymentMethod === "cod" ? "COD" : "Paid";

  const shipping = order.shipping;

  const rawParts = [
    shipping.addressLine1,
    shipping.addressLine2,
    shipping.city,
    shipping.district,
  ].filter(Boolean) as string[];

  // Determine Zone Code and Full Name from 3-Zone Engine
  const zoneBadge = getZoneBadgeInfo(shipping, order.shippingCost);
  const zoneCode = zoneBadge.label.split(" ")[0]; // "ISD", "SUB", "OSD"
  const zoneFullName = zoneBadge.label.replace(/^[A-Z]+\s*\((.*)\)$/, "$1"); // "Inside Dhaka", "Suburbs", "Outside Dhaka"

  // Clean address (remove zone names from address text)
  const cleanAddressParts = rawParts.filter(
    (p) => !/suburbs|suburb|outside dhaka|inside dhaka|^dhaka$/i.test(p.trim())
  );

  const streetAddress =
    cleanAddressParts.join(", ") +
    (shipping.postalCode ? ` - ${shipping.postalCode}` : "");

  // ✅ Option 1: Full Unique Order ID as Invoice Number (e.g. GH-FBP-260731-0002)
  const invoiceNo = order.orderNumber;

  const handlePrint = () => {
    const prevTitle = document.title;
    document.title = `Invoice-${order.orderNumber}`;
    window.print();
    // Restore after print dialog closes
    setTimeout(() => { document.title = prevTitle; }, 1000);
  };

  return (
    <>
      {/* Toolbar */}
      <div className="invoice-toolbar no-print">
        <button onClick={() => window.history.back()}>← Back</button>
        <button className="primary" onClick={handlePrint}>
          🖨 Print / Save PDF
        </button>
      </div>

      {/* Tip */}
      <div
        className="no-print"
        style={{
          maxWidth: "148mm",
          margin: "0 auto 8px",
          padding: "8px 12px",
          background: "#fff7ed",
          border: "1px solid #fed7aa",
          borderRadius: "6px",
          fontSize: "12px",
          color: "#9a3412",
        }}
      >
        💡 <strong>Tip:</strong> Print dialog-এ Paper size{" "}
        <strong>A5</strong>, Margins <strong>None</strong>, Background graphics{" "}
      </div>

      {/* Invoice Wrapper (for mobile screenshot scaling) */}
      <div className="invoice-wrapper">
        <div className="invoice-page">
        {/* WATERMARK */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/logo.svg"
          alt=""
          className="invoice-watermark"
          aria-hidden="true"
        />

        {/* CONTENT */}
        <div className="invoice-content">
          {/* HEADER */}
          <div className="invoice-header">
            {/* ✅ QR Code — top-RIGHT (Moved inside header for alignment) */}
            <div className="invoice-qr">
              <InvoiceQR value="https://gadgeterhub.vercel.app" size={76} />
              <div className="invoice-qr-label">Visit Us</div>
            </div>

            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/logo.svg"
              alt=""
              className="invoice-logo"
              width={64}
              height={64}
            />
            <div className="invoice-header-text">
              <p className="invoice-store-name">GadgeterHub</p>
              <p className="invoice-store-address">
                5C(5th floor), 92/1, Motijheel C/A, Dhaka-1000
              </p>
              <p className="invoice-store-contact">
                <span className="contact-item">
                  <Phone className="icon-phone" />
                  Mobile
                </span>
                <span>&amp;</span>
                <span className="contact-item">
                  <WhatsAppIcon className="icon-wa" />
                  WhatsApp
                </span>
                <span>: 01568390014</span>
              </p>
            </div>
          </div>

          {/* INFO GRID */}
          <section className="invoice-info-grid !py-10">
            <div className="invoice-info-col">
              <h2 className="invoice-section-title">Order Info</h2>
              <div className="invoice-info-row">
                <span className="invoice-label">Order ID:</span>{" "}
                {order.orderNumber}
              </div>
              <div className="invoice-info-row">
                <span className="invoice-label">Placed:</span> {dateStr}
              </div>
              <div className="invoice-info-row">
                <span className="invoice-label">Payment Method:</span>{" "}
                <span className="highlight-yellow">{payLabel}</span>
              </div>
              <div className="invoice-info-row">
                <span className="invoice-label">Total Product:</span>{" "}
                {order.items.length}
              </div>
              <div className="invoice-info-row">
                <span className="invoice-label">Total Items:</span> {totalItems}
              </div>
            </div>

            <div className="invoice-info-col">
              <h2 className="invoice-section-title">Delivery Address</h2>
              <div className="invoice-info-row">
                <span className="invoice-label">Name:</span> {shipping.name}
              </div>
              <div className="invoice-info-row">
                <span className="invoice-label">Address:</span>{" "}
                <span className="highlight-yellow">{streetAddress}</span>
              </div>
              <div className="invoice-info-row">
                <span className="invoice-label">Zone:</span>{" "}
                <span className="highlight-yellow">{zoneCode}</span> ({zoneFullName})
              </div>
              <div className="invoice-info-row">
                <span className="invoice-label">Phone:</span>{" "}
                <span className="highlight-yellow">{shipping.phone}</span>
              </div>
            </div>
          </section>

          {/* ITEMS TABLE */}
          <table className="invoice-table">
            <thead>
              <tr>
                <th className="col-sn">SN</th>
                <th className="col-product">Product</th>
                <th className="col-qty">Quantity</th>
                <th className="col-unit">Unit Price</th>
                <th className="col-price">Price</th>
              </tr>
            </thead>
            <tbody>
              {order.items.map((item, idx) => (
                <tr key={idx}>
                  <td className="col-sn">{idx + 1}</td>
                  <td className="col-product">
                    {item.productTitle}
                    {(item.color || item.size) && (
                      <span style={{ fontWeight: "normal", color: "#555", marginLeft: "4px" }}>
                        ({[item.color, item.size].filter(Boolean).join(", ")})
                      </span>
                    )}
                  </td>
                  <td className="col-qty">{item.itemQuantity}</td>
                  <td className="col-unit">{item.unitPrice}</td>
                  <td className="col-price">
                    {item.unitPrice * item.itemQuantity}
                  </td>
                </tr>
              ))}

              {(() => {
                const vipDeduction = (order.vipPrivilege && order.vipPrivilege > 0) ? order.vipPrivilege : (order.discount || 0);
                let rowCount = 4; // Subtotal, Shipping, Total, Customer Payable
                if (vipDeduction > 0) rowCount++;
                if (order.advancePaid && order.advancePaid > 0) rowCount++;

                return (
                  <>
                    <tr>
                      <td colSpan={2} rowSpan={rowCount} />
                      <td colSpan={2} className="summary-label">
                        Subtotal
                      </td>
                      <td className="summary-value">{order.subtotal}</td>
                    </tr>
                    {vipDeduction > 0 && (
                      <tr>
                        <td colSpan={2} className="summary-label highlight-yellow" style={{ color: "#d97706" }}>
                          VIP Privilege
                        </td>
                        <td className="summary-value highlight-yellow" style={{ color: "#d97706" }}>
                          -{vipDeduction}
                        </td>
                      </tr>
                    )}
                    {Boolean(order.advancePaid && order.advancePaid > 0) && (
                      <tr>
                        <td colSpan={2} className="summary-label">
                          Advance Paid
                        </td>
                        <td className="summary-value">-{order.advancePaid}</td>
                      </tr>
                    )}
                    <tr>
                      <td colSpan={2} className="summary-label">
                        Delevary Charge
                      </td>
                      <td className="summary-value">{order.shippingCost}</td>
                    </tr>
                    <tr>
                      <td colSpan={2} className="summary-label">
                        Total
                      </td>
                      <td className="summary-value">{order.total}</td>
                    </tr>
                    <tr className="payable-row">
                      <td colSpan={2} className="summary-label highlight-yellow">
                        {order.advancePaid && order.advancePaid > 0 ? "Net COD Payable" : "Customer Payable"}
                      </td>
                      <td className="summary-value highlight-yellow">
                        {Math.max(0, order.total - (order.advancePaid || 0))}
                      </td>
                    </tr>
                  </>
                );
              })()}
            </tbody>
          </table>

          <p className="invoice-words">
            কথায়: {nWords(Math.max(0, order.total - (order.advancePaid || 0)))} টাকা মাত্র।
          </p>

          {order.customerNotes && (
            <p className="invoice-customer-note">
              📝 Customer Note: {order.customerNotes}
            </p>
          )}
        </div>

        {/* FOOTER */}
        <div className="invoice-footer">
          <p className="invoice-footer-thanks">
            Thank you for shopping with GadgeterHub!
          </p>
          <p className="invoice-footer-subtitle">
            আপনার আস্থার জন্য আমরা কৃতজ্ঞ।🎉
          </p>

          <div className="invoice-footer-links">
            <span className="invoice-footer-link">
              🌐 www.gadgeterhub.com
            </span>
            <span className="invoice-footer-divider">|</span>
            <span className="invoice-footer-link">
              <FacebookIcon />
              www.facebook.com/gadgeterhub
            </span>
          </div>
        </div>
      </div>
      </div>
    </>
  );
}