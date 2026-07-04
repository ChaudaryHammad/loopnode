import type { PaymentDetailRow } from "@/lib/payment-methods";
import type { PaymentMethodDisplayStyle } from "@prisma/client";

export type PaymentMethodTemplateId = "card" | "bank" | "wallet" | "plain";

export type PaymentMethodTemplate = {
  id: PaymentMethodTemplateId;
  label: string;
  description: string;
  displayStyle: PaymentMethodDisplayStyle;
  defaultLabel: string;
  defaultTagline: string;
  defaultDetails: PaymentDetailRow[];
};

export const PAYMENT_METHOD_TEMPLATES: PaymentMethodTemplate[] = [
  {
    id: "card",
    label: "Payment card",
    description: "Styled card — good for Payoneer, PayPal, or a single pay-to address",
    displayStyle: "CARD",
    defaultLabel: "Payoneer",
    defaultTagline: "Send payment in USD and save your transaction ID",
    defaultDetails: [
      { key: "Pay to", value: "" },
      { key: "Note", value: "Include your LoopNode email" },
    ],
  },
  {
    id: "bank",
    label: "Bank account",
    description: "Plain list — account name, bank, IBAN, etc.",
    displayStyle: "PLAIN",
    defaultLabel: "Bank transfer",
    defaultTagline: "Wire or local transfer",
    defaultDetails: [
      { key: "Account name", value: "" },
      { key: "Bank", value: "" },
      { key: "IBAN / Account", value: "" },
    ],
  },
  {
    id: "wallet",
    label: "Mobile wallet",
    description: "Card style — wallet number and account title",
    displayStyle: "CARD",
    defaultLabel: "Easypaisa",
    defaultTagline: "Send the plan amount and save the transaction ID",
    defaultDetails: [
      { key: "Wallet number", value: "" },
      { key: "Account title", value: "" },
    ],
  },
  {
    id: "plain",
    label: "Plain details",
    description: "Simple key-value rows — add any fields you need",
    displayStyle: "PLAIN",
    defaultLabel: "",
    defaultTagline: "",
    defaultDetails: [{ key: "", value: "" }],
  },
];

export function getPaymentMethodTemplate(id: PaymentMethodTemplateId) {
  return PAYMENT_METHOD_TEMPLATES.find((t) => t.id === id);
}
