import { File, FileText, Image, FileSpreadsheet } from "lucide-react";

export interface MockFile {
  id: string;
  name: string;
  type: "pdf" | "image" | "docx" | "spreadsheet";
  size: string;
  uploadDate: string;
  tags: { name: string; confidence: number }[];
  summary: string;
  expiryDate?: string;
  extractedText: string;
  aiDescription: string;
  versions: number;
  lastAccessed: string;
  fileUrl?: string;
}

export const mockFiles: MockFile[] = [
  {
    id: "1",
    name: "Health_Insurance_Policy_2025.pdf",
    type: "pdf",
    size: "2.4 MB",
    uploadDate: "2025-01-15",
    tags: [
      { name: "Insurance", confidence: 0.96 },
      { name: "Health", confidence: 0.92 },
      { name: "Personal", confidence: 0.88 },
    ],
    summary: "Health insurance policy document for the year 2025. Coverage includes hospitalization, outpatient care, and dental. Policy holder: John Smith. Premium: $450/month.",
    expiryDate: "2026-03-15",
    extractedText: "Policy Number: HI-2025-78432. Effective Date: January 1, 2025...",
    aiDescription: "Annual health insurance policy with comprehensive coverage",
    versions: 2,
    lastAccessed: "2025-02-28",
  },
  {
    id: "2",
    name: "Q4_Financial_Report.pdf",
    type: "pdf",
    size: "5.1 MB",
    uploadDate: "2025-02-01",
    tags: [
      { name: "Invoice", confidence: 0.89 },
      { name: "Work", confidence: 0.94 },
      { name: "Finance", confidence: 0.97 },
    ],
    summary: "Quarterly financial report for Q4 2024. Total revenue: $2.3M. Net profit margin: 18.5%. Year-over-year growth: 12%.",
    extractedText: "QUARTERLY FINANCIAL REPORT - Q4 2024...",
    aiDescription: "Financial report showing strong Q4 performance",
    versions: 3,
    lastAccessed: "2025-03-01",
  },
  {
    id: "3",
    name: "Passport_Scan.jpg",
    type: "image",
    size: "1.8 MB",
    uploadDate: "2025-01-20",
    tags: [
      { name: "Travel", confidence: 0.95 },
      { name: "Personal", confidence: 0.98 },
      { name: "ID Document", confidence: 0.91 },
    ],
    summary: "Scanned passport image. Document type: Passport. Country: United States. Expiry detected via OCR.",
    expiryDate: "2026-06-20",
    extractedText: "UNITED STATES OF AMERICA - PASSPORT...",
    aiDescription: "US Passport scan with OCR-extracted details",
    versions: 1,
    lastAccessed: "2025-02-15",
  },
  {
    id: "4",
    name: "Vendor_Contract_2025.docx",
    type: "docx",
    size: "890 KB",
    uploadDate: "2025-02-10",
    tags: [
      { name: "Contract", confidence: 0.97 },
      { name: "Work", confidence: 0.93 },
      { name: "Legal", confidence: 0.88 },
    ],
    summary: "Vendor services agreement for cloud infrastructure. Contract value: $120,000/year. Auto-renewal clause included. Notice period: 60 days.",
    expiryDate: "2026-02-10",
    extractedText: "MASTER SERVICES AGREEMENT - This agreement is entered into...",
    aiDescription: "Annual vendor contract for cloud infrastructure services",
    versions: 4,
    lastAccessed: "2025-02-25",
  },
  {
    id: "5",
    name: "Team_Photo_Offsite.png",
    type: "image",
    size: "4.2 MB",
    uploadDate: "2025-02-20",
    tags: [
      { name: "Work", confidence: 0.85 },
      { name: "Personal", confidence: 0.72 },
    ],
    summary: "Group photo from the February 2025 team offsite in Denver. 12 people detected. Outdoor setting with mountain background.",
    extractedText: "",
    aiDescription: "Team offsite group photo - outdoor mountain setting",
    versions: 1,
    lastAccessed: "2025-02-22",
  },
  {
    id: "6",
    name: "Tax_Return_2024.pdf",
    type: "pdf",
    size: "3.6 MB",
    uploadDate: "2025-01-30",
    tags: [
      { name: "Finance", confidence: 0.96 },
      { name: "Personal", confidence: 0.94 },
      { name: "Tax", confidence: 0.99 },
    ],
    summary: "Federal tax return for fiscal year 2024. Filing status: Single. Adjusted gross income: $95,000. Refund amount: $2,340.",
    expiryDate: "2026-04-15",
    extractedText: "Form 1040 - U.S. Individual Income Tax Return...",
    aiDescription: "2024 federal tax return with refund details",
    versions: 1,
    lastAccessed: "2025-02-10",
  },
  {
    id: "7",
    name: "Project_Budget.xlsx",
    type: "spreadsheet",
    size: "1.2 MB",
    uploadDate: "2025-02-25",
    tags: [
      { name: "Work", confidence: 0.95 },
      { name: "Finance", confidence: 0.90 },
    ],
    summary: "Project budget spreadsheet for Q1 2025. Total budget: $500,000. Allocated: $380,000. Remaining: $120,000. 14 line items across 3 departments.",
    extractedText: "Department, Category, Amount, Status...",
    aiDescription: "Q1 2025 project budget with departmental breakdown",
    versions: 5,
    lastAccessed: "2025-03-01",
  },
  {
    id: "8",
    name: "Car_Insurance_Renewal.pdf",
    type: "pdf",
    size: "1.1 MB",
    uploadDate: "2025-02-05",
    tags: [
      { name: "Insurance", confidence: 0.97 },
      { name: "Personal", confidence: 0.90 },
    ],
    summary: "Auto insurance renewal notice. Vehicle: 2023 Honda Civic. Coverage: Comprehensive. Annual premium: $1,200. Renewal deadline approaching.",
    expiryDate: "2025-03-10",
    extractedText: "RENEWAL NOTICE - Auto Insurance Policy...",
    aiDescription: "Car insurance renewal with upcoming deadline",
    versions: 1,
    lastAccessed: "2025-02-28",
  },
];

export const getFileIcon = (type: MockFile["type"]) => {
  switch (type) {
    case "pdf": return FileText;
    case "image": return Image;
    case "docx": return File;
    case "spreadsheet": return FileSpreadsheet;
    default: return File;
  }
};

export const getFileColor = (type: MockFile["type"]) => {
  switch (type) {
    case "pdf": return "text-destructive";
    case "image": return "text-success";
    case "docx": return "text-info";
    case "spreadsheet": return "text-warning";
    default: return "text-muted-foreground";
  }
};

export const tagColors: Record<string, string> = {
  Insurance: "bg-accent/20 text-accent",
  Health: "bg-success/20 text-success",
  Personal: "bg-info/20 text-info",
  Invoice: "bg-warning/20 text-warning",
  Work: "bg-primary/20 text-primary",
  Finance: "bg-warning/20 text-warning",
  Travel: "bg-success/20 text-success",
  "ID Document": "bg-destructive/20 text-destructive",
  Contract: "bg-accent/20 text-accent",
  Legal: "bg-destructive/20 text-destructive",
  Tax: "bg-warning/20 text-warning",
};
