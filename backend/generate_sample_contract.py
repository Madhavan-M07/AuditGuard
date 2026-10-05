from reportlab.lib.pagesizes import letter
from reportlab.pdfgen import canvas

def create_sample_contract(filename="sample_vendor_contract.pdf"):
    c = canvas.Canvas(filename, pagesize=letter)
    width, height = letter

    # --- PAGE 1: Master Services Agreement & Confidentiality ---
    c.setFont("Helvetica-Bold", 16)
    c.drawString(50, 750, "MASTER SERVICES AGREEMENT (VENDOR SERVICES)")
    c.setFont("Helvetica", 10)
    c.drawString(50, 730, "Document Ref: VEND-SEC-2026-004 | Classification: Confidential")
    c.line(50, 720, 550, 720)

    c.setFont("Helvetica-Bold", 12)
    c.drawString(50, 690, "Section 1: Parties and Effective Date")
    c.setFont("Helvetica", 10)
    c.drawString(50, 670, "This Agreement is entered into between Enterprise Corp ('Customer') and CloudTech Inc ('Vendor').")

    c.setFont("Helvetica-Bold", 12)
    c.drawString(50, 630, "Section 2: Confidentiality & Proprietary Data")
    c.setFont("Helvetica", 10)
    c.drawString(50, 610, "Each party agrees to safeguard confidential data using reasonable standard commercial measures.")
    c.drawString(50, 595, "Confidentiality obligations shall survive for a period of three (3) years post termination.")

    c.setFont("Helvetica-Bold", 12)
    c.drawString(50, 550, "Section 3: Data Security & Encryption Standards")
    c.setFont("Helvetica", 10)
    # [FLAW]: Uses unencrypted storage for internal backup
    c.drawString(50, 530, "Vendor will implement SSL/TLS encryption for all data in transit across public networks.")
    c.drawString(50, 515, "Customer acknowledges that secondary internal backup snapshots are stored unencrypted.")

    c.setFont("Helvetica-Oblique", 9)
    c.drawString(50, 50, "Page 1 of 2 - Confidential Master Services Agreement")
    c.showPage() # Ends Page 1

    # --- PAGE 2: Breach Notification & Liability ---
    c.setFont("Helvetica-Bold", 14)
    c.drawString(50, 750, "MASTER SERVICES AGREEMENT (CONTINUED)")
    c.line(50, 740, 550, 740)

    c.setFont("Helvetica-Bold", 12)
    c.drawString(50, 700, "Section 4: Data Breach Notification & Incident Response")
    c.setFont("Helvetica", 10)
    # [FLAW]: 45 days notification (Enterprise compliance requires 24 to 72 hours!)
    c.drawString(50, 680, "In the event of a confirmed security incident or unauthorized access to Customer PII,")
    c.drawString(50, 665, "Vendor shall provide written notification to Customer within forty-five (45) business days.")

    c.setFont("Helvetica-Bold", 12)
    c.drawString(50, 620, "Section 5: Limitation of Liability")
    c.setFont("Helvetica", 10)
    # [FLAW]: Ridiculously low liability cap of $100
    c.drawString(50, 600, "In no event shall Vendor's total cumulative liability under this agreement exceed $100 USD,")
    c.drawString(50, 585, "regardless of whether the breach involves gross negligence, willful misconduct, or data loss.")

    c.setFont("Helvetica-Bold", 12)
    c.drawString(50, 540, "Section 6: Governing Law and Dispute Resolution")
    c.setFont("Helvetica", 10)
    c.drawString(50, 520, "This Agreement shall be construed and governed by the laws of the State of Delaware, USA.")

    c.setFont("Helvetica-Oblique", 9)
    c.drawString(50, 50, "Page 2 of 2 - Confidential Master Services Agreement")
    c.showPage() # Ends Page 2

    c.save()
    print(f"✅ Generated realistic audit contract: '{filename}'")

if __name__ == "__main__":
    create_sample_contract()
